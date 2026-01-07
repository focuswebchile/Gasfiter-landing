"use client";

import { BuilderComponent, builder } from "@builder.io/react";
import type { BuilderContent } from "@builder.io/sdk";
import { useEffect, useState } from "react";
import LandingFallback from "./landing-fallback";
import ScrollReveal from "./scroll-reveal";

type BuilderBlock = {
  component?: {
    name?: string;
    options?: {
      text?: string;
      src?: string;
      href?: string;
      url?: string;
    };
  };
  text?: string;
  children?: BuilderBlock[];
};

const apiKey = process.env.NEXT_PUBLIC_BUILDER_API_KEY || "";

if (apiKey) {
  builder.init(apiKey);
}

const hasRenderableBlocks = (blocks: BuilderBlock[]): boolean => {
  for (const block of blocks) {
    const text =
      typeof block.component?.options?.text === "string"
        ? block.component?.options?.text
        : typeof block.text === "string"
        ? block.text
        : "";
    if (text.trim().length > 0) {
      return true;
    }

    if (
      block.component?.options?.src ||
      block.component?.options?.href ||
      block.component?.options?.url
    ) {
      return true;
    }

    if (block.children && hasRenderableBlocks(block.children)) {
      return true;
    }
  }

  return false;
};

export default function BuilderPage() {
  const [content, setContent] = useState<BuilderContent | null | undefined>(undefined);

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
    return (
      <>
        <LandingFallback showNotice />
        <ScrollReveal />
      </>
    );
  }

  const blocks = content?.data?.blocks as BuilderBlock[] | undefined;
  const hasBlocks =
    !!content &&
    Array.isArray(blocks) &&
    blocks.length > 0 &&
    hasRenderableBlocks(blocks);

  if (!hasBlocks) {
    return (
      <>
        <LandingFallback />
        <ScrollReveal />
      </>
    );
  }

  return (
    <>
      <BuilderComponent model="page" content={content} />
      <ScrollReveal />
    </>
  );
}
