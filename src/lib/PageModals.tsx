'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import ConfirmModal from '@/components/ConfirmModal';
import type { User } from './usePageFeatures';

// ═══════════════════════════════════════════════════
// SEARCH MODAL
// ═══════════════════════════════════════════════════

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  query: string;
  setQuery: (q: string) => void;
  results: { title: string; category: string; desc: string; link: string }[];
  onSelect: (link: string) => void;
}

export function SearchModal({ open, onClose, query, setQuery, results, onSelect }: SearchModalProps) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Search" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 140 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 640, padding: '0 20px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: 'var(--bg-secondary, #111)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: 12, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
            <i className="fas fa-search" style={{ color: 'var(--text-dim, #666)', marginRight: 12, fontSize: 14 }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, services, courses..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary, #fff)', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}
            />
            <kbd style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: 'var(--text-dim, #666)', fontFamily: 'monospace' }}>ESC</kbd>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {query.length < 2 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-dim, #666)', fontSize: 14 }}>
                <i className="fas fa-search" style={{ fontSize: 24, marginBottom: 8, display: 'block', opacity: 0.4 }} />
                Type at least 2 characters to search
              </div>
            )}
            {query.length >= 2 && results.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-dim, #666)', fontSize: 14 }}>
                <i className="fas fa-times-circle" style={{ fontSize: 24, marginBottom: 8, display: 'block', opacity: 0.4 }} />
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}
            {results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => { onSelect(item.link); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary, #fff)', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,59,48,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 4, background: 'rgba(255,59,48,0.15)', color: '#ff3b30', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Space Grotesk, sans-serif' }}>{item.category}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>{item.title}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-dim, #888)' }}>{item.desc}</span>
                </div>
                <i className="fas fa-arrow-right" style={{ color: 'var(--text-dim, #444)', fontSize: 12 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AUTH MODAL
// ═══════════════════════════════════════════════════

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  tab: 'signin' | 'signup';
  setTab: (t: 'signin' | 'signup') => void;
  message: string;
  // Login
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  loginLoading: boolean;
  onLogin: (e: React.FormEvent) => void;
  // Signup
  signupName: string;
  setSignupName: (v: string) => void;
  signupEmail: string;
  setSignupEmail: (v: string) => void;
  signupPassword: string;
  setSignupPassword: (v: string) => void;
  signupPhone: string;
  setSignupPhone: (v: string) => void;
  signupCompany: string;
  setSignupCompany: (v: string) => void;
  signupLoading: boolean;
  onSignup: (e: React.FormEvent) => void;
  // Utils
  getPasswordStrength: (pw: string) => string;
  // Forgot Password
  forgotStep: 'idle' | 'email' | 'code';
  setForgotStep: (s: 'idle' | 'email' | 'code') => void;
  forgotEmail: string;
  setForgotEmail: (v: string) => void;
  forgotLoading: boolean;
  onForgotSubmit: (e: React.FormEvent) => void;
  resetCode: string;
  setResetCode: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  resetLoading: boolean;
  onResetSubmit: (e: React.FormEvent) => void;
}

// ── Shared style helpers ──
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-dim, #aaa)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: 0.5 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary, #fff)', fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', outline: 'none', boxSizing: 'border-box' };
const primaryBtnStyle: React.CSSProperties = { width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: 'var(--primary-red, #ff3b30)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer', transition: 'opacity 0.2s' };

export function AuthModal({
  open, onClose, tab, setTab, message,
  loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginLoading, onLogin,
  signupName, setSignupName, signupEmail, setSignupEmail, signupPassword, setSignupPassword,
  signupPhone, setSignupPhone, signupCompany, setSignupCompany, signupLoading, onSignup,
  getPasswordStrength,
  forgotStep, setForgotStep, forgotEmail, setForgotEmail, forgotLoading, onForgotSubmit,
  resetCode, setResetCode, newPassword, setNewPassword, resetLoading, onResetSubmit,
}: AuthModalProps) {
  if (!open) return null;

  const strength = getPasswordStrength(signupPassword);
  const strengthColor = strength === 'strong' ? '#22c55e' : strength === 'medium' ? '#f59e0b' : strength === 'weak' ? '#ef4444' : 'transparent';

  const handleSocialLogin = (provider: string) => {
    window.location.href = provider === 'Google' ? '/api/auth/google' : '/api/auth/github';
  };

  const socialButtons = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
       
       
      </div>
    </>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label={tab === 'signin' ? 'Sign In' : 'Sign Up'} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 20px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: 'var(--bg-secondary, #0f0f0f)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
          {/* ── FORGOT PASSWORD: EMAIL STEP ── */}
          {forgotStep === 'email' ? (
            <>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary, #fff)' }}>
                    Forgot Password
                  </h3>
                  <button onClick={onClose} aria-label="Close forgot password" style={{ background: 'transparent', border: 'none', color: 'var(--text-dim, #666)', cursor: 'pointer', fontSize: 18, padding: 4 }}>
                    <i className="fas fa-times" />
                  </button>
                </div>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-dim, #888)', lineHeight: 1.5, fontFamily: 'Space Grotesk, sans-serif' }}>
                  Enter the email associated with your account and we&apos;ll send you a 6-digit verification code.
                </p>
              </div>
              <div style={{ padding: '0 24px 24px' }}>
                <form onSubmit={onForgotSubmit}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>EMAIL</label>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
                  </div>
                  <button type="submit" disabled={forgotLoading} style={{ ...primaryBtnStyle, opacity: forgotLoading ? 0.7 : 1, cursor: forgotLoading ? 'not-allowed' : 'pointer' }}>
                    {forgotLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Sending Code...</> : 'Send Reset Code'}
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={() => setForgotStep('idle')} style={{ background: 'none', border: 'none', color: 'var(--primary-red, #dc143c)', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <i className="fas fa-arrow-left" style={{ fontSize: 11 }} /> Back to Sign In
                  </button>
                </div>
              </div>
            </>
          ) : forgotStep === 'code' ? (
            /* ── FORGOT PASSWORD: CODE VERIFICATION STEP ── */
            <>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary, #fff)' }}>
                    Verify Code
                  </h3>
                  <button onClick={onClose} aria-label="Close verify code" style={{ background: 'transparent', border: 'none', color: 'var(--text-dim, #666)', cursor: 'pointer', fontSize: 18, padding: 4 }}>
                    <i className="fas fa-times" />
                  </button>
                </div>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-dim, #888)', lineHeight: 1.5, fontFamily: 'Space Grotesk, sans-serif' }}>
                  A 6-digit code was sent to <strong style={{ color: 'var(--text-primary, #fff)' }}>{forgotEmail}</strong>. Enter it below along with your new password.
                </p>
              </div>
              <div style={{ padding: '0 24px 24px' }}>
                <form onSubmit={onResetSubmit}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>6-DIGIT CODE</label>
                    <input type="text" value={resetCode} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setResetCode(v); }} placeholder="000000" required maxLength={6} style={{ ...inputStyle, textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: 700 }} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>NEW PASSWORD</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required style={inputStyle} />
                  </div>
                  <button type="submit" disabled={resetLoading} style={{ ...primaryBtnStyle, opacity: resetLoading ? 0.7 : 1, cursor: resetLoading ? 'not-allowed' : 'pointer' }}>
                    {resetLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Resetting Password...</> : 'Reset Password'}
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={() => setForgotStep('idle')} style={{ background: 'none', border: 'none', color: 'var(--primary-red, #dc143c)', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <i className="fas fa-arrow-left" style={{ fontSize: 11 }} /> Back to Sign In
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ── NORMAL SIGN IN / SIGN UP ── */
            <>
              {/* Header */}
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary, #fff)' }}>
                    {tab === 'signin' ? 'Welcome Back' : 'Create Account'}
                  </h3>
                  <button onClick={onClose} aria-label="Close auth modal" style={{ background: 'transparent', border: 'none', color: 'var(--text-dim, #666)', cursor: 'pointer', fontSize: 18, padding: 4 }}>
                    <i className="fas fa-times" />
                  </button>
                </div>
                {message && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', marginBottom: 16, fontSize: 13, color: '#ff6b60' }}>
                    <i className="fas fa-info-circle" style={{ marginRight: 6 }} />{message}
                  </div>
                )}
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 20 }}>
                  <button
                    onClick={() => setTab('signin')}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.2s',
                      background: tab === 'signin' ? 'var(--primary-red, #ff3b30)' : 'transparent',
                      color: tab === 'signin' ? '#fff' : 'var(--text-dim, #888)' }}
                  >Sign In</button>
                  <button
                    onClick={() => setTab('signup')}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.2s',
                      background: tab === 'signup' ? 'var(--primary-red, #ff3b30)' : 'transparent',
                      color: tab === 'signup' ? '#fff' : 'var(--text-dim, #888)' }}
                  >Sign Up</button>
                </div>
              </div>

              {/* Forms */}
              <div style={{ padding: '0 24px 24px' }}>
                {tab === 'signin' ? (
                  <form onSubmit={onLogin}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>EMAIL</label>
                      <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={labelStyle}>PASSWORD</label>
                      <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
                    </div>
                    <div style={{ textAlign: 'right', marginBottom: 20 }}>
                      <button type="button" onClick={() => { setForgotStep('email'); setForgotEmail(loginEmail); }} style={{ background: 'none', border: 'none', color: 'var(--primary-red, #dc143c)', fontSize: 12, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer' }}>
                        Forgot Password?
                      </button>
                    </div>
                    <button type="submit" disabled={loginLoading} style={{ ...primaryBtnStyle, opacity: loginLoading ? 0.7 : 1, cursor: loginLoading ? 'not-allowed' : 'pointer' }}>
                      {loginLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Signing In...</> : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={onSignup}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>FULL NAME *</label>
                      <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="John Doe" required style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>EMAIL *</label>
                      <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>PASSWORD *</label>
                      <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Min 6 characters" required style={inputStyle} />
                      {signupPassword && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                            <div style={{ width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%', height: '100%', background: strengthColor, borderRadius: 2, transition: 'all 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: strengthColor, fontWeight: 600, textTransform: 'capitalize' }}>{strength}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>PHONE <span style={{ opacity: 0.5 }}>(optional)</span></label>
                      <input type="tel" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} placeholder="+20..." style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>COMPANY <span style={{ opacity: 0.5 }}>(optional)</span></label>
                      <input type="text" value={signupCompany} onChange={(e) => setSignupCompany(e.target.value)} placeholder="Your company" style={inputStyle} />
                    </div>
                    <button type="submit" disabled={signupLoading} style={{ ...primaryBtnStyle, opacity: signupLoading ? 0.7 : 1, cursor: signupLoading ? 'not-allowed' : 'pointer' }}>
                      {signupLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Creating Account...</> : 'Create Account'}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AUTH GATE OVERLAY
// ═══════════════════════════════════════════════════

interface AuthGateProps {
  loading: boolean;
  user: User | null;
  onSignIn: () => void;
  onSignUp: () => void;
}

export function AuthGate({ loading, user, onSignIn, onSignUp }: AuthGateProps) {
  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(7,7,7,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 28, color: 'var(--text-light, #fff)', letterSpacing: 3, textTransform: 'uppercase' }}>X<span style={{ color: 'var(--primary-red, #dc143c)' }}>.</span>Foundry</span>
        </div>
        <div style={{ width: 200, height: 2, background: 'var(--border-color, rgba(255,255,255,0.08))', borderRadius: 2, overflow: 'hidden' }}>
          <div className="xf-skeleton-bar-slide" style={{ width: '40%', height: '100%', background: 'var(--primary-red, #dc143c)', borderRadius: 2 }} />
        </div>
        <span style={{ color: 'var(--text-dim, #888)', fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>Loading experience...</span>
      </div>
    );
  }

  if (user) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(7,7,7,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 20px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,59,48,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <i className="fas fa-lock" style={{ fontSize: 28, color: '#ff3b30' }} />
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary, #fff)' }}>Sign In Required</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dim, #888)', lineHeight: 1.6, fontFamily: 'Space Grotesk, sans-serif' }}>
          You need to be signed in to access this page. Create a free account or sign in to continue.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onSignIn} style={{ padding: '12px 32px', borderRadius: 8, border: '1px solid var(--border-color, rgba(255,255,255,0.15))', background: 'transparent', color: 'var(--text-primary, #fff)', fontSize: 14, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}>
          Sign In
        </button>
        <button onClick={onSignUp} style={{ padding: '12px 32px', borderRadius: 8, border: 'none', background: 'var(--primary-red, #ff3b30)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}>
          Create Account
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// NAV ACTIONS (enhanced with notifications + profile)
// ═══════════════════════════════════════════════════

interface NavActionsProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSearchOpen: () => void;
  user: User | null;
  onOpenAuth: (tab: 'signin' | 'signup') => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  onToggleMobile: () => void;
  // Notifications
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
  notifications: { id: string; title: string; message: string; read: boolean; createdAt: string }[];
  unreadCount: number;
  loadNotifications: () => void;
  setNotifications: React.Dispatch<React.SetStateAction<{ id: string; title: string; message: string; read: boolean; createdAt: string }[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  // Profile
  dashboardOpen: boolean;
  setDashboardOpen: (v: boolean) => void;
}

export function NavActions({
  theme, onToggleTheme, onSearchOpen, user, onOpenAuth, onLogout, mobileMenuOpen, onToggleMobile,
  notifOpen, setNotifOpen, notifications, unreadCount, loadNotifications, setNotifications, setUnreadCount,
  dashboardOpen, setDashboardOpen,
}: NavActionsProps) {
  return (
    <div className="nav-actions">
      <button className="theme-toggle" onClick={onToggleTheme} title="Toggle Theme" aria-label="Toggle theme">
        <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'} />
      </button>
      <button className="nav-search-btn" onClick={onSearchOpen} title="Search" aria-label="Open search">
        <i className="fas fa-search" />
      </button>
      {!user && (
        <>
          <button className="nav-auth-btn" onClick={() => onOpenAuth('signin')}>Sign In</button>
          <button className="nav-auth-btn nav-auth-btn-filled" onClick={() => onOpenAuth('signup')}>Sign Up</button>
        </>
      )}
      {user && (
        <>
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button className="nav-search-btn" onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifications(); }} title="Notifications" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`} style={{ position: 'relative' }}>
              <i className="fas fa-bell" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#dc143c', fontSize: 9, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--dark-gray)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 340, background: 'var(--dark-gray)', border: '1px solid var(--border-color)', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 10001, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>Notifications</span>
                  {unreadCount > 0 && <button onClick={async () => { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readAll: true }) }); loadNotifications(); }} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Mark all read</button>}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}><i className="fas fa-bell-slash" style={{ display: 'block', fontSize: 24, marginBottom: 10, opacity: 0.3 }}></i>No notifications</div>
                  ) : notifications.slice(0, 10).map((n) => (
                    <div key={n.id} onClick={async () => { if (!n.read) { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId: n.id }) }); loadNotifications(); } }} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(220,20,60,0.03)', transition: 'background 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-red)', flexShrink: 0 }} />}
                        <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 12, color: 'var(--text-light)' }}>{n.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, paddingLeft: n.read ? 0 : 14 }}>{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* User Avatar → opens profile modal */}
          <button className="nav-user-btn" onClick={() => setDashboardOpen(true)}>
            <span className="nav-user-avatar">
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : user.name.charAt(0).toUpperCase()
              }
            </span>
            <span className="nav-user-name">{user.name.split(' ')[0]}</span>
          </button>
          <button className="nav-logout-btn" onClick={onLogout}>Logout</button>
        </>
      )}
      <div className={`menu-toggle${mobileMenuOpen ? ' active' : ''}`} onClick={onToggleMobile}>
        <span /><span /><span />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PROFILE MODAL (shared across all sub-pages)
// ═══════════════════════════════════════════════════

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  // Profile form
  profileName: string;
  setProfileName: (v: string) => void;
  profileUsername: string;
  setProfileUsername: (v: string) => void;
  profilePhone: string;
  setProfilePhone: (v: string) => void;
  profileCompany: string;
  setProfileCompany: (v: string) => void;
  profileSaving: boolean;
  avatarUploading: boolean;
  onProfileSave: (e: React.FormEvent) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileModal({
  open, onClose, user,
  profileName, setProfileName, profileUsername, setProfileUsername, profilePhone, setProfilePhone, profileCompany, setProfileCompany,
  profileSaving, avatarUploading, onProfileSave, onAvatarUpload,
}: ProfileModalProps) {

  // All hooks MUST be called before any conditional returns (React Rules of Hooks)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; confirmLabel: string; danger: boolean; icon: string; onConfirm: () => void }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, icon: 'fas fa-exclamation-triangle', onConfirm: () => {} });

  const openConfirm = (title: string, message: string, onConfirm: () => void, opts?: { confirmLabel?: string; danger?: boolean; icon?: string }) => {
    setConfirmModal({
      open: true, title, message,
      confirmLabel: opts?.confirmLabel || 'Confirm',
      danger: opts?.danger !== undefined ? opts.danger : false,
      icon: opts?.icon || 'fas fa-exclamation-triangle',
      onConfirm,
    });
  };

  // Guard clause AFTER all hooks (React Rules of Hooks)
  if (!open || !user) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Dashboard" className="dashboard-modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dashboard-modal">
        <div className="dashboard-modal-header">
          <h2>Dashboard</h2>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close dashboard">&times;</button>
        </div>

        <div className="dashboard-modal-header" style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="nav-user-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : user.name.charAt(0).toUpperCase()
            }
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{user.email} &middot; {user.role}</div>
          </div>
        </div>

        <div className="dashboard-modal-body">
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 4, color: 'var(--text-light)' }}>My Profile</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: 28, fontSize: 14 }}>Manage your account details and profile picture</p>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(220,20,60,0.1)', border: '2px solid rgba(220,20,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 24, fontWeight: 900, overflow: 'hidden' }}>
                  {user.avatar
                    ? <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{user.name.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <label style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--dark-gray)' }}>
                  <i className={`fas fa-${avatarUploading ? 'spinner fa-spin' : 'camera'}`} style={{ fontSize: 10, color: '#fff' }}></i>
                  <input type="file" accept="image/*" onChange={onAvatarUpload} style={{ display: 'none' }} />
                </label>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 2 }}>{user.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{user.email}</div>
                <div style={{ marginTop: 4, padding: '2px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(220,20,60,0.1)', color: 'var(--primary-red)', border: '1px solid rgba(220,20,60,0.2)', display: 'inline-block' }}>{user.role}</div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={onProfileSave}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Full Name</label>
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Username</label>
                <input type="text" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="your_unique_username" style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Phone</label>
                <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+20 10..." style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Company</label>
                <input type="text" value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)} placeholder="Your company name" style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }} />
              </div>
              <button type="submit" disabled={profileSaving} className="submit-btn" style={{ width: '100%', opacity: profileSaving ? 0.6 : 1 }}>
                {profileSaving ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Saving...</> : <><i className="fas fa-save" style={{ marginRight: 8 }}></i> Save Profile</>}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <a href="/" style={{ color: 'var(--primary-red)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-home" style={{ fontSize: 11 }} /> Go to Full Dashboard
                <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
              </a>
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
              <button
                onClick={() => {
                  openConfirm(
                    'Delete Account',
                    'Are you sure you want to delete your account? This action is PERMANENT and cannot be undone. All your data, progress, and certificates will be lost.',
                    async () => {
                      try {
                        const res = await fetch('/api/user/delete-account', { method: 'DELETE' });
                        if (res.ok) { window.location.href = '/'; }
                        else { alert((await res.json()).error); }
                      } catch { alert('Failed'); }
                    },
                    { confirmLabel: 'Delete Forever', danger: true, icon: 'fas fa-skull-crossbones' }
                  );
                }}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: 'transparent',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#ef4444',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: 'pointer',
                  borderRadius: 2,
                }}
              >
                <i className="fas fa-trash-alt" style={{ marginRight: 8 }}></i>Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        onConfirm={async () => { await confirmModal.onConfirm(); setConfirmModal(prev => ({ ...prev, open: false })); }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        danger={confirmModal.danger}
        icon={confirmModal.icon}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// HERO EFFECTS (shared)
// ═══════════════════════════════════════════════════

export function HeroEffects() {
  return (
    <>
      <div className="grid-bg"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="scan-line"></div>
    </>
  );
}