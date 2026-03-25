"use client";

import { useEffect } from "react";
import { Inter, Oswald } from "next/font/google";
import {
  resolveContactBannerFromSettings,
  fetchSettingsBySlug,
  resolveAudienceFromSettings,
  resolveFaqFromSettings,
  resolveHeroFromSettings,
  resolveProcessFromSettings,
  resolveProjectsFromSettings,
  resolveServicesFromSettings,
  resolveTestimonialsFromSettings,
  resolveTrustFromSettings,
  resolveUrgencyFromSettings,
  type CmsSettings,
  type ResolvedHero,
} from "@/lib/cms-settings-client";

const landingBodyFont = Inter({
  subsets: ["latin"],
  variable: "--landing-body-font",
  display: "swap",
});

const landingDisplayFont = Oswald({
  subsets: ["latin"],
  variable: "--landing-display-font",
  display: "swap",
  weight: ["500", "600", "700"],
});

const landingStyles = String.raw`
      .landing-shell {
        --navy: #0c4a6e;
        --blue: #2b6cb0;
        --orange: #f59e0b;
        --text: #102033;
        --muted: #516173;
        --bg: #f4f7fb;
        --surface: #ffffff;
        --surface-alt: #eaf2fb;
        --border-soft: #d6e2f0;
        --wa: #25d366;
        --btn-shadow: 0 12px 26px rgba(15, 23, 42, 0.16);
        --landing-font-body: var(--landing-body-font), "Inter", system-ui, sans-serif;
        --landing-font-hero: var(--landing-display-font), "Oswald", sans-serif;
        --font-size-base: 16px;
        --line-height-base: 1.5;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: hidden;
      }

      body {
        font-family: var(--landing-font-body);
        font-size: var(--font-size-base);
        line-height: var(--line-height-base);
        color: var(--text);
        background: var(--bg);
      }

      h1,
      h2,
      h3 {
        margin: 0;
        line-height: 1.05;
        letter-spacing: 0.2px;
        font-family: var(--landing-font-hero) !important;
      }

      p {
        margin: 0;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .section {
        width: 100%;
        padding: 88px 20px;
      }

      .landing-shell {
        visibility: visible;
        opacity: 1;
      }

      .landing-shell.is-ready {
        transition: opacity 0.18s ease;
      }

      .icon-fallback-active i.fa-solid,
      .icon-fallback-active i.fa-brands {
        font-family: inherit !important;
        font-style: normal;
        font-weight: 700;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .top-nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 950;
        background: transparent;
        backdrop-filter: none;
        border-bottom: 0;
        box-shadow: none;
        transition:
          background 0.25s ease,
          border-color 0.25s ease,
          box-shadow 0.25s ease,
          opacity 0.25s ease,
          transform 0.25s ease;
      }

      .top-nav.nav--visible {
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
      }

      .top-nav-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 20px;
        width: 100%;
      }

      .brand {
        font-family: var(--landing-font-hero) !important;
        font-size: 1.65rem;
        font-weight: 700;
        color: var(--navy);
      }

      .footer-brand {
        display: inline-flex;
        align-items: center;
        margin-bottom: 10px;
        font-size: 1.15rem;
        color: #f8fafc;
      }

      .nav-links {
        display: none;
        align-items: center;
        gap: 18px;
        color: #334155;
        font-size: 14px;
        font-weight: 600;
      }

      .nav-links a:hover {
        color: var(--navy);
      }

      .container {
        width: 100%;
        max-width: 1240px;
        margin: 0 auto;
      }

      .btn {
        border: 0;
        border-radius: 14px;
        padding: 14px 20px;
        font-weight: 800;
        font-size: 15px;
        letter-spacing: 0.3px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        box-shadow: var(--btn-shadow);
      }

      .btn:hover {
        transform: translateY(-2px);
      }

      .btn-primary {
        background: linear-gradient(180deg, #1d5f92 0%, #0c4a6e 100%);
        color: #f8fbff;
      }

      .btn-ghost {
        background: rgba(43, 108, 176, 0.06);
        color: var(--navy);
        border: 2px solid rgba(43, 108, 176, 0.18);
      }

      .hero {
        min-height: 100vh;
        width: 100%;
        padding: 0;
        background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
        overflow: hidden;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: 1fr;
        min-height: 100vh;
        width: 100%;
      }

      .hero-media {
        position: relative;
        margin: 0;
        height: 100%;
        background: transparent;
      }

      .hero-media img {
        width: 100%;
        height: 52vh;
        object-fit: cover;
        object-position: 28% center;
        display: block;
      }

      .hero-content {
        padding: 28px 20px 34px;
        background: linear-gradient(180deg, #f7fbff 0%, #edf4fb 100%);
      }

      .hero-content-inner {
        width: 100%;
        max-width: 820px;
      }

      .hero-content .eyebrow {
        margin-top: 4px;
      }

      .eyebrow {
        display: inline-flex;
        background: rgba(245, 158, 11, 0.12);
        color: #b45309;
        border: 1px solid rgba(245, 158, 11, 0.32);
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      .eyebrow[data-pending="true"] {
        opacity: 0;
      }

      .hero h1 {
        margin-top: 12px;
        font-size: clamp(2.1rem, 7.6vw, 4.45rem);
        color: var(--text);
        max-width: none;
        letter-spacing: -0.02em;
        line-height: 0.98;
        font-family: var(--landing-font-hero) !important;
        visibility: visible;
      }
      .hero-lead[data-pending="true"] {
        opacity: 0;
      }

      .hero-line {
        display: block;
        font-family: var(--landing-font-hero) !important;
      }

      .hero-lead {
        margin-top: 14px;
        font-size: clamp(1rem, 2.4vw, 1.22rem);
        color: var(--muted);
        max-width: 54ch;
      }

      .badges {
        margin-top: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .badge {
        background: #ffffff;
        border: 1px solid #dbe3ef;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
        color: var(--navy);
        padding: 9px 13px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      .badge i {
        font-size: 15px;
      }

      .hero-cta {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .hero-cta .btn {
        width: 100%;
        min-height: 54px;
        font-size: 1.02rem;
      }

      .hero-cta .btn i {
        font-size: 1.2rem;
      }

      .hero-visual {
        display: block;
      }

      .hero-stats {
        margin-top: 44px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
        transform: translateY(0);
      }

      .hero-stat {
        border-top: 1px solid #dbe3ef;
        padding-top: 14px;
        padding-left: 0;
      }

      .hero-stat strong {
        display: block;
        font-family: var(--landing-font-hero);
        font-size: 1rem;
        line-height: 1.08;
        letter-spacing: -0.01em;
        color: var(--navy);
      }

      .hero-stat span {
        display: block;
        margin-top: 6px;
        font-size: 0.9rem;
        line-height: 1.55;
        color: #516173;
        font-weight: 500;
        max-width: 28ch;
      }

      .hero-visual img {
        width: 100%;
        height: min(75vh, 620px);
        object-fit: cover;
        display: block;
      }

      .floating {
        position: absolute;
        left: 16px;
        bottom: 16px;
        background: #ffffff;
        color: var(--navy);
        border-radius: 14px;
        padding: 10px 14px;
        font-weight: 800;
        font-size: 13px;
        box-shadow: 0 12px 30px rgba(10, 22, 40, 0.2);
      }

      .band-dark {
        background: var(--surface);
        color: var(--text);
      }

      .audience-wrap {
        display: grid;
        grid-template-columns: 1fr;
        gap: 22px;
        align-items: center;
      }

      .audience-copy {
        text-align: left;
      }

      .audience-kicker {
        display: inline-block;
        background: rgba(255, 111, 0, 0.12);
        border: 1px solid rgba(255, 111, 0, 0.28);
        color: var(--orange);
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        margin-bottom: 10px;
      }

      .audience-copy h2 {
        font-size: clamp(1.92rem, 4.5vw, 3.65rem);
        line-height: 1.02;
        letter-spacing: -0.02em;
        color: var(--navy);
        max-width: 13ch;
      }

      .audience-copy p {
        margin-top: 12px;
        font-size: clamp(1rem, 2.1vw, 1.2rem);
        font-weight: 500;
        line-height: 1.6;
        color: var(--muted);
        max-width: 62ch;
      }

      .audience-list {
        margin: 16px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
      }

      .audience-list li {
        font-size: 1rem;
        color: var(--text);
      }

      .audience-list i {
        margin-right: 8px;
        color: var(--orange);
      }

      .audience-cta {
        margin-top: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .audience-visual {
        display: grid;
        gap: 12px;
      }

      .audience-image {
        width: 100%;
        height: 230px;
        object-fit: cover;
        display: block;
        border-radius: 18px;
        box-shadow: 0 18px 38px rgba(3, 10, 20, 0.18);
      }

      .audience-image-back {
        height: 320px;
      }

      .audience-image-front {
        height: 250px;
      }

      .pain-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 28px;
        align-items: center;
      }

      .pain-grid img {
        width: 100%;
        border-radius: 24px;
        min-height: 300px;
        object-fit: cover;
      }

      .pain-copy h2 {
        color: var(--navy);
        font-size: clamp(2rem, 5vw, 3.4rem);
      }

      .pain-copy p {
        margin-top: 12px;
        color: var(--muted);
        font-size: 1.05rem;
      }

      .about-grid {
        display: grid;
        gap: 36px;
        align-items: center;
      }

      .about-copy {
        display: grid;
        gap: 22px;
        max-width: 720px;
      }

      .about-copy h2,
      .trust-section h2,
      .process-section h2,
      .experience-section h2 {
        font-size: clamp(2.2rem, 4vw, 3.45rem);
        line-height: 1.02;
        letter-spacing: -0.04em;
        color: var(--navy);
      }

      .about-copy h2 {
        max-width: 18ch;
      }

      .about-copy p {
        max-width: 58ch;
        margin: 0;
        color: #334155;
        font-size: 1.04rem;
        line-height: 1.65;
      }

      .about-points {
        display: grid;
        gap: 18px;
        max-width: 56ch;
      }

      .about-point {
        position: relative;
        display: grid;
        gap: 6px;
        padding-left: 22px;
      }

      .about-point::before {
        content: "";
        position: absolute;
        left: 0;
        top: 4px;
        bottom: 4px;
        width: 3px;
        border-radius: 999px;
        background: linear-gradient(180deg, var(--orange), var(--blue));
      }

      .about-point strong {
        color: var(--navy);
        font-size: 1.12rem;
        letter-spacing: -0.02em;
      }

      .about-point span {
        color: #516173;
        line-height: 1.55;
      }

      .about-visual {
        position: relative;
        min-height: 620px;
      }

      .about-image {
        position: absolute;
        overflow: hidden;
        border-radius: 30px;
        box-shadow: 0 30px 70px rgba(15, 23, 42, 0.16);
      }

      .about-image img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .about-image-primary {
        top: 0;
        right: 0;
        width: min(100%, 520px);
        height: 440px;
      }

      .about-image-secondary {
        left: 0;
        bottom: 0;
        width: min(72%, 320px);
        height: 220px;
        border: 8px solid rgba(255, 255, 255, 0.96);
      }

      .about-badge {
        position: absolute;
        right: 18px;
        bottom: 20px;
        display: grid;
        gap: 4px;
        padding: 18px 20px;
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(12, 74, 110, 0.96), rgba(16, 32, 51, 0.98));
        color: #f8fbff;
        box-shadow: 0 22px 45px rgba(15, 23, 42, 0.22);
        max-width: 220px;
      }

      .about-badge strong {
        font-family: var(--landing-font-hero);
        font-size: 2rem;
        line-height: 0.95;
        letter-spacing: -0.04em;
      }

      .about-badge span {
        color: rgba(248, 251, 255, 0.82);
        font-size: 0.92rem;
        line-height: 1.4;
      }

      .trust-section {
        background: linear-gradient(180deg, rgba(234, 242, 251, 0.42) 0%, rgba(248, 251, 255, 0.98) 100%);
        overflow: hidden;
      }

      .trust-split {
        display: grid;
        align-items: center;
        gap: 28px;
        max-width: 1240px;
        margin: 0 auto;
        padding: 0 20px;
      }

      .trust-media-bleed {
        position: relative;
        width: 100%;
        max-width: 100%;
        min-height: 500px;
        aspect-ratio: 1.04 / 0.88;
        margin: 0;
        overflow: hidden;
        border-radius: 34px;
        box-shadow: 0 24px 48px rgba(15, 23, 42, 0.12);
      }

      .trust-media-bleed::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(0deg, rgba(12, 74, 110, 0.16), rgba(12, 74, 110, 0.04));
      }

      .trust-media-bleed img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .trust-content-column {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
      }

      .trust-content-inner {
        width: 100%;
        padding-top: clamp(32px, 5vw, 74px);
        padding-bottom: clamp(32px, 5vw, 74px);
        padding-left: clamp(6px, 1.6vw, 18px);
        padding-right: clamp(6px, 1.6vw, 18px);
      }

      .trust-info {
        display: grid;
        gap: 18px;
        max-width: 560px;
      }

      .trust-info .section-kicker {
        text-transform: none;
        letter-spacing: -0.01em;
      }

      .trust-info h2 {
        font-size: clamp(1.82rem, 2.75vw, 2.5rem);
        line-height: 1.04;
        letter-spacing: -0.02em;
        color: var(--navy);
        max-width: 18ch;
      }

      .trust-info .section-subtitle {
        max-width: 54ch;
      }

      .trust-bullets {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }

      .trust-bullets li {
        display: flex;
        gap: 10px;
        align-items: center;
        color: var(--text);
        font-weight: 600;
      }

      .trust-bullets i {
        color: var(--blue);
      }

      .trust-proof {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 14px;
      }

      .trust-proof-logo {
        display: block;
        width: min(100%, 170px);
        height: auto;
        border-radius: 20px;
        border: 1px solid rgba(12, 74, 110, 0.12);
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
      }

      .process-layout {
        display: grid;
        gap: 34px;
        align-items: center;
      }

      .process-media {
        margin: 0;
        overflow: hidden;
        border-radius: 34px;
        width: 100%;
        max-width: 100%;
        min-height: 520px;
        aspect-ratio: 1.02 / 1;
        align-self: stretch;
        box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14);
      }

      .process-media img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }

      .process-content {
        display: grid;
        min-width: 0;
        gap: 34px;
      }

      .process-head {
        max-width: 720px;
        display: grid;
        gap: 18px;
      }

      .process-timeline {
        position: relative;
        display: grid;
        gap: 24px;
      }

      .process-timeline::before {
        content: "";
        position: absolute;
        left: 24px;
        top: 14px;
        bottom: -10px;
        width: 2px;
        background: linear-gradient(180deg, rgba(43, 108, 176, 0.18), rgba(12, 74, 110, 0.42));
      }

      .process-step {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 18px;
        align-items: start;
      }

      .process-step:last-child::after {
        content: none;
      }

      .process-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        border-radius: 999px;
        background: linear-gradient(180deg, #2b6cb0 0%, #0c4a6e 100%);
        color: #f8fbff;
        font-family: var(--landing-font-hero);
        font-size: 1.25rem;
        letter-spacing: -0.03em;
        box-shadow: 0 14px 24px rgba(12, 74, 110, 0.18);
        flex-shrink: 0;
      }

      .process-step-copy {
        display: grid;
        gap: 8px;
        padding: 4px 0 0;
      }

      .process-step h3 {
        margin: 0;
        color: var(--navy);
        font-size: 1.32rem;
        line-height: 1.08;
      }

      .process-step p {
        margin: 0;
        color: #516173;
        line-height: 1.7;
        max-width: 54ch;
      }

      .trust-metrics-section {
        padding-top: 26px;
        padding-bottom: 34px;
        background: linear-gradient(180deg, rgba(248, 251, 255, 0.98) 0%, rgba(244, 247, 251, 0.94) 100%);
      }

      .trust-metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0;
        border-top: 1px solid rgba(148, 163, 184, 0.2);
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
      }

      .trust-metric {
        position: relative;
        min-height: 170px;
        display: grid;
        place-items: center;
        overflow: hidden;
        text-align: center;
        isolation: isolate;
      }

      .trust-metric::before {
        content: attr(data-shadow);
      }

      .trust-metric + .trust-metric {
        border-left: 1px solid rgba(148, 163, 184, 0.2);
      }

      .trust-metric-number {
        position: absolute;
        inset: 50% auto auto 50%;
        transform: translate(-50%, -58%);
        font-family: var(--landing-font-hero);
        font-size: clamp(4.4rem, 12vw, 7.6rem);
        line-height: 0.9;
        letter-spacing: -0.06em;
        color: rgba(15, 23, 42, 0.06);
        z-index: 0;
        user-select: none;
        pointer-events: none;
      }

      .trust-metric-label {
        position: relative;
        z-index: 1;
        color: var(--navy);
        font-family: var(--landing-font-hero);
        font-size: clamp(1.8rem, 3vw, 2.6rem);
        line-height: 0.96;
        letter-spacing: -0.03em;
      }

            .projects-section {
        background: var(--bg);
      }

      .projects-head {
        display: grid;
        gap: 14px;
        align-items: center;
      }

      .services-head {
        display: grid;
        gap: 14px;
        margin-bottom: 18px;
      }

      [data-services-title] {
        display: block;
        margin: 0;
      }

      [data-services-subtitle] {
        margin: 0;
        font-size: clamp(1.18rem, 2.2vw, 1.38rem);
        line-height: 1.65;
        color: #415164;
      }

      .projects-head-centered {
        justify-items: center;
        text-align: center;
        margin-inline: auto;
        max-width: 920px;
      }

      .projects-head h2 {
        font-size: clamp(2.65rem, 5.4vw, 4.6rem);
        color: var(--text);
        line-height: 0.98;
        letter-spacing: -0.03em;
        max-width: none;
        white-space: nowrap;
      }

      .projects-wrap {
        margin-top: 56px;
        width: 100%;
        padding: 0 clamp(18px, 3.2vw, 48px);
        overflow: hidden;
      }

      .projects-double-marquee {
        display: grid;
        gap: 20px;
      }

      .projects-marquee-row {
        overflow: hidden;
      }

      .projects-marquee {
        display: flex;
        width: max-content;
        animation: projects-marquee 42s linear infinite;
        will-change: transform;
      }

      .projects-marquee-group {
        display: flex;
        gap: 22px;
        flex-shrink: 0;
        padding-right: 22px;
      }

      .projects-marquee-row.reverse .projects-marquee {
        animation-direction: reverse;
      }

      .projects-marquee-row:hover .projects-marquee {
        animation-play-state: paused;
      }

      @keyframes projects-marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }

      .project-card {
        position: relative;
        flex: 0 0 clamp(290px, 24vw, 360px);
        aspect-ratio: 1 / 1;
        border-radius: 24px;
        overflow: hidden;
        user-select: none;
      }

      .project-card-wide {
        flex-basis: clamp(420px, 34vw, 560px);
        aspect-ratio: 16 / 10;
      }

      .project-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
      }

      .project-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(6, 12, 24, 0.18), rgba(6, 12, 24, 0.7));
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        text-align: left;
        padding: 22px;
        transition: opacity 0.22s ease, transform 0.22s ease;
      }

      .project-overlay strong {
        display: block;
        color: #ffffff;
        font-size: clamp(1.2rem, 1.8vw, 1.75rem);
        line-height: 1.02;
        font-family: var(--landing-font-hero);
        font-weight: 700;
        max-width: 16ch;
        text-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
      }

      .project-overlay span {
        display: block;
        margin-top: 6px;
        color: rgba(233, 239, 249, 0.95);
        font-size: 0.98rem;
      }

      @media (hover: hover) and (pointer: fine) {
        .project-overlay {
          opacity: 0;
          transform: scale(1.01);
          pointer-events: none;
        }

        .project-card:hover .project-overlay,
        .project-card:focus-within .project-overlay {
          opacity: 1;
          transform: none;
        }
      }

.clients-section {
        background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
      }

      .clients-section .container {
        max-width: 1180px;
      }

      .clients-head-centered {
        text-align: center;
      }

      .clients-title {
        font-size: clamp(2.35rem, 4.8vw, 4.1rem);
        color: var(--text);
        line-height: 1;
        letter-spacing: -0.02em;
        max-width: none;
        margin-left: auto;
        margin-right: auto;
        white-space: nowrap;
      }

      .clients-carousel-shell {
        margin-top: 44px;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        align-items: center;
        gap: 0;
      }

      .clients-viewport {
        --clients-drag-offset: 0px;
        --clients-side-offset: clamp(250px, 24vw, 330px);
        position: relative;
        overflow: hidden;
        min-height: 520px;
        cursor: grab;
        touch-action: pan-y;
      }

      .clients-viewport.is-dragging {
        cursor: grabbing;
      }

      .clients-stage {
        position: relative;
        height: 520px;
      }

      .client-slide {
        position: absolute;
        top: 50%;
        left: 50%;
        width: min(100%, 430px);
        min-height: 390px;
        padding: 34px 30px 30px;
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(15, 35, 58, 0.08);
        box-shadow: 0 18px 44px rgba(9, 22, 43, 0.08);
        transition: transform 0.28s ease, opacity 0.28s ease, filter 0.28s ease, box-shadow 0.28s ease;
        transform-origin: center;
        user-select: none;
        -webkit-user-select: none;
        display: flex;
        flex-direction: column;
        cursor: pointer;
      }

      .client-slide::before {
        content: "“";
        position: absolute;
        top: 22px;
        left: 26px;
        color: rgba(12, 74, 110, 0.18);
        font-family: var(--landing-font-hero);
        font-size: 4.2rem;
        line-height: 1;
      }

      .client-slide-head {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 74px;
      }

      .client-slide-head img {
        width: 72px;
        height: 72px;
        border-radius: 999px;
        object-fit: cover;
        flex: 0 0 auto;
        border: 3px solid rgba(43, 108, 176, 0.16);
      }

      .client-slide-head strong {
        display: block;
        color: var(--text);
        font-size: 1.15rem;
        line-height: 1.2;
      }

      .client-slide-head span {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 0.95rem;
        line-height: 1.45;
      }

      .client-slide-rating {
        margin-top: 24px;
        display: inline-flex;
        gap: 6px;
        color: #d97706;
        font-size: 0.98rem;
      }

      .client-slide-text {
        margin: 18px 0 0;
        color: var(--text);
        font-size: 1.12rem;
        line-height: 1.78;
        max-width: 29ch;
      }

      .client-slide.is-active {
        transform: translate(calc(-50% + var(--clients-drag-offset)), -50%) scale(1);
        opacity: 1;
        filter: none;
        z-index: 3;
        box-shadow: 0 24px 56px rgba(9, 22, 43, 0.12);
        cursor: default;
      }

      .client-slide.is-prev {
        transform: translate(calc(-50% - var(--clients-side-offset) + var(--clients-drag-offset)), -50%) scale(0.88);
        opacity: 0.68;
        filter: blur(0.2px);
        z-index: 2;
      }

      .client-slide.is-next {
        transform: translate(calc(-50% + var(--clients-side-offset) + var(--clients-drag-offset)), -50%) scale(0.88);
        opacity: 0.68;
        filter: blur(0.2px);
        z-index: 2;
      }

      .client-slide.is-hidden-left {
        transform: translate(calc(-50% - calc(var(--clients-side-offset) * 1.85) + var(--clients-drag-offset)), -50%) scale(0.72);
        opacity: 0;
        z-index: 1;
        pointer-events: none;
      }

      .client-slide.is-hidden-right {
        transform: translate(calc(-50% + calc(var(--clients-side-offset) * 1.85) + var(--clients-drag-offset)), -50%) scale(0.72);
        opacity: 0;
        z-index: 1;
        pointer-events: none;
      }

      .clients-controls {
        margin-top: 28px;
        display: flex;
        justify-content: center;
        gap: 14px;
      }

      .clients-control {
        width: 52px;
        height: 52px;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(180deg, #1d5f92 0%, #0c4a6e 100%);
        color: #f8fbff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 14px 30px rgba(12, 74, 110, 0.2);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
      }

      .clients-control:hover {
        transform: translateY(-1px);
        box-shadow: 0 18px 34px rgba(12, 74, 110, 0.24);
      }

      .clients-control i {
        font-size: 0.95rem;
      }

.payments {
        margin-top: 20px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .pay-badge {
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid #d7e4f8;
        background: #fff;
        font-size: 13px;
        font-weight: 700;
      }

      .footer-payments {
        margin-top: 14px;
        justify-content: flex-start;
      }

      .footer-payments .pay-badge {
        background: rgba(15, 23, 42, 0.16);
        border-color: rgba(148, 163, 184, 0.45);
        color: #e2e8f0;
      }

      .trust-band {
        background:
          radial-gradient(circle at top left, rgba(43, 108, 176, 0.22), transparent 36%),
          linear-gradient(135deg, #081221 0%, #12345a 100%);
        color: #e9f1ff;
      }

      .trust-band-inner {
        display: grid;
        grid-template-columns: 1fr;
        gap: 28px;
        align-items: center;
      }

      .trust-band-copy {
        max-width: 760px;
      }

      .trust-band-kicker {
        display: inline-flex;
        margin-bottom: 12px;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.26);
        background: rgba(255, 255, 255, 0.06);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: #bfd7f2;
      }

      .trust-band h2 {
        font-size: clamp(1.95rem, 4.2vw, 3rem);
        line-height: 1.04;
        letter-spacing: -0.02em;
        color: #f8fbff;
        max-width: 13ch;
      }

      .trust-band p {
        margin-top: 12px;
        max-width: 58ch;
        color: rgba(232, 240, 251, 0.84);
        font-size: 1.04rem;
        line-height: 1.75;
      }

      .trust-band-areas {
        margin-top: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .trust-band-area {
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(191, 215, 242, 0.14);
        color: #eef5ff;
        font-size: 0.94rem;
        font-weight: 700;
      }

      .trust-band-points {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .trust-point {
        padding: 18px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(191, 215, 242, 0.14);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }

      .trust-point strong {
        display: block;
        font-size: 1rem;
        color: #f8fbff;
      }

      .trust-point span {
        display: block;
        margin-top: 8px;
        color: rgba(232, 240, 251, 0.78);
        font-size: 0.95rem;
        line-height: 1.6;
      }

      .form-grid {
        margin-top: 20px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 18px;
      }

      .contact-section {
        position: relative;
        background-image:
          linear-gradient(135deg, rgba(12, 74, 110, 0.96) 0%, rgba(18, 54, 90, 0.96) 100%),
          url("/images/contact.jpg");
        background-position: center, center;
        background-size: cover, cover;
        background-repeat: no-repeat, no-repeat;
        margin-top: clamp(56px, 7vw, 90px);
      }

      .contact-section::before {
        content: "";
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.18);
      }

      .contact-layout {
        position: relative;
        z-index: 1;
        min-height: clamp(560px, 70vh, 760px);
        display: grid;
        align-items: center;
      }

      .contact-card {
        width: min(100%, 760px);
        background: rgba(245, 247, 250, 0.95);
        border: 1px solid rgba(203, 213, 225, 0.75);
        border-radius: 4px;
        padding: 24px 22px;
        box-shadow: 0 24px 48px rgba(2, 12, 27, 0.24);
      }

      .contact-kicker {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--muted);
      }

      .contact-title {
        margin-top: 10px;
        font-size: clamp(1.95rem, 4vw, 3.45rem);
        line-height: 1;
        letter-spacing: -0.02em;
        color: var(--text);
        max-width: none;
        white-space: nowrap;
      }

      .contact-form {
        margin-top: 20px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
      }

      .contact-field {
        width: 100%;
        border: 0;
        border-bottom: 1px solid #cbd5e1;
        background: transparent;
        border-radius: 0;
        padding: 10px 2px;
        font: inherit;
        color: var(--text);
      }

      .contact-field::placeholder {
        color: #8b97ab;
      }

      .contact-field:focus {
        outline: none;
        border-bottom-color: #0f766e;
      }

      .contact-submit {
        margin-top: 4px;
        width: 170px;
        border-radius: 0;
        background: #0f766e;
        color: #ffffff;
      }

      .contact-submit:disabled {
        opacity: 0.72;
        cursor: wait;
      }

      .contact-feedback {
        min-height: 24px;
        margin-top: 10px;
        font-size: 0.95rem;
        line-height: 1.5;
        color: #475569;
      }

      .contact-feedback.is-error {
        color: #b91c1c;
      }

      .contact-feedback.is-success {
        color: #0f766e;
      }

      .benefits {
        background: #f8fbff;
        border: 1px solid #dbe8ff;
        border-radius: 16px;
        padding: 16px;
      }

      .benefits ul {
        margin: 10px 0 0;
        padding-left: 0;
        list-style: none;
      }

      .benefits li {
        padding: 7px 0;
        color: #334155;
      }

      .benefits i {
        color: var(--orange);
        margin-right: 8px;
      }

      .form-wrap {
        background: #fff;
        border: 1px solid #dce6f6;
        border-radius: 16px;
        padding: 16px;
      }

      .form-wrap form {
        display: grid;
        gap: 12px;
      }

      .form-wrap input,
      .form-wrap textarea {
        width: 100%;
        border: 1px solid #cdd9ee;
        border-radius: 12px;
        padding: 12px 13px;
        font: inherit;
      }

      .form-wrap textarea {
        min-height: 110px;
        resize: vertical;
      }

      .btn-blue {
        background: var(--blue);
        color: #fff;
      }

      .faq-list {
        margin-top: 20px;
        display: grid;
        gap: 10px;
        max-width: 760px;
        margin-left: auto;
        margin-right: auto;
      }

      .faq-item {
        border: 1px solid #dce6f8;
        border-radius: 14px;
        background: #fff;
        overflow: hidden;
      }

      .faq-btn {
        width: 100%;
        border: 0;
        background: #fff;
        text-align: left;
        padding: 14px 16px;
        font-weight: 700;
        color: var(--navy);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .faq-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.32s ease;
        padding: 0 14px;
        color: #4b5563;
      }

      .faq-item.active .faq-content {
        max-height: 220px;
        padding: 0 16px 14px;
      }

      .footer {
        background: var(--navy);
        color: #d6e2f5;
      }

      .footer-top {
        display: grid;
        gap: 28px;
        padding-bottom: 28px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.18);
      }

      .work-strip {
        width: 100%;
        margin-left: 0;
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 0;
        padding: 0;
      }

      .work-strip img {
        width: 100%;
        height: 300px;
        object-fit: cover;
        display: block;
        transition: filter 0.24s ease;
      }

      .work-strip:hover img {
        filter: brightness(0.8);
      }

      .work-strip img:hover {
        filter: brightness(1);
      }

      .footer-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 22px;
      }

      .footer h3 {
        color: #fff;
        font-size: 1.28rem;
        margin-bottom: 10px;
      }

      .phone-big {
        color: var(--orange);
        font-family: var(--landing-font-hero);
        font-weight: 800;
        font-size: 2rem;
      }

      .footer-brand-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        height: 44px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.26);
        background: rgba(255, 255, 255, 0.06);
        color: #f8fbff;
        font-family: var(--landing-font-hero);
        font-size: 0.95rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .footer-kicker {
        display: inline-block;
        margin-top: 12px;
        color: #9cc5eb;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
      }

      .footer-copy {
        max-width: 34ch;
        color: #c5d5ea;
        line-height: 1.65;
      }

      .footer-list {
        display: grid;
        gap: 10px;
        color: #c5d5ea;
        font-size: 0.98rem;
        line-height: 1.6;
      }

      .footer-list a {
        color: #e8f1ff;
      }

      .footer-map-link {
        display: inline-flex;
        margin-top: 12px;
        font-weight: 700;
        color: #f8fbff;
      }

      .map-modal {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(7, 15, 27, 0.62);
        backdrop-filter: blur(8px);
      }

      .map-modal.is-open {
        display: flex;
      }

      .map-modal-card {
        position: relative;
        width: min(100%, 920px);
        border-radius: 28px;
        overflow: hidden;
        background: #f8fbff;
        border: 1px solid rgba(203, 213, 225, 0.7);
        box-shadow: 0 32px 80px rgba(2, 12, 27, 0.34);
      }

      .map-modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 18px 20px;
        background: #ffffff;
        border-bottom: 1px solid rgba(203, 213, 225, 0.65);
      }

      .map-modal-head strong {
        color: var(--navy);
        font-size: 1.05rem;
      }

      .map-modal-head span {
        display: block;
        margin-top: 4px;
        color: #64748b;
        font-size: 0.92rem;
      }

      .map-modal-close {
        width: 42px;
        height: 42px;
        border: 0;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.08);
        color: var(--navy);
        font-size: 1.2rem;
        cursor: pointer;
      }

      .map-modal-frame {
        width: 100%;
        height: min(70vh, 560px);
        border: 0;
        display: block;
      }

      .footer-meta {
        display: grid;
        gap: 18px;
        padding-top: 20px;
      }

      .footer-legal {
        font-size: 12px;
        color: #94a3b8;
      }

      .mobile-sticky {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999;
        padding: 10px;
        background: rgba(10, 22, 40, 0.9);
        backdrop-filter: blur(10px);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .mobile-sticky a {
        border-radius: 12px;
        text-align: center;
        font-size: 14px;
        font-weight: 800;
        padding: 12px 10px;
      }

      .mobile-call {
        background: var(--orange);
        color: #0f172a;
      }

      .mobile-wa {
        background: var(--wa);
        color: #fff;
      }

      .reveal {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.7s ease, transform 0.7s ease;
      }

      .reveal.visible {
        opacity: 1;
        transform: none;
      }

      .services-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
        margin-top: 28px;
      }

      .service-card {
        position: relative;
        overflow: hidden;
        border-radius: 24px;
        background: var(--surface);
        border: 1px solid var(--border);
        box-shadow: 0 18px 50px rgba(9, 22, 43, 0.08);
      }

      .service-card-media {
        position: relative;
        aspect-ratio: 5 / 6;
        overflow: hidden;
        background: #dfe7f1;
      }

      .service-card-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .service-card-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        gap: 16px;
        padding: 20px;
        background: linear-gradient(180deg, rgba(7, 17, 33, 0.10) 8%, rgba(7, 17, 33, 0.82) 100%);
        transition: opacity 0.25s ease, transform 0.25s ease;
      }

      .service-card-overlay p {
        margin: 0;
        color: rgba(247, 250, 255, 0.96);
        font-size: 1rem;
        line-height: 1.55;
        max-width: 28ch;
      }

      .checklist {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }

      .checklist li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        color: #ffffff;
        font-size: 0.98rem;
        line-height: 1.45;
      }

      .checklist li i {
        margin-top: 4px;
        color: var(--accent);
        font-size: 0.86rem;
        flex: 0 0 auto;
      }

      .service-card-footer {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        gap: 8px;
        padding: 18px 22px 20px;
        background: linear-gradient(180deg, #132c47 0%, #0c2339 100%);
      }

      .service-card-footer h3 {
        margin: 0;
        color: #ffffff;
        font-size: clamp(1.12rem, 1.45vw, 1.56rem);
        line-height: 1;
        letter-spacing: -0.01em;
        font-family: var(--landing-font-hero);
        font-weight: 700;
        min-height: 2.72em;
        max-width: 12ch;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-start;
      }

      .service-title-line {
        display: block;
      }


      @media (min-width: 768px) {
        .section {
          padding: 90px 28px;
        }

        .nav-links {
          display: flex;
        }

        .hero-cta {
          flex-direction: row;
          align-items: center;
        }

        .hero-cta .btn {
          width: auto;
          min-height: 52px;
        }

        .hero-stats {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .hero-stat {
          border-top: 0;
          border-left: 1px solid #dbe3ef;
          padding-top: 0;
          padding-left: 10px;
        }

        .hero-stat:first-child {
          border-left: 0;
          padding-left: 0;
        }

        .audience-wrap {
          grid-template-columns: 1.05fr 0.95fr;
          gap: 34px;
        }

        .pain-grid,
        .form-grid {
          grid-template-columns: 1fr 1fr;
        }

        .contact-form {
          grid-template-columns: 1fr 1fr;
          column-gap: 22px;
        }

        .contact-form .contact-full {
          grid-column: 1 / -1;
        }

        .services-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        .trust-metrics-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .trust-split-left {
          grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
          gap: 54px;
        }

        .process-layout {
          grid-template-columns: minmax(0, 0.94fr) minmax(380px, 1.06fr);
          gap: 60px;
        }

        .about-grid {
          grid-template-columns: 1.02fr 0.98fr;
        }

        .clients-carousel-shell {
          grid-template-columns: minmax(0, 1fr);
        }

        .trust-band-inner {
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
          gap: 40px;
        }

        .clients-viewport {
          --clients-side-offset: clamp(290px, 22vw, 370px);
          min-height: 560px;
        }

        .clients-stage {
          height: 560px;
        }

        .client-slide {
          width: min(100%, 460px);
          min-height: 410px;
        }


        @media (hover: hover) and (pointer: fine) {
          .service-card-overlay {
            opacity: 0;
            transform: translateY(16px);
            pointer-events: none;
          }

          .service-card:hover .service-card-overlay {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
          }
        }

        .clients-grid {
          gap: 22px;
        }

        .client-card {
          flex-basis: calc((100% - 22px) / 2);
          min-width: calc((100% - 22px) / 2);
        }

        .clients-stats {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          margin-top: 72px;
        }

        .clients-stat + .clients-stat {
          border-left: 1px solid #dde2e8;
        }

        .projects-head {
          grid-template-columns: 1fr 1.25fr auto;
          gap: 26px;
          align-items: center;
        }

        .projects-track {
          gap: 24px;
        }

        .project-card {
          flex-basis: clamp(310px, 24vw, 390px);
        }

        .project-card-wide {
          flex-basis: clamp(500px, 43vw, 700px);
        }

        .footer-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .footer-top {
          grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
          gap: 42px;
        }
      }

      @media (max-width: 767px) {
        .clients-title {
          font-size: clamp(1.95rem, 9vw, 2.75rem);
          white-space: normal;
          line-height: 0.98;
          max-width: 12ch;
        }

        .clients-viewport {
          min-height: 500px;
        }

        .clients-stage {
          height: 500px;
        }

        .client-slide {
          box-shadow: 0 14px 28px rgba(9, 22, 43, 0.06);
        }

        .client-slide.is-active {
          box-shadow: 0 18px 34px rgba(9, 22, 43, 0.08);
        }

        .trust-band-areas {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .trust-band-area {
          width: 100%;
          text-align: center;
        }

        .trust-proof {
          flex-wrap: nowrap;
          justify-content: flex-start;
          align-items: flex-start;
          gap: 10px;
        }

        .trust-proof-logo {
          width: calc(50% - 5px);
          max-width: 140px;
          border-radius: 16px;
        }

        .work-strip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .work-strip img {
          height: 180px;
        }

        .footer-payments {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-start;
        }

        .footer-payments .pay-badge {
          width: auto;
        }
      }

      @media (min-width: 768px) and (max-width: 991px) {
        .top-nav {
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
        }

        .top-nav-inner {
          padding: 12px 18px;
        }

        .hero {
          padding-top: 72px;
        }

        .hero-grid {
          min-height: calc(100vh - 72px);
        }

        .hero-media img {
          height: 48vh;
          object-position: center 30%;
        }

        .footer-top {
          gap: 34px;
        }

        .footer-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px 42px;
        }

        .footer h3 {
          margin-bottom: 16px;
        }

        .footer-meta {
          gap: 20px;
          padding-top: 24px;
        }

        .footer-payments {
          margin-top: 0;
        }
      }

      @media (min-width: 992px) {
        .top-nav {
          position: absolute;
          top: 0;
          left: auto;
          right: 0;
          width: 50vw;
          opacity: 1;
          transform: none;
          pointer-events: auto;
        }

        .top-nav.nav--desktop-hidden {
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
        }

        .top-nav.nav--desktop-integrated {
          left: auto;
          right: 0;
          width: 50vw;
          background: transparent;
          backdrop-filter: none;
          border-bottom: 0;
          box-shadow: none;
        }

        .top-nav .brand {
          display: none;
        }

        .top-nav.nav--desktop-integrated .brand {
          display: none;
        }

        .top-nav-inner {
          padding: 22px 38px;
        }

        .top-nav.nav--desktop-integrated .top-nav-inner {
          max-width: none;
          margin: 0;
          padding: 22px 38px;
        }

        .top-nav .nav-links,
        .top-nav.nav--desktop-integrated .nav-links,
        .top-nav.nav--desktop-bar .nav-links {
          display: flex;
        }

        .top-nav.nav--desktop-bar {
          position: fixed;
          left: 0;
          right: 0;
          width: 100%;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
        }

        .top-nav.nav--desktop-bar .brand {
          display: inline-flex;
        }

        .top-nav.nav--desktop-bar .top-nav-inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 12px 20px;
        }

        .hero-grid {
          grid-template-columns: 41% 59%;
        }

        .contact-layout {
          justify-items: end;
        }

        .contact-card {
          margin-right: clamp(0px, 2vw, 36px);
          width: min(100%, 660px);
          padding: 30px 26px 26px;
        }

        .hero-media img {
          height: 100vh;
          object-fit: cover;
          object-position: 36% center;
          transform: none;
        }

        .hero-content {
          padding: 84px 64px 44px;
          display: flex;
          align-items: center;
        }

        .hero-content-inner {
          width: 100%;
          max-width: 900px;
          position: relative;
          padding-bottom: clamp(220px, 24vh, 280px);
        }

        .hero h1 {
          font-size: clamp(2.85rem, 4vw, 4.35rem);
        }

        .hero-line {
          white-space: nowrap;
        }

        .hero-stats {
          margin-top: 0;
          padding-top: 0;
          position: absolute;
          left: 0;
          right: 0;
          bottom: -18px;
          transform: none;
        }

        .about-visual {
          min-height: 620px;
        }

        .audience-visual {
          position: relative;
          min-height: 620px;
          padding: 0 0 0 24px;
          display: block;
        }

        .audience-image {
          position: absolute;
        }

        .audience-image-back {
          top: 0;
          right: 0;
          width: min(78%, 500px);
          height: 590px;
          z-index: 1;
        }

        .audience-image-front {
          left: 0;
          bottom: 0;
          width: min(82%, 520px);
          height: 390px;
          z-index: 2;
          border: 6px solid var(--surface);
        }

        .hero-stats {
          margin-top: 48px;
          gap: 14px;
        }

        .hero-stat strong {
          font-size: 2.6rem;
        }

        .hero-stat span {
          font-size: 15px;
        }

        @media (max-width: 1180px) {
          .footer {
            padding-top: 64px;
            padding-bottom: 44px;
          }

          .top-nav {
            width: 59vw;
          }

          .top-nav.nav--desktop-integrated {
            width: 59vw;
          }

          .top-nav-inner {
            padding: 18px 24px;
          }

          .top-nav.nav--desktop-integrated .top-nav-inner {
            padding: 18px 24px;
          }

          .nav-links {
            gap: 14px;
            font-size: 13px;
          }

          .hero-grid {
            grid-template-columns: 38% 62%;
          }

          .hero-content {
            padding: 94px 46px 40px;
          }

          .hero-content-inner {
            max-width: 100%;
            padding-bottom: 236px;
          }

          .hero h1 {
            font-size: clamp(1.72rem, 2.35vw, 2.2rem);
            max-width: none;
            line-height: 0.96;
          }

          .hero-line {
            white-space: nowrap;
          }

          .hero-lead {
            max-width: 33ch;
          }

          .badge {
            font-size: 12px;
            padding: 8px 11px;
          }

          .hero-stats {
            bottom: -4px;
            gap: 0;
          }

          .hero-stat {
            padding-left: 12px;
          }

          .hero-stat strong {
            font-size: 0.9rem;
            line-height: 1.05;
          }

          .hero-stat span {
            font-size: 0.82rem;
            line-height: 1.45;
            max-width: 16ch;
          }

          .footer-top {
            grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
            gap: 32px 48px;
          }

          .footer-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 24px 56px;
          }

          .footer h3 {
            margin-bottom: 18px;
          }

          .footer-copy {
            max-width: 28ch;
          }

          .footer-meta {
            gap: 14px;
            padding-top: 18px;
          }

          .footer-list {
            gap: 12px;
            font-size: 0.94rem;
            line-height: 1.7;
          }

          .footer-payments {
            margin-top: 0;
            gap: 8px;
          }

          .pay-badge {
            padding: 9px 12px;
            font-size: 12px;
          }
        }

        .mobile-sticky {
          display: none;
        }
      }
`;

