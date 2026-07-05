'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, ProfileModal } from '@/lib/PageModals';
import { Navbar } from '@/components/Navbar';
import { Logo } from '@/components/Logo';
import { rafThrottle } from '@/lib/throttle';

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

  const [service, setService] = useState<Service | null>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);


  // PERF: Fetch service data immediately — doesn't wait for auth.
  // The service data is CDN-cached (s-maxage=60) so this is fast.
  useEffect(() => {
    if (!slug) return;
    setFetching(true);
    setNotFound(false);
    fetch('/api/services', { cache: 'force-cache' })
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

  const checkReveals = useCallback(rafThrottle(() => {
    document.querySelectorAll('.reveal, .reveal-up, .reveal-scale, .reveal-left, .reveal-right').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight - 60 && rect.bottom > 60;
      if (inView) el.classList.add('visible');
      else el.classList.remove('visible');
    });
  }), []);

  useEffect(() => {
    window.scrollTo(0, 0);

    window.addEventListener('scroll', checkReveals);
    checkReveals();
    return () => {
      window.removeEventListener('scroll', checkReveals);
    };
  }, [checkReveals]);

  useEffect(() => {
    if (!loading && !minLoading) {
      const t = setTimeout(checkReveals, 50);
      return () => clearTimeout(t);
    }
  }, [loading, minLoading, checkReveals]);

  if (fetching) {
    return (
      <>
        <AuthGate loading={loading} minLoading={minLoading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to access this page')} onSignUp={() => openAuthModal('signup')} />

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

        {!(loading || minLoading) && <Navbar activePage="services" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />}
      </>
    );
  }

  if (notFound) {
    return (
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

        {!(loading || minLoading) && <Navbar activePage="services" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />}

        {!(loading || minLoading) && <section style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 120 }}>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <h1 className="page-title" style={{ fontFamily: "var(--font-heading)", fontSize: 32, color: 'var(--text-light)', marginBottom: 12 }}>Service Not Found</h1>
            <p className="page-subtitle" style={{ color: 'var(--text-dim)', marginBottom: 24 }}>The service you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link href="/#services" onClick={(e) => { e.preventDefault(); router.push('/'); setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="btn btn-primary"><i className="fa-solid fa-arrow-left" /> View All Services</Link>
              <Link href="/" className="btn btn-secondary"><i className="fa-solid fa-home" /> Go Home</Link>
            </div>
          </div>
        </section>}

        {!(loading || minLoading) &&<footer className="v-footer">
  <div className="v-footer-grid">
    <div className="v-footer-brand">
      <Link href="/" className="nav-logo" style={{ display: 'inline-block', marginBottom: 20 }}><Logo className="nav-logo-img" style={{ height: 40 }} /></Link>
      <p>Pioneering the future of technology through innovation, research, and education. Building solutions that transform industries and empower human potential.</p>
      <div className="v-footer-socials">
        <a href="https://www.linkedin.com/company/126753897/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BjRSUxcNJRbuVe74c5IsdTA%3D%3D" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-linkedin-in" /></a>
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
        {user && user.role !== 'newcomer' && <li><Link href="/games">Games</Link></li>}
        {user && user.role !== 'newcomer' && <li><Link href="/study">Study</Link></li>}
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
        <li><a href="tel:+201040394896">+201040394896</a></li>
      </ul>
    </div>
  </div>
  <div className="v-footer-bottom">
    <p>&copy; {new Date().getFullYear()} X-Foundry. All Rights Reserved.</p>
  </div>
</footer>}
      </>
    );
  }

  if (!service) return null;

  return (
    <>
      <title>{service.title} | XFoundry</title>
      <meta name="description" content={service.description || `${service.title} services by XFoundry. Professional solutions built for scale and impact.`} />
      <meta property="og:title" content={`${service.title} | XFoundry`} />
      <meta property="og:description" content={service.description || `${service.title} services by XFoundry.`} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${service.title} | XFoundry`} />
      <meta name="twitter:description" content={service.description || `${service.title} services by XFoundry.`} />

      <AuthGate loading={loading} minLoading={minLoading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to access this page')} onSignUp={() => openAuthModal('signup')} />

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

      {!(loading || minLoading) && <Navbar activePage="services" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />}

      {!(loading || minLoading) && <div className="page-transition-enter">

      {/* Split hero — left: title + desc, right: showcase preview */}
      <section className="reveal-up" style={{ background: 'var(--black)', padding: '160px 24px 40px', position: 'relative', overflow: 'hidden', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: isMobile ? 32 : 44, fontWeight: 800, color: 'var(--text-light)', letterSpacing: -1, lineHeight: 1.1, marginBottom: 16 }}>
              <span className="v-highlight">{service.title}</span>
            </h1>
            {service.description && (
              <p style={{ fontSize: isMobile ? 15 : 17, lineHeight: 1.6, color: 'var(--text-dim)', maxWidth: 480 }}>
                {service.description}
              </p>
            )}
          </div>
          {/* Browser mockup showcase */}
          <div className="reveal-up reveal-delay-1" style={{
            background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
            backdropFilter: 'blur(20px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
            border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
            borderRadius: 16, overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Browser chrome */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px',
              background: 'color-mix(in srgb, var(--text-light) 5%, transparent)',
              borderBottom: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--error-color)', opacity: 0.6 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--warning-color)', opacity: 0.6 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success-color)', opacity: 0.6 }} />
              <div style={{ flex: 1, marginLeft: 8, padding: '3px 10px', borderRadius: 6, background: 'color-mix(in srgb, var(--text-light) 5%, transparent)', fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>
                xfoundryy.vercel.app
              </div>
            </div>
            {/* Browser content — animated preview */}
            <div style={{ padding: 24, minHeight: 200 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Fake navbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 80, height: 8, borderRadius: 4, background: 'color-mix(in srgb, var(--accent) 30%, transparent)' }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ width: 30, height: 6, borderRadius: 3, background: 'color-mix(in srgb, var(--text-light) 15%, transparent)' }} />
                    <div style={{ width: 30, height: 6, borderRadius: 3, background: 'color-mix(in srgb, var(--text-light) 15%, transparent)' }} />
                    <div style={{ width: 30, height: 6, borderRadius: 3, background: 'color-mix(in srgb, var(--text-light) 15%, transparent)' }} />
                  </div>
                </div>
                {/* Fake hero */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ width: '70%', height: 14, borderRadius: 4, background: 'color-mix(in srgb, var(--accent) 25%, transparent)', marginBottom: 8 }} />
                  <div style={{ width: '90%', height: 6, borderRadius: 3, background: 'color-mix(in srgb, var(--text-light) 10%, transparent)', marginBottom: 4 }} />
                  <div style={{ width: '60%', height: 6, borderRadius: 3, background: 'color-mix(in srgb, var(--text-light) 10%, transparent)' }} />
                </div>
                {/* Fake cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                  <div style={{ height: 50, borderRadius: 8, background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)', border: '0.5px solid color-mix(in srgb, var(--text-light) 8%, transparent)' }} />
                  <div style={{ height: 50, borderRadius: 8, background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)', border: '0.5px solid color-mix(in srgb, var(--text-light) 8%, transparent)' }} />
                  <div style={{ height: 50, borderRadius: 8, background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)', border: '0.5px solid color-mix(in srgb, var(--text-light) 8%, transparent)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards — masonry-style grid */}
      {service.features && service.features.length > 0 && (
        <section className="reveal-up reveal-delay-1" style={{ background: 'var(--black)', padding: '40px 24px 80px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: 'var(--text-light)', marginBottom: 24, letterSpacing: -0.5 }}>
              What we deliver
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
              {service.features.map((feature, idx) => (
                <div
                  key={feature.id}
                  className="reveal-up"
                  style={{
                    background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
                    backdropFilter: 'blur(20px) saturate(1.6)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                    border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                    borderRadius: 16, padding: 24,
                    transitionDelay: `${idx * 50}ms`,
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', fontSize: 18,
                  }}>
                    <i className={feature.icon || 'fa-solid fa-check'} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-light)', margin: 0 }}>
                    {feature.title}
                  </h3>
                  {feature.description && (
                    <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                      {feature.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA — centered */}
      <section className="cta-section">
        <div className="cta-content reveal-up">
          <h2>Have a Project in Mind?</h2>
          <p>Let&apos;s turn your idea into a production-ready product.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/#contact"
              onClick={(e) => { e.preventDefault(); router.push('/'); const check = setInterval(() => { const el = document.getElementById('contact'); if (el) { clearInterval(check); el.scrollIntoView({ behavior: 'smooth' }); } }, 500); setTimeout(() => clearInterval(check), 5000); }}
              className="btn btn-primary"
            >
              <i className="fa-solid fa-paper-plane" /> Get a Quote
            </Link>
            <Link
              href="/#projects"
              onClick={(e) => { e.preventDefault(); router.push('/'); const check = setInterval(() => { const el = document.getElementById('projects'); if (el) { clearInterval(check); el.scrollIntoView({ behavior: 'smooth' }); } }, 500); setTimeout(() => clearInterval(check), 5000); }}
              className="btn btn-secondary"
            >
              <i className="fa-solid fa-eye" /> View Projects
            </Link>
          </div>
        </div>
      </section>
      </div>}

      {!(loading || minLoading) &&<footer className="v-footer" style={{ marginTop: 80 }}>
  <div className="v-footer-grid">
    <div className="v-footer-brand">
      <Link href="/" className="nav-logo" style={{ display: 'inline-block', marginBottom: 20 }}><Logo className="nav-logo-img" style={{ height: 40 }} /></Link>
      <p>Pioneering the future of technology through innovation, research, and education. Building solutions that transform industries and empower human potential.</p>
      <div className="v-footer-socials">
        <a href="https://www.linkedin.com/company/126753897/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BjRSUxcNJRbuVe74c5IsdTA%3D%3D" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-linkedin-in" /></a>
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
        {user && user.role !== 'newcomer' && <li><Link href="/games">Games</Link></li>}
        {user && user.role !== 'newcomer' && <li><Link href="/study">Study</Link></li>}
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
        <li><a href="tel:+201040394896">+201040394896</a></li>
      </ul>
    </div>
  </div>
  <div className="v-footer-bottom">
    <p>&copy; {new Date().getFullYear()} X-Foundry. All Rights Reserved.</p>
  </div>
</footer>}
    </>
  );
}
