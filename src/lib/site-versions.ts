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
  return parsed.success ? parsed.data : null;
}

export function buildSnapshot(slug: string, settings: SettingsPayload): Record<string, unknown> {
  return {
    site: { slug },
    settings,
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

  return {
    status: 500,
    body: { error: "Unknown server error" },
  };
}
