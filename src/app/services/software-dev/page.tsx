'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, NavActions, ProfileModal, HeroEffects } from '@/lib/PageModals';

export default function SoftwareDevServicePage() {
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
  } = usePageFeatures();

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mx = useRef(0);
  const my = useRef(0);
  const rx = useRef(0);
  const ry = useRef(0);

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

  return (
    <>
      <title>Custom Software Development | X.Foundry</title>
      <meta name="description" content="End-to-end custom software development by X.Foundry. Web apps, mobile applications, APIs, DevOps, and enterprise solutions built for scale." />
      <meta property="og:title" content="Custom Software Development | X.Foundry" />
      <meta property="og:description" content="Web apps, mobile development, APIs, and enterprise solutions — built for scale, designed for impact." />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Custom Software Development | X.Foundry" />
      <meta name="twitter:description" content="Web apps, mobile development, APIs, and enterprise solutions — built for scale, designed for impact." />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="global-particles" id="globalParticles" />
      <div className="cursor-dot" ref={dotRef} id="cursorDot" />
      <div className="cursor-ring" ref={ringRef} id="cursorRing" />

      {/* AUTH GATE */}
      <AuthGate loading={loading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to access this page')} onSignUp={() => openAuthModal('signup')} />

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
      <ProfileModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} profileName={profileName} setProfileName={setProfileName} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileCompany={profileCompany} setProfileCompany={setProfileCompany} profileSaving={profileSaving} avatarUploading={avatarUploading} onProfileSave={handleProfileSave} onAvatarUpload={handleAvatarUpload} />

      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
        <Link href="/" className="logo">X<span>.</span>Foundry</Link>
        <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`} id="navLinks">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/#services" className="active">Services</Link></li>
          <li><Link href="/#projects">Projects</Link></li>
          <li><Link href="/#courses">Courses</Link></li>
          <li><Link href="/#team">Team</Link></li>
          <li><Link href="/#contact">Contact</Link></li>
          {user && user.role === 'admin' && (
            <li><Link href="/admin" style={{ color: '#dc143c' }} onClick={() => setMobileMenuOpen(false)}>Admin</Link></li>
          )}
        </ul>
        <NavActions theme={theme} onToggleTheme={toggleTheme} onSearchOpen={() => setSearchOpen(true)} user={user} onOpenAuth={openAuthModal} onLogout={handleLogout} mobileMenuOpen={mobileMenuOpen} onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />
      </nav>

      {/* HERO */}
      <div className="page-transition-enter">
      <section className="page-hero">
        <HeroEffects />
        <div className="page-hero-content">
          <h1 className="page-title"><br /><span style={{ color: 'var(--primary-red)' }}>Software Dev</span></h1>
          <p className="page-subtitle">End-to-end software development from concept to deployment. Web apps, mobile applications, APIs, and enterprise solutions.</p>
          <div className="breadcrumb">
            <span style={{ color: 'var(--text-light)' }}>Home</span> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Services</span> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Software Dev</span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="section">
        <div className="container-max">
          <div className="service-layout">
            <div className="service-main reveal">
              <h2>Built For Scale, Designed for Impact</h2>
              <p>We don&apos;t just write code — we engineer digital products that drive business growth. Our team of full-stack developers brings years of experience building everything from MVPs to enterprise-grade systems.</p>

              <h2 style={{ marginTop: 40 }}>Development Services</h2>
              <ul className="feature-list">
                <li><i className="fas fa-check-circle" /> <strong>Web Applications</strong> — React, Next.js, Vue.js, or custom solutions. SPA, SSR, or static sites optimized for performance.</li>
                <li><i className="fas fa-check-circle" /> <strong>Mobile Development</strong> — Native (iOS/Android) or cross-platform (React Native, Flutter) apps with polished UX.</li>
                <li><i className="fas fa-check-circle" /> <strong>API Development &amp; Integration</strong> — RESTful APIs, GraphQL endpoints, third-party integrations, and webhook systems.</li>
                <li><i className="fas fa-check-circle" /> <strong>Database Architecture</strong> — SQL, NoSQL, or serverless databases designed for your specific data needs.</li>
                <li><i className="fas fa-check-circle" /> <strong>DevOps &amp; Deployment</strong> — CI/CD pipelines, Docker containers, cloud infrastructure on AWS/GCP/Azure.</li>
                <li><i className="fas fa-check-circle" /> <strong>Maintenance &amp; Support</strong> — Ongoing updates, bug fixes, performance optimization, and feature additions.</li>
              </ul>

              <h2 style={{ marginTop: 40 }}>Our Tech Stack</h2>
              <p>We choose the right tool for each job. Our core expertise includes modern JavaScript frameworks, Python backends, cloud-native architectures, and everything in between.</p>
            </div>

            <aside className="sidebar reveal">
              <div className="sidebar-card">
                <h3>Quick Actions</h3>
                <Link href="https://roadmap.sh/software-architect" className="roadmap-link"><i className="fas fa-road" /><span>View Roadmap</span><i className="fas fa-arrow-right" style={{ marginLeft: 'auto' }} /></Link>
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 13, marginBottom: 12, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>Tech Stack</h3>
                  <div className="tech-stack">
                    <span className="tech-tag">React</span>
                    <span className="tech-tag">Next.js</span>
                    <span className="tech-tag">Node.js</span>
                    <span className="tech-tag">Python</span>
                    <span className="tech-tag">TypeScript</span>
                    <span className="tech-tag">Flutter</span>
                    <span className="tech-tag">Java</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content reveal">
          <h2>Have a Project in Mind?</h2>
          <p>Let&apos;s turn your idea into a production-ready product.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/#contact" onClick ={(e) => {
              e.preventDefault();
              router.push('/');
              setTimeout(() => {
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }, 300);
            }} className="btn btn-primary"><i className="fas fa-paper-plane" /> Get a Quote</Link>

            <Link href="/#projects" onClick={(e) => {
              e.preventDefault();
              router.push('/')
              setTimeout(() => {
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
              }, 300);
            }} className="btn btn-secondary"><i className="fas fa-eye" /> View Projects</Link>
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
              <li><Link href="/#team">Team</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Courses</h4>
            <ul className="footer-links">
              <li><Link href="/courses/ml-bootcamp">ML Bootcamp</Link></li>
              <li><Link href="/courses/linux-basics">Linux Basics</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <ul className="footer-links">
              <li><a href="mailto:xfoundationcom@gmail.com">xfoundationcom@gmail.com</a></li>
              <li><a href="tel:+201040394896">+201040394896</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">&copy; 2026 X-Foundry. All Rights Reserved.</div>
      </footer>
    </>
  );
}
