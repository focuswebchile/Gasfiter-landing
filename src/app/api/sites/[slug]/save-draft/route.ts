import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { settingsSchema } from "@/lib/settings-schema";
import {
  apiErrorResponse,
  buildSnapshot,
  extractSettingsFromSnapshot,
  getSiteBySlug,
  parseOptionalUuid,
  requireSiteRole,
} from "@/lib/site-versions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SaveDraftBody = {
  userId?: string;
  notes?: string;
  settings?: unknown;
};

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = ((await request.json().catch(() => ({}))) ?? {}) as SaveDraftBody;
    const userId = parseOptionalUuid(body.userId ?? request.headers.get("x-user-id"));
    if (!userId) {
      return NextResponse.json({ error: "Missing userId (body.userId or x-user-id header)" }, { status: 400 });
    }

    const parsedSettings = settingsSchema.safeParse(body.settings);
    if (!parsedSettings.success) {
      return NextResponse.json(
        {
          error: "Invalid settings payload",
          issues: parsedSettings.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 422 },
      );
    }

    const supabase = createAdminSupabaseClient();
    const site = await getSiteBySlug(supabase, slug);
    await requireSiteRole(supabase, site.id, userId, ["owner", "admin", "editor"]);

    const snapshot = buildSnapshot(slug, parsedSettings.data);

    const { data: latestDraft, error: draftError } = await supabase
      .from("site_versions")
      .select("id, version_number, snapshot")
      .eq("site_id", site.id)
      .eq("status", "draft")
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftError) {
      return NextResponse.json({ error: "Unable to fetch latest draft", details: draftError.message }, { status: 500 });
    }

    let persistedVersion: { id: string; version_number: number } | null = null;

    if (latestDraft?.id) {
      const { data, error } = await supabase
        .from("site_versions")
        .update({
          snapshot,
          created_by: userId,
          notes: body.notes ?? "Draft updated",
        })
        .eq("id", latestDraft.id)
        .select("id, version_number")
        .single();

      if (error) {
        return NextResponse.json({ error: "Unable to update draft", details: error.message }, { status: 500 });
      }

      persistedVersion = data;
    } else {
      const { data, error } = await supabase
        .from("site_versions")
        .insert({
          site_id: site.id,
          version_number: null,
          status: "draft",
          snapshot,
          created_by: userId,
          notes: body.notes ?? "Draft created",
        })
        .select("id, version_number")
        .single();

      if (error) {
        return NextResponse.json({ error: "Unable to create draft", details: error.message }, { status: 500 });
      }

      persistedVersion = data;
    }

    const settings = extractSettingsFromSnapshot(snapshot);
    if (!settings) {
      return NextResponse.json({ error: "Unable to parse saved draft snapshot" }, { status: 500 });
    }

    return NextResponse.json(
      {
        site: {
          slug: site.slug,
          name: site.name,
          status: "draft",
        },
        settings,
        version: {
          id: persistedVersion?.id,
          number: persistedVersion?.version_number,
        },
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
