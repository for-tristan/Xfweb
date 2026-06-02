'use client';

import React, { useState } from 'react';

interface ThemePickerProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

interface ThemeInfo {
  id: string;
  name: string;
  accent: string;
  bg: string;
  card: string;
  desc: string;
}

export const darkThemes: ThemeInfo[] = [
  { id: 'crimson', name: 'Crimson', accent: '#dc143c', bg: '#070707', card: '#111111', desc: 'Default dark' },
  { id: 'midnight', name: 'Midnight', accent: '#6b9bf5', bg: '#0c1020', card: '#121830', desc: 'Soft navy' },
  { id: 'oled', name: 'OLED', accent: '#c4384a', bg: '#000000', card: '#0c0c0c', desc: 'Pure black' },
  { id: 'phantom', name: 'Phantom', accent: '#4aba72', bg: '#080e08', card: '#0e180e', desc: 'Muted green' },
  { id: 'synthwave', name: 'Synthwave', accent: '#c06ada', bg: '#120820', card: '#1a0e30', desc: 'Soft purple' },
  { id: 'frost', name: 'Frost', accent: '#5aafe0', bg: '#0e1420', card: '#141c2a', desc: 'Soft blue' },
  { id: 'cyberpunk', name: 'Cyberpunk', accent: '#a8d830', bg: '#0e0e0a', card: '#161612', desc: 'Warm neon' },
  { id: 'crimson-night', name: 'Crimson Night', accent: '#d8b040', bg: '#1a100e', card: '#241814', desc: 'Gold luxury' },
  { id: 'aurora', name: 'Aurora', accent: '#30b888', bg: '#0c1414', card: '#121e1e', desc: 'Soft aurora' },
  { id: 'volcano', name: 'Volcano', accent: '#d87030', bg: '#14100a', card: '#1e160e', desc: 'Warm ember' },
  { id: 'slate', name: 'Slate', accent: '#9aa0b8', bg: '#20202e', card: '#282838', desc: 'Minimal dev' },
  { id: 'deep-ocean', name: 'Deep Ocean', accent: '#3098b8', bg: '#081018', card: '#0e1a24', desc: 'Soft cyan' },
  { id: 'dusk', name: 'Dusk', accent: '#c87860', bg: '#161012', card: '#201818', desc: 'Sunset warm' },
  { id: 'espresso', name: 'Espresso', accent: '#c8a878', bg: '#141008', card: '#1e1810', desc: 'Coffee cream' },
  { id: 'moss', name: 'Moss', accent: '#6a9a60', bg: '#0c100a', card: '#141a12', desc: 'Forest floor' },
  { id: 'twilight', name: 'Twilight', accent: '#b878a0', bg: '#14101a', card: '#1c1624', desc: 'Soft dusk pink' },
];

export const lightThemes: ThemeInfo[] = [
  { id: 'light', name: 'Light', accent: '#b91c1c', bg: '#f5f5f5', card: '#ffffff', desc: 'Clean light' },
  { id: 'sand', name: 'Warm Sand', accent: '#c2703a', bg: '#f5f0e8', card: '#faf6ef', desc: 'Warm light' },
  { id: 'lavender', name: 'Lavender', accent: '#8b5cf6', bg: '#f5f0ff', card: '#faf8ff', desc: 'Soft purple' },
  { id: 'mint', name: 'Mint', accent: '#0d9488', bg: '#f0faf5', card: '#f5fcf8', desc: 'Fresh teal' },
  { id: 'rose-gold', name: 'Rose Gold', accent: '#c89088', bg: '#faf0ee', card: '#fdf6f4', desc: 'Muted rose' },
  { id: 'honey', name: 'Honey', accent: '#b88820', bg: '#f8f4ea', card: '#fcf8f0', desc: 'Warm amber' },
  { id: 'clay', name: 'Clay', accent: '#a86848', bg: '#f5eee8', card: '#faf4ef', desc: 'Terracotta' },
  { id: 'sage', name: 'Sage', accent: '#5a8868', bg: '#f0f4f0', card: '#f5f8f5', desc: 'Herbal green' },
  { id: 'peach', name: 'Peach', accent: '#c88868', bg: '#fdf4f0', card: '#fff8f4', desc: 'Soft peach' },
];

const allThemes = [...darkThemes, ...lightThemes];

function ThemeButton({ theme, currentTheme, onThemeChange, onClose }: {
  theme: ThemeInfo;
  currentTheme: string;
  onThemeChange: (id: string) => void;
  onClose: () => void;
}) {
  const isActive = currentTheme === theme.id;
  return (
    <button
      onClick={() => { onThemeChange(theme.id); onClose(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 12px',
        background: isActive ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
        border: isActive ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : '1px solid transparent',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        marginBottom: 2,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--input-bg)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Theme preview swatch */}
      <div style={{
        width: 36,
        height: 24,
        borderRadius: 4,
        background: theme.bg,
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: theme.card,
        }} />
        <div style={{
          position: 'absolute',
          top: 3,
          right: 3,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: theme.accent,
        }} />
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-light)',
          fontFamily: "'Space Grotesk', sans-serif",
          lineHeight: 1.2,
        }}>
          {theme.name}
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--text-dim)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {theme.desc}
        </div>
      </div>
      {isActive && (
        <i className="fa-solid fa-check" style={{ color: 'var(--accent)', fontSize: 12 }} />
      )}
    </button>
  );
}

export function ThemePicker({ currentTheme, onThemeChange }: ThemePickerProps) {
  const [open, setOpen] = useState(false);

  const current = allThemes.find(t => t.id === currentTheme) || allThemes[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title="Change theme"
        aria-label="Change theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          background: 'var(--input-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          color: 'var(--text-dim)',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: current.accent,
          border: '2px solid var(--border-color)',
          flexShrink: 0,
        }} />
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 9, opacity: 0.5 }} />
      </button>

      {open && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
            }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 260,
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 9999,
            overflow: 'hidden',
            padding: 8,
            maxHeight: 420,
            overflowY: 'auto',
          }}>
            <div style={{
              padding: '8px 12px 12px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: 4,
            }}>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                Choose Theme
              </span>
            </div>
            {/* Dark themes section */}
            <div style={{ padding: '8px 12px 4px', marginTop: 4 }}>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: 2,
                fontFamily: "'Space Grotesk', sans-serif",
                opacity: 0.6,
              }}>
                Dark
              </span>
            </div>
            {darkThemes.map((theme) => (
              <ThemeButton key={theme.id} theme={theme} currentTheme={currentTheme} onThemeChange={onThemeChange} onClose={() => setOpen(false)} />
            ))}
            {/* Light themes section */}
            <div style={{ padding: '8px 12px 4px', marginTop: 6, borderTop: '1px solid var(--border-color)' }}>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: 2,
                fontFamily: "'Space Grotesk', sans-serif",
                opacity: 0.6,
              }}>
                Light
              </span>
            </div>
            {lightThemes.map((theme) => (
              <ThemeButton key={theme.id} theme={theme} currentTheme={currentTheme} onThemeChange={onThemeChange} onClose={() => setOpen(false)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
