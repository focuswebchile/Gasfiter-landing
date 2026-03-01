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

type RequestPublishBody = {
  userId?: string;
  note?: string;
};

const EMAIL_COOLDOWN_MINUTES = 10;

function minutesSince(iso: string | null | undefined) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
  return (Date.now() - timestamp) / 1000 / 60;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPublishBody;
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
      return NextResponse.json({ error: "No draft version found to request publish" }, { status: 404 });
    }

    if (latestDraft.publish_requested_at) {
      return NextResponse.json(
        {
          site: { slug: site.slug, name: site.name },
          request: {
            active: true,
            alreadyRequested: true,
            requestedAt: latestDraft.publish_requested_at,
            requestedBy: latestDraft.publish_requested_by,
            note: latestDraft.publish_request_note ?? null,
            notifiedAt: latestDraft.publish_notified_at ?? null,
            cooldownActive: minutesSince(latestDraft.publish_notified_at) < EMAIL_COOLDOWN_MINUTES,
          },
          message: "Ya existe una solicitud de publicación activa para este borrador.",
        },
        { status: 200 },
      );
    }

    const requestedAt = new Date().toISOString();
    const { data: updatedDraft, error: updateError } = await supabase
      .from("site_versions")
      .update({
        publish_requested_at: requestedAt,
        publish_requested_by: userId,
        publish_request_note: note || null,
      })
      .eq("id", latestDraft.id)
      .is("publish_requested_at", null)
      .select(
        "id, version_number, snapshot, publish_requested_at, publish_requested_by, publish_request_note, publish_notified_at",
      )
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: "Unable to store publish request", details: updateError.message }, { status: 500 });
    }

    const effectiveDraft = updatedDraft ?? latestDraft;
    if (!effectiveDraft.publish_requested_at) {
      return NextResponse.json(
        {
          site: { slug: site.slug, name: site.name },
          request: {
            active: true,
            alreadyRequested: true,
            requestedAt: latestDraft.publish_requested_at,
            requestedBy: latestDraft.publish_requested_by,
            note: latestDraft.publish_request_note ?? null,
            notifiedAt: latestDraft.publish_notified_at ?? null,
            cooldownActive: minutesSince(latestDraft.publish_notified_at) < EMAIL_COOLDOWN_MINUTES,
          },
          message: "La solicitud ya estaba activa.",
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

    const parsedSettings = extractSettingsFromSnapshot(effectiveDraft.snapshot as Record<string, unknown> | null);
    const heroTitle =
      typeof parsedSettings?.content?.sections?.find((section) => section.id === "hero")?.data?.title === "string"
        ? (parsedSettings?.content?.sections?.find((section) => section.id === "hero")?.data?.title as string)
        : null;

    const emailResult = await sendRequestPublishEmail({
      recipients: recipientEmails,
      siteSlug: site.slug,
      requestedByUserId: userId,
      requestedAtIso: requestedAt,
      note: note || null,
      heroTitle,
    });

    if (emailResult.sent) {
      await supabase
        .from("site_versions")
        .update({ publish_notified_at: new Date().toISOString() })
        .eq("id", effectiveDraft.id);
    }

    return NextResponse.json(
      {
        site: { slug: site.slug, name: site.name },
        request: {
          active: true,
          alreadyRequested: false,
          requestedAt,
          requestedBy: userId,
          note: note || null,
          notifiedAt: emailResult.sent ? new Date().toISOString() : null,
          emailSent: emailResult.sent,
          emailReason: emailResult.reason ?? null,
        },
        version: {
          id: effectiveDraft.id,
          number: effectiveDraft.version_number,
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

