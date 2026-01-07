"use client";

import { useEffect } from "react";

const inViewport = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const offset = window.innerHeight * 0.1;
  return rect.bottom > offset && rect.top < window.innerHeight - offset;
};

const isValidTarget = (el: HTMLElement) =>
  el.tagName !== "NAV" &&
  el.tagName !== "HEADER" &&
  el.tagName !== "SCRIPT" &&
  el.offsetHeight > 0;

export default function ScrollReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const revealItems = new Set<HTMLElement>();
    document
      .querySelectorAll<HTMLElement>(".reveal")
      .forEach((el) => revealItems.add(el));
    document
      .querySelectorAll<HTMLElement>("section, article, footer")
      .forEach((el) => revealItems.add(el));

    const items = Array.from(revealItems).filter(isValidTarget);
    if (!items.length) {
      return;
    }

    items.forEach((item) => {
      if (!item.classList.contains("reveal")) {
        item.classList.add("auto-reveal");
      }

      if (inViewport(item)) {
        item.classList.remove("is-hidden");
      } else {
        item.classList.add("is-hidden");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("is-hidden");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return null;
}
