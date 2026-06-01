'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCustomCursor } from '@/hooks/useCustomCursor';
import { WaveInput } from '@/components/WaveInput';
import { Logo } from '@/components/Logo';


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

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 2 + 1}px`,
    duration: `${Math.random() * 20 + 15}s`,
    delay: `${Math.random() * 15}s`,
  }));
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="xf-loader"><span /><span /><span /></div></div>}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const { toast } = useToast();
  const dotRef = useRef<HTMLDivElement>(null);
  useCustomCursor(dotRef);

  // Particles
  const [particles, setParticles] = useState<Array<{id:number;left:string;size:string;duration:string;delay:string}>>([]);
  useEffect(() => { setParticles(generateParticles(50)); }, []);

  // Theme — read from localStorage only, no picker on auth page
  useEffect(() => {
    const t = localStorage.getItem('x-foundry-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  // Tab — read from URL query param (?tab=signup)
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const initialMsg = searchParams.get('msg') || '';
  const [authMessage, setAuthMessage] = useState(initialMsg);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Forgot password
  const [forgotStep, setForgotStep] = useState<'idle' | 'email' | 'code'>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Verification
  const [verificationStep, setVerificationStep] = useState<'idle' | 'pending'>('idle');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Auth check — if user is already logged in, redirect to home
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

  return (
    <>
      <title>Sign In | XFoundry</title>

      {/* ═══ Particles (same as home page) ═══ */}
      {particles.length > 0 && (
        <div className="global-particles" style={{ zIndex: 9 }}>
          {particles.map((p) => (
            <div key={p.id} className="particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: p.duration, animationDelay: p.delay }} />
          ))}
        </div>
      )}

      {/* ═══ Custom Cursor ═══ */}
      <div className="cursor-dot" ref={dotRef} />

      {/* ═══ Full-page Vaulta Hero-style layout ═══ */}
      <div className="v-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle radial gradient overlay for depth */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, color-mix(in srgb, var(--accent-purple, var(--accent)) 6%, transparent) 0%, transparent 50%)', pointerEvents: 'none' }} />



        {/* ═══ Auth Card Container ═══ */}
        <div style={{ width: '100%', maxWidth: 460, padding: '20px', position: 'relative', zIndex: 10 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <Logo style={{ height: 48, width: 'auto', filter: 'drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 40%, transparent))' }} />
            </a>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 10, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.6 }}>
              {verificationStep === 'pending' ? 'Verify your email to get started' : forgotStep !== 'idle' ? 'Reset your password' : tab === 'signin' ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
            </p>
            {authMessage && (
              <p style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.4, fontWeight: 600 }}>
                {authMessage}
              </p>
            )}
          </div>

          {/* ═══ Glassmorphic Auth Card ═══ */}
          <div className="v-auth-card" style={{
            background: 'color-mix(in srgb, var(--black) 25%, transparent)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid color-mix(in srgb, var(--accent) 10%, var(--border-color))',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 0 60px color-mix(in srgb, var(--accent) 6%, transparent), 0 25px 50px rgba(0,0,0,0.3), inset 0 1px 0 color-mix(in srgb, rgba(255,255,255,0.06) 30%, transparent)',
          }}>
            {verificationStep === 'pending' ? (
              /* ═══ Verification ═══ */
              <div style={{ padding: '32px 28px' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '2px solid color-mix(in srgb, var(--accent) 25%, transparent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <i className="fa-solid fa-envelope" style={{ fontSize: 24, color: 'var(--accent)' }}></i>
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6 }}>
                    A 6-digit code was sent to <strong style={{ color: 'var(--text-light)' }}>{verificationEmail}</strong>
                  </p>
                </div>
                <form onSubmit={handleVerifyEmail}>
                  <WaveInput label="6-Digit Code" type="text" value={verificationCode} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setVerificationCode(v); }} required maxLength={6} autoFocus style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }} />
                  <button type="submit" className="v-btn-primary" disabled={verificationLoading} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
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
              /* ═══ Forgot Password — Email ═══ */
              <div style={{ padding: '32px 28px' }}>
                <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 20, fontWeight: 600, color: 'var(--text-light)', marginBottom: 8 }}>Forgot Password</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
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
              /* ═══ Forgot Password — Code ═══ */
              <div style={{ padding: '32px 28px' }}>
                <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: 20, fontWeight: 600, color: 'var(--text-light)', marginBottom: 8 }}>Verify Code</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                  A 6-digit code was sent to <strong style={{ color: 'var(--text-light)' }}>{forgotEmail}</strong>. Enter it below with your new password.
                </p>
                <form onSubmit={handleResetSubmit}>
                  <WaveInput label="6-Digit Code" type="text" value={resetCode} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setResetCode(v); }} required maxLength={6} autoFocus style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }} />
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
              /* ═══ Main Sign In / Sign Up ═══ */
              <>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid color-mix(in srgb, var(--accent) 10%, var(--border-color))' }}>
                  <button
                    onClick={() => setTab('signin')}
                    style={{ flex: 1, padding: '16px', background: tab === 'signin' ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent', border: 'none', borderBottom: tab === 'signin' ? '2px solid var(--accent)' : '2px solid transparent', color: tab === 'signin' ? 'var(--accent)' : 'var(--text-dim)', fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setTab('signup')}
                    style={{ flex: 1, padding: '16px', background: tab === 'signup' ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent', border: 'none', borderBottom: tab === 'signup' ? '2px solid var(--accent)' : '2px solid transparent', color: tab === 'signup' ? 'var(--accent)' : 'var(--text-dim)', fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Create Account
                  </button>
                </div>

                <div style={{ padding: '28px' }}>
                  {tab === 'signin' ? (
                    <form onSubmit={handleLogin}>
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
                    <form onSubmit={handleSignup}>
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
      </div>
    </>
  );
}
