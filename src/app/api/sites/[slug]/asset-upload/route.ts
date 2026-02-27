import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import { apiErrorResponse, getSiteBySlug, parseOptionalUuid, requireSiteRole } from "@/lib/site-versions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_BYTES = 4 * 1024 * 1024;
const defaultBucket = "branding-assets";
const allowedSections = new Set(["hero", "projects", "testimonials", "contact_banner"]);
const allowedFields = new Set(["image", "avatar", "background_image"]);

function guessExt(file: File) {
  const byType = file.type.toLowerCase();
  if (byType.includes("png")) return "png";
  if (byType.includes("jpeg") || byType.includes("jpg")) return "jpg";
  if (byType.includes("webp")) return "webp";
  if (byType.includes("svg")) return "svg";
  return "png";
}

function sanitizePart(raw: string, fallback: string) {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || fallback;
}

function isAllowedImage(file: File) {
  const mime = file.type.toLowerCase();
  return (
    mime === "image/png" ||
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/webp" ||
    mime === "image/svg+xml"
  );
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const form = await request.formData();

    const userIdRaw = form.get("userId");
    const sectionIdRaw = form.get("sectionId");
    const fieldRaw = form.get("field");
    const itemIdRaw = form.get("itemId");
    const file = form.get("file");

    const userId = parseOptionalUuid(typeof userIdRaw === "string" ? userIdRaw : null);
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const sectionId = typeof sectionIdRaw === "string" ? sectionIdRaw.trim() : "";
    const field = typeof fieldRaw === "string" ? fieldRaw.trim() : "";
    const itemId = typeof itemIdRaw === "string" ? itemIdRaw.trim() : "";

    if (!allowedSections.has(sectionId)) {
      return NextResponse.json(
        { error: "Invalid sectionId. Use hero|projects|testimonials|contact_banner" },
        { status: 400 },
      );
    }
    if (!allowedFields.has(field)) {
      return NextResponse.json({ error: "Invalid field. Use image|avatar|background_image" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!isAllowedImage(file)) {
      return NextResponse.json(
        { error: "Invalid file type", details: "Allowed: png,jpg,jpeg,webp,svg" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large", details: "Max 4MB" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const site = await getSiteBySlug(supabase, slug);
    await requireSiteRole(supabase, site.id, userId, ["owner", "admin", "editor"]);

    const bucket = process.env.SUPABASE_ASSETS_BUCKET?.trim() || process.env.SUPABASE_BRANDING_BUCKET?.trim() || defaultBucket;
    const ext = guessExt(file);
    const safeSection = sanitizePart(sectionId, "section");
    const safeField = sanitizePart(field, "asset");
    const safeItem = itemId ? sanitizePart(itemId, "item") : "";
    const path = safeItem
      ? `sites/${site.slug}/${safeSection}/${safeItem}-${safeField}-${Date.now()}.${ext}`
      : `sites/${site.slug}/${safeSection}/${safeField}-${Date.now()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
    if (uploadError) {
      return NextResponse.json({ error: "Upload failed", details: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json(
      { ok: true, bucket, path, sectionId, field, itemId: itemId || null, url: publicData.publicUrl },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
    );
  } catch (error) {
    const api = apiErrorResponse(error);
    return NextResponse.json(api.body, { status: api.status });
  }
}
