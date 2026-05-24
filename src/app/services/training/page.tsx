'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, NavActions, ProfileModal, HeroEffects } from '@/lib/PageModals';

export default function TrainingServicePage() {
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
      <title>Tech Education &amp; Training | X.Foundry</title>
      <meta name="description" content="Comprehensive tech education and training by X.Foundry. Structured learning paths, hands-on projects, live mentorship, and certification courses in AI, Linux, and more." />
      <meta property="og:title" content="Tech Education & Training | X.Foundry" />
      <meta property="og:description" content="Learn from engineers who build. Structured courses, hands-on projects, and certifications in AI, cybersecurity, and software engineering." />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Tech Education & Training | X.Foundry" />
      <meta name="twitter:description" content="Learn from engineers who build. Structured courses, hands-on projects, and certifications in AI, cybersecurity, and software engineering." />
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
          <h1 className="page-title">Tech Education<br />&amp;<span style={{ color: 'var(--primary-red)' }}>Training</span></h1>
          <p className="page-subtitle">Comprehensive training programs, workshops, and certification courses in AI, cybersecurity, cloud computing, and software engineering.</p>
          <div className="breadcrumb">
            <span style={{ color: 'var(--text-light)' }}>Home</span> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Services</span> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Education</span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="section">
        <div className="container-max">
          <div className="service-layout">
            <div className="service-main reveal">
              <h2>Learn From Engineers Who Build</h2>
              <p>Our training programs are designed and delivered by active industry practitioners. We don&apos;t just teach theory — we share real-world experience from building production systems used by thousands.</p>

              <h2 style={{ marginTop: 40 }}>What We Offer</h2>
              <ul className="feature-list">
                <li><i className="fas fa-check-circle" /> <strong>Structured Learning Paths</strong> — Curricula designed to take you from beginner to job-ready, with clear milestones at every stage.</li>
                <li><i className="fas fa-check-circle" /> <strong>Hands-on Projects</strong> — Every course includes real projects you&apos;ll build and add to your portfolio.</li>
                <li><i className="fas fa-check-circle" /> <strong>Live Sessions &amp; Mentorship</strong> — Weekly live coding sessions with instructors who answer your questions in real-time.</li>
                <li><i className="fas fa-check-circle" /> <strong>Community Access</strong> — Join our Discord community of learners, alumni, and mentors for ongoing support.</li>
                <li><i className="fas fa-check-circle" /> <strong>Certification</strong> — Earn recognized certificates upon completion to showcase your skills.</li>
                <li><i className="fas fa-check-circle" /> <strong>Corporate Training</strong> — Custom programs tailored for teams looking to upskill together.</li>
              </ul>

              <h2 style={{ marginTop: 40 }}>Available Courses</h2>
            </div>

            <aside className="sidebar reveal">
              <div className="sidebar-card">
                <h3>Quick Actions</h3>
                <Link href="https://roadmap.sh/computer-science" className="roadmap-link"><i className="fas fa-road" /><span>View Roadmap</span><i className="fas fa-arrow-right" style={{ marginLeft: 'auto' }} /></Link>
                <a href="/#contact" className="roadmap-link" onClick={(e) => { e.preventDefault(); router.push('/'); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 300); }}><i className="fas fa-users" /><span>Corporate Training</span><i className="fas fa-arrow-right" style={{ marginLeft: 'auto' }} /></a>
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 13, marginBottom: 12, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>Focus Areas</h3>
                  <div className="tech-stack">
                    <span className="tech-tag">Machine Learning</span>
                    <span className="tech-tag">Linux/Unix</span>
                    <span className="tech-tag">Web Dev</span>
                    <span className="tech-tag">Cybersecurity</span>
                    <span className="tech-tag">Cloud</span>
                    <span className="tech-tag">DevOps</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* COURSE PREVIEW GRID */}
          <div className="course-preview-grid reveal">
            <Link href="/courses/ml-bootcamp" className="course-mini-card">
              <h4>ML Engineer Bootcamp</h4>
              <p>8-week intensive program covering deep learning, NLP, and computer vision with Python.</p>
              <div className="course-mini-meta">
                <span><i className="fas fa-clock" /> 8 Weeks</span>
                <span><i className="fas fa-signal" /> Advanced</span>
                <span><i className="fas fa-dollar-sign" /> Free</span>
              </div>
            </Link>
            <Link href="/courses/linux-basics" className="course-mini-card">
              <h4>Linux Basics &amp; Customization</h4>
              <p>Master Linux fundamentals, Arch Linux setup, Hyprland, and power user workflows.</p>
              <div className="course-mini-meta">
                <span><i className="fas fa-clock" /> 4 Weeks</span>
                <span><i className="fas fa-signal" /> Intermediate</span>
                <span><i className="fas fa-dollar-sign" /> Free</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content reveal">
          <h2>Ready to Start Learning?</h2>
          <p>Join our community of learners and start building your future today.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/#courses" onClick ={(e) => {
              e.preventDefault();
              router.push('/');
              setTimeout(() => {
              document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
              }, 300);
            }} className="btn btn-primary"><i className="fas fa-brain" /> Browse Courses</Link>

            <a href="https://discord.gg/TVRxJg3rcN" target="_blank" rel="noopener noreferrer" className="btn btn-secondary"><i className="fab fa-discord" /> Join Discord</a>
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
