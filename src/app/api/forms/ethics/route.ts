import { NextResponse } from "next/server";
import { asCleanString, getCorsHeaders, htmlRows, isValidEmail, sendResendEmail } from "@/lib/forms-email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EthicsFormBody = {
  reportType?: "anonima" | "confidencial" | string;
  nombre?: string;
  apellido?: string;
  rut?: string;
  email?: string;
  telefono?: string;
  mensaje?: string;
  siteSlug?: string;
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request: Request) {
  const headers = getCorsHeaders(request);

  try {
    const body = ((await request.json().catch(() => ({}))) ?? {}) as EthicsFormBody;

    const reportType = asCleanString(body.reportType, 30).toLowerCase() || "anonima";
    const nombre = asCleanString(body.nombre, 120);
    const apellido = asCleanString(body.apellido, 120);
    const rut = asCleanString(body.rut, 40);
    const email = asCleanString(body.email, 180).toLowerCase();
    const telefono = asCleanString(body.telefono, 80);
    const mensaje = asCleanString(body.mensaje, 5000);
    const siteSlug = asCleanString(body.siteSlug, 80) || "gasfiter";

    if (!mensaje) {
      return NextResponse.json({ error: "Missing required field: mensaje" }, { status: 400, headers });
    }

    const isConfidential = reportType === "confidencial";
    if (isConfidential) {
      if (!nombre || !apellido || !email) {
        return NextResponse.json(
          { error: "Missing required fields for confidential report: nombre, apellido, email" },
          { status: 400, headers },
        );
      }
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400, headers });
      }
    }

    const to = process.env.ETHICS_FORM_TO;
    if (!to) {
      return NextResponse.json({ error: "ETHICS_FORM_TO is not configured" }, { status: 500, headers });
    }

    const submittedAt = new Date().toISOString();
    const rows = [
      { label: "Sitio", value: siteSlug },
      { label: "Tipo de denuncia", value: isConfidential ? "Confidencial" : "Anónima" },
      { label: "Nombre", value: nombre || "-" },
      { label: "Apellido", value: apellido || "-" },
      { label: "RUT", value: rut || "-" },
      { label: "Email", value: email || "-" },
      { label: "Teléfono", value: telefono || "-" },
      { label: "Fecha", value: submittedAt },
      { label: "Mensaje", value: mensaje },
    ];

    const result = await sendResendEmail({
      to,
      subject: `[${siteSlug}] Canal ético - ${isConfidential ? "Confidencial" : "Anónima"}`,
      html: `<h2>Nueva denuncia de canal ético</h2>${htmlRows(rows)}`,
      text: [
        "Nueva denuncia de canal ético",
        `Sitio: ${siteSlug}`,
        `Tipo de denuncia: ${isConfidential ? "Confidencial" : "Anónima"}`,
        `Nombre: ${nombre || "-"}`,
        `Apellido: ${apellido || "-"}`,
        `RUT: ${rut || "-"}`,
        `Email: ${email || "-"}`,
        `Teléfono: ${telefono || "-"}`,
        `Fecha: ${submittedAt}`,
        `Mensaje: ${mensaje}`,
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
