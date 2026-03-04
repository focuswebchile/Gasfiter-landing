import type { SettingsPayload } from "@/lib/settings-schema";

export type PublishRequirementIssue = {
  code:
    | "HERO_SECTION_MISSING"
    | "HERO_TITLE_MISSING"
    | "HERO_SUBTITLE_MISSING"
    | "HERO_CTA_INCOMPLETE"
    | "HERO_CTA_URL_INVALID"
    | "SERVICES_SECTION_MISSING"
    | "SERVICES_TITLE_MISSING"
    | "SERVICES_ITEMS_MISSING"
    | "SERVICES_ITEM_INCOMPLETE"
    | "SERVICES_CTA_URL_INVALID"
    | "SERVICES_TARGET_INVALID"
    | "TESTIMONIALS_SECTION_MISSING"
    | "TESTIMONIALS_ITEMS_MISSING"
    | "CONTACT_SECTION_MISSING"
    | "CONTACT_TITLE_MISSING"
    | "CONTACT_SUBMIT_TEXT_MISSING"
    | "AUDIENCE_CTA_URL_INVALID"
    | "URGENCY_CTA_URL_INVALID";
  label: string;
  path: string;
  message: string;
};

type PublishValidationContext = {
  siteSlug?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function enabledItemsCount(sectionData: Record<string, unknown>) {
  const items = Array.isArray(sectionData.items) ? (sectionData.items as Array<Record<string, unknown>>) : [];
  return items.filter((item) => item && item.enabled !== false).length;
}

function normalizeInternalTarget(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().toLowerCase().replace(/\/+$/, "") : "";
  if (!raw) return "";
  const aliases: Record<string, string> = {
    home: "home",
    "/": "home",
    "/home": "home",
    "#home": "home",
    servicios: "servicios",
    "/servicios": "servicios",
    "#servicios": "servicios",
    empresa: "empresa",
    "/empresa": "empresa",
    "#empresa": "empresa",
    clientes: "clientes",
    "/clientes": "clientes",
    "#clientes": "clientes",
    contacto: "contacto",
    "/contacto": "contacto",
    "#contacto": "contacto",
  };
  return aliases[raw] || "";
}

function isExternalUrl(value: unknown): boolean {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (
    raw.startsWith("https://") ||
    raw.startsWith("http://") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("tel:")
  );
}

function isValidCtaUrl(value: unknown): boolean {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return false;
  if (raw.startsWith("#")) return raw.length > 1;
  if (isExternalUrl(raw)) return true;
  return normalizeInternalTarget(raw).length > 0;
}

function isTestimonialsRequired(siteSlug?: string): boolean {
  const normalized = String(siteSlug || "").trim().toLowerCase();
  return normalized !== "abcis";
}

export function validatePublishRequirements(
  settings: SettingsPayload,
  context: PublishValidationContext = {},
): PublishRequirementIssue[] {
  const issues: PublishRequirementIssue[] = [];
  const sections = Array.isArray(settings.content?.sections) ? settings.content.sections : [];
  const findSection = (id: string) =>
    sections.find((section) => section && section.id === id && section.enabled !== false) ?? null;
  const testimonialsRequired = isTestimonialsRequired(context.siteSlug);

  const hero = findSection("hero");
  if (!hero) {
    issues.push({
      code: "HERO_SECTION_MISSING",
      label: "Hero con CTA activo",
      path: "content.sections.hero",
      message: "Activa la sección Hero para poder publicar.",
    });
  } else {
    const heroData = asRecord(hero.data);
    if (!isNonEmptyString(heroData.title)) {
      issues.push({
        code: "HERO_TITLE_MISSING",
        label: "Hero con contenido mínimo",
        path: "content.sections.hero.data.title",
        message: "Completa el título del Hero para publicar.",
      });
    }
    if (!isNonEmptyString(heroData.subtitle)) {
      issues.push({
        code: "HERO_SUBTITLE_MISSING",
        label: "Hero con contenido mínimo",
        path: "content.sections.hero.data.subtitle",
        message: "Completa el subtítulo del Hero para publicar.",
      });
    }
    const ctaPrimary = asRecord(heroData.cta_primary);
    const ctaEnabled = ctaPrimary.enabled !== false;
    const ctaText = ctaPrimary.text;
    const ctaUrl = ctaPrimary.url;
    if (!ctaEnabled || !isNonEmptyString(ctaText) || !isNonEmptyString(ctaUrl)) {
      issues.push({
        code: "HERO_CTA_INCOMPLETE",
        label: "Hero con CTA activo",
        path: "content.sections.hero.data.cta_primary",
        message: "Completa CTA principal del Hero (texto + URL) y déjalo activo.",
      });
    } else if (!isValidCtaUrl(ctaUrl)) {
      issues.push({
        code: "HERO_CTA_URL_INVALID",
        label: "CTA Hero válida",
        path: "content.sections.hero.data.cta_primary.url",
        message: "La URL del CTA del Hero no es válida (usa sección interna o URL externa válida).",
      });
    }
  }

  const audience = findSection("audience");
  if (audience) {
    const audienceData = asRecord(audience.data);
    const ctaPrimary = asRecord(audienceData.cta_primary);
    const ctaSecondary = asRecord(audienceData.cta_secondary);
    const ctaPrimaryUrl = ctaPrimary.url;
    const ctaSecondaryUrl = ctaSecondary.url;
    if (isNonEmptyString(ctaPrimaryUrl) && !isValidCtaUrl(ctaPrimaryUrl)) {
      issues.push({
        code: "AUDIENCE_CTA_URL_INVALID",
        label: "CTA Empresa válida",
        path: "content.sections.audience.data.cta_primary.url",
        message: "CTA principal de Empresa con URL inválida.",
      });
    }
    if (isNonEmptyString(ctaSecondaryUrl) && !isValidCtaUrl(ctaSecondaryUrl)) {
      issues.push({
        code: "AUDIENCE_CTA_URL_INVALID",
        label: "CTA Empresa válida",
        path: "content.sections.audience.data.cta_secondary.url",
        message: "CTA secundario de Empresa con URL inválida.",
      });
    }
  }

  const services = findSection("services");
  if (!services) {
    issues.push({
      code: "SERVICES_SECTION_MISSING",
      label: "Al menos un servicio",
      path: "content.sections.services",
      message: "Activa la sección Services para publicar.",
    });
  } else {
    const servicesData = asRecord(services.data);
    if (!isNonEmptyString(servicesData.title)) {
      issues.push({
        code: "SERVICES_TITLE_MISSING",
        label: "Servicios con título",
        path: "content.sections.services.data.title",
        message: "Completa el título de la sección Services para publicar.",
      });
    }
    const count = enabledItemsCount(servicesData);
    if (count < 1) {
      issues.push({
        code: "SERVICES_ITEMS_MISSING",
        label: "Al menos un servicio",
        path: "content.sections.services.data.items",
        message: "Agrega y habilita al menos un item en Services.",
      });
    }

    const items = Array.isArray(servicesData.items) ? (servicesData.items as Array<Record<string, unknown>>) : [];
    const enabledItems = items.filter((item) => item && item.enabled !== false);
    const allowedServiceTargets = new Set(["consultoria", "auditorias", "certificacion", "capacitacion"]);

    for (const [index, item] of enabledItems.entries()) {
      const title = item.title;
      const description = item.description;
      if (!isNonEmptyString(title) || !isNonEmptyString(description)) {
        issues.push({
          code: "SERVICES_ITEM_INCOMPLETE",
          label: "Servicios completos",
          path: `content.sections.services.data.items[${index}]`,
          message: "Cada servicio habilitado debe tener título y descripción.",
        });
      }

      const cta = asRecord(item.cta);
      const ctaEnabled = cta.enabled !== false;
      const ctaUrl = cta.url;
      if (ctaEnabled && isNonEmptyString(ctaUrl) && !isValidCtaUrl(ctaUrl)) {
        issues.push({
          code: "SERVICES_CTA_URL_INVALID",
          label: "CTA Servicios válida",
          path: `content.sections.services.data.items[${index}].cta.url`,
          message: "Hay un CTA de servicio con URL inválida.",
        });
      }

      const ctaKind = typeof cta.kind === "string" ? cta.kind.trim().toLowerCase() : "";
      const targetRaw = [
        cta.sectionTarget,
        cta.targetSection,
        item.sectionTarget,
        item.targetSection,
      ].find((value) => isNonEmptyString(value));
      const normalizedTarget = typeof targetRaw === "string" ? targetRaw.trim().toLowerCase() : "";
      if (ctaKind === "anchor" && normalizedTarget && !allowedServiceTargets.has(normalizedTarget)) {
        issues.push({
          code: "SERVICES_TARGET_INVALID",
          label: "Target interno de Servicios válido",
          path: `content.sections.services.data.items[${index}].targetSection`,
          message: "Target interno inválido en Services. Usa consultoria, auditorias, certificacion o capacitacion.",
        });
      }
    }
  }

  if (testimonialsRequired) {
    const testimonials = findSection("testimonials");
    if (!testimonials) {
      issues.push({
        code: "TESTIMONIALS_SECTION_MISSING",
        label: "Un testimonio",
        path: "content.sections.testimonials",
        message: "Activa la sección Testimonials para publicar.",
      });
    } else {
      const count = enabledItemsCount(asRecord(testimonials.data));
      if (count < 1) {
        issues.push({
          code: "TESTIMONIALS_ITEMS_MISSING",
          label: "Un testimonio",
          path: "content.sections.testimonials.data.items",
          message: "Agrega y habilita al menos un testimonio.",
        });
      }
    }
  }

  const contact = findSection("contact_banner");
  if (!contact) {
    issues.push({
      code: "CONTACT_SECTION_MISSING",
      label: "Sección de contacto",
      path: "content.sections.contact_banner",
      message: "Activa la sección Contacto para publicar.",
    });
  } else {
    const contactData = asRecord(contact.data);
    if (!isNonEmptyString(contactData.title)) {
      issues.push({
        code: "CONTACT_TITLE_MISSING",
        label: "Sección de contacto",
        path: "content.sections.contact_banner.data.title",
        message: "Completa el título de la sección de contacto.",
      });
    }
    const formEnabled = contactData.form_enabled !== false;
    if (formEnabled && !isNonEmptyString(contactData.submit_text)) {
      issues.push({
        code: "CONTACT_SUBMIT_TEXT_MISSING",
        label: "Formulario de contacto",
        path: "content.sections.contact_banner.data.submit_text",
        message: "Completa el texto del botón de envío en contacto.",
      });
    }
  }

  const urgency = findSection("urgency_banner");
  if (urgency) {
    const urgencyData = asRecord(urgency.data);
    const ctaPrimary = asRecord(urgencyData.cta_primary);
    const ctaPrimaryUrl = ctaPrimary.url;
    if (isNonEmptyString(ctaPrimaryUrl) && !isValidCtaUrl(ctaPrimaryUrl)) {
      issues.push({
        code: "URGENCY_CTA_URL_INVALID",
        label: "CTA Banner urgente válida",
        path: "content.sections.urgency_banner.data.cta_primary.url",
        message: "CTA principal de Banner urgente con URL inválida.",
      });
    }
  }

  return issues;
}
