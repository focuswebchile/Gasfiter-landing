import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { settingsSchema, type SettingsPayload } from "@/lib/settings-schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DbSection = {
  id: string;
  section_id: string;
  enabled: boolean;
  order: number;
  data: Record<string, unknown> | null;
};

type DbItem = {
  section_ref: string;
  section_id: string;
  enabled: boolean;
  order: number;
  data: Record<string, unknown> | null;
};

const sectionNeedsItems = new Set(["services", "projects", "testimonials", "faq"]);

function normalizeSection(section: DbSection, items: DbItem[]) {
  const data = (section.data ?? {}) as Record<string, unknown>;
  const sectionItems = items
    .filter((item) => item.section_ref === section.id || item.section_id === section.section_id)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      ...(item.data ?? {}),
      enabled: item.enabled,
      order: item.order,
    }));

  const normalizedData = sectionItems.length ? { ...data, items: sectionItems } : data;
  return {
    id: section.section_id,
    enabled: section.enabled,
    order: section.order,
    data: normalizedData,
  };
}

function isRenderable(section: { id: string; enabled: boolean; data: Record<string, unknown> }) {
  if (!section.enabled) return false;
  if (sectionNeedsItems.has(section.id)) {
    const items = Array.isArray(section.data.items) ? section.data.items : [];
    return items.length > 0;
  }
  return true;
}

function buildLegacyFallback(sections: Array<{ id: string; data: Record<string, unknown> }>) {
  const heroData = sections.find((s) => s.id === "hero")?.data ?? {};
  const servicesItems = (sections.find((s) => s.id === "services")?.data?.items ?? []) as Array<
    Record<string, unknown>
  >;
  const faqItems = (sections.find((s) => s.id === "faq")?.data?.items ?? []) as Array<Record<string, unknown>>;

  const hero = {
    title: typeof heroData.title === "string" ? heroData.title : undefined,
    subtitle: typeof heroData.subtitle === "string" ? heroData.subtitle : undefined,
    cta: {
      primary_text:
        typeof (heroData.cta_primary as { text?: unknown } | undefined)?.text === "string"
          ? ((heroData.cta_primary as { text?: string }).text as string)
          : undefined,
      primary_url:
        typeof (heroData.cta_primary as { url?: unknown } | undefined)?.url === "string"
          ? ((heroData.cta_primary as { url?: string }).url as string)
          : undefined,
    },
  };

  const services = servicesItems
    .filter((item) => item.enabled !== false)
    .sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999))
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "",
      description: typeof item.description === "string" ? item.description : "",
    }));

  const faqs = faqItems
    .filter((item) => item.enabled !== false)
    .sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999))
    .map((item) => ({
      question: typeof item.question === "string" ? item.question : "",
      answer: typeof item.answer === "string" ? item.answer : "",
    }));

  return { hero, services, faqs };
}

function withLegacyFromSections(payload: SettingsPayload): SettingsPayload {
  const sections = Array.isArray(payload.content?.sections)
    ? (payload.content?.sections as Array<{ id: string; data: Record<string, unknown> }>)
    : [];
  const legacy = buildLegacyFallback(sections);
  return {
    ...payload,
    content: {
      ...(payload.content ?? {}),
      hero: legacy.hero,
      services: legacy.services,
      faqs: legacy.faqs,
      sections: payload.content?.sections ?? [],
    },
  };
}

function parseMode(input: string | null): "draft" | "published" {
  return input?.toLowerCase() === "draft" ? "draft" : "published";
}

function extractSettingsFromSnapshot(snapshot: Record<string, unknown> | null): SettingsPayload | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const rootSettings = snapshot.settings;
  const candidate =
    rootSettings && typeof rootSettings === "object"
      ? (rootSettings as SettingsPayload)
      : (snapshot as SettingsPayload);

  const parsed = settingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

