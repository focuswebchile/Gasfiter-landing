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

export type AudienceDefaults = {
  kicker: string;
  title: string;
  description: string;
  ctaPrimaryText: string;
  ctaPrimaryUrl: string;
  ctaSecondaryText: string;
  ctaSecondaryUrl: string;
};

export type ResolvedAudience = {
  kicker: string;
  title: string;
  description: string;
  bullets: Array<{ text: string; icon: string }>;
  ctaPrimary: { text: string; url: string };
  ctaSecondary: { text: string; url: string };
  images: { back: string; front: string };
};

export type ServicesDefaults = {
  title: string;
  subtitle: string;
  ctaText: string;
};

export type ResolvedServiceItem = {
  title: string;
  description: string;
  features: string[];
  cta: {
    text: string;
    url: string;
    enabled: boolean;
  };
};

export type ResolvedServices = {
  title: string;
  subtitle: string;
  items: ResolvedServiceItem[];
  hasDynamicSource: boolean;
};

export type ProjectsDefaults = {
  title: string;
  description: string;
  fallbackImage: string;
};

export type ResolvedProjectItem = {
  title: string;
  location: string;
  image: string;
  alt: string;
  size: string;
};

export type ResolvedProjects = {
  title: string;
  description: string;
  controlsEnabled: boolean;
  items: ResolvedProjectItem[];
};

export type UrgencyDefaults = {
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
};

export type ResolvedUrgency = {
  title: string;
  description: string;
  ctaPrimary: {
    text: string;
    url: string;
  };
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

const toServicesArray = (services: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(services)) {
    return services.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  }
  if (!services || typeof services !== "object") return [];
  const items = (services as { items?: unknown }).items;
  if (Array.isArray(items)) {
    return items.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  }
  if (items && typeof items === "object") {
    return Object.values(items as Record<string, unknown>).filter(
      (item): item is Record<string, unknown> => !!item && typeof item === "object",
    );
  }
  return [];
};

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

export const resolveAudienceFromSettings = ({
  settings,
  defaults,
  heroPrimaryUrl,
}: {
  settings: CmsSettings | null;
  defaults: AudienceDefaults;
  heroPrimaryUrl?: string;
}): ResolvedAudience => {
  const content = settings?.content && typeof settings.content === "object" ? settings.content : {};
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const sectionAudience = sections.find(
    (section) =>
      section &&
      typeof section === "object" &&
      section.id === "audience" &&
      section.enabled !== false &&
      section.data &&
      typeof section.data === "object",
  );
  const sectionData = sectionAudience?.data && typeof sectionAudience.data === "object" ? sectionAudience.data : {};
  const legacyAudience =
    (content as { audience?: Record<string, unknown> }).audience &&
    typeof (content as { audience?: Record<string, unknown> }).audience === "object"
      ? ((content as { audience?: Record<string, unknown> }).audience as Record<string, unknown>)
      : {};

  const bulletsRaw = Array.isArray((sectionData as { bullets?: unknown }).bullets)
    ? (((sectionData as { bullets?: unknown[] }).bullets ?? []) as unknown[])
    : Array.isArray((legacyAudience as { bullets?: unknown }).bullets)
      ? ((((legacyAudience as { bullets?: unknown[] }).bullets ?? []) as unknown[]) as unknown[])
      : [];

  const bullets = bulletsRaw
    .filter((item) => item && typeof item === "object" && (item as { enabled?: unknown }).enabled !== false)
    .map((item) => ({
      text: getTrimmedString((item as { text?: unknown }).text),
      icon: getTrimmedString((item as { icon?: unknown }).icon) || "fa-circle-check",
    }))
    .filter((item) => item.text);

  const sectionPrimary = (sectionData as { cta_primary?: { text?: unknown; url?: unknown } }).cta_primary;
  const legacyPrimary = (legacyAudience as { cta_primary?: { text?: unknown; url?: unknown } }).cta_primary;
  const sectionSecondary = (sectionData as { cta_secondary?: { text?: unknown; url?: unknown } }).cta_secondary;
  const legacySecondary = (legacyAudience as { cta_secondary?: { text?: unknown; url?: unknown } }).cta_secondary;

  const sectionImages = (sectionData as { images?: { back?: unknown; front?: unknown } }).images;
  const legacyImages = (legacyAudience as { images?: { back?: unknown; front?: unknown } }).images;

  return {
    kicker:
      getTrimmedString((sectionData as { kicker?: unknown }).kicker) ||
      getTrimmedString((legacyAudience as { kicker?: unknown }).kicker) ||
      defaults.kicker,
    title:
      getTrimmedString((sectionData as { title?: unknown }).title) ||
      getTrimmedString((legacyAudience as { title?: unknown }).title) ||
      defaults.title,
    description:
      getTrimmedString((sectionData as { description?: unknown }).description) ||
      getTrimmedString((legacyAudience as { description?: unknown }).description) ||
      defaults.description,
    bullets,
    ctaPrimary: {
      text:
        getTrimmedString(sectionPrimary?.text) ||
        getTrimmedString(legacyPrimary?.text) ||
        defaults.ctaPrimaryText,
      url:
        getTrimmedString(sectionPrimary?.url) ||
        getTrimmedString(legacyPrimary?.url) ||
        getTrimmedString(heroPrimaryUrl) ||
        defaults.ctaPrimaryUrl,
    },
    ctaSecondary: {
      text:
        getTrimmedString(sectionSecondary?.text) ||
        getTrimmedString(legacySecondary?.text) ||
        defaults.ctaSecondaryText,
      url:
        getTrimmedString(sectionSecondary?.url) ||
        getTrimmedString(legacySecondary?.url) ||
        defaults.ctaSecondaryUrl,
    },
    images: {
      back: getTrimmedString(sectionImages?.back) || getTrimmedString(legacyImages?.back),
      front: getTrimmedString(sectionImages?.front) || getTrimmedString(legacyImages?.front),
    },
  };
};

