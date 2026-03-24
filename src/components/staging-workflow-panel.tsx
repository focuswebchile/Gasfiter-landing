"use client";

import Image from "next/image";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

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
    logoNavUrl?: string;
    logoFooterUrl?: string;
    faviconUrl?: string;
    hideNavLogo?: boolean;
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
  updated_at?: string;
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
type PublishValidationIssue = {
  code?: string;
  label?: string;
  path?: string;
  message?: string;
};
type ToastState = {
  type: "success" | "error" | "info";
  text: string;
};

type ActionLogItem = {
  id: string;
  action: "save" | "publish" | "rollback" | "diff" | "request";
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

type PublishChecklistItem = {
  key: "hero_cta" | "services" | "testimonials" | "contact";
  label: string;
  completed: boolean;
  description: string;
  section: EditableSectionId;
  view: SidebarView;
};

type PublishWarningItem = {
  key: string;
  label: string;
  description: string;
  section: EditableSectionId;
  view: SidebarView;
};

type ImageUploadFieldProps = {
  value: string;
  placeholder: string;
  disabled: boolean;
  removeDisabled: boolean;
  uploading: boolean;
  uploadingText: string;
  fallbackText: string;
  guidanceText?: string;
  previewAlt: string;
  previewWidth: number;
  previewHeight: number;
  previewStyle?: CSSProperties;
  accept: string;
  allowedMimeTypes: string[];
  allowedExtensions?: string[];
  maxSizeBytes: number;
  hideUrlInput?: boolean;
  controlsInline?: boolean;
  onValueChange: (nextValue: string) => void;
  onReplace: (file: File | null) => void;
  onRemove: () => void;
};

type OverlayPanelProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const CONTENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const FAVICON_MAX_BYTES = 1 * 1024 * 1024;
const CONTENT_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const FAVICON_MIME_TYPES = ["image/png", "image/x-icon", "image/vnd.microsoft.icon"];
const FAVICON_EXTENSIONS = ["png", "ico"];
function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function bytesToMbText(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

function validateImageFile(
  file: File | null,
  options: { allowedMimeTypes: string[]; maxSizeBytes: number; allowedExtensions?: string[] },
): string | null {
  if (!file) return null;

  const mime = (file.type || "").toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeAllowed = options.allowedMimeTypes.includes(mime);
  const extensionAllowed = options.allowedExtensions ? options.allowedExtensions.includes(extension) : false;

  if (!mimeAllowed && !extensionAllowed) {
    const allowed = options.allowedExtensions?.length
      ? options.allowedExtensions.join(", ")
      : options.allowedMimeTypes
          .map((type) => {
            if (type.includes("png")) return "png";
            if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
            if (type.includes("webp")) return "webp";
            if (type.includes("svg")) return "svg";
            if (type.includes("icon")) return "ico";
            return type;
          })
          .join(", ");
    return `Formato no permitido. Usa: ${allowed}.`;
  }

  if (file.size > options.maxSizeBytes) {
    return `Archivo muy pesado (${bytesToMbText(file.size)}). Máximo ${bytesToMbText(options.maxSizeBytes)}.`;
  }

  return null;
}

function ImageUploadField({
  value,
  placeholder,
  disabled,
  removeDisabled,
  uploading,
  uploadingText,
  fallbackText,
  guidanceText,
  previewAlt,
  previewWidth,
  previewHeight,
  previewStyle,
  accept,
  allowedMimeTypes,
  allowedExtensions,
  maxSizeBytes,
  hideUrlInput = false,
  controlsInline = false,
  onValueChange,
  onReplace,
  onRemove,
}: ImageUploadFieldProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const hasValue = value.trim().length > 0;
  const previewNode = hasValue ? (
    <Image
      src={value}
      alt={previewAlt}
      width={previewWidth}
      height={previewHeight}
      unoptimized
      style={previewStyle ?? { maxHeight: previewHeight, width: "auto", objectFit: "contain" }}
    />
  ) : (
    <span className="wf-muted">{fallbackText}</span>
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {!hideUrlInput ? (
        <input
          className="wf-input"
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onValueChange(e.target.value)}
        />
      ) : null}
      {controlsInline ? <div className="wf-asset-preview-shell">{previewNode}</div> : null}
      <div className="wf-row" style={{ gap: 8, flexWrap: "wrap" }}>
        <label className="wf-btn wf-btn-soft" style={{ cursor: disabled ? "default" : "pointer" }}>
          Reemplazar
          <input
            type="file"
            hidden
            disabled={disabled}
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              const validation = validateImageFile(file, { allowedMimeTypes, maxSizeBytes, allowedExtensions });
              if (validation) {
                setValidationError(validation);
                e.currentTarget.value = "";
                return;
              }
              setValidationError(null);
              onReplace(file);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <button className="wf-btn wf-btn-warn" disabled={removeDisabled} onClick={onRemove}>
          Eliminar
        </button>
        {uploading ? <span className="wf-muted">{uploadingText}</span> : null}
      </div>
      {validationError ? <span className="wf-upload-error">{validationError}</span> : null}
      {guidanceText ? <span className="wf-muted">{guidanceText}</span> : null}
      {!controlsInline ? previewNode : null}
    </div>
  );
}

const OverlayPanel = memo(function OverlayPanel({ open, title, onClose, children }: OverlayPanelProps) {
  if (!open) return null;
  return (
    <div className="wf-overlay-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="wf-overlay-panel">
        <div className="wf-overlay-head">
          <h3>{title}</h3>
          <button className="wf-btn wf-btn-soft wf-btn-sm wf-btn-compact" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="wf-overlay-body">{children}</div>
      </div>
    </div>
  );
});

const STORAGE_KEY = "gasfiter_panel_v2_state";

const panelStyles = String.raw`
  :root{color-scheme:light}
  :root{
    --wf-bg:#f4f6fa;
    --wf-surface:#ffffff;
    --wf-surface-soft:#f8fafc;
    --wf-border:#dbe3f0;
    --wf-border-strong:#cbd5e1;
    --wf-text:#0f172a;
    --wf-muted:#64748b;
    --wf-primary:#1f5fbf;
    --wf-primary-soft:#e0ebff;
    --wf-primary-ink:#1e3a8a;
    --wf-success-bg:#f0fdf4;
    --wf-success-border:#86efac;
    --wf-success-ink:#166534;
    --wf-warn-bg:#fffbeb;
    --wf-warn-border:#fde68a;
    --wf-warn-ink:#92400e;
    --wf-danger-bg:#fef2f2;
    --wf-danger-border:#fecaca;
    --wf-danger-ink:#991b1b;
    --wf-fs-title:30px;
    --wf-fs-h2:21px;
    --wf-fs-h3:18px;
    --wf-fs-body:14px;
    --wf-fs-meta:12px;
    --wf-lh-tight:1.2;
    --wf-lh-base:1.45;
  }
  .wf-shell{max-width:1480px;margin:0 auto;padding:28px 22px 24px;font-family:Inter,sans-serif;color:var(--wf-text);background:var(--wf-bg)}
  .wf-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;align-items:flex-end;margin-bottom:18px}
  .wf-title{margin:0;font-size:var(--wf-fs-title);line-height:var(--wf-lh-tight);font-weight:800;letter-spacing:-.02em}
  .wf-sub{margin:6px 0 0;color:var(--wf-muted);font-size:var(--wf-fs-body);line-height:var(--wf-lh-base)}
  .wf-flowbar{border:1px solid var(--wf-border);background:var(--wf-surface-soft);border-radius:10px;padding:10px 12px;margin:0 0 12px}
  .wf-flowbar-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
  .wf-flowbar-title{font-size:13px;font-weight:700;color:var(--wf-text)}
  .wf-flowbar-track{height:8px;border-radius:999px;background:#e2e8f0;overflow:hidden;margin-top:8px}
  .wf-flowbar-fill{height:100%;background:var(--wf-success-ink);transition:width .2s ease}
  .wf-badges{display:flex;gap:8px;flex-wrap:wrap}
  .wf-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#e2e8f0;color:var(--wf-text)}
  .wf-badge-env{background:#fef3c7;color:var(--wf-warn-ink)}
  .wf-badge-role{background:#dbeafe;color:var(--wf-primary-ink)}
  .wf-badge-role-main{font-size:14px;font-weight:800;padding:8px 14px}
  .wf-badge-warn{background:#ffedd5;color:#9a3412}
  .wf-layout{display:grid;gap:16px}
  @media(min-width:1180px){.wf-layout{grid-template-columns:250px minmax(0,1fr);align-items:start}}
  .wf-workspace{min-width:0}
  .wf-card{border:1px solid var(--wf-border);border-radius:14px;background:var(--wf-surface);padding:16px}
  .wf-sidebar{display:grid;gap:10px;align-content:start}
  @media(min-width:1180px){
    .wf-sidebar{
      position:sticky;
      top:14px;
      max-height:calc(100vh - 32px);
      overflow:auto;
    }
  }
  .wf-nav-group{display:grid;gap:6px}
  .wf-nav-group + .wf-nav-group{margin-top:6px;padding-top:10px;border-top:1px solid #e2e8f0}
  .wf-nav-group-title{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--wf-muted);font-weight:800;padding:0 4px}
  .wf-nav-btn{display:flex;justify-content:space-between;align-items:center;border:1px solid var(--wf-border);background:var(--wf-surface-soft);border-radius:10px;padding:10px 12px;font-weight:700;font-size:13px;line-height:1.3;color:#334155;cursor:pointer}
  .wf-nav-btn.active{background:var(--wf-primary-soft);border-color:#9db4ee;color:var(--wf-primary-ink)}
  .wf-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .wf-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .wf-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;border:1px solid #e2e8f0;border-radius:12px;background:var(--wf-surface-soft);padding:10px 12px}
  .wf-toolbar-main .wf-input{min-width:260px}
  .wf-toolbar-actions .wf-select{min-width:170px}
  .wf-toolbar-status{display:flex;gap:8px;flex-wrap:wrap;padding:2px 0}
  .wf-editorial-status{display:grid;gap:8px;border:1px solid var(--wf-border);border-radius:12px;background:var(--wf-surface-soft);padding:12px 14px;margin-bottom:12px}
  .wf-editorial-status-title{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .wf-editorial-status-title strong{font-size:15px;line-height:1.25}
  .wf-editorial-status-desc{font-size:13px;line-height:1.4;color:var(--wf-muted)}
  .wf-editorial-status-meta{display:flex;flex-wrap:wrap;gap:8px}
  .wf-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#e2e8f0;color:var(--wf-text)}
  .wf-pill-primary{background:var(--wf-primary-soft);color:var(--wf-primary-ink)}
  .wf-pill-neutral{background:#edf2f7;color:#334155}
  .wf-pill-warn{background:var(--wf-warn-bg);color:#9a3412}
  .wf-pill-ok{background:var(--wf-success-bg);color:var(--wf-success-ink)}
  .wf-input,.wf-select,.wf-textarea{border:1px solid var(--wf-border-strong);border-radius:10px;padding:10px 12px;font:inherit;font-size:14px;line-height:1.35;background:var(--wf-surface)}
  .wf-input,.wf-select{height:40px}
  .wf-input{min-width:200px;flex:1}
  .wf-select{min-width:150px}
  .wf-textarea{width:100%;min-height:88px;resize:vertical}
  .wf-btn{height:38px;border:0;border-radius:10px;padding:0 12px;font-weight:700;font-size:13px;letter-spacing:.01em;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;line-height:1;text-align:center;vertical-align:middle}
  .wf-btn-sm{height:32px;padding:0 10px;font-size:12px}
  .wf-btn-compact{width:auto;min-width:max-content}
  .wf-btn:disabled{opacity:.5;cursor:not-allowed}
  .wf-btn:focus-visible,.wf-nav-btn:focus-visible,.wf-input:focus-visible,.wf-select:focus-visible,.wf-textarea:focus-visible{
    outline:2px solid var(--wf-primary);
    outline-offset:2px;
  }
  .wf-btn-primary{background:var(--wf-primary);color:#fff}
  .wf-btn-soft{background:#eef2ff;color:var(--wf-primary-ink)}
  .wf-btn-warn{background:#ffedd5;color:#9a3412}
  .wf-msg{display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700}
  .wf-ok{background:#dcfce7;color:var(--wf-success-ink)}
  .wf-err{background:#fee2e2;color:var(--wf-danger-ink)}
  .wf-alert{border:1px solid var(--wf-danger-border);background:var(--wf-danger-bg);color:var(--wf-danger-ink);border-radius:10px;padding:10px 12px}
  .wf-alert-title{font-size:14px;font-weight:800;margin-bottom:6px}
  .wf-alert-list{margin:0;padding-left:18px;font-size:13px;line-height:1.4;display:grid;gap:4px}
  .wf-readonly{border:1px solid var(--wf-warn-border);background:var(--wf-warn-bg);color:var(--wf-warn-ink);border-radius:10px;padding:10px 12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
  .wf-readonly strong{font-size:13px}
  .wf-readonly small{display:block;font-size:12px;color:#a16207}
  .wf-h3{margin:2px 0 10px;font-size:var(--wf-fs-h3);line-height:1.25;font-weight:800;letter-spacing:-.01em}
  .wf-muted{color:var(--wf-muted);font-size:var(--wf-fs-meta);line-height:1.4}
  .wf-sections,.wf-versions,.wf-items{display:grid;gap:8px}
  .wf-row-item{border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;background:var(--wf-surface);display:flex;gap:8px;align-items:center;justify-content:space-between}
  .wf-drag{cursor:grab;font-size:16px;color:#64748b;user-select:none;padding:0 2px}
  .wf-row-item.dragging{opacity:.65;border-style:dashed}
  .wf-row-item.active{border-color:#9db4ee;background:#f8fbff}
  .wf-toggle{display:flex;gap:8px;align-items:center;font-size:13px}
  .wf-toggle input{width:16px;height:16px}
  .wf-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;background:#f8fafc;padding:10px;border-radius:8px;overflow:auto;max-height:280px}
  .wf-upload-error{font-size:12px;color:#991b1b;font-weight:600}
  .wf-preview{display:grid;gap:12px}
  .wf-preview-box{border:1px solid var(--wf-border);border-radius:10px;background:var(--wf-surface-soft);padding:12px}
  .wf-kv{display:grid;gap:6px;font-size:13px}
  .wf-steps{display:grid;gap:8px;margin-bottom:12px;opacity:.8}
  .wf-step{display:flex;gap:8px;align-items:flex-start;padding:9px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0}
  .wf-step strong{font-size:13px;line-height:1.25}
  .wf-step-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:#e2e8f0;color:#334155;font-size:12px;font-weight:800}
  .wf-step.active{border-color:#cbd5e1;background:#fff;opacity:1}
  .wf-step.active .wf-step-num{background:#dbeafe;color:#1d4ed8}
  .wf-step-subtle{opacity:.72}
  .wf-step.completed{border-color:#e2e8f0;background:#f8fafc}
  .wf-step.completed .wf-step-num{background:#e2e8f0;color:#334155}
  .wf-step.state-ready{border-color:#e2e8f0;background:#f8fafc}
  .wf-step.state-ready .wf-step-num{background:#e2e8f0;color:#334155}
  .wf-step.state-warn{border-color:#e2e8f0;background:#f8fafc}
  .wf-step.state-warn .wf-step-num{background:#e2e8f0;color:#334155}
  .wf-step.state-error{border-color:#e2e8f0;background:#f8fafc}
  .wf-step.state-error .wf-step-num{background:#e2e8f0;color:#334155}
  .wf-progress{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:#eef2ff;color:var(--wf-primary-ink);font-size:12px;font-weight:700;letter-spacing:.01em}
  .wf-status{display:flex;gap:8px;flex-wrap:wrap}
  .wf-sticky{position:sticky;top:10px;z-index:30;border:1px solid var(--wf-border);background:var(--wf-surface-soft);padding:10px 12px;border-radius:12px;margin-bottom:12px;display:flex;gap:8px;align-items:center;justify-content:space-between;min-height:46px}
  .wf-sticky strong{font-size:13px}
  .wf-sticky small{color:#64748b}
  .wf-sticky-ok{border-color:var(--wf-success-border);background:var(--wf-success-bg)}
  .wf-sticky-warn{border-color:var(--wf-warn-border);background:var(--wf-warn-bg)}
  .wf-sticky-err{border-color:var(--wf-danger-border);background:var(--wf-danger-bg)}
  .wf-toast-stack{position:fixed;right:16px;bottom:16px;z-index:60;display:grid;gap:8px;max-width:min(420px,calc(100vw - 32px))}
  .wf-toast{border-radius:10px;padding:10px 12px;font-size:13px;font-weight:700;border:1px solid}
  .wf-toast-success{background:#dcfce7;border-color:var(--wf-success-border);color:var(--wf-success-ink)}
  .wf-toast-error{background:#fee2e2;border-color:var(--wf-danger-border);color:var(--wf-danger-ink)}
  .wf-toast-info{background:#e0ebff;border-color:#bfd1f4;color:var(--wf-primary-ink)}
  .wf-log{display:grid;gap:8px}
  .wf-log-item{display:flex;justify-content:space-between;gap:8px;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;background:#fff}
  .wf-diff{display:grid;gap:8px}
  .wf-diff-row{display:grid;gap:8px;border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#fff}
  .wf-diff-row.changed{border-color:#fde68a;background:#fffbeb}
  .wf-diff-row.same{border-color:#bbf7d0;background:#f0fdf4}
  .wf-diff-values{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .wf-diff-cell{border:1px solid #e2e8f0;border-radius:8px;padding:8px;background:#f8fafc;font-size:12px}
  .wf-checklist{display:grid;gap:8px;border:1px solid var(--wf-border);border-radius:12px;padding:10px;background:var(--wf-surface-soft);margin-bottom:12px}
  .wf-checklist-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .wf-checklist-head strong{font-size:14px}
  .wf-checklist-list{display:grid;gap:6px}
  .wf-checklist-item{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #e2e8f0;background:#fff;padding:8px 10px;border-radius:10px}
  .wf-checklist-item.ok{border-color:var(--wf-success-border);background:var(--wf-success-bg)}
  .wf-checklist-item.warn{border-color:var(--wf-warn-border);background:var(--wf-warn-bg)}
  .wf-checklist-left{display:grid;gap:2px}
  .wf-checklist-left strong{font-size:14px;line-height:1.3}
  .wf-checklist-left span{font-size:12px;color:#64748b;line-height:1.4}
  .wf-warn-block{display:grid;gap:8px;border:1px solid var(--wf-warn-border);border-radius:12px;padding:10px;background:var(--wf-warn-bg);margin-bottom:12px}
  .wf-warn-title{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .wf-warn-item{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #fcd34d;background:#fffaf0;padding:8px 10px;border-radius:10px}
  .wf-warn-item strong{font-size:14px;line-height:1.3}
  .wf-warn-item span{font-size:12px;color:#7c2d12;line-height:1.4}
  .wf-check-icon{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:999px;font-size:12px;font-weight:800}
  .wf-check-icon.ok{background:#166534;color:#fff}
  .wf-check-icon.warn{background:#b45309;color:#fff}
  .wf-action-help{min-height:18px;margin-top:-6px;margin-bottom:12px;font-size:12px;color:var(--wf-muted);display:flex;align-items:center}
  .wf-action-help.err{color:var(--wf-danger-ink)}
  .wf-actions-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
  .wf-actions-row .wf-muted{margin-left:4px}
  .wf-overlay-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:80;display:flex;justify-content:flex-end}
  .wf-overlay-panel{height:100%;width:min(760px,100vw);background:#fff;border-left:1px solid #dbe3f0;display:grid;grid-template-rows:auto minmax(0,1fr)}
  .wf-overlay-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid #e2e8f0}
  .wf-overlay-head h3{margin:0;font-size:20px;line-height:1.2;font-weight:800}
  .wf-overlay-body{overflow:auto;padding:14px;display:grid;gap:12px}
  .wf-style-stack{display:grid;gap:12px}
  .wf-style-layout{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .wf-style-card{border:1px solid var(--wf-border);border-radius:12px;background:var(--wf-surface-soft);display:grid;gap:10px;align-content:start}
  .wf-style-head{display:grid;gap:4px;padding:12px 12px 0}
  .wf-style-body{display:grid;gap:10px;padding:0 12px 12px}
  .wf-style-title{margin:0;font-size:16px;line-height:1.3;font-weight:800;letter-spacing:-.01em}
  .wf-style-help{margin:0;color:var(--wf-muted);font-size:12px;line-height:1.45}
  .wf-style-field{display:grid;gap:6px}
  .wf-style-label{font-size:12px;color:#334155;font-weight:700;letter-spacing:.01em}
  .wf-color-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .wf-color-field{display:grid;gap:6px}
  .wf-style-subsection{display:grid;gap:8px;padding-top:8px;border-top:1px solid #e2e8f0}
  .wf-asset-preview-shell{display:flex;align-items:center;min-height:74px;border:1px solid #dbe3f0;border-radius:10px;padding:10px 12px;background:#f8fafc}
  .wf-checkbox{display:inline-flex;align-items:center;gap:10px;font-size:13px;line-height:1.35}
  .wf-checkbox input{margin:0;width:16px;height:16px;flex:0 0 auto}
  .wf-sr-only{
    position:absolute!important;
    width:1px!important;
    height:1px!important;
    padding:0!important;
    margin:-1px!important;
    overflow:hidden!important;
    clip:rect(0,0,0,0)!important;
    white-space:nowrap!important;
    border:0!important;
  }
  @media(max-width:1179px){
    .wf-shell{padding:22px 14px 20px}
    .wf-layout{grid-template-columns:1fr}
    .wf-sidebar{position:sticky;top:8px;z-index:20;background:#fff}
    .wf-nav-group{display:flex;gap:8px;overflow:auto;padding-bottom:4px}
    .wf-nav-group + .wf-nav-group{margin-top:0;padding-top:0;border-top:0}
    .wf-nav-group-title{min-width:max-content;padding:9px 2px 0}
    .wf-nav-btn{min-width:max-content}
    .wf-workspace{max-width:100%}
    .wf-flowbar-head{align-items:flex-start;flex-direction:column}
    .wf-grid2{grid-template-columns:1fr}
    .wf-style-layout{grid-template-columns:1fr}
    .wf-color-grid{grid-template-columns:1fr}
    .wf-overlay-panel{width:min(820px,100vw)}
  }
  @media(max-width:768px){
    .wf-head{align-items:flex-start}
    :root{--wf-fs-title:24px;--wf-fs-h2:19px;--wf-fs-h3:17px}
    .wf-title{font-size:var(--wf-fs-title)}
    .wf-row{align-items:stretch}
    .wf-toolbar{padding:10px}
    .wf-input,.wf-select{min-width:0;width:100%}
    .wf-btn{width:100%}
    .wf-btn-compact{width:auto}
    .wf-toolbar-actions .wf-muted,.wf-toolbar-actions .wf-progress{width:100%}
    .wf-editorial-status-title{flex-direction:column;align-items:flex-start}
    .wf-status .wf-badge{width:max-content}
    .wf-step{padding:10px}
    .wf-checklist-item{flex-direction:column;align-items:flex-start}
    .wf-row-item{align-items:flex-start;flex-wrap:wrap}
    .wf-overlay-panel{width:100%;border-left:0}
    .wf-overlay-head{padding:10px 12px}
    .wf-overlay-body{padding:12px}
    .wf-toast-stack{left:10px;right:10px;bottom:10px;max-width:none}
  }
`;

function detectEnvBadge(slug: string): "DEV" | "STAGING" | "PROD" {
  const lower = slug.toLowerCase();
  if (lower.includes("staging")) return "STAGING";
  if (lower.includes("prod")) return "PROD";
  return "DEV";
}

function translateVersionStatus(status: VersionItem["status"]) {
  switch (status) {
    case "draft":
      return "borrador";
    case "published":
      return "publicado";
    case "archived":
      return "archivado";
    default:
      return status;
  }
}

function translateActionLabel(action: ActionLogItem["action"]) {
  switch (action) {
    case "save":
      return "GUARDAR";
    case "publish":
      return "PUBLICAR";
    case "rollback":
      return "ROLLBACK";
    case "diff":
      return "COMPARAR";
    case "request":
      return "SOLICITUD";
  }
}

function getRoleUxLabel(role: Role | null | undefined) {
  if (!role) return "SIN ROL";
  if (role === "owner" || role === "admin") return "OWNER";
  if (role === "editor") return "EDITOR";
  return "LECTURA";
}

function getRoleDisplayLabel(role: Role | null | undefined) {
  if (!role) return "Sin rol";
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "editor") return "Editor";
  return "Lectura";
}

