type SendRequestPublishEmailInput = {
  recipients: string[];
  siteSlug: string;
  requestedByUserId: string;
  requestedAtIso: string;
  note?: string | null;
  heroTitle?: string | null;
};

type SendRequestPublishEmailResult = {
  sent: boolean;
  reason?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildReviewUrl(siteSlug: string) {
  const baseUrl =
    process.env.PANEL_REVIEW_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "";
  if (!baseUrl) return "";
  const normalized = baseUrl.replace(/\/$/, "");
  return `${normalized}/staging?slug=${encodeURIComponent(siteSlug)}`;
}

export async function sendRequestPublishEmail(
  input: SendRequestPublishEmailInput,
): Promise<SendRequestPublishEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { sent: false, reason: "Email provider not configured (RESEND_API_KEY / RESEND_FROM_EMAIL)" };
  }

  if (!input.recipients.length) {
    return { sent: false, reason: "No owner/admin recipients found" };
  }

  const reviewUrl = buildReviewUrl(input.siteSlug);
  const safeSite = escapeHtml(input.siteSlug);
  const safeUser = escapeHtml(input.requestedByUserId);
  const safeHero = escapeHtml(input.heroTitle ?? "-");
  const safeNote = escapeHtml(input.note?.trim() || "Sin nota");
  const safeWhen = escapeHtml(input.requestedAtIso);

  const html = `
    <h2>Solicitud de publicación pendiente</h2>
    <p><strong>Sitio:</strong> ${safeSite}</p>
    <p><strong>Solicitado por:</strong> ${safeUser}</p>
    <p><strong>Fecha:</strong> ${safeWhen}</p>
    <p><strong>Hero title:</strong> ${safeHero}</p>
    <p><strong>Nota:</strong> ${safeNote}</p>
    ${reviewUrl ? `<p><a href="${escapeHtml(reviewUrl)}">Ir al panel de revisión</a></p>` : ""}
  `;

  const text = [
    "Solicitud de publicación pendiente",
    `Sitio: ${input.siteSlug}`,
    `Solicitado por: ${input.requestedByUserId}`,
    `Fecha: ${input.requestedAtIso}`,
    `Hero title: ${input.heroTitle ?? "-"}`,
    `Nota: ${input.note?.trim() || "Sin nota"}`,
    reviewUrl ? `Revisar: ${reviewUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.recipients,
      subject: `[${input.siteSlug}] Solicitud de publicación pendiente`,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    return { sent: false, reason: `Resend error (${response.status}): ${raw || "unknown error"}` };
  }

  return { sent: true };
}

