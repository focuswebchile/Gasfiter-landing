import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import {
  apiErrorResponse,
  extractSettingsFromSnapshot,
  getSiteBySlug,
  parseOptionalUuid,
  requireSiteRole,
} from "@/lib/site-versions";
import { validatePublishRequirements } from "@/lib/publish-requirements";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublishBody = {
  userId?: string;
  notes?: string;
  draftVersionId?: string;
  draftVersionNumber?: number;
  expectedUpdatedAt?: string | null;
};

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = ((await request.json().catch(() => ({}))) ?? {}) as PublishBody;
    const userId = parseOptionalUuid(body.userId ?? request.headers.get("x-user-id"));
    if (!userId) {
      return NextResponse.json({ error: "Missing userId (body.userId or x-user-id header)" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const site = await getSiteBySlug(supabase, slug);
    await requireSiteRole(supabase, site.id, userId, ["owner", "admin"]);
    const expectedUpdatedAt =
      typeof body.expectedUpdatedAt === "string" && body.expectedUpdatedAt.trim()
        ? body.expectedUpdatedAt.trim()
        : null;

    let draftQuery = supabase
      .from("site_versions")
      .select("*")
      .eq("site_id", site.id)
      .eq("status", "draft");

    if (body.draftVersionId) {
      draftQuery = draftQuery.eq("id", body.draftVersionId);
    } else if (typeof body.draftVersionNumber === "number") {
      draftQuery = draftQuery.eq("version_number", body.draftVersionNumber);
    } else {
      draftQuery = draftQuery.order("version_number", { ascending: false }).limit(1);
    }

    const { data: sourceDraft, error: sourceError } = await draftQuery.maybeSingle();
    if (sourceError) {
      return NextResponse.json({ error: "Unable to fetch draft version", details: sourceError.message }, { status: 500 });
    }
    if (!sourceDraft) {
      if (expectedUpdatedAt !== null) {
        return NextResponse.json(
          {
            error: "DRAFT_OUTDATED",
            message: "El draft fue modificado por otro usuario.",
            serverUpdatedAt: null,
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: "No draft version found to publish" }, { status: 404 });
    }

    const serverUpdatedAt =
      (sourceDraft as { updated_at?: string; created_at?: string }).updated_at ??
      (sourceDraft as { updated_at?: string; created_at?: string }).created_at ??
      null;
    if ((expectedUpdatedAt ?? null) !== (serverUpdatedAt ?? null)) {
      return NextResponse.json(
        {
          error: "DRAFT_OUTDATED",
          message: "El draft fue modificado por otro usuario.",
          serverUpdatedAt,
        },
        { status: 409 },
      );
    }

    const draftSettings = extractSettingsFromSnapshot(sourceDraft.snapshot as Record<string, unknown> | null);
    if (!draftSettings) {
      return NextResponse.json({ error: "Draft snapshot is invalid" }, { status: 422 });
    }

    const requirementIssues = validatePublishRequirements(draftSettings);
    if (requirementIssues.length > 0) {
      return NextResponse.json(
        {
          error: "PUBLISH_VALIDATION_FAILED",
          message: "Completa el contenido mínimo obligatorio antes de publicar.",
          missing: requirementIssues,
        },
        { status: 422 },
      );
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

    const { data: published, error: publishError } = await supabase
      .from("site_versions")
      .insert({
        site_id: site.id,
        version_number: null,
        status: "published",
        snapshot: sourceDraft.snapshot,
        created_by: userId,
        published_at: new Date().toISOString(),
        notes: body.notes ?? `Published from draft v${sourceDraft.version_number}`,
      })
      .select("id, version_number, snapshot")
      .single();

    if (publishError) {
      return NextResponse.json({ error: "Unable to publish draft", details: publishError.message }, { status: 500 });
    }

    const settings = extractSettingsFromSnapshot(published.snapshot as Record<string, unknown> | null);
    if (!settings) {
      return NextResponse.json({ error: "Published snapshot is invalid" }, { status: 500 });
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
          id: published.id,
          number: published.version_number,
          sourceDraftNumber: sourceDraft.version_number,
        },
        draftUpdatedAt: serverUpdatedAt,
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
