'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, NavActions, ProfileModal, HeroEffects } from '@/lib/PageModals';

interface ServiceFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  displayOrder: number;
}

interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  status: string;
  displayOrder: number;
  features: ServiceFeature[];
}

export default function DynamicServicePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

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

  const [service, setService] = useState<Service | null>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mx = useRef(0);
  const my = useRef(0);
  const rx = useRef(0);
  const ry = useRef(0);

  // Fetch service data
  useEffect(() => {
    if (!slug) return;
    setFetching(true);
    setNotFound(false);
    fetch('/api/services')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.services) {
          const match = data.services.find((s: Service) => s.slug === slug);
          if (match) {
            setService(match);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false));
  }, [slug]);

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

  // Loading skeleton
  if (fetching) {
    return (
      <>
        <div className="global-particles" id="globalParticles" />
        <div className="cursor-dot" ref={dotRef} id="cursorDot" />
        <div className="cursor-ring" ref={ringRef} id="cursorRing" />

        <AuthGate loading={loading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to access this page')} onSignUp={() => openAuthModal('signup')} />
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => router.push(link)} />
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} tab={authTab} setTab={setAuthTab} message={authMessage}
          loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} loginLoading={loginLoading} onLogin={handleLogin}
          signupName={signupName} setSignupName={setSignupName} signupEmail={signupEmail} setSignupEmail={setSignupEmail} signupPassword={signupPassword} setSignupPassword={setSignupPassword}
          signupPhone={signupPhone} setSignupPhone={signupPhone} signupCompany={signupCompany} setSignupCompany={signupCompany} signupLoading={signupLoading} onSignup={handleSignup}
          getPasswordStrength={getPasswordStrength}
          forgotStep={forgotStep} setForgotStep={setForgotStep} forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} forgotLoading={forgotLoading} onForgotSubmit={handleForgotSubmit}
          resetCode={resetCode} setResetCode={setResetCode} newPassword={newPassword} setNewPassword={setNewPassword} resetLoading={resetLoading} onResetSubmit={handleResetSubmit}
        />
        <ProfileModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} profileName={profileName} setProfileName={setProfileName} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileCompany={profileCompany} setProfileCompany={setProfileCompany} profileSaving={profileSaving} avatarUploading={avatarUploading} onProfileSave={handleProfileSave} onAvatarUpload={handleAvatarUpload} />

        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
          <Link href="/" className="logo">X<span>.</span>Foundry</Link>
          <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`} id="navLinks">
            <li><Link href="/">Home</Link></li>
            <li><a href="/#services" className="active" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
            <li><a href="/#projects" onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }}>Projects</a></li>
            <li><a href="/#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Courses</a></li>
            <li><Link href="/study">Study</Link></li>
            {user && <li><Link href="/dashboard">Dashboard</Link></li>}
            <li><a href="/#team" onClick={(e) => { e.preventDefault(); scrollToSection('team'); }}>Team</a></li>
            <li><a href="/#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
            {user && user.role === 'admin' && (
              <li><Link href="/admin" style={{ color: '#dc143c' }} onClick={() => setMobileMenuOpen(false)}>Admin</Link></li>
            )}
          </ul>
          <NavActions theme={theme} onToggleTheme={toggleTheme} onSearchOpen={() => setSearchOpen(true)} user={user} onOpenAuth={openAuthModal} onLogout={handleLogout} mobileMenuOpen={mobileMenuOpen} onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />
        </nav>

        <section className="page-hero" style={{ minHeight: 300 }}>
          <div className="page-hero-content" style={{ paddingTop: 180 }}>
            <div style={{ width: 320, height: 32, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
            <div style={{ width: 480, height: 16, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
          </div>
        </section>
      </>
    );
  }

  // Not found
  if (notFound) {
    return (
      <>
        <div className="global-particles" id="globalParticles" />
        <div className="cursor-dot" ref={dotRef} id="cursorDot" />
        <div className="cursor-ring" ref={ringRef} id="cursorRing" />

        <AuthGate loading={loading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to access this page')} onSignUp={() => openAuthModal('signup')} />
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => router.push(link)} />
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} tab={authTab} setTab={setAuthTab} message={authMessage}
          loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} loginLoading={loginLoading} onLogin={handleLogin}
          signupName={signupName} setSignupName={setSignupName} signupEmail={signupEmail} setSignupEmail={setSignupEmail} signupPassword={signupPassword} setSignupPassword={setSignupPassword}
          signupPhone={signupPhone} setSignupPhone={signupPhone} signupCompany={signupCompany} setSignupCompany={signupCompany} signupLoading={signupLoading} onSignup={handleSignup}
          getPasswordStrength={getPasswordStrength}
          forgotStep={forgotStep} setForgotStep={setForgotStep} forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} forgotLoading={forgotLoading} onForgotSubmit={handleForgotSubmit}
          resetCode={resetCode} setResetCode={setResetCode} newPassword={newPassword} setNewPassword={setNewPassword} resetLoading={resetLoading} onResetSubmit={handleResetSubmit}
        />
        <ProfileModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} profileName={profileName} setProfileName={setProfileName} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileCompany={profileCompany} setProfileCompany={setProfileCompany} profileSaving={profileSaving} avatarUploading={avatarUploading} onProfileSave={handleProfileSave} onAvatarUpload={handleAvatarUpload} />

        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
          <Link href="/" className="logo">X<span>.</span>Foundry</Link>
          <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`} id="navLinks">
            <li><Link href="/">Home</Link></li>
            <li><a href="/#services" className="active" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
            <li><a href="/#projects" onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }}>Projects</a></li>
            <li><a href="/#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Courses</a></li>
            <li><Link href="/study">Study</Link></li>
            {user && <li><Link href="/dashboard">Dashboard</Link></li>}
            <li><a href="/#team" onClick={(e) => { e.preventDefault(); scrollToSection('team'); }}>Team</a></li>
            <li><a href="/#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
            {user && user.role === 'admin' && (
              <li><Link href="/admin" style={{ color: '#dc143c' }} onClick={() => setMobileMenuOpen(false)}>Admin</Link></li>
            )}
          </ul>
          <NavActions theme={theme} onToggleTheme={toggleTheme} onSearchOpen={() => setSearchOpen(true)} user={user} onOpenAuth={openAuthModal} onLogout={handleLogout} mobileMenuOpen={mobileMenuOpen} onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />
        </nav>

        <section className="page-hero" style={{ minHeight: 400 }}>
          <div className="page-hero-content" style={{ paddingTop: 180 }}>
            <h1 className="page-title">Service Not Found</h1>
            <p className="page-subtitle">The service you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
              <Link href="/#services" onClick={(e) => { e.preventDefault(); router.push('/'); setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="btn btn-primary"><i className="fas fa-arrow-left" /> View All Services</Link>
              <Link href="/" className="btn btn-secondary"><i className="fas fa-home" /> Go Home</Link>
            </div>
          </div>
        </section>

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
              <h4>Roadmap and practice</h4>
              <ul className="footer-links">
                <li><Link href="https://roadmap.sh">Developer Roadmap</Link></li>
                <li><Link href="https://neetcode.io/roadmap">NeetCode Roadmap</Link></li>
                <li><Link href="https://leetcode.com/">LeetCode</Link></li>
                <li><Link href="https://www.hackerrank.com/">HackerRank</Link></li>
                <li><Link href="https://www.codewars.com/">CodeWars</Link></li>
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

  if (!service) return null;

  return (
    <>
      <title>{service.title} | X.Foundry</title>
      <meta name="description" content={service.description || `${service.title} services by X.Foundry. Professional solutions built for scale and impact.`} />
      <meta property="og:title" content={`${service.title} | X.Foundry`} />
      <meta property="og:description" content={service.description || `${service.title} services by X.Foundry.`} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${service.title} | X.Foundry`} />
      <meta name="twitter:description" content={service.description || `${service.title} services by X.Foundry.`} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
          <li><a href="/#services" className="active" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
          <li><a href="/#projects" onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }}>Projects</a></li>
          <li><a href="/#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Courses</a></li>
          <li><Link href="/study">Study</Link></li>
          {user && <li><Link href="/dashboard">Dashboard</Link></li>}
          <li><a href="/#team" onClick={(e) => { e.preventDefault(); scrollToSection('team'); }}>Team</a></li>
          <li><a href="/#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
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
          <h1 className="page-title"><br /><span style={{ color: 'var(--primary-red)' }}>{service.title}</span></h1>
          <p className="page-subtitle">{service.description}</p>
          <div className="breadcrumb">
            <span style={{ color: 'var(--text-light)' }}>Home</span> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Services</span> <span>/</span> <span style={{ color: 'var(--text-light)' }}>{service.title}</span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="section">
        <div className="container-max">
          <div className="service-layout">
            <div className="service-main reveal">
              <h2>What We Deliver</h2>
              <p>{service.description}</p>

              {service.features && service.features.length > 0 && (
                <>
                  <h2 style={{ marginTop: 40 }}>Service Features</h2>
                  <ul className="feature-list">
                    {service.features.map((feature) => (
                      <li key={feature.id}>
                        {feature.icon && <i className={feature.icon} />}
                        {' '}
                        {!feature.icon && <i className="fas fa-check-circle" />}
                        {' '}
                        <strong>{feature.title}</strong>
                        {feature.description ? ` — ${feature.description}` : ''}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <aside className="sidebar reveal">
              <div className="sidebar-card">
                <h3>Quick Actions</h3>
                <Link
                  href="/#contact"
                  onClick={(e) => {
  e.preventDefault();
  router.push('/');
  const check = setInterval(() => {
    const el = document.getElementById('contact');
    if (el) {
      clearInterval(check);
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, 500);
  setTimeout(() => clearInterval(check), 5000);

                  }}
                  className="roadmap-link"
                >
                  <i className="fas fa-paper-plane" />
                  <span>Request a Service</span>
                  <i className="fas fa-arrow-right" style={{ marginLeft: 'auto' }} />
                </Link>
                <Link
                  href="/#projects"
                  onClick={(e) => {
  e.preventDefault();
  router.push('/');
  const check = setInterval(() => {
    const el = document.getElementById('projects');
    if (el) {
      clearInterval(check);
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, 500);
  setTimeout(() => clearInterval(check), 5000);

                  }}
                  className="roadmap-link"
                >
                  <i className="fas fa-eye" />
                  <span>View Projects</span>
                  <i className="fas fa-arrow-right" style={{ marginLeft: 'auto' }} />
                </Link>
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
            <Link
              href="/#contact"
              onClick={(e) => {
  e.preventDefault();
  router.push('/');
  const check = setInterval(() => {
    const el = document.getElementById('contact');
    if (el) {
      clearInterval(check);
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, 500);
  setTimeout(() => clearInterval(check), 5000);

              }}
              className="btn btn-primary"
            >
              <i className="fas fa-paper-plane" /> Get a Quote
            </Link>
            <Link
              href="/#projects"
               onClick={(e) => {
  e.preventDefault();
  router.push('/');
  const check = setInterval(() => {
    const el = document.getElementById('projects');
    if (el) {
      clearInterval(check);
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, 500);
  setTimeout(() => clearInterval(check), 5000);
              }}
              className="btn btn-secondary"
            >
              <i className="fas fa-eye" /> View Projects
            </Link>
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
           <h4>Roadmap and practice</h4>
                         <ul className="footer-links">
                           <li><Link href="https://roadmap.sh">Developer Roadmap</Link></li>
                           <li><Link href="https://neetcode.io/roadmap">NeetCode Roadmap</Link></li>
                           <li><Link href="https://leetcode.com/">LeetCode</Link></li>
                           <li><Link href="https://www.hackerrank.com/">HackerRank</Link></li>
                           <li><Link href="https://www.codewars.com/">CodeWars</Link></li>
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
