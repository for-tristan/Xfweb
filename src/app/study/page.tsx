'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, NavActions, ProfileModal, HeroEffects } from '@/lib/PageModals';

export default function StudyFocusPage() {
  const { toast } = useToast();
  const router = useRouter();
  const {
    user, loading, theme, toggleTheme, scrolled, mobileMenuOpen, setMobileMenuOpen,
    searchOpen, setSearchOpen, searchQuery, setSearchQuery, filteredSearch,
    authModalOpen, setAuthModalOpen, authTab, setAuthTab, authMessage, openAuthModal,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginLoading, handleLogin,
    signupName, setSignupName, signupEmail, setSignupEmail, signupPassword, setSignupPassword,
    signupPhone, setSignupPhone, signupCompany, setSignupCompany, signupLoading, handleSignup,
    handleLogout, getPasswordStrength,
    dashboardOpen, setDashboardOpen,
    forgotStep, setForgotStep, forgotEmail, setForgotEmail, forgotLoading, handleForgotSubmit,
    resetCode, setResetCode, newPassword, setNewPassword, resetLoading, handleResetSubmit,
    notifOpen, setNotifOpen, notifications, unreadCount, loadNotifications, setNotifications, setUnreadCount,
    profileName, setProfileName, profileUsername, setProfileUsername, profilePhone, setProfilePhone, profileCompany, setProfileCompany,
    profileSaving, avatarUploading, handleAvatarUpload, handleProfileSave,
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
  const timerStartRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mx = useRef(0);
  const my = useRef(0);
  const rx = useRef(0);
  const ry = useRef(0);

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
      setTimerSeconds(Math.floor((Date.now() - timerStartRef.current) / 1000));
    }, 1000);
  };

  const handleStop = async () => {
    if (!timerRunning) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
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

  const handleReset = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
    setTimerSeconds(0);
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
        p.style.left = Math.random() * 100 + '%';
        p.style.width = p.style.height = Math.random() * 2 + 1 + 'px';
        p.style.animationDuration = (Math.random() * 20 + 15) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';
        c.appendChild(p);
      }
    }

    // Cursor
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (dotRef.current && ringRef.current && !isTouch && window.matchMedia('(hover: hover)').matches) {
      const onMove = (e: MouseEvent) => {
        mx.current = e.clientX;
        my.current = e.clientY;
        if (dotRef.current) { dotRef.current.style.left = mx.current + 'px'; dotRef.current.style.top = my.current + 'px'; }
      };
      document.addEventListener('mousemove', onMove);
      const animate = () => {
        rx.current += (mx.current - rx.current) * 0.12;
        ry.current += (my.current - ry.current) * 0.12;
        if (ringRef.current) { ringRef.current.style.left = rx.current + 'px'; ringRef.current.style.top = ry.current + 'px'; }
        requestAnimationFrame(animate);
      };
      animate();
      return () => { document.removeEventListener('mousemove', onMove); };
    } else if (dotRef.current && ringRef.current) {
      dotRef.current.style.display = 'none';
      ringRef.current.style.display = 'none';
    }

    // Scroll reveal
    const onScroll = () => {
      document.querySelectorAll('.reveal').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 100) el.classList.add('visible');
      });
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
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

  const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

  return (
    <>
      <title>Study Focus | X.Foundry</title>
      <meta name="description" content="Track your study sessions with X.Foundry Study Focus. Stay motivated with timers, stats, and a competitive leaderboard." />
      <meta property="og:title" content="Study Focus | X.Foundry" />
      <meta property="og:description" content="Track study time, compete on the leaderboard, and stay focused." />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="global-particles" id="globalParticles" />
      <div className="cursor-dot" ref={dotRef} id="cursorDot" />
      <div className="cursor-ring" ref={ringRef} id="cursorRing" />

      {/* SEARCH MODAL */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => router.push(link)} />

      {/* AUTH MODAL */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} tab={authTab} setTab={setAuthTab} message={authMessage}
        loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} loginLoading={loginLoading} onLogin={handleLogin}
        signupName={signupName} setSignupName={setSignupName} signupEmail={signupEmail} setSignupEmail={setSignupEmail} signupPassword={signupPassword} setSignupPassword={setSignupPassword}
        signupPhone={signupPhone} setSignupPhone={signupPhone} signupCompany={signupCompany} setSignupCompany={signupCompany} signupLoading={signupLoading} onSignup={handleSignup}
        getPasswordStrength={getPasswordStrength}
        forgotStep={forgotStep} setForgotStep={setForgotStep} forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} forgotLoading={forgotLoading} onForgotSubmit={handleForgotSubmit}
        resetCode={resetCode} setResetCode={setResetCode} newPassword={newPassword} setNewPassword={setNewPassword} resetLoading={resetLoading} onResetSubmit={handleResetSubmit}
      />

      {/* PROFILE MODAL */}
      <ProfileModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} profileName={profileName} setProfileName={setProfileName} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileCompany={profileCompany} setProfileCompany={profileCompany} profileSaving={profileSaving} avatarUploading={avatarUploading} onProfileSave={handleProfileSave} onAvatarUpload={handleAvatarUpload} />

      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
        <Link href="/" className="logo">X<span>.</span>Foundry</Link>
        <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`} id="navLinks">
          <li><Link href="/">Home</Link></li>
          <li><a href="/#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
          <li><a href="/#projects" onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }}>Projects</a></li>
          <li><a href="/#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Courses</a></li>
          <li><Link href="/study" className="active">Study</Link></li>
          {user && <li><Link href="/dashboard">Dashboard</Link></li>}
          <li><a href="/#team" onClick={(e) => { e.preventDefault(); scrollToSection('team'); }}>Team</a></li>
          <li><a href="/#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
          {user && user.role === 'admin' && (
            <li><Link href="/admin" style={{ color: '#dc143c' }} onClick={() => setMobileMenuOpen(false)}>Admin</Link></li>
          )}
        </ul>
        <NavActions theme={theme} onToggleTheme={toggleTheme} onSearchOpen={() => setSearchOpen(true)} user={user} onOpenAuth={openAuthModal} onLogout={handleLogout} mobileMenuOpen={mobileMenuOpen} onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />
      </nav>

      <div className="page-transition-enter">
        {/* HERO */}
        <section className="course-hero">
          <HeroEffects />
          <div className="hero-content">
            <h1>Study<br /><span>Focus</span></h1>
            <div className="hero-meta" style={{ marginTop: 24 }}>
              <div className="meta-pill"><i className="fas fa-trophy" /> Leaderboard</div>
              <div className="meta-pill"><i className="fas fa-chart-line" /> Weekly Stats</div>
            </div>
            <div className="breadcrumb" style={{ marginTop: 24 }}>
            <span style={{ color: 'var(--text-light)' }}>Home</span> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Study Focus</span>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="section" style={{ background: 'var(--black)' }}>
          <div className="container-max">
            <div className="study-focus-grid">

              {/* ── TIMER CARD ── */}
              <div className="reveal reveal-delay-1 study-card" style={{
                background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 4,
                padding: 32, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: timerRunning ? 'var(--primary-red)' : 'transparent', transition: 'background 0.3s' }} />
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-light)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fas fa-crosshairs" style={{ color: 'var(--primary-red)', fontSize: 16 }} />
                  Study Focus
                </h3>

                {!user && (
                  <div style={{ padding: '16px 20px', background: 'rgba(220,20,60,0.05)', border: '1px solid rgba(220,20,60,0.15)', borderRadius: 2, fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 24 }}>
                    <i className="fas fa-lock" style={{ marginRight: 8, color: 'var(--primary-red)' }} />
                    <span style={{ cursor: 'pointer', color: 'var(--primary-red)', fontWeight: 600 }} onClick={() => openAuthModal('signin', 'Sign in to start tracking study sessions')}>Sign in</span>
                    {' '}to start tracking your study time
                  </div>
                )}

                {/* Timer Display */}
                <div className="study-timer-padding" style={{
                  textAlign: 'center', padding: '36px 0',
                  borderBottom: timerRunning ? 'none' : '1px solid var(--border-color)',
                  marginBottom: timerRunning ? 0 : 24, position: 'relative',
                }}>
                  {timerRunning && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'radial-gradient(ellipse at center, rgba(220,20,60,0.04) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }} />
                  )}
                  <div className="study-timer-display" style={{
                    fontFamily: "'Orbitron', sans-serif", fontSize: 80, fontWeight: 900,
                    color: timerRunning ? 'var(--primary-red)' : 'var(--text-light)',
                    letterSpacing: 6, lineHeight: 1, transition: 'color 0.3s',
                    textShadow: timerRunning ? '0 0 60px rgba(220,20,60,0.3)' : 'none',
                    position: 'relative',
                  }}>
                    {formatTimer(timerSeconds)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 16, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {timerRunning ? 'Session in progress...' : 'Ready to focus'}
                  </div>
                  {timerRunning && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-red)',
                          animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                        }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Control Buttons */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, marginTop: timerRunning ? 24 : 0, flexWrap: 'wrap' }}>
                  {!timerRunning ? (
                    <button
                      onClick={handleStart}
                      disabled={!user}
                      style={{
                        flex: 1, padding: '16px 24px', borderRadius: 2, border: '1px solid var(--primary-red)',
                        background: user ? 'rgba(220,20,60,0.1)' : 'rgba(220,20,60,0.05)',
                        color: user ? 'var(--primary-red)' : 'var(--text-dim)',
                        fontSize: 14, fontWeight: 700, cursor: user ? 'pointer' : 'not-allowed',
                        fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      }}
                      onMouseEnter={(e) => { if (user) e.currentTarget.style.background = 'rgba(220,20,60,0.2)'; }}
                      onMouseLeave={(e) => { if (user) e.currentTarget.style.background = 'rgba(220,20,60,0.1)'; }}
                    >
                      <i className="fas fa-play" style={{ fontSize: 12 }} />
                      Start Session
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleStop}
                        style={{
                          flex: 1, padding: '16px 24px', borderRadius: 2, border: '1px solid var(--primary-red)',
                          background: 'var(--primary-red)', color: '#fff',
                          fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        }}
                      >
                        <i className="fas fa-stop" style={{ fontSize: 12 }} />
                        Stop &amp; Save
                      </button>
                      <button
                        onClick={handleReset}
                        style={{
                          padding: '16px 20px', borderRadius: 2, border: '1px solid var(--border-color)',
                          background: 'var(--input-bg)', color: 'var(--text-dim)',
                          fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s',
                        }}
                        title="Reset Timer"
                      >
                        <i className="fas fa-redo" />
                      </button>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="study-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="study-stats-box" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
                      <i className="fas fa-calendar-day" style={{ marginRight: 6, color: 'var(--primary-red)' }} />Today
                    </div>
                    <div className="study-stats-value" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text-light)' }}>
                      {statsLoading ? <i className="fas fa-spinner fa-spin" style={{ fontSize: 14 }} /> : formatHours(todaySeconds)}
                    </div>
                  </div>
                  <div className="study-stats-box" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
                      <i className="fas fa-calendar-week" style={{ marginRight: 6, color: 'var(--primary-red)' }} />This Week
                    </div>
                    <div className="study-stats-value" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text-light)' }}>
                      {statsLoading ? <i className="fas fa-spinner fa-spin" style={{ fontSize: 14 }} /> : formatHours(weekSeconds)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── LEADERBOARD CARD ── */}
              <div className="reveal reveal-delay-2 study-card" style={{
                background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 4,
                padding: 32, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--primary-red), transparent)' }} />
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-light)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                 
                  Study LeaderBoard
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24, fontFamily: "'Space Grotesk', sans-serif" }}>Top learners in the last 30 days</p>

                <div className="study-leaderboard-scroll" style={{ flex: 1, maxHeight: 520, overflowY: 'auto' }}>
                  {leaderboardLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--primary-red)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Loading...</span>
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%', background: 'var(--input-bg)',
                        border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 16,
                      }}>
                        <i className="fas fa-chart-bar" style={{ fontSize: 24, color: 'var(--text-dim)', opacity: 0.4 }} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>No data yet</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', opacity: 0.6, textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>Start studying to appear on the leaderboard!</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {leaderboard.map((entry) => {
                        const isMe = user && entry.userId === user.id;
                        const rankBg = entry.rank <= 3 ? `${rankColors[entry.rank - 1]}15` : 'transparent';
                        const rankBorder = entry.rank <= 3 ? `${rankColors[entry.rank - 1]}30` : 'var(--border-color)';
                        const rankTextColor = entry.rank <= 3 ? rankColors[entry.rank - 1] : 'var(--text-dim)';

                        return (
                          <div
                            key={entry.userId}
                            className="study-leaderboard-entry"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                              borderRadius: 2, border: `1px solid ${isMe ? 'var(--primary-red)' : rankBorder}`,
                              background: isMe ? 'rgba(220,20,60,0.06)' : rankBg,
                              transition: 'all 0.2s',
                            }}
                          >
                            {/* Rank */}
                            <div className="study-leaderboard-rank" style={{
                              width: 32, height: 32, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 900,
                              background: entry.rank <= 3 ? `${rankColors[entry.rank - 1]}20` : 'var(--input-bg)',
                              color: rankTextColor, flexShrink: 0,
                              border: entry.rank <= 3 ? `1px solid ${rankColors[entry.rank - 1]}40` : '1px solid var(--border-color)',
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
                              background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              overflow: 'hidden', fontSize: 14, fontWeight: 700,
                              color: 'var(--text-dim)', fontFamily: "'Space Grotesk', sans-serif",
                            }}>
                              {entry.avatar
                                ? <img src={entry.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : entry.name.charAt(0).toUpperCase()
                              }
                            </div>

                            {/* Name & Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="study-leaderboard-name" style={{
                                fontSize: 14, fontWeight: 700, color: isMe ? 'var(--primary-red)' : 'var(--text-light)',
                                fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 6,
                              }}>
                                {entry.name}
                                {isMe && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(220,20,60,0.15)', color: 'var(--primary-red)', padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>You</span>}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>
                                <i className="fas fa-clock" style={{ marginRight: 4, fontSize: 9 }} />{entry.sessionsCount} {entry.sessionsCount === 1 ? 'session' : 'sessions'}
                              </div>
                            </div>

                            {/* Hours */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div className="study-leaderboard-hours" style={{
                                fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700,
                                color: entry.rank <= 3 ? rankColors[entry.rank - 1] : 'var(--text-light)',
                              }}>
                                {entry.totalHours}h
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'Space Grotesk', sans-serif" }}>total</div>
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
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo" style={{ display: 'inline-block', marginBottom: 20 }}>X<span>.</span>Foundry</Link>
            <p>Pioneering the future of technology through innovation, research, and education. Building solutions that transform industries and empower human potential.</p>
            <div className="footer-socials">
              <a href="https://www.linkedin.com/in/marwan-montaser-067054387/" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in" /></a>
              <a href="https://github.com/for-tristan" target="_blank" rel="noopener noreferrer"><i className="fab fa-github" /></a>
              <a href="https://discord.gg/TVRxJg3rcN" target="_blank" rel="noopener noreferrer"><i className="fab fa-discord" /></a>
            </div>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/#services">Services</Link></li>
              <li><Link href="/#projects">Projects</Link></li>
              <li><Link href="/#courses">Courses</Link></li>
              <li><Link href="/study">Study</Link></li>
              <li><Link href="/#team">Team</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <ul className="footer-links">
              <h4>Roadmap and practice</h4>
              <ul className="footer-links">
                <li><Link href="https://roadmap.sh">Developer Roadmap</Link></li>
                <li><Link href="https://neetcode.io/roadmap">NeetCode Roadmap</Link></li>
                <li><Link href="https://leetcode.com/">LeetCode</Link></li>
                <li><Link href="https://www.hackerrank.com/">HackerRank</Link></li>
                <li><Link href="https://www.codewars.com/">CodeWars</Link></li>
            </ul>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <ul className="footer-links">
              <li><a href="mailto:xfoundationcom@gmail.com">xfoundationcom@gmail.com</a></li>
              <li><a href="tel:+201234567890">+201234567890</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">&copy; 2026 X-Foundry. All Rights Reserved.</div>
      </footer>
    </>
  );
}
