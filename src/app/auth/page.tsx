'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { WaveInput } from '@/components/WaveInput';
import { Logo } from '@/components/Logo';
import VideoTemplate from '@/components/video/VideoTemplate';


function getPasswordStrength(pw: string): string {
  if (!pw) return '';
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

/**
 * Live password requirement checklist. Mirrors the server-side validation
 * in /api/auth/signup/route.ts (MIN_PASSWORD_LENGTH = 8, must contain
 * uppercase, lowercase, and a digit). Each rule lights up green + shows
 * a check icon as soon as the user satisfies it.
 */
const PASSWORD_REQUIREMENTS = [
  { key: 'length',    label: 'At least 8 characters',  test: (pw: string) => pw.length >= 8 },
  { key: 'uppercase', label: 'At least one uppercase letter (A-Z)', test: (pw: string) => /[A-Z]/.test(pw) },
  { key: 'lowercase', label: 'At least one lowercase letter (a-z)', test: (pw: string) => /[a-z]/.test(pw) },
  { key: 'number',    label: 'At least one number (0-9)', test: (pw: string) => /[0-9]/.test(pw) },
] as const;

function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="xf-pw-reqs">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const ok = req.test(password);
        return (
          <li key={req.key} className={ok ? 'xf-pw-req--ok' : ''}>
            <i className={ok ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'} aria-hidden="true" />
            <span>{req.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="xf-loader"><span /><span /><span /></div></div>}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const t = localStorage.getItem('x-foundry-theme') || 'oled';
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const initialMsg = searchParams.get('msg') || '';
  const [authMessage, setAuthMessage] = useState(initialMsg);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const [forgotStep, setForgotStep] = useState<'idle' | 'email' | 'code'>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [verificationStep, setVerificationStep] = useState<'idle' | 'pending'>('idle');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) router.push('/');
    }).catch(() => {});
  }, [router]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Welcome back!', description: 'You have been signed in.' });
        router.push('/');
      } else {
        toast({ title: 'Sign In Failed', description: data.error || 'Invalid credentials', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    }
    setLoginLoading(false);
  }, [loginEmail, loginPassword, router, toast]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          phone: signupPhone || undefined,
          company: signupCompany || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerificationEmail(signupEmail);
        setVerificationStep('pending');
        toast({ title: 'Account Created!', description: 'Please verify your email to continue.' });
      } else {
        toast({ title: 'Sign Up Failed', description: data.error || 'Could not create account', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    }
    setSignupLoading(false);
  }, [signupName, signupEmail, signupPassword, signupConfirmPassword, signupPhone, signupCompany, toast]);

  const handleForgotSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { toast({ title: 'Error', description: 'Please enter your email', variant: 'destructive' }); return; }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Code Sent!', description: 'If an account exists, a 6-digit code has been sent to your email.' });
        setForgotStep('code');
      } else { toast({ title: 'Error', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setForgotLoading(false);
  }, [forgotEmail, toast]);

  const handleResetSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) { toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' }); return; }
    if (newPassword.length < 8) { toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' }); return; }
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, code: resetCode, newPassword }) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Password Reset!', description: 'You can now sign in with your new password.' });
        setForgotStep('idle');
        setTab('signin');
      } else { toast({ title: 'Error', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setResetLoading(false);
  }, [forgotEmail, resetCode, newPassword, toast]);

  const handleVerifyEmail = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: verificationEmail, code: verificationCode }) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Email Verified!', description: 'Your account is now active. Signing you in...' });
        setVerificationStep('idle');
        setTimeout(() => router.push('/'), 1000);
      } else {
        toast({ title: 'Verification Failed', description: data.error, variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setVerificationLoading(false);
  }, [verificationEmail, verificationCode, router, toast]);

  const handleResendVerification = useCallback(async () => {
    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: verificationEmail }) });
      const data = await res.json();
      if (res.ok) toast({ title: 'Code Resent', description: 'A new verification code has been sent.' });
      else toast({ title: 'Error', description: data.error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setResendLoading(false);
  }, [verificationEmail, toast]);

  const subtitleText = verificationStep === 'pending'
    ? 'Verify your email to get started'
    : forgotStep !== 'idle'
      ? 'Reset your password'
      : tab === 'signin'
        ? 'Welcome back! Sign in to continue'
        : 'Create your account to get started';

  return (
    <>
      <title>Sign In | XFoundry</title>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--black)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="auth-left-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--black)',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 40% 30%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 50%), radial-gradient(ellipse at 60% 70%, color-mix(in srgb, var(--accent) 4%, transparent) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 1,
          }} />

          <div style={{ position: 'relative', width: '100%', maxWidth: 680, aspectRatio: '4/3', zIndex: 2 }}>
            <VideoTemplate />
          </div>

          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: 32, padding: '0 40px' }}>
            <h2 style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 'clamp(20px, 2.5vw, 28px)',
              fontWeight: 600,
              color: 'var(--text-light)',
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}>
              Build Something <span style={{
                background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, var(--text-light)), var(--accent))',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'v-gradient-shift 4s ease infinite',
              }}>Extraordinary</span>
            </h2>
            <p style={{
              color: 'var(--text-dim)',
              fontSize: 14,
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1.6,
              maxWidth: 400,
              margin: '0 auto',
            }}>
              Join XFoundry and unlock a world of digital possibilities.
            </p>
          </div>

          <div className="orb orb-1" style={{ opacity: 0.5 }} />
          <div className="orb orb-2" style={{ opacity: 0.4 }} />
        </div>
        <div className="auth-right-panel" style={{
          width: 520,
          minWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '40px 32px',
          background: 'color-mix(in srgb, var(--black) 92%, transparent)',
          borderLeft: '1px solid color-mix(in srgb, var(--accent) 8%, var(--border-color))',
          overflowY: 'auto',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 2 }}>
            <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <Logo style={{ height: 44, width: 'auto', filter: 'drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 50%, transparent))' }} />
            </a>
            <p style={{
              color: 'var(--text-dim)',
              fontSize: 14,
              marginTop: 12,
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1.6,
            }}>
              {subtitleText}
            </p>
            {authMessage && (
              <p style={{
                color: 'var(--accent)',
                fontSize: 13,
                marginTop: 8,
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 1.4,
                fontWeight: 600,
              }}>
                {authMessage}
              </p>
            )}
          </div>
          <div className="v-auth-card" style={{
            width: '100%',
            maxWidth: 420,
            background: 'color-mix(in srgb, var(--card-bg) 40%, transparent)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: `
              0 0 80px color-mix(in srgb, var(--accent) 8%, transparent),
              0 32px 64px rgba(0,0,0,0.25),
              inset 0 1px 0 color-mix(in srgb, rgba(255,255,255,0.08) 40%, transparent)
            `,
            position: 'relative',
            zIndex: 2,
          }}>
            {verificationStep === 'pending' ? (
              <div style={{ padding: '36px 28px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--v-gradient)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    boxShadow: '0 8px 32px color-mix(in srgb, var(--accent) 30%, transparent)',
                  }}>
                    <i className="fa-solid fa-envelope" style={{ fontSize: 28, color: '#fff' }}></i>
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6 }}>
                    A 6-digit code was sent to <strong style={{ color: 'var(--text-light)' }}>{verificationEmail}</strong>
                  </p>
                </div>
                <form onSubmit={handleVerifyEmail}>
                  <WaveInput label="6-Digit Code" type="text" value={verificationCode} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setVerificationCode(v); }} required maxLength={6} autoFocus style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }} />
                  <button type="submit" className="v-btn-primary" disabled={verificationLoading} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                    {verificationLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Verifying...</> : <><i className="fa-solid fa-check"></i> Verify Email</>}
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={handleResendVerification} disabled={resendLoading} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: resendLoading ? 'not-allowed' : 'pointer', opacity: resendLoading ? 0.6 : 1 }}>
                    {resendLoading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6, fontSize: 11 }}></i> Resending...</> : <><i className="fa-solid fa-redo" style={{ marginRight: 6, fontSize: 11 }}></i> Resend Code</>}
                  </button>
                </div>
              </div>
            ) : forgotStep === 'email' ? (
              <div style={{ padding: '36px 28px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    border: '2px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <i className="fa-solid fa-key" style={{ fontSize: 24, color: 'var(--accent)' }}></i>
                  </div>
                </div>
                <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 20, fontWeight: 600, color: 'var(--text-light)', marginBottom: 8, textAlign: 'center' }}>Forgot Password</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20, lineHeight: 1.6, textAlign: 'center' }}>
                  Enter the email associated with your account and we&apos;ll send you a verification code.
                </p>
                <form onSubmit={handleForgotSubmit}>
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
            ) : forgotStep === 'code' ? (
              <div style={{ padding: '36px 28px' }}>
                <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 20, fontWeight: 600, color: 'var(--text-light)', marginBottom: 8, textAlign: 'center' }}>Verify Code</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20, lineHeight: 1.6, textAlign: 'center' }}>
                  A 6-digit code was sent to <strong style={{ color: 'var(--text-light)' }}>{forgotEmail}</strong>. Enter it below with your new password.
                </p>
                <form onSubmit={handleResetSubmit}>
                  <WaveInput label="6-Digit Code" type="text" value={resetCode} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setResetCode(v); }} required maxLength={6} autoFocus style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }} />
                  <WaveInput label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  <button type="submit" className="v-btn-primary" disabled={resetLoading} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                    {resetLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Resetting...</> : <><i className="fa-solid fa-check"></i> Reset Password</>}
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={() => setForgotStep('idle')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}>
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: 6, fontSize: 11 }}></i> Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  borderBottom: '1px solid color-mix(in srgb, var(--accent) 10%, var(--border-color))',
                  background: 'color-mix(in srgb, var(--accent) 3%, transparent)',
                }}>
                  <button
                    onClick={() => setTab('signin')}
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: tab === 'signin' ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                      border: 'none',
                      borderBottom: tab === 'signin' ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                      color: tab === 'signin' ? 'var(--accent)' : 'var(--text-dim)',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk', sans-serif",
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setTab('signup')}
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: tab === 'signup' ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                      border: 'none',
                      borderBottom: tab === 'signup' ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                      color: tab === 'signup' ? 'var(--accent)' : 'var(--text-dim)',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk', sans-serif",
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    Create Account
                  </button>
                </div>

                <div style={{ padding: '28px 28px 32px' }}>
                  {tab === 'signin' ? (
                    <form onSubmit={handleLogin}>
                      <WaveInput label="Email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required autoFocus />
                      <WaveInput label="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                      <div style={{ textAlign: 'right', marginBottom: 8 }}>
                        <button type="button" onClick={() => { setForgotStep('email'); setForgotEmail(loginEmail); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', transition: 'opacity 0.2s' }}>
                          Forgot Password?
                        </button>
                      </div>
                      <button type="submit" className="v-btn-primary" disabled={loginLoading} style={{ marginTop: 0, width: '100%', justifyContent: 'center' }}>
                        {loginLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Signing In...</> : <><i className="fa-solid fa-arrow-right"></i> Sign In</>}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup}>
                      <WaveInput label="Full Name *" type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} required autoFocus />
                      <WaveInput label="Email *" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                      <WaveInput label="Password *" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required>
                        {signupPassword && (
                          <div className="xf-password-strength">
                            <div className={`xf-password-strength-bar ${getPasswordStrength(signupPassword)}`}></div>
                          </div>
                        )}
                        <PasswordRequirements password={signupPassword} />
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                    <span style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                    </span>
                    <button
                      onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "'Space Grotesk', sans-serif",
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {tab === 'signin' ? 'Create one' : 'Sign in'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <a href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-dim)',
            fontSize: 13,
            fontFamily: "'Space Grotesk', sans-serif",
            marginTop: 24,
            textDecoration: 'none',
            transition: 'color 0.2s',
            position: 'relative',
            zIndex: 2,
          }}>
            <i className="fa-solid fa-arrow-left" style={{ fontSize: 11 }} />
            Back to home
          </a>
        </div>
      </div>
    </>
  );
}