function isHexColor(value: string) {
  return /^#([a-f0-9]{3}|[a-f0-9]{6})$/i.test(value.trim());
}

function normalizeColorValue(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function inferTypographyLabel(fontValue: string | null | undefined) {
  const raw = (fontValue ?? "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const familyParam = parsed.searchParams.get("family");
      if (familyParam) {
        const family = familyParam.split(":")[0]?.replace(/\+/g, " ").trim();
        if (family) return family;
      }
    } catch {
      // ignore malformed URL
    }
  }

  const first = raw.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "");
  return first || raw;
}

function sortByOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

function asNonEmptyString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeInternalTarget(value: unknown): string {
  const raw = asNonEmptyString(value).toLowerCase().replace(/\/+$/, "");
  if (!raw) return "";
  const aliases: Record<string, string> = {
    home: "home",
    "/": "home",
    "/home": "home",
    "#home": "home",
    servicios: "servicios",
    "/servicios": "servicios",
    "#servicios": "servicios",
    empresa: "empresa",
    "/empresa": "empresa",
    "#empresa": "empresa",
    clientes: "clientes",
    "/clientes": "clientes",
    "#clientes": "clientes",
    contacto: "contacto",
    "/contacto": "contacto",
    "#contacto": "contacto",
  };
  return aliases[raw] || "";
}

