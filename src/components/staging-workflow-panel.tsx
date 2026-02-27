"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "draft" | "published";
type SidebarView = "sections" | "items" | "style" | "versions" | "members";
type Role = "owner" | "admin" | "editor" | "viewer";
type EditableSectionId =
  | "hero"
  | "audience"
  | "services"
  | "projects"
  | "faq"
  | "urgency_banner"
  | "contact_banner"
  | "testimonials";

type Section = {
  id: string;
  enabled: boolean;
  order: number;
  data: Record<string, unknown>;
};

type SettingsPayload = {
  colors?: Record<string, string | undefined>;
  typography?: Record<string, string | undefined>;
  branding?: {
    logoUrl?: string;
    faviconUrl?: string;
    contact?: {
      whatsapp?: string;
      email?: string;
      address?: string;
    };
  };
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
type DraftConflictPayload = {
  error?: string;
  message?: string;
  serverUpdatedAt?: string | null;
};
type ToastState = {
  type: "success" | "error" | "info";
  text: string;
};

type ActionLogItem = {
  id: string;
  action: "save" | "publish" | "rollback" | "diff";
  at: string;
  version: number | null;
  note: string;
};

type HeroDiffField = {
  path: string;
  label: string;
  from: string;
  to: string;
  changed: boolean;
};

type HeroDiffResult = {
  from: {
    mode: "draft" | "published";
    versionNumber: number;
    createdAt: string;
  };
  to: {
    mode: "draft" | "published";
    versionNumber: number;
    createdAt: string;
  };
  summary: {
    changedFields: number;
    totalFields: number;
    hasChanges: boolean;
  };
  sections: {
    hero: {
      fields: HeroDiffField[];
    };
    services: {
      fields: HeroDiffField[];
    };
    faq: {
      fields: HeroDiffField[];
    };
    projects?: {
      fields: HeroDiffField[];
    };
    testimonials?: {
      fields: HeroDiffField[];
    };
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
  .wf-sticky{position:sticky;top:10px;z-index:30;border:1px solid #dbe3f0;background:#f8fafc;padding:10px 12px;border-radius:12px;margin-bottom:12px;display:flex;gap:8px;align-items:center;justify-content:space-between}
  .wf-sticky strong{font-size:13px}
  .wf-sticky small{color:#64748b}
  .wf-sticky-ok{border-color:#bbf7d0;background:#f0fdf4}
  .wf-sticky-warn{border-color:#fde68a;background:#fffbeb}
  .wf-sticky-err{border-color:#fecaca;background:#fef2f2}
  .wf-toast-stack{position:fixed;right:16px;bottom:16px;z-index:60;display:grid;gap:8px;max-width:min(420px,calc(100vw - 32px))}
  .wf-toast{border-radius:10px;padding:10px 12px;font-size:13px;font-weight:700;border:1px solid}
  .wf-toast-success{background:#dcfce7;border-color:#86efac;color:#166534}
  .wf-toast-error{background:#fee2e2;border-color:#fecaca;color:#991b1b}
  .wf-toast-info{background:#e0ebff;border-color:#bfd1f4;color:#1e3a8a}
  .wf-log{display:grid;gap:8px}
  .wf-log-item{display:flex;justify-content:space-between;gap:8px;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;background:#fff}
  .wf-diff{display:grid;gap:8px}
  .wf-diff-row{display:grid;gap:8px;border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#fff}
  .wf-diff-row.changed{border-color:#fde68a;background:#fffbeb}
  .wf-diff-row.same{border-color:#bbf7d0;background:#f0fdf4}
  .wf-diff-values{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .wf-diff-cell{border:1px solid #e2e8f0;border-radius:8px;padding:8px;background:#f8fafc;font-size:12px}
`;

function detectEnvBadge(slug: string): "DEV" | "STAGING" | "PROD" {
  const lower = slug.toLowerCase();
  if (lower.includes("staging")) return "STAGING";
  if (lower.includes("prod")) return "PROD";
  return "DEV";
}

function isHexColor(value: string) {
  return /^#([a-f0-9]{3}|[a-f0-9]{6})$/i.test(value.trim());
}

function normalizeColorValue(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function sortByOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

function createPanelItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toSectionItems(section: Section): Array<Record<string, unknown>> {
  const raw = Array.isArray(section.data?.items) ? (section.data.items as Array<Record<string, unknown>>) : [];
  return sortByOrder(
    raw.map((item, index) => ({
      id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : createPanelItemId(),
      enabled: item.enabled !== false,
      order: typeof item.order === "number" ? item.order : index + 1,
      ...(item.cta && typeof item.cta === "object"
        ? {
            cta: {
              text:
                typeof (item.cta as { text?: unknown }).text === "string"
                  ? (item.cta as { text: string }).text
                  : "",
              url:
                typeof (item.cta as { url?: unknown }).url === "string"
                  ? (item.cta as { url: string }).url
                  : "",
              kind:
                typeof (item.cta as { kind?: unknown }).kind === "string"
                  ? (item.cta as { kind: string }).kind
                  : "primary",
              enabled: (item.cta as { enabled?: unknown }).enabled !== false,
            },
          }
        : {}),
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

function reorderItemsInSection(settings: SettingsPayload, sectionId: string, fromItemId: string, toItemId: string): SettingsPayload {
  const section = getSection(settings, sectionId);
  if (!section) return settings;
  const items = toSectionItems(section);
  const fromIndex = items.findIndex((item) => String(item.id) === fromItemId);
  const toIndex = items.findIndex((item) => String(item.id) === toItemId);
  if (fromIndex < 0 || toIndex < 0) return settings;

  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, moved);
  const normalizedItems = nextItems.map((item, index) => ({ ...item, order: index + 1 }));

  return upsertSection(settings, { ...section, data: { ...section.data, items: normalizedItems } });
}

function setSectionItems(settings: SettingsPayload, sectionId: string, nextItems: Array<Record<string, unknown>>) {
  const section = getSection(settings, sectionId);
  if (!section) return settings;
  const normalized = nextItems.map((item, index) => ({
    ...item,
    id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : createPanelItemId(),
    order: index + 1,
    enabled: item.enabled !== false,
  }));
  return upsertSection(settings, { ...section, data: { ...section.data, items: normalized } });
}

function pickTimestamp(value: unknown, fallback: string | null = null): string | null {
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

export default function StagingWorkflowPanel() {
  const defaultSlug = process.env.NEXT_PUBLIC_SITE_SLUG?.trim() || "gasfiter-staging";
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "";

  const [siteSlug, setSiteSlug] = useState(defaultSlug);
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState<Mode>("published");
  const [view, setView] = useState<SidebarView>("sections");
  const [editableSection, setEditableSection] = useState<EditableSectionId>("hero");
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autosaveHint, setAutosaveHint] = useState("Sin cambios pendientes");
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [panelReady, setPanelReady] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [flushingPublish, setFlushingPublish] = useState(false);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [draftConflict, setDraftConflict] = useState<{
    active: boolean;
    message: string;
    serverUpdatedAt: string | null;
  }>({
    active: false,
    message: "",
    serverUpdatedAt: null,
  });
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveInFlightRef = useRef(false);
  const autosavePromiseRef = useRef<Promise<void> | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogItem[]>([]);
  const [heroDiff, setHeroDiff] = useState<HeroDiffResult | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<"logo" | "favicon" | null>(null);

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

  const showToast = useCallback((nextToast: ToastState | null) => {
    setToast(nextToast);
  }, []);
  const setError = useCallback((text: string) => showToast({ type: "error", text }), [showToast]);
  const setOk = useCallback((text: string) => showToast({ type: "success", text }), [showToast]);

  const canSaveDraft = membership?.permissions.canSaveDraft ?? false;
  const canPublish = membership?.permissions.canPublish ?? false;
  const canRollback = membership?.permissions.canRollback ?? false;
  const publishedReadOnly = mode === "published";
  const editingLocked = !panelReady || publishedReadOnly || busy || autosaving || flushingPublish || draftConflict.active;
  const latestPublishedVersion = versions.find((version) => version.status === "published") ?? null;
  const latestDraftVersion = versions.find((version) => version.status === "draft") ?? null;
  const latestDraftVersionToken = latestDraftVersion?.created_at ?? null;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const heroSection = settings ? getSection(settings, "hero") : null;
  const audienceSection = settings ? getSection(settings, "audience") : null;
  const servicesSection = settings ? getSection(settings, "services") : null;
  const projectsSection = settings ? getSection(settings, "projects") : null;
  const faqSection = settings ? getSection(settings, "faq") : null;
  const urgencyBannerSection = settings ? getSection(settings, "urgency_banner") : null;
  const contactBannerSection = settings ? getSection(settings, "contact_banner") : null;
  const testimonialsSection = settings ? getSection(settings, "testimonials") : null;

  const toEditableSection = (sectionId: string): EditableSectionId => {
    const supported: EditableSectionId[] = [
      "hero",
      "audience",
      "services",
      "projects",
      "faq",
      "urgency_banner",
      "contact_banner",
      "testimonials",
    ];
    return supported.includes(sectionId as EditableSectionId) ? (sectionId as EditableSectionId) : "hero";
  };

  const handleModeChange = (nextMode: Mode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setPanelReady(false);
    setDirty(false);
    setDraftUpdatedAt(null);
    setDraftConflict({ active: false, message: "", serverUpdatedAt: null });
    setAutosaveHint(`Modo ${nextMode} seleccionado. Presiona Cargar panel.`);
    setOk(`Modo ${nextMode} seleccionado. Recarga panel para sincronizar.`);
  };

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
      if (draftConflict.active) {
        setDraftConflict({ active: false, message: "", serverUpdatedAt: null });
      }
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

  const appendActionLog = useCallback(
    (action: ActionLogItem["action"], version: number | null, note: string) => {
      const row: ActionLogItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action,
        at: new Date().toISOString(),
        version,
        note,
      };
      setActionLog((prev) => [row, ...prev].slice(0, 12));
    },
    [],
  );

  const fetchSettings = useCallback(async (nextMode = mode, silent = false) => {
    const { response, payload } = await fetchWithJsonFallback(`/settings?mode=${nextMode}&t=${Date.now()}`);
    if (!response.ok) throw new Error(payload?.error || "Unable to fetch settings");

    const normalized = normalizeSettings((payload?.settings ?? {}) as SettingsPayload);
    setSettings(normalized);
    setMode(nextMode);
    setDraftUpdatedAt(pickTimestamp(payload?.draftUpdatedAt, nextMode === "draft" ? latestDraftVersionToken : null));
    setDraftConflict({ active: false, message: "", serverUpdatedAt: null });
    setDirty(false);
    if (!silent) setOk(`Settings cargados en modo ${nextMode}`);
    return {
      settings: normalized,
      draftUpdatedAt: typeof payload?.draftUpdatedAt === "string" ? payload.draftUpdatedAt : null,
    };
  }, [mode, fetchWithJsonFallback, setOk, latestDraftVersionToken]);

  const fetchVersions = useCallback(async (silent = false) => {
    const { response, payload } = await fetchWithJsonFallback(
      `/versions?userId=${encodeURIComponent(userId.trim())}&t=${Date.now()}`,
    );
    if (!response.ok) throw new Error(payload?.error || "Unable to fetch versions");
    const nextVersions = Array.isArray(payload?.versions) ? (payload.versions as VersionItem[]) : [];
    setVersions(nextVersions);
    setMembership((payload?.membership ?? null) as MembershipInfo | null);
    if (mode === "draft") {
      const latestDraft = nextVersions.find((version) => version.status === "draft") ?? null;
      if (latestDraft?.created_at) {
        setDraftUpdatedAt((prev) => pickTimestamp(prev, latestDraft.created_at));
      }
    }
    if (!silent) setOk("Versiones cargadas");
  }, [fetchWithJsonFallback, userId, setOk, mode]);

  const loadPanel = useCallback(async () => {
    if (!siteSlug.trim()) return setError("Ingresa site slug");
    if (!userId.trim()) return setError("Ingresa userId para cargar panel");

    setBusy(true);
    setToast(null);
    try {
      await Promise.all([fetchSettings(mode, true), fetchVersions(true)]);
      setPanelReady(true);
      setHeroDiff(null);
      setOk(`Panel cargado (${mode})`);
    } catch (error) {
      setPanelReady(false);
      setError(error instanceof Error ? error.message : "Error cargando panel");
    } finally {
      setBusy(false);
    }
  }, [siteSlug, userId, mode, fetchSettings, fetchVersions, setError, setOk]);

  const fetchHeroDiff = useCallback(async () => {
    if (!siteSlug.trim()) return setError("Ingresa site slug");
    if (!userId.trim()) return setError("Ingresa userId para ver cambios");
    if (!panelReady) return setError("Primero usa Cargar panel");

    setLoadingDiff(true);
    try {
      const { response, payload } = await fetchWithJsonFallback(
        `/diff?userId=${encodeURIComponent(userId.trim())}&from=draft&to=published&t=${Date.now()}`,
      );
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo calcular diff");
      }
      const result = payload as HeroDiffResult;
      setHeroDiff(result);
      const changed = result?.summary?.changedFields ?? 0;
      const msg = changed > 0 ? `Diff listo: ${changed} cambio(s)` : "Diff listo: sin cambios";
      setOk(msg);
      appendActionLog("diff", null, `Ver cambios draft vs published (${changed})`);
    } catch (error) {
      setHeroDiff(null);
      setError(error instanceof Error ? error.message : "Error generando diff");
    } finally {
      setLoadingDiff(false);
    }
  }, [siteSlug, userId, panelReady, fetchWithJsonFallback, setError, setOk, appendActionLog]);

  const renderDiffSection = (title: string, fields: HeroDiffField[]) => (
    <div className="wf-diff" style={{ marginTop: 8 }}>
      <strong>{title}</strong>
      {fields.length ? (
        fields.map((field) => (
          <div key={field.path} className={`wf-diff-row ${field.changed ? "changed" : "same"}`}>
            <strong>{field.label}</strong>
            <div className="wf-diff-values">
              <div className="wf-diff-cell">
                <div className="wf-muted">Draft</div>
                <div>{field.from || "—"}</div>
              </div>
              <div className="wf-diff-cell">
                <div className="wf-muted">Published</div>
                <div>{field.to || "—"}</div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="wf-muted">Sin items para comparar.</p>
      )}
    </div>
  );

  const activateDraftConflict = useCallback((payload?: DraftConflictPayload) => {
    setDraftConflict({
      active: true,
      message: payload?.message || "El draft fue modificado por otro usuario.",
      serverUpdatedAt: payload?.serverUpdatedAt ?? null,
    });
    setAutosaveHint("Conflicto detectado. Recarga borrador.");
  }, []);

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
    if (draftConflict.active) {
      if (!options?.silent) setError("Conflicto de draft: recarga borrador antes de guardar.");
      return;
    }
    if (autosaveInFlightRef.current) {
      if (autosavePromiseRef.current) await autosavePromiseRef.current;
      return;
    }

    const silent = options?.silent === true;
    const expectedUpdatedAt = pickTimestamp(
      draftUpdatedAt,
      mode === "draft" ? latestDraftVersionToken : null,
    );
    autosaveInFlightRef.current = true;
    const run = (async () => {
      if (silent) {
        setAutosaving(true);
        setAutosaveHint("Autosave guardando draft...");
      } else {
        setBusy(true);
        setToast(null);
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
            expectedUpdatedAt,
          }),
        });
        const payloadUnknown = (await response.json().catch(() => ({}))) as
          | {
              error?: string;
              message?: string;
              draftUpdatedAt?: string | null;
              settings?: SettingsPayload;
              version?: { number?: number };
              serverUpdatedAt?: string | null;
            }
          | DraftConflictPayload;
        if (response.status === 409 && (payloadUnknown as DraftConflictPayload)?.error === "DRAFT_OUTDATED") {
          activateDraftConflict(payloadUnknown as DraftConflictPayload);
          if (!silent) setError((payloadUnknown as DraftConflictPayload).message || "Conflicto de draft.");
          return;
        }
        if (!response.ok) throw new Error((payloadUnknown as { error?: string })?.error || "Save draft failed");
        const payload = payloadUnknown as {
          settings?: SettingsPayload;
          version?: { number?: number };
          draftUpdatedAt?: string | null;
        };
        setSettings(normalizeSettings((payload.settings ?? {}) as SettingsPayload));
        setDraftUpdatedAt(pickTimestamp((payload as { draftUpdatedAt?: unknown }).draftUpdatedAt, expectedUpdatedAt));
        setMode("draft");
        setDraftConflict({ active: false, message: "", serverUpdatedAt: null });
        setDirty(false);
        if (silent) {
          setAutosaveHint(`Autosave OK (v${payload.version?.number ?? "?"})`);
        } else {
          setOk(`Draft guardado (v${payload.version?.number ?? "?"})`);
          appendActionLog("save", payload.version?.number ?? null, "Guardar draft manual");
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
    })();
    autosavePromiseRef.current = run;
    await run;
    autosavePromiseRef.current = null;
  }, [userId, settings, panelReady, canSaveDraft, draftConflict.active, endpointBase, fetchVersions, draftUpdatedAt, activateDraftConflict, setError, setOk, mode, latestDraftVersionToken, appendActionLog]);

  const saveDraft = async () => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    await saveDraftInternal({ silent: false, notes: "Saved from v2 UX panel" });
  };

  const startDraftEditing = useCallback(async () => {
    if (!userId.trim()) return setError("Ingresa userId para editar borrador");
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!canSaveDraft) return setError("Tu rol no puede editar borrador");

    setBusy(true);
    setToast(null);
    try {
      const draftLoaded = await fetchSettings("draft", true);
      const hasDraft = typeof draftLoaded?.draftUpdatedAt === "string" && !!draftLoaded.draftUpdatedAt;
      if (!hasDraft) {
        const response = await fetch(`${endpointBase}/save-draft`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId.trim(),
          },
          body: JSON.stringify({
            userId: userId.trim(),
            notes: "Draft created from published view",
            settings: draftLoaded?.settings ?? settings ?? {},
            expectedUpdatedAt: null,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as
          | {
              error?: string;
              message?: string;
              draftUpdatedAt?: string | null;
              settings?: SettingsPayload;
              serverUpdatedAt?: string | null;
            }
          | DraftConflictPayload;
        if (response.status === 409 && (payload as DraftConflictPayload)?.error === "DRAFT_OUTDATED") {
          activateDraftConflict(payload as DraftConflictPayload);
          setError((payload as DraftConflictPayload).message || "Conflicto de draft.");
          return;
        }
        if (!response.ok) throw new Error((payload as { error?: string })?.error || "No se pudo crear draft");
        setSettings(normalizeSettings(((payload as { settings?: SettingsPayload }).settings ?? {}) as SettingsPayload));
        setDraftUpdatedAt(
          pickTimestamp((payload as { draftUpdatedAt?: unknown }).draftUpdatedAt, latestDraftVersionToken),
        );
      }
      setMode("draft");
      setDraftConflict({ active: false, message: "", serverUpdatedAt: null });
      setDirty(false);
      setOk("Modo borrador activado");
      await fetchVersions(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo activar modo borrador");
    } finally {
      setBusy(false);
    }
  }, [userId, panelReady, canSaveDraft, fetchSettings, endpointBase, settings, activateDraftConflict, fetchVersions, setError, setOk, latestDraftVersionToken]);

  const flushPendingAutosave = useCallback(async () => {
    if (!panelReady || !canSaveDraft) return;
    if (draftConflict.active) return;
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
      await saveDraftInternal({ silent: true, notes: "Autosave flush before publish" });
      return;
    }
    if (autosaveInFlightRef.current && autosavePromiseRef.current) {
      setAutosaveHint("Esperando autosave en curso...");
      await autosavePromiseRef.current;
    }
  }, [panelReady, canSaveDraft, draftConflict.active, saveDraftInternal]);

  const publish = async () => {
    if (!userId.trim()) return setError("Ingresa userId para publicar");
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!canPublish) return setError("Tu rol no puede publicar");
    if (draftConflict.active) return setError("Conflicto de draft: recarga borrador antes de publicar.");

    const expectedUpdatedAt = pickTimestamp(
      draftUpdatedAt,
      mode === "draft" ? latestDraftVersionToken : null,
    );

    try {
      setFlushingPublish(true);
      setAutosaveHint("Esperando guardado...");
      await flushPendingAutosave();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo completar autosave antes de publicar");
      setFlushingPublish(false);
      return;
    }
    setFlushingPublish(false);

    setBusy(true);
    setToast(null);
    try {
      const response = await fetch(`${endpointBase}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId.trim(),
        },
        body: JSON.stringify({
          userId: userId.trim(),
          notes: "Published from v2 UX panel",
          expectedUpdatedAt,
        }),
      });
      const payloadUnknown = (await response.json().catch(() => ({}))) as
        | {
            error?: string;
            message?: string;
            settings?: SettingsPayload;
            version?: { number?: number };
            draftUpdatedAt?: string | null;
            serverUpdatedAt?: string | null;
          }
        | DraftConflictPayload;
      if (response.status === 409 && (payloadUnknown as DraftConflictPayload)?.error === "DRAFT_OUTDATED") {
        activateDraftConflict(payloadUnknown as DraftConflictPayload);
        setError((payloadUnknown as DraftConflictPayload).message || "Conflicto de draft.");
        return;
      }
      if (!response.ok) throw new Error((payloadUnknown as { error?: string })?.error || "Publish failed");
      const payload = payloadUnknown as {
        settings?: SettingsPayload;
        version?: { number?: number };
        draftUpdatedAt?: string | null;
      };
      setSettings(normalizeSettings((payload.settings ?? {}) as SettingsPayload));
      setDraftUpdatedAt(
        pickTimestamp((payload as { draftUpdatedAt?: unknown }).draftUpdatedAt, expectedUpdatedAt),
      );
      setMode("published");
      setDraftConflict({ active: false, message: "", serverUpdatedAt: null });
      setDirty(false);
      const publishedVersion = payload.version?.number ?? null;
      const sourceDraftNumber =
        typeof (payload.version as { sourceDraftNumber?: unknown } | undefined)?.sourceDraftNumber === "number"
          ? ((payload.version as { sourceDraftNumber: number }).sourceDraftNumber as number)
          : null;
      const publishNote = sourceDraftNumber
        ? `Publicado (v${publishedVersion ?? "?"}) desde draft v${sourceDraftNumber}`
        : `Publicado (v${publishedVersion ?? "?"})`;
      setOk(publishNote);
      appendActionLog("publish", publishedVersion, publishNote);
      await fetchVersions(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error publicando");
    } finally {
      setBusy(false);
    }
  };

  const reloadDraftAfterConflict = useCallback(async () => {
    if (!panelReady) return;
    setBusy(true);
    try {
      await Promise.all([fetchSettings("draft", true), fetchVersions(true)]);
      setDraftConflict({ active: false, message: "", serverUpdatedAt: null });
      setOk("Borrador recargado");
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo recargar borrador");
    } finally {
      setBusy(false);
    }
  }, [panelReady, fetchSettings, fetchVersions, setError, setOk]);

  const rollback = async (versionNumber: number) => {
    if (!userId.trim()) return setError("Ingresa userId para rollback");
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!canRollback) return setError("Tu rol no puede hacer rollback");

    setBusy(true);
    setToast(null);
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
      appendActionLog("rollback", versionNumber, `Rollback a v${versionNumber}`);
      await fetchVersions(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error en rollback");
    } finally {
      setBusy(false);
    }
  };

  const openPublishedJson = () => {
    const url = `${endpointBase}/settings?mode=published&t=${Date.now()}`;
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
  };

  const uploadBrandingAsset = async (assetType: "logo" | "favicon", file: File | null) => {
      if (!file) return;
      if (!panelReady) return setError("Primero usa Cargar panel");
      if (!userId.trim()) return setError("Ingresa userId para subir archivos");
      if (!canSaveDraft) return setError("Tu rol no puede editar estilo");
      if (publishedReadOnly) return setError("Activa modo draft para editar estilo");

      setUploadingAsset(assetType);
      try {
        const form = new FormData();
        form.append("userId", userId.trim());
        form.append("assetType", assetType);
        form.append("file", file);

        const response = await fetch(`${endpointBase}/branding-upload`, {
          method: "POST",
          body: form,
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          details?: string;
          url?: string;
        };
        if (!response.ok || !payload.url) {
          throw new Error(payload.error || payload.details || "No se pudo subir archivo");
        }

        updateSettings(
          (prev) => ({
            ...prev,
            branding: {
              ...(prev.branding ?? {}),
              [assetType === "logo" ? "logoUrl" : "faviconUrl"]: payload.url,
            },
          }),
          {
            persistNow: true,
            note: `Autosave: ${assetType} updated`,
          },
        );
        setOk(`${assetType === "logo" ? "Logo" : "Favicon"} subido`);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploadingAsset(null);
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
    if (draftConflict.active) {
      setAutosaveHint("Autosave pausado por conflicto");
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
  }, [panelReady, dirty, canSaveDraft, busy, autosaving, draftConflict.active, saveDraftInternal]);

  const renderSectionEditor = () => {
    if (!settings) return <p className="wf-muted">Carga panel para editar secciones.</p>;

    if (editableSection === "hero") {
      const section = heroSection ?? { id: "hero", enabled: true, order: 10, data: {} };
      return (
        <div className="wf-sections">
          <div className="wf-toggle">
            <input
              disabled={editingLocked}
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
            />
            Hero enabled
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Hero title"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))}
          />
          <textarea
            className="wf-textarea"
            disabled={editingLocked}
            value={typeof section.data.subtitle === "string" ? section.data.subtitle : ""}
            placeholder="Hero subtitle"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, subtitle: e.target.value } }))}
          />
          <div className="wf-grid2">
            <input
              className="wf-input"
              disabled={editingLocked}
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
              disabled={editingLocked}
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

    if (editableSection === "audience") {
      const section = audienceSection ?? { id: "audience", enabled: true, order: 20, data: {} };
      const bullets = Array.isArray(section.data.bullets)
        ? (section.data.bullets as Array<Record<string, unknown>>)
        : [];
      return (
        <div className="wf-sections">
          <div className="wf-toggle">
            <input
              disabled={editingLocked}
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
            />
            audience enabled
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.kicker === "string" ? section.data.kicker : ""}
            placeholder="Audience kicker"
            onChange={(e) =>
              updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, kicker: e.target.value } }))
            }
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Audience title"
            onChange={(e) =>
              updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))
            }
          />
          <textarea
            className="wf-textarea"
            disabled={editingLocked}
            value={typeof section.data.description === "string" ? section.data.description : ""}
            placeholder="Audience description"
            onChange={(e) =>
              updateSettings((prev) =>
                upsertSection(prev, { ...section, data: { ...section.data, description: e.target.value } }),
              )
            }
          />
          <div className="wf-grid2">
            <input
              className="wf-input"
              disabled={editingLocked}
              value={typeof (section.data.images as { back?: unknown } | undefined)?.back === "string" ? ((section.data.images as { back?: string }).back ?? "") : ""}
              placeholder="Image back"
              onChange={(e) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: {
                      ...section.data,
                      images: { ...((section.data.images as Record<string, unknown>) ?? {}), back: e.target.value },
                    },
                  }),
                )
              }
            />
            <input
              className="wf-input"
              disabled={editingLocked}
              value={typeof (section.data.images as { front?: unknown } | undefined)?.front === "string" ? ((section.data.images as { front?: string }).front ?? "") : ""}
              placeholder="Image front"
              onChange={(e) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: {
                      ...section.data,
                      images: { ...((section.data.images as Record<string, unknown>) ?? {}), front: e.target.value },
                    },
                  }),
                )
              }
            />
          </div>
          <div className="wf-grid2">
            <input
              className="wf-input"
              disabled={editingLocked}
              value={typeof (section.data.cta_primary as { text?: unknown } | undefined)?.text === "string" ? ((section.data.cta_primary as { text?: string }).text ?? "") : ""}
              placeholder="Primary CTA text"
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
              disabled={editingLocked}
              value={typeof (section.data.cta_primary as { url?: unknown } | undefined)?.url === "string" ? ((section.data.cta_primary as { url?: string }).url ?? "") : ""}
              placeholder="Primary CTA url"
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
          <div className="wf-grid2">
            <input
              className="wf-input"
              disabled={editingLocked}
              value={typeof (section.data.cta_secondary as { text?: unknown } | undefined)?.text === "string" ? ((section.data.cta_secondary as { text?: string }).text ?? "") : ""}
              placeholder="Secondary CTA text"
              onChange={(e) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: {
                      ...section.data,
                      cta_secondary: {
                        ...((section.data.cta_secondary as Record<string, unknown>) ?? {}),
                        text: e.target.value,
                      },
                    },
                  }),
                )
              }
            />
            <input
              className="wf-input"
              disabled={editingLocked}
              value={typeof (section.data.cta_secondary as { url?: unknown } | undefined)?.url === "string" ? ((section.data.cta_secondary as { url?: string }).url ?? "") : ""}
              placeholder="Secondary CTA url"
              onChange={(e) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: {
                      ...section.data,
                      cta_secondary: {
                        ...((section.data.cta_secondary as Record<string, unknown>) ?? {}),
                        url: e.target.value,
                      },
                    },
                  }),
                )
              }
            />
          </div>
          {bullets.map((bullet, index) => (
            <div key={index} className="wf-row-item">
              <div style={{ flex: 1, display: "grid", gap: 6 }}>
                <input
                  className="wf-input"
                  disabled={editingLocked}
                  value={typeof bullet.text === "string" ? bullet.text : ""}
                  placeholder={`Bullet ${index + 1}`}
                  onChange={(e) =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextBullets = Array.isArray(sec.data.bullets)
                        ? [...(sec.data.bullets as Array<Record<string, unknown>>)]
                        : [];
                      nextBullets[index] = { ...nextBullets[index], text: e.target.value };
                      return upsertSection(prev, { ...sec, data: { ...sec.data, bullets: nextBullets } });
                    })
                  }
                />
                <input
                  className="wf-input"
                  disabled={editingLocked}
                  value={typeof bullet.icon === "string" ? bullet.icon : ""}
                  placeholder="Icon (ej: fa-circle-check)"
                  onChange={(e) =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextBullets = Array.isArray(sec.data.bullets)
                        ? [...(sec.data.bullets as Array<Record<string, unknown>>)]
                        : [];
                      nextBullets[index] = { ...nextBullets[index], icon: e.target.value };
                      return upsertSection(prev, { ...sec, data: { ...sec.data, bullets: nextBullets } });
                    })
                  }
                />
              </div>
              <label className="wf-toggle">
                <input
                  disabled={editingLocked}
                  type="checkbox"
                  checked={bullet.enabled !== false}
                  onChange={(e) =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextBullets = Array.isArray(sec.data.bullets)
                        ? [...(sec.data.bullets as Array<Record<string, unknown>>)]
                        : [];
                      nextBullets[index] = { ...nextBullets[index], enabled: e.target.checked };
                      return upsertSection(prev, { ...sec, data: { ...sec.data, bullets: nextBullets } });
                    })
                  }
                />
                enabled
              </label>
            </div>
          ))}
        </div>
      );
    }

    if (editableSection === "projects") {
      const section = projectsSection;
      if (!section) return <p className="wf-muted">No existe la sección seleccionada en este draft.</p>;
      const items = toSectionItems(section);
      return (
        <div className="wf-items">
          <div className="wf-toggle">
            <input
              disabled={editingLocked}
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
            />
            projects enabled
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="projects title"
            onChange={(e) =>
              updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))
            }
          />
          <textarea
            className="wf-textarea"
            disabled={editingLocked}
            value={typeof section.data.description === "string" ? section.data.description : ""}
            placeholder="projects description"
            onChange={(e) =>
              updateSettings((prev) =>
                upsertSection(prev, { ...section, data: { ...section.data, description: e.target.value } }),
              )
            }
          />
          <div className="wf-row">
            <button
              className="wf-btn wf-btn-soft"
              disabled={editingLocked}
              onClick={() =>
                updateSettings((prev) => {
                  const sec = getSection(prev, section.id);
                  if (!sec) return prev;
                  const nextItems = [
                    ...toSectionItems(sec),
                    {
                      id: createPanelItemId(),
                      enabled: true,
                      order: 999,
                      title: "Nuevo proyecto",
                      location: "",
                      image: "",
                      size: "square",
                    },
                  ];
                  return setSectionItems(prev, section.id, nextItems);
                })
              }
            >
              + Agregar proyecto
            </button>
          </div>
          {items.map((item) => {
            const itemId = String(item.id);
            return (
              <div
                key={itemId}
                className={`wf-row-item ${draggingItemId === itemId ? "dragging" : ""}`}
                draggable={!editingLocked}
                onDragStart={() => setDraggingItemId(itemId)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!editingLocked && draggingItemId !== null) {
                    updateSettings((prev) => reorderItemsInSection(prev, section.id, draggingItemId, itemId), {
                      persistNow: true,
                      note: "Autosave: item order updated (projects)",
                    });
                  }
                  setDraggingItemId(null);
                }}
                onDragEnd={() => setDraggingItemId(null)}
              >
                <span className="wf-drag">⋮⋮</span>
                <div style={{ flex: 1, display: "grid", gap: 6 }}>
                  <input
                    className="wf-input"
                    disabled={editingLocked}
                    value={typeof item.title === "string" ? item.title : ""}
                    placeholder="title"
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, title: e.target.value } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                  <input
                    className="wf-input"
                    disabled={editingLocked}
                    value={typeof item.location === "string" ? item.location : ""}
                    placeholder="location"
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, location: e.target.value } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                  <input
                    className="wf-input"
                    disabled={editingLocked}
                    value={typeof item.image === "string" ? item.image : ""}
                    placeholder="image URL/path"
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, image: e.target.value } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                  <select
                    className="wf-select"
                    disabled={editingLocked}
                    value={typeof item.size === "string" ? item.size : "square"}
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, size: e.target.value } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  >
                    <option value="square">square</option>
                    <option value="wide">wide</option>
                  </select>
                </div>
                <div className="wf-toggle">
                  <input
                    disabled={editingLocked}
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, enabled: e.target.checked } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                  enabled
                </div>
                <div className="wf-row">
                  <button
                    className="wf-btn wf-btn-soft"
                    disabled={editingLocked}
                    onClick={() =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const all = toSectionItems(sec);
                        const idx = all.findIndex((nextItem) => String(nextItem.id) === itemId);
                        if (idx < 0) return prev;
                        const clone = { ...all[idx], id: createPanelItemId(), order: 999 };
                        const nextItems = [...all.slice(0, idx + 1), clone, ...all.slice(idx + 1)];
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  >
                    Duplicar
                  </button>
                  <button
                    className="wf-btn wf-btn-warn"
                    disabled={editingLocked || items.length <= 1}
                    onClick={() =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).filter(
                          (nextItem) => String(nextItem.id) !== itemId,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (editableSection === "urgency_banner") {
      const section = urgencyBannerSection ?? { id: "urgency_banner", enabled: true, order: 50, data: {} };
      return (
        <div className="wf-sections">
          <div className="wf-toggle">
            <input
              disabled={editingLocked}
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
            />
            urgency_banner enabled
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Banner title"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))}
          />
          <textarea
            className="wf-textarea"
            disabled={editingLocked}
            value={typeof section.data.description === "string" ? section.data.description : ""}
            placeholder="Banner description"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, description: e.target.value } }))}
          />
          <div className="wf-grid2">
            <input
              className="wf-input"
              disabled={editingLocked}
              value={
                typeof (section.data.cta_primary as { text?: unknown } | undefined)?.text === "string"
                  ? ((section.data.cta_primary as { text: string }).text ?? "")
                  : ""
              }
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
              disabled={editingLocked}
              value={
                typeof (section.data.cta_primary as { url?: unknown } | undefined)?.url === "string"
                  ? ((section.data.cta_primary as { url: string }).url ?? "")
                  : ""
              }
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

    if (editableSection === "contact_banner") {
      const section = contactBannerSection ?? { id: "contact_banner", enabled: true, order: 60, data: {} };
      return (
        <div className="wf-sections">
          <div className="wf-toggle">
            <input
              disabled={editingLocked}
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
            />
            contact_banner enabled
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.kicker === "string" ? section.data.kicker : ""}
            placeholder="Kicker"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, kicker: e.target.value } }))}
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Title"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))}
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.background_image === "string" ? section.data.background_image : ""}
            placeholder="Background image URL/path"
            onChange={(e) =>
              updateSettings((prev) =>
                upsertSection(prev, { ...section, data: { ...section.data, background_image: e.target.value } }),
              )
            }
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.submit_text === "string" ? section.data.submit_text : ""}
            placeholder="Submit button text"
            onChange={(e) =>
              updateSettings((prev) =>
                upsertSection(prev, { ...section, data: { ...section.data, submit_text: e.target.value } }),
              )
            }
          />
        </div>
      );
    }

    if (editableSection === "testimonials") {
      const section = testimonialsSection;
      if (!section) return <p className="wf-muted">No existe la sección seleccionada en este draft.</p>;
      const items = toSectionItems(section);
      return (
        <div className="wf-items">
          <div className="wf-toggle">
            <input
              disabled={editingLocked}
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
            />
            testimonials enabled
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.kicker === "string" ? section.data.kicker : ""}
            placeholder="Section kicker"
            onChange={(e) =>
              updateSettings((prev) =>
                upsertSection(prev, { ...section, data: { ...section.data, kicker: e.target.value } }),
              )
            }
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Section title"
            onChange={(e) =>
              updateSettings((prev) =>
                upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }),
              )
            }
          />
          <div className="wf-row">
            <button
              className="wf-btn wf-btn-soft"
              disabled={editingLocked}
              onClick={() =>
                updateSettings((prev) => {
                  const sec = getSection(prev, section.id);
                  if (!sec) return prev;
                  const nextItems = [
                    ...toSectionItems(sec),
                    {
                      id: createPanelItemId(),
                      enabled: true,
                      order: 999,
                      name: "Nuevo testimonio",
                      location: "",
                      quote: "",
                      avatar: "",
                    },
                  ];
                  return setSectionItems(prev, section.id, nextItems);
                })
              }
            >
              + Agregar testimonio
            </button>
          </div>
          {items.map((item) => {
            const itemId = String(item.id);
            return (
              <div
                key={itemId}
                className={`wf-row-item ${draggingItemId === itemId ? "dragging" : ""}`}
                draggable={!editingLocked}
                onDragStart={() => setDraggingItemId(itemId)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!editingLocked && draggingItemId !== null) {
                    updateSettings(
                      (prev) => reorderItemsInSection(prev, section.id, draggingItemId, itemId),
                      { persistNow: true, note: "Autosave: item order updated (testimonials)" },
                    );
                  }
                  setDraggingItemId(null);
                }}
                onDragEnd={() => setDraggingItemId(null)}
              >
                <span className="wf-drag">⋮⋮</span>
                <div style={{ flex: 1, display: "grid", gap: 6 }}>
                  <input
                    className="wf-input"
                    disabled={editingLocked}
                    value={typeof item.name === "string" ? item.name : ""}
                    placeholder="name"
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, name: e.target.value } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                  <input
                    className="wf-input"
                    disabled={editingLocked}
                    value={typeof item.location === "string" ? item.location : ""}
                    placeholder="location"
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, location: e.target.value } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                  <textarea
                    className="wf-textarea"
                    disabled={editingLocked}
                    value={typeof item.quote === "string" ? item.quote : ""}
                    placeholder="quote"
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, quote: e.target.value } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                  <input
                    className="wf-input"
                    disabled={editingLocked}
                    value={typeof item.avatar === "string" ? item.avatar : ""}
                    placeholder="avatar URL/path"
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, avatar: e.target.value } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                </div>
                <div className="wf-toggle">
                  <input
                    disabled={editingLocked}
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, enabled: e.target.checked } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                  enabled
                </div>
                <div className="wf-row">
                  <button
                    className="wf-btn wf-btn-soft"
                    disabled={editingLocked}
                    onClick={() =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const all = toSectionItems(sec);
                        const idx = all.findIndex((nextItem) => String(nextItem.id) === itemId);
                        if (idx < 0) return prev;
                        const clone = { ...all[idx], id: createPanelItemId(), order: 999 };
                        const nextItems = [...all.slice(0, idx + 1), clone, ...all.slice(idx + 1)];
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  >
                    Duplicar
                  </button>
                  <button
                    className="wf-btn wf-btn-warn"
                    disabled={editingLocked || items.length <= 1}
                    onClick={() =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).filter(
                          (nextItem) => String(nextItem.id) !== itemId,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
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
            disabled={editingLocked}
            type="checkbox"
            checked={section.enabled}
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
          />
          {section.id} enabled
        </div>
        {section.id === "services" ? (
          <>
            <input
              className="wf-input"
              disabled={editingLocked}
              value={typeof section.data.title === "string" ? section.data.title : ""}
              placeholder="services title"
              onChange={(e) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: { ...section.data, title: e.target.value },
                  }),
                )
              }
            />
            <textarea
              className="wf-textarea"
              disabled={editingLocked}
              value={typeof section.data.subtitle === "string" ? section.data.subtitle : ""}
              placeholder="services subtitle"
              onChange={(e) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: { ...section.data, subtitle: e.target.value },
                  }),
                )
              }
            />
          </>
        ) : null}
        {section.id === "faq" ? (
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="faq title"
            onChange={(e) =>
              updateSettings((prev) =>
                upsertSection(prev, {
                  ...section,
                  data: { ...section.data, title: e.target.value },
                }),
              )
            }
          />
        ) : null}
        <div className="wf-row">
          <button
            className="wf-btn wf-btn-soft"
            disabled={editingLocked}
            onClick={() =>
              updateSettings((prev) => {
                const sec = getSection(prev, section.id);
                if (!sec) return prev;
                const nextItems = [
                  ...toSectionItems(sec),
                  section.id === "services"
                    ? {
                        id: createPanelItemId(),
                        enabled: true,
                        order: 999,
                        title: "Nuevo servicio",
                        description: "",
                        features: ["Punto clave 1", "Punto clave 2"],
                        cta: { text: "Llamar", url: "tel:+56900000000", kind: "tel", enabled: true },
                      }
                    : {
                        id: createPanelItemId(),
                        enabled: true,
                        order: 999,
                        question: "Nueva pregunta",
                        answer: "",
                      },
                ];
                return setSectionItems(prev, section.id, nextItems);
              })
            }
          >
            {section.id === "services" ? "+ Agregar servicio" : "+ Agregar FAQ"}
          </button>
        </div>
        {items.map((item) => {
          const itemId = String(item.id);
          const labelA = section.id === "services" ? "title" : "question";
          const labelB = section.id === "services" ? "description" : "answer";
          return (
            <div
              key={itemId}
              className={`wf-row-item ${draggingItemId === itemId ? "dragging" : ""}`}
              draggable={!editingLocked}
              onDragStart={() => setDraggingItemId(itemId)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!editingLocked && draggingItemId !== null) {
                  updateSettings(
                    (prev) => reorderItemsInSection(prev, section.id, draggingItemId, itemId),
                    { persistNow: true, note: `Autosave: item order updated (${section.id})` },
                  );
                }
                setDraggingItemId(null);
              }}
              onDragEnd={() => setDraggingItemId(null)}
            >
              <span className="wf-drag">⋮⋮</span>
              <div style={{ flex: 1, display: "grid", gap: 6 }}>
                <input
                  className="wf-input"
                  disabled={editingLocked}
                  value={typeof item[labelA] === "string" ? (item[labelA] as string) : ""}
                  placeholder={labelA}
                  onChange={(e) =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextItems = toSectionItems(sec).map((nextItem) =>
                        String(nextItem.id) === itemId ? { ...nextItem, [labelA]: e.target.value } : nextItem,
                      );
                      return setSectionItems(prev, section.id, nextItems);
                    })
                  }
                />
                <textarea
                  className="wf-textarea"
                  disabled={editingLocked}
                  value={typeof item[labelB] === "string" ? (item[labelB] as string) : ""}
                  placeholder={labelB}
                  onChange={(e) =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextItems = toSectionItems(sec).map((nextItem) =>
                        String(nextItem.id) === itemId ? { ...nextItem, [labelB]: e.target.value } : nextItem,
                      );
                      return setSectionItems(prev, section.id, nextItems);
                    })
                  }
                />
                {section.id === "services" ? (
                  <>
                  <textarea
                    className="wf-textarea"
                    disabled={editingLocked}
                    value={
                      Array.isArray(item.features)
                        ? item.features
                            .map((feature) => (typeof feature === "string" ? feature : ""))
                            .join("\n")
                        : ""
                    }
                    placeholder={"Features (uno por línea)"}
                    onChange={(e) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const parsedFeatures = e.target.value
                          .split("\n")
                          .map((value) => value.trim())
                          .filter(Boolean);
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, features: parsedFeatures } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                  />
                  <div className="wf-grid2">
                    <input
                      className="wf-input"
                      disabled={editingLocked}
                      value={
                        typeof (item.cta as { text?: unknown } | undefined)?.text === "string"
                          ? ((item.cta as { text?: string }).text ?? "")
                          : ""
                      }
                      placeholder="CTA text"
                      onChange={(e) =>
                        updateSettings((prev) => {
                          const sec = getSection(prev, section.id);
                          if (!sec) return prev;
                          const nextItems = toSectionItems(sec).map((nextItem) =>
                            String(nextItem.id) === itemId
                              ? {
                                  ...nextItem,
                                  cta: {
                                    ...((nextItem.cta as Record<string, unknown>) ?? {}),
                                    text: e.target.value,
                                  },
                                }
                              : nextItem,
                          );
                          return setSectionItems(prev, section.id, nextItems);
                        })
                      }
                    />
                    <input
                      className="wf-input"
                      disabled={editingLocked}
                      value={
                        typeof (item.cta as { url?: unknown } | undefined)?.url === "string"
                          ? ((item.cta as { url?: string }).url ?? "")
                          : ""
                      }
                      placeholder="CTA url"
                      onChange={(e) =>
                        updateSettings((prev) => {
                          const sec = getSection(prev, section.id);
                          if (!sec) return prev;
                          const nextItems = toSectionItems(sec).map((nextItem) =>
                            String(nextItem.id) === itemId
                              ? {
                                  ...nextItem,
                                  cta: {
                                    ...((nextItem.cta as Record<string, unknown>) ?? {}),
                                    url: e.target.value,
                                  },
                                }
                              : nextItem,
                          );
                          return setSectionItems(prev, section.id, nextItems);
                        })
                      }
                    />
                    <select
                      className="wf-select"
                      disabled={editingLocked}
                      value={
                        typeof (item.cta as { kind?: unknown } | undefined)?.kind === "string"
                          ? ((item.cta as { kind?: string }).kind ?? "primary")
                          : "primary"
                      }
                      onChange={(e) =>
                        updateSettings((prev) => {
                          const sec = getSection(prev, section.id);
                          if (!sec) return prev;
                          const nextItems = toSectionItems(sec).map((nextItem) =>
                            String(nextItem.id) === itemId
                              ? {
                                  ...nextItem,
                                  cta: {
                                    ...((nextItem.cta as Record<string, unknown>) ?? {}),
                                    kind: e.target.value,
                                  },
                                }
                              : nextItem,
                          );
                          return setSectionItems(prev, section.id, nextItems);
                        })
                      }
                    >
                      <option value="primary">primary</option>
                      <option value="tel">tel</option>
                      <option value="whatsapp">whatsapp</option>
                      <option value="anchor">anchor</option>
                      <option value="external">external</option>
                    </select>
                    <label className="wf-toggle">
                      <input
                        disabled={editingLocked}
                        type="checkbox"
                        checked={(item.cta as { enabled?: unknown } | undefined)?.enabled !== false}
                        onChange={(e) =>
                          updateSettings((prev) => {
                            const sec = getSection(prev, section.id);
                            if (!sec) return prev;
                            const nextItems = toSectionItems(sec).map((nextItem) =>
                              String(nextItem.id) === itemId
                                ? {
                                    ...nextItem,
                                    cta: {
                                      ...((nextItem.cta as Record<string, unknown>) ?? {}),
                                      enabled: e.target.checked,
                                    },
                                  }
                                : nextItem,
                            );
                            return setSectionItems(prev, section.id, nextItems);
                          })
                        }
                      />
                      CTA enabled
                    </label>
                  </div>
                  <div className="wf-row-item" style={{ marginTop: 8 }}>
                    <div style={{ flex: 1, display: "grid", gap: 6 }}>
                      <div className="wf-row" style={{ justifyContent: "space-between" }}>
                        <strong style={{ fontSize: 13 }}>Features</strong>
                        <button
                          className="wf-btn wf-btn-soft"
                          disabled={editingLocked}
                          onClick={() =>
                            updateSettings((prev) => {
                              const sec = getSection(prev, section.id);
                              if (!sec) return prev;
                              const nextItems = toSectionItems(sec).map((nextItem) => {
                                if (String(nextItem.id) !== itemId) return nextItem;
                                const current = Array.isArray(nextItem.features)
                                  ? [...nextItem.features]
                                  : [];
                                current.push("Nuevo punto");
                                return { ...nextItem, features: current };
                              });
                              return setSectionItems(prev, section.id, nextItems);
                            })
                          }
                        >
                          + Add feature
                        </button>
                      </div>
                      {(Array.isArray(item.features) ? item.features : []).map((feature, featureIdx) => (
                        <div key={`${itemId}-feature-${featureIdx}`} className="wf-row">
                          <input
                            className="wf-input"
                            disabled={editingLocked}
                            value={typeof feature === "string" ? feature : ""}
                            placeholder={`Feature ${featureIdx + 1}`}
                            onChange={(e) =>
                              updateSettings((prev) => {
                                const sec = getSection(prev, section.id);
                                if (!sec) return prev;
                                const nextItems = toSectionItems(sec).map((nextItem) => {
                                  if (String(nextItem.id) !== itemId) return nextItem;
                                  const features = Array.isArray(nextItem.features)
                                    ? [...nextItem.features]
                                    : [];
                                  features[featureIdx] = e.target.value;
                                  return { ...nextItem, features };
                                });
                                return setSectionItems(prev, section.id, nextItems);
                              })
                            }
                          />
                          <button
                            className="wf-btn wf-btn-soft"
                            disabled={editingLocked || featureIdx === 0}
                            onClick={() =>
                              updateSettings((prev) => {
                                const sec = getSection(prev, section.id);
                                if (!sec) return prev;
                                const nextItems = toSectionItems(sec).map((nextItem) => {
                                  if (String(nextItem.id) !== itemId) return nextItem;
                                  const features = Array.isArray(nextItem.features)
                                    ? [...nextItem.features]
                                    : [];
                                  const [moved] = features.splice(featureIdx, 1);
                                  features.splice(featureIdx - 1, 0, moved);
                                  return { ...nextItem, features };
                                });
                                return setSectionItems(prev, section.id, nextItems);
                              })
                            }
                          >
                            ↑
                          </button>
                          <button
                            className="wf-btn wf-btn-soft"
                            disabled={
                              editingLocked ||
                              featureIdx >= (Array.isArray(item.features) ? item.features.length - 1 : -1)
                            }
                            onClick={() =>
                              updateSettings((prev) => {
                                const sec = getSection(prev, section.id);
                                if (!sec) return prev;
                                const nextItems = toSectionItems(sec).map((nextItem) => {
                                  if (String(nextItem.id) !== itemId) return nextItem;
                                  const features = Array.isArray(nextItem.features)
                                    ? [...nextItem.features]
                                    : [];
                                  const [moved] = features.splice(featureIdx, 1);
                                  features.splice(featureIdx + 1, 0, moved);
                                  return { ...nextItem, features };
                                });
                                return setSectionItems(prev, section.id, nextItems);
                              })
                            }
                          >
                            ↓
                          </button>
                          <button
                            className="wf-btn wf-btn-warn"
                            disabled={editingLocked}
                            onClick={() =>
                              updateSettings((prev) => {
                                const sec = getSection(prev, section.id);
                                if (!sec) return prev;
                                const nextItems = toSectionItems(sec).map((nextItem) => {
                                  if (String(nextItem.id) !== itemId) return nextItem;
                                  const features = Array.isArray(nextItem.features)
                                    ? [...nextItem.features]
                                    : [];
                                  features.splice(featureIdx, 1);
                                  return { ...nextItem, features };
                                });
                                return setSectionItems(prev, section.id, nextItems);
                              })
                            }
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  </>
                ) : null}
              </div>
              <div className="wf-toggle">
                <input
                  disabled={editingLocked}
                  type="checkbox"
                  checked={item.enabled !== false}
                  onChange={(e) =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextItems = toSectionItems(sec).map((nextItem) =>
                        String(nextItem.id) === itemId ? { ...nextItem, enabled: e.target.checked } : nextItem,
                      );
                      return setSectionItems(prev, section.id, nextItems);
                    })
                  }
                />
                enabled
              </div>
              <div className="wf-row">
                <button
                  className="wf-btn wf-btn-soft"
                  disabled={editingLocked}
                  onClick={() =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const all = toSectionItems(sec);
                      const idx = all.findIndex((nextItem) => String(nextItem.id) === itemId);
                      if (idx < 0) return prev;
                      const clone = { ...all[idx], id: createPanelItemId(), order: 999 };
                      const nextItems = [...all.slice(0, idx + 1), clone, ...all.slice(idx + 1)];
                      return setSectionItems(prev, section.id, nextItems);
                    })
                  }
                >
                  Duplicar
                </button>
                <button
                  className="wf-btn wf-btn-warn"
                  disabled={editingLocked || items.length <= 1}
                  onClick={() =>
                    updateSettings((prev) => {
                      const sec = getSection(prev, section.id);
                      if (!sec) return prev;
                      const nextItems = toSectionItems(sec).filter(
                        (nextItem) => String(nextItem.id) !== itemId,
                      );
                      return setSectionItems(prev, section.id, nextItems);
                    })
                  }
                >
                  Eliminar
                </button>
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
    const branding = settings.branding ?? {};
    const contact = branding.contact ?? {};

    const updateColor = (key: "primary" | "secondary" | "background" | "text", value: string) => {
      const normalized = normalizeColorValue(value);
      if (!isHexColor(normalized)) {
        setError(`Color inválido para ${key}. Usa formato #RRGGBB`);
        return;
      }
      updateSettings((prev) => ({
        ...prev,
        colors: { ...(prev.colors ?? {}), [key]: normalized },
      }));
    };

    return (
      <div className="wf-sections">
        <h3 className="wf-h3">Colores</h3>
        <div className="wf-grid2">
          {(["primary", "secondary", "background", "text"] as const).map((key) => (
            <div key={key} className="wf-row">
              <input
                type="color"
                className="wf-input"
                disabled={editingLocked}
                value={isHexColor(colors[key] ?? "") ? (colors[key] as string) : "#000000"}
                onChange={(e) => updateColor(key, e.target.value)}
                style={{ minWidth: 60, maxWidth: 72, padding: 4 }}
              />
              <input
                className="wf-input"
                disabled={editingLocked}
                placeholder={`${key} (#RRGGBB)`}
                value={colors[key] ?? ""}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    colors: { ...(prev.colors ?? {}), [key]: e.target.value },
                  }))
                }
                onBlur={(e) => {
                  if (!e.target.value.trim()) return;
                  updateColor(key, e.target.value);
                }}
              />
            </div>
          ))}
        </div>
        <h3 className="wf-h3">Tipografía</h3>
        <div className="wf-grid2">
          <select
            className="wf-select"
            disabled={editingLocked}
            value={typography.fontFamily ?? ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                typography: {
                  ...(prev.typography ?? {}),
                  fontFamily: e.target.value,
                  font: e.target.value,
                },
              }))
            }
          >
            <option value="">Selecciona tipografía</option>
            <option value="Inter">Inter</option>
            <option value="Poppins">Poppins</option>
            <option value="Roboto">Roboto</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Barlow Condensed">Barlow Condensed</option>
          </select>
          <input
            className="wf-input"
            disabled={editingLocked}
            placeholder="font URL u override"
            value={typography.font ?? ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                typography: { ...(prev.typography ?? {}), font: e.target.value },
              }))
            }
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            placeholder="baseSize (ej: 16px)"
            value={typography.baseSize ?? ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                typography: { ...(prev.typography ?? {}), baseSize: e.target.value },
              }))
            }
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && !/^\d+(\.\d+)?px$/i.test(v)) {
                setError("baseSize debe ser en px, por ejemplo 16px");
              }
            }}
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            placeholder="lineHeight (ej: 1.5)"
            value={typography.lineHeight ?? ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                typography: { ...(prev.typography ?? {}), lineHeight: e.target.value },
              }))
            }
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (e.target.value.trim() && (!Number.isFinite(v) || v < 1 || v > 2.4)) {
                setError("lineHeight debe estar entre 1 y 2.4");
              }
            }}
          />
        </div>

        <h3 className="wf-h3">Branding</h3>
        <div className="wf-note" style={{ marginBottom: 10 }}>
          <strong>Nota:</strong> logo recomendado en PNG/WebP/SVG (máx 2MB) y favicon en PNG/ICO (máx 1MB).
          Si pegas URL manual, debe ser pública y apuntar a un archivo de imagen válido.
        </div>
        <div className="wf-grid2">
          <input
            className="wf-input"
            disabled={editingLocked}
            placeholder="Logo URL"
            value={branding.logoUrl ?? ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                branding: { ...(prev.branding ?? {}), logoUrl: e.target.value },
              }))
            }
          />
          <div className="wf-row">
            <input
              className="wf-input"
              disabled={editingLocked}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void uploadBrandingAsset("logo", file);
              }}
            />
            {uploadingAsset === "logo" ? <span className="wf-muted">Subiendo logo...</span> : null}
          </div>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="logo preview" style={{ maxHeight: 42, objectFit: "contain" }} />
          ) : (
            <span className="wf-muted">Sin logo</span>
          )}
          <span className="wf-muted">Máx 2MB (png/jpg/webp/svg)</span>

          <input
            className="wf-input"
            disabled={editingLocked}
            placeholder="Favicon URL"
            value={branding.faviconUrl ?? ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                branding: { ...(prev.branding ?? {}), faviconUrl: e.target.value },
              }))
            }
          />
          <div className="wf-row">
            <input
              className="wf-input"
              disabled={editingLocked}
              type="file"
              accept="image/png,image/x-icon,image/vnd.microsoft.icon"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void uploadBrandingAsset("favicon", file);
              }}
            />
            {uploadingAsset === "favicon" ? <span className="wf-muted">Subiendo favicon...</span> : null}
          </div>
          {branding.faviconUrl ? (
            <img src={branding.faviconUrl} alt="favicon preview" style={{ width: 24, height: 24, objectFit: "contain" }} />
          ) : (
            <span className="wf-muted">Sin favicon</span>
          )}
          <span className="wf-muted">Máx 1MB (png/ico)</span>
        </div>

        <h3 className="wf-h3">Contacto básico (opcional)</h3>
        <div className="wf-grid2">
          <input
            className="wf-input"
            disabled={editingLocked}
            placeholder="WhatsApp (https://wa.me/...)"
            value={contact.whatsapp ?? ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                branding: {
                  ...(prev.branding ?? {}),
                  contact: { ...(prev.branding?.contact ?? {}), whatsapp: e.target.value },
                },
              }))
            }
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            placeholder="Email"
            value={contact.email ?? ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                branding: {
                  ...(prev.branding ?? {}),
                  contact: { ...(prev.branding?.contact ?? {}), email: e.target.value },
                },
              }))
            }
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            placeholder="Dirección"
            value={contact.address ?? ""}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                branding: {
                  ...(prev.branding ?? {}),
                  contact: { ...(prev.branding?.contact ?? {}), address: e.target.value },
                },
              }))
            }
          />
        </div>
      </div>
    );
  };

  const stickyState = useMemo(() => {
    if (draftConflict.active) {
      return {
        className: "wf-sticky wf-sticky-err",
        title: "Conflicto de borrador",
        detail: draftConflict.serverUpdatedAt
          ? `Último guardado servidor: ${draftConflict.serverUpdatedAt}`
          : draftConflict.message,
      };
    }
    if (!panelReady) {
      return {
        className: "wf-sticky wf-sticky-warn",
        title: "Panel no cargado",
        detail: "Define slug + user UUID y haz click en Cargar panel.",
      };
    }
    if (autosaving || flushingPublish) {
      return {
        className: "wf-sticky wf-sticky-warn",
        title: flushingPublish ? "Esperando autosave para publicar..." : "Autosaving...",
        detail: autosaveHint,
      };
    }
    if (dirty) {
      return {
        className: "wf-sticky wf-sticky-warn",
        title: "Draft con cambios pendientes",
        detail: "Se guardará automáticamente o puedes usar Guardar Draft.",
      };
    }
    if (panelReady && mode === "draft" && heroDiff) {
      if (heroDiff.summary.hasChanges) {
        return {
          className: "wf-sticky wf-sticky-warn",
          title: "Draft con cambios vs Published",
          detail: `${heroDiff.summary.changedFields} campo(s) distinto(s) en Hero/Servicios/FAQ.`,
        };
      }
      return {
        className: "wf-sticky wf-sticky-ok",
        title: "Sin diferencias con Published",
        detail: "El draft coincide con la versión publicada.",
      };
    }
    return {
      className: "wf-sticky wf-sticky-ok",
      title: "Draft guardado",
      detail: autosaveHint,
    };
  }, [
    draftConflict.active,
    draftConflict.message,
    draftConflict.serverUpdatedAt,
    panelReady,
    autosaving,
    flushingPublish,
    autosaveHint,
    dirty,
    mode,
    heroDiff,
  ]);

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

      <div className={stickyState.className}>
        <strong>{stickyState.title}</strong>
        <small>{stickyState.detail}</small>
      </div>

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
            <select className="wf-select" value={mode} onChange={(e) => handleModeChange(e.target.value as Mode)}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button className="wf-btn wf-btn-soft" onClick={loadPanel} disabled={busy}>
              Cargar panel
            </button>
            <span className="wf-muted">{autosaveHint}</span>
          </div>

          <div className="wf-status" style={{ marginBottom: 12 }}>
            {publishedReadOnly ? <span className="wf-badge wf-badge-env">Lectura: versión publicada</span> : null}
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
            <button className="wf-btn wf-btn-primary" onClick={saveDraft} disabled={busy || publishedReadOnly || !panelReady || !canSaveDraft}>Guardar Draft</button>
            <button
              className="wf-btn wf-btn-primary"
              onClick={publish}
              disabled={busy || autosaving || flushingPublish || publishedReadOnly || draftConflict.active || !panelReady || !canPublish}
            >
              {flushingPublish ? "Esperando guardado..." : "Publicar"}
            </button>
            <button className="wf-btn wf-btn-soft" onClick={openPublishedJson} disabled={!panelReady}>
              Ver JSON publicado
            </button>
            <button
              className="wf-btn wf-btn-soft"
              onClick={fetchHeroDiff}
              disabled={busy || loadingDiff || !panelReady || !userId.trim()}
            >
              {loadingDiff ? "Comparando..." : "Ver cambios"}
            </button>
            {publishedReadOnly ? (
              <button className="wf-btn wf-btn-soft" onClick={startDraftEditing} disabled={busy || !panelReady || !canSaveDraft}>
                Editar borrador
              </button>
            ) : null}
            {draftConflict.active ? (
              <>
                <span className="wf-msg wf-err">
                  {draftConflict.message}
                  {draftConflict.serverUpdatedAt ? ` (Último guardado: ${draftConflict.serverUpdatedAt})` : ""}
                </span>
                <button className="wf-btn wf-btn-soft" onClick={reloadDraftAfterConflict} disabled={busy}>
                  Recargar borrador
                </button>
              </>
            ) : null}
          </div>

          {view === "sections" ? (
            <>
              <h2 className="wf-h3">Secciones</h2>
              <div className="wf-sections" style={{ marginBottom: 12 }}>
                {(settings?.content?.sections ?? []).map((section) => (
                  <div
                    key={section.id}
                    className={`wf-row-item ${draggingSectionId === section.id ? "dragging" : ""} ${editableSection === section.id ? "active" : ""}`}
                      draggable={!editingLocked}
                      onDragStart={() => setDraggingSectionId(section.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                      if (!editingLocked && draggingSectionId) reorderSections(draggingSectionId, section.id);
                      setDraggingSectionId(null);
                    }}
                    onDragEnd={() => setDraggingSectionId(null)}
                  >
                    <span className="wf-drag">⋮⋮</span>
                    <button className="wf-nav-btn" style={{ flex: 1, padding: "8px 10px" }} onClick={() => setEditableSection(toEditableSection(section.id))}>
                      <span>{section.id}</span>
                      <span className="wf-muted">order {section.order}</span>
                    </button>
                    <label className="wf-toggle">
                      <input disabled={editingLocked} type="checkbox" checked={section.enabled} onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))} />
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
                <button className="wf-btn wf-btn-soft" onClick={() => setEditableSection("projects")}>Proyectos</button>
                <button className="wf-btn wf-btn-soft" onClick={() => setEditableSection("testimonials")}>Testimonios</button>
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
                  draftUpdatedAt,
                  draftConflict: draftConflict.active,
                  heroTitle: typeof heroSection?.data?.title === "string" ? heroSection.data.title : "",
                  sections: settings?.content?.sections?.length ?? 0,
                  colors: settings?.colors ?? {},
                },
                null,
                2,
              )}
            </pre>
          </div>

          <div className="wf-preview-box">
            <strong>Diff (Draft vs Published)</strong>
            {heroDiff ? (
              <div className="wf-diff" style={{ marginTop: 8 }}>
                <div className="wf-muted">
                  Draft v{heroDiff.from.versionNumber} vs Published v{heroDiff.to.versionNumber} ·{" "}
                  {heroDiff.summary.changedFields}/{heroDiff.summary.totalFields} cambios
                </div>
                {renderDiffSection("Hero", heroDiff.sections.hero.fields)}
                {renderDiffSection("Servicios", heroDiff.sections.services.fields)}
                {renderDiffSection("FAQ", heroDiff.sections.faq.fields)}
                {renderDiffSection("Proyectos", heroDiff.sections.projects?.fields ?? [])}
                {renderDiffSection("Testimonios", heroDiff.sections.testimonials?.fields ?? [])}
              </div>
            ) : (
              <p className="wf-muted" style={{ marginTop: 8 }}>
                Usa “Ver cambios” para comparar Draft vs Published.
              </p>
            )}
          </div>

          <div className="wf-preview-box">
            <strong>Actividad reciente</strong>
            <div className="wf-log" style={{ marginTop: 8 }}>
              {actionLog.map((entry) => (
                <div className="wf-log-item" key={entry.id}>
                  <div>
                    <strong>{entry.action.toUpperCase()}</strong>
                    <div className="wf-muted">{entry.note}</div>
                  </div>
                  <div className="wf-muted" style={{ textAlign: "right" }}>
                    <div>{entry.version ? `v${entry.version}` : "-"}</div>
                    <div>{new Date(entry.at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              {!actionLog.length ? <p className="wf-muted">Sin actividad reciente.</p> : null}
            </div>
          </div>
        </section>
      </div>

      {toast ? (
        <div className="wf-toast-stack" role="status" aria-live="polite">
          <div
            className={`wf-toast ${
              toast.type === "success"
                ? "wf-toast-success"
                : toast.type === "error"
                  ? "wf-toast-error"
                  : "wf-toast-info"
            }`}
          >
            {toast.text}
          </div>
        </div>
      ) : null}
    </main>
  );
}
