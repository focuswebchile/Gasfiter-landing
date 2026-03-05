export type ResendSendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function asCleanString(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "*";
  const allowListRaw = process.env.FORMS_ALLOWED_ORIGINS || "";
  const allowList = allowListRaw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const allowOrigin = allowList.length === 0 || allowList.includes(origin) ? origin : allowList[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-user-id",
    Vary: "Origin",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  };
}

export function htmlRows(rows: Array<{ label: string; value: string }>) {
  return rows
    .map((row) => `<p><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value || "-")}</p>`)
    .join("\n");
}

export async function sendResendEmail(input: ResendSendInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { ok: false as const, reason: "Email provider not configured (RESEND_API_KEY / RESEND_FROM_EMAIL)" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    return { ok: false as const, reason: `Resend error (${response.status}): ${raw || "unknown error"}` };
  }

  return { ok: true as const };
}
