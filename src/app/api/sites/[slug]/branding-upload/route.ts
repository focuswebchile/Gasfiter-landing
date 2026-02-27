import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import {
  apiErrorResponse,
  getSiteBySlug,
  parseOptionalUuid,
  requireSiteRole,
} from "@/lib/site-versions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const FAVICON_MAX_BYTES = 1 * 1024 * 1024;
const defaultBucket = "branding-assets";

function guessExt(file: File, assetType: "logo" | "favicon") {
  const byType = file.type.toLowerCase();
  if (byType.includes("png")) return "png";
  if (byType.includes("jpeg") || byType.includes("jpg")) return "jpg";
  if (byType.includes("webp")) return "webp";
  if (byType.includes("svg")) return "svg";
  if (byType.includes("x-icon") || byType.includes("ico")) return "ico";
  return assetType === "favicon" ? "ico" : "png";
}

function isAllowed(file: File, assetType: "logo" | "favicon") {
  const mime = file.type.toLowerCase();
  if (assetType === "logo") {
    return (
      mime === "image/png" ||
      mime === "image/jpeg" ||
      mime === "image/jpg" ||
      mime === "image/webp" ||
      mime === "image/svg+xml"
    );
  }
  return mime === "image/png" || mime === "image/x-icon" || mime === "image/vnd.microsoft.icon";
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const form = await request.formData();
    const userIdRaw = form.get("userId");
    const assetTypeRaw = form.get("assetType");
    const file = form.get("file");

    const userId = parseOptionalUuid(typeof userIdRaw === "string" ? userIdRaw : null);
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (assetTypeRaw !== "logo" && assetTypeRaw !== "favicon") {
      return NextResponse.json({ error: "Invalid assetType. Use logo|favicon" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!isAllowed(file, assetTypeRaw)) {
      return NextResponse.json(
        { error: "Invalid file type", details: "Allowed: logo(png,jpg,webp,svg), favicon(png,ico)" },
        { status: 400 },
      );
    }

    const maxBytes = assetTypeRaw === "logo" ? LOGO_MAX_BYTES : FAVICON_MAX_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "File too large", details: `${assetTypeRaw} max ${Math.round(maxBytes / 1024 / 1024)}MB` },
        { status: 400 },
      );
    }

    const supabase = createAdminSupabaseClient();
    const site = await getSiteBySlug(supabase, slug);
    await requireSiteRole(supabase, site.id, userId, ["owner", "admin", "editor"]);

    const bucket = process.env.SUPABASE_BRANDING_BUCKET?.trim() || defaultBucket;
    const ext = guessExt(file, assetTypeRaw);
    const path = `sites/${site.slug}/${assetTypeRaw}-${Date.now()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
    if (uploadError) {
      return NextResponse.json(
        { error: "Upload failed", details: uploadError.message },
        { status: 500 },
      );
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json(
      {
        ok: true,
        assetType: assetTypeRaw,
        bucket,
        path,
        url: publicData.publicUrl,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  } catch (error) {
    const api = apiErrorResponse(error);
    return NextResponse.json(api.body, { status: api.status });
  }
}

