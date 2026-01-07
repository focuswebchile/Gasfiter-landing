"use client";

import { useEffect } from "react";

const inViewport = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const offset = window.innerHeight * 0.1;
  return rect.bottom > offset && rect.top < window.innerHeight - offset;
};

const isValidTarget = (el: HTMLElement) =>
  !el.hasAttribute("data-no-reveal") &&
  el.tagName !== "NAV" &&
  el.tagName !== "SCRIPT" &&
  el.offsetHeight > 0;

export default function ScrollReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const seen = new WeakSet<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            entry.target.classList.remove("is-hidden");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    const register = () => {
      const revealItems = new Set<HTMLElement>();
      document
        .querySelectorAll<HTMLElement>(".reveal")
        .forEach((el) => revealItems.add(el));
      document
        .querySelectorAll<HTMLElement>(
          "section, article, footer, header, [data-builder-block], main > *"
        )
        .forEach((el) => revealItems.add(el));

      const items = Array.from(revealItems).filter(isValidTarget);
      items.forEach((item) => {
        if (seen.has(item)) {
          return;
        }
        seen.add(item);

        if (!item.classList.contains("reveal")) {
          item.classList.add("auto-reveal");
        }

        if (item.classList.contains("is-visible")) {
          return;
        }

        if (inViewport(item)) {
          item.classList.add("reveal-init");
          item.classList.add("is-hidden");
          requestAnimationFrame(() => {
            item.classList.remove("reveal-init");
            item.classList.add("is-visible");
            item.classList.remove("is-hidden");
          });
        } else {
          item.classList.add("is-hidden");
        }

        observer.observe(item);
      });
    };

    register();
    const timer = window.setTimeout(register, 1000);

    const mutation = new MutationObserver(() => register());
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer);
      mutation.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