function isValidExternalUrl(value: unknown): boolean {
  const raw = asNonEmptyString(value).toLowerCase();
  return (
    raw.startsWith("https://") ||
    raw.startsWith("http://") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("tel:")
  );
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

function mapPublishIssueToSection(
  issue: PublishValidationIssue,
): { section: EditableSectionId; view: SidebarView; label: string } | null {
  const normalized = `${issue.code || ""} ${issue.path || ""} ${issue.label || ""} ${issue.message || ""}`.toLowerCase();
  if (normalized.includes("hero")) return { section: "hero", view: "sections", label: "Ir a Hero" };
  if (normalized.includes("empresa") || normalized.includes("audiencia")) {
    return { section: "audience", view: "sections", label: "Ir a Quiénes somos" };
  }
  if (normalized.includes("urgente")) {
    return { section: "urgency_banner", view: "sections", label: "Ir a Cobertura y confianza" };
  }
  if (normalized.includes("servicio")) return { section: "services", view: "items", label: "Ir a Servicios" };
  if (normalized.includes("testimonio")) return { section: "testimonials", view: "items", label: "Ir a Testimonios" };
  if (normalized.includes("contact")) return { section: "contact_banner", view: "sections", label: "Ir a Contacto" };
  return null;
}

function getSectionDisplayName(sectionId: string): string {
  switch (sectionId) {
    case "hero":
      return "Hero";
    case "audience":
      return "Quiénes somos";
    case "services":
      return "Servicios";
    case "projects":
      return "Proyectos";
    case "urgency_banner":
      return "Cobertura y confianza";
    case "contact_banner":
      return "Contacto";
    case "testimonials":
      return "Testimonios";
    case "faq":
      return "Preguntas frecuentes";
    default:
      return sectionId;
  }
}

export default function StagingWorkflowPanel() {
  const defaultSlug = process.env.NEXT_PUBLIC_SITE_SLUG?.trim() || "gasfiter-staging";
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "";
  const defaultUserId = process.env.NEXT_PUBLIC_CMS_DEFAULT_USER_ID?.trim() || "";
  const configuredAuthRedirectBase = process.env.NEXT_PUBLIC_CMS_AUTH_REDIRECT_BASE_URL?.trim() || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
  const authEnabled = Boolean(isValidHttpUrl(supabaseUrl) && supabaseAnonKey);
  const allowLegacyIdentityFallback = Boolean(defaultUserId);

  const [siteSlug, setSiteSlug] = useState(defaultSlug);
  const [userId, setUserId] = useState(defaultUserId);
  const [mode, setMode] = useState<Mode>("draft");
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
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  const [showDiffOverlay, setShowDiffOverlay] = useState(false);
  const [sendingRequestPublishReminder, setSendingRequestPublishReminder] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<"logoNav" | "logoFooter" | "favicon" | null>(null);
  const [uploadingContentAssetKey, setUploadingContentAssetKey] = useState<string | null>(null);
  const [publishValidationMissing, setPublishValidationMissing] = useState<PublishValidationIssue[]>([]);
  const [authEmail, setAuthEmail] = useState("");
  const [authUserEmail, setAuthUserEmail] = useState("");
  const [authBootstrapped, setAuthBootstrapped] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const querySlugRef = useRef<string | null>(null);
  const queryUserIdRef = useRef<string | null>(null);
  const normalizedSiteSlug = siteSlug.trim().toLowerCase();
  const hideFaqAndTestimonialsInItems = false;
  const hiddenSectionsInSectionsView = useMemo<Set<EditableSectionId> | null>(() => null, []);

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return configuredBaseUrl || "http://localhost:3000";
    }
    const sameOrigin = window.location.origin;
    if (!configuredBaseUrl) return sameOrigin;
    try {
      const configuredHost = new URL(configuredBaseUrl).hostname.toLowerCase();
      const currentHost = window.location.hostname.toLowerCase();
      const isCurrentLocal = /^(localhost|127\.0\.0\.1)$/.test(currentHost);

      // Local dev can target a remote backend; deployed hosts should prefer same-origin.
      if (isCurrentLocal) return configuredBaseUrl;
      if (configuredHost !== currentHost) return sameOrigin;
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
  const supabaseClient: SupabaseClient | null = useMemo(() => {
    if (!authEnabled) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }, [authEnabled, supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get("slug")?.trim() || "";
    const queryUserId = allowLegacyIdentityFallback ? (params.get("userId") ?? params.get("uid") ?? "").trim() : "";
    querySlugRef.current = querySlug || null;
    queryUserIdRef.current = queryUserId || null;

    if (querySlug) setSiteSlug(querySlug);
    if (queryUserId) setUserId(queryUserId);
    else if (allowLegacyIdentityFallback && defaultUserId) setUserId((current) => current.trim() || defaultUserId);

    if (params.has("slug") || params.has("userId") || params.has("uid")) {
      params.delete("slug");
      params.delete("userId");
      params.delete("uid");
      const nextQuery = params.toString();
      const cleanUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash || ""}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [allowLegacyIdentityFallback, defaultUserId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { siteSlug?: string; userId?: string; mode?: Mode };
      if (parsed.siteSlug && !querySlugRef.current) setSiteSlug(parsed.siteSlug);
      if (allowLegacyIdentityFallback) {
        if (parsed.userId && !queryUserIdRef.current) setUserId(parsed.userId);
        else if (defaultUserId) setUserId(defaultUserId);
      }
      if (parsed.mode === "draft" || parsed.mode === "published") setMode(parsed.mode);
    } catch {
      // ignore invalid storage
    }
  }, [allowLegacyIdentityFallback, defaultUserId]);

  useEffect(() => {
    if (!supabaseClient) {
      setAuthBootstrapped(true);
      return;
    }
    let active = true;
    void supabaseClient.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      if (session?.user?.id) {
        setUserId(session.user.id);
        setAuthUserEmail(session.user.email ?? "");
      } else if (!allowLegacyIdentityFallback) {
        setUserId("");
        setAuthUserEmail("");
      }
      setAuthBootstrapped(true);
    });

    const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user?.id) {
        setUserId(session.user.id);
        setAuthUserEmail(session.user.email ?? "");
      } else if (!allowLegacyIdentityFallback) {
        setUserId("");
        setAuthUserEmail("");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [allowLegacyIdentityFallback, supabaseClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ siteSlug, userId, mode }));
  }, [siteSlug, userId, mode]);

  const showToast = useCallback((nextToast: ToastState | null) => {
    setToast(nextToast);
  }, []);
  const setError = useCallback((text: string) => showToast({ type: "error", text }), [showToast]);
  const setOk = useCallback((text: string) => showToast({ type: "success", text }), [showToast]);

  const sendMagicLink = useCallback(async () => {
    if (!supabaseClient) {
      setError("Auth no configurado: faltan variables NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const email = authEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Ingresa un correo válido para enviar el magic link.");
      return;
    }
    setSendingMagicLink(true);
    try {
      const redirectBase = isValidHttpUrl(configuredAuthRedirectBase)
        ? configuredAuthRedirectBase.replace(/\/$/, "")
        : window.location.origin;
      const redirectUrl = `${redirectBase}/staging?slug=${encodeURIComponent(siteSlug.trim() || defaultSlug)}`;
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      setOk("Magic link enviado. Revisa tu correo para iniciar sesión.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo enviar el magic link.";
      setError(message);
    } finally {
      setSendingMagicLink(false);
    }
  }, [authEmail, configuredAuthRedirectBase, defaultSlug, setError, setOk, siteSlug, supabaseClient]);

  const closeSession = useCallback(async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    setUserId("");
    setAuthUserEmail("");
    setMembership(null);
    setPanelReady(false);
    setOk("Sesión cerrada.");
  }, [setOk, supabaseClient]);

  const canSaveDraft = membership?.permissions.canSaveDraft ?? false;
  const canPublish = membership?.permissions.canPublish ?? false;
  const canRollback = membership?.permissions.canRollback ?? false;
  const roleResolved = membership !== null;
  const isAdvancedRole = membership?.role === "owner" || membership?.role === "admin";
  const showAdvancedUi = roleResolved && isAdvancedRole;
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

  const visibleSectionsForSectionsView = useMemo(() => {
    const sections = settings?.content?.sections ?? [];
    if (!hiddenSectionsInSectionsView) return sections;
    return sections.filter((section) => !hiddenSectionsInSectionsView.has(section.id as EditableSectionId));
  }, [settings?.content?.sections, hiddenSectionsInSectionsView]);

  useEffect(() => {
    if (!hideFaqAndTestimonialsInItems) return;
    if (view !== "items") return;
    if (editableSection === "faq") {
      setEditableSection("services");
      return;
    }
    if (editableSection === "testimonials") {
      setEditableSection("projects");
    }
  }, [editableSection, hideFaqAndTestimonialsInItems, view]);

  useEffect(() => {
    if (!hiddenSectionsInSectionsView) return;
    if (view !== "sections") return;
    if (!hiddenSectionsInSectionsView.has(editableSection)) return;
    setEditableSection("hero");
  }, [editableSection, hiddenSectionsInSectionsView, view]);

  const handleModeChange = (nextMode: Mode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setPanelReady(false);
    setDirty(false);
    setDraftUpdatedAt(null);
    setDraftConflict({ active: false, message: "", serverUpdatedAt: null });
    const modeLabel = nextMode === "draft" ? "borrador" : "publicado";
    setAutosaveHint(`Modo ${modeLabel} seleccionado. Presiona Cargar panel.`);
    setOk(`Modo ${modeLabel} seleccionado. Recarga panel para sincronizar.`);
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
      const serverDraftTs = pickTimestamp(latestDraft?.updated_at, latestDraft?.created_at);
      if (serverDraftTs) {
        setDraftUpdatedAt((prev) => pickTimestamp(prev, serverDraftTs));
      }
    }
    if (!silent) setOk("Versiones cargadas");
  }, [fetchWithJsonFallback, userId, setOk, mode]);

  const loadPanel = useCallback(async () => {
    if (!siteSlug.trim()) return setError("Ingresa slug del sitio");
    if (!userId.trim()) return setError("No se detectó sesión de usuario. Inicia sesión nuevamente.");

    setBusy(true);
    setToast(null);
    setPublishValidationMissing([]);
    try {
      await Promise.all([fetchSettings(mode, true), fetchVersions(true)]);
      setPanelReady(true);
      setHeroDiff(null);
      setOk(`Panel cargado (${mode === "draft" ? "borrador" : "publicado"})`);
    } catch (error) {
      setPanelReady(false);
      setError(error instanceof Error ? error.message : "Error cargando panel");
    } finally {
      setBusy(false);
    }
  }, [siteSlug, userId, mode, fetchSettings, fetchVersions, setError, setOk]);

  const fetchHeroDiff = useCallback(async () => {
    if (!siteSlug.trim()) return setError("Ingresa slug del sitio");
    if (!userId.trim()) return setError("No se detectó sesión de usuario. Inicia sesión nuevamente.");
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
      appendActionLog("diff", null, `Ver cambios borrador vs publicado (${changed})`);
    } catch (error) {
      setHeroDiff(null);
      setError(error instanceof Error ? error.message : "Error generando diff");
    } finally {
      setLoadingDiff(false);
    }
  }, [siteSlug, userId, panelReady, fetchWithJsonFallback, setError, setOk, appendActionLog]);

  const openPreview = useCallback(() => {
    if (!panelReady) return setError("Primero usa Cargar panel");
    setShowPreviewOverlay(true);
  }, [panelReady, setError]);

  const openDiff = useCallback(async () => {
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!heroDiff) {
      await fetchHeroDiff();
    }
    setShowDiffOverlay(true);
  }, [panelReady, heroDiff, fetchHeroDiff, setError]);

  const renderDiffSection = (title: string, fields: HeroDiffField[]) => (
    <div className="wf-diff" style={{ marginTop: 8 }}>
      <strong>{title}</strong>
      {fields.length ? (
        fields.map((field) => (
          <div key={field.path} className={`wf-diff-row ${field.changed ? "changed" : "same"}`}>
            <strong>{field.label}</strong>
            <div className="wf-diff-values">
              <div className="wf-diff-cell">
                <div className="wf-muted">Borrador</div>
                <div>{field.from || "—"}</div>
              </div>
              <div className="wf-diff-cell">
                <div className="wf-muted">Publicado</div>
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
    if (!userId.trim()) return setError("No se detectó sesión de usuario. Inicia sesión nuevamente.");
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
        setAutosaveHint("Autoguardado: guardando borrador...");
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
            notes: options?.notes ?? "Guardado desde editor CMS",
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
        if (!response.ok) throw new Error((payloadUnknown as { error?: string })?.error || "Falló el guardado de borrador");
        const payload = payloadUnknown as {
          settings?: SettingsPayload;
          version?: { number?: number };
          draftUpdatedAt?: string | null;
        };
        setSettings(normalizeSettings((payload.settings ?? {}) as SettingsPayload));
        setPublishValidationMissing([]);
        setDraftUpdatedAt(pickTimestamp((payload as { draftUpdatedAt?: unknown }).draftUpdatedAt, expectedUpdatedAt));
        setMode("draft");
        setDraftConflict({ active: false, message: "", serverUpdatedAt: null });
        setDirty(false);
        if (silent) {
          setAutosaveHint(`Autoguardado OK (v${payload.version?.number ?? "?"})`);
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
    await saveDraftInternal({ silent: false, notes: "Guardado desde editor CMS" });
  };

  const startDraftEditing = useCallback(async () => {
    if (!userId.trim()) return setError("No se detectó sesión de usuario. Inicia sesión nuevamente.");
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!canSaveDraft) return setError("Tu rol no puede editar borrador");

    setBusy(true);
    setToast(null);
    setPublishValidationMissing([]);
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
        setPublishValidationMissing([]);
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
    if (!userId.trim()) return setError("No se detectó sesión de usuario. Inicia sesión nuevamente.");
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
    setPublishValidationMissing([]);
    try {
      const response = await fetch(`${endpointBase}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId.trim(),
        },
        body: JSON.stringify({
          userId: userId.trim(),
          notes: "Publicado desde editor CMS",
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
            missing?: PublishValidationIssue[];
          }
        | DraftConflictPayload;
      if (response.status === 409 && (payloadUnknown as DraftConflictPayload)?.error === "DRAFT_OUTDATED") {
        activateDraftConflict(payloadUnknown as DraftConflictPayload);
        setError((payloadUnknown as DraftConflictPayload).message || "Conflicto de draft.");
        return;
      }
      if (
        response.status === 422 &&
        (payloadUnknown as { error?: string }).error === "PUBLISH_VALIDATION_FAILED"
      ) {
        const payload = payloadUnknown as {
          message?: string;
          missing?: PublishValidationIssue[];
        };
        const missingIssues = (payload.missing ?? []).filter(
          (issue): issue is PublishValidationIssue =>
            Boolean(issue && (issue.label || issue.message || issue.code)),
        );
        const labels = missingIssues
          .map((issue) => issue?.label || issue?.message || issue?.code)
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
        const uniqueLabels = Array.from(new Set(labels));
        const details = uniqueLabels.length > 0 ? `Falta: ${uniqueLabels.join(", ")}.` : "";
        setPublishValidationMissing(missingIssues);
        setError(`${payload.message || "No se puede publicar."} ${details}`.trim());
        return;
      }
      if (!response.ok) throw new Error((payloadUnknown as { error?: string })?.error || "Falló la publicación");
      const payload = payloadUnknown as {
        settings?: SettingsPayload;
        version?: { number?: number };
        draftUpdatedAt?: string | null;
      };
      setSettings(normalizeSettings((payload.settings ?? {}) as SettingsPayload));
      setPublishValidationMissing([]);
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
    if (!userId.trim()) return setError("No se detectó sesión de usuario. Inicia sesión nuevamente.");
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!canRollback) return setError("Tu rol no puede hacer rollback");

    setBusy(true);
    setToast(null);
    setPublishValidationMissing([]);
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
          notes: `Rollback desde editor CMS a v${versionNumber}`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Rollback failed");
      setSettings(normalizeSettings((payload?.settings ?? {}) as SettingsPayload));
      setPublishValidationMissing([]);
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

  const uploadBrandingAsset = async (
    assetType: "logo" | "favicon",
    file: File | null,
    targetKey: "logoNavUrl" | "logoFooterUrl" | "faviconUrl" = assetType === "logo" ? "logoNavUrl" : "faviconUrl",
  ) => {
      if (!file) return;
      const validationError = validateImageFile(file, {
        allowedMimeTypes: assetType === "favicon" ? FAVICON_MIME_TYPES : LOGO_MIME_TYPES,
        maxSizeBytes: assetType === "favicon" ? FAVICON_MAX_BYTES : LOGO_MAX_BYTES,
        allowedExtensions: assetType === "favicon" ? FAVICON_EXTENSIONS : undefined,
      });
      if (validationError) return setError(validationError);
      if (!panelReady) return setError("Primero usa Cargar panel");
      if (!userId.trim()) return setError("No se detectó sesión de usuario. Inicia sesión nuevamente.");
      if (!canSaveDraft) return setError("Tu rol no puede editar estilo");
      if (publishedReadOnly) return setError("Activa modo draft para editar estilo");

      const uploadTarget = targetKey === "logoNavUrl" ? "logoNav" : targetKey === "logoFooterUrl" ? "logoFooter" : "favicon";
      setUploadingAsset(uploadTarget);
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
              [targetKey]: payload.url,
            },
          }),
          {
            persistNow: true,
            note: `Autosave: ${targetKey} updated`,
          },
        );
        setOk(
          assetType === "logo"
            ? targetKey === "logoFooterUrl"
              ? "Logo footer subido"
              : "Logo navbar subido"
            : "Favicon subido",
        );
      } catch (error) {
        setError(error instanceof Error ? error.message : "Falló la subida del archivo");
      } finally {
        setUploadingAsset(null);
      }
    };

  const uploadContentAsset = async (params: {
    sectionId: "hero" | "projects" | "testimonials" | "contact_banner" | "audience";
    field: "image" | "avatar" | "background_image" | "image_back" | "image_front";
    file: File | null;
    itemId?: string;
  }) => {
    const { sectionId, field, file, itemId } = params;
    if (!file) return;
    const validationError = validateImageFile(file, {
      allowedMimeTypes: CONTENT_IMAGE_MIME_TYPES,
      maxSizeBytes: CONTENT_IMAGE_MAX_BYTES,
    });
    if (validationError) return setError(validationError);
    if (!panelReady) return setError("Primero usa Cargar panel");
    if (!userId.trim()) return setError("No se detectó sesión de usuario. Inicia sesión nuevamente.");
    if (!canSaveDraft) return setError("Tu rol no puede editar contenido");
    if (publishedReadOnly) return setError("Activa modo draft para editar contenido");

    const uploadKey = `${sectionId}:${itemId ?? "section"}:${field}`;
    setUploadingContentAssetKey(uploadKey);
    try {
      const form = new FormData();
      form.append("userId", userId.trim());
      form.append("sectionId", sectionId);
      form.append("field", field);
      if (itemId) form.append("itemId", itemId);
      form.append("file", file);

      const response = await fetch(`${endpointBase}/asset-upload`, {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        details?: string;
        url?: string;
      };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || payload.details || "No se pudo subir imagen");
      }

      if (itemId) {
        updateSettings(
          (prev) => {
            const section = getSection(prev, sectionId);
            if (!section) return prev;
            const nextItems = toSectionItems(section).map((nextItem) =>
              String(nextItem.id) === itemId ? { ...nextItem, [field]: payload.url } : nextItem,
            );
            return setSectionItems(prev, sectionId, nextItems);
          },
          {
            persistNow: true,
            note: `Autosave: ${sectionId} ${field} replaced`,
          },
        );
      } else {
        updateSettings(
          (prev) => {
            const section = getSection(prev, sectionId);
            if (!section) return prev;
            if (sectionId === "audience" && (field === "image_back" || field === "image_front")) {
              const key = field === "image_back" ? "back" : "front";
              return upsertSection(prev, {
                ...section,
                data: {
                  ...section.data,
                  images: {
                    ...((section.data.images as Record<string, unknown>) ?? {}),
                    [key]: payload.url,
                  },
                },
              });
            }
            return upsertSection(prev, { ...section, data: { ...section.data, [field]: payload.url } });
          },
          {
            persistNow: true,
            note: `Autosave: ${sectionId} ${field} replaced`,
          },
        );
      }
      setOk("Imagen subida");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Falló la subida de la imagen");
    } finally {
      setUploadingContentAssetKey(null);
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
    setAutosaveHint("Autosave en 15s...");
    autosaveTimerRef.current = window.setTimeout(() => {
      void saveDraftInternal({ silent: true, notes: "Autosave from v3 UX base" });
    }, 15000);

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
            Hero habilitado
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.eyebrow === "string" ? section.data.eyebrow : ""}
            placeholder="Eyebrow hero (badge superior)"
            onChange={(e) =>
              updateSettings((prev) =>
                upsertSection(prev, { ...section, data: { ...section.data, eyebrow: e.target.value } }),
              )
            }
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Título principal"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))}
          />
          <textarea
            className="wf-textarea"
            disabled={editingLocked}
            value={typeof section.data.subtitle === "string" ? section.data.subtitle : ""}
            placeholder="Subtítulo principal"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, subtitle: e.target.value } }))}
          />
          <ImageUploadField
            value={typeof section.data.image === "string" ? section.data.image : ""}
            placeholder="URL/ruta imagen hero"
            disabled={editingLocked}
            removeDisabled={editingLocked || !(typeof section.data.image === "string" && section.data.image.trim())}
            uploading={uploadingContentAssetKey === "hero:section:image"}
            uploadingText="Subiendo imagen..."
            fallbackText="Sin imagen hero (usa fallback del layout)"
            guidanceText="Formatos: png, jpg, webp, svg. Máximo 5MB."
            previewAlt="hero preview"
            previewWidth={320}
            previewHeight={92}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            allowedMimeTypes={CONTENT_IMAGE_MIME_TYPES}
            maxSizeBytes={CONTENT_IMAGE_MAX_BYTES}
            onValueChange={(nextValue) =>
              updateSettings((prev) =>
                upsertSection(prev, { ...section, data: { ...section.data, image: nextValue } }),
              )
            }
            onReplace={(file) => {
              void uploadContentAsset({ sectionId: "hero", field: "image", file });
            }}
            onRemove={() =>
              updateSettings(
                (prev) => upsertSection(prev, { ...section, data: { ...section.data, image: "" } }),
                { persistNow: true, note: "Autosave: hero image removed" },
              )
            }
          />
          <div className="wf-grid2">
            <input
              className="wf-input"
              disabled={editingLocked}
              value={typeof (section.data.cta_primary as { text?: unknown } | undefined)?.text === "string" ? ((section.data.cta_primary as { text: string }).text ?? "") : ""}
              placeholder="Texto CTA"
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
              placeholder="URL CTA"
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
      const audienceImages = (section.data.images as { back?: unknown; front?: unknown } | undefined) ?? {};
      const audienceBackImage = typeof audienceImages.back === "string" ? audienceImages.back : "";
      const audienceFrontImage = typeof audienceImages.front === "string" ? audienceImages.front : "";
      return (
        <div className="wf-sections">
          <div className="wf-toggle">
            <input
              disabled={editingLocked}
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))}
            />
            {getSectionDisplayName(section.id)} habilitada
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.kicker === "string" ? section.data.kicker : ""}
            placeholder="Etiqueta audiencia"
            onChange={(e) =>
              updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, kicker: e.target.value } }))
            }
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Título audiencia"
            onChange={(e) =>
              updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))
            }
          />
          <textarea
            className="wf-textarea"
            disabled={editingLocked}
            value={typeof section.data.description === "string" ? section.data.description : ""}
            placeholder="Descripción audiencia"
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
              value={audienceBackImage}
              placeholder="Imagen fondo"
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
              value={audienceFrontImage}
              placeholder="Imagen frontal"
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
            <ImageUploadField
              value={audienceBackImage}
              placeholder="Imagen fondo audiencia (URL/ruta)"
              disabled={editingLocked}
              removeDisabled={editingLocked || !audienceBackImage.trim()}
              uploading={uploadingContentAssetKey === "audience:section:image_back"}
              uploadingText="Subiendo imagen..."
              fallbackText="Sin imagen fondo (usa fallback del layout)"
              guidanceText="Formatos: png, jpg, webp, svg. Máximo 5MB."
              previewAlt="audience background preview"
              previewWidth={280}
              previewHeight={84}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              allowedMimeTypes={CONTENT_IMAGE_MIME_TYPES}
              maxSizeBytes={CONTENT_IMAGE_MAX_BYTES}
              onValueChange={(nextValue) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: {
                      ...section.data,
                      images: { ...((section.data.images as Record<string, unknown>) ?? {}), back: nextValue },
                    },
                  }),
                )
              }
              onReplace={(file) => {
                void uploadContentAsset({ sectionId: "audience", field: "image_back", file });
              }}
              onRemove={() =>
                updateSettings(
                  (prev) =>
                    upsertSection(prev, {
                      ...section,
                      data: {
                        ...section.data,
                        images: {
                          ...((section.data.images as Record<string, unknown>) ?? {}),
                          back: "",
                        },
                      },
                    }),
                  { persistNow: true, note: "Autosave: audience image back removed" },
                )
              }
            />
            <ImageUploadField
              value={audienceFrontImage}
              placeholder="Imagen frontal audiencia (URL/ruta)"
              disabled={editingLocked}
              removeDisabled={editingLocked || !audienceFrontImage.trim()}
              uploading={uploadingContentAssetKey === "audience:section:image_front"}
              uploadingText="Subiendo imagen..."
              fallbackText="Sin imagen frontal (usa fallback del layout)"
              guidanceText="Formatos: png, jpg, webp, svg. Máximo 5MB."
              previewAlt="audience front preview"
              previewWidth={280}
              previewHeight={84}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              allowedMimeTypes={CONTENT_IMAGE_MIME_TYPES}
              maxSizeBytes={CONTENT_IMAGE_MAX_BYTES}
              onValueChange={(nextValue) =>
                updateSettings((prev) =>
                  upsertSection(prev, {
                    ...section,
                    data: {
                      ...section.data,
                      images: { ...((section.data.images as Record<string, unknown>) ?? {}), front: nextValue },
                    },
                  }),
                )
              }
              onReplace={(file) => {
                void uploadContentAsset({ sectionId: "audience", field: "image_front", file });
              }}
              onRemove={() =>
                updateSettings(
                  (prev) =>
                    upsertSection(prev, {
                      ...section,
                      data: {
                        ...section.data,
                        images: {
                          ...((section.data.images as Record<string, unknown>) ?? {}),
                          front: "",
                        },
                      },
                    }),
                  { persistNow: true, note: "Autosave: audience image front removed" },
                )
              }
            />
          </div>
          <div className="wf-grid2">
            <input
              className="wf-input"
              disabled={editingLocked}
              value={typeof (section.data.cta_primary as { text?: unknown } | undefined)?.text === "string" ? ((section.data.cta_primary as { text?: string }).text ?? "") : ""}
              placeholder="Texto CTA principal"
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
              placeholder="URL CTA principal"
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
              placeholder="Texto CTA secundario"
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
              placeholder="URL CTA secundario"
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
                  placeholder="Ícono (ej: fa-circle-check)"
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
                habilitada
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
            {getSectionDisplayName(section.id)} habilitada
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Título proyectos"
            onChange={(e) =>
              updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))
            }
          />
          <textarea
            className="wf-textarea"
            disabled={editingLocked}
            value={typeof section.data.description === "string" ? section.data.description : ""}
            placeholder="Descripción proyectos"
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
                    placeholder="Título"
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
                    placeholder="Ubicación"
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
                  <ImageUploadField
                    value={typeof item.image === "string" ? item.image : ""}
                    placeholder="URL/ruta imagen"
                    disabled={editingLocked}
                    removeDisabled={editingLocked || !(typeof item.image === "string" && item.image.trim())}
                    uploading={uploadingContentAssetKey === `projects:${itemId}:image`}
                    uploadingText="Subiendo imagen..."
                    fallbackText="Sin imagen (usa fallback del card)"
                    guidanceText="Formatos: png, jpg, webp, svg. Máximo 5MB."
                    previewAlt="project preview"
                    previewWidth={280}
                    previewHeight={86}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    allowedMimeTypes={CONTENT_IMAGE_MIME_TYPES}
                    maxSizeBytes={CONTENT_IMAGE_MAX_BYTES}
                    onValueChange={(nextValue) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, image: nextValue } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                    onReplace={(file) => {
                      void uploadContentAsset({
                        sectionId: "projects",
                        field: "image",
                        itemId,
                        file,
                      });
                    }}
                    onRemove={() =>
                      updateSettings(
                        (prev) => {
                          const sec = getSection(prev, section.id);
                          if (!sec) return prev;
                          const nextItems = toSectionItems(sec).map((nextItem) =>
                            String(nextItem.id) === itemId ? { ...nextItem, image: "" } : nextItem,
                          );
                          return setSectionItems(prev, section.id, nextItems);
                        },
                        { persistNow: true, note: "Autosave: project image removed" },
                      )
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
                  habilitada
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
            {getSectionDisplayName(section.id)} habilitada
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Título banner"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))}
          />
          <textarea
            className="wf-textarea"
            disabled={editingLocked}
            value={typeof section.data.description === "string" ? section.data.description : ""}
            placeholder="Descripción banner"
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
              placeholder="Texto CTA"
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
              placeholder="URL CTA"
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
            {getSectionDisplayName(section.id)} habilitada
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.kicker === "string" ? section.data.kicker : ""}
            placeholder="Etiqueta"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, kicker: e.target.value } }))}
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.title === "string" ? section.data.title : ""}
            placeholder="Título"
            onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, data: { ...section.data, title: e.target.value } }))}
          />
          <ImageUploadField
            value={typeof section.data.background_image === "string" ? section.data.background_image : ""}
            placeholder="URL/ruta imagen fondo"
            disabled={editingLocked}
            removeDisabled={editingLocked || !(typeof section.data.background_image === "string" && section.data.background_image.trim())}
            uploading={uploadingContentAssetKey === "contact_banner:section:background_image"}
            uploadingText="Subiendo imagen..."
            fallbackText="Sin imagen (usa fallback del layout)"
            guidanceText="Formatos: png, jpg, webp, svg. Máximo 5MB."
            previewAlt="contact banner preview"
            previewWidth={320}
            previewHeight={90}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            allowedMimeTypes={CONTENT_IMAGE_MIME_TYPES}
            maxSizeBytes={CONTENT_IMAGE_MAX_BYTES}
            onValueChange={(nextValue) =>
              updateSettings((prev) =>
                upsertSection(prev, { ...section, data: { ...section.data, background_image: nextValue } }),
              )
            }
            onReplace={(file) => {
              void uploadContentAsset({
                sectionId: "contact_banner",
                field: "background_image",
                file,
              });
            }}
            onRemove={() =>
              updateSettings(
                (prev) => upsertSection(prev, { ...section, data: { ...section.data, background_image: "" } }),
                { persistNow: true, note: "Autosave: contact background image removed" },
              )
            }
          />
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.submit_text === "string" ? section.data.submit_text : ""}
            placeholder="Texto botón enviar"
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
            {getSectionDisplayName(section.id)} habilitada
          </div>
          <input
            className="wf-input"
            disabled={editingLocked}
            value={typeof section.data.kicker === "string" ? section.data.kicker : ""}
            placeholder="Etiqueta sección"
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
            placeholder="Título sección"
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
                    placeholder="Nombre"
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
                    placeholder="Ubicación"
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
                    placeholder="Comentario"
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
                  <ImageUploadField
                    value={typeof item.avatar === "string" ? item.avatar : ""}
                    placeholder="URL/ruta avatar"
                    disabled={editingLocked}
                    removeDisabled={editingLocked || !(typeof item.avatar === "string" && item.avatar.trim())}
                    uploading={uploadingContentAssetKey === `testimonials:${itemId}:avatar`}
                    uploadingText="Subiendo avatar..."
                    fallbackText="Sin avatar (usa fallback del card)"
                    guidanceText="Formatos: png, jpg, webp, svg. Máximo 5MB."
                    previewAlt="testimonial preview"
                    previewWidth={48}
                    previewHeight={48}
                    previewStyle={{ width: 48, height: 48, borderRadius: "999px", objectFit: "cover" }}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    allowedMimeTypes={CONTENT_IMAGE_MIME_TYPES}
                    maxSizeBytes={CONTENT_IMAGE_MAX_BYTES}
                    onValueChange={(nextValue) =>
                      updateSettings((prev) => {
                        const sec = getSection(prev, section.id);
                        if (!sec) return prev;
                        const nextItems = toSectionItems(sec).map((nextItem) =>
                          String(nextItem.id) === itemId ? { ...nextItem, avatar: nextValue } : nextItem,
                        );
                        return setSectionItems(prev, section.id, nextItems);
                      })
                    }
                    onReplace={(file) => {
                      void uploadContentAsset({
                        sectionId: "testimonials",
                        field: "avatar",
                        itemId,
                        file,
                      });
                    }}
                    onRemove={() =>
                      updateSettings(
                        (prev) => {
                          const sec = getSection(prev, section.id);
                          if (!sec) return prev;
                          const nextItems = toSectionItems(sec).map((nextItem) =>
                            String(nextItem.id) === itemId ? { ...nextItem, avatar: "" } : nextItem,
                          );
                          return setSectionItems(prev, section.id, nextItems);
                        },
                        { persistNow: true, note: "Autosave: testimonial avatar removed" },
                      )
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
                  habilitada
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
          {getSectionDisplayName(section.id)} habilitada
        </div>
        {section.id === "services" ? (
          <>
            <input
              className="wf-input"
              disabled={editingLocked}
              value={typeof section.data.title === "string" ? section.data.title : ""}
              placeholder="Título servicios"
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
              placeholder="Subtítulo servicios"
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
            placeholder="Título FAQ"
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
                        cta: {
                          text: "Conocer más",
                          url: "#contacto",
                          kind: "anchor",
                          sectionTarget: "",
                          enabled: true,
                        },
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
                    <input
                      className="wf-input"
                      disabled={editingLocked}
                      value={
                        typeof (item.cta as { sectionTarget?: unknown } | undefined)?.sectionTarget === "string"
                          ? ((item.cta as { sectionTarget?: string }).sectionTarget ?? "")
                          : typeof item.targetSection === "string"
                            ? item.targetSection
                            : ""
                      }
                      placeholder="Target interno (home|servicios|empresa|clientes|contacto)"
                      onChange={(e) =>
                        updateSettings((prev) => {
                          const sec = getSection(prev, section.id);
                          if (!sec) return prev;
                          const nextItems = toSectionItems(sec).map((nextItem) =>
                            String(nextItem.id) === itemId
                              ? {
                                  ...nextItem,
                                  targetSection: e.target.value,
                                  sectionTarget: e.target.value,
                                  cta: {
                                    ...((nextItem.cta as Record<string, unknown>) ?? {}),
                                    sectionTarget: e.target.value,
                                    targetSection: e.target.value,
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
                      CTA habilitada
                    </label>
                  </div>
                  <p className="wf-muted">
                    Para Gasfiter usa ids claros y descriptivos para cada servicio.
                  </p>
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
                habilitada
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
    const colorFields: Array<{
      key: "primary" | "secondary" | "background" | "text";
      label: string;
      help: string;
    }> = [
      { key: "primary", label: "Primario", help: "Botones y acciones principales." },
      { key: "secondary", label: "Secundario", help: "Superficies de apoyo y bloques alternos." },
      { key: "background", label: "Fondo", help: "Base general de la interfaz." },
      { key: "text", label: "Acento", help: "Textos destacados y contrastes visuales." },
    ];
    const suggestedPalette = {
      primary: "#0C4A6E",
      secondary: "#2B6CB0",
      background: "#EBF8FF",
      text: "#1C3F72",
    } as const;
    const supportedFontFamilies = ["Inter", "Poppins", "Roboto", "Montserrat", "Barlow Condensed"];
    const currentTypographyLabel =
      inferTypographyLabel(typography.fontFamily) ||
      inferTypographyLabel(typography.font) ||
      "Inter";
    const showBasicContactSection = true;

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
      <div className="wf-style-stack">
        <h3 className="wf-h3" style={{ marginBottom: 0 }}>Apariencia del sitio</h3>
        <div className="wf-style-layout">
        <section className="wf-style-card">
          <div className="wf-style-head">
            <h3 className="wf-style-title">Colores de marca</h3>
            <p className="wf-style-help">Define la paleta base de la landing. Usa formato hexadecimal `#RRGGBB`.</p>
            <div className="wf-row">
              <button
                className="wf-btn wf-btn-soft wf-btn-sm wf-btn-compact"
                disabled={editingLocked}
                onClick={() =>
                  updateSettings((prev) => ({
                    ...prev,
                    colors: {
                      ...(prev.colors ?? {}),
                      ...suggestedPalette,
                    },
                  }))
                }
              >
                Aplicar paleta sugerida Gasfiter
              </button>
            </div>
          </div>
          <div className="wf-style-body">
          <div className="wf-color-grid">
            {colorFields.map((field) => (
              <div key={field.key} className="wf-color-field">
                <span className="wf-style-label">{field.label}</span>
                <div className="wf-row">
                  <input
                    type="color"
                    className="wf-input"
                    disabled={editingLocked}
                    value={isHexColor(colors[field.key] ?? "") ? (colors[field.key] as string) : "#000000"}
                    onChange={(e) => updateColor(field.key, e.target.value)}
                    style={{ minWidth: 60, maxWidth: 72, padding: 4 }}
                  />
                  <input
                    className="wf-input"
                    disabled={editingLocked}
                    placeholder={`${field.label} (#RRGGBB)`}
                    value={colors[field.key] ?? ""}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        colors: { ...(prev.colors ?? {}), [field.key]: e.target.value },
                      }))
                    }
                    onBlur={(e) => {
                      if (!e.target.value.trim()) return;
                      updateColor(field.key, e.target.value);
                    }}
                  />
                </div>
                <p className="wf-style-help">{field.help}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="wf-style-card">
          <div className="wf-style-head">
            <h3 className="wf-style-title">Tipografía</h3>
            <p className="wf-style-help">Configura la fuente principal y parámetros base de lectura.</p>
          </div>
          <div className="wf-style-body">
          <div className="wf-grid2">
            <label className="wf-style-field">
              <span className="wf-style-label">Familia tipográfica</span>
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
                <option value="">{`Tipografía actual: ${currentTypographyLabel}`}</option>
                {supportedFontFamilies.includes(currentTypographyLabel) ? null : (
                  <option value={currentTypographyLabel}>{currentTypographyLabel}</option>
                )}
                {supportedFontFamilies.map((fontOption) => (
                  <option key={fontOption} value={fontOption}>
                    {fontOption}
                  </option>
                ))}
              </select>
            </label>

            <label className="wf-style-field">
              <span className="wf-style-label">Fuente override (opcional)</span>
              <input
                className="wf-input"
                disabled={editingLocked}
                placeholder="URL de fuente u override"
                value={typography.font ?? ""}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    typography: { ...(prev.typography ?? {}), font: e.target.value },
                  }))
                }
              />
            </label>

            <label className="wf-style-field">
              <span className="wf-style-label">Tamaño base</span>
              <input
                className="wf-input"
                disabled={editingLocked}
                placeholder="Ej: 16px"
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
            </label>

            <label className="wf-style-field">
              <span className="wf-style-label">Interlineado</span>
              <input
                className="wf-input"
                disabled={editingLocked}
                placeholder="Ej: 1.5"
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
            </label>
          </div>
          </div>
        </section>

        <section className="wf-style-card">
          <div className="wf-style-head">
            <h3 className="wf-style-title">Logos</h3>
            <p className="wf-style-help">Sube o pega URL pública de logo para navbar y footer. Formatos png, jpg, webp o svg (máx 2MB).</p>
          </div>
          <div className="wf-style-body">
          <div className="wf-grid2">
            <ImageUploadField
              value={branding.logoNavUrl ?? branding.logoUrl ?? ""}
              placeholder="Logo navbar URL"
              disabled={editingLocked || uploadingAsset === "logoNav"}
              removeDisabled={editingLocked || !(branding.logoNavUrl ?? branding.logoUrl ?? "").trim()}
              uploading={uploadingAsset === "logoNav"}
              uploadingText="Subiendo logo..."
              fallbackText="Sin logo navbar"
              guidanceText="Logo navbar recomendado: 320x80px. Formatos png, jpg, webp, svg. Máximo 2MB."
              previewAlt="logo navbar preview"
              previewWidth={240}
              previewHeight={42}
              previewStyle={{ maxHeight: 42, width: "auto", objectFit: "contain" }}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              allowedMimeTypes={LOGO_MIME_TYPES}
              maxSizeBytes={LOGO_MAX_BYTES}
              hideUrlInput
              controlsInline
              onValueChange={(nextValue) =>
                updateSettings((prev) => ({
                  ...prev,
                  branding: { ...(prev.branding ?? {}), logoNavUrl: nextValue },
                }))
              }
              onReplace={(file) => {
                void uploadBrandingAsset("logo", file, "logoNavUrl");
              }}
              onRemove={() =>
                updateSettings(
                  (prev) => {
                    const branding = { ...(prev.branding ?? {}) };
                    delete branding.logoNavUrl;
                    delete branding.logoUrl;
                    return { ...prev, branding };
                  },
                  { persistNow: true, note: "Autosave: logo navbar removed" },
                )
              }
            />

            <ImageUploadField
              value={branding.logoFooterUrl ?? ""}
              placeholder="Logo footer URL (opcional)"
              disabled={editingLocked || uploadingAsset === "logoFooter"}
              removeDisabled={editingLocked || !(branding.logoFooterUrl ?? "").trim()}
              uploading={uploadingAsset === "logoFooter"}
              uploadingText="Subiendo logo..."
              fallbackText="Sin logo footer (usa logo navbar por fallback)"
              guidanceText="Logo footer recomendado: 260x72px. Formatos png, jpg, webp, svg. Máximo 2MB."
              previewAlt="logo footer preview"
              previewWidth={220}
              previewHeight={34}
              previewStyle={{ maxHeight: 34, width: "auto", objectFit: "contain" }}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              allowedMimeTypes={LOGO_MIME_TYPES}
              maxSizeBytes={LOGO_MAX_BYTES}
              hideUrlInput
              controlsInline
              onValueChange={(nextValue) =>
                updateSettings((prev) => ({
                  ...prev,
                  branding: { ...(prev.branding ?? {}), logoFooterUrl: nextValue },
                }))
              }
              onReplace={(file) => {
                void uploadBrandingAsset("logo", file, "logoFooterUrl");
              }}
              onRemove={() =>
                updateSettings(
                  (prev) => {
                    const branding = { ...(prev.branding ?? {}) };
                    delete branding.logoFooterUrl;
                    return { ...prev, branding };
                  },
                  { persistNow: true, note: "Autosave: logo footer removed" },
                )
              }
            />
          </div>
          <label className="wf-checkbox">
            <input
              type="checkbox"
              checked={Boolean(branding.hideNavLogo)}
              disabled={editingLocked}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  branding: {
                    ...(prev.branding ?? {}),
                    hideNavLogo: e.target.checked,
                  },
                }))
              }
            />
            <span>Ocultar logo en navbar (solo landing)</span>
          </label>
          </div>
        </section>

        <section className="wf-style-card">
          <div className="wf-style-head">
            <h3 className="wf-style-title">Favicon</h3>
            <p className="wf-style-help">Sube o pega URL pública del favicon. Recomendado 48x48px (mín. 32x32), formato png/ico (máx 1MB).</p>
          </div>
          <div className="wf-style-body">
          <ImageUploadField
            value={branding.faviconUrl ?? ""}
            placeholder="Favicon URL"
            disabled={editingLocked || uploadingAsset === "favicon"}
            removeDisabled={editingLocked || !(branding.faviconUrl ?? "").trim()}
            uploading={uploadingAsset === "favicon"}
            uploadingText="Subiendo favicon..."
            fallbackText="Sin favicon"
            guidanceText="Favicon recomendado: 48x48px (mín 32x32). Formato png/ico. Máximo 1MB."
            previewAlt="favicon preview"
            previewWidth={24}
            previewHeight={24}
            previewStyle={{ width: 24, height: 24, objectFit: "contain" }}
            accept="image/png,image/x-icon,image/vnd.microsoft.icon"
            allowedMimeTypes={FAVICON_MIME_TYPES}
            allowedExtensions={FAVICON_EXTENSIONS}
            maxSizeBytes={FAVICON_MAX_BYTES}
            hideUrlInput
            controlsInline
            onValueChange={(nextValue) =>
              updateSettings((prev) => ({
                ...prev,
                branding: { ...(prev.branding ?? {}), faviconUrl: nextValue },
              }))
            }
            onReplace={(file) => {
              void uploadBrandingAsset("favicon", file);
            }}
            onRemove={() =>
              updateSettings(
                (prev) => {
                  const branding = { ...(prev.branding ?? {}) };
                  delete branding.faviconUrl;
                  return { ...prev, branding };
                },
                { persistNow: true, note: "Autosave: favicon removed" },
              )
            }
          />

          {showBasicContactSection ? (
            <div className="wf-style-subsection">
              <h4 className="wf-style-title">Contacto básico (opcional)</h4>
              <div className="wf-grid2">
                <label className="wf-style-field">
                  <span className="wf-style-label">WhatsApp (opcional)</span>
                  <input
                    className="wf-input"
                    disabled={editingLocked}
                    placeholder="https://wa.me/..."
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
                </label>
                <label className="wf-style-field">
                  <span className="wf-style-label">Email (opcional)</span>
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
                </label>
                <label className="wf-style-field">
                  <span className="wf-style-label">Dirección (opcional)</span>
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
                </label>
              </div>
            </div>
          ) : null}
          </div>
        </section>
        </div>
      </div>
    );
  };

  const workflowProgress = useMemo(() => {
      const hasIdentity = Boolean(siteSlug.trim() && userId.trim());
    const currentStep = !hasIdentity ? 1 : !panelReady ? 2 : 3;
    const editState: "neutral" | "ready" | "warn" | "error" = draftConflict.active
      ? "error"
      : autosaving || flushingPublish || dirty
        ? "warn"
        : panelReady
          ? "ready"
          : "neutral";
    const steps = [
      {
        id: 1,
        title: "Identidad",
        detail: showAdvancedUi
          ? "Slug y sesión de usuario con membresía."
          : "Sitio activo listo para edición.",
        state: "neutral" as const,
      },
      {
        id: 2,
        title: "Cargar panel",
        detail: "Trae configuración + versiones + permisos.",
        state: "neutral" as const,
      },
      {
        id: 3,
        title: "Editar/Publicar",
        detail: "Completa contenido, guarda borrador y publica cuando esté listo.",
        state: editState,
      },
    ].map((step) => ({
      ...step,
      active: step.id === currentStep,
      completed: step.id < currentStep,
    }));
    return { currentStep, steps };
  }, [panelReady, siteSlug, userId, autosaving, flushingPublish, dirty, draftConflict.active, showAdvancedUi]);

  const workflowCompletionPercent = useMemo(
    () => Math.round((workflowProgress.currentStep / workflowProgress.steps.length) * 100),
    [workflowProgress.currentStep, workflowProgress.steps.length],
  );

  const testimonialsApplicable = true;

  const editorialStatus = useMemo(() => {
    if (!panelReady) {
      return {
        title: "Panel no cargado",
        detail: "Carga la configuración del sitio para habilitar edición y acciones.",
        tone: "warn" as const,
        action: "load_panel" as const,
      };
    }
    if (draftConflict.active) {
      return {
        title: "Conflicto de borrador detectado",
        detail: "Recarga borrador para sincronizar antes de continuar.",
        tone: "warn" as const,
        action: "reload_draft" as const,
      };
    }
    if (autosaving || flushingPublish) {
      return {
        title: flushingPublish ? "Preparando publicación" : "Guardando cambios",
        detail: flushingPublish
          ? "Esperando el guardado automático previo a publicar."
          : "Se están guardando cambios en segundo plano.",
        tone: "warn" as const,
        action: "none" as const,
      };
    }
    if (dirty) {
      return {
        title: "Borrador con cambios pendientes",
        detail: "Guarda borrador o continúa editando antes de publicar.",
        tone: "warn" as const,
        action: "none" as const,
      };
    }
    if (mode === "published") {
      return {
        title: latestPublishedVersion
          ? `Publicado activo (v${latestPublishedVersion.version_number})`
          : "Publicado activo",
        detail: "Vista en modo lectura de la versión publicada.",
        tone: "ok" as const,
        action: "none" as const,
      };
    }
    return {
      title: latestDraftVersion ? `Borrador activo (v${latestDraftVersion.version_number})` : "Borrador activo",
      detail: "Contenido listo para continuar edición o solicitar publicación.",
      tone: "ok" as const,
      action: "none" as const,
    };
  }, [
    panelReady,
    draftConflict.active,
    autosaving,
    flushingPublish,
    dirty,
    mode,
    latestPublishedVersion,
    latestDraftVersion,
  ]);

  const actionContext = useMemo(() => {
    const inDraft = mode === "draft";
    const inPublished = mode === "published";
    const canEditDraftNow = inDraft && canSaveDraft;
    const canPublishNow = inDraft && canPublish;
    const blockedByState = busy || autosaving || flushingPublish || draftConflict.active || !panelReady;

    const message = !panelReady
      ? "Carga el panel para habilitar acciones."
      : inPublished
        ? "Modo lectura publicado. Usa 'Editar borrador' para modificar."
        : !canSaveDraft && !canPublish
          ? "Tu cuenta no puede editar este sitio."
          : autosaving || flushingPublish
            ? "Esperando guardado automático antes de continuar."
            : "Listo para editar y publicar.";

    const saveDisabledReason = !panelReady
      ? "Primero carga el panel."
      : draftConflict.active
        ? "Conflicto detectado: recarga borrador."
        : autosaving || flushingPublish
          ? "Esperando guardado automático."
          : busy
            ? "Hay una operación en curso."
            : !canEditDraftNow
              ? "El rol o modo actual no permite guardar borrador."
              : "";

    const publishDisabledReason = !panelReady
      ? "Primero carga el panel."
      : draftConflict.active
        ? "Conflicto detectado: recarga borrador."
        : autosaving || flushingPublish
          ? "Esperando guardado automático."
          : busy
            ? "Hay una operación en curso."
            : !canPublishNow
              ? "El rol o modo actual no permite publicar."
              : "";

    return {
      showSave: canEditDraftNow,
      showPublish: canPublishNow,
      showEditDraft: inPublished && canSaveDraft,
      saveDisabled: blockedByState || !canEditDraftNow,
      publishDisabled: blockedByState || !canPublishNow,
      editDraftDisabled: busy || !panelReady || !canSaveDraft,
      saveDisabledReason,
      publishDisabledReason,
      message,
    };
  }, [
    mode,
    canSaveDraft,
    canPublish,
    busy,
    autosaving,
    flushingPublish,
    draftConflict.active,
    panelReady,
  ]);

  const publishFixActions = useMemo(() => {
    const mapped = publishValidationMissing
      .map((item) => mapPublishIssueToSection(item))
      .filter((item): item is { section: EditableSectionId; view: SidebarView; label: string } => item !== null);
    const dedup = new Map<string, { section: EditableSectionId; view: SidebarView; label: string }>();
    for (const item of mapped) dedup.set(item.section, item);
    return Array.from(dedup.values());
  }, [publishValidationMissing]);

  useEffect(() => {
    if (!showAdvancedUi && (view === "versions" || view === "members")) {
      setView("sections");
    }
  }, [showAdvancedUi, view]);

  const publishChecklist = useMemo<PublishChecklistItem[]>(() => {
    if (!settings) return [];

    const hero = getSection(settings, "hero");
    const services = getSection(settings, "services");
    const testimonials = getSection(settings, "testimonials");
    const contact = getSection(settings, "contact_banner");

    const heroTitle = asNonEmptyString(hero?.data?.title);
    const heroCtaText = asNonEmptyString(
      (hero?.data as { cta_primary?: { text?: unknown } } | undefined)?.cta_primary?.text,
    );
    const heroCtaUrl = asNonEmptyString(
      (hero?.data as { cta_primary?: { url?: unknown } } | undefined)?.cta_primary?.url,
    );
    const heroOk = Boolean(hero?.enabled && heroTitle && heroCtaText && heroCtaUrl);

    const serviceItems = services ? toSectionItems(services) : [];
    const serviceOk = Boolean(
      services?.enabled &&
        serviceItems.some((item) => item.enabled !== false && asNonEmptyString(item.title)),
    );

    const testimonialItems = testimonials ? toSectionItems(testimonials) : [];
    const testimonialOk = testimonialsApplicable
      ? Boolean(
          testimonials?.enabled &&
            testimonialItems.some(
              (item) =>
                item.enabled !== false && asNonEmptyString(item.name) && asNonEmptyString(item.quote),
            ),
        )
      : true;

    const contactTitle = asNonEmptyString(contact?.data?.title);
    const contactOk = Boolean(contact?.enabled && contactTitle);

    const baseItems: PublishChecklistItem[] = [
      {
        key: "hero_cta",
        label: "Hero con CTA activo",
        description: heroOk ? "Completo" : "Falta título o CTA (texto/url)",
        completed: heroOk,
        section: "hero",
        view: "sections",
      },
      {
        key: "services",
        label: "Al menos un servicio",
        description: serviceOk ? "Completo" : "Activa y completa un servicio",
        completed: serviceOk,
        section: "services",
        view: "items",
      },
      {
        key: "contact",
        label: "Sección de contacto",
        description: contactOk ? "Completo" : "Activa contacto y completa título",
        completed: contactOk,
        section: "contact_banner",
        view: "sections",
      },
    ];

    if (testimonialsApplicable) {
      baseItems.splice(2, 0, {
        key: "testimonials",
        label: "Al menos un testimonio",
        description: testimonialOk ? "Completo" : "Activa y completa un testimonio",
        completed: testimonialOk,
        section: "testimonials",
        view: "items",
      });
    }

    return baseItems;
  }, [settings, testimonialsApplicable]);

  const checklistCompleted = useMemo(
    () => publishChecklist.filter((item) => item.completed).length,
    [publishChecklist],
  );

  const contentReadyForNextAction = useMemo(
    () =>
      panelReady &&
      publishChecklist.length > 0 &&
      checklistCompleted === publishChecklist.length &&
      publishValidationMissing.length === 0,
    [panelReady, publishChecklist.length, checklistCompleted, publishValidationMissing.length],
  );

  const actionAvailableLabel = useMemo(() => {
    if (!contentReadyForNextAction) return "Acción disponible: Completar pendientes";
    if (membership?.role === "owner" || membership?.role === "admin" || membership?.role === "editor") {
      return "Acción disponible: Publicar";
    }
    return "Acción disponible: Revisar estado";
  }, [contentReadyForNextAction, membership?.role]);

  const publishWarnings = useMemo<PublishWarningItem[]>(() => {
    if (!settings) return [];

    const warnings: PublishWarningItem[] = [];
    const addWarning = (warning: PublishWarningItem) => {
      if (warnings.some((item) => item.key === warning.key)) return;
      warnings.push(warning);
    };

    const hero = getSection(settings, "hero");
    const audience = getSection(settings, "audience");
    const services = getSection(settings, "services");
    const projects = getSection(settings, "projects");
    const faq = getSection(settings, "faq");
    const testimonials = getSection(settings, "testimonials");
    const urgency = getSection(settings, "urgency_banner");
    const branding = settings.branding ?? {};

    const titleChecks: Array<{ key: string; title: unknown; section: EditableSectionId; label: string }> = [
      { key: "hero", title: hero?.data?.title, section: "hero", label: "Hero" },
      { key: "audience", title: audience?.data?.title, section: "audience", label: "Quiénes somos" },
      { key: "services", title: services?.data?.title, section: "services", label: "Servicios" },
      { key: "projects", title: projects?.data?.title, section: "projects", label: "Proyectos" },
      { key: "testimonials", title: testimonials?.data?.title, section: "testimonials", label: "Testimonios" },
      { key: "faq", title: faq?.data?.title, section: "faq", label: "FAQ" },
    ];

    for (const check of titleChecks) {
      const length = asNonEmptyString(check.title).length;
      if (length > 65) {
        addWarning({
          key: `title-length-${check.key}`,
          label: `Título largo en ${check.label}`,
          description: "Recomendado: máximo 65 caracteres.",
          section: check.section,
          view: "sections",
        });
      }
    }

    const ctaTextChecks: Array<{ key: string; text: unknown; section: EditableSectionId; label: string }> = [
      {
        key: "hero-primary",
        text: (hero?.data as { cta_primary?: { text?: unknown } } | undefined)?.cta_primary?.text,
        section: "hero",
        label: "CTA Hero",
      },
      {
        key: "audience-secondary",
        text: (audience?.data as { cta_secondary?: { text?: unknown } } | undefined)?.cta_secondary?.text,
        section: "audience",
        label: "CTA Quiénes somos",
      },
      {
        key: "urgency-primary",
        text: (urgency?.data as { cta_primary?: { text?: unknown } } | undefined)?.cta_primary?.text,
        section: "urgency_banner",
        label: "CTA Cobertura y confianza",
      },
    ];

    for (const check of ctaTextChecks) {
      const length = asNonEmptyString(check.text).length;
      if (length > 22) {
        addWarning({
          key: `cta-text-${check.key}`,
          label: `Botón largo en ${check.label}`,
          description: "Recomendado: máximo 22 caracteres.",
          section: check.section,
          view: "sections",
        });
      }
    }

    const faqItems = faq ? toSectionItems(faq) : [];
    if (
      faqItems.some(
        (item) => item.enabled !== false && asNonEmptyString(item.answer).length > 450,
      )
    ) {
      addWarning({
        key: "faq-long-answer",
        label: "FAQ con respuesta extensa",
        description: "Recomendado: máximo 450 caracteres por respuesta.",
        section: "faq",
        view: "items",
      });
    }

    const serviceItems = services ? toSectionItems(services) : [];
    const projectItems = projects ? toSectionItems(projects) : [];
    if (
      projectItems.some((item) => item.enabled !== false && !asNonEmptyString(item.image))
    ) {
      addWarning({
        key: "projects-missing-image",
        label: "Proyectos sin imagen",
        description: "Se usará fallback visual; recomendado cargar imagen por item.",
        section: "projects",
        view: "items",
      });
    }

    const testimonialItems = testimonials ? toSectionItems(testimonials) : [];
    const testimonialItemsWithContent = testimonialItems.filter(
      (item) =>
        item.enabled !== false &&
        (asNonEmptyString(item.name).length > 0 || asNonEmptyString(item.quote).length > 0),
    );
    if (
      testimonialsApplicable &&
      testimonials?.enabled !== false &&
      testimonialItemsWithContent.length > 0 &&
      testimonialItemsWithContent.some((item) => !asNonEmptyString(item.avatar))
    ) {
      addWarning({
        key: "testimonials-missing-avatar",
        label: "Testimonios sin avatar",
        description: "No bloquea publicación, pero mejora confianza visual.",
        section: "testimonials",
        view: "items",
      });
    }

    const hasFavicon = asNonEmptyString(branding.faviconUrl).length > 0;
    if (!hasFavicon) {
      addWarning({
        key: "branding-favicon",
        label: "Branding sin favicon",
        description: "Recomendado definir favicon para consistencia de marca.",
        section: "hero",
        view: "style",
      });
    }

    const internalCtaChecks: Array<{ key: string; url: unknown; section: EditableSectionId; label: string }> = [
      {
        key: "hero-primary-url",
        url: (hero?.data as { cta_primary?: { url?: unknown } } | undefined)?.cta_primary?.url,
        section: "hero",
        label: "CTA Hero",
      },
      {
        key: "audience-secondary-url",
        url: (audience?.data as { cta_secondary?: { url?: unknown } } | undefined)?.cta_secondary?.url,
        section: "audience",
        label: "CTA Quiénes somos",
      },
    ];

    for (const check of internalCtaChecks) {
      const raw = asNonEmptyString(check.url);
      if (!raw) continue;
      const isExternal = isValidExternalUrl(raw);
      const normalizedInternal = normalizeInternalTarget(raw);
      if (!isExternal && !normalizedInternal && !raw.startsWith("#")) {
        addWarning({
          key: `internal-cta-${check.key}`,
          label: `${check.label} con destino no reconocido`,
          description: "Usa /servicios, /empresa, /clientes, /contacto o URL externa válida.",
          section: check.section,
          view: "sections",
        });
      }
    }

    const allowedServiceTargets = new Set(["home", "servicios", "empresa", "clientes", "contacto"]);
    for (const item of serviceItems) {
      if (item.enabled === false) continue;
      const cta = (item.cta ?? {}) as Record<string, unknown>;
      const kind = asNonEmptyString(cta.kind).toLowerCase();
      const targetRaw = asNonEmptyString(
        cta.sectionTarget || cta.targetSection || item.targetSection || item.sectionTarget,
      );
      if (kind === "anchor" && targetRaw && !allowedServiceTargets.has(targetRaw)) {
        addWarning({
          key: `service-target-${String(item.id)}`,
          label: `Servicio con target interno no recomendado (${asNonEmptyString(item.title) || "sin título"})`,
          description: "Usa: home, servicios, empresa, clientes o contacto.",
          section: "services",
          view: "items",
        });
      }
    }

    return warnings;
  }, [settings, testimonialsApplicable]);

  const actionHelpText = useMemo(() => {
    if (actionContext.publishDisabledReason) return actionContext.publishDisabledReason;
    if (actionContext.saveDisabledReason) return actionContext.saveDisabledReason;
    return actionContext.message;
  }, [
    actionContext.message,
    actionContext.publishDisabledReason,
    actionContext.saveDisabledReason,
  ]);

  const actionHelpIsError = Boolean(draftConflict.active);
  const sidebarGroups = (
    showAdvancedUi
      ? [
          {
            title: "Contenido",
            items: [
              ["sections", "Inicio y secciones"],
              ["items", "Servicios y social"],
            ],
          },
          {
            title: "Configuración",
            items: [
              ["style", "Estilo y branding"],
              ["versions", "Versiones"],
              ["members", "Miembros"],
            ],
          },
        ]
      : [
          {
            title: "Contenido",
            items: [
              ["sections", "Inicio y secciones"],
              ["items", "Servicios y social"],
            ],
          },
          {
            title: "Configuración",
            items: [["style", "Estilo y branding"]],
          },
        ]
  ) as Array<{ title: string; items: Array<[SidebarView, string]> }>;

  return (
    <main className="wf-shell">
      <style dangerouslySetInnerHTML={{ __html: panelStyles }} />

      <header className="wf-head">
        <div>
          <h1 className="wf-title">Gasfiter Admin - Panel</h1>
          <p className="wf-sub">Gestiona borradores, versiones, permisos y publicación del sitio.</p>
        </div>
        <div className="wf-badges">
          {membership?.role ? (
            <span className="wf-badge wf-badge-role wf-badge-role-main">Rol: {getRoleDisplayLabel(membership.role)}</span>
          ) : null}
        </div>
      </header>

      <div className="wf-layout">
        <aside className="wf-card wf-sidebar">
          {sidebarGroups.map((group) => (
            <div key={group.title} className="wf-nav-group">
              <span className="wf-nav-group-title">{group.title}</span>
              {group.items.map(([key, label]) => (
                <button
                  key={key}
                  className={`wf-nav-btn ${view === key ? "active" : ""}`}
                  onClick={() => setView(key)}
                  aria-label={`Ir a ${label}`}
                  aria-pressed={view === key}
                >
                  <span>{label}</span>
                  <span className="wf-muted">›</span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className="wf-card wf-workspace">
          <div className="wf-flowbar">
            <div className="wf-flowbar-head">
              <span className="wf-flowbar-title">Flujo: Completar → Publicar</span>
              <span className="wf-muted">
                Paso {workflowProgress.currentStep} de {workflowProgress.steps.length}
              </span>
            </div>
            <div className="wf-flowbar-track" aria-hidden="true">
              <div className="wf-flowbar-fill" style={{ width: `${workflowCompletionPercent}%` }} />
            </div>
          </div>

	          <div className="wf-row wf-toolbar wf-toolbar-main" style={{ marginBottom: 10 }}>
	            <input className="wf-input" value={siteSlug} onChange={(e) => setSiteSlug(e.target.value)} placeholder="slug del sitio" />
	            <input
	              className="wf-input"
	              value={authUserEmail ? `Sesión: ${authUserEmail}` : userId}
	              onChange={(e) => setUserId(e.target.value)}
	              placeholder={authEnabled ? "userId del CMS o sesión Supabase" : "userId del CMS"}
	              disabled={Boolean(authUserEmail) || busy}
	            />
	          </div>

          <div className="wf-row wf-toolbar wf-toolbar-actions" style={{ marginBottom: 12 }}>
            {authEnabled ? (
              authUserEmail ? (
                <>
                  <input className="wf-input" value={`Sesión: ${authUserEmail}`} disabled />
                  <button className="wf-btn wf-btn-soft" onClick={closeSession} disabled={busy}>
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <input
                    className="wf-input"
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="tu-correo@empresa.cl"
                    disabled={!authBootstrapped || busy}
                  />
                  <button
                    className="wf-btn wf-btn-primary"
                    onClick={sendMagicLink}
                    disabled={!authBootstrapped || busy || sendingMagicLink}
                  >
                    {sendingMagicLink ? "Enviando..." : "Enviar magic link"}
                  </button>
                </>
              )
            ) : (
              <span className="wf-muted">Auth por magic link no configurado en este entorno.</span>
            )}
          </div>

          <div className="wf-row wf-toolbar wf-toolbar-actions" style={{ marginBottom: 12 }}>
            <select className="wf-select" value={mode} onChange={(e) => handleModeChange(e.target.value as Mode)}>
              <option value="draft">Borrador (editable)</option>
              <option value="published">Publicado (solo referencia)</option>
            </select>
            <button className="wf-btn wf-btn-soft" onClick={loadPanel} disabled={busy}>
              Cargar panel
            </button>
          </div>
          <p className="wf-muted" style={{ marginTop: -6, marginBottom: 12 }}>
            Usa <strong>Borrador</strong> para editar. Usa <strong>Publicado</strong> solo para revisar la versión en vivo.
          </p>

          <div className="wf-editorial-status">
            <div className="wf-editorial-status-title">
              <strong>Estado del contenido: {editorialStatus.title}</strong>
              <span className="wf-pill wf-pill-neutral">
                Paso {workflowProgress.currentStep} de 3 · {workflowCompletionPercent}% completado
              </span>
            </div>
            <div className="wf-editorial-status-desc">{editorialStatus.detail}</div>
            <div className="wf-editorial-status-meta">
              <span className="wf-pill wf-pill-neutral">
                Permiso actual: {getRoleDisplayLabel(membership?.role)}
              </span>
              <span className="wf-pill wf-pill-primary">{actionAvailableLabel}</span>
              <span className="wf-pill wf-pill-neutral">
                {latestDraftVersion ? `Borrador v${latestDraftVersion.version_number}` : "Sin borrador activo"}
              </span>
              <span className="wf-pill wf-pill-neutral">
                {latestPublishedVersion ? `Publicado v${latestPublishedVersion.version_number}` : "Sin versión publicada"}
              </span>

              {autosaving || flushingPublish ? (
                <span className="wf-pill wf-pill-neutral">{flushingPublish ? "Preparando publicación..." : "Guardando..."}</span>
              ) : null}
              {editorialStatus.action === "load_panel" ? (
                <button className="wf-btn wf-btn-primary wf-btn-sm wf-btn-compact" onClick={loadPanel} disabled={busy}>
                  Cargar panel
                </button>
              ) : null}
              {editorialStatus.action === "reload_draft" ? (
                <button
                  className="wf-btn wf-btn-soft wf-btn-sm wf-btn-compact"
                  onClick={reloadDraftAfterConflict}
                  disabled={busy}
                >
                  Recargar borrador
                </button>
              ) : null}
            </div>
          </div>

          <div className="wf-steps">
            {workflowProgress.steps.map((step) => (
              <div
                key={step.id}
                className={`wf-step ${step.id === 2 ? "wf-step-subtle" : ""} ${step.active ? "active" : ""} ${step.completed ? "completed" : ""} ${
                  step.id === 3 && step.state === "ready"
                    ? "state-ready"
                    : step.id === 3 && step.state === "warn"
                      ? "state-warn"
                      : step.id === 3 && step.state === "error"
                        ? "state-error"
                        : ""
                }`}
              >
                <span className="wf-step-num">{step.completed ? "✓" : step.id}</span>
                <div>
                  <strong>{step.title}</strong>
                  <div className="wf-muted">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="wf-actions-row">
            <span id="panel-action-help" className="wf-sr-only">
              {actionContext.publishDisabledReason || actionContext.saveDisabledReason || "Acciones disponibles"}
            </span>
            {actionContext.showSave ? (
              <button
                className="wf-btn wf-btn-primary"
                onClick={saveDraft}
                disabled={actionContext.saveDisabled}
                title={actionContext.saveDisabled ? actionContext.saveDisabledReason : "Guardar cambios en borrador"}
                aria-describedby={actionContext.saveDisabled ? "panel-action-help" : undefined}
              >
                Guardar borrador
              </button>
            ) : null}
            {actionContext.showPublish ? (
              <button
                className="wf-btn wf-btn-primary"
                onClick={publish}
                disabled={actionContext.publishDisabled}
                title={actionContext.publishDisabled ? actionContext.publishDisabledReason : "Publicar versión actual"}
                aria-describedby={actionContext.publishDisabled ? "panel-action-help" : undefined}
              >
                {flushingPublish ? "Esperando guardado..." : "Publicar"}
              </button>
            ) : null}

            {showAdvancedUi ? (
              <button className="wf-btn wf-btn-soft" onClick={openPublishedJson} disabled={!panelReady}>
                Ver JSON de producción
              </button>
            ) : null}
            <button className="wf-btn wf-btn-soft" onClick={openPreview} disabled={busy || !panelReady}>
              {showAdvancedUi ? "Vista previa" : "Previsualizar"}
            </button>
            {showAdvancedUi ? (
              <button
                className="wf-btn wf-btn-soft"
                onClick={openDiff}
                disabled={busy || loadingDiff || !panelReady || !userId.trim()}
              >
                {loadingDiff ? "Comparando..." : "Ver diferencias"}
              </button>
            ) : null}
            {actionContext.showEditDraft && !publishedReadOnly ? (
              <button className="wf-btn wf-btn-soft" onClick={startDraftEditing} disabled={actionContext.editDraftDisabled}>
                Editar borrador
              </button>
            ) : null}
            <span className="wf-muted">{actionContext.message}</span>
          </div>
          <div className={`wf-action-help ${actionHelpIsError ? "err" : ""}`} aria-live="polite">
            {actionHelpText}
          </div>
          {publishChecklist.length > 0 ? (
            <div className="wf-checklist">
              <div className="wf-checklist-head">
                <strong>Checklist de publicación ({checklistCompleted}/{publishChecklist.length})</strong>
                <span className="wf-muted">
                  {checklistCompleted === publishChecklist.length
                    ? "Listo para publicar"
                    : "Completa mínimos antes de publicar"}
                </span>
              </div>
              <div className="wf-checklist-list">
                {publishChecklist.map((item) => (
                  <div key={item.key} className={`wf-checklist-item ${item.completed ? "ok" : "warn"}`}>
                    <div className="wf-checklist-left">
                      <strong>
                        <span className={`wf-check-icon ${item.completed ? "ok" : "warn"}`}>
                          {item.completed ? "✓" : "!"}
                        </span>{" "}
                        {item.label}
                      </strong>
                      <span>{item.description}</span>
                    </div>
                    {!item.completed && item.section && item.view ? (
                      <button
                        className="wf-btn wf-btn-soft wf-btn-sm wf-btn-compact"
                        onClick={() => {
                          setView(item.view);
                          setEditableSection(item.section);
                        }}
                      >
                        Ir a completar
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {publishWarnings.length > 0 ? (
            <div className="wf-warn-block">
              <div className="wf-warn-title">
                <strong>Advertencias UX (no bloquean publicación)</strong>
                <span className="wf-muted">{publishWarnings.length} detectadas</span>
              </div>
              <div className="wf-checklist-list">
                {publishWarnings.map((warning) => (
                  <div key={warning.key} className="wf-warn-item">
                    <div className="wf-checklist-left">
                      <strong>{warning.label}</strong>
                      <span>{warning.description}</span>
                    </div>
                    <button
                      className="wf-btn wf-btn-soft wf-btn-sm wf-btn-compact"
                      onClick={() => {
                        setView(warning.view);
                        setEditableSection(warning.section);
                      }}
                    >
                      Ir a revisar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {publishValidationMissing.length > 0 ? (
            <div className="wf-alert" style={{ marginBottom: 12 }}>
              <div className="wf-alert-title">Falta contenido mínimo para publicar</div>
              <ul className="wf-alert-list">
                {publishValidationMissing.map((item, index) => (
                  <li key={`${item.code || item.path || "issue"}-${index}`}>
                    {item.message || item.label || item.code || "Validación incompleta"}
                    {item.path ? ` (${item.path})` : ""}
                  </li>
                ))}
              </ul>
              {publishFixActions.length > 0 ? (
                <div className="wf-row" style={{ marginTop: 8 }}>
                  {publishFixActions.map((action) => (
                    <button
                      key={action.section}
                      className="wf-btn wf-btn-soft wf-btn-sm wf-btn-compact"
                      onClick={() => {
                        setView(action.view);
                        setEditableSection(action.section);
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {publishedReadOnly && panelReady ? (
            <div className="wf-readonly" style={{ marginBottom: 12 }}>
              <div>
                <strong>Modo publicado: solo lectura</strong>
                <small>Los cambios están bloqueados hasta activar un borrador editable.</small>
              </div>
              {canSaveDraft ? (
                <button className="wf-btn wf-btn-soft" onClick={startDraftEditing} disabled={actionContext.editDraftDisabled}>
                  Editar borrador
                </button>
              ) : null}
            </div>
          ) : null}

          {view === "sections" ? (
            <>
              <h2 className="wf-h3">Secciones</h2>
              <div className="wf-sections" style={{ marginBottom: 12 }}>
                {visibleSectionsForSectionsView.map((section) => (
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
                      <span>{getSectionDisplayName(section.id)}</span>
                      <span className="wf-muted">orden {section.order}</span>
                    </button>
                    <label className="wf-toggle">
                      <input disabled={editingLocked} type="checkbox" checked={section.enabled} onChange={(e) => updateSettings((prev) => upsertSection(prev, { ...section, enabled: e.target.checked }))} />
                      habilitada
                    </label>
                  </div>
                ))}
                {!visibleSectionsForSectionsView.length ? <p className="wf-muted">Carga el panel para editar secciones.</p> : null}
              </div>
              {renderSectionEditor()}
            </>
          ) : null}

          {view === "items" ? (
            <>
              <h2 className="wf-h3">Elementos</h2>
              <div className="wf-row" style={{ marginBottom: 10 }}>
                <button className="wf-btn wf-btn-soft" onClick={() => setEditableSection("services")}>Servicios</button>
                <button className="wf-btn wf-btn-soft" onClick={() => setEditableSection("projects")}>Clientes</button>
                {!hideFaqAndTestimonialsInItems ? (
                  <button className="wf-btn wf-btn-soft" onClick={() => setEditableSection("faq")}>FAQ</button>
                ) : null}
                {!hideFaqAndTestimonialsInItems ? (
                  <button className="wf-btn wf-btn-soft" onClick={() => setEditableSection("testimonials")}>Testimonios</button>
                ) : null}
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
                    <div><strong>v{version.version_number}</strong> · {translateVersionStatus(version.status)}<div className="wf-muted">{version.notes ?? "Sin observaciones"}</div></div>
                    <button className="wf-btn wf-btn-warn" disabled={busy || !panelReady || version.status === "published" || !canRollback} onClick={() => rollback(version.version_number)}>Revertir</button>
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
                    <div><strong>Usuario:</strong> {membership.userId}</div>
                    <div><strong>Rol:</strong> {getRoleUxLabel(membership.role)}</div>
                    <div><strong>Permisos:</strong> guardar_borrador={String(membership.permissions.canSaveDraft)} publicar={String(membership.permissions.canPublish)} rollback={String(membership.permissions.canRollback)}</div>
                  </div>
                ) : (
                  <p className="wf-muted">Carga panel para ver permisos.</p>
                )}
              </div>
            </>
          ) : null}
        </section>

      </div>

      <OverlayPanel open={showPreviewOverlay} onClose={() => setShowPreviewOverlay(false)} title="Vista previa">
        <div className="wf-preview-box">
          <div className="wf-kv">
            <div><strong>Título hero:</strong> {typeof heroSection?.data?.title === "string" ? heroSection.data.title : "-"}</div>
            <div><strong>Subtítulo hero:</strong> {typeof heroSection?.data?.subtitle === "string" ? heroSection.data.subtitle : "-"}</div>
            <div><strong>Secciones:</strong> {settings?.content?.sections?.length ?? 0}</div>
          </div>
        </div>

        {showAdvancedUi ? (
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
        ) : null}

        {showAdvancedUi ? (
          <div className="wf-preview-box">
            <strong>Actividad reciente</strong>
            <div className="wf-log" style={{ marginTop: 8 }}>
              {actionLog.map((entry) => (
                <div className="wf-log-item" key={entry.id}>
                  <div>
                    <strong>{translateActionLabel(entry.action)}</strong>
                    <div className="wf-muted">{entry.note}</div>
                  </div>
                  <div className="wf-muted" style={{ textAlign: "right" }}>
                    <div>{entry.version ? `v${entry.version}` : "-"}</div>
                    <div>{new Date(entry.at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              {!actionLog.length ? <p className="wf-muted">Sin eventos recientes.</p> : null}
            </div>
          </div>
        ) : null}
      </OverlayPanel>

      <OverlayPanel open={showDiffOverlay} onClose={() => setShowDiffOverlay(false)} title="Comparación borrador vs publicado">
        <div className="wf-preview-box">
          {heroDiff ? (
            <div className="wf-diff" style={{ marginTop: 8 }}>
              <div className="wf-muted">
                Borrador v{heroDiff.from.versionNumber} vs Publicado v{heroDiff.to.versionNumber} ·{" "}
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
              Usa &quot;Ver diferencias&quot; para comparar borrador y publicado.
            </p>
          )}
        </div>
      </OverlayPanel>


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
