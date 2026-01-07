"use client";

import { BuilderComponent, builder } from "@builder.io/react";
import { useEffect, useState } from "react";
import LandingFallback from "./landing-fallback";

type BuilderContent = {
  id?: string;
  data?: {
    blocks?: unknown[];
  };
};

const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || "";

if (apiKey) {
  builder.init(apiKey);
}

export default function BuilderPage() {
  const [content, setContent] = useState<BuilderContent | null | undefined>(
    undefined
  );

  useEffect(() => {
    if (!apiKey) {
      setContent(null);
      return;
    }

    builder
      .get("page", {
        userAttributes: {
          urlPath: window.location.pathname,
        },
      })
      .promise()
      .then((data) => setContent(data || null))
      .catch(() => setContent(null));
  }, []);

  if (!apiKey) {
    return <LandingFallback showNotice />;
  }

  const hasBlocks =
    !!content &&
    Array.isArray(content.data?.blocks) &&
    content.data?.blocks.length > 0;

  if (!hasBlocks) {
    return <LandingFallback />;
  }

  return <BuilderComponent model="page" content={content} />;
}
