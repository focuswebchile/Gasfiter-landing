"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "draft" | "published";
type SidebarView = "sections" | "items" | "style" | "versions" | "members";
type Role = "owner" | "admin" | "editor" | "viewer";

type Section = {
  id: string;
  enabled: boolean;
  order: number;
  data: Record<string, unknown>;
};

type SettingsPayload = {
  colors?: Record<string, string | undefined>;
  typography?: Record<string, string | undefined>;
  content?: {
    hero?: {
      title?: string;
      subtitle?: string;
      cta?: {
        primary_text?: string;
        primary_url?: string;
      };
    };
    services?: Array<Record<string, unknown>>;
    faqs?: Array<Record<string, unknown>>;
    sections?: Section[];
  };
};

type VersionItem = {
  id: string;
  version_number: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  published_at: string | null;
  notes: string | null;
};

type MembershipInfo = {
  userId: string;
  role: Role;
  permissions: {
    canSaveDraft: boolean;
    canPublish: boolean;
    canRollback: boolean;
    readOnly: boolean;
  };
};

const STORAGE_KEY = "gasfiter_panel_v2_state";

const panelStyles = String.raw`
  :root{color-scheme:light}
  .wf-shell{max-width:1320px;margin:20px auto;padding:0 20px 24px;font-family:Inter,sans-serif;color:#0f172a}
  .wf-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:14px}
  .wf-title{margin:0;font-size:26px;line-height:1.1;font-weight:800}
  .wf-sub{margin:4px 0 0;color:#64748b;font-size:14px}
  .wf-badges{display:flex;gap:8px;flex-wrap:wrap}
  .wf-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#e2e8f0;color:#1e293b}
  .wf-badge-env{background:#fef3c7;color:#92400e}
  .wf-badge-role{background:#dbeafe;color:#1e3a8a}
  .wf-layout{display:grid;gap:14px}
  @media(min-width:1080px){.wf-layout{grid-template-columns:220px 1.25fr 1fr}}
  .wf-card{border:1px solid #dbe3f0;border-radius:14px;background:#fff;padding:14px}
  .wf-sidebar{display:grid;gap:8px;align-content:start}
  .wf-nav-btn{display:flex;justify-content:space-between;align-items:center;border:1px solid #dbe3f0;background:#f8fafc;border-radius:10px;padding:10px 12px;font-weight:700;color:#334155;cursor:pointer}
  .wf-nav-btn.active{background:#e0ebff;border-color:#9db4ee;color:#1e3a8a}
  .wf-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .wf-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .wf-input,.wf-select,.wf-textarea{border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font:inherit;background:#fff}
  .wf-input,.wf-select{height:40px}
  .wf-input{min-width:200px;flex:1}
  .wf-select{min-width:150px}
  .wf-textarea{width:100%;min-height:88px;resize:vertical}
  .wf-btn{height:38px;border:0;border-radius:10px;padding:0 12px;font-weight:700;cursor:pointer}
  .wf-btn:disabled{opacity:.5;cursor:not-allowed}
  .wf-btn-primary{background:#1565c0;color:#fff}
  .wf-btn-soft{background:#eef2ff;color:#1e3a8a}
  .wf-btn-warn{background:#ffedd5;color:#9a3412}
  .wf-msg{display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700}
  .wf-ok{background:#dcfce7;color:#166534}
  .wf-err{background:#fee2e2;color:#991b1b}
  .wf-h3{margin:0 0 8px;font-size:17px}
  .wf-muted{color:#64748b;font-size:12px}
  .wf-sections,.wf-versions,.wf-items{display:grid;gap:8px}
  .wf-row-item{border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;background:#fff;display:flex;gap:8px;align-items:center;justify-content:space-between}
  .wf-drag{cursor:grab;font-size:16px;color:#64748b;user-select:none;padding:0 2px}
  .wf-row-item.dragging{opacity:.65;border-style:dashed}
  .wf-row-item.active{border-color:#9db4ee;background:#f8fbff}
  .wf-toggle{display:flex;gap:8px;align-items:center;font-size:13px}
  .wf-toggle input{width:16px;height:16px}
  .wf-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;background:#f8fafc;padding:10px;border-radius:8px;overflow:auto;max-height:280px}
  .wf-preview{display:grid;gap:12px}
  .wf-preview-box{border:1px solid #dbe3f0;border-radius:10px;background:#f8fafc;padding:12px}
  .wf-kv{display:grid;gap:6px;font-size:13px}
  .wf-steps{display:grid;gap:8px;margin-bottom:12px}
  .wf-step{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0}
  .wf-step-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:800}
  .wf-status{display:flex;gap:8px;flex-wrap:wrap}
`;

