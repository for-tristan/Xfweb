'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomCursor } from '@/hooks/useCustomCursor';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, ProfileModal, HeroEffects } from '@/lib/PageModals';
import { Navbar } from '@/components/Navbar';
import { Logo } from '@/components/Logo';
import GradualBlur from '@/components/GradualBlur';
import ScrollFadeSection from '@/components/ScrollFadeSection';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  courseLevel?: string;
  duration?: string;
  enrolledAt: string;
  status?: string;
}

interface TestResult {
  id: string;
  testTitle: string;
  moduleTitle: string;
  score: number;
  totalPoints: number;
  passed: boolean;
  submittedAt: string;
  timeLimit?: number;
}

interface ProgressEntry {
  id: string;
  courseId: string;
  courseName: string;
  completedModules: number[];
  totalModules: number;
  completionPercentage: number;
  lastAccessed: string;
}

interface StudyStats {
  todaySeconds: number;
  weekSeconds: number;
  allTimeSeconds: number;
  sessions: { date: string; duration: number }[];
}

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// ═══════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════

function StatCard({ label, value, icon, color, sub, compact }: { label: string; value: string | number; icon: string; color: string; sub?: string; compact?: boolean }) {
  return (
    <div style={{
      background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
      backdropFilter: 'blur(20px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
      border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
      borderRadius: 12,
      padding: compact ? '14px 14px' : '20px 22px', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.3s',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 10 : 14 }}>
        <div style={{
          width: compact ? 28 : 36, height: compact ? 28 : 36, borderRadius: 8,
          background: `color-mix(in srgb, ${color} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`fas ${icon}`} style={{ fontSize: compact ? 10 : 13, color }} />
        </div>
        <span style={{
          fontSize: compact ? 8 : 10, fontWeight: 700, color: 'var(--text-dim)',
          textTransform: 'uppercase', letterSpacing: 0.5,
          fontFamily: "var(--font-body)",
        }}>{label}</span>
      </div>
      <div style={{
        fontFamily: "var(--font-heading)", fontSize: compact ? 18 : 26, fontWeight: 700,
        color: 'var(--text-light)', lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: compact ? 9 : 11, color: 'var(--text-dim)', marginTop: 4, opacity: 0.7 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ pct, height = 6 }: { pct: number; height?: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped === 100 ? 'var(--success-color)' : clamped >= 50 ? 'var(--accent)' : 'var(--warning-color)';
  return (
    <div style={{ width: '100%', height, background: 'var(--input-bg)', borderRadius: height, overflow: 'hidden' }}>
      <div style={{
        width: `${clamped}%`, height: '100%', borderRadius: height,
        background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 80%, transparent))`,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

function SectionHeader({ icon, title, color = 'var(--accent)' }: { icon: string; title: string; color?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
    }}>
      <div style={{
        width: 4, height: 18, borderRadius: 8, background: color,
      }} />
      <h3 style={{
        fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700,
        color: 'var(--text-light)', letterSpacing: 0.5, margin: 0,
      }}>
        {title}
      </h3>
    </div>
  );
}

function WeekChart({ sessions }: { sessions: { date: string; duration: number }[] }) {
  const days = getLast7Days();
  const dayData = days.map(d => {
    const s = sessions.find(s => s.date === d);
    return { date: d, seconds: s ? s.duration : 0 };
  });

  const maxSecs = Math.max(...dayData.map(d => d.seconds), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, paddingTop: 10 }}>
      {dayData.map((d, i) => {
        const h = maxSecs > 0 ? Math.max(4, (d.seconds / maxSecs) * 80) : 4;
        const isToday = i === 6;
        return (
          <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600, fontFamily: "var(--font-body)" }}>
              {d.seconds > 0 ? formatDuration(d.seconds) : ''}
            </div>
            <div style={{
              width: '100%', height: h, borderRadius: 8,
              background: isToday
                ? 'linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 40%, transparent))'
                : d.seconds > 0
                  ? 'color-mix(in srgb, var(--accent) 20%, transparent)'
                  : 'var(--input-bg)',
              border: isToday ? '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' : '1px solid transparent',
              transition: 'height 0.5s ease',
              minWidth: 8,
            }} />
            <div style={{
              fontSize: 9, fontWeight: isToday ? 700 : 500,
              color: isToday ? 'var(--accent)' : 'var(--text-dim)',
              fontFamily: "var(--font-body)",
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {WEEKDAYS[new Date(d.date + 'T00:00:00').getDay()]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

// ── Mobile hook ──
function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return mobile;
}

export default function DashboardPage() {
  const router = useRouter();
  const isMobile = useIsMobile(768);
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

  // ── Data ──
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  useCustomCursor(dotRef);

  // ── Data Loading ──
  const loadedRef = useRef(false);

  const loadDashboardData = useCallback(async () => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;
    setDataLoading(true);
    try {
      const [enrollRes, testsRes, progressRes, studyRes] = await Promise.all([
        fetch('/api/courses/my-enrollments'),
        fetch('/api/courses/tests'),
        fetch('/api/courses/progress'),
        fetch('/api/study/session'),
      ]);

      if (enrollRes.ok) {
        const data = await enrollRes.json();
        setEnrollments(data.enrollments || []);
      }
      if (testsRes.ok) {
        const data = await testsRes.json();
        const results: TestResult[] = (data.tests || [])
          .filter((t: { attempt: { submittedAt: string | null } | null }) => t.attempt?.submittedAt)
          .map((t: { id: string; title: string; moduleTitle: string; timeLimit: number; attempt: { score: number; totalPoints: number; passed: boolean; submittedAt: string } }) => ({
            id: t.id,
            testTitle: t.title,
            moduleTitle: t.moduleTitle,
            score: t.attempt.score,
            totalPoints: t.attempt.totalPoints,
            passed: t.attempt.passed,
            submittedAt: t.attempt.submittedAt,
            timeLimit: t.timeLimit,
          }));
        setTestResults(results);
      }
      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgress(data.progress || []);
      }
      if (studyRes.ok) {
        const data = await studyRes.json();
        setStudyStats({
          todaySeconds: data.stats?.todaySeconds || 0,
          weekSeconds: data.stats?.weekSeconds || 0,
          allTimeSeconds: data.stats?.allTimeSeconds || 0,
          sessions: data.sessions || [],
        });
      }
    } catch { /* err */ }
    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Computed ──
  const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
  const testsPassed = testResults.filter(t => t.passed).length;
  const avgProgress = progress.length > 0
    ? Math.round(progress.reduce((a, p) => a + p.completionPercentage, 0) / progress.length)
    : 0;

  // Find best study day
  const bestDay = studyStats?.sessions?.length
    ? studyStats.sessions.reduce((best, s) => s.duration > (best?.duration || 0) ? s : best, studyStats.sessions[0])
    : null;

  // ── Status badge ──
  const statusBadge = (status?: string) => {
    const s = status || 'pending';
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'var(--warning-color)', label: 'Pending' },
      approved: { color: 'var(--success-color)', label: 'Active' },
      declined: { color: 'var(--error-color)', label: 'Declined' },
    };
    const c = config[s] || config.pending;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 999,
        background: `color-mix(in srgb, ${c.color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${c.color} 19%, transparent)`,
        color: c.color, fontSize: 9, fontWeight: 700,
        fontFamily: "var(--font-body)",
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: c.color }} />
        {c.label}
      </span>
    );
  };

  // ── Effects ──
  useEffect(() => {
    window.scrollTo(0, 0);
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

    const onScroll = () => {
      document.querySelectorAll('.reveal, .reveal-up, .reveal-scale, .reveal-left, .reveal-right').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight - 60 && rect.bottom > 60;
        if (inView) el.classList.add('visible');
        else el.classList.remove('visible');
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

  // ── Shared Navbar ──
  const renderNavbar = (activeLink?: string) => (loading || minLoading) ? null : (
    <Navbar activePage={activeLink || 'dashboard'} scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />
  );

  // ── Shared Modals ──
  const renderModals = () => (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => router.push(link)} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} tab={authTab} setTab={setAuthTab} message={authMessage}
        loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} loginLoading={loginLoading} onLogin={handleLogin}
        signupName={signupName} setSignupName={setSignupName} signupEmail={signupEmail} setSignupEmail={setSignupEmail} signupPassword={signupPassword} setSignupPassword={setSignupPassword} signupConfirmPassword={signupConfirmPassword} setSignupConfirmPassword={setSignupConfirmPassword}
        signupPhone={signupPhone} setSignupPhone={setSignupPhone} signupCompany={signupCompany} setSignupCompany={setSignupCompany} signupLoading={signupLoading} onSignup={handleSignup}
        getPasswordStrength={getPasswordStrength}
        forgotStep={forgotStep} setForgotStep={setForgotStep} forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} forgotLoading={forgotLoading} onForgotSubmit={handleForgotSubmit}
        resetCode={resetCode} setResetCode={setResetCode} newPassword={newPassword} setNewPassword={setNewPassword} resetLoading={resetLoading} onResetSubmit={handleResetSubmit}
        verificationStep={verificationStep} setVerificationStep={setVerificationStep} verificationEmail={verificationEmail} verificationCode={verificationCode} setVerificationCode={setVerificationCode} verificationLoading={verificationLoading} onVerifyEmail={handleVerifyEmail} onResendVerification={handleResendVerification} resendLoading={resendLoading}
      />
      <ProfileModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} profileName={profileName} setProfileName={setProfileName} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileCompany={profileCompany} setProfileCompany={setProfileCompany} profileSaving={profileSaving} avatarUploading={avatarUploading} onProfileSave={handleProfileSave} onAvatarUpload={handleAvatarUpload} onAvatarUploaded={handleAvatarUploaded} />
    </>
  );

  // ── Loading skeleton ──
  const Skeleton = ({ w, h }: { w: string; h: string }) => (
    <div style={{ width: w, height: h, borderRadius: 12, background: 'var(--input-bg)', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
  );

  // ═══════════════════════════════════════════════════
  // RENDER: Not logged in
  // ═══════════════════════════════════════════════════
  if (!user && !loading) {
    return (
      <>
        <div className="global-particles" id="globalParticles" />
        <div className="cursor-dot" ref={dotRef} id="cursorDot" />
        <AuthGate loading={loading} minLoading={minLoading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to access your dashboard')} onSignUp={() => openAuthModal('signup')} />
        {renderModals()}
        {renderNavbar()}
        {!(loading || minLoading) && <ScrollFadeSection pin fadeDistance="60vh" zIndex={1}>
        <section className="course-hero" style={{ minHeight: 300 }}>
          <div className="hero-content">
            <h1 style={{ fontFamily: "var(--font-heading)" }}>Dashboard</h1>
            <p className="page-subtitle">Sign in to view your learning dashboard</p>
          </div>
        </section>
        </ScrollFadeSection>}
      </>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: Main Dashboard
  // ═══════════════════════════════════════════════════
  return (
    <>
      <title>Dashboard | XFoundry</title>
      <meta name="description" content="Your XFoundry learning dashboard. Track courses, tests, and study progress." />

      <div className="global-particles" id="globalParticles" />
      <div className="cursor-dot" ref={dotRef} id="cursorDot" />

      <AuthGate loading={loading} minLoading={minLoading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to access your dashboard')} onSignUp={() => openAuthModal('signup')} />
      {renderModals()}

      {/* NAVBAR */}
      {renderNavbar('dashboard')}

      {!(loading || minLoading) && <div className="page-transition-enter">
        {/* HERO — pinned with scroll fade */}
        <ScrollFadeSection pin fadeDistance="60vh" zIndex={1}>
        <section className="course-hero">
          <HeroEffects />
          <div className="hero-content">
            <h1 className="v-hero-title" style={{ fontFamily: "var(--font-heading)" }}>My<br /><span className="v-highlight">Dashboard</span></h1>
            <div className="hero-meta" style={{ marginTop: 24 }}>
              <div className="v-step-badge"><i className="fa-solid fa-chart-line" /> Progress</div>
              <div className="v-step-badge"><i className="fa-solid fa-crosshairs" /> Study</div>
            </div>
            <div className="breadcrumb" style={{ marginTop: 24 }}>
              <Link href="/" style={{ color: 'var(--text-dim)' }}>Home</Link> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Dashboard</span>
            </div>
          </div>
          <div className="scroll-indicator" style={{ left: 0, right: 0 }}>
            <span>Scroll</span>
            <div className="scroll-line"></div>
          </div>
        </section>
        </ScrollFadeSection>

        {/* MAIN CONTENT */}
        <section style={{ background: 'var(--black)', marginTop: '-15vh', padding: '0 60px 160px', position: 'relative', zIndex: 2 }}>
          <div className="container-max" style={{ paddingLeft: isMobile ? 16 : undefined, paddingRight: isMobile ? 16 : undefined }}>

            {/* Welcome */}
            <div className="reveal-up" style={{ marginBottom: isMobile ? 24 : 36, display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
              <div style={{
                width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: '50%',
                background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', fontSize: 16, fontWeight: 700,
                overflow: 'hidden', flexShrink: 0,
              }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user?.name.charAt(0).toUpperCase()
                }
              </div>
              <div>
                <h2 style={{
                  fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: isMobile ? 15 : 18,
                  color: 'var(--text-light)', margin: 0, letterSpacing: 0.5,
                }}>
                  Welcome back, {user?.name.split(' ')[0]}
                </h2>
                <p style={{
                  fontSize: 12, color: 'var(--text-dim)', margin: '2px 0 0',
                  fontFamily: "var(--font-body)",
                }}>
                  {user?.email}
                </p>
              </div>
            </div>

            {/* ─── 4 OVERVIEW CARDS ─── */}
            <div className="reveal-up reveal-delay-1" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? 8 : 12, marginBottom: isMobile ? 24 : 36,
            }}>
              <StatCard
                label="Enrolled"
                value={dataLoading ? '...' : approvedEnrollments.length}
                icon="fa-book-open"
                color="var(--accent)"
                sub={`${enrollments.length} total`}
                compact={isMobile}
              />
              <StatCard
                label="Avg Progress"
                value={dataLoading ? '...' : `${avgProgress}%`}
                icon="fa-chart-pie"
                color="var(--accent-purple)"
                sub={`${progress.length} course${progress.length !== 1 ? 's' : ''}`}
                compact={isMobile}
              />
              <StatCard
                label="Tests Passed"
                value={dataLoading ? '...' : testsPassed}
                icon="fa-check-double"
                color="var(--success-color)"
                sub={`of ${testResults.length} taken`}
                compact={isMobile}
              />
              <StatCard
                label="Study Time"
                value={dataLoading ? '...' : formatDuration(studyStats?.weekSeconds || 0)}
                icon="fa-clock"
                color="var(--warning-color)"
                sub="this week"
                compact={isMobile}
              />
            </div>

            {/* ─── MAIN GRID: Courses + Tests ─── */}
            <div style={{
              display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: isMobile ? 16 : 20, marginBottom: isMobile ? 24 : 36,
            }}>

              {/* Enrolled Courses */}
              <div className="reveal-up reveal-delay-2" style={{
                background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
                backdropFilter: 'blur(20px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                borderRadius: 12, padding: isMobile ? '18px 14px' : '24px 22px',
              }}>
                <SectionHeader icon="fa-book-open" title="ENROLLED COURSES" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dataLoading ? (
                    <>
                      <Skeleton w="100%" h="60px" />
                      <Skeleton w="100%" h="60px" />
                    </>
                  ) : approvedEnrollments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                      <i className="fa-solid fa-book-open" style={{ fontSize: 28, color: 'var(--text-dim)', opacity: 0.2, display: 'block', marginBottom: 12 }} />
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0 }}>
                        No active courses yet.
                      </p>
                      <Link href="/#courses" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>
                        Browse Programs <i className="fa-solid fa-arrow-right" style={{ fontSize: 10, marginLeft: 4 }} />
                      </Link>
                    </div>
                  ) : approvedEnrollments.map((e) => {
                    const prog = progress.find(p => p.courseId === e.courseId);
                    const pct = prog?.completionPercentage || 0;
                    const isComplete = pct === 100;
                    return (
                      <Link key={e.id} href={`/courses/${e.courseId}`} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                        background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                        backdropFilter: 'blur(12px) saturate(1.4)',
                        WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                        border: isComplete
                          ? '1px solid rgba(34,197,94,0.2)'
                          : '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                        borderRadius: 8, textDecoration: 'none', color: 'inherit',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                        onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 25%, transparent)'; ev.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 3%, transparent)'; }}
                        onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = isComplete ? 'rgba(34,197,94,0.2)' : 'color-mix(in srgb, var(--text-light) 10%, transparent)'; ev.currentTarget.style.background = 'color-mix(in srgb, var(--card-bg) 50%, transparent)'; }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: isComplete ? 'rgba(34,197,94,0.1)' : 'color-mix(in srgb, var(--accent) 8%, transparent)',
                          border: isComplete ? '1px solid rgba(34,197,94,0.2)' : '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <i className={`fas ${isComplete ? 'fa-check' : 'fa-book'}`}
                            style={{ fontSize: 13, color: isComplete ? 'var(--success-color)' : 'var(--accent)' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                              fontSize: 13, fontWeight: 700, color: 'var(--text-light)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {e.courseName}
                            </span>
                            {statusBadge(e.status)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <ProgressBar pct={pct} height={4} />
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: pct === 100 ? 'var(--success-color)' : 'var(--text-dim)',
                              fontFamily: "var(--font-body)", minWidth: 32, textAlign: 'right',
                            }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        {isComplete && (
                          <a
                            href={`/api/courses/certificate?courseId=${e.courseId}&format=pdf`}
                            target="_blank" rel="noopener noreferrer"
                            onClick={(ev) => ev.stopPropagation() }
                            style={{
                              width: 30, height: 30, borderRadius: 8,
                              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, textDecoration: 'none',
                              transition: 'background 0.2s',
                            }}
                            title="Download Certificate"
                            onMouseEnter={(ev) => { ev.currentTarget.style.background = 'rgba(34,197,94,0.2)'; }}
                            onMouseLeave={(ev) => { ev.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
                          >
                            <i className="fa-solid fa-download" style={{ fontSize: 10, color: 'var(--success-color)' }} />
                          </a>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Recent Test Results */}
              <div className="reveal-up reveal-delay-3" style={{
                background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
                backdropFilter: 'blur(20px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                borderRadius: 12, padding: isMobile ? '18px 14px' : '24px 22px',
              }}>
                <SectionHeader icon="fa-clipboard-check" title="TEST RESULTS" color="var(--success-color)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dataLoading ? (
                    <>
                      <Skeleton w="100%" h="68px" />
                      <Skeleton w="100%" h="68px" />
                    </>
                  ) : testResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                      <i className="fa-solid fa-clipboard-check" style={{ fontSize: 28, color: 'var(--text-dim)', opacity: 0.2, display: 'block', marginBottom: 12 }} />
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0 }}>
                        No test results yet.
                      </p>
                    </div>
                  ) : testResults.slice(0, 5).map((t) => {
                    const pct = t.totalPoints > 0 ? Math.round((t.score / t.totalPoints) * 100) : 0;
                    const date = new Date(t.submittedAt);
                    const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <div key={t.id} style={{
                        padding: '12px 14px',
                        background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                        backdropFilter: 'blur(12px) saturate(1.4)',
                        WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                        border: `1px solid ${t.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                        borderRadius: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{
                            fontSize: 13, fontWeight: 700, color: 'var(--text-light)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: 8,
                          }}>
                            {t.testTitle}
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 999, fontSize: 8, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: 0.5,
                            background: t.passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                            color: t.passed ? 'var(--success-color)' : 'var(--error-color)',
                            border: `1px solid ${t.passed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                            flexShrink: 0,
                          }}>
                            {t.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                            {t.moduleTitle} &middot; {timeStr}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                            <span style={{
                              fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700,
                              color: t.passed ? 'var(--success-color)' : 'var(--error-color)',
                            }}>
                              {pct}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>%</span>
                            <span style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 6, opacity: 0.6 }}>
                              ({t.score}/{t.totalPoints})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── STUDY ACTIVITY ─── */}
            <div className="reveal-up reveal-delay-4" style={{
              background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
              backdropFilter: 'blur(20px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
              border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
              borderRadius: 12, padding: isMobile ? '18px 14px' : '24px 22px',
            }}>
              <SectionHeader icon="fa-fire" title="STUDY ACTIVITY" color="var(--warning-color)" />

              {dataLoading ? (
                <Skeleton w="100%" h="140px" />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: isMobile ? 20 : 28 }}>
                  {/* Weekly Chart */}
                  <div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16,
                      fontFamily: "var(--font-body)",
                    }}>
                      This Week
                    </div>
                    <WeekChart sessions={studyStats?.sessions || []} />
                  </div>

                  {/* Study Stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Today', value: formatDuration(studyStats?.todaySeconds || 0), icon: 'fa-sun', color: 'var(--warning-color)' },
                      { label: 'This Week', value: formatDuration(studyStats?.weekSeconds || 0), icon: 'fa-calendar-week', color: 'var(--accent)' },
                      { label: 'Best Day', value: bestDay ? formatDuration(bestDay.duration) : '0s', sub: bestDay ? getDayLabel(bestDay.date) : undefined, icon: 'fa-trophy', color: 'var(--success-color)' },
                      { label: 'All Time', value: formatDuration(studyStats?.allTimeSeconds || 0), icon: 'fa-infinity', color: 'var(--accent-purple)' },
                    ].map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                        backdropFilter: 'blur(12px) saturate(1.4)',
                        WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                        border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                        borderRadius: 8,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: `color-mix(in srgb, ${s.color} 7%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className={`fas ${s.icon}`} style={{ fontSize: 10, color: s.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                            {s.label}
                          </div>
                          {s.sub && (
                            <div style={{ fontSize: 9, color: 'var(--text-dim)', opacity: 0.6, marginTop: 1 }}>
                              {s.sub}
                            </div>
                          )}
                        </div>
                        <span style={{
                          fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700,
                          color: 'var(--text-light)',
                        }}>
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>
      </div>}

      {/* FOOTER */}
      {!(loading || minLoading) &&<footer className="v-footer" style={{ marginTop: 80 }}>
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
