import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import {
  apiErrorResponse,
  extractSettingsFromSnapshot,
  getSiteBySlug,
  parseOptionalUuid,
  requireSiteRole,
} from "@/lib/site-versions";
import { sendRequestPublishEmail } from "@/lib/request-publish-notifier";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestPublishReminderBody = {
  userId?: string;
  note?: string;
};

const REQUEST_REMINDER_COOLDOWN_MINUTES = 30;

function minutesSince(iso: string | null | undefined) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
  return (Date.now() - timestamp) / 1000 / 60;
}

function minutesUntilCooldown(iso: string | null | undefined, cooldownMinutes: number) {
  const elapsed = minutesSince(iso);
  if (!Number.isFinite(elapsed)) return 0;
  return Math.max(0, Math.ceil(cooldownMinutes - elapsed));
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPublishReminderBody;
    const userId = parseOptionalUuid(body.userId ?? request.headers.get("x-user-id"));
    if (!userId) {
      return NextResponse.json({ error: "Missing userId (body.userId or x-user-id header)" }, { status: 400 });
    }

    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
    const supabase = createAdminSupabaseClient();
    const site = await getSiteBySlug(supabase, slug);
    const role = await requireSiteRole(supabase, site.id, userId, ["owner", "admin", "editor"]);

    const { data: latestDraft, error: draftError } = await supabase
      .from("site_versions")
      .select(
        "id, version_number, snapshot, publish_requested_at, publish_requested_by, publish_request_note, publish_notified_at",
      )
      .eq("site_id", site.id)
      .eq("status", "draft")
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftError) {
      return NextResponse.json({ error: "Unable to fetch draft version", details: draftError.message }, { status: 500 });
    }
    if (!latestDraft) {
      return NextResponse.json({ error: "No draft version found to send reminder" }, { status: 404 });
    }
    if (!latestDraft.publish_requested_at) {
      return NextResponse.json(
        {
          error: "No active publish request for this draft",
          site: { slug: site.slug, name: site.name },
          request: {
            active: false,
            requestedAt: null,
            notifiedAt: latestDraft.publish_notified_at ?? null,
            cooldownActive: false,
            cooldownMinutes: REQUEST_REMINDER_COOLDOWN_MINUTES,
            retryAfterMinutes: 0,
          },
        },
        { status: 409 },
      );
    }

    const retryAfterMinutes = minutesUntilCooldown(
      latestDraft.publish_notified_at,
      REQUEST_REMINDER_COOLDOWN_MINUTES,
    );
    if (retryAfterMinutes > 0) {
      return NextResponse.json(
        {
          site: { slug: site.slug, name: site.name },
          request: {
            active: true,
            requestedAt: latestDraft.publish_requested_at,
            requestedBy: latestDraft.publish_requested_by,
            note: latestDraft.publish_request_note ?? null,
            notifiedAt: latestDraft.publish_notified_at ?? null,
            emailSent: false,
            emailReason: "cooldown_active",
            cooldownActive: true,
            cooldownMinutes: REQUEST_REMINDER_COOLDOWN_MINUTES,
            retryAfterMinutes,
          },
          actorRole: role,
          message: "Cooldown activo para reenvío de recordatorio.",
        },
        { status: 200 },
      );
    }

    const { data: recipientsRows, error: recipientsError } = await supabase
      .from("site_memberships")
      .select("user_id, role")
      .eq("site_id", site.id)
      .in("role", ["owner", "admin"]);

    if (recipientsError) {
      return NextResponse.json({ error: "Unable to find owner/admin recipients", details: recipientsError.message }, { status: 500 });
    }

    const recipientIds = (recipientsRows ?? []).map((row) => row.user_id);
    let recipientEmails: string[] = [];
    if (recipientIds.length > 0) {
      const { data: usersRows, error: usersError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (usersError) {
        return NextResponse.json({ error: "Unable to load recipient emails", details: usersError.message }, { status: 500 });
      }
      const wanted = new Set(recipientIds);
      recipientEmails = (usersRows.users ?? [])
        .filter((user) => wanted.has(user.id) && typeof user.email === "string" && user.email.trim())
        .map((user) => user.email as string);
    }

    const parsedSettings = extractSettingsFromSnapshot(latestDraft.snapshot as Record<string, unknown> | null);
    const heroTitle =
      typeof parsedSettings?.content?.sections?.find((section) => section.id === "hero")?.data?.title === "string"
        ? (parsedSettings?.content?.sections?.find((section) => section.id === "hero")?.data?.title as string)
        : null;

    const emailResult = await sendRequestPublishEmail({
      recipients: recipientEmails,
      siteSlug: site.slug,
      requestedByUserId: userId,
      requestedAtIso: latestDraft.publish_requested_at,
      note: note || latestDraft.publish_request_note || null,
      heroTitle,
    });

    let notifiedAtIso = latestDraft.publish_notified_at ?? null;
    if (emailResult.sent) {
      notifiedAtIso = new Date().toISOString();
      await supabase
        .from("site_versions")
        .update({ publish_notified_at: notifiedAtIso })
        .eq("id", latestDraft.id);
    }

    return NextResponse.json(
      {
        site: { slug: site.slug, name: site.name },
        request: {
          active: true,
          requestedAt: latestDraft.publish_requested_at,
          requestedBy: latestDraft.publish_requested_by,
          note: note || latestDraft.publish_request_note || null,
          notifiedAt: notifiedAtIso,
          emailSent: emailResult.sent,
          emailReason: emailResult.reason ?? null,
          cooldownActive: emailResult.sent,
          cooldownMinutes: REQUEST_REMINDER_COOLDOWN_MINUTES,
          retryAfterMinutes: emailResult.sent ? REQUEST_REMINDER_COOLDOWN_MINUTES : 0,
        },
        version: {
          id: latestDraft.id,
          number: latestDraft.version_number,
        },
        actorRole: role,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  } catch (error) {
    const { status, body } = apiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
