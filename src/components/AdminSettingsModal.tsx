'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface SettingField {
  key: string;
  label: string;
  placeholder: string;
  icon: string;
  multiline?: boolean;
}

interface SettingsSection {
  title: string;
  icon: string;
  fields: SettingField[];
}

interface AdminSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

// ═══════════════════════════════════════════════════
// SETTINGS CONFIGURATION
// ═══════════════════════════════════════════════════

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Branding',
    icon: 'fas fa-palette',
    fields: [
      { key: 'siteName', label: 'Site Name', placeholder: 'X-Foundry', icon: 'fas fa-building' },
      { key: 'tagline', label: 'Tagline', placeholder: 'Your tagline here', icon: 'fas fa-quote-right' },
    ],
  },
  {
    title: 'Hero Section',
    icon: 'fas fa-image',
    fields: [
      { key: 'heroTitle', label: 'Hero Title', placeholder: 'Building The', icon: 'fas fa-heading' },
      { key: 'heroTitleHighlight', label: 'Hero Highlight', placeholder: 'Future', icon: 'fas fa-highlighter' },
      { key: 'heroSubtitle', label: 'Hero Subtitle', placeholder: 'The best way...', icon: 'fas fa-align-left', multiline: true },
    ],
  },
  {
    title: 'Contact Info',
    icon: 'fas fa-address-book',
    fields: [
      { key: 'contactEmail', label: 'Contact Email', placeholder: 'email@example.com', icon: 'fas fa-envelope' },
      { key: 'contactPhone', label: 'Contact Phone', placeholder: '+201000000000', icon: 'fas fa-phone' },
      { key: 'businessHours', label: 'Business Hours', placeholder: 'Sun - Thu: 9-6', icon: 'fas fa-clock' },
    ],
  },
  {
    title: 'Social Links',
    icon: 'fas fa-share-nodes',
    fields: [
      { key: 'linkedinUrl', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...', icon: 'fab fa-linkedin' },
      { key: 'githubUrl', label: 'GitHub URL', placeholder: 'https://github.com/...', icon: 'fab fa-github' },
      { key: 'discordUrl', label: 'Discord URL', placeholder: 'https://discord.gg/...', icon: 'fab fa-discord' },
    ],
  },
  {
    title: 'Footer',
    icon: 'fas fa-rectangle-list',
    fields: [
      { key: 'footerDescription', label: 'Footer Text', placeholder: 'Your footer desc', icon: 'fas fa-paragraph', multiline: true },
      { key: 'authorName', label: 'Author Name', placeholder: 'X-Foundry Team', icon: 'fas fa-user-pen' },
    ],
  },
];

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════

