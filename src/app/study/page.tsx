'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCustomCursor } from '@/hooks/useCustomCursor';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, ProfileModal, HeroEffects } from '@/lib/PageModals';
import { Navbar } from '@/components/Navbar';
import { Logo } from '@/components/Logo';
import ConfirmModal from '@/components/ConfirmModal';
import GradualBlur from '@/components/GradualBlur';

export default function StudyFocusPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { const check = () => setIsMobile(window.innerWidth < 768); check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check); }, []);
  const {
    user, loading, minLoading, theme, toggleTheme, changeTheme, scrolled, mobileMenuOpen, setMobileMenuOpen,
    searchOpen, setSearchOpen, searchQuery, setSearchQuery, filteredSearch,
    authModalOpen, setAuthModalOpen, authTab, setAuthTab, authMessage, openAuthModal,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginLoading, handleLogin,
    signupName, setSignupName, signupEmail, setSignupEmail, signupPassword, setSignupPassword, signupConfirmPassword, setSignupConfirmPassword,
    signupPhone, setSignupPhone, signupCompany, setSignupCompany, signupLoading, handleSignup,
    handleLogout, getPasswordStrength,
    dashboardOpen, setDashboardOpen,
    forgotStep, setForgotStep, forgotEmail, setForgotEmail, forgotLoading, handleForgotSubmit,
    resetCode, setResetCode, newPassword, setNewPassword, resetLoading, handleResetSubmit,
    verificationStep, setVerificationStep, verificationEmail, verificationCode, setVerificationCode,
    verificationLoading, handleVerifyEmail, handleResendVerification, resendLoading,
    notifOpen, setNotifOpen, notifications, unreadCount, loadNotifications, setNotifications, setUnreadCount,
    profileName, setProfileName, profileUsername, setProfileUsername, profilePhone, setProfilePhone, profileCompany, setProfileCompany,
    profileSaving, avatarUploading, handleAvatarUpload, handleAvatarUploaded, handleProfileSave,
    scrollToSection,
  } = usePageFeatures();

  // ── Study Timer State ──
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [weekSeconds, setWeekSeconds] = useState(0);
  const [leaderboard, setLeaderboard] = useState<Array<{
    rank: number;
    userId: string;
    name: string;
    avatar: string | null;
    totalSeconds: number;
    totalHours: number;
    sessionsCount: number;
  }>>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const timerStartRef = useRef<number | null>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const dotRef = useRef<HTMLDivElement>(null);
  useCustomCursor(dotRef);

  // ── Helpers ──
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatHours = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // ── API Calls ──
  const leaderboardLoadedRef = useRef(false);
  const statsLoadedRef = useRef(false);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch('/api/study/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch { /* err */ }
    setLeaderboardLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const res = await fetch('/api/study/session');
      if (res.ok) {
        const data = await res.json();
        setTodaySeconds(data.stats.todaySeconds);
        setWeekSeconds(data.stats.weekSeconds);
      }
    } catch { /* err */ }
    setStatsLoading(false);
  }, [user]);

  const handleStart = async () => {
    if (!user) { openAuthModal('signin', 'Please sign in to start a study session'); return; }
    try {
      await fetch('/api/study/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
    } catch { /* err */ }
    timerStartRef.current = Date.now();
    setTimerRunning(true);
    setTimerSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      if (timerStartRef.current) setTimerSeconds(Math.floor((Date.now() - timerStartRef.current) / 1000));
    }, 1000);
  };

  const handleStop = async () => {
    if (!timerRunning) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const elapsed = Math.floor((Date.now() - (timerStartRef.current || Date.now())) / 1000);
    setTimerRunning(false);
    if (elapsed > 0 && user) {
      try {
        await fetch('/api/study/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop', duration: elapsed }),
        });
        loadStats();
        loadLeaderboard();
        toast({ title: 'Session Saved!', description: `${formatHours(elapsed)} of study time recorded` });
      } catch { /* err */ }
    }
  };

  const [atBottom, setAtBottom] = useState(false);
  const [resetConfirm, setResetConfirm] = useState({ open: false });

  const handleReset = () => {
    if (timerSeconds > 60) {
      setResetConfirm({ open: true });
      return;
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
    setTimerSeconds(0);
    timerStartRef.current = null;
  };

  // ── Effects ──
  useEffect(() => {
    window.scrollTo(0, 0);
    // Particles
    const c = document.getElementById('globalParticles');
    if (c) {
      for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.setAttribute('data-particle', 'true');
        p.style.left = Math.random() * 100 + '%';
        p.style.width = p.style.height = Math.random() * 2 + 1 + 'px';
        p.style.animationDuration = (Math.random() * 20 + 15) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';
        c.appendChild(p);
      }
    }

    // Scroll reveal
    const onScroll = () => {
      document.querySelectorAll('.reveal').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 100) el.classList.add('visible');
      });
    };
    const checkBottom = () => setAtBottom(window.innerHeight + window.scrollY >= document.body.scrollHeight - 80);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('scroll', checkBottom);
    onScroll();
    checkBottom();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', checkBottom);
      // Remove ALL particles from container (not just our array)
      const container = document.getElementById('globalParticles');
      if (container) {
        container.querySelectorAll('[data-particle]').forEach(p => p.remove());
      }
    };
  }, []);

  // Load leaderboard once on mount
  useEffect(() => {
    if (!leaderboardLoadedRef.current) {
      leaderboardLoadedRef.current = true;
      (async () => {
        setLeaderboardLoading(true);
        try {
          const res = await fetch('/api/study/leaderboard');
          if (res.ok) {
            const data = await res.json();
            setLeaderboard(data.leaderboard);
          }
        } catch { /* err */ }
        setLeaderboardLoading(false);
      })();
    }
  }, []);

  // Load stats once when user becomes available
  useEffect(() => {
    if (user && !statsLoadedRef.current) {
      statsLoadedRef.current = true;
      (async () => {
        setStatsLoading(true);
        try {
          const res = await fetch('/api/study/session');
          if (res.ok) {
            const data = await res.json();
            setTodaySeconds(data.stats.todaySeconds);
            setWeekSeconds(data.stats.weekSeconds);
          }
        } catch { /* err */ }
        setStatsLoading(false);
      })();
    }
  }, [user]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, []);

  // Fix timer drift when tab is backgrounded
  useEffect(() => {
    if (!timerRunning) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setTimerSeconds(Math.floor((Date.now() - (timerStartRef.current || Date.now())) / 1000));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [timerRunning]);

  const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

  return (
    <>
      <title>Study Focus | XFoundry</title>
      <meta name="description" content="Track your study sessions with XFoundry Study Focus. Stay motivated with timers, stats, and a competitive leaderboard." />
      <meta property="og:title" content="Study Focus | XFoundry" />
      <meta property="og:description" content="Track study time, compete on the leaderboard, and stay focused." />

      <div className="global-particles" id="globalParticles" />
      <div className="cursor-dot" ref={dotRef} id="cursorDot" />

      {/* SEARCH MODAL */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => router.push(link)} />

      {/* AUTH MODAL */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} tab={authTab} setTab={setAuthTab} message={authMessage}
        loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} loginLoading={loginLoading} onLogin={handleLogin}
        signupName={signupName} setSignupName={setSignupName} signupEmail={signupEmail} setSignupEmail={setSignupEmail} signupPassword={signupPassword} setSignupPassword={setSignupPassword} signupConfirmPassword={signupConfirmPassword} setSignupConfirmPassword={setSignupConfirmPassword}
        signupPhone={signupPhone} setSignupPhone={setSignupPhone} signupCompany={signupCompany} setSignupCompany={setSignupCompany} signupLoading={signupLoading} onSignup={handleSignup}
        getPasswordStrength={getPasswordStrength}
        forgotStep={forgotStep} setForgotStep={setForgotStep} forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} forgotLoading={forgotLoading} onForgotSubmit={handleForgotSubmit}
        resetCode={resetCode} setResetCode={setResetCode} newPassword={newPassword} setNewPassword={setNewPassword} resetLoading={resetLoading} onResetSubmit={handleResetSubmit}
        verificationStep={verificationStep} setVerificationStep={setVerificationStep} verificationEmail={verificationEmail} verificationCode={verificationCode} setVerificationCode={setVerificationCode} verificationLoading={verificationLoading} onVerifyEmail={handleVerifyEmail} onResendVerification={handleResendVerification} resendLoading={resendLoading}
      />

      {/* PROFILE MODAL */}
      <ProfileModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} profileName={profileName} setProfileName={setProfileName} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileCompany={profileCompany} setProfileCompany={setProfileCompany} profileSaving={profileSaving} avatarUploading={avatarUploading} onProfileSave={handleProfileSave} onAvatarUpload={handleAvatarUpload} onAvatarUploaded={handleAvatarUploaded} />

      {/* NAVBAR */}
      {!(loading || minLoading) && <Navbar activePage="study" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />}

      <AuthGate loading={loading} minLoading={minLoading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to access Study Focus')} onSignUp={() => openAuthModal('signup')} />

      {!(loading || minLoading) && <div className="page-transition-enter">
        {/* HERO */}
        <section className="course-hero">
          <HeroEffects />
          <div className="hero-content">
            <h1 style={{ fontFamily: "var(--font-heading)" }}>Study<br /><span className="v-highlight">Focus</span></h1>
            <div className="hero-meta" style={{ marginTop: 24 }}>
              <div className="v-step-badge"><i className="fa-solid fa-trophy" /> Leaderboard</div>
              <div className="v-step-badge"><i className="fa-solid fa-chart-line" /> Weekly Stats</div>
            </div>
            <div className="breadcrumb" style={{ marginTop: 24 }}>
            <Link href="/" style={{ color: 'var(--text-dim)' }}>Home</Link> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Study Focus</span>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="section" style={{ background: 'var(--black)' }}>
          <div className="container-max">
            <div className="study-focus-grid">

              {/* ── TIMER CARD ── */}
              <div className="reveal reveal-delay-1 study-card" style={{
                background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
                backdropFilter: 'blur(20px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                borderRadius: 12,
                padding: 24, position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', minHeight: 480,
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: timerRunning ? 'var(--accent)' : 'transparent', transition: 'background 0.3s' }} />
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: 'var(--text-light)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-crosshairs" style={{ color: 'var(--accent)', fontSize: 16 }} />
                  Study Focus
                </h3>

                {!user && (
                  <div style={{ padding: '16px 20px', background: 'color-mix(in srgb, var(--accent) 5%, transparent)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', fontFamily: "var(--font-body)", marginBottom: 24 }}>
                    <i className="fa-solid fa-lock" style={{ marginRight: 8, color: 'var(--accent)' }} />
                    <span style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }} onClick={() => openAuthModal('signin', 'Sign in to start tracking study sessions')}>Sign in</span>
                    {' '}to start tracking your study time
                  </div>
                )}

                {/* Timer Display — takes remaining space */}
                <div className="study-timer-padding" style={{
                  textAlign: 'center', padding: '20px 0',
                  position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  {timerRunning && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 4%, transparent) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }} />
                  )}
                  <div className="study-timer-display" style={{
                    fontFamily: "var(--font-heading)", fontSize: isMobile ? 32 : 56, fontWeight: 600,
                    color: timerRunning ? 'var(--accent)' : 'var(--text-light)',
                    letterSpacing: 0.5, lineHeight: 1, transition: 'color 0.3s',
                    textShadow: timerRunning ? '0 0 60px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
                    position: 'relative',
                  }}>
                    {formatTimer(timerSeconds)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 16, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: "var(--font-body)" }}>
                    {timerRunning ? 'Session in progress...' : 'Ready to focus'}
                  </div>
                  {timerRunning && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                          animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                        }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom section — controls + stats pinned to bottom */}
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)' }}>
                  {/* Control Buttons */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    {!timerRunning ? (
                      <button
                        onClick={handleStart}
                        disabled={!user}
                        style={{
                          flex: 1, padding: '12px 20px', borderRadius: 10, border: '0.5px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                          background: user ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'color-mix(in srgb, var(--accent) 5%, transparent)',
                          backdropFilter: 'blur(12px) saturate(1.4)',
                          WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                          color: user ? 'var(--accent)' : 'var(--text-dim)',
                          fontSize: 14, fontWeight: 700, cursor: user ? 'pointer' : 'not-allowed',
                          fontFamily: "var(--font-heading)", letterSpacing: 0.02, transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        }}
                        onMouseEnter={(e) => { if (user) e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 20%, transparent)'; }}
                        onMouseLeave={(e) => { if (user) e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)'; }}
                      >
                        <i className="fa-solid fa-play" style={{ fontSize: 12 }} />
                        Start Session
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleStop}
                          style={{
                            flex: 1, padding: '12px 20px', borderRadius: 10, border: '0.5px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                            background: 'var(--accent)', color: 'var(--text-light)',
                            fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            fontFamily: "var(--font-heading)", letterSpacing: 0.02, transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          }}
                        >
                          <i className="fa-solid fa-stop" style={{ fontSize: 12 }} />
                          Stop &amp; Save
                        </button>
                        <button
                          onClick={handleReset}
                          style={{
                            padding: '12px 16px', borderRadius: 10,
                            border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                            background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                            backdropFilter: 'blur(12px) saturate(1.4)',
                            WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                            color: 'var(--text-dim)',
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            fontFamily: "var(--font-heading)", letterSpacing: 0.02, transition: 'all 0.2s',
                          }}
                          title="Reset Timer"
                        >
                          <i className="fa-solid fa-redo" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="study-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="study-stats-box" style={{
                      background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                      backdropFilter: 'blur(12px) saturate(1.4)',
                      WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                      border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                      borderRadius: 12, padding: 16,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, fontFamily: "var(--font-body)" }}>
                        <i className="fa-solid fa-calendar-day" style={{ marginRight: 6, color: 'var(--accent)' }} />Today
                      </div>
                      <div className="study-stats-value" style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: 'var(--text-light)' }}>
                        {statsLoading ? <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 14 }} /> : formatHours(todaySeconds)}
                      </div>
                    </div>
                    <div className="study-stats-box" style={{
                      background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                      backdropFilter: 'blur(12px) saturate(1.4)',
                      WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                      border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                      borderRadius: 12, padding: 16,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, fontFamily: "var(--font-body)" }}>
                        <i className="fa-solid fa-calendar-week" style={{ marginRight: 6, color: 'var(--accent)' }} />This Week
                      </div>
                      <div className="study-stats-value" style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: 'var(--text-light)' }}>
                        {statsLoading ? <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 14 }} /> : formatHours(weekSeconds)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── LEADERBOARD CARD ── */}
              <div className="reveal reveal-delay-2 study-card" style={{
                background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
                backdropFilter: 'blur(20px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                borderRadius: 12,
                padding: 32, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: 'var(--text-light)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                 
                  Study LeaderBoard
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24, fontFamily: "var(--font-body)" }}>Top learners in the last 30 days</p>

                <div className="study-leaderboard-scroll" style={{ flex: 1, maxHeight: 520, overflowY: 'auto' }}>
                  {leaderboardLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Loading...</span>
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                        backdropFilter: 'blur(12px) saturate(1.4)',
                        WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                        border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 16,
                      }}>
                        <i className="fa-solid fa-chart-bar" style={{ fontSize: 24, color: 'var(--text-dim)', opacity: 0.4 }} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6, fontFamily: "var(--font-body)" }}>No data yet</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', opacity: 0.6, textAlign: 'center', fontFamily: "var(--font-body)" }}>Start studying to appear on the leaderboard!</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {leaderboard.map((entry) => {
                        const isMe = user && entry.userId === user.id;
                        const rankBg = entry.rank <= 3 ? `${rankColors[entry.rank - 1]}15` : 'transparent';
                        const rankBorder = entry.rank <= 3 ? `${rankColors[entry.rank - 1]}30` : 'color-mix(in srgb, var(--text-light) 10%, transparent)';
                        const rankTextColor = entry.rank <= 3 ? rankColors[entry.rank - 1] : 'var(--text-dim)';

                        return (
                          <div
                            key={entry.userId}
                            className="study-leaderboard-entry"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                              borderRadius: 12,
                              border: `0.5px solid ${isMe ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : rankBorder}`,
                              background: isMe ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : rankBg,
                              transition: 'all 0.2s',
                            }}
                          >
                            {/* Rank */}
                            <div className="study-leaderboard-rank" style={{
                              width: 32, height: 32, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 600,
                              background: entry.rank <= 3 ? `${rankColors[entry.rank - 1]}20` : 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                              color: rankTextColor, flexShrink: 0,
                              border: entry.rank <= 3 ? `1px solid ${rankColors[entry.rank - 1]}40` : '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                            }}>
                              {entry.rank <= 3 ? (
                                <i className={`fas ${entry.rank === 1 ? 'fa-crown' : entry.rank === 2 ? 'fa-medal' : 'fa-award'}`} />
                              ) : (
                                entry.rank
                              )}
                            </div>

                            {/* Avatar */}
                            <div className="study-leaderboard-avatar" style={{
                              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                              background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                              backdropFilter: 'blur(12px) saturate(1.4)',
                              WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                              border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              overflow: 'hidden', fontSize: 14, fontWeight: 700,
                              color: 'var(--text-dim)', fontFamily: "var(--font-body)",
                            }}>
                              {entry.avatar
                                ? <img src={entry.avatar} alt={`${entry.name}'s avatar`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : entry.name.charAt(0).toUpperCase()
                              }
                            </div>

                            {/* Name & Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="study-leaderboard-name" style={{
                                fontSize: 14, fontWeight: 700,
                                color: isMe ? 'var(--accent)' : 'var(--text-light)',
                                fontFamily: "var(--font-body)", display: 'flex', alignItems: 'center', gap: 6,
                              }}>
                                {entry.name}
                                {isMe && <span style={{ fontSize: 9, fontWeight: 700, background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.5 }}>You</span>}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, fontFamily: "var(--font-body)" }}>
                                <i className="fa-solid fa-clock" style={{ marginRight: 4, fontSize: 9 }} />{entry.sessionsCount} {entry.sessionsCount === 1 ? 'session' : 'sessions'}
                              </div>
                            </div>

                            {/* Hours */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div className="study-leaderboard-hours" style={{
                                fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700,
                                color: entry.rank <= 3 ? rankColors[entry.rank - 1] : 'var(--text-light)',
                              }}>
                                {entry.totalHours}h
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "var(--font-body)" }}>total</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>}

      <ConfirmModal
        open={resetConfirm.open}
        onClose={() => setResetConfirm({ open: false })}
        onConfirm={() => {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setTimerRunning(false);
          setTimerSeconds(0);
          timerStartRef.current = null;
          setResetConfirm({ open: false });
        }}
        title="Reset Study Timer?"
        message={`You've been studying for ${Math.floor(timerSeconds / 60)} minutes. Are you sure you want to reset?`}
        danger
      />

      {/* FOOTER */}
      {!(loading || minLoading) &&<footer className="v-footer">
  <div className="v-footer-grid">
    <div className="v-footer-brand">
      <Link href="/" className="nav-logo" style={{ display: 'inline-block', marginBottom: 20 }}><Logo className="nav-logo-img" style={{ height: 40 }} /></Link>
      <p>Pioneering the future of technology through innovation, research, and education. Building solutions that transform industries and empower human potential.</p>
      <div className="v-footer-socials">
        <a href="https://www.linkedin.com/in/marwan-montaser-067054387/" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-linkedin-in" /></a>
        <a href="https://github.com/for-tristan" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-github" /></a>
        <a href="https://discord.gg/TVRxJg3rcN" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-discord" /></a>
      </div>
    </div>
    <div className="v-footer-column">
      <h4>Quick Links</h4>
      <ul className="v-footer-links">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/#services">Services</Link></li>
        <li><Link href="/#courses">Programs</Link></li>
        <li><Link href="/games">Games</Link></li>
        <li><Link href="/study">Study</Link></li>
      </ul>
    </div>
    <div className="v-footer-column">
      <h4>Roadmap &amp; Practice</h4>
      <ul className="v-footer-links">
        <li><Link href="https://roadmap.sh">Developer Roadmap</Link></li>
        <li><Link href="https://neetcode.io/roadmap">NeetCode Roadmap</Link></li>
        <li><Link href="https://leetcode.com/">LeetCode</Link></li>
        <li><Link href="https://www.hackerrank.com/">HackerRank</Link></li>
        <li><Link href="https://www.codewars.com/">CodeWars</Link></li>
      </ul>
    </div>
    <div className="v-footer-column">
      <h4>Contact</h4>
      <ul className="v-footer-links">
        <li><a href="mailto:xfoundationcom@gmail.com">xfoundationcom@gmail.com</a></li>
        <li><a href="tel:+201234567890">+201234567890</a></li>
      </ul>
    </div>
  </div>
  <div className="v-footer-bottom">
    <p>&copy; {new Date().getFullYear()} X-Foundry. All Rights Reserved.</p>
  </div>
</footer>}

      {!atBottom && (
        <GradualBlur target="page" position="bottom" height="3.5rem" strength={1} divCount={6} curve="bezier" exponential={false} opacity={1} zIndex={50} />
      )}
    </>
  );
}
