'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { AvatarCropModal } from '@/components/AvatarCropModal';
import { ThemePicker } from '@/components/ThemePicker';
// WordSpinner removed — replaced by .xf-loader CSS dots
import { WaveInput } from '@/components/WaveInput';
import type { User } from './usePageFeatures';

/** Convenience wrapper: Vaulta minimal dot loader */
function VaultaLoader() {
  return <div className="xf-loader"><div className="xf-loader-dot" /><div className="xf-loader-dot" /><div className="xf-loader-dot" /></div>;
}

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const container = containerRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const previousFocus = document.activeElement as HTMLElement;
    const focusFirst = () => {
      const focusable = container.querySelectorAll(focusableSelector);
      if (focusable.length > 0) {
        (focusable[0] as HTMLElement).focus();
      }
    };
    const timer = setTimeout(focusFirst, 50);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = container.querySelectorAll(focusableSelector);
      if (focusable.length === 0) return;
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    container.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      container.removeEventListener('keydown', handleKeyDown);
      if (previousFocus) {
        previousFocus.focus();
      }
    };
  }, [isActive, containerRef]);
}

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
  const searchRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  useFocusTrap(searchRef, open);
  useEffect(() => setActiveIndex(-1), [results]);

  if (!open) return null;
  return (
    <div ref={searchRef} role="dialog" aria-modal="true" aria-label="Search" className="search-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--black) 97%, transparent)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 'max(60px, 14vh)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 640, padding: '0 20px' }} onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-panel" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <i className="fa-solid fa-search" style={{ color: 'var(--text-dim)', marginRight: 12, fontSize: 14 }} />
            <WaveInput
              label="Search pages, services, courses..."
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((prev) => prev < results.length - 1 ? prev + 1 : 0);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((prev) => prev > 0 ? prev - 1 : results.length - 1);
                } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
                  e.preventDefault();
                  onSelect(results[activeIndex].link);
                  onClose();
                }
              }}
              style={{ flex: 1 }}
            />
            <kbd style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--input-bg)', color: 'var(--text-dim)', fontFamily: 'monospace' }}>ESC</kbd>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {query.length < 2 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
                <i className="fa-solid fa-search" style={{ fontSize: 24, marginBottom: 8, display: 'block', opacity: 0.4 }} />
                Type at least 2 characters to search
              </div>
            )}
            {query.length >= 2 && results.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
                <i className="fa-solid fa-times-circle" style={{ fontSize: 24, marginBottom: 8, display: 'block', opacity: 0.4 }} />
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}
            {results.map((item, idx) => (
              <button
                key={idx}
                id={`search-result-${idx}`}
                aria-selected={idx === activeIndex}
                onClick={() => { onSelect(item.link); onClose(); }}
                className="search-result-item"
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '12px 20px', background: idx === activeIndex ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'left', color: 'var(--text-light)', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 8%, transparent)'); setActiveIndex(idx); }}
                onMouseLeave={(e) => { (e.currentTarget.style.background = 'transparent'); setActiveIndex(-1); }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 4, background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Space Grotesk, sans-serif' }}>{item.category}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>{item.title}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{item.desc}</span>
                </div>
                <i className="fa-solid fa-arrow-right" style={{ color: 'var(--text-dim)', fontSize: 12 }} />
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
  signupConfirmPassword: string;
  setSignupConfirmPassword: (v: string) => void;
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
  // Email Verification
  verificationStep: 'idle' | 'pending';
  setVerificationStep: (s: 'idle' | 'pending') => void;
  verificationEmail: string;
  verificationCode: string;
  setVerificationCode: (v: string) => void;
  verificationLoading: boolean;
  onVerifyEmail: (e: React.FormEvent) => void;
  onResendVerification: () => void;
  resendLoading: boolean;
}

export function AuthModal({
  open, onClose, tab, setTab, message,
  loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginLoading, onLogin,
  signupName, setSignupName, signupEmail, setSignupEmail, signupPassword, setSignupPassword, signupConfirmPassword, setSignupConfirmPassword,
  signupPhone, setSignupPhone, signupCompany, setSignupCompany, signupLoading, onSignup,
  getPasswordStrength,
  forgotStep, setForgotStep, forgotEmail, setForgotEmail, forgotLoading, onForgotSubmit,
  resetCode, setResetCode, newPassword, setNewPassword, resetLoading, onResetSubmit,
  verificationStep, setVerificationStep, verificationEmail, verificationCode, setVerificationCode,
  verificationLoading, onVerifyEmail, onResendVerification, resendLoading,
}: AuthModalProps) {
  const authRef = useRef<HTMLDivElement>(null);
  useFocusTrap(authRef, open);

  if (!open) return null;

  return (
    <div ref={authRef} role="dialog" aria-modal="true" aria-label={verificationStep === 'pending' ? 'Verify Email' : forgotStep === 'email' ? 'Forgot Password' : forgotStep === 'code' ? 'Verify Code' : tab === 'signin' ? 'Sign In' : 'Create Account'} className={`auth-modal-overlay${open ? ' active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) { onClose(); setForgotStep('idle'); setVerificationStep('idle'); } }}>
      <div className="auth-modal" style={forgotStep !== 'idle' || verificationStep !== 'idle' ? {} : undefined}>
        {verificationStep === 'pending' ? (
          <>
            <div className="auth-modal-header">
              <h2>Verify Your Email</h2>
              <button className="auth-modal-close" onClick={() => { onClose(); setVerificationStep('idle'); }}>&times;</button>
            </div>
            <div className="auth-modal-body">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <i className="fa-solid fa-envelope" style={{ fontSize: 22, color: 'var(--accent)' }}></i>
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6 }}>
                  A 6-digit verification code was sent to <strong style={{ color: 'var(--text-light)' }}>{verificationEmail}</strong>. Enter it below to activate your account.
                </p>
              </div>
              <form onSubmit={onVerifyEmail}>
                <WaveInput label="6-Digit Code" type="text" value={verificationCode} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setVerificationCode(v); }} required maxLength={6} autoFocus style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }} />
                <button type="submit" className="v-btn-primary" disabled={verificationLoading} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                  {verificationLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Verifying...</> : <><i className="fa-solid fa-check"></i> Verify Email</>}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={onResendVerification} disabled={resendLoading} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: resendLoading ? 'not-allowed' : 'pointer', opacity: resendLoading ? 0.6 : 1 }}>
                  {resendLoading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6, fontSize: 11 }}></i> Resending...</> : <><i className="fa-solid fa-redo" style={{ marginRight: 6, fontSize: 11 }}></i> Resend Code</>}
                </button>
                <button onClick={() => setVerificationStep('idle')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}>
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: 6, fontSize: 11 }}></i> Back to Sign In
                </button>
              </div>
            </div>
          </>
        ) : forgotStep === 'email' ? (
          <>
            <div className="auth-modal-header">
              <h2>Forgot Password</h2>
              <button className="auth-modal-close" onClick={() => { onClose(); setForgotStep('idle'); }}>&times;</button>
            </div>
            <div className="auth-modal-body">
              <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Enter the email associated with your account and we&apos;ll send you a 6-digit verification code.
              </p>
              <form onSubmit={onForgotSubmit}>
                <WaveInput label="Email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required autoFocus />
                <button type="submit" className="v-btn-primary" disabled={forgotLoading} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                  {forgotLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Sending Code...</> : <><i className="fa-solid fa-paper-plane"></i> Send Reset Code</>}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button onClick={() => setForgotStep('idle')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}>
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: 6, fontSize: 11 }}></i> Back to Sign In
                </button>
              </div>
            </div>
          </>
        ) : forgotStep === 'code' ? (
          <>
            <div className="auth-modal-header">
              <h2>Verify Code</h2>
              <button className="auth-modal-close" onClick={() => { onClose(); setForgotStep('idle'); }}>&times;</button>
            </div>
            <div className="auth-modal-body">
              <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                A 6-digit code was sent to <strong style={{ color: 'var(--text-light)' }}>{forgotEmail}</strong>. Enter it below along with your new password.
              </p>
              <form onSubmit={onResetSubmit}>
                <WaveInput label="6-Digit Code" type="text" value={resetCode} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setResetCode(v); }} required maxLength={6} autoFocus style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }} />
                <WaveInput label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <button type="submit" className="v-btn-primary" disabled={resetLoading} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                  {resetLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Resetting Password...</> : <><i className="fa-solid fa-check"></i> Reset Password</>}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button onClick={() => setForgotStep('idle')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}>
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: 6, fontSize: 11 }}></i> Back to Sign In
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="auth-modal-header">
              <h2>{tab === 'signin' ? 'Sign In' : 'Create Account'}</h2>
              <button className="auth-modal-close" onClick={onClose}>&times;</button>
            </div>

            <div className="auth-modal-tabs">
              <button className={`auth-modal-tab${tab === 'signin' ? ' active' : ''}`} onClick={() => { setTab('signin'); }}>Sign In</button>
              <button className={`auth-modal-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); }}>Create Account</button>
            </div>

            <div className="auth-modal-body">
              {message && <div className="auth-modal-message">{message}</div>}

              {tab === 'signin' ? (
                <form onSubmit={onLogin}>
                  <WaveInput label="Email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required autoFocus />
                  <WaveInput label="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  <div style={{ textAlign: 'right', marginBottom: 8 }}>
                    <button type="button" onClick={() => { setForgotStep('email'); setForgotEmail(loginEmail); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}>
                      Forgot Password?
                    </button>
                  </div>
                  <button type="submit" className="v-btn-primary" disabled={loginLoading} style={{ marginTop: 0, width: '100%', justifyContent: 'center' }}>
                    {loginLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Signing In...</> : <><i className="fa-solid fa-arrow-right"></i> Sign In</>}
                  </button>
                </form>
              ) : (
                <form onSubmit={onSignup}>
                  <WaveInput label="Full Name *" type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} required autoFocus />
                  <WaveInput label="Email *" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                  <WaveInput label="Password *" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required>
                    {signupPassword && (
                      <div className="xf-password-strength">
                        <div className={`xf-password-strength-bar ${getPasswordStrength(signupPassword)}`}></div>
                      </div>
                    )}
                  </WaveInput>
                  <WaveInput label="Confirm Password *" type="password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required>
                    {signupConfirmPassword && signupPassword !== signupConfirmPassword && (
                      <span className="pw-mismatch">Passwords do not match</span>
                    )}
                  </WaveInput>
                  <WaveInput label="Phone" type="tel" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} />
                  <WaveInput label="Company Name" type="text" value={signupCompany} onChange={(e) => setSignupCompany(e.target.value)} style={{ marginBottom: 0 }} />
                  <button type="submit" className="v-btn-primary" disabled={signupLoading} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                    {signupLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Creating Account...</> : <><i className="fa-solid fa-user-plus"></i> Create Account</>}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AUTH GATE OVERLAY
// ═══════════════════════════════════════════════════

interface AuthGateProps {
  loading: boolean;
  minLoading?: boolean;
  user: User | null;
  onSignIn: () => void;
  onSignUp: () => void;
}

export function AuthGate({ loading, minLoading, user, onSignIn, onSignUp }: AuthGateProps) {
  if (loading || minLoading) {
    return <VaultaLoader />;
  }

  if (user) return null;

  // Redirect to /auth page for non-authed users
  return <AuthRedirect />;
}

function AuthRedirect() {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (!redirected.current) {
      redirected.current = true;
      router.push('/auth');
    }
  }, [router]);

  return <VaultaLoader />;
}

// ═══════════════════════════════════════════════════
// NAV ACTIONS (enhanced with notifications + profile)
// ═══════════════════════════════════════════════════

interface NavActionsProps {
  theme: string;
  onToggleTheme: () => void;
  onChangeTheme: (theme: string) => void;
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
  theme, onToggleTheme, onChangeTheme, onSearchOpen, user, onOpenAuth, onLogout, mobileMenuOpen, onToggleMobile,
  notifOpen, setNotifOpen, notifications, unreadCount, loadNotifications, setNotifications, setUnreadCount,
  dashboardOpen, setDashboardOpen,
}: NavActionsProps) {
  const notifRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen, setNotifOpen]);

  // Close mobile menu on route change / resize
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleResize = () => { if (window.innerWidth > 1570) onToggleMobile(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen, onToggleMobile]);

  // Lock body scroll when mobile menu is open to prevent scroll chaining
  useEffect(() => {
    if (mobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [mobileMenuOpen]);

  return (
    <div className="nav-actions">
      {/* Theme picker (desktop) */}
      <div className="desktop-only">
        <ThemePicker currentTheme={theme} onThemeChange={onChangeTheme} />
      </div>
      <button className="nav-search-btn desktop-only" onClick={onSearchOpen} title="Search" aria-label="Open search">
        <i className="fa-solid fa-search" />
      </button>
      {!user && (
        <>
          <button className="nav-auth-btn desktop-only" onClick={() => onOpenAuth('signin')}>Sign In</button>
          <button className="nav-auth-btn nav-auth-btn-filled desktop-only" onClick={() => onOpenAuth('signup')}>Sign Up</button>
        </>
      )}
      {user && (
        <>
          {/* Notification Bell */}
          <div ref={notifRef} className="desktop-only" style={{ position: 'relative' }}>
            <button className="nav-search-btn" onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifications(); }} title="Notifications" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`} style={{ position: 'relative' }}>
              <i className="fa-solid fa-bell" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', fontSize: 9, fontWeight: 900, color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card-bg)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div className="notif-panel" style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 340, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 10001, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>Notifications</span>
                  {unreadCount > 0 && <button onClick={async () => { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readAll: true }) }); loadNotifications(); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Mark all read</button>}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}><i className="fa-solid fa-bell-slash" style={{ display: 'block', fontSize: 24, marginBottom: 10, opacity: 0.3 }}></i>No notifications</div>
                  ) : notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className={`notif-item${n.read ? '' : ' notif-unread'}`} onClick={async () => { if (!n.read) { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId: n.id }) }); loadNotifications(); } }} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: n.read ? 'transparent' : 'color-mix(in srgb, var(--accent) 5%, transparent)', transition: 'background 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                        <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 12, color: 'var(--text-light)' }}>{n.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, paddingLeft: n.read ? 0 : 14 }}>{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* User Avatar */}
          <button className="nav-user-btn desktop-only" onClick={() => setDashboardOpen(true)}>
            <span className="nav-user-avatar">
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : user.name.charAt(0).toUpperCase()
              }
            </span>
            <span className="nav-user-name">{user.name.split(' ')[0]}</span>
          </button>
          <button className="nav-logout-btn desktop-only" onClick={onLogout}>Logout</button>
        </>
      )}
      {!user && (
        <div className="nav-inline-auth">
          <button className="nav-auth-btn-inline" onClick={() => onOpenAuth('signin')}>Sign In</button>
          <button className="nav-auth-btn-inline nav-auth-btn-inline-filled" onClick={() => onOpenAuth('signup')}>Sign Up</button>
        </div>
      )}
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
  onAvatarUploaded?: (avatarUrl: string) => void;
}

export function ProfileModal({
  open, onClose, user,
  profileName, setProfileName, profileUsername, setProfileUsername, profilePhone, setProfilePhone, profileCompany, setProfileCompany,
  profileSaving, avatarUploading, onProfileSave, onAvatarUpload, onAvatarUploaded,
}: ProfileModalProps) {

  // All hooks MUST be called before any conditional returns (React Rules of Hooks)
  const profileRef = useRef<HTMLDivElement>(null);
  useFocusTrap(profileRef, open);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; confirmLabel: string; danger: boolean; icon: string; onConfirm: () => void }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, icon: 'fa-solid fa-exclamation-triangle', onConfirm: () => {} });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'password'>('confirm');

  // Avatar crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // When user selects a file, open crop modal instead of uploading directly
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.toast({ title: 'File too large', description: 'Avatar must be under 2MB', variant: 'destructive' });
      return;
    }
    setCropImageFile(file);
    setCropModalOpen(true);
    // Reset the file input so the same file can be re-selected
    e.target.value = '';
  }, [toast]);

  // When crop is confirmed, upload the cropped blob
  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    setCropModalOpen(false);
    if (!user) return;
    try {
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');
      const res = await fetch('/api/user/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        toast.toast({ title: 'Avatar updated!' });
        if (onAvatarUploaded) onAvatarUploaded(data.avatarUrl);
      } else {
        toast.toast({ title: 'Upload failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast.toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    }
  }, [user, toast, onAvatarUploaded]);

  const openConfirm = (title: string, message: string, onConfirm: () => void, opts?: { confirmLabel?: string; danger?: boolean; icon?: string }) => {
    setConfirmModal({
      open: true, title, message,
      confirmLabel: opts?.confirmLabel || 'Confirm',
      danger: opts?.danger !== undefined ? opts.danger : false,
      icon: opts?.icon || 'fa-solid fa-exclamation-triangle',
      onConfirm,
    });
  };

  // Guard clause AFTER all hooks (React Rules of Hooks)
  if (!open || !user) return null;

  return (
    <div ref={profileRef} role="dialog" aria-modal="true" aria-label="Dashboard" className="dashboard-modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 24, fontWeight: 900, overflow: 'hidden' }}>
                  {user.avatar
                    ? <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{user.name.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <label style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--dark-gray)' }}>
                  <i className={`fa-solid fa-${avatarUploading ? 'spinner fa-spin' : 'camera'}`} style={{ fontSize: 10, color: 'var(--text-light)' }}></i>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 2 }}>{user.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{user.email}</div>
                <div style={{ marginTop: 4, padding: '2px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'inline-block' }}>{user.role}</div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={onProfileSave}>
              <WaveInput label="Full Name" type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              <WaveInput label="Username" type="text" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
              <WaveInput label="Phone" type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
              <WaveInput label="Company" type="text" value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)} style={{ marginBottom: 24 }} />
              <button type="submit" disabled={profileSaving} className="submit-btn" style={{ width: '100%', opacity: profileSaving ? 0.6 : 1 }}>
                {profileSaving ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Saving...</> : <><i className="fa-solid fa-save" style={{ marginRight: 8 }}></i> Save Profile</>}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <a href="/" style={{ color: 'var(--primary-red)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-home" style={{ fontSize: 11 }} /> Go to Full Dashboard
                <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} />
              </a>
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              {deleteStep === 'confirm' ? (
                <button
                  onClick={() => { setDeletePassword(''); setDeleteStep('password'); }}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: 'var(--error-color)',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: 'pointer',
                    borderRadius: 2,
                  }}
                >
                  <i className="fa-solid fa-trash-alt" style={{ marginRight: 8 }}></i>Delete Account
                </button>
              ) : (
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: 16 }}>
                  <p style={{ color: 'var(--error-color)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: 6 }}></i>
                    This action is PERMANENT. Enter your password to confirm.
                  </p>
                  <WaveInput
                    label="Enter your password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    style={{ marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setDeleteStep('confirm'); setDeletePassword(''); }}
                      style={{ flex: 1, padding: '10px 0', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', borderRadius: 2 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!deletePassword) { alert('Please enter your password'); return; }
                        setDeleteLoading(true);
                        try {
                          const res = await fetch('/api/user/delete-account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: deletePassword }) });
                          if (res.ok) { window.location.href = '/'; }
                          else { const data = await res.json(); alert(data.error); }
                        } catch { alert('Failed to delete account'); }
                        setDeleteLoading(false);
                      }}
                      disabled={deleteLoading || !deletePassword}
                      style={{ flex: 1, padding: '10px 0', background: 'var(--error-color)', border: 'none', color: 'var(--text-light)', fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: deleteLoading ? 'not-allowed' : 'pointer', borderRadius: 2, opacity: deleteLoading ? 0.6 : 1 }}
                    >
                      {deleteLoading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Deleting...</> : <><i className="fa-solid fa-skull-crossbones" style={{ marginRight: 6 }}></i>Delete Forever</>}
                    </button>
                  </div>
                </div>
              )}
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
      <AvatarCropModal
        open={cropModalOpen}
        imageFile={cropImageFile}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
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
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
    </>
  );
}