const landingMarkupTemplate = String.raw`
    <nav class="top-nav">
      <div class="top-nav-inner">
        <a class="brand" href="#inicio" data-default-brand="" data-logo-height="42" aria-label="Inicio"></a>
        <div class="nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#trabajos">Proyectos</a>
          <a href="#experiencia">Experiencia</a>
          <a href="#contacto">Contacto</a>
          <a href="https://wa.me/569XXXXXXX" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
        <a class="btn btn-primary" href="tel:+569XXXXXXX" data-quick-call style="padding: 10px 14px; font-size: 13px">Llamar</a>
      </div>
    </nav>

    <section class="hero reveal" id="inicio">
      <div class="hero-grid">
        <figure class="hero-media">
          <img
            src="/images/heroseccion.webp"
            alt="Gasfiter profesional listo para atención de urgencia en Santiago"
            loading="eager"
          />
          <div class="floating">⭐ 4.9 Google · +500 trabajos</div>
        </figure>

        <div class="hero-content">
	          <div class="hero-content-inner">
	            <span class="eyebrow" data-hero-eyebrow data-pending="true">SERVICIOS 24/7</span>
		            <h1 data-hero-title>
		              <span class="hero-line">Gasfiter urgente en Santiago</span>
		            </h1>
		            <p class="hero-lead" data-hero-subtitle data-pending="true">
		              Atención técnica para fugas, destapes, calefont e instalaciones con respuesta rápida y diagnóstico claro en terreno.
		            </p>
            <div class="badges">
              <span class="badge"><i class="fa-solid fa-bolt" aria-hidden="true"></i>Disponible ahora</span>
              <span class="badge"><i class="fa-solid fa-hand-holding-dollar" aria-hidden="true"></i>Pago contra trabajo</span>
              <span class="badge"><i class="fa-solid fa-certificate" aria-hidden="true"></i>Técnicos certificados</span>
            </div>
            <div class="hero-cta">
              <a class="btn btn-primary" href="tel:+569XXXXXXX" data-hero-cta-primary>
                <i class="fa-solid fa-phone-volume" aria-hidden="true"></i> Llamar ahora
              </a>
              <a class="btn btn-ghost" href="https://wa.me/569XXXXXXX" target="_blank" rel="noopener noreferrer" data-hero-cta-secondary>
                <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp
              </a>
            </div>
            <div class="hero-stats">
              <div class="hero-stat">
                <strong>Atención 24/7</strong>
                <span>Urgencias y visitas coordinadas según comuna y disponibilidad.</span>
              </div>
              <div class="hero-stat">
                <strong>Cobertura local</strong>
                <span>Hogares, oficinas y locales según comuna y disponibilidad.</span>
              </div>
              <div class="hero-stat">
                <strong>Pago y respaldo</strong>
                <span>Transferencia, Webpay y trabajo explicado antes de ejecutar.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section about-section reveal" id="quienes-somos">
      <div class="container about-grid">
        <div class="about-copy">
          <span class="section-kicker" data-about-kicker>QUIÉNES SOMOS</span>
          <h2 data-about-title>Un equipo profesional que responde con soluciones claras</h2>
          <p data-about-description>
            Operamos como un servicio técnico en terreno, no como una visita improvisada. Priorizamos diagnóstico claro,
            comunicación directa y cierre correcto para que el cliente entienda qué se hizo y qué queda resuelto.
          </p>
          <div class="about-points">
            <article class="about-point" data-about-highlight>
              <strong>Diagnóstico claro</strong>
              <span>Explicamos el origen del problema y la solución antes de intervenir.</span>
            </article>
            <article class="about-point" data-about-highlight>
              <strong>Trabajo limpio</strong>
              <span>Ejecutamos con orden, pruebas de funcionamiento y cierre prolijo del espacio.</span>
            </article>
            <article class="about-point" data-about-highlight>
              <strong>Seguimiento y respaldo</strong>
              <span>Dejamos recomendaciones, garantía y trazabilidad básica después del servicio.</span>
            </article>
          </div>
        </div>
        <div class="about-visual">
          <figure class="about-image about-image-primary">
            <img src="/images/gasfiter-emergencias.webp" alt="Técnico revisando instalación en terreno" loading="lazy" />
          </figure>
          <figure class="about-image about-image-secondary">
            <img src="/images/gasfiter-calefont.webp" alt="Detalle de instalación de gasfitería" loading="lazy" />
          </figure>
          <div class="about-badge">
            <strong>24/7</strong>
            <span>Respuesta en Santiago con criterio técnico</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section trust-section reveal" id="certificacion">
      <div class="trust-split trust-split-left">
        <figure class="trust-media-bleed">
          <img src="/images/gasfiter-calefont.webp" alt="Técnico trabajando en instalación de gas y calefont" loading="lazy" />
        </figure>

        <div class="trust-content-column">
          <div class="container trust-content-inner">
            <div class="trust-info">
              <span class="section-kicker" data-trust-kicker>Certificación y seguridad</span>
              <h2 data-trust-title>Respaldo técnico para trabajos donde no se puede improvisar</h2>
              <p class="section-subtitle" data-trust-subtitle>
                La licencia SEC acredita intervención autorizada en instalaciones de gas, calefont y trabajos críticos donde la seguridad importa.
              </p>

              <ul class="trust-bullets" data-trust-bullets>
                <li><i class="fa-solid fa-check" aria-hidden="true"></i>Garantía destacada</li>
                <li><i class="fa-solid fa-check" aria-hidden="true"></i>Norma de seguridad</li>
                <li><i class="fa-solid fa-check" aria-hidden="true"></i>Certificación profesional</li>
              </ul>

              <div class="trust-proof" aria-label="Certificaciones y respaldos">
                <img class="trust-proof-logo" data-trust-logo-primary src="/images/licencia_sec.webp" alt="Licencia SEC" loading="lazy" />
                <img class="trust-proof-logo" data-trust-logo-secondary src="/images/sello_verde.webp" alt="Sello verde" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section trust-metrics-section reveal" id="experiencia" aria-label="Experiencia y cobertura">
      <div class="container trust-metrics-grid">
        <article class="trust-metric">
          <span class="trust-metric-number" data-count-target="98" data-count-suffix="+">98+</span>
          <span class="trust-metric-label">Proyectos</span>
        </article>
        <article class="trust-metric">
          <span class="trust-metric-number" data-count-target="65" data-count-suffix="+">65+</span>
          <span class="trust-metric-label">Clientes</span>
        </article>
        <article class="trust-metric">
          <span class="trust-metric-number" data-count-target="10" data-count-suffix="+">10+</span>
          <span class="trust-metric-label">Años</span>
        </article>
        <article class="trust-metric">
          <span class="trust-metric-number" data-count-target="15" data-count-suffix="+">15+</span>
          <span class="trust-metric-label">Comunas</span>
        </article>
      </div>
    </section>

    <section class="section reveal" id="servicios">
      <div class="container">
        <div class="services-head">
          <h2 style="font-size: clamp(2rem, 6vw, 3.5rem); color: var(--navy)" data-services-title>¿Qué problema tienes ahora?</h2>
          <p class="section-subtitle" data-services-subtitle>Servicios más solicitados</p>
        </div>
        <div class="services-grid">
          <article class="service-card" data-service-card>
            <div class="service-card-media">
              <img data-service-image src="/images/gasfiter-fugas.webp" alt="Servicio de filtraciones y fugas" loading="lazy" />
              <div class="service-card-overlay">
                <p data-service-description>Detectamos fugas y resolvemos filtraciones antes de que generen daños mayores.</p>
                <ul class="checklist" data-service-features>
                  <li><i class="fa-solid fa-circle-check"></i>Fugas visibles y ocultas</li>
                  <li><i class="fa-solid fa-circle-check"></i>Reparación de llaves y conexiones</li>
                  <li><i class="fa-solid fa-circle-check"></i>Prueba de funcionamiento final</li>
                </ul>
              </div>
            </div>
            <div class="service-card-footer">
              <h3 data-service-title><span class="service-title-line">Fugas de agua y</span><span class="service-title-line">gas servicio</span></h3>
            </div>
          </article>

          <article class="service-card" data-service-card>
            <div class="service-card-media">
              <img data-service-image src="/images/gasfiter-destape.webp" alt="Servicio de destapes urgentes" loading="lazy" />
              <div class="service-card-overlay">
                <p data-service-description>Atendemos obstrucciones urgentes en cocina, baño y desagües con intervención rápida.</p>
                <ul class="checklist" data-service-features>
                  <li><i class="fa-solid fa-circle-check"></i>Destape de lavaplatos</li>
                  <li><i class="fa-solid fa-circle-check"></i>Destape de WC</li>
                  <li><i class="fa-solid fa-circle-check"></i>Limpieza de sifones</li>
                </ul>
              </div>
            </div>
            <div class="service-card-footer">
              <h3 data-service-title><span class="service-title-line">Destapes y</span><span class="service-title-line">mantención</span></h3>
            </div>
          </article>

          <article class="service-card" data-service-card>
            <div class="service-card-media">
              <img data-service-image src="/images/gasfiter-griferia.webp" alt="Servicio de instalaciones y reparaciones" loading="lazy" />
              <div class="service-card-overlay">
                <p data-service-description>Instalamos y reparamos grifería, calefont y artefactos sanitarios con estándar técnico.</p>
                <ul class="checklist" data-service-features>
                  <li><i class="fa-solid fa-circle-check"></i>Instalación de grifería</li>
                  <li><i class="fa-solid fa-circle-check"></i>Reparación de calefont</li>
                  <li><i class="fa-solid fa-circle-check"></i>Cambio de conexiones</li>
                </ul>
              </div>
            </div>
            <div class="service-card-footer">
              <h3 data-service-title><span class="service-title-line">Instalacion y</span><span class="service-title-line">reparacion gas</span></h3>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section process-section reveal" id="proceso">
      <div class="container process-layout">
        <figure class="process-media">
          <img src="/images/gasfiter-emergencias.webp" alt="Técnico preparando una intervención en terreno" loading="lazy" />
        </figure>

        <div class="process-content">
          <div class="section-head process-head">
            <span class="section-kicker" data-process-kicker>PROCESO DE TRABAJO</span>
            <h2 data-process-title>Un proceso claro para responder rápido sin perder control técnico</h2>
            <p class="section-subtitle" data-process-subtitle>
              Cada paso está pensado para dar visibilidad, orden y cierre correcto desde el primer contacto hasta la validación final.
            </p>
          </div>

          <div class="process-timeline" data-process-timeline>
            <article class="process-step" data-process-step>
              <span class="process-number">01</span>
              <div class="process-step-copy">
                <h3>Recepción y priorización</h3>
                <p>Tomamos el caso, entendemos la urgencia y definimos la atención según comuna y tipo de problema.</p>
              </div>
            </article>
            <article class="process-step" data-process-step>
              <span class="process-number">02</span>
              <div class="process-step-copy">
                <h3>Diagnóstico en terreno</h3>
                <p>Revisamos el origen del problema y explicamos la intervención antes de ejecutar cualquier trabajo.</p>
              </div>
            </article>
            <article class="process-step" data-process-step>
              <span class="process-number">03</span>
              <div class="process-step-copy">
                <h3>Ejecución y prueba</h3>
                <p>Realizamos la reparación o instalación y validamos funcionamiento real antes del cierre.</p>
              </div>
            </article>
            <article class="process-step" data-process-step>
              <span class="process-number">04</span>
              <div class="process-step-copy">
                <h3>Cierre y respaldo</h3>
                <p>Entregamos recomendaciones, garantía y una salida técnica clara para evitar reincidencias.</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="section projects-section reveal" id="trabajos">
      <div class="container">
        <div class="projects-head projects-head-centered">
          <h2>Proyectos</h2>
        </div>
      </div>
      <div class="projects-wrap projects-double-marquee">
        <div class="projects-marquee-row">
          <div class="projects-marquee" data-projects-track-top>
            <div class="projects-marquee-group">
              <figure class="project-card">
                <img src="/images/square1.webp" alt="Proyecto de gasfitería en baño" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto en baño</strong><span>Providencia</span></figcaption>
              </figure>
              <figure class="project-card project-card-wide">
                <img src="/images/landscape1.webp" alt="Proyecto de gasfitería en cocina" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto en cocina</strong><span>Las Condes</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square2.webp" alt="Proyecto de mantención preventiva" loading="lazy" />
                <figcaption class="project-overlay"><strong>Mantención preventiva</strong><span>Santiago Centro</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square3.webp" alt="Proyecto de grifería en cocina" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto de grifería</strong><span>La Florida</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square4.webp" alt="Proyecto de reparación de fugas" loading="lazy" />
                <figcaption class="project-overlay"><strong>Reparación de fugas</strong><span>Ñuñoa</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square1.webp" alt="Proyecto de destape en departamento" loading="lazy" />
                <figcaption class="project-overlay"><strong>Destape de desagüe</strong><span>San Miguel</span></figcaption>
              </figure>
            </div>
            <div class="projects-marquee-group" aria-hidden="true">
              <figure class="project-card">
                <img src="/images/square2.webp" alt="Proyecto de gasfitería en baño" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto en baño</strong><span>Providencia</span></figcaption>
              </figure>
              <figure class="project-card project-card-wide">
                <img src="/images/landscape2.webp" alt="Proyecto de gasfitería en cocina" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto en cocina</strong><span>Las Condes</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square3.webp" alt="Proyecto de mantención preventiva" loading="lazy" />
                <figcaption class="project-overlay"><strong>Mantención preventiva</strong><span>Santiago Centro</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square4.webp" alt="Proyecto de grifería en cocina" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto de grifería</strong><span>La Florida</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square1.webp" alt="Proyecto de reparación de fugas" loading="lazy" />
                <figcaption class="project-overlay"><strong>Reparación de fugas</strong><span>Ñuñoa</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square2.webp" alt="Proyecto de destape en departamento" loading="lazy" />
                <figcaption class="project-overlay"><strong>Destape de desagüe</strong><span>San Miguel</span></figcaption>
              </figure>
            </div>
          </div>
        </div>
        <div class="projects-marquee-row reverse">
          <div class="projects-marquee" data-projects-track-bottom>
            <div class="projects-marquee-group">
              <figure class="project-card">
                <img src="/images/square3.webp" alt="Proyecto de destape en departamento" loading="lazy" />
                <figcaption class="project-overlay"><strong>Destape de desagüe</strong><span>San Miguel</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square4.webp" alt="Proyecto de reparación de fugas" loading="lazy" />
                <figcaption class="project-overlay"><strong>Reparación de fugas</strong><span>Ñuñoa</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square1.webp" alt="Proyecto de grifería en cocina" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto de grifería</strong><span>La Florida</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square2.webp" alt="Proyecto de mantención preventiva" loading="lazy" />
                <figcaption class="project-overlay"><strong>Mantención preventiva</strong><span>Santiago Centro</span></figcaption>
              </figure>
              <figure class="project-card project-card-wide">
                <img src="/images/landscape3.webp" alt="Proyecto de gasfitería en cocina" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto en cocina</strong><span>Las Condes</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square3.webp" alt="Proyecto de gasfitería en baño" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto en baño</strong><span>Providencia</span></figcaption>
              </figure>
            </div>
            <div class="projects-marquee-group" aria-hidden="true">
              <figure class="project-card">
                <img src="/images/square4.webp" alt="Proyecto de destape en departamento" loading="lazy" />
                <figcaption class="project-overlay"><strong>Destape de desagüe</strong><span>San Miguel</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square1.webp" alt="Proyecto de reparación de fugas" loading="lazy" />
                <figcaption class="project-overlay"><strong>Reparación de fugas</strong><span>Ñuñoa</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square2.webp" alt="Proyecto de grifería en cocina" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto de grifería</strong><span>La Florida</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square3.webp" alt="Proyecto de mantención preventiva" loading="lazy" />
                <figcaption class="project-overlay"><strong>Mantención preventiva</strong><span>Santiago Centro</span></figcaption>
              </figure>
              <figure class="project-card project-card-wide">
                <img src="/images/landscape4.webp" alt="Proyecto de gasfitería en cocina" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto en cocina</strong><span>Las Condes</span></figcaption>
              </figure>
              <figure class="project-card">
                <img src="/images/square4.webp" alt="Proyecto de gasfitería en baño" loading="lazy" />
                <figcaption class="project-overlay"><strong>Proyecto en baño</strong><span>Providencia</span></figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section trust-band reveal">
      <div class="container trust-band-inner">
        <div class="trust-band-copy">
          <span class="trust-band-kicker">Cobertura y confianza</span>
          <h2>Atención técnica en Santiago, con respuesta clara y cobertura real</h2>
          <p>
            Atendemos hogares, departamentos, oficinas y locales comerciales con servicio rápido según comuna,
            diagnóstico transparente y respaldo en cada visita.
          </p>
          <div class="trust-band-areas">
            <span class="trust-band-area">Providencia</span>
            <span class="trust-band-area">Ñuñoa</span>
            <span class="trust-band-area">Las Condes</span>
            <span class="trust-band-area">Santiago Centro</span>
            <span class="trust-band-area">La Florida</span>
            <span class="trust-band-area">Maipú</span>
          </div>
        </div>
        <div class="trust-band-points">
          <article class="trust-point">
            <strong>Atención 24/7</strong>
            <span>Disponibilidad para urgencias reales y visitas programadas según comuna.</span>
          </article>
          <article class="trust-point">
            <strong>Técnicos verificados</strong>
            <span>Servicio profesional, ordenado y enfocado en soluciones duraderas.</span>
          </article>
          <article class="trust-point">
            <strong>Presupuesto claro</strong>
            <span>Se informa el trabajo y el costo antes de comenzar la intervención.</span>
          </article>
          <article class="trust-point">
            <strong>Medios de pago</strong>
            <span>Transferencia, Webpay, débito, crédito y comprobante cuando corresponde.</span>
          </article>
        </div>
      </div>
    </section>

    <section class="section contact-section reveal" id="contacto">
      <div class="container contact-layout">
        <div class="contact-card">
          <span class="contact-kicker">CONTACTO</span>
          <h2 class="contact-title">¿Tienes preguntas?<br />Escríbenos ahora.</h2>
          <form class="contact-form" action="#" method="POST" data-contact-form novalidate>
            <input class="contact-field" type="text" name="nombre" placeholder="Nombre" required />
            <input class="contact-field" type="tel" name="telefono" placeholder="Teléfono" required />
            <input class="contact-field" type="text" name="comuna" placeholder="Comuna" required />
            <input class="contact-field" type="email" name="email" placeholder="Email" required />
            <textarea
              class="contact-field contact-full"
              name="problema"
              placeholder="Describe tu problema"
              rows="3"
              required
            ></textarea>
            <button class="btn contact-submit contact-full" type="submit" data-contact-submit>Enviar solicitud</button>
            <p class="contact-feedback contact-full" data-contact-feedback aria-live="polite"></p>
          </form>
        </div>
      </div>
    </section>

    <section class="section clients-section reveal" id="testimonios">
      <div class="container">
        <div class="clients-head clients-head-centered">
          <h2 class="clients-title">Lo que dicen nuestros clientes</h2>
        </div>

        <div class="clients-carousel-shell">
          <div class="clients-viewport" data-clients-viewport>
            <div class="clients-stage" data-clients-stage>
              <article class="client-slide is-prev">
                <div class="client-slide-head">
                  <img src="/images/gasfiter-testimonial-2.webp" alt="George Caldwell" loading="lazy" />
                  <div>
                    <strong>George Caldwell</strong>
                    <span>Las Condes, RM · Reparación de fugas</span>
                  </div>
                </div>
                <div class="client-slide-rating" aria-hidden="true">★★★★★</div>
                <p class="client-slide-text">Excelente atención, muy puntuales y transparentes con los costos. Solucionaron la fuga el mismo día y todo quedó funcionando perfecto.</p>
              </article>

              <article class="client-slide is-active">
                <div class="client-slide-head">
                  <img src="/images/gasfiter-testimonial.webp" alt="Roland Berry" loading="lazy" />
                  <div>
                    <strong>Roland Berry</strong>
                    <span>Providencia, RM · Destape urgente</span>
                  </div>
                </div>
                <div class="client-slide-rating" aria-hidden="true">★★★★★</div>
                <p class="client-slide-text">Llegaron rápido, explicaron todo con claridad y dejaron el trabajo impecable. Recomendados para urgencias y reparaciones en casa.</p>
              </article>

              <article class="client-slide is-next">
                <div class="client-slide-head">
                  <img src="/images/gasfiter-testimonial-3.webp" alt="Camila Rojas" loading="lazy" />
                  <div>
                    <strong>Camila Rojas</strong>
                    <span>Ñuñoa, RM · Mantención preventiva</span>
                  </div>
                </div>
                <div class="client-slide-rating" aria-hidden="true">★★★★★</div>
                <p class="client-slide-text">Muy profesionales y ordenados. Nos ayudaron con una emergencia en el baño y dejaron todo limpio. Excelente servicio y respuesta rápida.</p>
              </article>
            </div>
          </div>
        </div>

        <div class="clients-controls">
          <button class="clients-control" type="button" aria-label="Testimonio anterior" data-clients-prev>
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <button class="clients-control" type="button" aria-label="Siguiente testimonio" data-clients-next>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </section>

    <section class="section reveal" id="faq" style="background: #f7fbff">
      <div class="container">
        <h2 style="font-size: clamp(2rem, 6vw, 3.3rem); color: var(--navy); max-width: 760px; margin: 0 auto" data-faq-title>
          Preguntas frecuentes
        </h2>
        <div class="faq-list" data-faq-list>
          <article class="faq-item">
            <button class="faq-btn" type="button">¿Cobran visita? <i class="fa-solid fa-chevron-down"></i></button>
            <div class="faq-content"><p>Cobramos solo si hay diagnóstico en terreno y siempre se informa antes de iniciar.</p></div>
          </article>
          <article class="faq-item">
            <button class="faq-btn" type="button">¿Cuánto demoran en llegar? <i class="fa-solid fa-chevron-down"></i></button>
            <div class="faq-content"><p>En promedio 40 minutos en Santiago, según tráfico y comuna.</p></div>
          </article>
          <article class="faq-item">
            <button class="faq-btn" type="button">¿Atienden de noche y feriados? <i class="fa-solid fa-chevron-down"></i></button>
            <div class="faq-content"><p>Sí, tenemos atención 24/7 para urgencias reales en domicilio o negocio.</p></div>
          </article>
          <article class="faq-item">
            <button class="faq-btn" type="button">¿Los trabajos tienen garantía? <i class="fa-solid fa-chevron-down"></i></button>
            <div class="faq-content"><p>Sí, entregamos garantía de 30 días sobre la intervención realizada.</p></div>
          </article>
          <article class="faq-item">
            <button class="faq-btn" type="button">¿Trabajan en departamentos y locales? <i class="fa-solid fa-chevron-down"></i></button>
            <div class="faq-content"><p>Sí, atendemos casas, departamentos, oficinas, restaurantes y comercio en general.</p></div>
          </article>
        </div>
      </div>
    </section>

    <section class="work-strip" aria-label="Detalles de nuestros trabajos">
      <img src="/images/gasfiter-griferia.webp" alt="Detalle de grifería instalada" loading="lazy" />
      <img src="/images/gasfiter-fugas.webp" alt="Trabajo en conexiones de cobre" loading="lazy" />
      <img src="/images/gasfiter-calefont.webp" alt="Instalación de cañerías y calefont" loading="lazy" />
      <img src="/images/gasfiter-mantencion.webp" alt="Cambio de filtros y mantención" loading="lazy" />
      <img src="/images/gasfiter-hero.webp" alt="Técnico gasfiter en terreno" loading="lazy" />
      <img src="/images/gasfiter-destape.webp" alt="Ajuste de sifón en lavamanos" loading="lazy" />
    </section>

    <footer class="section footer">
      <div class="container footer-top">
        <div>
          <span class="footer-brand-mark" data-footer-brand-mark>Logo</span>
          <span class="footer-kicker" data-footer-brand-kicker>Placeholder de marca</span>
          <h3 style="margin-top: 14px">Gasfiter Urgencias Santiago</h3>
          <p class="footer-copy">Respuesta técnica 24/7 para fugas, destapes, calefont e instalaciones con atención en terreno.</p>
          <p style="margin-top: 16px"><a class="phone-big" href="tel:+569XXXXXXX">+56 9 XXXX XXXX</a></p>
          <p style="margin-top: 10px">
            <a href="https://wa.me/569XXXXXXX" target="_blank" rel="noopener noreferrer" data-footer-whatsapp>
              <i class="fa-brands fa-whatsapp"></i> WhatsApp directo
            </a>
          </p>
        </div>

        <div class="footer-grid">
          <div>
            <h3>Contacto</h3>
            <div class="footer-list">
              <span data-footer-address>Dirección placeholder 123</span>
              <span>Santiago, Región Metropolitana</span>
              <a href="mailto:contacto@gasfiter.cl" data-footer-email>contacto@gasfiter.cl</a>
            </div>
            <a class="footer-map-link" href="#mapa" data-open-map-modal>Ver mapa / ubicación</a>
          </div>

          <div>
            <h3>Cobertura</h3>
            <div class="footer-list">
              <span>Providencia, Ñuñoa, Las Condes, Santiago Centro, La Florida y más.</span>
            </div>
          </div>

          <div>
            <h3>Horario y pagos</h3>
            <div class="footer-list">
              <span>Atención 24/7</span>
              <span>Servicio sujeto a disponibilidad por comuna y emergencia.</span>
            </div>
          </div>
        </div>
      </div>
      <div class="container footer-meta">
        <div class="payments footer-payments" aria-label="Métodos de pago">
          <span class="pay-badge">Webpay</span>
          <span class="pay-badge">Transferencia</span>
          <span class="pay-badge">Débito / Crédito</span>
          <span class="pay-badge">Efectivo</span>
        </div>
        <div class="footer-legal">Desarrollado por FOCUSWEB CHILE</div>
      </div>
    </footer>

    <div class="map-modal" data-map-modal aria-hidden="true">
      <div class="map-modal-card" role="dialog" aria-modal="true" aria-labelledby="map-modal-title">
        <div class="map-modal-head">
          <div>
            <strong id="map-modal-title">Ubicación referencial</strong>
            <span>Santiago, Región Metropolitana · Placeholder editable desde contenido final</span>
          </div>
          <button class="map-modal-close" type="button" aria-label="Cerrar mapa" data-close-map-modal>×</button>
        </div>
        <iframe
          class="map-modal-frame"
          src="https://www.google.com/maps?q=Santiago%20Chile&z=12&output=embed"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Mapa de ubicación"
        ></iframe>
      </div>
    </div>

    <div class="mobile-sticky" aria-label="acciones rápidas móviles">
      <a class="mobile-call" href="tel:+569XXXXXXX" data-quick-call>Llamar</a>
      <a class="mobile-wa" href="https://wa.me/569XXXXXXX" data-quick-wa target="_blank" rel="noopener noreferrer">WhatsApp</a>
    </div>

`;

