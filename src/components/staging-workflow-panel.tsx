"use client";

import { useMemo, useState } from "react";

type Mode = "draft" | "published";

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
    sections?: Array<{
      id: string;
      enabled: boolean;
      order: number;
      data: Record<string, unknown>;
    }>;
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

const panelStyles = String.raw`
  .wf-wrap{max-width:1100px;margin:24px auto;padding:24px;font-family:Inter,sans-serif;color:#0f172a}
  .wf-card{border:1px solid #dbe3f0;border-radius:14px;background:#fff;padding:16px}
  .wf-grid{display:grid;gap:16px}
  @media(min-width:960px){.wf-grid{grid-template-columns:1.3fr 1fr}}
  .wf-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
  .wf-input,.wf-select,.wf-textarea{border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font:inherit}
  .wf-input,.wf-select{height:40px}
  .wf-input{min-width:250px;flex:1}
  .wf-select{min-width:150px}
  .wf-textarea{width:100%;min-height:90px;resize:vertical}
  .wf-btn{height:40px;border:0;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer}
  .wf-btn-primary{background:#1565c0;color:#fff}
  .wf-btn-ghost{background:#eff6ff;color:#1e3a8a}
  .wf-btn-warn{background:#ffedd5;color:#9a3412}
  .wf-note{font-size:13px;color:#475569}
  .wf-title{margin:0 0 8px;font-size:24px}
  .wf-sub{margin:0 0 16px;color:#64748b}
  .wf-status{display:inline-block;padding:4px 10px;border-radius:999px;background:#e2e8f0;font-size:12px;font-weight:700}
  .wf-ok{background:#dcfce7;color:#166534}
  .wf-err{background:#fee2e2;color:#991b1b}
  .wf-list{display:grid;gap:8px}
  .wf-item{border:1px solid #e2e8f0;border-radius:10px;padding:10px;display:flex;justify-content:space-between;gap:10px;align-items:center}
  .wf-muted{color:#64748b;font-size:12px}
  .wf-code{font-family:ui-monospace, SFMono-Regular, Menlo, monospace;font-size:12px;background:#f8fafc;padding:10px;border-radius:8px;overflow:auto}
`;

function patchHeroTitle(settings: SettingsPayload, nextTitle: string): SettingsPayload {
  const cloned = structuredClone(settings);
  if (!cloned.content) cloned.content = {};
  if (!cloned.content.hero) cloned.content.hero = {};
  cloned.content.hero.title = nextTitle;

  if (!Array.isArray(cloned.content.sections)) cloned.content.sections = [];
  const heroSectionIndex = cloned.content.sections.findIndex((section) => section.id === "hero");
  if (heroSectionIndex >= 0) {
    const heroSection = cloned.content.sections[heroSectionIndex];
    if (!heroSection.data) heroSection.data = {};
    heroSection.data.title = nextTitle;
  }

  return cloned;
}

