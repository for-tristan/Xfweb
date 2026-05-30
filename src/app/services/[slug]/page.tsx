'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useCustomCursor } from '@/hooks/useCustomCursor';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, ProfileModal, HeroEffects } from '@/lib/PageModals';
import { Navbar } from '@/components/Navbar';

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
    user, loading, theme, toggleTheme, changeTheme, scrolled, mobileMenuOpen, setMobileMenuOpen,
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

  const [service, setService] = useState<Service | null>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useCustomCursor(dotRef, ringRef);

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
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      // Remove ALL particles from container (not just our array)
      const container = document.getElementById('globalParticles');
      if (container) {
        container.querySelectorAll('[data-particle]').forEach(p => p.remove());
      }
    };
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
          signupName={signupName} setSignupName={setSignupName} signupEmail={signupEmail} setSignupEmail={setSignupEmail} signupPassword={signupPassword} setSignupPassword={setSignupPassword} signupConfirmPassword={signupConfirmPassword} setSignupConfirmPassword={setSignupConfirmPassword}
          signupPhone={signupPhone} setSignupPhone={setSignupPhone} signupCompany={signupCompany} setSignupCompany={setSignupCompany} signupLoading={signupLoading} onSignup={handleSignup}
          getPasswordStrength={getPasswordStrength}
          forgotStep={forgotStep} setForgotStep={setForgotStep} forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} forgotLoading={forgotLoading} onForgotSubmit={handleForgotSubmit}
          resetCode={resetCode} setResetCode={setResetCode} newPassword={newPassword} setNewPassword={setNewPassword} resetLoading={resetLoading} onResetSubmit={handleResetSubmit}
          verificationStep={verificationStep} setVerificationStep={setVerificationStep} verificationEmail={verificationEmail} verificationCode={verificationCode} setVerificationCode={setVerificationCode} verificationLoading={verificationLoading} onVerifyEmail={handleVerifyEmail} onResendVerification={handleResendVerification} resendLoading={resendLoading}
        />
        <ProfileModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} profileName={profileName} setProfileName={setProfileName} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileCompany={profileCompany} setProfileCompany={setProfileCompany} profileSaving={profileSaving} avatarUploading={avatarUploading} onProfileSave={handleProfileSave} onAvatarUpload={handleAvatarUpload} onAvatarUploaded={handleAvatarUploaded} />

        <Navbar activePage="services" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />

        <section className="page-hero" style={{ minHeight: 300 }}>
          <div className="grid-bg"></div>
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

        <Navbar activePage="services" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />

        <section className="page-hero" style={{ minHeight: 400 }}>
          <div className="grid-bg"></div>
          <div className="page-hero-content" style={{ paddingTop: 180 }}>
            <h1 className="page-title">Service Not Found</h1>
            <p className="page-subtitle">The service you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
              <Link href="/#services" onClick={(e) => { e.preventDefault(); router.push('/'); setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="btn btn-primary"><i className="fa-solid fa-arrow-left" /> View All Services</Link>
              <Link href="/" className="btn btn-secondary"><i className="fa-solid fa-home" /> Go Home</Link>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link href="/" className="logo" style={{ display: 'inline-block', marginBottom: 20 }}>X<span>.</span>Foundry</Link>
              <p>Pioneering the future of technology through innovation, research, and education. Building solutions that transform industries and empower human potential.</p>
              <div className="footer-socials">
                <a href="https://www.linkedin.com/in/marwan-montaser-067054387/" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-linkedin-in" /></a>
                <a href="https://github.com/for-tristan" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-github" /></a>
                <a href="https://discord.gg/TVRxJg3rcN" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-discord" /></a>
              </div>
            </div>
            <div className="footer-column">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/#services">Services</Link></li>
                <li><Link href="/#courses">Programs</Link></li>
                <li><Link href="/games">Games</Link></li>
                <li><Link href="/study">Study</Link></li>
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
          <div className="footer-bottom">&copy; {new Date().getFullYear()} X-Foundry. All Rights Reserved.</div>
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
      <Navbar activePage="services" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />

      {/* HERO */}
      <div className="page-transition-enter">
      <section className="page-hero">
        <HeroEffects />
        <div className="page-hero-content">
          <h1 className="page-title"><span style={{ color: 'var(--primary-red)' }}>{service.title}</span></h1>
          <p className="page-subtitle">{service.description}</p>
          <div className="breadcrumb">
            <Link href="/" style={{ color: 'var(--text-dim)' }}>Home</Link> <span>/</span> <Link href="/#services" style={{ color: 'var(--text-dim)' }}>Services</Link> <span>/</span> <span style={{ color: 'var(--text-light)' }}>{service.title}</span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="section">
        <div className="grid-bg"></div>
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
                        {!feature.icon && <i className="fa-solid fa-check-circle" />}
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
                  <i className="fa-solid fa-paper-plane" />
                  <span>Request a Service</span>
                  <i className="fa-solid fa-arrow-right" style={{ marginLeft: 'auto' }} />
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
                  <i className="fa-solid fa-eye" />
                  <span>View Projects</span>
                  <i className="fa-solid fa-arrow-right" style={{ marginLeft: 'auto' }} />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="grid-bg"></div>
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
              <i className="fa-solid fa-paper-plane" /> Get a Quote
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
              <i className="fa-solid fa-eye" /> View Projects
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
              <a href="https://www.linkedin.com/in/marwan-montaser-067054387/" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-linkedin-in" /></a>
              <a href="https://github.com/for-tristan" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-github" /></a>
              <a href="https://discord.gg/TVRxJg3rcN" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-discord" /></a>
            </div>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/#services">Services</Link></li>
              <li><Link href="/#courses">Programs</Link></li>
              <li><Link href="/games">Games</Link></li>
              <li><Link href="/study">Study</Link></li>
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
        <div className="footer-bottom">&copy; {new Date().getFullYear()} X-Foundry. All Rights Reserved.</div>
      </footer>
    </>
  );
}
