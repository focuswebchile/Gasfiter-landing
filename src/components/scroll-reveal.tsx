"use client";

import { useEffect } from "react";

const inViewport = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const offset = window.innerHeight * 0.1;
  return rect.bottom > offset && rect.top < window.innerHeight - offset;
};

export default function ScrollReveal() {
  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal")
    );
    if (!items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      return;
    }

    items.forEach((item) => {
      const visible = inViewport(item);
      if (visible) {
        item.classList.add("is-visible");
      } else {
        item.classList.remove("is-visible");
      }
      item.classList.add("reveal-ready");
    });

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

    return () => observer.disconnect();
  }, []);

  return null;
}