async function getVersionedSettings(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  siteId: string,
  mode: "draft" | "published",
): Promise<{ payload: SettingsPayload; status: "draft" | "published"; updatedAt: string | null } | null> {
  const { data, error } = await supabase
    .from("site_versions")
    .select("status, snapshot, version_number, updated_at, created_at")
    .eq("site_id", siteId)
    .eq("status", mode)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const message = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
    const tableMissing = error.code === "42P01" || message.includes("site_versions");
    if (tableMissing) return null;
    throw new Error(`Unable to fetch versioned settings: ${error.message}`);
  }

  if (!data) return null;

  const parsed = extractSettingsFromSnapshot(data.snapshot as Record<string, unknown> | null);
  if (!parsed) return null;
  return {
    payload: parsed,
    status: mode,
    updatedAt: (data.updated_at as string | null | undefined) ?? (data.created_at as string | null | undefined) ?? null,
  };
}

async function getLatestDraftUpdatedAt(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  siteId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("site_versions")
    .select("updated_at, created_at, version_number")
    .eq("site_id", siteId)
    .eq("status", "draft")
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const message = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
    const tableMissing = error.code === "42P01" || message.includes("site_versions");
    if (tableMissing) return null;
    throw new Error(`Unable to fetch latest draft timestamp: ${error.message}`);
  }

  if (!data) return null;
  return (data.updated_at as string | null | undefined) ?? (data.created_at as string | null | undefined) ?? null;
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const mode = parseMode(new URL(request.url).searchParams.get("mode"));
    const supabase = createAdminSupabaseClient();

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, slug, name")
      .eq("slug", slug)
      .maybeSingle();

    if (siteError) {
      return NextResponse.json(
        { error: "Unable to fetch site", details: siteError.message },
        { status: 500 },
      );
    }

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const versioned = await getVersionedSettings(supabase, site.id, mode);
    if (versioned) {
      const resolvedDraftUpdatedAt =
        versioned.status === "draft" && !versioned.updatedAt
          ? await getLatestDraftUpdatedAt(supabase, site.id)
          : versioned.status === "draft"
            ? versioned.updatedAt
            : null;

      return NextResponse.json(
        {
          site: {
            slug: site.slug,
            name: site.name,
            status: versioned.status,
          },
          settings: withLegacyFromSections(versioned.payload),
          draftUpdatedAt: resolvedDraftUpdatedAt,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        },
      );
    }

    const [{ data: colors }, { data: typography }, { data: sections }, { data: items }] = await Promise.all([
      supabase.from("colors").select("primary, secondary, background, text").eq("site_id", site.id).single(),
      supabase
        .from("typography")
        .select("font, font_family, base_size, line_height")
        .eq("site_id", site.id)
        .single(),
      supabase
        .from("sections")
        .select("id, section_id, enabled, order, data")
        .eq("site_id", site.id)
        .order("order", { ascending: true }),
      supabase
        .from("items")
        .select("section_ref, section_id, enabled, order, data")
        .eq("site_id", site.id)
        .order("order", { ascending: true }),
    ]);

    const normalizedSections = ((sections ?? []) as DbSection[])
      .map((section) => normalizeSection(section, (items ?? []) as DbItem[]))
      .filter((section) => isRenderable(section as { id: string; enabled: boolean; data: Record<string, unknown> }))
      .sort((a, b) => a.order - b.order);

    const legacy = buildLegacyFallback(normalizedSections as Array<{ id: string; data: Record<string, unknown> }>);

    const payload: SettingsPayload = {
      colors: {
        primary: colors?.primary ?? undefined,
        secondary: colors?.secondary ?? undefined,
        background: colors?.background ?? undefined,
        text: colors?.text ?? undefined,
      },
      typography: {
        font: typography?.font ?? undefined,
        fontFamily: typography?.font_family ?? undefined,
        baseSize: typography?.base_size ?? undefined,
        lineHeight: typography?.line_height ?? undefined,
      },
      content: {
        hero: legacy.hero,
        services: legacy.services,
        faqs: legacy.faqs,
        sections: normalizedSections as SettingsPayload["content"]["sections"],
      },
    };

    const parsed = settingsSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid settings payload",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 422 },
      );
    }

    const fallbackDraftUpdatedAt = mode === "draft" ? await getLatestDraftUpdatedAt(supabase, site.id) : null;

    return NextResponse.json(
      {
        site: {
          slug: site.slug,
          name: site.name,
          status: mode,
        },
        settings: parsed.data,
        draftUpdatedAt: fallbackDraftUpdatedAt,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      { error: "Unable to fetch settings", details: message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  }
}
