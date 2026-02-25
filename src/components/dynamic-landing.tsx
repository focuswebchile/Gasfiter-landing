"use client";

import { useEffect } from "react";

const landingStyles = String.raw`
      :root {
        --navy: #0a1628;
        --blue: #1565c0;
        --orange: #ff6f00;
        --text: #1f2937;
        --muted: #64748b;
        --bg: #f6f9ff;
        --surface: #f2f4f7;
        --wa: #25d366;
        --btn-shadow: 0 12px 26px rgba(15, 23, 42, 0.16);
        --font-body: "Inter", sans-serif;
        --font-hero: "Barlow Condensed", sans-serif;
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
        font-family: var(--font-body);
        font-size: var(--font-size-base);
        line-height: var(--line-height-base);
        color: var(--text);
        background: var(--surface);
      }

      h1,
      h2,
      h3 {
        margin: 0;
        line-height: 1.05;
        letter-spacing: 0.2px;
        font-family: var(--font-hero);
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
        padding: 72px 20px;
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
        font-family: var(--font-hero);
        font-size: 1.65rem;
        font-weight: 700;
        color: var(--navy);
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
        background: var(--orange);
        color: #111827;
      }

      .btn-ghost {
        background: transparent;
        color: var(--blue);
        border: 2px solid rgba(21, 101, 192, 0.22);
      }

      .hero {
        min-height: 100vh;
        width: 100%;
        padding: 0;
        background: var(--surface);
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
        background: var(--surface);
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
        background: rgba(255, 111, 0, 0.12);
        color: var(--orange);
        border: 1px solid rgba(255, 111, 0, 0.28);
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }

      .hero h1 {
        margin-top: 12px;
        font-size: clamp(2.2rem, 8.5vw, 4.8rem);
        color: var(--text);
        max-width: none;
        letter-spacing: -0.4px;
        line-height: 0.94;
        visibility: hidden;
      }

      .hero-line {
        display: block;
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
        margin-top: 24px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .hero-stat {
        border-top: 1px solid #dbe3ef;
        padding-top: 10px;
        padding-left: 0;
      }

      .hero-stat strong {
        display: block;
        font-family: var(--font-hero);
        font-size: 2.25rem;
        line-height: 1;
        color: var(--navy);
      }

      .hero-stat span {
        display: block;
        font-size: 14px;
        color: #4b5563;
        font-weight: 600;
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
        font-size: clamp(2rem, 5vw, 4rem);
        line-height: 0.95;
        color: var(--navy);
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

      .clients-section {
        background: var(--surface);
      }

      .clients-section .container {
        max-width: 1060px;
      }

      .clients-head {
        text-align: center;
      }

      .clients-kicker {
        display: inline-block;
        font-size: 12px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #5b6472;
        font-weight: 800;
      }

      .clients-title {
        margin-top: 10px;
        font-size: clamp(2rem, 5.2vw, 4rem);
        color: var(--text);
        line-height: 0.96;
      }

      .clients-grid {
        margin-top: 26px;
        display: flex;
        gap: 18px;
        overflow-x: auto;
        scrollbar-width: none;
        scroll-behavior: smooth;
        scroll-snap-type: none;
        cursor: grab;
        padding-bottom: 4px;
      }

      .clients-grid::-webkit-scrollbar {
        display: none;
      }

      .clients-grid.is-dragging {
        cursor: grabbing;
        scroll-behavior: auto;
      }

      .client-card {
        flex: 0 0 min(92vw, 760px);
        background: #f1f4f7;
        border: 1px solid #e3e9ef;
        border-radius: 0;
        padding: 24px;
        user-select: none;
        position: relative;
      }

      .client-card img {
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
      }

      @media (hover: hover) and (pointer: fine) {
        .client-card:hover {
          cursor: grab;
        }

        .client-card:active {
          cursor: grabbing;
        }
      }

      .client-quote {
        color: #0f7a83;
        font-size: 2.8rem;
        line-height: 1;
        font-weight: 800;
        margin-bottom: 8px;
      }

      .client-text {
        color: var(--text);
        font-size: 1.03rem;
        line-height: 1.6;
        max-width: 42ch;
      }

      .client-person {
        margin-top: 18px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .client-person img {
        width: 56px;
        height: 56px;
        border-radius: 999px;
        object-fit: cover;
      }

      .client-person strong {
        display: block;
        color: var(--text);
        font-size: 1.05rem;
      }

      .client-person span {
        display: block;
        color: #7a8695;
        font-size: 0.95rem;
      }

      .clients-dots {
        margin-top: 18px;
        display: flex;
        justify-content: center;
        gap: 10px;
      }

      .clients-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        border: 1px solid #bec8d3;
        background: transparent;
      }

      .clients-dot.active {
        background: #0f7a83;
        border-color: #0f7a83;
      }

      .clients-stats {
        margin-top: 58px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .clients-stat {
        position: relative;
        min-height: 132px;
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .clients-stat-number {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        text-align: center;
        font-size: clamp(4rem, 10vw, 8.5rem);
        line-height: 1;
        color: rgba(31, 41, 51, 0.07);
        font-weight: 800;
        letter-spacing: -2px;
      }

      .clients-stat-label {
        position: relative;
        z-index: 1;
        color: #2b3440;
        font-size: 2rem;
        font-family: var(--font-hero);
        font-weight: 700;
      }

      .card {
        background: var(--surface);
        border: 1px solid #e2e8f0;
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 10px 24px rgba(10, 22, 40, 0.06);
      }

      .services-grid {
        margin-top: 20px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        align-items: stretch;
      }

      .service-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        border-radius: 20px;
      }

      .service-card h3 {
        color: var(--navy);
        font-size: 2rem;
        line-height: 0.98;
        min-height: 2.1em;
      }

      .service-card > p {
        margin-top: 10px;
        color: #475569;
        min-height: 4.8em;
      }

      .service-icon {
        width: 50px;
        height: 50px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: #eaf2ff;
        color: var(--blue);
        font-size: 20px;
        margin-bottom: 12px;
      }

      .checklist {
        margin: 14px 0 20px;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
        flex: 1;
      }

      .checklist li {
        font-size: 14px;
        color: #334155;
      }

      .checklist i {
        color: var(--orange);
        margin-right: 8px;
      }

      .service-card .btn {
        margin-top: auto;
        min-height: 50px;
        width: 100%;
      }

      .projects-section {
        background: var(--bg);
      }

      .projects-head {
        display: grid;
        gap: 14px;
        align-items: center;
      }

      .projects-head h2 {
        font-size: clamp(2.4rem, 6vw, 4.1rem);
        color: var(--text);
        line-height: 0.95;
      }

      .projects-desc {
        color: var(--muted);
        font-size: 1.05rem;
        max-width: 60ch;
      }

      .projects-controls {
        display: flex;
        gap: 10px;
      }

      .projects-btn {
        width: 54px;
        height: 54px;
        border-radius: 999px;
        border: 1px solid #cfd8e8;
        background: transparent;
        color: #1f314f;
        display: grid;
        place-items: center;
        font-size: 1.06rem;
        cursor: pointer;
      }

      .projects-btn:hover {
        background: #ffffff;
      }

      .projects-wrap {
        margin-top: 24px;
        width: 100%;
        margin-left: 0;
        padding: 0 clamp(18px, 3.2vw, 48px);
        overflow: hidden;
      }

      .projects-track {
        display: flex;
        gap: 22px;
        overflow-x: auto;
        scrollbar-width: none;
        scroll-behavior: smooth;
        scroll-snap-type: none;
        cursor: grab;
        padding-bottom: 8px;
        touch-action: pan-y;
        -webkit-overflow-scrolling: touch;
      }

      .projects-track::-webkit-scrollbar {
        display: none;
      }

      .projects-track.is-dragging {
        cursor: grabbing;
        scroll-behavior: auto;
      }

      .project-card {
        position: relative;
        flex: 0 0 clamp(290px, 27vw, 380px);
        aspect-ratio: 1 / 1;
        border-radius: 16px;
        overflow: hidden;
        user-select: none;
      }

      .project-card-wide {
        flex-basis: clamp(430px, 40vw, 620px);
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
        background: linear-gradient(180deg, rgba(6, 12, 24, 0.25), rgba(6, 12, 24, 0.62));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 18px;
        transition: opacity 0.22s ease, transform 0.22s ease;
      }

      .project-overlay strong {
        display: block;
        color: #ffffff;
        font-size: clamp(1.35rem, 2.1vw, 2rem);
        line-height: 1.02;
        font-family: "Inter", sans-serif;
        font-weight: 800;
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

      .cta-dark {
        background: linear-gradient(135deg, #081221, #13345b);
        color: #e9f1ff;
        text-align: center;
      }

      .cta-dark h2 {
        font-size: clamp(2rem, 5vw, 3.6rem);
      }

      .form-grid {
        margin-top: 20px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 18px;
      }

      .contact-section {
        position: relative;
        background: url("/images/contact.jpg") center/cover no-repeat;
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
        font-size: clamp(2rem, 4.5vw, 4rem);
        line-height: 0.95;
        color: var(--text);
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
        padding: 0 16px;
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
        gap: 20px;
      }

      .footer h3 {
        color: #fff;
        font-size: 1.5rem;
      }

      .phone-big {
        color: var(--orange);
        font-family: var(--font-hero);
        font-weight: 800;
        font-size: 2rem;
      }

      .comunas {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        font-size: 14px;
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
          grid-template-columns: 1.4fr 1fr 1fr;
        }
      }

      @media (max-width: 767px) {
        .work-strip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .work-strip img {
          height: 180px;
        }
      }

      @media (min-width: 992px) {
        .top-nav {
          left: auto;
          right: 0;
          width: 50vw;
          opacity: 1;
          transform: none;
          pointer-events: auto;
        }

        .top-nav.nav--desktop-hidden {
          opacity: 0;
          transform: translateY(-120%);
          pointer-events: none;
        }

        .top-nav.nav--visible {
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

        .top-nav.nav--visible .brand {
          display: none;
        }

        .top-nav-inner {
          padding: 22px 38px;
        }

        .top-nav.nav--visible .top-nav-inner {
          max-width: none;
          margin: 0;
          padding: 22px 38px;
        }

        .top-nav .nav-links,
        .top-nav.nav--visible .nav-links {
          display: flex;
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
        }

        .hero h1 {
          font-size: clamp(3rem, 4.3vw, 4.85rem);
        }

        .hero-line {
          white-space: normal;
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

        .mobile-sticky {
          display: none;
        }
      }
`;

