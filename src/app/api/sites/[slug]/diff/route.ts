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

type Mode = "draft" | "published";

type DiffField = {
  path: string;
  label: string;
  from: string;
  to: string;
  changed: boolean;
};

function parseMode(input: string | null): Mode {
  return input?.toLowerCase() === "published" ? "published" : "draft";
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getHeroSectionData(settings: Record<string, unknown> | null): Record<string, unknown> {
  if (!settings || typeof settings !== "object") return {};
  const content = (settings.content ?? {}) as Record<string, unknown>;
  const sections = Array.isArray(content.sections)
    ? (content.sections as Array<Record<string, unknown>>)
    : [];
  const heroSection = sections.find((section) => section?.id === "hero");
  if (heroSection && typeof heroSection.data === "object" && heroSection.data) {
    return heroSection.data as Record<string, unknown>;
  }
  return {};
}

function getHeroLegacy(settings: Record<string, unknown> | null): Record<string, unknown> {
  if (!settings || typeof settings !== "object") return {};
  const content = (settings.content ?? {}) as Record<string, unknown>;
  const hero = (content.hero ?? {}) as Record<string, unknown>;
  return hero && typeof hero === "object" ? hero : {};
}

function readHeroField(settings: Record<string, unknown> | null, key: "title" | "subtitle" | "cta_text" | "cta_url"): string {
  const sectionData = getHeroSectionData(settings);
  const legacy = getHeroLegacy(settings);
  const sectionCta = (sectionData.cta_primary ?? {}) as Record<string, unknown>;
  const legacyCta = (legacy.cta ?? {}) as Record<string, unknown>;

  if (key === "title") return normalizeText(sectionData.title ?? legacy.title);
  if (key === "subtitle") return normalizeText(sectionData.subtitle ?? legacy.subtitle);
  if (key === "cta_text") return normalizeText(sectionCta.text ?? legacyCta.primary_text);
  return normalizeText(sectionCta.url ?? legacyCta.primary_url);
}

async function getLatestByMode(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  siteId: string,
  mode: Mode,
) {
  const { data, error } = await supabase
    .from("site_versions")
    .select("id, version_number, status, snapshot, created_at")
    .eq("site_id", siteId)
    .eq("status", mode)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch ${mode} snapshot: ${error.message}`);
  }

  return data;
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const userId = parseOptionalUuid(url.searchParams.get("userId") ?? request.headers.get("x-user-id"));
    if (!userId) {
      return NextResponse.json({ error: "Missing userId (query userId or x-user-id header)" }, { status: 400 });
    }

    const fromMode = parseMode(url.searchParams.get("from"));
    const toMode = parseMode(url.searchParams.get("to") ?? "published");

    const supabase = createAdminSupabaseClient();
    const site = await getSiteBySlug(supabase, slug);
    await requireSiteRole(supabase, site.id, userId, ["owner", "admin", "editor", "viewer"]);

    const [fromVersion, toVersion] = await Promise.all([
      getLatestByMode(supabase, site.id, fromMode),
      getLatestByMode(supabase, site.id, toMode),
    ]);

    if (!fromVersion) {
      return NextResponse.json({ error: `No ${fromMode} snapshot found` }, { status: 404 });
    }
    if (!toVersion) {
      return NextResponse.json({ error: `No ${toMode} snapshot found` }, { status: 404 });
    }

    const fromSettings = extractSettingsFromSnapshot(fromVersion.snapshot as Record<string, unknown> | null);
    const toSettings = extractSettingsFromSnapshot(toVersion.snapshot as Record<string, unknown> | null);

    if (!fromSettings || !toSettings) {
      return NextResponse.json({ error: "Invalid snapshot format in one or both versions" }, { status: 422 });
    }

    const fields: DiffField[] = [
      {
        path: "hero.title",
        label: "Hero title",
        from: readHeroField(fromSettings as Record<string, unknown>, "title"),
        to: readHeroField(toSettings as Record<string, unknown>, "title"),
        changed: false,
      },
      {
        path: "hero.subtitle",
        label: "Hero subtitle",
        from: readHeroField(fromSettings as Record<string, unknown>, "subtitle"),
        to: readHeroField(toSettings as Record<string, unknown>, "subtitle"),
        changed: false,
      },
      {
        path: "hero.cta_primary.text",
        label: "Hero CTA text",
        from: readHeroField(fromSettings as Record<string, unknown>, "cta_text"),
        to: readHeroField(toSettings as Record<string, unknown>, "cta_text"),
        changed: false,
      },
      {
        path: "hero.cta_primary.url",
        label: "Hero CTA url",
        from: readHeroField(fromSettings as Record<string, unknown>, "cta_url"),
        to: readHeroField(toSettings as Record<string, unknown>, "cta_url"),
        changed: false,
      },
    ].map((field) => ({ ...field, changed: field.from !== field.to }));

    const changedFields = fields.filter((field) => field.changed).length;

    return NextResponse.json(
      {
        site: {
          slug: site.slug,
          name: site.name,
        },
        from: {
          mode: fromMode,
          versionNumber: fromVersion.version_number,
          createdAt: fromVersion.created_at,
        },
        to: {
          mode: toMode,
          versionNumber: toVersion.version_number,
          createdAt: toVersion.created_at,
        },
        summary: {
          changedFields,
          totalFields: fields.length,
          hasChanges: changedFields > 0,
        },
        sections: {
          hero: {
            fields,
          },
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