export function AdminSettingsModal({ open, onClose, onSettingsSaved }: AdminSettingsModalProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fetch current settings when modal opens
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setValues(data.settings || {});
      } else {
        const errData = await res.json().catch(() => ({}));
        toast({
          title: 'Failed to load settings',
          description: (errData as { error?: string }).error || 'Could not fetch site settings.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Could not reach the server.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open, fetchSettings]);

  // Update a single field
  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  // Save all settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast({
          title: 'Settings saved',
          description: 'Site settings have been updated successfully.',
        });
        onSettingsSaved?.();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast({
          title: 'Save failed',
          description: (errData as { error?: string }).error || 'Could not save settings.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Could not reach the server.',
        variant: 'destructive',
      });
    }
    setSaving(false);
  };

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  // ─── Shared styles ───────────────────────────────
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 10001,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? 0 : 20,
  };

  const modalStyle: React.CSSProperties = isMobile
    ? {
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        background: 'var(--dark-gray, #0f0f0f)',
        border: 'none',
        borderRadius: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }
    : {
        width: '100%',
        maxWidth: 560,
        maxHeight: '85vh',
        background: 'var(--card-bg, #111)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      };

  const headerStyle: React.CSSProperties = {
    padding: isMobile ? '16px 16px 12px' : '20px 24px 16px',
    borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  };

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: isMobile ? '16px' : '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  };

  const footerStyle: React.CSSProperties = {
    padding: isMobile ? '12px 16px' : '16px 24px',
    borderTop: '1px solid var(--border-color, rgba(255,255,255,0.1))',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    ...(isMobile ? { paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' } : {}),
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: isMobile ? 11 : 12,
    fontWeight: 700,
    color: 'var(--primary-red, #dc143c)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const fieldGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-light, #fff)',
    fontFamily: "'Space Grotesk', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const fieldIconStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 6,
    background: 'rgba(220, 20, 60, 0.08)',
    border: '1px solid rgba(220, 20, 60, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: 'var(--primary-red, #dc143c)',
    flexShrink: 0,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: isMobile ? '12px 14px' : '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
    background: 'var(--input-bg, rgba(255,255,255,0.04))',
    color: 'var(--text-light, #fff)',
    fontSize: isMobile ? 16 : 13,
    fontFamily: "'Space Grotesk', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: isMobile ? 44 : 'auto',
    transition: 'border-color 0.2s',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 80,
    resize: 'vertical' as const,
    lineHeight: 1.5,
  };

  const saveButtonStyle: React.CSSProperties = {
    padding: isMobile ? '12px 20px' : '10px 24px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--primary-red, #dc143c)',
    color: '#fff',
    fontSize: isMobile ? 14 : 13,
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.7 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: isMobile ? 44 : 'auto',
    minHeight: isMobile ? 44 : 'auto',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  };

  const cancelButtonStyle: React.CSSProperties = {
    padding: isMobile ? '12px 20px' : '10px 20px',
    borderRadius: 8,
    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
    background: 'transparent',
    color: 'var(--text-dim, #888)',
    fontSize: isMobile ? 14 : 13,
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: 'pointer',
    minWidth: isMobile ? 44 : 'auto',
    minHeight: isMobile ? 44 : 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
    borderRadius: 8,
    color: 'var(--text-dim, #888)',
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: isMobile ? 44 : 36,
    minHeight: isMobile ? 44 : 36,
    width: isMobile ? 44 : 36,
    height: isMobile ? 44 : 36,
    padding: 0,
    flexShrink: 0,
    transition: 'all 0.2s',
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: 'var(--border-color, rgba(255,255,255,0.1))',
    margin: '0 0 0 0',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site Settings"
      style={overlayStyle}
      onClick={handleOverlayClick}
    >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* ─── Header ─────────────────────────────── */}
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: isMobile ? 16 : 18,
              fontWeight: 800,
              color: 'var(--text-light, #fff)',
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(220, 20, 60, 0.1)',
                border: '1px solid rgba(220, 20, 60, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                color: 'var(--primary-red, #dc143c)',
              }}>
                <i className="fas fa-cog" />
              </span>
              Site Settings
            </h2>
            <p style={{
              margin: '6px 0 0',
              fontSize: 12,
              color: 'var(--text-dim, #888)',
              fontFamily: "'Space Grotesk', sans-serif",
              paddingLeft: 42,
            }}>
              Manage your site-wide configuration
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={closeButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--error-color)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-dim, #888)';
              e.currentTarget.style.borderColor = 'var(--border-color, rgba(255,255,255,0.1))';
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* ─── Body ───────────────────────────────── */}
        <div style={bodyStyle}>
          {loading ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '60px 20px',
            }}>
              <i
                className="fas fa-spinner fa-spin"
                style={{ fontSize: 28, color: 'var(--primary-red, #dc143c)' }}
              />
              <span style={{
                fontSize: 13,
                color: 'var(--text-dim, #888)',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                Loading settings...
              </span>
            </div>
          ) : (
            SETTINGS_SECTIONS.map((section, sIdx) => (
              <div key={section.title}>
                {/* Section header */}
                <div style={sectionTitleStyle}>
                  <i className={section.icon} />
                  {section.title}
                </div>

                {/* Section fields */}
                <div style={fieldGroupStyle}>
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      {/* Field label */}
                      <label
                        htmlFor={`setting-${field.key}`}
                        style={fieldLabelStyle}
                      >
                        <span style={fieldIconStyle}>
                          <i className={field.icon} />
                        </span>
                        {field.label}
                      </label>

                      {/* Field input */}
                      {field.multiline ? (
                        <textarea
                          id={`setting-${field.key}`}
                          value={values[field.key] ?? ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                          style={textareaStyle}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(220, 20, 60, 0.4)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color, rgba(255,255,255,0.1))';
                          }}
                        />
                      ) : (
                        <input
                          id={`setting-${field.key}`}
                          type="text"
                          value={values[field.key] ?? ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          style={inputStyle}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(220, 20, 60, 0.4)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color, rgba(255,255,255,0.1))';
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Divider between sections (except last) */}
                {sIdx < SETTINGS_SECTIONS.length - 1 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={dividerStyle} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ─── Footer ─────────────────────────────── */}
        <div style={footerStyle}>
          <button
            onClick={onClose}
            style={cancelButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = 'var(--text-light, #fff)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color, rgba(255,255,255,0.1))';
              e.currentTarget.style.color = 'var(--text-dim, #888)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={saveButtonStyle}
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.background = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary-red, #dc143c)';
            }}
          >
            {saving ? (
              <i className="fas fa-spinner fa-spin" />
            ) : (
              <i className="fas fa-check" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsModal;