function detectEnvBadge(slug: string): "DEV" | "STAGING" | "PROD" {
  const lower = slug.toLowerCase();
  if (lower.includes("staging")) return "STAGING";
  if (lower.includes("prod")) return "PROD";
  return "DEV";
}

function sortByOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

function toSectionItems(section: Section): Array<Record<string, unknown>> {
  const raw = Array.isArray(section.data?.items) ? (section.data.items as Array<Record<string, unknown>>) : [];
  return sortByOrder(
    raw.map((item, index) => ({
      enabled: item.enabled !== false,
      order: typeof item.order === "number" ? item.order : index + 1,
      ...item,
    })),
  );
}

function normalizeSettings(settings: SettingsPayload): SettingsPayload {
  const cloned = structuredClone(settings ?? {});
  if (!cloned.content) cloned.content = {};
  if (!Array.isArray(cloned.content.sections)) cloned.content.sections = [];
  cloned.content.sections = sortByOrder(
    cloned.content.sections.map((section, index) => ({
      ...section,
      enabled: section.enabled !== false,
      order: typeof section.order === "number" ? section.order : (index + 1) * 10,
      data: section.data ?? {},
    })),
  );
  return cloned;
}

function getSection(settings: SettingsPayload, sectionId: string): Section | null {
  const sections = settings.content?.sections ?? [];
  return sections.find((section) => section.id === sectionId) ?? null;
}

function upsertSection(settings: SettingsPayload, nextSection: Section): SettingsPayload {
  const cloned = normalizeSettings(settings);
  const sections = cloned.content!.sections!;
  const index = sections.findIndex((section) => section.id === nextSection.id);
  if (index >= 0) sections[index] = nextSection;
  else sections.push(nextSection);
  cloned.content!.sections = sortByOrder(sections).map((section, i) => ({ ...section, order: (i + 1) * 10 }));
  return cloned;
}

function reorderById<T extends { id: string }>(items: T[], draggedId: string, targetId: string): T[] {
  if (draggedId === targetId) return items;
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) return items;
  const next = [...items];
  const [moved] = next.splice(draggedIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function reorderItemsInSection(settings: SettingsPayload, sectionId: string, fromOrder: number, toOrder: number): SettingsPayload {
  const section = getSection(settings, sectionId);
  if (!section) return settings;
  const items = toSectionItems(section);
  const fromIndex = items.findIndex((item) => Number(item.order) === fromOrder);
  const toIndex = items.findIndex((item) => Number(item.order) === toOrder);
  if (fromIndex < 0 || toIndex < 0) return settings;

  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, moved);
  const normalizedItems = nextItems.map((item, index) => ({ ...item, order: index + 1 }));

  return upsertSection(settings, { ...section, data: { ...section.data, items: normalizedItems } });
}

