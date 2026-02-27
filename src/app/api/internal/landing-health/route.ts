import { NextResponse } from "next/server";
import { runLandingSanityChecks } from "@/lib/landing-health";
import { settingsSchema, type SettingsPayload } from "@/lib/settings-schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseMode(input: string | null): "draft" | "published" {
  return input?.toLowerCase() === "draft" ? "draft" : "published";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim() || process.env.NEXT_PUBLIC_SITE_SLUG?.trim() || "";
    const mode = parseMode(url.searchParams.get("mode"));

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug. Use ?slug=your-site-slug" },
        { status: 400 },
      );
    }

    const settingsUrl = new URL(`/api/sites/${encodeURIComponent(slug)}/settings`, url.origin);
    settingsUrl.searchParams.set("mode", mode);
    settingsUrl.searchParams.set("t", Date.now().toString());

    const settingsResponse = await fetch(settingsUrl.toString(), {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });

    const raw = (await settingsResponse.json()) as {
      site?: { slug?: string; name?: string; status?: string };
      settings?: unknown;
      error?: string;
      details?: string;
    };

    if (!settingsResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          site: raw.site ?? { slug },
          mode,
          upstream: {
            status: settingsResponse.status,
            error: raw.error ?? "Unable to read settings",
            details: raw.details ?? null,
          },
          errors: [
            {
              severity: "error",
              code: "UPSTREAM_SETTINGS_ERROR",
              path: "api/sites/[slug]/settings",
              message: raw.error ?? "Upstream settings endpoint failed.",
            },
          ],
          warnings: [],
          fallback_used: [],
        },
        { status: settingsResponse.status },
      );
    }

    const parsedSettings = settingsSchema.safeParse(raw.settings);
    const settings: SettingsPayload | null = parsedSettings.success ? parsedSettings.data : null;
    const health = runLandingSanityChecks(settings);

    const schemaWarnings = parsedSettings.success
      ? []
      : parsedSettings.error.issues.map((issue) => ({
          severity: "warning" as const,
          code: "SCHEMA_VALIDATION_WARNING",
          path: issue.path.join("."),
          message: issue.message,
        }));

    return NextResponse.json(
      {
        ok: health.ok && schemaWarnings.length === 0,
        site: raw.site ?? { slug, status: mode },
        mode,
        checks: health.checks,
        errors: health.errors,
        warnings: [...health.warnings, ...schemaWarnings],
        fallback_used: health.fallback_used,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to run landing health checks",
        details: message,
      },
      { status: 500 },
    );
  }
}
