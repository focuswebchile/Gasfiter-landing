"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    document.body.classList.add("js-reveal");
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    if (!items.length) {
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

    return () => {
      document.body.classList.remove("js-reveal");
      observer.disconnect();
    };
  }, []);

  return null;
}
