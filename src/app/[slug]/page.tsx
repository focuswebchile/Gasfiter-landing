import { notFound, redirect } from "next/navigation";

import { LANDING_ROUTE_TO_HASH } from "@/lib/landing-routes";

export default async function LandingAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hash = LANDING_ROUTE_TO_HASH[slug];

  if (!hash) {
    notFound();
  }

  redirect(`/#${hash}`);
}
