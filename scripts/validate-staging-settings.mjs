#!/usr/bin/env node

/*
  Validate staging settings endpoint response.
  Usage:
    node scripts/validate-staging-settings.mjs
    BASE_URL=http://localhost:3000 SITE_SLUG=gasfiter-staging node scripts/validate-staging-settings.mjs
*/

const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
const slug = process.env.SITE_SLUG || process.env.NEXT_PUBLIC_SITE_SLUG || "gasfiter-staging";
const url = `${baseUrl.replace(/\/$/, "")}/api/sites/${slug}/settings`;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`✅ ${message}`);
}

try {
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    const body = await response.text();
    fail(`HTTP ${response.status} from ${url}\n${body}`);
  }

  const payload = await response.json();

  if (!payload?.site?.slug) fail("Missing site.slug");
  if (payload.site.slug !== slug) fail(`site.slug mismatch: expected '${slug}', got '${payload.site.slug}'`);
  ok(`site.slug = ${payload.site.slug}`);

  if (!payload?.settings?.colors) fail("Missing settings.colors");
  ok("settings.colors present");

  if (!payload?.settings?.typography) fail("Missing settings.typography");
  ok("settings.typography present");

  const sections = payload?.settings?.content?.sections;
  if (!Array.isArray(sections)) fail("settings.content.sections is not an array");
  ok(`sections[] present (${sections.length})`);

  const hero = sections.find((section) => section?.id === "hero");
  if (!hero) fail("Hero section not found in sections[]");
  if (hero.enabled !== true) fail("Hero section exists but is not enabled");
  ok("hero section exists and enabled=true");

  console.log("\n🎉 Staging endpoint validation passed.");
  console.log(`Endpoint: ${url}`);
  process.exit(0);
} catch (error) {
  fail(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
}