const DEFAULT_LANDING_VALUES = {
  hero: {
    title: "Gasfiter urgente en Santiago",
    subtitle:
      "Atención técnica para fugas, destapes, calefont e instalaciones con respuesta rápida y diagnóstico claro en terreno.",
    eyebrow: "SERVICIOS 24/7",
    image: "/images/heroseccion.webp",
    primaryUrl: "tel:+569XXXXXXX",
    primaryText: "LLAMAR AHORA +56 9 XXXX XXXX",
    secondaryUrl: "https://wa.me/569XXXXXXX",
    secondaryText: "WhatsApp",
  },
  services: {
    title: "¿Qué problema tienes ahora?",
    subtitle: "Servicios más solicitados",
    ctaText: "Llamar por esto",
  },
  process: {
    kicker: "PROCESO DE TRABAJO",
    title: "Un proceso claro para responder rápido sin perder control técnico",
    subtitle:
      "Cada paso está pensado para dar visibilidad, orden y cierre correcto desde el primer contacto hasta la validación final.",
    image: "/images/gasfiter-emergencias.webp",
  },
  projects: {
    title: "Trabajos realizados en Santiago",
    description:
      "Casos reales de instalación, reparación y mantención. Haz click y arrastra para deslizar las imágenes hacia la izquierda o derecha.",
    fallbackImage: "/images/gasfiter-destape.webp",
  },
  testimonials: {
    title: "Comentarios de nuestros clientes",
    kicker: "Testimonios",
    fallbackAvatar: "/images/gasfiter-testimonial.webp",
  },
  contact: {
    kicker: "CONTACTO",
    title: "¿Tienes preguntas?\nEscríbenos ahora.",
    submitText: "Enviar solicitud",
  },
  audience: {
    kicker: "¿Para quién es este servicio?",
    title: "Atención urgente para hogares y negocios en Santiago",
    description:
      "Atendemos dueños de casa, arrendatarios, pymes y administradores de edificios en Santiago que necesitan solución hoy, no mañana.",
    ctaPrimaryText: "+56 9 XXXX XXXX",
    ctaPrimaryUrl: "tel:+569XXXXXXX",
    ctaSecondaryText: "Agendar visita",
    ctaSecondaryUrl: "#contacto",
  },
  trust: {
    kicker: "Certificación y seguridad",
    title: "Respaldo técnico para trabajos donde no se puede improvisar",
    subtitle:
      "La licencia SEC acredita intervención autorizada en instalaciones de gas, calefont y trabajos críticos donde la seguridad importa.",
    image: "/images/gasfiter-calefont.webp",
    logoPrimary: "/images/licencia_sec.webp",
    logoSecondary: "/images/sello_verde.webp",
  },
  urgency: {
    title: "¿Tienes una urgencia ahora?",
    description: "Te atendemos hoy, en tu comuna, con respuesta rápida y técnica.",
    ctaText: "Llamar ahora",
    ctaUrl: "tel:+569XXXXXXX",
  },
  faq: {
    title: "Preguntas frecuentes",
  },
} as const;