export default function StagingWorkflowPanel() {
  const defaultSlug = process.env.NEXT_PUBLIC_SITE_SLUG?.trim() || "gasfiter-staging";
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "";

  const [siteSlug, setSiteSlug] = useState(defaultSlug);
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState<Mode>("published");
  const [view, setView] = useState<SidebarView>("sections");
  const [editableSection, setEditableSection] = useState<"hero" | "services" | "faq">("hero");
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autosaveHint, setAutosaveHint] = useState("Sin cambios pendientes");
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [draggingItemOrder, setDraggingItemOrder] = useState<number | null>(null);
  const [panelReady, setPanelReady] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveInFlightRef = useRef(false);

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return configuredBaseUrl || "http://localhost:3000";
    }
    const sameOrigin = window.location.origin;
    if (!configuredBaseUrl) return sameOrigin;
    try {
      const configuredHost = new URL(configuredBaseUrl).hostname;
      const isConfiguredLocal = /^(localhost|127\.0\.0\.1)$/.test(configuredHost);
      const isCurrentLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
      if (isConfiguredLocal && !isCurrentLocal) return sameOrigin;
      return configuredBaseUrl;
    } catch {
      return sameOrigin;
    }
  }, [configuredBaseUrl]);

  const endpointBase = useMemo(
    () => `${baseUrl.replace(/\/$/, "")}/api/sites/${encodeURIComponent(siteSlug)}`,
    [baseUrl, siteSlug],
  );
  const sameOriginEndpointBase = useMemo(() => {
    if (typeof window === "undefined") return endpointBase;
    return `${window.location.origin}/api/sites/${encodeURIComponent(siteSlug)}`;
  }, [endpointBase, siteSlug]);
  const envBadge = detectEnvBadge(siteSlug);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { siteSlug?: string; userId?: string; mode?: Mode };
      if (parsed.siteSlug) setSiteSlug(parsed.siteSlug);
      if (parsed.userId) setUserId(parsed.userId);
      if (parsed.mode === "draft" || parsed.mode === "published") setMode(parsed.mode);
    } catch {
      // ignore invalid storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ siteSlug, userId, mode }));
  }, [siteSlug, userId, mode]);

  const setError = (text: string) => setMessage({ type: "err", text });
  const setOk = (text: string) => setMessage({ type: "ok", text });

  const canSaveDraft = membership?.permissions.canSaveDraft ?? false;
  const canPublish = membership?.permissions.canPublish ?? false;
  const canRollback = membership?.permissions.canRollback ?? false;
  const latestPublishedVersion = versions.find((version) => version.status === "published") ?? null;
  const latestDraftVersion = versions.find((version) => version.status === "draft") ?? null;

  const heroSection = settings ? getSection(settings, "hero") : null;
  const servicesSection = settings ? getSection(settings, "services") : null;
  const faqSection = settings ? getSection(settings, "faq") : null;

  const updateSettings = (
    updater: (prev: SettingsPayload) => SettingsPayload,
    options?: { persistNow?: boolean; note?: string },
  ) => {
    let nextSnapshot: SettingsPayload | null = null;
    setSettings((prev) => {
      if (!prev) return prev;
      const next = normalizeSettings(updater(prev));
      nextSnapshot = next;
      setDirty(true);
      return next;
    });
    if (options?.persistNow && nextSnapshot) {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      void saveDraftInternal({
        silent: true,
        notes: options.note ?? "Autosave immediate update",
        settingsOverride: nextSnapshot,
      });
    }
  };

  const parseJsonResponse = useCallback(async (response: Response) => {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Respuesta no JSON (${response.status}) desde ${response.url}`);
    }
  }, []);

  const fetchWithJsonFallback = useCallback(async (path: string) => {
    const primary = `${endpointBase}${path}`;
    const fallback = `${sameOriginEndpointBase}${path}`;
    const targets = primary === fallback ? [primary] : [primary, fallback];
    let lastError: Error | null = null;

    for (const url of targets) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        const payload = await parseJsonResponse(response);
        return { response, payload };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Request failed");
      }
    }

    throw lastError ?? new Error("No se pudo cargar respuesta JSON");
  }, [endpointBase, sameOriginEndpointBase, parseJsonResponse]);

  const fetchSettings = useCallback(async (nextMode = mode, silent = false) => {
    const { response, payload } = await fetchWithJsonFallback(`/settings?mode=${nextMode}&t=${Date.now()}`);
    if (!response.ok) throw new Error(payload?.error || "Unable to fetch settings");

    setSettings(normalizeSettings((payload?.settings ?? {}) as SettingsPayload));
    setMode(nextMode);
    setDirty(false);
    if (!silent) setOk(`Settings cargados en modo ${nextMode}`);
  }, [mode, fetchWithJsonFallback]);

  const fetchVersions = useCallback(async (silent = false) => {
    const { response, payload } = await fetchWithJsonFallback(
      `/versions?userId=${encodeURIComponent(userId.trim())}&t=${Date.now()}`,
    );
    if (!response.ok) throw new Error(payload?.error || "Unable to fetch versions");
    setVersions(Array.isArray(payload?.versions) ? payload.versions : []);
    setMembership((payload?.membership ?? null) as MembershipInfo | null);
    if (!silent) setOk("Versiones cargadas");
  }, [fetchWithJsonFallback, userId]);

  const loadPanel = useCallback(async () => {
    if (!siteSlug.trim()) return setError("Ingresa site slug");
    if (!userId.trim()) return setError("Ingresa userId para cargar panel");

    setBusy(true);
    setMessage(null);
    try {
      await Promise.all([fetchSettings(mode, true), fetchVersions(true)]);
      setPanelReady(true);
      setOk(`Panel cargado (${mode})`);
    } catch (error) {
      setPanelReady(false);
      setError(error instanceof Error ? error.message : "Error cargando panel");
    } finally {
      setBusy(false);
    }
  }, [siteSlug, userId, mode, fetchSettings, fetchVersions]);

  const saveDraftInternal = useCallback(async (options?: {
    silent?: boolean;
    notes?: string;
    settingsOverride?: SettingsPayload;
  }) => {
    if (!userId.trim()) return setError("Ingresa userId para guardar draft");
    const snapshot = options?.settingsOverride ?? settings;
    if (!snapshot) return setError("Primero usa Cargar panel");
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!canSaveDraft) return setError("Tu rol no puede guardar draft");
    if (autosaveInFlightRef.current) return;

    const silent = options?.silent === true;
    autosaveInFlightRef.current = true;
    if (silent) {
      setAutosaving(true);
      setAutosaveHint("Autosave guardando draft...");
    } else {
      setBusy(true);
      setMessage(null);
    }
    try {
      const response = await fetch(`${endpointBase}/save-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId.trim(),
        },
        body: JSON.stringify({
          userId: userId.trim(),
          notes: options?.notes ?? "Saved from v2 UX panel",
          settings: snapshot,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Save draft failed");
      setSettings(normalizeSettings((payload?.settings ?? {}) as SettingsPayload));
      setMode("draft");
      setDirty(false);
      if (silent) {
        setAutosaveHint(`Autosave OK (v${payload?.version?.number ?? "?"})`);
      } else {
        setOk(`Draft guardado (v${payload?.version?.number ?? "?"})`);
      }
      await fetchVersions(true);
    } catch (error) {
      if (silent) {
        setAutosaveHint("Autosave pausado por error");
      } else {
        setError(error instanceof Error ? error.message : "Error guardando draft");
      }
    } finally {
      autosaveInFlightRef.current = false;
      if (silent) {
        setAutosaving(false);
      } else {
        setBusy(false);
      }
    }
  }, [userId, settings, panelReady, canSaveDraft, endpointBase, fetchVersions]);

  const saveDraft = async () => {
    await saveDraftInternal({ silent: false, notes: "Saved from v2 UX panel" });
  };

  const publish = async () => {
    if (!userId.trim()) return setError("Ingresa userId para publicar");
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!canPublish) return setError("Tu rol no puede publicar");

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${endpointBase}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId.trim(),
        },
        body: JSON.stringify({ userId: userId.trim(), notes: "Published from v2 UX panel" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Publish failed");
      setSettings(normalizeSettings((payload?.settings ?? {}) as SettingsPayload));
      setMode("published");
      setDirty(false);
      setOk(`Publicado (v${payload?.version?.number ?? "?"})`);
      await fetchVersions(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error publicando");
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (versionNumber: number) => {
    if (!userId.trim()) return setError("Ingresa userId para rollback");
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!canRollback) return setError("Tu rol no puede hacer rollback");

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${endpointBase}/rollback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId.trim(),
        },
        body: JSON.stringify({
          userId: userId.trim(),
          versionNumber,
          notes: `Rollback desde panel v2 a v${versionNumber}`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Rollback failed");
      setSettings(normalizeSettings((payload?.settings ?? {}) as SettingsPayload));
      setMode("published");
      setDirty(false);
      setOk(`Rollback aplicado a v${versionNumber}`);
      await fetchVersions(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error en rollback");
    } finally {
      setBusy(false);
    }
  };

  const reorderSections = (draggedId: string, targetId: string) => {
    updateSettings((prev) => {
      const next = normalizeSettings(prev);
      const sections = next.content?.sections ?? [];
      const reordered = reorderById(sections, draggedId, targetId).map((section, index) => ({
        ...section,
        order: (index + 1) * 10,
      }));
      next.content!.sections = reordered;
      return next;
    }, { persistNow: true, note: "Autosave: section order updated" });
  };

  useEffect(() => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (!panelReady || !dirty) {
      setAutosaveHint(panelReady ? "Sin cambios pendientes" : "Panel no cargado");
      return;
    }
    if (!canSaveDraft) {
      setAutosaveHint("Sin permisos para autosave");
      return;
    }
    if (busy || autosaving) {
      setAutosaveHint("Esperando fin de operación...");
      return;
    }
    setAutosaveHint("Autosave en 1.8s...");
    autosaveTimerRef.current = window.setTimeout(() => {
      void saveDraftInternal({ silent: true, notes: "Autosave from v3 UX base" });
    }, 1800);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [panelReady, dirty, canSaveDraft, busy, autosaving, saveDraftInternal]);

  const renderSectionEditor = () => {
    if (!settings) return <p className="wf-muted">Carga panel para editar secciones.</p>;

    if (editableSection === "hero") {
      const section = heroSection ?? { id: "hero", enabled: true, order: 10, data: {} };
      return (
        <div className="wf-sections">
          <div className="wf-toggle">
            <input
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
            />
            Hero enabled
          </div>
          <input
            className="wf-input"
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Hero title"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))}
          />
          <textarea
            className="wf-textarea"
            value={typeof section.data.subtitle === "string" ? section.data.subtitle : ""}
            placeholder="Hero subtitle"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, subtitle: e.target.value } }))}
          />
          <div className="wf-grid2">
            <input
              className="wf-input"
              value={typeof (section.data.cta_primary as { text?: unknown } | undefined)?.text === "string" ? ((section.data.cta_primary as { text: string }).text ?? "") : ""}
              placeholder="CTA text"
              onChange={(e) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: {
                      ...section.data,
                      cta_primary: {
                        ...((section.data.cta_primary as Record<string, unknown>) ?? {}),
                        text: e.target.value,
                      },
                    },
                  }),
                )
              }
            />
            <input
              className="wf-input"
              value={typeof (section.data.cta_primary as { url?: unknown } | undefined)?.url === "string" ? ((section.data.cta_primary as { url: string }).url ?? "") : ""}
              placeholder="CTA url"
              onChange={(e) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: {
                      ...section.data,
                      cta_primary: {
                        ...((section.data.cta_primary as Record<string, unknown>) ?? {}),
                        url: e.target.value,
                      },
                    },
                  }),
                )
              }
            />
          </div>
        </div>
      );
    }

    const section = editableSection === "services" ? servicesSection : faqSection;
    if (!section) return <p className="wf-muted">No existe la sección seleccionada en este draft.</p>;

    const items = toSectionItems(section);
    return (
      <div className="wf-items">
        <div className="wf-toggle">
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
          />
          {section.id} enabled
        </div>
        {items.map((item) => {
          const key = Number(item.order);
          const labelA = section.id === "services" ? "title" : "question";
          const labelB = section.id === "services" ? "description" : "answer";
          return (
            <div
              key={key}
              className={`wf-row-item ${draggingItemOrder === key ? "dragging" : ""}`}
              draggable
              onDragStart={() => setDraggingItemOrder(key)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingItemOrder !== null) {
                  updateSettings(
                    (prev) => reorderItemsInSection(prev, section.id, draggingItemOrder, key),
                    { persistNow: true, note: `Autosave: item order updated (${section.id})` },
                  );
                }
                setDraggingItemOrder(null);
              }}
              onDragEnd={() => setDraggingItemOrder(null)}
            >
              <span className="wf-drag">⋮⋮</span>
              <div style={{ flex: 1, display: "grid", gap: 6 }}>
                <input
                  className="wf-input"
                  value={typeof item[labelA] === "string" ? (item[labelA] as string) : ""}
                  placeholder={labelA}
                  onChange={(e) =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextItems = toSectionItems(sec).map((nextItem) => (Number(nextItem.order) === key ? { ...nextItem, [labelA]: e.target.value } : nextItem));
                      return upsertSection(prev, { ...sec, data: { ...sec.data, items: nextItems } });
                    })
                  }
                />
                <textarea
                  className="wf-textarea"
                  value={typeof item[labelB] === "string" ? (item[labelB] as string) : ""}
                  placeholder={labelB}
                  onChange={(e) =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextItems = toSectionItems(sec).map((nextItem) => (Number(nextItem.order) === key ? { ...nextItem, [labelB]: e.target.value } : nextItem));
                      return upsertSection(prev, { ...sec, data: { ...sec.data, items: nextItems } });
                    })
                  }
                />
              </div>
              <div className="wf-toggle">
                <input
                  type="checkbox"
                  checked={item.enabled !== false}
                  onChange={(e) =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextItems = toSectionItems(sec).map((nextItem) => (Number(nextItem.order) === key ? { ...nextItem, enabled: e.target.checked } : nextItem));
                      return upsertSection(prev, { ...sec, data: { ...sec.data, items: nextItems } });
                    })
                  }
                />
                enabled
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStyleEditor = () => {
    if (!settings) return <p className="wf-muted">Carga panel para editar estilo.</p>;
    const colors = settings.colors ?? {};
    const typography = settings.typography ?? {};

    return (
      <div className="wf-sections">
        <h3 className="wf-h3">Colores</h3>
        <div className="wf-grid2">
          {(["primary", "secondary", "background", "text"] as const).map((key) => (
            <input
              key={key}
              className="wf-input"
              placeholder={key}
              value={colors[key] ?? ""}
              onChange={(e) => updateSettings((prev) => ({ ...prev, colors: { ...(prev.colors ?? {}), [key]: e.target.value } }))}
            />
          ))}
        </div>
        <h3 className="wf-h3">Tipografía</h3>
        <div className="wf-grid2">
          {(["font", "fontFamily", "baseSize", "lineHeight"] as const).map((key) => (
            <input
              key={key}
              className="wf-input"
              placeholder={key}
              value={typography[key] ?? ""}
              onChange={(e) => updateSettings((prev) => ({ ...prev, typography: { ...(prev.typography ?? {}), [key]: e.target.value } }))}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="wf-shell">
      <style dangerouslySetInnerHTML={{ __html: panelStyles }} />

      <header className="wf-head">
        <div>
          <h1 className="wf-title">Gasfiter Admin - Panel v2</h1>
          <p className="wf-sub">Flujo guiado para Draft/Published, versiones y permisos.</p>
        </div>
        <div className="wf-badges">
          <span className="wf-badge wf-badge-env">{envBadge}</span>
          <span className="wf-badge">{mode.toUpperCase()}</span>
          {membership?.role ? <span className="wf-badge wf-badge-role">ROLE: {membership.role.toUpperCase()}</span> : null}
        </div>
      </header>

      <div className="wf-layout">
        <aside className="wf-card wf-sidebar">
          {([
            ["sections", "Secciones"],
            ["items", "Items"],
            ["style", "Estilo"],
            ["versions", "Versiones"],
            ["members", "Miembros"],
          ] as Array<[SidebarView, string]>).map(([key, label]) => (
            <button key={key} className={`wf-nav-btn ${view === key ? "active" : ""}`} onClick={() => setView(key)}>
              <span>{label}</span>
              <span className="wf-muted">›</span>
            </button>
          ))}
        </aside>

        <section className="wf-card">
          <div className="wf-row" style={{ marginBottom: 10 }}>
            <input className="wf-input" value={siteSlug} onChange={(e) => setSiteSlug(e.target.value)} placeholder="site slug" />
            <input className="wf-input" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user UUID" />
          </div>

          <div className="wf-row" style={{ marginBottom: 12 }}>
            <select className="wf-select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button className="wf-btn wf-btn-soft" onClick={loadPanel} disabled={busy}>
              Cargar panel
            </button>
            <span className="wf-muted">{autosaveHint}</span>
          </div>

          <div className="wf-status" style={{ marginBottom: 12 }}>
            <span className="wf-badge">{dirty ? "DRAFT DIRTY" : "DRAFT GUARDADO"}</span>
            <span className="wf-badge">
              {latestDraftVersion ? `Draft v${latestDraftVersion.version_number}` : "Sin draft"}
            </span>
            <span className="wf-badge">
              {latestPublishedVersion ? `Published v${latestPublishedVersion.version_number}` : "Sin published"}
            </span>
            {autosaving ? <span className="wf-badge wf-badge-role">Autosaving...</span> : null}
          </div>

          <div className="wf-steps">
            <div className="wf-step"><span className="wf-step-num">1</span><div><strong>Identidad</strong><div className="wf-muted">Slug y user UUID con membership.</div></div></div>
            <div className="wf-step"><span className="wf-step-num">2</span><div><strong>Cargar panel</strong><div className="wf-muted">Trae settings + versiones + permisos.</div></div></div>
            <div className="wf-step"><span className="wf-step-num">3</span><div><strong>Editar/Publicar</strong><div className="wf-muted">Guardar draft, publicar o rollback según rol.</div></div></div>
          </div>

          <div className="wf-row" style={{ marginBottom: 12 }}>
            <button className="wf-btn wf-btn-primary" onClick={saveDraft} disabled={busy || !panelReady || !canSaveDraft}>Guardar Draft</button>
            <button className="wf-btn wf-btn-primary" onClick={publish} disabled={busy || !panelReady || !canPublish}>Publicar</button>
            {message ? <span className={`wf-msg ${message.type === "ok" ? "wf-ok" : "wf-err"}`}>{message.text}</span> : null}
          </div>

          {view === "sections" ? (
            <>
              <h2 className="wf-h3">Secciones</h2>
              <div className="wf-sections" style={{ marginBottom: 12 }}>
                {(settings?.content?.sections ?? []).map((section) => (
                  <div
                    key={section.id}
                    className={`wf-row-item ${draggingSectionId === section.id ? "dragging" : ""} ${editableSection === section.id ? "active" : ""}`}
                    draggable
                    onDragStart={() => setDraggingSectionId(section.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggingSectionId) reorderSections(draggingSectionId, section.id);
                      setDraggingSectionId(null);
                    }}
                    onDragEnd={() => setDraggingSectionId(null)}
                  >
                    <span className="wf-drag">⋮⋮</span>
                    <button className="wf-nav-btn" style={{ flex: 1, padding: "8px 10px" }} onClick={() => setEditableSection(section.id as typeof editableSection)}>
                      <span>{section.id}</span>
                      <span className="wf-muted">order {section.order}</span>
                    </button>
                    <label className="wf-toggle">
                      <input type="checkbox" checked={section.enabled} onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))} />
                      enabled
                    </label>
                  </div>
                ))}
                {!settings?.content?.sections?.length ? <p className="wf-muted">Carga panel para editar secciones.</p> : null}
              </div>
              {renderSectionEditor()}
            </>
          ) : null}

          {view === "items" ? (
            <>
              <h2 className="wf-h3">Items</h2>
              <div className="wf-row" style={{ marginBottom: 10 }}>
                <button className="wf-btn wf-btn-soft" onClick={() => setEditableSection("services")}>Servicios</button>
                <button className="wf-btn wf-btn-soft" onClick={() => setEditableSection("faq")}>FAQ</button>
              </div>
              {renderSectionEditor()}
            </>
          ) : null}

          {view === "style" ? <><h2 className="wf-h3">Estilo</h2>{renderStyleEditor()}</> : null}

          {view === "versions" ? (
            <>
              <h2 className="wf-h3">Versiones</h2>
              <div className="wf-versions">
                {versions.map((version) => (
                  <div className="wf-row-item" key={version.id}>
                    <div><strong>v{version.version_number}</strong> · {version.status}<div className="wf-muted">{version.notes ?? "Sin nota"}</div></div>
                    <button className="wf-btn wf-btn-warn" disabled={busy || !panelReady || version.status === "published" || !canRollback} onClick={() => rollback(version.version_number)}>Rollback</button>
                  </div>
                ))}
                {!versions.length ? <p className="wf-muted">No hay versiones cargadas.</p> : null}
              </div>
            </>
          ) : null}

          {view === "members" ? (
            <>
              <h2 className="wf-h3">Miembros</h2>
              <p className="wf-muted">Rol actual cargado desde site_memberships.</p>
              <div className="wf-preview-box">
                {membership ? (
                  <div className="wf-kv">
                    <div><strong>User:</strong> {membership.userId}</div>
                    <div><strong>Role:</strong> {membership.role}</div>
                    <div><strong>Permisos:</strong> saveDraft={String(membership.permissions.canSaveDraft)} publish={String(membership.permissions.canPublish)} rollback={String(membership.permissions.canRollback)}</div>
                  </div>
                ) : (
                  <p className="wf-muted">Carga panel para ver permisos.</p>
                )}
              </div>
            </>
          ) : null}
        </section>

        <section className="wf-card wf-preview">
          <h2 className="wf-h3">Preview</h2>
          <div className="wf-preview-box">
            <div className="wf-kv">
              <div><strong>Hero title:</strong> {typeof heroSection?.data?.title === "string" ? heroSection.data.title : "-"}</div>
              <div><strong>Hero subtitle:</strong> {typeof heroSection?.data?.subtitle === "string" ? heroSection.data.subtitle : "-"}</div>
              <div><strong>Sections:</strong> {settings?.content?.sections?.length ?? 0}</div>
            </div>
          </div>

          <div className="wf-preview-box">
            <strong>Snapshot actual (resumen)</strong>
            <pre className="wf-code">
              {JSON.stringify(
                {
                  mode,
                  role: membership?.role ?? null,
                  panelReady,
                  heroTitle: typeof heroSection?.data?.title === "string" ? heroSection.data.title : "",
                  sections: settings?.content?.sections?.length ?? 0,
                  colors: settings?.colors ?? {},
                },
                null,
                2,
              )}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
