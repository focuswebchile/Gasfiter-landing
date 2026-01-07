"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    if (!items.length) {
      return;
    }

    const inViewport = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const offset = window.innerHeight * 0.1;
      return rect.bottom > offset && rect.top < window.innerHeight - offset;
    };

    const prepare = (el: HTMLElement, visible: boolean) => {
      el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
      if (visible) {
        el.style.opacity = "1";
        el.style.transform = "none";
        el.classList.add("is-visible");
      } else {
        el.style.opacity = "0";
        el.style.transform = "translateY(16px)";
      }
    };

    items.forEach((item) => prepare(item, inViewport(item)));

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "none";
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