type DynamicLandingProps = {
  initialSettings?: CmsSettings | null;
};

const escapeStaticHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildHeroTitleMarkup = (title: string) => {
  const lines = title
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (lines.length === 2) {
    return `<span class="hero-line">${escapeStaticHtml(lines[0])}</span><span class="hero-line">${escapeStaticHtml(lines[1])}</span>`;
  }

  return `<span class="hero-line">${escapeStaticHtml(title)}</span>`;
};

const buildLandingMarkup = (initialHero: ResolvedHero) =>
  landingMarkupTemplate
    .replace(
      'src="/images/heroseccion.webp"',
      `src="${escapeStaticHtml(initialHero.image)}"`,
    )
    .replace(
      '<span class="eyebrow" data-hero-eyebrow data-pending="true">SERVICIOS 24/7</span>',
      `<span class="eyebrow" data-hero-eyebrow>${escapeStaticHtml(initialHero.eyebrow)}</span>`,
    )
    .replace(
      /<h1 data-hero-title>[\s\S]*?<\/h1>/,
      `<h1 data-hero-title>${buildHeroTitleMarkup(initialHero.title)}</h1>`,
    )
    .replace(
      /<p class="hero-lead" data-hero-subtitle data-pending="true">[\s\S]*?<\/p>/,
      `<p class="hero-lead" data-hero-subtitle>${escapeStaticHtml(initialHero.subtitle)}</p>`,
    )
    .replace(
      'href="tel:+569XXXXXXX" data-hero-cta-primary',
      `href="${escapeStaticHtml(initialHero.primaryUrl)}" data-hero-cta-primary`,
    )
    .replace(
      'href="https://wa.me/569XXXXXXX" target="_blank" rel="noopener noreferrer" data-hero-cta-secondary',
      `href="${escapeStaticHtml(initialHero.secondaryUrl)}" target="_blank" rel="noopener noreferrer" data-hero-cta-secondary`,
    );

