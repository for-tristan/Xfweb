'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCustomCursor } from '@/hooks/useCustomCursor';
import { usePageFeatures, type Enrollment } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, ProfileModal, HeroEffects } from '@/lib/PageModals';
import { Navbar } from '@/components/Navbar';
import dynamic from 'next/dynamic';

const TestModal = dynamic(() => import('@/components/TestModal'), { ssr: false });
const ModuleContent = dynamic(() => import('@/components/ModuleContent'), { ssr: false });
import ConfirmModal from '@/components/ConfirmModal';

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

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  status: string;
  icon: string;
  features: string;
  prerequisites: string;
  techStack: string;
  displayOrder: number;
  modules: { id: string; title: string; description: string; content: string; moduleOrder: number }[];
}

export default function DynamicCoursePage() {
  const { toast } = useToast();
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

  const [course, setCourse] = useState<Course | null>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formExperience, setFormExperience] = useState('');
  const [formMotivation, setFormMotivation] = useState('');

  // Student Tests state
  interface StudentTest {
    id: string;
    title: string;
    description: string;
    timeLimit: number;
    passingScore: number;
    questionCount: number;
    moduleId: string;
    moduleTitle: string;
    moduleOrder: number;
    questions: { id: string; questionText: string; options: string[]; questionType: string; points: number; questionOrder: number }[];
    hasCompleted: boolean;
    attempt: { score: number; totalPoints: number; passed: boolean; submittedAt: string } | null;
  }
  const [studentTests, setStudentTests] = useState<StudentTest[]>([]);
  const [activeTest, setActiveTest] = useState<StudentTest | null>(null);
  const fetchStudentTests = useCallback(async () => {
    try {
      const r = await fetch('/api/courses/tests');
      if (r.ok) { const d = await r.json(); setStudentTests(d.tests || []); }
    } catch {}
  }, []);

  // Certificate state
  const [certificate, setCertificate] = useState<{ certificateId: string; courseName: string; completionDate: string } | null>(null);
  const [certDownloading, setCertDownloading] = useState(false);

  // Module unlock state
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; confirmLabel: string; danger: boolean; icon: string; onConfirm: () => void }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, icon: 'fa-solid fa-exclamation-triangle', onConfirm: () => {} });

  const openConfirm = (title: string, message: string, onConfirm: () => void, opts?: { confirmLabel?: string; danger?: boolean; icon?: string }) => {
    setConfirmModal({
      open: true, title, message,
      confirmLabel: opts?.confirmLabel || 'Confirm',
      danger: opts?.danger !== undefined ? opts.danger : false,
      icon: opts?.icon || 'fa-solid fa-exclamation-triangle',
      onConfirm,
    });
  };

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useCustomCursor(dotRef, ringRef);

  // Fetch course data
  useEffect(() => {
    if (!slug) return;
    setFetching(true);
    setNotFound(false);
    fetch(`/api/courses/${slug}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not found');
      })
      .then((data) => {
        if (data?.course) {
          setCourse(data.course);
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

  // Check enrollment when user loads
  const enrollmentsCheckedRef = useRef(false);

  useEffect(() => {
    if (!user || !slug || enrollmentsCheckedRef.current) return;
    enrollmentsCheckedRef.current = true;
    fetch('/api/courses/my-enrollments')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.enrollments) {
          const match = data.enrollments.find((e: Enrollment) => e.courseId === slug);
          if (match) setEnrollment(match);
        }
      })
      .catch(() => {});
  }, [user, slug]);

  // Fetch module unlock data
  useEffect(() => {
    if (!user || !slug) return;
    setModulesLoading(true);
    fetchStudentTests();
    fetch(`/api/courses/modules?courseId=${slug}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.modules) {
          setCourseModules(data.modules);
        }
      })
      .catch(() => {})
      .finally(() => setModulesLoading(false));
  }, [user, slug]);

  // Check for issued certificate
  useEffect(() => {
    if (!user || !slug) return;
    fetch(`/api/courses/certificate?courseId=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.hasCertificate) {
          setCertificate({ certificateId: data.certificateId, courseName: data.courseName, completionDate: data.completionDate });
        }
      })
      .catch(() => {});
  }, [user, slug]);

  const toggleModule = (modId: string) => {
    setExpandedModule(prev => prev === modId ? null : modId);
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuthModal('signin', 'Please sign in to request enrollment'); return; }
    if (!formName || !formEmail || !formMotivation) { toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' }); return; }
    if (!course) return;
    openConfirm(
      'Confirm Enrollment',
      `Are you sure you want to enroll in "${course.title}"? An admin will review your request.`,
      async () => {
        setEnrolling(true);
        try {
          const res = await fetch('/api/courses/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: course.slug,
              courseName: course.title,
              courseLevel: course.level,
              duration: course.duration,
              experienceLevel: formExperience,
              motivation: formMotivation,
            }),
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
                  const match = data.enrollments.find((e: Enrollment) => e.courseId === slug);
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
      },
      { confirmLabel: 'Enroll', icon: 'fa-solid fa-graduation-cap' }
    );
  };

  const handleCancelEnrollment = () => {
    if (!enrollment) return;
    openConfirm(
      'Cancel Enrollment',
      'Are you sure you want to cancel your enrollment request? This action cannot be undone.',
      async () => {
        setCanceling(true);
        try {
          const res = await fetch('/api/courses/cancel-enrollment', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enrollmentId: enrollment!.id }),
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
      },
      { confirmLabel: 'Cancel Enrollment', danger: true, icon: 'fa-solid fa-times-circle' }
    );
  };

  const handleDownloadCert = async () => {
    if (!certificate || !slug) return;
    setCertDownloading(true);
    try {
      const res = await fetch(`/api/courses/certificate?courseId=${slug}&format=pdf`);
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
    const colors: Record<string, string> = { pending: 'var(--warning-color)', approved: 'var(--success-color)', declined: 'var(--error-color)' };
    const labels: Record<string, string> = { pending: 'Pending Review', approved: 'Approved', declined: 'Declined' };
    return (
      <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: `${colors[s]}20`, color: colors[s], fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>
        <i className={`fas ${s === 'pending' ? 'fa-clock' : s === 'approved' ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ marginRight: 6 }} />
        {labels[s]}
      </span>
    );
  };

  // Parse features JSON
  const courseFeatures: string[] = (() => {
    if (!course?.features) return [];
    try {
      const parsed = JSON.parse(course.features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  // Parse tech stack
  const courseTechStack: string[] = (() => {
    if (!course?.techStack) return [];
    try {
      const parsed = JSON.parse(course.techStack);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

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

        <Navbar activePage="courses" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />

        <section className="course-hero" style={{ minHeight: 300 }}>
          <div className="grid-bg"></div>
          <div className="hero-content" style={{ paddingTop: 180 }}>
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
          signupName={signupName} setSignupName={setSignupName} signupEmail={signupEmail} setSignupEmail={setSignupEmail} signupPassword={signupPassword} setSignupPassword={setSignupPassword} signupConfirmPassword={signupConfirmPassword} setSignupConfirmPassword={setSignupConfirmPassword}
          signupPhone={signupPhone} setSignupPhone={setSignupPhone} signupCompany={signupCompany} setSignupCompany={setSignupCompany} signupLoading={signupLoading} onSignup={handleSignup}
          getPasswordStrength={getPasswordStrength}
          forgotStep={forgotStep} setForgotStep={setForgotStep} forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} forgotLoading={forgotLoading} onForgotSubmit={handleForgotSubmit}
          resetCode={resetCode} setResetCode={setResetCode} newPassword={newPassword} setNewPassword={setNewPassword} resetLoading={resetLoading} onResetSubmit={handleResetSubmit}
          verificationStep={verificationStep} setVerificationStep={setVerificationStep} verificationEmail={verificationEmail} verificationCode={verificationCode} setVerificationCode={setVerificationCode} verificationLoading={verificationLoading} onVerifyEmail={handleVerifyEmail} onResendVerification={handleResendVerification} resendLoading={resendLoading}
        />
        <ProfileModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} profileName={profileName} setProfileName={setProfileName} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileCompany={profileCompany} setProfileCompany={setProfileCompany} profileSaving={profileSaving} avatarUploading={avatarUploading} onProfileSave={handleProfileSave} onAvatarUpload={handleAvatarUpload} onAvatarUploaded={handleAvatarUploaded} />

        <Navbar activePage="courses" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />

        <section className="course-hero" style={{ minHeight: 400 }}>
          <div className="grid-bg"></div>
          <div className="hero-content" style={{ paddingTop: 180 }}>
            <h1>Course Not Found</h1>
            <p className="page-subtitle">The course you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
              <Link href="/#courses" onClick={(e) => { e.preventDefault(); router.push('/'); setTimeout(() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="btn btn-primary"><i className="fa-solid fa-arrow-left" /> View All Programs</Link>
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
                
                
                <li><Link href="/#courses">Programs</Link></li>
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

  if (!course) return null;

  return (
    <>
      <title>{course.title} | X.Foundry Courses</title>
      <meta name="description" content={course.description || `${course.title} course by X.Foundry. Enroll now and start learning.`} />
      <meta property="og:title" content={`${course.title} | X.Foundry Courses`} />
      <meta property="og:description" content={course.description || `${course.title} course by X.Foundry.`} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${course.title} | X.Foundry Courses`} />
      <meta name="twitter:description" content={course.description || `${course.title} course by X.Foundry.`} />

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
      <Navbar activePage="courses" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />

      {/* HERO */}
      <div className="page-transition-enter">
      <section className="course-hero">
        <HeroEffects />
        <div className="hero-content">
          <h1>{course.title.split('&').length > 1 ? (
            <>
              {course.title.split('&')[0].trim()}&amp;<br />
              <span>{course.title.split('&')[1].trim()}</span>
            </>
          ) : (
            <>
              {course.title.split(' ').slice(0, Math.ceil(course.title.split(' ').length / 2)).join(' ')}<br />
              <span>{course.title.split(' ').slice(Math.ceil(course.title.split(' ').length / 2)).join(' ')}</span>
            </>
          )}</h1>
          <div className="hero-meta">
            <div className="meta-pill"><i className="fa-solid fa-clock" /> {course.duration}</div>
            <div className="meta-pill"><i className="fa-solid fa-signal" /> {course.level} Level</div>
            <div className="meta-pill"><i className="fa-solid fa-tag" /> {course.price}</div>
          </div>
          <div className="breadcrumb" style={{ marginTop: 24 }}>
            <Link href="/" style={{ color: 'var(--text-dim)' }}>Home</Link> <span>/</span> <Link href="/#courses" style={{ color: 'var(--text-dim)' }}>Programs</Link> <span>/</span> <span style={{ color: 'var(--text-light)' }}>{course.title}</span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="section">
        <div className="grid-bg"></div>
        <div className="container-max">
          <div className="course-layout">
            <div className="course-main reveal">
              <h2>About This Course</h2>
              <p>{course.description}</p>

              {courseFeatures.length > 0 && (
                <>
                  <h2 style={{ marginTop: 36 }}>What You&apos;ll Learn</h2>
                  <div className="what-learn">
                    {courseFeatures.map((feature, idx) => (
                      <div key={idx} className="learn-item"><i className="fa-solid fa-check" /> {feature}</div>
                    ))}
                  </div>
                </>
              )}

              <h2 style={{ marginTop: 36 }}>Course Modules</h2>
              <div className="module-list">
                {modulesLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)', marginBottom: 12, display: 'block' }}></i><p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Loading modules...</p></div>
                ) : courseModules.length > 0 ? courseModules.map((mod) => (
                  <div key={mod.id} className="module-item" style={{ cursor: mod.unlocked ? 'pointer' : 'default', flexDirection: 'column', alignItems: 'stretch', gap: 0, opacity: mod.unlocked ? 1 : 0.6 }} onClick={() => mod.unlocked && toggleModule(mod.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className="module-num" style={mod.unlocked ? { background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', color: 'var(--success-color)' } : {}}>
                        {mod.unlocked ? <i className="fa-solid fa-unlock" style={{ fontSize: 12 }}></i> : <i className="fa-solid fa-lock" style={{ fontSize: 12 }}></i>}
                      </div>
                      <div className="module-info" style={{ flex: 1 }}>
                        <h4>{mod.title}</h4>
                        <p>{mod.description}</p>
                      </div>
                      {mod.unlocked && (
                        <i className={`fa-solid fa-chevron-${expandedModule === mod.id ? 'up' : 'down'}`} style={{ color: 'var(--text-dim)', fontSize: 12, flexShrink: 0, transition: 'transform 0.2s' }}></i>
                      )}
                    </div>
                    {mod.unlocked && expandedModule === mod.id && (() => {
                      const moduleTests = studentTests.filter(t => t.moduleId === mod.id);
                      return (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)', paddingLeft: 56 }}>
                          <ModuleContent content={mod.content} />
                          {moduleTests.length > 0 && (
                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-light)', marginBottom: 12 }}>
                                <i className="fa-solid fa-file-alt" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Module Test{moduleTests.length > 1 ? 's' : ''}
                              </h4>
                              {moduleTests.map((t) => (
                                <div key={t.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: 16, borderRadius: 4, marginBottom: 10 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>{t.title}</div>
                                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                                        {t.questionCount} questions &middot; {t.timeLimit}min &middot; Pass: {t.passingScore}%
                                        {t.hasCompleted && t.attempt && (
                                          <span style={{ marginLeft: 12, color: t.attempt.passed ? 'var(--success-color)' : 'var(--error-color)', fontWeight: 700 }}>
                                            {t.attempt.passed ? 'PASSED' : 'FAILED'} ({t.attempt.score}/{t.attempt.totalPoints})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      className="btn btn-primary"
                                      style={{ padding: '8px 20px', fontSize: 12 }}
                                      onClick={(e) => { e.stopPropagation(); setActiveTest(t); }}
                                    >
                                      <i className="fa-solid fa-play" style={{ marginRight: 6 }}></i>
                                      {t.hasCompleted ? 'View Result' : 'Take Test'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {!mod.unlocked && enrollment?.status === 'approved' && (
                      <div style={{ marginTop: 8, paddingLeft: 56, fontSize: 12, color: 'var(--warning-color)' }}>
                        <i className="fa-solid fa-info-circle" style={{ marginRight: 6 }}></i>Complete previous modules to unlock. Admin controls access.
                      </div>
                    )}
                  </div>
                )) : !user ? (
                  <div style={{ textAlign: 'center', padding: 40 }}><p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Sign in to view module content</p></div>
                ) : null}
              </div>

              {course.prerequisites && (
                <>
                  <h2 style={{ marginTop: 36 }}>Prerequisites</h2>
                  <p>{course.prerequisites}</p>
                </>
              )}

              {courseTechStack.length > 0 && (
                <>
                  <h2 style={{ marginTop: 36 }}>Tech Stack</h2>
                  <div className="tech-stack" style={{ marginTop: 12 }}>
                    {courseTechStack.map((tech, idx) => (
                      <span key={idx} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ENROLL CARD */}
            <aside className="enroll-card reveal">
              {enrollment ? (
                <div className="enroll-success show">
                  <div className="success-icon-lg" style={{ background: `${enrollment.status === 'approved' ? 'var(--success-color)' : enrollment.status === 'declined' ? 'var(--error-color)' : 'var(--warning-color)'}20`, borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <i className={`fas ${enrollment.status === 'approved' ? 'fa-check' : enrollment.status === 'declined' ? 'fa-times' : 'fa-clock'}`} style={{ fontSize: 28, color: enrollment.status === 'approved' ? 'var(--success-color)' : enrollment.status === 'declined' ? 'var(--error-color)' : 'var(--warning-color)' }} />
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>{statusBadge(enrollment.status)}</div>
                  <h4 style={{ textAlign: 'center', marginBottom: 8 }}>
                    {enrollment.status === 'approved' ? 'Welcome!' : enrollment.status === 'declined' ? 'Request Declined' : 'Request Submitted!'}
                  </h4>
                  <p style={{ textAlign: 'center', marginBottom: 4 }}>
                    {enrollment.status === 'approved' ? 'Check your email for the welcome guide and Discord invite.' : enrollment.status === 'declined' ? 'Unfortunately your enrollment request was not approved at this time.' : 'Your enrollment request is being reviewed. We\'ll notify you once a decision is made.'}
                  </p>
                  {enrollment.status === 'approved' && certificate && (
                    <button className="btn btn-primary" style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={(e) => { e.stopPropagation(); handleDownloadCert(); }} disabled={certDownloading}>
                      <i className={certDownloading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-file-pdf'} /> {certDownloading ? 'Downloading...' : 'Download Certificate'}
                    </button>
                  )}
                  {enrollment.status === 'pending' && (
                    <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleCancelEnrollment} disabled={canceling}>
                      <i className={canceling ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-times-circle'} /> {canceling ? 'Cancelling...' : 'Cancel Enrollment'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="enroll-form">
                  <div className="enroll-price">{course.price} <span>/ course</span></div>
                  <p className="enroll-note">Start your {course.title.split('&')[0].trim()} journey today</p>

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
                      <label>Experience Level</label>
                      <select value={formExperience} onChange={(e) => setFormExperience(e.target.value)}>
                        <option value="" disabled>Select level...</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>What motivates you? *</label>
                      <input type="text" placeholder="Career growth, curiosity, passion..." value={formMotivation} onChange={(e) => setFormMotivation(e.target.value)} required />
                    </div>
                    <button type="submit" className="enroll-btn" disabled={enrolling}>
                      <i className={enrolling ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'} /> {enrolling ? 'Submitting...' : 'Request Enrollment'}
                    </button>
                  </form>

                  <div className="enroll-features">
                    <h4>What&apos;s Included:</h4>
                    <div className="feature-check"><i className="fa-solid fa-check" /> {course.duration} of content</div>
                    <div className="feature-check"><i className="fa-solid fa-check" /> Hands-on projects</div>
                    <div className="feature-check"><i className="fa-solid fa-check" /> Discord community</div>
                    <div className="feature-check"><i className="fa-solid fa-check" /> Lifetime access</div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="grid-bg"></div>
        <div className="cta-content reveal">
          <h2>Ready to Start Learning?</h2>
          <p>Join our community and start building your future today.</p>
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
              <i className="fa-solid fa-envelope" /> Contact Us
            </Link>
            <a href="https://discord.gg/TVRxJg3rcN" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <i className="fa-brands fa-discord" /> Join Our Community
            </a>
          </div>
        </div>
      </section>
      </div>

      {/* TEST MODAL */}
      <TestModal test={activeTest} onClose={() => { setActiveTest(null); fetchStudentTests(); }} onSubmitted={fetchStudentTests} />

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
              
              
              <li><Link href="/#courses">Programs</Link></li>
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

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        onConfirm={async () => { await confirmModal.onConfirm(); setConfirmModal(prev => ({ ...prev, open: false })); }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        danger={confirmModal.danger}
        icon={confirmModal.icon}
      />
    </>
  );
}
