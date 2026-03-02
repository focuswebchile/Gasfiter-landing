export type CmsMode = "draft" | "published";

export type CmsSettings = {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  typography?: {
    font?: string;
    fontFamily?: string;
    baseSize?: string;
    lineHeight?: string;
  };
  branding?: {
    logoUrl?: string;
    logoNavUrl?: string;
    logoFooterUrl?: string;
    faviconUrl?: string;
    contact?: {
      whatsapp?: string;
      email?: string;
      address?: string;
    };
  };
  content?: {
    sections?: Array<{
      id?: string;
      enabled?: boolean;
      order?: number;
      data?: Record<string, unknown>;
    }>;
    hero?: {
      title?: string;
      subtitle?: string;
      image?: string;
      cta?: {
        primary_text?: string;
        primary_url?: string;
        secondary_text?: string;
        secondary_url?: string;
      };
    };
    services?: unknown;
    faqs?: Array<{ question?: string; answer?: string }>;
  };
};

export type HeroDefaults = {
  eyebrow: string;
  image: string;
  primaryUrl: string;
  primaryText: string;
  secondaryUrl: string;
  secondaryText: string;
};

export type ResolvedHero = {
  title: string;
  subtitle: string;
  eyebrow: string;
  image: string;
  primaryUrl: string;
  primaryText: string;
  secondaryUrl: string;
  secondaryText: string;
};

type SettingsResponse = {
  settings: CmsSettings | null;
  site?: { slug?: string; name?: string; status?: string } | null;
  draftUpdatedAt?: string | null;
};

const normalizeSettings = (input: unknown): CmsSettings | null => {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const colors =
    raw.colors && typeof raw.colors === "object"
      ? (raw.colors as CmsSettings["colors"])
      : {};
  const typography =
    raw.typography && typeof raw.typography === "object"
      ? (raw.typography as CmsSettings["typography"])
      : {};
  const brandingRaw =
    raw.branding && typeof raw.branding === "object"
      ? (raw.branding as CmsSettings["branding"])
      : {};
  const contentRaw =
    raw.content && typeof raw.content === "object"
      ? (raw.content as CmsSettings["content"])
      : {};

  const contact =
    brandingRaw?.contact && typeof brandingRaw.contact === "object"
      ? brandingRaw.contact
      : {};

  return {
    colors,
    typography,
    branding: {
      ...brandingRaw,
      contact,
    },
    content: {
      ...contentRaw,
      sections: Array.isArray(contentRaw?.sections) ? contentRaw.sections : [],
      hero:
        contentRaw?.hero && typeof contentRaw.hero === "object"
          ? contentRaw.hero
          : {},
      faqs: Array.isArray(contentRaw?.faqs) ? contentRaw.faqs : [],
    },
  };
};

const resolveBackendBaseUrl = (configuredBaseUrl?: string): string | null => {
  const envBase = configuredBaseUrl?.trim() || process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "";
  let resolved = envBase;

  if (!resolved && typeof window !== "undefined") {
    resolved = window.location.origin;
  }

  if (!resolved) return null;

  if (typeof window !== "undefined") {
    try {
      const configuredHost = new URL(resolved).hostname;
      const isConfiguredLocal = /^(localhost|127\.0\.0\.1)$/.test(configuredHost);
      const isCurrentLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
      if (isConfiguredLocal && !isCurrentLocal) {
        resolved = window.location.origin;
      }
    } catch {
      resolved = window.location.origin;
    }
  }

  return resolved.replace(/\/$/, "");
};

export const fetchSettingsBySlug = async ({
  slug,
  mode,
  configuredBaseUrl,
  cacheBust = true,
}: {
  slug: string;
  mode?: CmsMode;
  configuredBaseUrl?: string;
  cacheBust?: boolean;
}): Promise<SettingsResponse> => {
  const safeSlug = slug.trim();
  if (!safeSlug) return { settings: null };

  const baseUrl = resolveBackendBaseUrl(configuredBaseUrl);
  if (!baseUrl) return { settings: null };

  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  if (cacheBust) params.set("t", String(Date.now()));
  const query = params.toString();
  const endpoint = `${baseUrl}/api/sites/${encodeURIComponent(safeSlug)}/settings${query ? `?${query}` : ""}`;

  const res = await fetch(endpoint, {
    cache: "no-store",
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
  });
  if (!res.ok) return { settings: null };

  const payload = (await res.json()) as Record<string, unknown>;
  return {
    settings: normalizeSettings(payload?.settings),
    site: (payload?.site as SettingsResponse["site"]) ?? null,
    draftUpdatedAt:
      typeof payload?.draftUpdatedAt === "string" ? payload.draftUpdatedAt : null,
  };
};

const getTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const resolveHeroFromSettings = ({
  settings,
  defaults,
  fallbackWhatsappUrl,
}: {
  settings: CmsSettings | null;
  defaults: HeroDefaults;
  fallbackWhatsappUrl?: string;
}): ResolvedHero => {
  const content = settings?.content && typeof settings.content === "object" ? settings.content : {};
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const sectionHero = sections.find(
    (section) =>
      section &&
      typeof section === "object" &&
      section.id === "hero" &&
      section.enabled !== false &&
      section.data &&
      typeof section.data === "object",
  );

  const sectionData = sectionHero?.data && typeof sectionHero.data === "object" ? sectionHero.data : {};
  const legacyHero = content.hero && typeof content.hero === "object" ? content.hero : {};
  const secondaryUrlFallback = getTrimmedString(fallbackWhatsappUrl) || defaults.secondaryUrl;

  return {
    title: getTrimmedString((sectionData as { title?: unknown }).title) || getTrimmedString(legacyHero.title),
    subtitle:
      getTrimmedString((sectionData as { subtitle?: unknown }).subtitle) ||
      getTrimmedString(legacyHero.subtitle),
    eyebrow: getTrimmedString((sectionData as { eyebrow?: unknown }).eyebrow) || defaults.eyebrow,
    image:
      getTrimmedString((sectionData as { image?: unknown }).image) ||
      getTrimmedString(legacyHero.image) ||
      defaults.image,
    primaryUrl:
      getTrimmedString((sectionData as { cta_primary?: { url?: unknown } }).cta_primary?.url) ||
      getTrimmedString(legacyHero.cta?.primary_url) ||
      defaults.primaryUrl,
    primaryText:
      getTrimmedString((sectionData as { cta_primary?: { text?: unknown } }).cta_primary?.text) ||
      getTrimmedString(legacyHero.cta?.primary_text) ||
      defaults.primaryText,
    secondaryUrl:
      getTrimmedString((sectionData as { cta_secondary?: { url?: unknown } }).cta_secondary?.url) ||
      getTrimmedString(legacyHero.cta?.secondary_url) ||
      secondaryUrlFallback,
    secondaryText:
      getTrimmedString((sectionData as { cta_secondary?: { text?: unknown } }).cta_secondary?.text) ||
      getTrimmedString(legacyHero.cta?.secondary_text) ||
      defaults.secondaryText,
  };
};