export default function StagingWorkflowPanel() {
  const defaultSlug = process.env.NEXT_PUBLIC_SITE_SLUG?.trim() || "gasfiter-staging";
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:3000";

  const [siteSlug, setSiteSlug] = useState(defaultSlug);
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState<Mode>("published");
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [heroTitle, setHeroTitle] = useState("");
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const endpointBase = useMemo(
    () => `${baseUrl.replace(/\/$/, "")}/api/sites/${encodeURIComponent(siteSlug)}`,
    [baseUrl, siteSlug],
  );

  const setError = (text: string) => setMessage({ type: "err", text });
  const setOk = (text: string) => setMessage({ type: "ok", text });

  const fetchSettings = async (nextMode = mode) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${endpointBase}/settings?mode=${nextMode}&t=${Date.now()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Unable to fetch settings");

      const nextSettings = (payload?.settings ?? null) as SettingsPayload | null;
      setSettings(nextSettings);
      const titleFromHero = nextSettings?.content?.hero?.title;
      const titleFromSection = nextSettings?.content?.sections?.find((s) => s.id === "hero")?.data?.title;
      setHeroTitle(typeof titleFromHero === "string" ? titleFromHero : typeof titleFromSection === "string" ? titleFromSection : "");
      setOk(`Settings cargados en modo ${nextMode}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error cargando settings");
    } finally {
      setBusy(false);
    }
  };

  const fetchVersions = async () => {
    if (!userId.trim()) {
      setError("Ingresa userId para listar versiones");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${endpointBase}/versions?userId=${encodeURIComponent(userId.trim())}&t=${Date.now()}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Unable to fetch versions");
      setVersions(Array.isArray(payload?.versions) ? payload.versions : []);
      setOk("Versiones cargadas");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error cargando versiones");
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!userId.trim()) return setError("Ingresa userId para guardar draft");
    if (!settings) return setError("Primero carga settings");
    const nextSettings = patchHeroTitle(settings, heroTitle);

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${endpointBase}/save-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId.trim(),
        },
        body: JSON.stringify({
          userId: userId.trim(),
          notes: "Saved from mini staging panel",
          settings: nextSettings,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Save draft failed");
      setSettings(payload.settings as SettingsPayload);
      setOk(`Draft guardado (v${payload?.version?.number ?? "?"})`);
      await fetchVersions();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error guardando draft");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!userId.trim()) return setError("Ingresa userId para publicar");
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${endpointBase}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId.trim(),
        },
        body: JSON.stringify({
          userId: userId.trim(),
          notes: "Published from mini staging panel",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Publish failed");
      setOk(`Publicado (v${payload?.version?.number ?? "?"})`);
      setMode("published");
      await fetchSettings("published");
      await fetchVersions();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error publicando");
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (versionNumber: number) => {
    if (!userId.trim()) return setError("Ingresa userId para rollback");
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
          notes: `Rollback desde mini panel a v${versionNumber}`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Rollback failed");
      setOk(`Rollback aplicado a v${versionNumber} -> nueva published v${payload?.version?.number ?? "?"}`);
      setMode("published");
      await fetchSettings("published");
      await fetchVersions();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error en rollback");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="wf-wrap">
      <style dangerouslySetInnerHTML={{ __html: panelStyles }} />
      <h1 className="wf-title">Mini Panel UX - Staging Workflow</h1>
      <p className="wf-sub">Valida draft/published/rollback antes del panel completo.</p>

      <div className="wf-grid">
        <section className="wf-card">
          <div className="wf-row" style={{ marginBottom: 10 }}>
            <input className="wf-input" value={siteSlug} onChange={(e) => setSiteSlug(e.target.value)} placeholder="site slug" />
            <input className="wf-input" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user UUID (membership required)" />
          </div>

          <div className="wf-row" style={{ marginBottom: 14 }}>
            <select className="wf-select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button className="wf-btn wf-btn-ghost" onClick={() => fetchSettings(mode)} disabled={busy}>
              Cargar settings
            </button>
            <button className="wf-btn wf-btn-ghost" onClick={fetchVersions} disabled={busy}>
              Cargar versiones
            </button>
            <span className="wf-status">{mode.toUpperCase()}</span>
          </div>

          <label className="wf-note" htmlFor="hero-title">
            Hero title (edición rápida)
          </label>
          <textarea
            id="hero-title"
            className="wf-textarea"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="Título hero para draft"
          />

          <div className="wf-row" style={{ marginTop: 12 }}>
            <button className="wf-btn wf-btn-primary" onClick={saveDraft} disabled={busy}>
              Guardar draft
            </button>
            <button className="wf-btn wf-btn-primary" onClick={publish} disabled={busy}>
              Publicar
            </button>
          </div>

          {message ? (
            <p className={`wf-status ${message.type === "ok" ? "wf-ok" : "wf-err"}`} style={{ marginTop: 12 }}>
              {message.text}
            </p>
          ) : null}
        </section>

        <section className="wf-card">
          <h2 style={{ margin: "0 0 10px" }}>Versiones</h2>
          <div className="wf-list">
            {versions.map((version) => (
              <div className="wf-item" key={version.id}>
                <div>
                  <strong>v{version.version_number}</strong> · {version.status}
                  <div className="wf-muted">{version.notes || "Sin nota"}</div>
                </div>
                <button
                  className="wf-btn wf-btn-warn"
                  disabled={busy || version.status === "published"}
                  onClick={() => rollback(version.version_number)}
                >
                  Rollback
                </button>
              </div>
            ))}
            {!versions.length ? <p className="wf-muted">No hay versiones cargadas.</p> : null}
          </div>
        </section>
      </div>

      <section className="wf-card" style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 8px" }}>Snapshot actual (resumen)</h3>
        <pre className="wf-code">
          {JSON.stringify(
            {
              heroTitle,
              sections: settings?.content?.sections?.length ?? 0,
              colors: settings?.colors ?? {},
            },
            null,
            2,
          )}
        </pre>
      </section>
    </main>
  );
}