export const resolveServicesFromSettings = ({
  settings,
  defaults,
  heroPrimaryUrl,
}: {
  settings: CmsSettings | null;
  defaults: ServicesDefaults;
  heroPrimaryUrl: string;
}): ResolvedServices => {
  const content = settings?.content && typeof settings.content === "object" ? settings.content : {};
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const sectionServices = sections.find(
    (section) =>
      section &&
      typeof section === "object" &&
      section.id === "services" &&
      section.enabled !== false &&
      section.data &&
      typeof section.data === "object",
  );

  const sectionData = sectionServices?.data && typeof sectionServices.data === "object" ? sectionServices.data : null;
  const servicesSource = sectionData ?? content.services;
  const hasDynamicSource = !!sectionData || Array.isArray(content.services);

  const title =
    (sectionData && getTrimmedString((sectionData as { title?: unknown }).title)) || defaults.title;
  const subtitle =
    (sectionData && getTrimmedString((sectionData as { subtitle?: unknown }).subtitle)) || defaults.subtitle;

  const items = toServicesArray(servicesSource).map((item) => {
    const rawFeatures = Array.isArray(item.features) ? item.features : [];
    const features = rawFeatures
      .map((feature) => getTrimmedString(feature))
      .filter(Boolean);
    const rawCta = item.cta && typeof item.cta === "object" ? (item.cta as Record<string, unknown>) : {};
    return {
      title: getTrimmedString(item.title),
      description: getTrimmedString(item.description),
      features,
      cta: {
        text: getTrimmedString(rawCta.text) || defaults.ctaText,
        url: getTrimmedString(rawCta.url) || heroPrimaryUrl,
        enabled: rawCta.enabled !== false,
      },
    };
  });

  return { title, subtitle, items, hasDynamicSource };
};

export const resolveProjectsFromSettings = ({
  settings,
  defaults,
}: {
  settings: CmsSettings | null;
  defaults: ProjectsDefaults;
}): ResolvedProjects => {
  const content = settings?.content && typeof settings.content === "object" ? settings.content : {};
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const sectionProjects = sections.find(
    (section) =>
      section &&
      typeof section === "object" &&
      section.id === "projects" &&
      section.enabled !== false &&
      section.data &&
      typeof section.data === "object",
  );

  const sectionData = sectionProjects?.data && typeof sectionProjects.data === "object" ? sectionProjects.data : {};
  const title = getTrimmedString((sectionData as { title?: unknown }).title) || defaults.title;
  const description =
    getTrimmedString((sectionData as { description?: unknown }).description) || defaults.description;
  const controlsEnabled = (sectionData as { controls_enabled?: unknown }).controls_enabled !== false;
  const rawItems = toServicesArray((sectionData as { items?: unknown }).items);
  const items = rawItems
    .map((item) => {
      const titleValue = getTrimmedString(item.title);
      if (!titleValue) return null;
      const location = getTrimmedString(item.location);
      const image = getTrimmedString(item.image) || defaults.fallbackImage;
      const alt = getTrimmedString(item.alt) || titleValue;
      const size = getTrimmedString(item.size);
      return { title: titleValue, location, image, alt, size };
    })
    .filter((item): item is ResolvedProjectItem => !!item && item.title.length > 0);

  return {
    title,
    description,
    controlsEnabled,
    items,
  };
};

export const resolveUrgencyFromSettings = ({
  settings,
  defaults,
  heroPrimaryUrl,
}: {
  settings: CmsSettings | null;
  defaults: UrgencyDefaults;
  heroPrimaryUrl?: string;
}): ResolvedUrgency => {
  const content = settings?.content && typeof settings.content === "object" ? settings.content : {};
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const sectionUrgency = sections.find(
    (section) =>
      section &&
      typeof section === "object" &&
      section.id === "urgency_banner" &&
      section.enabled !== false &&
      section.data &&
      typeof section.data === "object",
  );
  const sectionData = sectionUrgency?.data && typeof sectionUrgency.data === "object" ? sectionUrgency.data : {};

  const ctaPrimary = (sectionData as { cta_primary?: { text?: unknown; url?: unknown } }).cta_primary;
  return {
    title: getTrimmedString((sectionData as { title?: unknown }).title) || defaults.title,
    description:
      getTrimmedString((sectionData as { description?: unknown }).description) || defaults.description,
    ctaPrimary: {
      text: getTrimmedString(ctaPrimary?.text) || defaults.ctaText,
      url: getTrimmedString(ctaPrimary?.url) || getTrimmedString(heroPrimaryUrl) || defaults.ctaUrl,
    },
  };
};
