import DynamicLanding from "@/components/dynamic-landing";
import type { CmsSettings } from "@/lib/cms-settings-client";
import { extractSettingsFromSnapshot, getSiteBySlug } from "@/lib/site-versions";
import { createAdminSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getInitialPublishedSettings(): Promise<CmsSettings | null> {
  try {
    const supabase = createAdminSupabaseClient();
    const siteSlug = process.env.NEXT_PUBLIC_SITE_SLUG?.trim() || "gasfiter-staging";
    const site = await getSiteBySlug(supabase, siteSlug);

    const { data, error } = await supabase
      .from("site_versions")
      .select("snapshot")
      .eq("site_id", site.id)
      .eq("status", "published")
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.snapshot || typeof data.snapshot !== "object") {
      return null;
    }

    return extractSettingsFromSnapshot(data.snapshot as Record<string, unknown>) as CmsSettings | null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const initialSettings = await getInitialPublishedSettings();
  return <DynamicLanding initialSettings={initialSettings} />;
}
