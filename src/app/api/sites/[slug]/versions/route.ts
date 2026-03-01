import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { apiErrorResponse, getSiteBySlug, parseOptionalUuid, requireSiteRole } from "@/lib/site-versions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const userId = parseOptionalUuid(url.searchParams.get("userId") ?? request.headers.get("x-user-id"));

    if (!userId) {
      return NextResponse.json({ error: "Missing userId (query userId or x-user-id header)" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const site = await getSiteBySlug(supabase, slug);
    const role = await requireSiteRole(supabase, site.id, userId, ["owner", "admin", "editor", "viewer"]);

    const primaryQuery = await supabase
      .from("site_versions")
      .select(
        "id, version_number, status, created_at, updated_at, published_at, notes, publish_requested_at, publish_requested_by, publish_request_note, publish_notified_at",
      )
      .eq("site_id", site.id)
      .order("version_number", { ascending: false });

    let data = primaryQuery.data as Array<Record<string, unknown>> | null;
    let error = primaryQuery.error;

    if (error && "code" in error && error.code === "42703") {
      const fallbackQuery = await supabase
        .from("site_versions")
        .select("id, version_number, status, created_at, published_at, notes")
        .eq("site_id", site.id)
        .order("version_number", { ascending: false });
      data = (fallbackQuery.data as Array<Record<string, unknown>> | null)?.map((row) => ({
        ...row,
        publish_requested_at: null,
        publish_requested_by: null,
        publish_request_note: null,
        publish_notified_at: null,
      })) ?? null;
      error = fallbackQuery.error;
    }

    if (error) {
      return NextResponse.json({ error: "Unable to fetch versions", details: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        site: {
          slug: site.slug,
          name: site.name,
        },
        membership: {
          userId,
          role,
          permissions: {
            canSaveDraft: ["owner", "admin", "editor"].includes(role),
            canPublish: ["owner", "admin"].includes(role),
            canRollback: ["owner", "admin"].includes(role),
            canRequestPublish: ["owner", "admin", "editor"].includes(role),
            readOnly: role === "viewer",
          },
        },
        versions: data ?? [],
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