const landingMarkup = String.raw`
    <nav class="top-nav">
      <div class="top-nav-inner">
        <a class="brand" href="#inicio">Gasfiter 24/7</a>
        <div class="nav-links">
          <a href="#inicio">Inicio</a>
          <a href="#servicios">Servicios</a>
          <a href="#trabajos">Trabajos</a>
          <a href="#testimonios">Clientes</a>
          <a href="#faq">FAQ</a>
          <a href="#contacto">Contacto</a>
        </div>
        <a class="btn btn-primary" href="tel:+569XXXXXXX" style="padding: 10px 14px; font-size: 13px">📞 Llamar</a>
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
            <span class="eyebrow">SERVICIO 24/7 · SANTIAGO</span>
            <h1 data-hero-title>
              <span class="hero-line">Gasfiter urgente en Santiago</span>
              <span class="hero-line">Llegamos en menos de 40 minutos</span>
            </h1>
            <p class="hero-lead" data-hero-subtitle>
              Fugas, destapes, calefont e instalaciones. Respuesta inmediata, diagnóstico claro y solución en terreno.
            </p>
            <div class="badges">
              <span class="badge"><i class="fa-solid fa-bolt" aria-hidden="true"></i>Disponible ahora</span>
              <span class="badge"><i class="fa-solid fa-hand-holding-dollar" aria-hidden="true"></i>Pago contra trabajo</span>
              <span class="badge"><i class="fa-solid fa-certificate" aria-hidden="true"></i>Técnicos certificados</span>
            </div>
            <div class="hero-cta">
              <a class="btn btn-primary" href="tel:+569XXXXXXX" data-hero-cta-primary>
                <i class="fa-solid fa-phone-volume" aria-hidden="true"></i> LLAMAR AHORA +56 9 XXXX XXXX
              </a>
              <a class="btn btn-ghost" href="https://wa.me/569XXXXXXX" target="_blank" rel="noopener noreferrer" data-hero-cta-secondary>
                <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp
              </a>
            </div>
            <div class="hero-stats">
              <div class="hero-stat">
                <strong>20+</strong>
                <span>Urgencias por día</span>
              </div>
              <div class="hero-stat">
                <strong>100+</strong>
                <span>Clientes semanales</span>
              </div>
              <div class="hero-stat">
                <strong>10+</strong>
                <span>Nuevos casos diarios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section band-dark reveal">
      <div class="container audience-wrap">
        <div class="audience-copy">
          <span class="audience-kicker">¿Para quién es este servicio?</span>
          <h2>Atención urgente para hogares y negocios en Santiago</h2>
          <p>
            Atendemos dueños de casa, arrendatarios, pymes y administradores de edificios en Santiago que necesitan
            solución hoy, no mañana.
          </p>
          <ul class="audience-list">
            <li><i class="fa-solid fa-circle-check"></i>Respuesta rápida con horario 24/7 real</li>
            <li><i class="fa-solid fa-circle-check"></i>Diagnóstico claro antes de intervenir</li>
            <li><i class="fa-solid fa-circle-check"></i>Trabajo limpio y garantía por escrito</li>
          </ul>
          <div class="audience-cta">
            <a class="btn btn-primary" href="tel:+569XXXXXXX">📞 +56 9 XXXX XXXX</a>
            <a class="btn btn-ghost" href="#contacto">Agendar visita</a>
          </div>
        </div>
        <figure class="audience-visual">
          <img
            class="audience-image audience-image-back"
            src="/images/gasfiter-calefont.webp"
            alt="Sistema de cañerías y válvulas en instalación de gasfitería"
            loading="lazy"
          />
          <img
            class="audience-image audience-image-front"
            src="/images/gasfiter-emergencias.webp"
            alt="Cliente estrechando la mano a técnico gasfiter"
            loading="lazy"
          />
        </figure>
      </div>
    </section>

    <section class="section reveal" id="servicios">
      <div class="container">
        <h2 style="font-size: clamp(2rem, 6vw, 3.5rem); color: var(--navy)" data-services-title>¿Qué problema tienes ahora?</h2>
        <div class="services-grid">
          <article class="card service-card" data-service-card>
            <div class="service-icon"><i class="fa-solid fa-droplet"></i></div>
            <h3 data-service-title>Filtraciones y fugas</h3>
            <p data-service-description>Detección rápida y reparación inmediata para evitar daños mayores en muros, pisos y techos.</p>
            <ul class="checklist">
              <li><i class="fa-solid fa-circle-check"></i>Fugas visibles y ocultas</li>
              <li><i class="fa-solid fa-circle-check"></i>Reparación de llaves y cañerías</li>
              <li><i class="fa-solid fa-circle-check"></i>Control de humedad inicial</li>
              <li><i class="fa-solid fa-circle-check"></i>Prueba de funcionamiento</li>
            </ul>
            <a class="btn btn-primary" href="tel:+569XXXXXXX">📞 Llamar por esto</a>
          </article>

          <article class="card service-card" data-service-card>
            <div class="service-icon"><i class="fa-solid fa-toilet"></i></div>
            <h3 data-service-title>Destapes urgentes</h3>
            <p data-service-description>Atendemos obstrucciones críticas en cocina, baño y desagües con herramientas profesionales.</p>
            <ul class="checklist">
              <li><i class="fa-solid fa-circle-check"></i>Destape de lavaplatos</li>
              <li><i class="fa-solid fa-circle-check"></i>Destape de WC</li>
              <li><i class="fa-solid fa-circle-check"></i>Limpieza de sifones</li>
              <li><i class="fa-solid fa-circle-check"></i>Prevención de rebalses</li>
            </ul>
            <a class="btn btn-primary" href="tel:+569XXXXXXX">📞 Llamar por esto</a>
          </article>

          <article class="card service-card" data-service-card>
            <div class="service-icon"><i class="fa-solid fa-screwdriver-wrench"></i></div>
            <h3 data-service-title>Instalaciones y reparaciones</h3>
            <p data-service-description>Grifería, lavamanos, calefont y artefactos sanitarios con instalación segura y rápida.</p>
            <ul class="checklist">
              <li><i class="fa-solid fa-circle-check"></i>Instalación de grifería</li>
              <li><i class="fa-solid fa-circle-check"></i>Reparación de calefont</li>
              <li><i class="fa-solid fa-circle-check"></i>Cambio de conexiones</li>
              <li><i class="fa-solid fa-circle-check"></i>Ajustes y sellado final</li>
            </ul>
            <a class="btn btn-primary" href="tel:+569XXXXXXX">📞 Llamar por esto</a>
          </article>
        </div>
      </div>
    </section>

    <section class="section projects-section reveal" id="trabajos">
      <div class="container">
        <div class="projects-head">
          <h2>Trabajos realizados en Santiago</h2>
          <p class="projects-desc">
            Casos reales de instalación, reparación y mantención. Haz click y arrastra para deslizar las imágenes hacia
            la izquierda o derecha.
          </p>
          <div class="projects-controls" aria-label="Controles carrusel proyectos">
            <button class="projects-btn" type="button" data-projects-prev aria-label="Anterior">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <button class="projects-btn" type="button" data-projects-next aria-label="Siguiente">
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
        <div class="projects-wrap">
          <div class="projects-track" data-projects-track>
            <figure class="project-card">
              <img
                src="/images/gasfiter-destape.webp"
                alt="Destape urgente en baño"
                loading="lazy"
              />
              <figcaption class="project-overlay"><strong>Destape urgente</strong><span>Providencia</span></figcaption>
            </figure>
            <figure class="project-card project-card-wide">
              <img
                src="/images/gasfiter-calefont.webp"
                alt="Instalación calefont en hogar"
                loading="lazy"
              />
              <figcaption class="project-overlay"><strong>Instalación calefont</strong><span>Las Condes</span></figcaption>
            </figure>
            <figure class="project-card">
              <img
                src="/images/gasfiter-mantencion.webp"
                alt="Mantención preventiva en taller"
                loading="lazy"
              />
              <figcaption class="project-overlay"><strong>Mantención preventiva</strong><span>Santiago Centro</span></figcaption>
            </figure>
            <figure class="project-card">
              <img
                src="/images/gasfiter-griferia.webp"
                alt="Cambio de grifería en cocina"
                loading="lazy"
              />
              <figcaption class="project-overlay"><strong>Cambio de grifería</strong><span>La Florida</span></figcaption>
            </figure>
            <figure class="project-card">
              <img
                src="/images/gasfiter-fugas.webp"
                alt="Reparación de cañería en muro"
                loading="lazy"
              />
              <figcaption class="project-overlay"><strong>Reparación de fugas</strong><span>Ñuñoa</span></figcaption>
            </figure>
            <figure class="project-card">
              <img
                src="/images/gasfiter-emergencias.webp"
                alt="Destape de desagüe en departamento"
                loading="lazy"
              />
              <figcaption class="project-overlay"><strong>Destape de desagüe</strong><span>San Miguel</span></figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>

    <section class="section cta-dark reveal">
      <div class="container">
        <h2>¿Tienes una urgencia ahora?</h2>
        <p style="margin: 10px auto 18px; max-width: 56ch">Te atendemos hoy, en tu comuna, con respuesta rápida y técnica.</p>
        <a class="btn btn-primary" href="tel:+569XXXXXXX" style="font-size: 1rem; padding: 16px 26px">📞 Llamar ahora</a>
      </div>
    </section>

    <section class="section contact-section reveal" id="contacto">
      <div class="container contact-layout">
        <div class="contact-card">
          <span class="contact-kicker">CONTACTO</span>
          <h2 class="contact-title">¿Tienes preguntas?<br />Escríbenos ahora.</h2>
          <!-- Conectar a Formspree: action="https://formspree.io/f/TU_ID" method="POST" -->
          <form class="contact-form" action="#" method="POST">
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
            <button class="btn contact-submit contact-full" type="submit">Enviar solicitud</button>
          </form>
        </div>
      </div>
    </section>

    <section class="section clients-section reveal" id="testimonios">
      <div class="container">
        <div class="clients-head">
          <span class="clients-kicker">Testimonios</span>
          <h2 class="clients-title">Comentarios de nuestros clientes</h2>
        </div>

        <div class="clients-grid" data-clients-track>
          <article class="client-card">
            <div class="client-quote">”</div>
            <p class="client-text">
              Llegaron rápido, explicaron todo con claridad y dejaron el trabajo impecable. Recomendados para
              urgencias y reparaciones en casa.
            </p>
            <div class="client-person">
              <img src="/images/gasfiter-testimonial.webp" alt="Roland Berry" loading="lazy" />
              <div>
                <strong>Roland Berry</strong>
                <span>Providencia, RM</span>
              </div>
            </div>
          </article>

          <article class="client-card">
            <div class="client-quote">”</div>
            <p class="client-text">
              Excelente atención, muy puntuales y transparentes con los costos. Solucionaron la fuga en el mismo día y
              todo quedó funcionando perfecto.
            </p>
            <div class="client-person">
              <img src="/images/gasfiter-testimonial-2.webp" alt="George Caldwell" loading="lazy" />
              <div>
                <strong>George Caldwell</strong>
                <span>Las Condes, RM</span>
              </div>
            </div>
          </article>

          <article class="client-card">
            <div class="client-quote">”</div>
            <p class="client-text">
              Muy profesionales y ordenados. Nos ayudaron con una emergencia en el baño y dejaron todo limpio. Excelente
              servicio y respuesta rápida.
            </p>
            <div class="client-person">
              <img src="/images/gasfiter-testimonial-3.webp" alt="Camila Rojas" loading="lazy" />
              <div>
                <strong>Camila Rojas</strong>
                <span>Ñuñoa, RM</span>
              </div>
            </div>
          </article>
        </div>

        <div class="clients-dots" data-clients-dots aria-hidden="true">
          <span class="clients-dot active"></span>
          <span class="clients-dot"></span>
          <span class="clients-dot"></span>
        </div>

        <div class="clients-stats">
          <div class="clients-stat">
            <span class="clients-stat-number">98</span>
            <span class="clients-stat-label">Proyectos</span>
          </div>
          <div class="clients-stat">
            <span class="clients-stat-number">65</span>
            <span class="clients-stat-label">Personas</span>
          </div>
          <div class="clients-stat">
            <span class="clients-stat-number">10</span>
            <span class="clients-stat-label">Años</span>
          </div>
          <div class="clients-stat">
            <span class="clients-stat-number">15</span>
            <span class="clients-stat-label">Comunas</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section reveal" id="faq" style="background: #f7fbff">
      <div class="container">
        <h2 style="font-size: clamp(2rem, 6vw, 3.3rem); color: var(--navy); max-width: 760px; margin: 0 auto">
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
      <div class="container footer-grid">
        <div>
          <h3>Gasfiter Urgencias Santiago</h3>
          <p style="margin-top: 8px">Respuesta técnica 24/7 para fugas, destapes e instalaciones.</p>
          <p style="margin-top: 14px"><a class="phone-big" href="tel:+569XXXXXXX">+56 9 XXXX XXXX</a></p>
          <p style="margin-top: 10px">
            <a href="https://wa.me/569XXXXXXX" target="_blank" rel="noopener noreferrer">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp directo
            </a>
          </p>
        </div>
        <div>
          <h3>Cobertura</h3>
          <div class="comunas" style="margin-top: 10px">
            <span>Las Condes</span><span>Providencia</span><span>Ñuñoa</span><span>Santiago Centro</span
            ><span>La Florida</span><span>Maipú</span><span>San Miguel</span><span>Estación Central</span>
          </div>
        </div>
        <div>
          <h3>Horario</h3>
          <p style="margin-top: 10px">Atención 24/7</p>
          <p style="margin-top: 8px; font-size: 14px; color: #a9bbd8">
            Servicio sujeto a disponibilidad por comuna y emergencia.
          </p>
        </div>
      </div>
      <div class="container" style="margin-top: 18px; font-size: 12px; color: #94a3b8">
        © 2026 Gasfiter Urgencias Santiago. Todos los derechos reservados.
      </div>
      <div class="container">
        <div class="payments footer-payments" aria-label="Métodos de pago">
          <span class="pay-badge">Webpay</span>
          <span class="pay-badge">Transferencia</span>
          <span class="pay-badge">Débito / Crédito</span>
          <span class="pay-badge">Efectivo</span>
        </div>
      </div>
    </footer>

    <div class="mobile-sticky" aria-label="acciones rápidas móviles">
      <a class="mobile-call" href="tel:+569XXXXXXX">📞 Llamar</a>
      <a class="mobile-wa" href="https://wa.me/569XXXXXXX" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    </div>

`;

