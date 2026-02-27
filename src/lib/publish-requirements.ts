import type { SettingsPayload } from "@/lib/settings-schema";

export type PublishRequirementIssue = {
  code:
    | "HERO_SECTION_MISSING"
    | "HERO_CTA_INCOMPLETE"
    | "SERVICES_SECTION_MISSING"
    | "SERVICES_ITEMS_MISSING"
    | "TESTIMONIALS_SECTION_MISSING"
    | "TESTIMONIALS_ITEMS_MISSING"
    | "CONTACT_SECTION_MISSING";
  label: string;
  path: string;
  message: string;
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

export function validatePublishRequirements(settings: SettingsPayload): PublishRequirementIssue[] {
  const issues: PublishRequirementIssue[] = [];
  const sections = Array.isArray(settings.content?.sections) ? settings.content.sections : [];
  const findSection = (id: string) =>
    sections.find((section) => section && section.id === id && section.enabled !== false) ?? null;

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
    const count = enabledItemsCount(asRecord(services.data));
    if (count < 1) {
      issues.push({
        code: "SERVICES_ITEMS_MISSING",
        label: "Al menos un servicio",
        path: "content.sections.services.data.items",
        message: "Agrega y habilita al menos un item en Services.",
      });
    }
  }

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

  const contact = findSection("contact_banner");
  if (!contact) {
    issues.push({
      code: "CONTACT_SECTION_MISSING",
      label: "Sección de contacto",
      path: "content.sections.contact_banner",
      message: "Activa la sección Contacto para publicar.",
    });
  }

  return issues;
}
