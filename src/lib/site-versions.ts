import type { SupabaseClient } from "@supabase/supabase-js";
import { settingsSchema, type SettingsPayload } from "@/lib/settings-schema";

type AllowedRole = "owner" | "admin" | "editor" | "viewer";

export class ApiRouteError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sectionIdsWithItems = new Set(["services", "projects", "testimonials", "faq"]);

function createItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeSectionItems(data: Record<string, unknown>) {
  const rawItems = Array.isArray(data.items) ? (data.items as Array<Record<string, unknown>>) : [];
  const normalizedItems = rawItems
    .map((item, index) => {
      const order = typeof item.order === "number" && Number.isFinite(item.order) ? item.order : index + 1;
      const ctaRaw =
        item.cta && typeof item.cta === "object" ? (item.cta as Record<string, unknown>) : undefined;
      const ctaPrimaryRaw =
        item.cta_primary && typeof item.cta_primary === "object"
          ? (item.cta_primary as Record<string, unknown>)
          : undefined;
      const ctaSource = ctaRaw ?? ctaPrimaryRaw;

      const normalizedCta = ctaSource
        ? {
            text: typeof ctaSource.text === "string" ? ctaSource.text : "",
            url: typeof ctaSource.url === "string" ? ctaSource.url : "",
            kind: typeof ctaSource.kind === "string" ? ctaSource.kind : "primary",
            enabled: ctaSource.enabled !== false,
          }
        : undefined;

      return {
        ...item,
        id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : createItemId(),
        enabled: item.enabled !== false,
        order,
        ...(normalizedCta ? { cta: normalizedCta, cta_primary: normalizedCta } : {}),
      };
    })
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((item, index) => ({ ...item, order: index + 1 }));

  return { ...data, items: normalizedItems };
}

export function normalizeSettingsPayload(settings: SettingsPayload): SettingsPayload {
  const content = settings.content ?? { hero: {}, services: [], faqs: [], sections: [] };
  const sections = Array.isArray(content.sections) ? content.sections : [];

  const normalizedSections = sections
    .map((section, index) => {
      const sectionData =
        section.data && typeof section.data === "object"
          ? (section.data as Record<string, unknown>)
          : {};
      const normalizedData = sectionIdsWithItems.has(section.id)
        ? normalizeSectionItems(sectionData)
        : sectionData;
      return {
        ...section,
        enabled: section.enabled !== false,
        order:
          typeof section.order === "number" && Number.isFinite(section.order)
            ? section.order
            : (index + 1) * 10,
        data: normalizedData,
      };
    })
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((section, index) => ({ ...section, order: (index + 1) * 10 }));

  return {
    ...settings,
    content: {
      ...content,
      sections: normalizedSections,
    },
  };
}

export function parseOptionalUuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!uuidRegex.test(trimmed)) {
    throw new ApiRouteError(400, "Invalid userId format");
  }
  return trimmed;
}

export function extractSettingsFromSnapshot(snapshot: Record<string, unknown> | null): SettingsPayload | null {
  if (!snapshot || typeof snapshot !== "object") return null;

  const rootSettings = snapshot.settings;
  const candidate =
    rootSettings && typeof rootSettings === "object"
      ? (rootSettings as SettingsPayload)
      : (snapshot as SettingsPayload);

  const parsed = settingsSchema.safeParse(candidate);
  return parsed.success ? normalizeSettingsPayload(parsed.data) : null;
}

export function buildSnapshot(slug: string, settings: SettingsPayload): Record<string, unknown> {
  const normalizedSettings = normalizeSettingsPayload(settings);
  return {
    site: { slug },
    settings: normalizedSettings,
  };
}

export async function getSiteBySlug(supabase: SupabaseClient, slug: string) {
  const { data: site, error } = await supabase.from("sites").select("id, slug, name").eq("slug", slug).maybeSingle();

  if (error) throw new ApiRouteError(500, `Unable to fetch site: ${error.message}`);
  if (!site) throw new ApiRouteError(404, "Site not found");
  return site;
}

export async function requireSiteRole(
  supabase: SupabaseClient,
  siteId: string,
  userId: string,
  allowedRoles: AllowedRole[],
) {
  const { data, error } = await supabase
    .from("site_memberships")
    .select("role")
    .eq("site_id", siteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    const msg = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
    if (error.code === "42P01" || msg.includes("site_memberships")) {
      throw new ApiRouteError(503, "site_memberships table not available. Run staging migrations first.");
    }
    throw new ApiRouteError(500, `Unable to validate membership: ${error.message}`);
  }

  if (!data?.role) {
    throw new ApiRouteError(403, "User has no membership in this site");
  }

  if (!allowedRoles.includes(data.role as AllowedRole)) {
    throw new ApiRouteError(403, "Insufficient permissions for this action");
  }

  return data.role as AllowedRole;
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiRouteError) {
    return {
      status: error.status,
      body: { error: error.message },
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: { error: error.message },
    };
  }

  return {
    status: 500,
    body: { error: "Unknown server error" },
  };
}
