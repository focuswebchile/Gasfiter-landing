"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    document.body.classList.add("js-reveal");
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    if (!items.length) {
      document.body.classList.remove("js-reveal");
      return;
    }

    const revealAll = () => {
      items.forEach((item) => item.classList.add("is-visible"));
      document.body.classList.remove("js-reveal");
    };

    if (!("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    items.forEach((item) => observer.observe(item));

    const fallbackTimer = window.setTimeout(revealAll, 800);

    return () => {
      document.body.classList.remove("js-reveal");
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  return null;
}
