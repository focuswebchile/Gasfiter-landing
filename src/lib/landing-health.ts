import type { SettingsPayload } from "@/lib/settings-schema";

type Severity = "error" | "warning";

export type LandingHealthIssue = {
  severity: Severity;
  code: string;
  path: string;
  message: string;
};

export type LandingHealthReport = {
  ok: boolean;
  errors: LandingHealthIssue[];
  warnings: LandingHealthIssue[];
  fallback_used: string[];
  checks: {
    content_loaded: boolean;
    sections_normalized: boolean;
    branding_present: boolean;
    ctas_valid: boolean;
    structural_errors: boolean;
  };
};

const KNOWN_FALLBACK_VALUES = new Set([
  "SERVICIO 24/7 · SANTIAGO",
  "¿Qué problema tienes ahora?",
  "Servicios más solicitados",
  "Trabajos realizados en Santiago",
  "Comentarios de nuestros clientes",
  "Preguntas frecuentes",
  "¿Tienes una urgencia ahora?",
  "CONTACTO",
  "¿Tienes preguntas?\nEscríbenos ahora.",
  "/images/heroseccion.webp",
  "/images/gasfiter-destape.webp",
  "/images/gasfiter-testimonial.webp",
]);

function pushIssue(
  target: LandingHealthIssue[],
  severity: Severity,
  code: string,
  path: string,
  message: string,
) {
  target.push({ severity, code, path, message });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function checkCta(
  cta: unknown,
  pathPrefix: string,
  issues: LandingHealthIssue[],
  isRequired: boolean,
) {
  if (!cta || typeof cta !== "object") {
    if (isRequired) {
      pushIssue(
        issues,
        "warning",
        "CTA_MISSING",
        pathPrefix,
        "CTA no está definido para un bloque crítico.",
      );
    }
    return;
  }
  const text = (cta as { text?: unknown }).text;
  const url = (cta as { url?: unknown }).url;
  if (!isNonEmptyString(text)) {
    pushIssue(issues, "warning", "CTA_TEXT_MISSING", `${pathPrefix}.text`, "CTA sin texto válido.");
  }
  if (!isNonEmptyString(url)) {
    pushIssue(issues, "warning", "CTA_URL_MISSING", `${pathPrefix}.url`, "CTA sin URL válida.");
  }
}

export function runLandingSanityChecks(settings: SettingsPayload | null | undefined): LandingHealthReport {
  const issues: LandingHealthIssue[] = [];
  const fallback_used: string[] = [];

  const content = settings?.content;
  const sections = Array.isArray(content?.sections) ? content.sections : [];

  if (!settings || typeof settings !== "object") {
    pushIssue(issues, "error", "SETTINGS_MISSING", "settings", "No se encontró settings.");
  }

  if (!content || typeof content !== "object") {
    pushIssue(issues, "error", "CONTENT_MISSING", "settings.content", "No se encontró content.");
  }

  if (!Array.isArray(sections)) {
    pushIssue(
      issues,
      "error",
      "SECTIONS_INVALID",
      "settings.content.sections",
      "content.sections no es un arreglo.",
    );
  }

  const seen = new Set<string>();
  let orderSortable = true;
  for (const section of sections) {
    if (!section || typeof section !== "object") {
      pushIssue(issues, "error", "SECTION_INVALID", "settings.content.sections[]", "Sección inválida.");
      continue;
    }
    const sectionId = (section as { id?: unknown }).id;
    if (!isNonEmptyString(sectionId)) {
      pushIssue(
        issues,
        "error",
        "SECTION_ID_MISSING",
        "settings.content.sections[].id",
        "Sección sin id.",
      );
      continue;
    }
    if (seen.has(sectionId)) {
      pushIssue(
        issues,
        "warning",
        "SECTION_DUPLICATED",
        `settings.content.sections[${sectionId}]`,
        "Sección duplicada por id.",
      );
    }
    seen.add(sectionId);

    const order = (section as { order?: unknown }).order;
    if (typeof order !== "number" || Number.isNaN(order)) {
      orderSortable = false;
      pushIssue(
        issues,
        "warning",
        "SECTION_ORDER_INVALID",
        `settings.content.sections[${sectionId}].order`,
        "Order inválido, no se puede garantizar normalización.",
      );
    }

    const data = (section as { data?: unknown }).data;
    if (!data || typeof data !== "object") {
      pushIssue(
        issues,
        "warning",
        "SECTION_DATA_MISSING",
        `settings.content.sections[${sectionId}].data`,
        "Sección sin data.",
      );
    }
  }

  const heroSection = sections.find((s) => (s as { id?: string }).id === "hero") as
    | { data?: Record<string, unknown> }
    | undefined;
  const servicesSection = sections.find((s) => (s as { id?: string }).id === "services") as
    | { data?: Record<string, unknown> }
    | undefined;
  const urgencySection = sections.find((s) => (s as { id?: string }).id === "urgency_banner") as
    | { data?: Record<string, unknown> }
    | undefined;

  checkCta(heroSection?.data?.cta_primary, "content.sections.hero.data.cta_primary", issues, true);
  checkCta(urgencySection?.data?.cta_primary, "content.sections.urgency_banner.data.cta_primary", issues, false);

  const servicesItems = Array.isArray(servicesSection?.data?.items)
    ? (servicesSection?.data?.items as Array<Record<string, unknown>>)
    : [];
  servicesItems.forEach((item, index) => {
    checkCta(item?.cta, `content.sections.services.data.items[${index}].cta`, issues, false);
  });

  const branding = settings?.branding;
  if (!branding || typeof branding !== "object") {
    pushIssue(
      issues,
      "warning",
      "BRANDING_MISSING",
      "settings.branding",
      "Branding ausente; se usarán defaults visuales.",
    );
  }

  const serialized = JSON.stringify(settings ?? {});
  for (const marker of KNOWN_FALLBACK_VALUES) {
    if (serialized.includes(marker)) {
      fallback_used.push(marker);
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  const report: LandingHealthReport = {
    ok: errors.length === 0,
    errors,
    warnings,
    fallback_used,
    checks: {
      content_loaded: !!content && typeof content === "object",
      sections_normalized: Array.isArray(sections) && orderSortable,
      branding_present: !!branding && typeof branding === "object",
      ctas_valid: !warnings.some((w) => w.code.startsWith("CTA_")),
      structural_errors: errors.length > 0,
    },
  };

  return report;
}
