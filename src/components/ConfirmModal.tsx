'use client';

import React from 'react';

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
  danger = false, icon = 'fas fa-exclamation-triangle',
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10002,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--dark-gray, #111)', border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          borderRadius: 4, overflow: 'hidden',
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(220,20,60,0.1)',
            border: danger ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(220,20,60,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: danger ? '#ef4444' : 'var(--primary-red)', fontSize: 16,
          }}>
            <i className={icon} />
          </div>
          <div>
            <h3 style={{
              fontFamily: "'Orbitron', sans-serif", fontWeight: 900,
              fontSize: 14, color: 'var(--text-light)', marginBottom: 2,
            }}>
              {title}
            </h3>
          </div>
        </div>

        {/* Body */}
        <div style={{
          padding: '0 24px 20px',
          fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {message}
        </div>

        {/* Actions */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: 2,
              border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
              background: 'transparent', color: 'var(--text-dim)',
              fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              textTransform: 'uppercase', letterSpacing: 1,
              opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: 2, border: 'none',
              background: danger ? '#ef4444' : 'var(--primary-red, #dc143c)',
              color: '#fff', fontSize: 11, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              textTransform: 'uppercase', letterSpacing: 1,
              opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading && <i className="fas fa-spinner fa-spin" style={{ fontSize: 10 }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
