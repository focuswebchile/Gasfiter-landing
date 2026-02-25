import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import {
  apiErrorResponse,
  extractSettingsFromSnapshot,
  getSiteBySlug,
  parseOptionalUuid,
  requireSiteRole,
} from "@/lib/site-versions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RollbackBody = {
  userId?: string;
  notes?: string;
  versionId?: string;
  versionNumber?: number;
};

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = ((await request.json().catch(() => ({}))) ?? {}) as RollbackBody;
    const userId = parseOptionalUuid(body.userId ?? request.headers.get("x-user-id"));
    if (!userId) {
      return NextResponse.json({ error: "Missing userId (body.userId or x-user-id header)" }, { status: 400 });
    }

    if (!body.versionId && typeof body.versionNumber !== "number") {
      return NextResponse.json(
        { error: "Missing rollback target. Provide versionId or versionNumber" },
        { status: 400 },
      );
    }

    const supabase = createAdminSupabaseClient();
    const site = await getSiteBySlug(supabase, slug);
    await requireSiteRole(supabase, site.id, userId, ["owner", "admin"]);

    let targetQuery = supabase
      .from("site_versions")
      .select("id, version_number, status, snapshot")
      .eq("site_id", site.id);

    if (body.versionId) {
      targetQuery = targetQuery.eq("id", body.versionId);
    } else {
      targetQuery = targetQuery.eq("version_number", body.versionNumber as number);
    }

    const { data: target, error: targetError } = await targetQuery.maybeSingle();
    if (targetError) {
      return NextResponse.json({ error: "Unable to fetch rollback target", details: targetError.message }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json({ error: "Rollback target version not found" }, { status: 404 });
    }

    const { error: archiveError } = await supabase
      .from("site_versions")
      .update({ status: "archived", published_at: null })
      .eq("site_id", site.id)
      .eq("status", "published");

    if (archiveError) {
      return NextResponse.json(
        { error: "Unable to archive current published version", details: archiveError.message },
        { status: 500 },
      );
    }

    const { data: rolled, error: rollbackError } = await supabase
      .from("site_versions")
      .insert({
        site_id: site.id,
        version_number: null,
        status: "published",
        snapshot: target.snapshot,
        created_by: userId,
        published_at: new Date().toISOString(),
        notes: body.notes ?? `Rollback to version ${target.version_number}`,
      })
      .select("id, version_number, snapshot")
      .single();

    if (rollbackError) {
      return NextResponse.json({ error: "Unable to rollback", details: rollbackError.message }, { status: 500 });
    }

    const settings = extractSettingsFromSnapshot(rolled.snapshot as Record<string, unknown> | null);
    if (!settings) {
      return NextResponse.json({ error: "Rollback snapshot is invalid" }, { status: 500 });
    }

    return NextResponse.json(
      {
        site: {
          slug: site.slug,
          name: site.name,
          status: "published",
        },
        settings,
        version: {
          id: rolled.id,
          number: rolled.version_number,
          rollbackFrom: target.version_number,
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
