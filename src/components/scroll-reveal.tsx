"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    document.documentElement.classList.remove("no-js");
    if (!items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
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
      observer.disconnect();
    };
  }, []);

  return null;
}
