'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePageFeatures, type Enrollment } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, NavActions, ProfileModal, HeroEffects } from '@/lib/PageModals';

export default function LinuxBasicsPage() {
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
  } = usePageFeatures();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formOS, setFormOS] = useState('');
  const [formMotivation, setFormMotivation] = useState('');

  // Certificate state
  const [certificate, setCertificate] = useState<{ certificateId: string; courseName: string; completionDate: string } | null>(null);
  const [certDownloading, setCertDownloading] = useState(false);

  // Module unlock state
  interface CourseModule {
    id: string;
    courseId: string;
    title: string;
    description: string;
    content: string;
    moduleOrder: number;
    unlocked: boolean;
    hasAccess: boolean;
  }
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

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

  // Check enrollment when user loads
  const enrollmentsCheckedRef = useRef(false);

  useEffect(() => {
    if (!user || enrollmentsCheckedRef.current) return;
    enrollmentsCheckedRef.current = true;
    fetch('/api/courses/my-enrollments')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.enrollments) {
          const match = data.enrollments.find((e: Enrollment) => e.courseId === 'linux-basics');
          if (match) setEnrollment(match);
        }
      })
      .catch(() => {});
  }, [user]);

  // Fetch module unlock data
  useEffect(() => {
    if (!user) return;
    setModulesLoading(true);
    fetch('/api/courses/modules?courseId=linux-basics')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.modules) {
          setCourseModules(data.modules);
        }
      })
      .catch(() => {})
      .finally(() => setModulesLoading(false));
  }, [user]);

  // Check for issued certificate
  useEffect(() => {
    if (!user) return;
    fetch('/api/courses/certificate?courseId=linux-basics')
      .then((res) => res.json())
      .then((data) => {
        if (data?.hasCertificate) {
          setCertificate({ certificateId: data.certificateId, courseName: data.courseName, completionDate: data.completionDate });
        }
      })
      .catch(() => {});
  }, [user]);

  const toggleModule = (modId: string) => {
    setExpandedModule(prev => prev === modId ? null : modId);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuthModal('signin', 'Please sign in to request enrollment'); return; }
    if (!formName || !formEmail || !formOS) { toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' }); return; }
    setEnrolling(true);
    try {
      const res = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: 'linux-basics', courseName: 'Linux Basics & Customization', courseLevel: 'Intermediate', duration: '4 Weeks', experienceLevel: formOS, motivation: formMotivation }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Request Submitted!', description: 'Your enrollment request is pending review' });
        enrollmentsCheckedRef.current = false;
        // Re-check enrollment
        fetch('/api/courses/my-enrollments')
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.enrollments) {
              const match = data.enrollments.find((e: Enrollment) => e.courseId === 'linux-basics');
              if (match) setEnrollment(match);
            }
          })
          .catch(() => {});
      } else {
        toast({ title: 'Enrollment Failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    }
    setEnrolling(false);
  };

  const handleCancelEnrollment = async () => {
    if (!enrollment) return;
    setCanceling(true);
    try {
      const res = await fetch('/api/courses/cancel-enrollment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: enrollment.id }),
      });
      if (res.ok) {
        setEnrollment(null);
        toast({ title: 'Enrollment Cancelled', description: 'Your request has been withdrawn' });
      } else {
        const data = await res.json();
        toast({ title: 'Cancel Failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    }
    setCanceling(false);
  };

  const handleDownloadCert = async () => {
    if (!certificate) return;
    setCertDownloading(true);
    try {
      const res = await fetch('/api/courses/certificate?courseId=linux-basics&format=pdf');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `XFoundry_Certificate_${certificate.courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${certificate.certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Certificate Downloaded!', description: 'Your PDF certificate has been saved.' });
      } else {
        toast({ title: 'Download Failed', description: 'Could not generate certificate PDF', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    }
    setCertDownloading(false);
  };

  const statusBadge = (status?: string) => {
    const s = status || 'pending';
    const colors: Record<string, string> = { pending: '#f59e0b', approved: '#22c55e', declined: '#ef4444' };
    const labels: Record<string, string> = { pending: 'Pending Review', approved: 'Approved', declined: 'Declined' };
    return (
      <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: `${colors[s]}20`, color: colors[s], fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>
        <i className={`fas ${s === 'pending' ? 'fa-clock' : s === 'approved' ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ marginRight: 6 }} />
        {labels[s]}
      </span>
    );
  };

  return (
    <>
      <title>Linux Basics &amp; Customization | X.Foundry Courses</title>
      <meta name="description" content="Free 4-week Linux Basics & Customization course by X.Foundry. Master command line, Arch Linux, Hyprland, Wayland, and dotfile management." />
      <meta property="og:title" content="Linux Basics & Customization | X.Foundry Courses" />
      <meta property="og:description" content="Free 4-week course: Linux fundamentals, Arch Linux installation, Hyprland tiling WM, and custom rice theming." />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Linux Basics & Customization | X.Foundry Courses" />
      <meta name="twitter:description" content="Free 4-week course: Linux fundamentals, Arch Linux installation, Hyprland tiling WM, and custom rice theming." />
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
          <li><Link href="/#services">Services</Link></li>
          <li><Link href="/#projects">Projects</Link></li>
          <li><Link href="/#courses" className="active">Courses</Link></li>
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
      <section className="course-hero">
        <HeroEffects />
        <div className="hero-content">
          <h1>Linux Basics &amp;<br /><span>Customization</span></h1>
          <div className="hero-meta">
            <div className="meta-pill"><i className="fas fa-clock" /> 4 Weeks</div>
            <div className="meta-pill"><i className="fas fa-signal" /> Intermediate Level</div>
          </div>
          <div className="breadcrumb" style={{ marginTop: 24 }}>
            <span style={{ color: 'var(--text-light)' }}>Home</span> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Courses</span> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Linux Basics</span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="section">
        <div className="container-max">
          <div className="course-layout">
            <div className="course-main reveal">
              <h2>About This Course</h2>
              <p>Master Linux from the ground up — from basic command-line operations to advanced customization with Arch Linux and Hyprland. This course is designed for users who want to break free from restrictive operating systems and take full control of their computing experience.</p>

              <h2 style={{ marginTop: 36 }}>What You&apos;ll Learn</h2>
              <div className="what-learn">
                <div className="learn-item"><i className="fas fa-check" /> Linux File System Hierarchy</div>
                <div className="learn-item"><i className="fas fa-check" /> Command Line Mastery (Bash/Zsh)</div>
                <div className="learn-item"><i className="fas fa-check" /> Arch Linux Installation &amp; Setup</div>
                <div className="learn-item"><i className="fas fa-check" /> Wayland Display Server</div>
                <div className="learn-item"><i className="fas fa-check" /> Hyprland Tiling WM Configuration</div>
                <div className="learn-item"><i className="fas fa-check" /> Dotfiles Management with GNU Stow</div>
                <div className="learn-item"><i className="fas fa-check" /> Custom Rice &amp; Theming</div>
              </div>

              <h2 style={{ marginTop: 36 }}>Course Modules</h2>
              <div className="module-list">
                {modulesLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--primary-red)', marginBottom: 12, display: 'block' }}></i><p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Loading modules...</p></div>
                ) : courseModules.length > 0 ? courseModules.map((mod, idx) => (
                  <div key={mod.id} className="module-item" style={{ cursor: mod.unlocked ? 'pointer' : 'default', flexDirection: 'column', alignItems: 'stretch', gap: 0, opacity: mod.unlocked ? 1 : 0.6 }} onClick={() => mod.unlocked && toggleModule(mod.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className="module-num" style={mod.unlocked ? { background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', color: '#22c55e' } : {}}>
                        {mod.unlocked ? <i className="fas fa-unlock" style={{ fontSize: 12 }}></i> : <i className="fas fa-lock" style={{ fontSize: 12 }}></i>}
                      </div>
                      <div className="module-info" style={{ flex: 1 }}>
                        <h4>{mod.title}</h4>
                        <p>{mod.description}</p>
                      </div>
                      {mod.unlocked && (
                        <i className={`fas fa-chevron-${expandedModule === mod.id ? 'up' : 'down'}`} style={{ color: 'var(--text-dim)', fontSize: 12, flexShrink: 0, transition: 'transform 0.2s' }}></i>
                      )}
                    </div>
                    {mod.unlocked && expandedModule === mod.id && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)', paddingLeft: 56 }}>
                        <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{mod.content}</div>
                      </div>
                    )}
                    {!mod.unlocked && enrollment?.status === 'approved' && (
                      <div style={{ marginTop: 8, paddingLeft: 56, fontSize: 12, color: '#eab308' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: 6 }}></i>Complete previous modules to unlock. Admin controls access.
                      </div>
                    )}
                  </div>
                )) : !user ? (
                  <div style={{ textAlign: 'center', padding: 40 }}><p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Sign in to view module content</p></div>
                ) : null}
              </div>

              <h2 style={{ marginTop: 36 }}>Prerequisites</h2>
              <p>A computer capable of running Linux (or access to a VM), willingness to use the terminal, and patience to learn through experimentation. No prior Linux experience required!</p>
            </div>

            {/* ENROLL CARD */}
            <aside className="enroll-card reveal">
              {enrollment ? (
                <div className="enroll-success show">
                  <div className="success-icon-lg" style={{ background: `${enrollment.status === 'approved' ? '#22c55e' : enrollment.status === 'declined' ? '#ef4444' : '#f59e0b'}20`, borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <i className={`fas ${enrollment.status === 'approved' ? 'fa-check' : enrollment.status === 'declined' ? 'fa-times' : 'fa-clock'}`} style={{ fontSize: 28, color: enrollment.status === 'approved' ? '#22c55e' : enrollment.status === 'declined' ? '#ef4444' : '#f59e0b' }} />
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>{statusBadge(enrollment.status)}</div>
                  <h4 style={{ textAlign: 'center', marginBottom: 8 }}>
                    {enrollment.status === 'approved' ? 'Welcome to Linux!' : enrollment.status === 'declined' ? 'Request Declined' : 'Request Submitted!'}
                  </h4>
                  <p style={{ textAlign: 'center', marginBottom: 4 }}>
                    {enrollment.status === 'approved' ? 'Check your email for the welcome guide and Discord invite.' : enrollment.status === 'declined' ? 'Unfortunately your enrollment request was not approved at this time.' : 'Your enrollment request is being reviewed. We\'ll notify you once a decision is made.'}
                  </p>
                  {enrollment.status === 'approved' && certificate && (
                    <button className="btn btn-primary" style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={(e) => { e.stopPropagation(); handleDownloadCert(); }} disabled={certDownloading}>
                      <i className={certDownloading ? 'fas fa-spinner fa-spin' : 'fas fa-file-pdf'} /> {certDownloading ? 'Downloading...' : 'Download Certificate'}
                    </button>
                  )}
                  {enrollment.status === 'pending' && (
                    <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleCancelEnrollment} disabled={canceling}>
                      <i className={canceling ? 'fas fa-spinner fa-spin' : 'fas fa-times-circle'} /> {canceling ? 'Cancelling...' : 'Cancel Enrollment'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="enroll-form">
                  <div className="enroll-price">Free <span>/ course</span></div>
                  <p className="enroll-note">Start your Linux journey today</p>

                  <form onSubmit={handleEnroll}>
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input type="text" placeholder="John Doe" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input type="email" placeholder="john@email.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Current OS *</label>
                      <select required value={formOS} onChange={(e) => setFormOS(e.target.value)}>
                        <option value="" disabled>Select your OS...</option>
                        <option value="windows">Windows</option>
                        <option value="macos">macOS</option>
                        <option value="linux">Linux (distro?)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>What motivates you?</label>
                      <input type="text" placeholder="Privacy, performance, curiosity..." value={formMotivation} onChange={(e) => setFormMotivation(e.target.value)} />
                    </div>
                    <button type="submit" className="enroll-btn" disabled={enrolling}>
                      <i className={enrolling ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'} /> {enrolling ? 'Submitting...' : 'Request Enrollment'}
                    </button>
                  </form>

                  <div className="enroll-features">
                    <h4>What&apos;s Included:</h4>
                    <div className="feature-check"><i className="fas fa-check" /> 4 weeks of content</div>
                    <div className="feature-check"><i className="fas fa-check" /> Video tutorials</div>
                    <div className="feature-check"><i className="fas fa-check" /> Config files included</div>
                    <div className="feature-check"><i className="fas fa-check" /> Discord community</div>
                    <div className="feature-check"><i className="fas fa-check" /> Lifetime access</div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content reveal">
          <h2>Ready to Switch to Linux?</h2>
          <p>Join thousands who&apos;ve taken control of their computing experience.</p>
          <a href="https://discord.gg/TVRxJg3rcN" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <i className="fab fa-discord" /> Join Our Community
          </a>
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
