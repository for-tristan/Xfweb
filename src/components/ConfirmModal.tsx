'use client';

import React, { useEffect, useRef } from 'react';

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const container = containerRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const previousFocus = document.activeElement as HTMLElement;
    const timer = setTimeout(() => {
      const focusable = container.querySelectorAll(focusableSelector);
      if (focusable.length > 0) (focusable[0] as HTMLElement).focus();
    }, 50);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = container.querySelectorAll(focusableSelector);
      if (focusable.length === 0) return;
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    container.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      container.removeEventListener('keydown', handleKeyDown);
      if (previousFocus) previousFocus.focus();
    };
  }, [isActive, containerRef]);
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  icon?: string;
  loading?: boolean;
}

export default function ConfirmModal({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, icon = 'fa-solid fa-exclamation-triangle',
  loading = false,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLDivElement>(null);
  useFocusTrap(confirmRef, open);

  if (!open) return null;

  return (
    <>
    <style>{`
      @keyframes confirmFadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes confirmSlideUp { from { opacity: 0; transform: translateY(12px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
    `}</style>
    <div
      ref={confirmRef}
      data-lenis-prevent
      style={{
        position: 'fixed', inset: 0, zIndex: 10002,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'confirmFadeIn 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 400,
          background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px color-mix(in srgb, var(--accent) 6%, transparent)',
          animation: 'confirmSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: danger ? 'color-mix(in srgb, var(--error-color) 10%, transparent)' : 'color-mix(in srgb, var(--accent) 10%, transparent)',
            border: danger ? '1px solid color-mix(in srgb, var(--error-color) 30%, transparent)' : '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: danger ? 'var(--error-color)' : 'var(--accent)', fontSize: 16,
          }}>
            <i className={icon} />
          </div>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-heading, Inter Tight)', fontWeight: 800,
              fontSize: 14, color: 'var(--text-light)', marginBottom: 2,
            }}>
              {title}
            </h3>
          </div>
        </div>

        <div style={{
          padding: '0 24px 20px',
          fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6,
          fontFamily: 'var(--font-body, Inter Tight)',
        }}>
          {message}
        </div>

        <div style={{
          padding: '16px 24px', borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            className="v-btn v-btn-ghost"
            style={{
              padding: '8px 20px', borderRadius: 8,
              border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
              background: 'transparent', color: 'var(--text-dim)',
              fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-heading, Inter Tight)',
              opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={danger ? 'v-btn v-btn-danger' : 'v-btn v-btn-accent'}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: danger ? 'var(--error-color)' : 'var(--accent)',
              color: 'var(--text-light)', fontSize: 12, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-heading, Inter Tight)',
              opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading && <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 10 }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