type Settings = {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  typography?: {
    font?: string;
    fontFamily?: string;
    baseSize?: string;
    lineHeight?: string;
  };
  content?: {
    hero?: {
      title?: string;
      subtitle?: string;
      cta?: { primary_text?: string; primary_url?: string };
    };
    services?:
      | Array<{ title?: string; description?: string }>
      | {
          title?: string;
          subtitle?: string;
          items?:
            | Array<{ title?: string; description?: string }>
            | Record<string, { title?: string; description?: string }>;
        };
    faqs?: Array<{ question?: string; answer?: string }>;
  };
};

export default function DynamicLanding() {
  useEffect(() => {
    const heroTitleEl = document.querySelector<HTMLElement>("[data-hero-title]");
    if (heroTitleEl) {
      heroTitleEl.style.visibility = "hidden";
    }

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
    let lastScrollY = window.scrollY;
    const toggleNav = () => {
      if (!nav) return;
      if (window.innerWidth >= 992) {
        nav.classList.remove("nav--visible");
        const currentY = window.scrollY;
        if (currentY <= 4) {
          nav.classList.remove("nav--desktop-hidden");
        } else if (currentY > lastScrollY) {
          nav.classList.add("nav--desktop-hidden");
        } else {
          nav.classList.remove("nav--desktop-hidden");
        }
        lastScrollY = currentY;
        return;
      }
      nav.classList.remove("nav--desktop-hidden");
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

    const toServicesArray = (services: unknown): Array<{ title?: string; description?: string }> => {
      if (Array.isArray(services)) return services;
      if (!services || typeof services !== "object") return [];
      const items = (services as { items?: unknown }).items;
      if (Array.isArray(items)) return items;
      if (items && typeof items === "object") {
        return Object.values(items as Record<string, unknown>).filter(
          (item): item is { title?: string; description?: string } =>
            !!item && typeof item === "object",
        );
      }
      return [];
    };

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

    const applySettings = (settings: Settings | null) => {
      if (!settings || typeof settings !== "object") return;
      const content = settings.content || {};

      const hero = content.hero || {};
      if (typeof hero.title === "string" && hero.title.trim()) {
        const titleEl = document.querySelector("[data-hero-title]");
        if (titleEl) {
          const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
          const lines = hero.title
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 2);
          const currentCombined = normalize(titleEl.textContent || "");
          const nextCombined = normalize(hero.title);
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
              if (span) span.textContent = hero.title.trim();
            }
          }
        }
      }

      if (typeof hero.subtitle === "string" && hero.subtitle.trim()) {
        const subtitleEl = document.querySelector("[data-hero-subtitle]");
        if (subtitleEl) subtitleEl.textContent = hero.subtitle.trim();
      }

      if (hero.cta && typeof hero.cta === "object") {
        const primaryBtn = document.querySelector("[data-hero-cta-primary]");
        if (primaryBtn && typeof hero.cta.primary_url === "string" && hero.cta.primary_url.trim()) {
          primaryBtn.setAttribute("href", hero.cta.primary_url.trim());
        }
        if (primaryBtn && typeof hero.cta.primary_text === "string" && hero.cta.primary_text.trim()) {
          const icon = primaryBtn.querySelector("i");
          primaryBtn.textContent = " " + hero.cta.primary_text.trim();
          if (icon) {
            primaryBtn.prepend(icon);
            primaryBtn.insertBefore(document.createTextNode(" "), icon.nextSibling);
          }
        }
      }

      const services = content.services;
      const servicesTitleEl = document.querySelector("[data-services-title]");
      if (
        services &&
        typeof services === "object" &&
        !Array.isArray(services) &&
        typeof services.title === "string" &&
        services.title.trim() &&
        servicesTitleEl
      ) {
        servicesTitleEl.textContent = services.title.trim();
      }

      const serviceItems = toServicesArray(services);
      const servicesSection = document.getElementById("servicios");
      if (Array.isArray(serviceItems) && serviceItems.length === 0 && servicesSection) {
        servicesSection.style.display = "none";
      }

      if (serviceItems.length) {
        const cards = Array.from(document.querySelectorAll("[data-service-card]"));
        cards.forEach((card, idx) => {
          const item = serviceItems[idx] as { title?: string; description?: string } | undefined;
          if (!item) {
            (card as HTMLElement).style.display = "none";
            return;
          }
          const titleEl = card.querySelector("[data-service-title]");
          const descEl = card.querySelector("[data-service-description]");
          if (titleEl && typeof item.title === "string" && item.title.trim()) {
            titleEl.textContent = item.title.trim();
          }
          if (descEl && typeof item.description === "string" && item.description.trim()) {
            descEl.textContent = item.description.trim();
          }
        });
      }

      const faqSection = document.getElementById("faq");
      if (Array.isArray(content.faqs) && content.faqs.length) {
        const faqList = document.querySelector("[data-faq-list]");
        if (faqList) {
          faqList.innerHTML = content.faqs
            .filter((faq) => faq && typeof faq === "object")
            .map((faq) => {
              const q = typeof faq.question === "string" ? faq.question.trim() : "";
              const a = typeof faq.answer === "string" ? faq.answer.trim() : "";
              if (!q || !a) return "";
              return `
                <article class="faq-item">
                  <button class="faq-btn" type="button">${q} <i class="fa-solid fa-chevron-down"></i></button>
                  <div class="faq-content"><p>${a}</p></div>
                </article>
              `;
            })
            .join("");
          bindFaqButtons();
        }
      } else if (faqSection) {
        faqSection.style.display = "none";
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
              root.style.setProperty("--font-hero", `"${parsedFamily}", "Barlow Condensed", sans-serif`);
            }
          } else {
            root.style.setProperty("--font-body", `${value}, Inter, sans-serif`);
            root.style.setProperty("--font-hero", `${value}, "Barlow Condensed", sans-serif`);
          }
        }
      }
    };

    const hydrateFromBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
        const siteSlug = process.env.NEXT_PUBLIC_SITE_SLUG?.trim();
        if (!backendUrl || !siteSlug) return;

        const settingsRes = await fetch(
          `${backendUrl.replace(/\/$/, "")}/api/sites/${encodeURIComponent(siteSlug)}/settings?t=${Date.now()}`,
          {
            cache: "no-store",
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
          },
        );
        if (!settingsRes.ok) return;

        const payload = await settingsRes.json();
        applySettings(payload?.settings ?? null);
      } catch {
        // Keep static content as fallback.
      }
    };

    const initDynamicContent = async () => {
      try {
        await hydrateFromBackend();
        await waitForFonts();
      } finally {
        if (heroTitleEl) {
          heroTitleEl.style.visibility = "visible";
        }
      }
    };
    void initDynamicContent();

    const projectsTrack = document.querySelector<HTMLElement>("[data-projects-track]");
    const prevBtn = document.querySelector<HTMLElement>("[data-projects-prev]");
    const nextBtn = document.querySelector<HTMLElement>("[data-projects-next]");

    if (projectsTrack) {
      const cards = Array.from(projectsTrack.querySelectorAll(".project-card"));
      const getStep = () => {
        const firstCard = cards[0] as HTMLElement | undefined;
        if (!firstCard) return Math.max(280, Math.round(projectsTrack.clientWidth * 0.35));
        const gap = 24;
        return firstCard.getBoundingClientRect().width + gap;
      };

      prevBtn?.addEventListener("click", () => {
        projectsTrack.scrollBy({ left: -getStep(), behavior: "smooth" });
      });

      nextBtn?.addEventListener("click", () => {
        projectsTrack.scrollBy({ left: getStep(), behavior: "smooth" });
      });

      let isDown = false;
      let startX = 0;
      let startScrollLeft = 0;
      let hasMoved = false;

      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        if (event.button !== 0) return;
        isDown = true;
        hasMoved = false;
        startX = event.clientX;
        startScrollLeft = projectsTrack.scrollLeft;
        projectsTrack.classList.add("is-dragging");
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!isDown) return;
        const deltaX = event.clientX - startX;
        if (Math.abs(deltaX) > 3) {
          hasMoved = true;
          event.preventDefault();
        }
        projectsTrack.scrollLeft = startScrollLeft - deltaX;
      };

      const stopDragging = () => {
        isDown = false;
        projectsTrack.classList.remove("is-dragging");
      };

      projectsTrack.addEventListener("pointerdown", onPointerDown);
      projectsTrack.addEventListener("pointermove", onPointerMove);
      projectsTrack.addEventListener("pointerup", stopDragging);
      projectsTrack.addEventListener("pointercancel", stopDragging);
      projectsTrack.addEventListener("mouseleave", stopDragging);
      projectsTrack.addEventListener("dragstart", (event) => event.preventDefault());
      projectsTrack.addEventListener("click", (event) => {
        if (hasMoved) event.preventDefault();
      });
      projectsTrack.addEventListener(
        "wheel",
        (event) => {
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          projectsTrack.scrollLeft += event.deltaY;
          event.preventDefault();
        },
        { passive: false },
      );
    }

    const clientsTrack = document.querySelector<HTMLElement>("[data-clients-track]");
    const clientsDotsWrap = document.querySelector<HTMLElement>("[data-clients-dots]");

    if (clientsTrack) {
      const clientCards = Array.from(clientsTrack.querySelectorAll(".client-card"));
      const dots = clientsDotsWrap ? Array.from(clientsDotsWrap.querySelectorAll(".clients-dot")) : [];
      let isDown = false;
      let startX = 0;
      let startScrollLeft = 0;
      let hasMoved = false;
      const canScroll = () => clientsTrack.scrollWidth > clientsTrack.clientWidth + 2;
      const getStep = () => {
        const first = clientCards[0] as HTMLElement | undefined;
        if (!first) return Math.max(280, Math.round(clientsTrack.clientWidth * 0.55));
        const styles = getComputedStyle(clientsTrack);
        const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
        return first.getBoundingClientRect().width + gap;
      };

      const updateActiveDot = () => {
        if (!dots.length) return;
        const step = Math.max(1, getStep());
        const index = Math.max(0, Math.min(dots.length - 1, Math.round(clientsTrack.scrollLeft / step)));
        dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
      };

      clientsTrack.addEventListener("scroll", updateActiveDot, { passive: true });

      clientsTrack.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse") return;
        if (event.button !== 0 || !canScroll()) return;
        event.preventDefault();
        isDown = true;
        hasMoved = false;
        startX = event.clientX;
        startScrollLeft = clientsTrack.scrollLeft;
        clientsTrack.classList.add("is-dragging");
        clientsTrack.setPointerCapture(event.pointerId);
      });

      clientsTrack.addEventListener("pointermove", (event) => {
        if (!isDown) return;
        const deltaX = event.clientX - startX;
        if (Math.abs(deltaX) > 1) {
          hasMoved = true;
          event.preventDefault();
        }
        clientsTrack.scrollLeft = startScrollLeft - deltaX * 1.15;
      });

      const stopDrag = (event?: PointerEvent) => {
        if (!isDown) return;
        if (event?.pointerId !== undefined && clientsTrack.hasPointerCapture(event.pointerId)) {
          clientsTrack.releasePointerCapture(event.pointerId);
        }
        isDown = false;
        clientsTrack.classList.remove("is-dragging");
      };

      clientsTrack.addEventListener("pointerup", stopDrag);
      clientsTrack.addEventListener("pointercancel", stopDrag);
      window.addEventListener("blur", () => {
        if (!isDown) return;
        isDown = false;
        clientsTrack.classList.remove("is-dragging");
      });
      clientsTrack.addEventListener("dragstart", (event) => event.preventDefault());
      clientsTrack.addEventListener("click", (event) => {
        if (hasMoved) event.preventDefault();
      });
      clientsTrack.addEventListener(
        "wheel",
        (event) => {
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          clientsTrack.scrollLeft += event.deltaY;
          event.preventDefault();
        },
        { passive: false },
      );

      updateActiveDot();
    }

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("scroll", toggleNav);
      window.removeEventListener("resize", toggleNav);
      io.disconnect();
    };
  }, []);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />
      <div dangerouslySetInnerHTML={{ __html: landingMarkup }} />
    </div>
  );
}