export default function DynamicLanding({ initialSettings = null }: DynamicLandingProps) {
  const initialHero = resolveHeroFromSettings({
    settings: initialSettings,
    defaults: DEFAULT_LANDING_VALUES.hero,
    fallbackWhatsappUrl: DEFAULT_LANDING_VALUES.hero.secondaryUrl,
  });
  const landingMarkup = buildLandingMarkup(initialHero);

  useEffect(() => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const siteSlug = process.env.NEXT_PUBLIC_SITE_SLUG?.trim() || "gasfiter-staging";

    const normalizeServiceTitle = (title: string, index: number) => {
      const compact = title.replace(/\s+/g, " ").trim();
      if (index === 0) return ["Instalacion y", "reparacion gas"];
      if (index === 1) return ["Destapes y", "mantención"];
      if (index === 2) return ["Fugas de agua y", "gas servicio"];

      const words = compact.split(" ");
      if (words.length <= 2) return [compact, ""];
      const splitIndex = Math.ceil(words.length / 2);
      return [words.slice(0, splitIndex).join(" "), words.slice(splitIndex).join(" ")];
    };

    const getFallbackIcon = (classList: DOMTokenList) => {
      if (classList.contains("fa-arrow-left")) return "←";
      if (classList.contains("fa-arrow-right")) return "→";
      if (classList.contains("fa-chevron-down")) return "⌄";
      if (classList.contains("fa-circle-check")) return "✓";
      if (classList.contains("fa-phone-volume")) return "☎";
      if (classList.contains("fa-bolt")) return "⚡";
      if (classList.contains("fa-droplet")) return "💧";
      if (classList.contains("fa-screwdriver-wrench")) return "🛠";
      if (classList.contains("fa-toilet")) return "🚽";
      if (classList.contains("fa-certificate")) return "◉";
      if (classList.contains("fa-hand-holding-dollar")) return "$";
      if (classList.contains("fa-whatsapp")) return "WA";
      return "";
    };

    const applyIconFallback = () => {
      document.body.classList.add("icon-fallback-active");
      const icons = document.querySelectorAll<HTMLElement>("i.fa-solid, i.fa-brands");
      icons.forEach((icon) => {
        const glyph = getFallbackIcon(icon.classList);
        if (!glyph) return;
        icon.textContent = glyph;
        icon.setAttribute("data-icon-fallback", "true");
        if (!icon.hasAttribute("aria-hidden")) {
          icon.setAttribute("aria-hidden", "true");
        }
      });
    };

    const hasFontAwesomeLoaded = () => {
      const probe = document.createElement("i");
      probe.className = "fa-solid fa-arrow-right";
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      document.body.appendChild(probe);

      const family = getComputedStyle(probe).fontFamily || "";
      const beforeContent = getComputedStyle(probe, "::before").content || "";
      probe.remove();

      const hasFamily = /font awesome/i.test(family);
      const hasGlyph = beforeContent !== "none" && beforeContent !== '""' && beforeContent !== "";
      return hasFamily || hasGlyph;
    };

    const appendFaLink = (id: string, href: string) =>
      new Promise<void>((resolve) => {
        const existing = document.getElementById(id) as HTMLLinkElement | null;
        if (existing) {
          resolve();
          return;
        }
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = href;
        link.crossOrigin = "anonymous";
        link.referrerPolicy = "no-referrer";
        link.onload = () => resolve();
        link.onerror = () => resolve();
        document.head.appendChild(link);
      });

    const ensureIconsReady = async () => {
      if (hasFontAwesomeLoaded()) return;

      await appendFaLink(
        "fa-cdnjs-runtime",
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
      );
      await sleep(120);
      if (hasFontAwesomeLoaded()) return;

      await appendFaLink(
        "fa-jsdelivr-runtime",
        "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css",
      );
      await sleep(140);

      if (!hasFontAwesomeLoaded()) {
        applyIconFallback();
      }
    };

    const waitForFonts = async () => {
      const fontApi = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (!fontApi) return;
      try {
        await fontApi.ready;
      } catch {
        // Ignore font API errors and keep rendering flow.
      }
    };

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isReload = !!navEntry && navEntry.type === "reload";
    if (isReload) window.scrollTo(0, 0);

    const onPageShow = () => {
      if (isReload) window.scrollTo(0, 0);
    };
    window.addEventListener("pageshow", onPageShow);

    const nav = document.querySelector(".top-nav");
    const desktopShowAfter = 700;
    const desktopHideBeforeTop = 140;
    const toggleNav = () => {
      if (!nav) return;
      if (window.innerWidth >= 992) {
        nav.classList.remove("nav--visible", "nav--desktop-hidden", "nav--desktop-integrated", "nav--desktop-bar");
        const currentY = window.scrollY;
        if (currentY <= desktopHideBeforeTop) {
          nav.classList.add("nav--desktop-integrated");
        } else if (currentY >= desktopShowAfter) {
          nav.classList.add("nav--desktop-bar");
        } else {
          nav.classList.add("nav--desktop-hidden");
        }
        return;
      }
      if (window.innerWidth >= 768) {
        nav.classList.remove("nav--desktop-bar", "nav--desktop-hidden", "nav--desktop-integrated");
        nav.classList.add("nav--visible");
        return;
      }
      nav.classList.remove("nav--desktop-bar", "nav--desktop-hidden", "nav--desktop-integrated");
      if (window.scrollY > 40) nav.classList.add("nav--visible");
      else nav.classList.remove("nav--visible");
    };
    toggleNav();
    window.addEventListener("scroll", toggleNav, { passive: true });
    window.addEventListener("resize", toggleNav);

    const reveals = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );
    reveals.forEach((item) => io.observe(item));

    const metricNumbers = document.querySelectorAll<HTMLElement>("[data-count-target]");
    const animateMetric = (el: HTMLElement) => {
      if (el.dataset.countAnimated === "true") return;
      const target = Number(el.dataset.countTarget || "0");
      const suffix = el.dataset.countSuffix || "";
      if (!Number.isFinite(target) || target <= 0) {
        el.textContent = `${target}${suffix}`;
        el.dataset.countAnimated = "true";
        return;
      }

      const duration = 1100;
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        el.textContent = `${value}${suffix}`;
        if (progress < 1) {
          window.requestAnimationFrame(step);
          return;
        }
        el.textContent = `${target}${suffix}`;
        el.dataset.countAnimated = "true";
      };

      el.textContent = `0${suffix}`;
      window.requestAnimationFrame(step);
    };

    const metricsIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateMetric(entry.target as HTMLElement);
          metricsIo.unobserve(entry.target);
        });
      },
      { threshold: 0.45 },
    );
    metricNumbers.forEach((item) => metricsIo.observe(item));

    const mapModal = document.querySelector<HTMLElement>("[data-map-modal]");
    const openMapTriggers = document.querySelectorAll<HTMLElement>("[data-open-map-modal]");
    const closeMapTriggers = document.querySelectorAll<HTMLElement>("[data-close-map-modal]");

    const closeMapModal = () => {
      if (!mapModal) return;
      mapModal.classList.remove("is-open");
      mapModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    const openMapModal = () => {
      if (!mapModal) return;
      mapModal.classList.add("is-open");
      mapModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    openMapTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openMapModal();
      });
    });

    closeMapTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        closeMapModal();
      });
    });

    mapModal?.addEventListener("click", (event) => {
      if (event.target === mapModal) closeMapModal();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMapModal();
    };
    window.addEventListener("keydown", onKeyDown);

    const bindFaqButtons = () => {
      const faqBtns = document.querySelectorAll(".faq-btn");
      faqBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = btn.closest(".faq-item");
          if (!item) return;
          item.classList.toggle("active");
        });
      });
    };
    bindFaqButtons();

    const bindContactForm = () => {
      const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
      const submitBtn = document.querySelector<HTMLButtonElement>("[data-contact-submit]");
      const feedbackEl = document.querySelector<HTMLElement>("[data-contact-feedback]");
      if (!form || !submitBtn || !feedbackEl) return;

      if (!submitBtn.dataset.defaultText) {
        submitBtn.dataset.defaultText = submitBtn.textContent?.trim() || "Enviar solicitud";
      }

      const setFeedback = (message: string, tone: "idle" | "error" | "success" = "idle") => {
        feedbackEl.textContent = message;
        feedbackEl.classList.remove("is-error", "is-success");
        if (tone === "error") feedbackEl.classList.add("is-error");
        if (tone === "success") feedbackEl.classList.add("is-success");
      };

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const nombre = String(formData.get("nombre") || "").trim();
        const telefono = String(formData.get("telefono") || "").trim();
        const comuna = String(formData.get("comuna") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const problema = String(formData.get("problema") || "").trim();

        if (!nombre || !email || !problema) {
          setFeedback("Completa nombre, email y describe el problema.", "error");
          return;
        }

        const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailIsValid) {
          setFeedback("Ingresa un email válido.", "error");
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
        setFeedback("Enviando tu solicitud...");

        try {
          const response = await fetch("/api/forms/contact", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre,
              telefono,
              comuna,
              email,
              problema,
              siteSlug,
            }),
          });

          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          if (!response.ok) {
            throw new Error(payload.error || "No se pudo enviar la solicitud.");
          }

          form.reset();
          setFeedback("Solicitud enviada. Te contactaremos a la brevedad.", "success");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error inesperado al enviar el formulario.";
          setFeedback(message, "error");
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.defaultText || "Enviar solicitud";
        }
      });
    };
    bindContactForm();

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const ensureSwapFontLink = (fontUrl: string) => {
      const trimmed = fontUrl.trim();
      if (!trimmed) return;
      let href = trimmed;
      if (!href.includes("display=")) {
        href += href.includes("?") ? "&display=swap" : "?display=swap";
      }

      const id = "dynamic-font-link";
      const existing = document.getElementById(id) as HTMLLinkElement | null;
      if (existing) {
        if (existing.href !== href) existing.href = href;
        return;
      }
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    };

    const parseGoogleFamilyFromUrl = (fontUrl: string) => {
      try {
        const url = new URL(fontUrl);
        const familyParam = url.searchParams.get("family");
        if (!familyParam) return "";
        const firstFamily = familyParam.split("&")[0]?.split(":")[0]?.trim();
        if (!firstFamily) return "";
        return firstFamily.replace(/\+/g, " ");
      } catch {
        return "";
      }
    };

    const applySettings = (settings: CmsSettings | null) => {
      if (!settings || typeof settings !== "object") return;
      const content = settings.content || {};
      const findRawSection = (id: string) =>
        Array.isArray(content.sections)
          ? content.sections.find(
              (section) => section && typeof section === "object" && section.id === id,
            )
          : null;
      const findSection = (id: string) =>
        Array.isArray(content.sections)
          ? content.sections.find(
              (section) =>
                section &&
                typeof section === "object" &&
                section.id === id &&
                section.enabled !== false &&
                section.data &&
                typeof section.data === "object",
            )
          : null;
      const isExplicitlyDisabled = (id: string) => {
        const section = findRawSection(id);
        return !!section && section.enabled === false;
      };
      const setVisible = (selector: string, visible: boolean) => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!el) return;
        el.style.display = visible ? "" : "none";
      };
      const sectionAudience = findSection("audience");
      const sectionTrust = findSection("trust");
      const sectionProcess = findSection("process");
      const sectionProjects = findSection("projects");
      const sectionUrgency = findSection("urgency_banner");
      const sectionContact = findSection("contact_banner");
      setVisible("#inicio", !isExplicitlyDisabled("hero"));
      setVisible(".band-dark", !isExplicitlyDisabled("audience"));
      setVisible("#certificacion", !isExplicitlyDisabled("trust"));
      setVisible("#servicios", !isExplicitlyDisabled("services"));
      setVisible("#proceso", !isExplicitlyDisabled("process"));
      setVisible("#trabajos", !isExplicitlyDisabled("projects"));
      setVisible(".trust-band", !isExplicitlyDisabled("urgency_banner"));
      setVisible("#contacto", !isExplicitlyDisabled("contact_banner"));
      setVisible("#testimonios", !isExplicitlyDisabled("testimonials"));
      setVisible("#faq", !isExplicitlyDisabled("faq"));
      const branding = settings.branding && typeof settings.branding === "object" ? settings.branding : {};
      const brandingContact =
        branding.contact && typeof branding.contact === "object" ? branding.contact : {};

      const navLogoUrl =
        (typeof branding.logoNavUrl === "string" && branding.logoNavUrl.trim()) ||
        (typeof branding.logoUrl === "string" && branding.logoUrl.trim()) ||
        "";
      const footerLogoUrl =
        (typeof branding.logoFooterUrl === "string" && branding.logoFooterUrl.trim()) || navLogoUrl || "";

      const navBrandLink = document.querySelector<HTMLAnchorElement>(
        '.top-nav .brand[data-default-brand], .top-nav-inner .brand[data-default-brand]'
      );
      if (navBrandLink) {
        if (navLogoUrl) {
          const logoHeight = navBrandLink.getAttribute("data-logo-height") || "42";
          navBrandLink.innerHTML = `<img src="${escapeHtml(navLogoUrl)}" alt="Logo" style="height:${escapeHtml(
            logoHeight
          )}px; width:auto; object-fit:contain;" />`;
        } else {
          navBrandLink.textContent = "";
        }
      }

      const footerBrandMark = document.querySelector<HTMLElement>("[data-footer-brand-mark]");
      const footerBrandKicker = document.querySelector<HTMLElement>("[data-footer-brand-kicker]");
      if (footerBrandMark) {
        if (footerLogoUrl) {
          footerBrandMark.innerHTML = `<img src="${escapeHtml(footerLogoUrl)}" alt="Logo footer" style="height:32px; width:auto; object-fit:contain; display:block;" />`;
          if (footerBrandKicker) footerBrandKicker.textContent = "";
        } else {
          footerBrandMark.textContent = "Logo";
          if (footerBrandKicker) footerBrandKicker.textContent = "Placeholder de marca";
        }
      }

      const faviconUrl = typeof branding.faviconUrl === "string" ? branding.faviconUrl.trim() : "";
      if (faviconUrl) {
        let faviconEl = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!faviconEl) {
          faviconEl = document.createElement("link");
          faviconEl.rel = "icon";
          document.head.appendChild(faviconEl);
        }
        faviconEl.href = faviconUrl;
      }

      const whatsappHref =
        typeof brandingContact.whatsapp === "string" && brandingContact.whatsapp.trim()
          ? brandingContact.whatsapp.trim()
          : "";
      if (whatsappHref) {
        const waLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me"]');
        waLinks.forEach((link) => {
          link.href = whatsappHref;
        });
      }

      const footerWhatsapp = document.querySelector<HTMLAnchorElement>("[data-footer-whatsapp]");
      if (footerWhatsapp && whatsappHref) {
        footerWhatsapp.href = whatsappHref;
      }

      const emailValue =
        typeof brandingContact.email === "string" && brandingContact.email.trim()
          ? brandingContact.email.trim()
          : "";
      const footerEmail = document.querySelector<HTMLAnchorElement>("[data-footer-email]");
      if (footerEmail && emailValue) {
        footerEmail.textContent = emailValue;
        footerEmail.href = `mailto:${emailValue}`;
      }

      const addressValue =
        typeof brandingContact.address === "string" && brandingContact.address.trim()
          ? brandingContact.address.trim()
          : "";
      const footerAddress = document.querySelector<HTMLElement>("[data-footer-address]");
      if (footerAddress && addressValue) {
        footerAddress.textContent = addressValue;
      }

      const hero = resolveHeroFromSettings({
        settings,
        defaults: DEFAULT_LANDING_VALUES.hero,
        fallbackWhatsappUrl: whatsappHref,
      });
      const heroTitle = hero.title;
      const heroEyebrow = hero.eyebrow;
      const heroSubtitle = hero.subtitle;
      const heroImage = hero.image;
      const heroPrimaryUrl = hero.primaryUrl;
      const heroPrimaryText = hero.primaryText;
      const heroSecondaryUrl = hero.secondaryUrl;
      const heroSecondaryText = hero.secondaryText;

      if (heroTitle) {
        const titleEl = document.querySelector("[data-hero-title]");
        if (titleEl) {
          const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
          const lines = heroTitle
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 2);
          const currentCombined = normalize(titleEl.textContent || "");
          const nextCombined = normalize(heroTitle);
          const sameText = currentCombined === nextCombined;
          if (!sameText) {
            if (lines.length === 2) {
              titleEl.innerHTML = '<span class="hero-line"></span><span class="hero-line"></span>';
              const spans = titleEl.querySelectorAll(".hero-line");
              if (spans[0]) spans[0].textContent = lines[0];
              if (spans[1]) spans[1].textContent = lines[1];
            } else {
              titleEl.innerHTML = '<span class="hero-line"></span>';
              const span = titleEl.querySelector(".hero-line");
              if (span) span.textContent = heroTitle;
            }
          }
          titleEl.removeAttribute("data-pending");
        }
      }

      if (heroSubtitle) {
        const subtitleEl = document.querySelector("[data-hero-subtitle]");
        if (subtitleEl) {
          subtitleEl.textContent = heroSubtitle;
          subtitleEl.removeAttribute("data-pending");
        }
      }
      const eyebrowEl = document.querySelector("[data-hero-eyebrow]");
      if (eyebrowEl && heroEyebrow) {
        eyebrowEl.textContent = heroEyebrow;
        eyebrowEl.removeAttribute("data-pending");
      } else if (eyebrowEl) {
        eyebrowEl.removeAttribute("data-pending");
      }
      if (heroImage) {
        const heroImg = document.querySelector<HTMLImageElement>(".hero-media img");
        if (heroImg) heroImg.src = heroImage;
      }

      const primaryBtn = document.querySelector("[data-hero-cta-primary]");
      if (primaryBtn && heroPrimaryUrl) {
        primaryBtn.setAttribute("href", heroPrimaryUrl);
      }
      const secondaryBtn = document.querySelector("[data-hero-cta-secondary]");
      if (secondaryBtn && heroSecondaryUrl) {
        secondaryBtn.setAttribute("href", heroSecondaryUrl);
      }

      const quickCallLinks = document.querySelectorAll<HTMLAnchorElement>("[data-quick-call]");
      quickCallLinks.forEach((link) => {
        link.href = heroPrimaryUrl;
      });

      const quickWaLinks = document.querySelectorAll<HTMLAnchorElement>("[data-quick-wa]");
      quickWaLinks.forEach((link) => {
        link.href = heroSecondaryUrl;
      });

      const services = resolveServicesFromSettings({
        settings,
        defaults: DEFAULT_LANDING_VALUES.services,
        heroPrimaryUrl,
      });
      const servicesTitleEl = document.querySelector("[data-services-title]");
      const servicesSubtitleEl = document.querySelector("[data-services-subtitle]");
      if (servicesTitleEl) servicesTitleEl.textContent = services.title;
      if (servicesSubtitleEl) servicesSubtitleEl.textContent = services.subtitle;

      const servicesSection = document.getElementById("servicios");
      if (services.hasDynamicSource && services.items.length === 0 && servicesSection) {
        servicesSection.style.display = "none";
      }

      if (services.items.length) {
        const cards = Array.from(document.querySelectorAll("[data-service-card]"));
        cards.forEach((card, idx) => {
          const item = services.items[idx];
          if (!item) {
            (card as HTMLElement).style.display = "none";
            return;
          }
          const titleEl = card.querySelector("[data-service-title]");
          const descEl = card.querySelector("[data-service-description]");
          const featuresEl = card.querySelector("[data-service-features]");

          if (titleEl && item.title) {
            const [lineOne, lineTwo] = normalizeServiceTitle(item.title, idx);
            titleEl.innerHTML = `<span class="service-title-line">${escapeHtml(lineOne)}</span>${lineTwo ? `<span class="service-title-line">${escapeHtml(lineTwo)}</span>` : ""}`;
          }
          if (descEl && item.description) {
            descEl.textContent = item.description;
          }
          if (featuresEl && item.features.length) {
              featuresEl.innerHTML = item.features
                .map(
                  (feature) =>
                    `<li><i class="fa-solid fa-circle-check"></i>${escapeHtml(feature)}</li>`,
                )
                .join("");
          }
        });
      }

      if (sectionAudience?.data) {
        const audienceRoot = document.querySelector(".audience-wrap");
        const aboutRoot = document.querySelector(".about-section");
        const audienceKicker = audienceRoot?.querySelector(".audience-kicker") ?? aboutRoot?.querySelector("[data-about-kicker]");
        const audienceTitle = audienceRoot?.querySelector(".audience-copy h2") ?? aboutRoot?.querySelector("[data-about-title]");
        const audienceDescription = audienceRoot?.querySelector(".audience-copy p") ?? aboutRoot?.querySelector("[data-about-description]");
        const audienceList = audienceRoot?.querySelector(".audience-list") ?? aboutRoot?.querySelector(".about-points");
        const audiencePrimaryBtn = audienceRoot?.querySelector(".audience-cta .btn-primary");
        const audienceSecondaryBtn = audienceRoot?.querySelector(".audience-cta .btn-ghost");
        const audienceBackImage = audienceRoot?.querySelector(".audience-image-back") ?? aboutRoot?.querySelector(".about-image-primary img");
        const audienceFrontImage = audienceRoot?.querySelector(".audience-image-front") ?? aboutRoot?.querySelector(".about-image-secondary img");

        const audience = resolveAudienceFromSettings({
          settings,
          defaults: DEFAULT_LANDING_VALUES.audience,
          heroPrimaryUrl,
        });
        if (audienceKicker) audienceKicker.textContent = audience.kicker;
        if (audienceTitle) audienceTitle.textContent = audience.title;
        if (audienceDescription) audienceDescription.textContent = audience.description;
        if (audienceList && audience.bullets.length) {
          if (audienceList.classList.contains("about-points")) {
            audienceList.innerHTML = audience.bullets
              .map(
                (item) =>
                  `<article class="about-point" data-about-highlight><strong>${escapeHtml(item.text)}</strong></article>`,
              )
              .join("");
          } else {
            audienceList.innerHTML = audience.bullets
              .map(
                (item) =>
                  `<li><i class="fa-solid ${escapeHtml(item.icon || "fa-circle-check")}"></i>${escapeHtml(item.text)}</li>`,
              )
              .join("");
          }
        }
        if (audiencePrimaryBtn) {
          audiencePrimaryBtn.textContent = audience.ctaPrimary.text;
          audiencePrimaryBtn.setAttribute("href", audience.ctaPrimary.url);
        }
        if (audienceSecondaryBtn) {
          audienceSecondaryBtn.textContent = audience.ctaSecondary.text;
          audienceSecondaryBtn.setAttribute("href", audience.ctaSecondary.url);
        }
        if (
          audienceBackImage instanceof HTMLImageElement &&
          audience.images.back
        ) {
          audienceBackImage.src = audience.images.back;
        }
        if (
          audienceFrontImage instanceof HTMLImageElement &&
          audience.images.front
        ) {
          audienceFrontImage.src = audience.images.front;
        }
      }

      if (sectionTrust?.data) {
        const trustRoot = document.getElementById("certificacion");
        const trustImage = trustRoot?.querySelector<HTMLImageElement>(".trust-media-bleed img");
        const trustKicker = trustRoot?.querySelector<HTMLElement>("[data-trust-kicker]");
        const trustTitle = trustRoot?.querySelector<HTMLElement>("[data-trust-title]");
        const trustSubtitle = trustRoot?.querySelector<HTMLElement>("[data-trust-subtitle]");
        const trustBullets = trustRoot?.querySelector<HTMLElement>("[data-trust-bullets]");
        const trustLogoPrimary = trustRoot?.querySelector<HTMLImageElement>("[data-trust-logo-primary]");
        const trustLogoSecondary = trustRoot?.querySelector<HTMLImageElement>("[data-trust-logo-secondary]");
        const trust = resolveTrustFromSettings({
          settings,
          defaults: DEFAULT_LANDING_VALUES.trust,
        });

        if (trustKicker) trustKicker.textContent = trust.kicker;
        if (trustTitle) trustTitle.textContent = trust.title;
        if (trustSubtitle) trustSubtitle.textContent = trust.subtitle;
        if (trustImage && trust.image) trustImage.src = trust.image;
        if (trustBullets && trust.bullets.length) {
          trustBullets.innerHTML = trust.bullets
            .map(
              (item) =>
                `<li><i class="fa-solid ${escapeHtml(item.icon || "fa-check")}" aria-hidden="true"></i>${escapeHtml(item.text)}</li>`,
            )
            .join("");
        }
        if (trustLogoPrimary && trust.logos.primary) trustLogoPrimary.src = trust.logos.primary;
        if (trustLogoSecondary && trust.logos.secondary) trustLogoSecondary.src = trust.logos.secondary;
      }

      if (sectionProcess?.data) {
        const processRoot = document.getElementById("proceso");
        const processImage = processRoot?.querySelector<HTMLImageElement>(".process-media img");
        const processKicker = processRoot?.querySelector<HTMLElement>("[data-process-kicker]");
        const processTitle = processRoot?.querySelector<HTMLElement>("[data-process-title]");
        const processSubtitle = processRoot?.querySelector<HTMLElement>("[data-process-subtitle]");
        const processTimeline = processRoot?.querySelector<HTMLElement>("[data-process-timeline]");
        const process = resolveProcessFromSettings({
          settings,
          defaults: DEFAULT_LANDING_VALUES.process,
        });

        if (processKicker) processKicker.textContent = process.kicker;
        if (processTitle) processTitle.textContent = process.title;
        if (processSubtitle) processSubtitle.textContent = process.subtitle;
        if (processImage && process.image) processImage.src = process.image;
        if (processTimeline && process.steps.length) {
          processTimeline.innerHTML = process.steps
            .map(
              (step, index) => `
                <article class="process-step" data-process-step>
                  <span class="process-number">${String(index + 1).padStart(2, "0")}</span>
                  <div class="process-step-copy">
                    <h3>${escapeHtml(step.title)}</h3>
                    <p>${escapeHtml(step.description)}</p>
                  </div>
                </article>
              `,
            )
            .join("");
        }
      }

      if (sectionProjects?.data) {
        const projectsRoot = document.getElementById("trabajos");
        const projectsTitle = projectsRoot?.querySelector(".projects-head h2");
        const projectsTrackTop = projectsRoot?.querySelector("[data-projects-track-top]");
        const projectsTrackBottom = projectsRoot?.querySelector("[data-projects-track-bottom]");
        const projects = resolveProjectsFromSettings({
          settings,
          defaults: DEFAULT_LANDING_VALUES.projects,
        });
        if (projectsTitle && projects.title) {
          projectsTitle.textContent = projects.title;
        }
        const renderProjectsGroup = (items: typeof projects.items) => {
          const source = items.length ? items : projects.items;
          return source
            .map((item) => {
              const wideClass = item.size === "wide" ? " project-card-wide" : "";
              return `
                <figure class="project-card${wideClass}">
                  <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title)}" loading="lazy" />
                  <figcaption class="project-overlay"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.location)}</span></figcaption>
                </figure>
              `;
            })
            .join("");
        };
        if (projects.items.length) {
          const topItems = projects.items;
          const bottomItems = [...projects.items].reverse();
          const topMarkup = renderProjectsGroup(topItems);
          const bottomMarkup = renderProjectsGroup(bottomItems);
          if (projectsTrackTop) {
            projectsTrackTop.innerHTML = `<div class="projects-marquee-group">${topMarkup}</div><div class="projects-marquee-group" aria-hidden="true">${topMarkup}</div>`;
          }
          if (projectsTrackBottom) {
            projectsTrackBottom.innerHTML = `<div class="projects-marquee-group">${bottomMarkup}</div><div class="projects-marquee-group" aria-hidden="true">${bottomMarkup}</div>`;
          }
        }
      }

      if (sectionUrgency?.data) {
        const trustBandRoot = document.querySelector(".trust-band");
        const trustBandTitle = trustBandRoot?.querySelector(".trust-band-copy h2");
        const trustBandDescription = trustBandRoot?.querySelector(".trust-band-copy p");
        const urgency = resolveUrgencyFromSettings({
          settings,
          defaults: DEFAULT_LANDING_VALUES.urgency,
          heroPrimaryUrl,
        });

        if (trustBandTitle && urgency.title) {
          trustBandTitle.textContent = urgency.title;
        }
        if (trustBandDescription && urgency.description) {
          trustBandDescription.textContent = urgency.description;
        }
      }

      const faqSectionEl = document.getElementById("faq");
      const faq = resolveFaqFromSettings({
        settings,
        defaults: DEFAULT_LANDING_VALUES.faq,
      });
      const faqTitle = document.querySelector("[data-faq-title]");
      if (faqTitle) faqTitle.textContent = faq.title;
      if (faq.items.length) {
        const faqList = document.querySelector("[data-faq-list]");
        if (faqList) {
          faqList.innerHTML = faq.items
            .map((faq) => {
              return `
                <article class="faq-item">
                  <button class="faq-btn" type="button">${faq.question} <i class="fa-solid fa-chevron-down"></i></button>
                  <div class="faq-content"><p>${faq.answer}</p></div>
                </article>
              `;
            })
            .join("");
          bindFaqButtons();
        }
      } else if (faqSectionEl && faq.hasDynamicSource) {
        faqSectionEl.style.display = "none";
      }

      if (sectionContact?.data) {
        const contactRoot = document.querySelector(".contact-section");
        const contactKicker = contactRoot?.querySelector(".contact-kicker");
        const contactTitle = contactRoot?.querySelector(".contact-title");
        const contactSubmit = contactRoot?.querySelector(".contact-submit");
        const contact = resolveContactBannerFromSettings({
          settings,
          defaults: DEFAULT_LANDING_VALUES.contact,
        });
        if (contactRoot) {
          if (contact.backgroundImage) {
            (contactRoot as HTMLElement).style.backgroundImage = `url("${contact.backgroundImage}")`;
          } else {
            (contactRoot as HTMLElement).style.backgroundImage = "";
          }
        }
        if (contactKicker) contactKicker.textContent = contact.kicker;
        if (contactTitle) contactTitle.innerHTML = escapeHtml(contact.title).replace(/\n/g, "<br />");
        if (contactSubmit) {
          contactSubmit.textContent = contact.submitText;
          contactSubmit.setAttribute("data-default-text", contact.submitText);
        }
      }

      const testimonials = resolveTestimonialsFromSettings({
        settings,
        defaults: DEFAULT_LANDING_VALUES.testimonials,
      });
      const testimonialsSectionEl = document.getElementById("testimonios");
      if (testimonials.items.length) {
        const testimonialsTitle = document.querySelector(".clients-title");
        if (testimonialsTitle) testimonialsTitle.textContent = testimonials.title;

        const clientsStage = document.querySelector("[data-clients-stage]");
        if (clientsStage) {
          clientsStage.innerHTML = testimonials.items
            .map((item) => {
              return `
                <article class="client-slide">
                  <div class="client-slide-head">
                    <img src="${escapeHtml(item.avatar)}" alt="${escapeHtml(item.name)}" loading="lazy" />
                    <div>
                      <strong>${escapeHtml(item.name)}</strong>
                      <span>${escapeHtml(item.location)}</span>
                    </div>
                  </div>
                  <div class="client-slide-rating" aria-hidden="true">★★★★★</div>
                  <p class="client-slide-text">${escapeHtml(item.quote)}</p>
                </article>
              `;
            })
            .join("");
        }

        window.requestAnimationFrame(setupClientsCarousel);
      } else if (testimonialsSectionEl && testimonials.hasSectionSource) {
        testimonialsSectionEl.style.display = "none";
      }

      const root = document.documentElement;
      if (settings.colors) {
        if (settings.colors.primary) root.style.setProperty("--blue", settings.colors.primary);
        if (settings.colors.secondary) root.style.setProperty("--orange", settings.colors.secondary);
        if (settings.colors.text) {
          root.style.setProperty("--text", settings.colors.text);
          root.style.setProperty("--navy", settings.colors.text);
          root.style.setProperty("--muted", settings.colors.text);
        }
        if (settings.colors.background) {
          root.style.setProperty("--bg", settings.colors.background);
          root.style.setProperty("--surface", settings.colors.background);
          document.body.style.backgroundColor = settings.colors.background;
        }
        if (settings.colors.text) document.body.style.color = settings.colors.text;
      }

      if (settings.typography) {
        if (settings.typography.baseSize) root.style.setProperty("--font-size-base", settings.typography.baseSize);
        if (settings.typography.lineHeight) root.style.setProperty("--line-height-base", settings.typography.lineHeight);

        const fontStack = settings.typography.font || settings.typography.fontFamily;
        if (fontStack) {
          const value = fontStack.trim();
          const isExternalFont = /^https?:\/\//i.test(value);

          if (isExternalFont) {
            ensureSwapFontLink(value);
            const parsedFamily = parseGoogleFamilyFromUrl(value);
            if (parsedFamily) {
              root.style.setProperty("--font-body", `"${parsedFamily}", Inter, sans-serif`);
            }
          } else {
            root.style.setProperty("--font-body", `${value}, Inter, sans-serif`);
          }
        }
      }
    };

    const hydrateFromBackend = async () => {
      try {
        if (!siteSlug) return;
        const payload = await fetchSettingsBySlug({ slug: siteSlug, mode: "published" });
        applySettings(payload.settings);
      } catch {
        // Keep static content as fallback.
      }
    };

    const initDynamicContent = async () => {
      void ensureIconsReady();
      void waitForFonts();
      await hydrateFromBackend();
    };
    void initDynamicContent();

    const clientsState = {
      active: 1,
      pointerId: null as number | null,
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
      pressed: false,
      dragging: false,
      dragActivated: false,
      moved: false,
      bound: false,
    };

    const updateClientsCarousel = () => {
      const stage = document.querySelector<HTMLElement>("[data-clients-stage]");
      const viewport = document.querySelector<HTMLElement>("[data-clients-viewport]");
      if (!stage || !viewport) return;
      const slides = Array.from(stage.querySelectorAll<HTMLElement>(".client-slide"));
      if (!slides.length) return;
      const total = slides.length;
      clientsState.active = ((clientsState.active % total) + total) % total;
      slides.forEach((slide, index) => {
        slide.dataset.clientIndex = String(index);
        let offset = index - clientsState.active;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;
        slide.classList.remove("is-active", "is-prev", "is-next", "is-hidden-left", "is-hidden-right");
        if (offset === 0) slide.classList.add("is-active");
        else if (offset === -1) slide.classList.add("is-prev");
        else if (offset === 1) slide.classList.add("is-next");
        else if (offset < 0) slide.classList.add("is-hidden-left");
        else slide.classList.add("is-hidden-right");
      });
      viewport.style.setProperty("--clients-drag-offset", "0px");
    };

    const shiftClientsCarousel = (delta: number) => {
      const stage = document.querySelector<HTMLElement>("[data-clients-stage]");
      if (!stage) return;
      const slides = stage.querySelectorAll(".client-slide");
      if (!slides.length) return;
      clientsState.active += delta;
      updateClientsCarousel();
    };

    const setupClientsCarousel = () => {
      const viewport = document.querySelector<HTMLElement>("[data-clients-viewport]");
      const stage = document.querySelector<HTMLElement>("[data-clients-stage]");
      const prev = document.querySelector<HTMLButtonElement>("[data-clients-prev]");
      const next = document.querySelector<HTMLButtonElement>("[data-clients-next]");
      if (!viewport || !stage) return;
      const slides = stage.querySelectorAll(".client-slide");
      if (!slides.length) return;
      if (clientsState.active >= slides.length) {
        clientsState.active = Math.max(0, Math.min(1, slides.length - 1));
      }
      updateClientsCarousel();
      if (clientsState.bound) return;
      clientsState.bound = true;

      prev?.addEventListener("click", () => shiftClientsCarousel(-1));
      next?.addEventListener("click", () => shiftClientsCarousel(1));

      stage.addEventListener("click", (event) => {
        if (clientsState.moved) return;
        const target = event.target as HTMLElement | null;
        const slide = target?.closest<HTMLElement>(".client-slide");
        if (!slide) return;
        const nextIndex = Number(slide.dataset.clientIndex);
        if (Number.isNaN(nextIndex) || nextIndex === clientsState.active) return;
        clientsState.active = nextIndex;
        updateClientsCarousel();
      });

      viewport.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        clientsState.pointerId = event.pointerId;
        clientsState.startX = event.clientX;
        clientsState.startY = event.clientY;
        clientsState.deltaX = 0;
        clientsState.deltaY = 0;
        clientsState.pressed = true;
        clientsState.dragging = false;
        clientsState.dragActivated = false;
        clientsState.moved = false;
      });

      viewport.addEventListener("pointermove", (event) => {
        if (!clientsState.pressed) return;
        clientsState.deltaX = event.clientX - clientsState.startX;
        clientsState.deltaY = event.clientY - clientsState.startY;

        if (!clientsState.dragActivated) {
          const absX = Math.abs(clientsState.deltaX);
          const absY = Math.abs(clientsState.deltaY);
          if (absX < 18) return;
          if (absY > absX * 0.75) {
            clientsState.pressed = false;
            clientsState.deltaX = 0;
            clientsState.deltaY = 0;
            return;
          }
          clientsState.dragging = true;
          clientsState.dragActivated = true;
          viewport.classList.add("is-dragging");
          viewport.setPointerCapture(event.pointerId);
        }

        if (!clientsState.dragging) return;
        if (Math.abs(clientsState.deltaX) > 12) {
          clientsState.moved = true;
          event.preventDefault();
        }
        viewport.style.setProperty("--clients-drag-offset", `${clientsState.deltaX * 0.24}px`);
      });

      const stopClientsDrag = () => {
        if (!clientsState.pressed && !clientsState.dragging) return;
        const delta = clientsState.deltaX;
        viewport.classList.remove("is-dragging");
        viewport.style.setProperty("--clients-drag-offset", "0px");
        clientsState.pressed = false;
        clientsState.dragging = false;
        clientsState.dragActivated = false;
        clientsState.deltaX = 0;
        clientsState.deltaY = 0;
        if (Math.abs(delta) > 110) {
          shiftClientsCarousel(delta > 0 ? -1 : 1);
        } else {
          updateClientsCarousel();
        }
      };

      viewport.addEventListener("pointerup", (event) => {
        if (clientsState.pointerId !== null && viewport.hasPointerCapture(event.pointerId)) {
          viewport.releasePointerCapture(event.pointerId);
        }
        stopClientsDrag();
      });
      viewport.addEventListener("pointercancel", stopClientsDrag);
      viewport.addEventListener("dragstart", (event) => event.preventDefault());
      viewport.addEventListener("click", (event) => {
        if (clientsState.moved) {
          event.preventDefault();
          clientsState.moved = false;
        }
      });
    };

    setupClientsCarousel();

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("scroll", toggleNav);
      window.removeEventListener("resize", toggleNav);
      window.removeEventListener("keydown", onKeyDown);
      io.disconnect();
      metricsIo.disconnect();
    };
  }, []);

  return (
    <div
      className={`landing-shell ${landingBodyFont.variable} ${landingDisplayFont.variable}`}
      data-landing-shell
    >
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />
      <div dangerouslySetInnerHTML={{ __html: landingMarkup }} />
    </div>
  );
}
