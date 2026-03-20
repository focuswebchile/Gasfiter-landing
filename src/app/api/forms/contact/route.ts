import { NextResponse } from "next/server";
import { asCleanString, getCorsHeaders, htmlRows, isValidEmail, sendResendEmail } from "@/lib/forms-email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContactFormBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
  siteSlug?: string;
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request: Request) {
  const headers = getCorsHeaders(request);

  try {
    const body = ((await request.json().catch(() => ({}))) ?? {}) as ContactFormBody;

    const firstName = asCleanString(body.firstName, 120);
    const lastName = asCleanString(body.lastName, 120);
    const email = asCleanString(body.email, 180).toLowerCase();
    const phone = asCleanString(body.phone, 80);
    const message = asCleanString(body.message, 5000);
    const siteSlug = asCleanString(body.siteSlug, 80) || "gasfiter";

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, email, message" },
        { status: 400, headers },
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400, headers });
    }

    const to = process.env.CONTACT_FORM_TO;
    if (!to) {
      return NextResponse.json({ error: "CONTACT_FORM_TO is not configured" }, { status: 500, headers });
    }

    const submittedAt = new Date().toISOString();
    const rows = [
      { label: "Sitio", value: siteSlug },
      { label: "Nombre", value: `${firstName} ${lastName}`.trim() },
      { label: "Email", value: email },
      { label: "Teléfono", value: phone || "-" },
      { label: "Fecha", value: submittedAt },
      { label: "Mensaje", value: message },
    ];

    const result = await sendResendEmail({
      to,
      subject: `[${siteSlug}] Nuevo contacto web - ${firstName} ${lastName}`,
      html: `<h2>Nuevo contacto web</h2>${htmlRows(rows)}`,
      text: [
        "Nuevo contacto web",
        `Sitio: ${siteSlug}`,
        `Nombre: ${firstName} ${lastName}`,
        `Email: ${email}`,
        `Teléfono: ${phone || "-"}`,
        `Fecha: ${submittedAt}`,
        `Mensaje: ${message}`,
      ].join("\n"),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason || "Failed to send email" }, { status: 502, headers });
    }

    return NextResponse.json({ ok: true }, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500, headers });
  }
}
