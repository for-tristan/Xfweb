'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { WaveInput } from '@/components/WaveInput';
import { usePageFeatures, type Enrollment } from '@/lib/usePageFeatures';
import { SearchModal, AuthModal, AuthGate, ProfileModal } from '@/lib/PageModals';
import { Navbar } from '@/components/Navbar';
import { Logo } from '@/components/Logo';
import dynamic from 'next/dynamic';

const TestModal = dynamic(() => import('@/components/TestModal'), { ssr: false });
const ModuleContent = dynamic(() => import('@/components/ModuleContent'), { ssr: false });
import ConfirmModal from '@/components/ConfirmModal';
import GradualBlur from '@/components/GradualBlur';
import { rafThrottle } from '@/lib/throttle';

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

  const [course, setCourse] = useState<Course | null>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formExperience, setFormExperience] = useState('');
  const [formMotivation, setFormMotivation] = useState('');

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

  const [certificate, setCertificate] = useState<{ certificateId: string; courseName: string; completionDate: string } | null>(null);
  const [certDownloading, setCertDownloading] = useState(false);

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

  const enrollmentsCheckedRef = useRef(false);

  // PERF: Combined all 4 user-dependent fetches into a single useEffect
  // with Promise.all so they run in parallel instead of sequentially.
  useEffect(() => {
    if (!user || !slug || enrollmentsCheckedRef.current) return;
    enrollmentsCheckedRef.current = true;
    setModulesLoading(true);

    (async () => {
      const [enrollRes, modulesRes, testsRes, certRes] = await Promise.all([
        fetch('/api/courses/my-enrollments').catch(() => null),
        fetch(`/api/courses/modules?courseId=${slug}`).catch(() => null),
        fetch('/api/courses/tests').catch(() => null),
        fetch(`/api/courses/certificate?courseId=${slug}`).catch(() => null),
      ]);

      // Process enrollments
      if (enrollRes?.ok) {
        try {
          const data = await enrollRes.json();
          if (data?.enrollments) {
            const match = data.enrollments.find((e: Enrollment) => e.courseId === slug);
            if (match) setEnrollment(match);
          }
        } catch {}
      }

      // Process modules
      if (modulesRes?.ok) {
        try {
          const data = await modulesRes.json();
          if (data?.modules) {
            setCourseModules(data.modules);
          }
        } catch {}
      }
      setModulesLoading(false);

      // Process tests
      if (testsRes?.ok) {
        try {
          const data = await testsRes.json();
          const results: StudentTest[] = (data?.tests || []).map((t: any) => ({
            id: t.id, title: t.title, description: t.description || '', timeLimit: t.timeLimit,
            passingScore: t.passingScore, questionCount: t.questionCount || 0,
            moduleId: t.moduleId, moduleTitle: t.moduleTitle, moduleOrder: t.moduleOrder || 0,
            questions: t.questions || [], hasCompleted: !!t.attempt?.submittedAt,
            attempt: t.attempt?.submittedAt ? { score: t.attempt.score, totalPoints: t.attempt.totalPoints, passed: t.attempt.passed, submittedAt: t.attempt.submittedAt } : null,
          }));
          setStudentTests(results);
        } catch {}
      }

      // Process certificate
      if (certRes?.ok) {
        try {
          const data = await certRes.json();
          if (data?.hasCertificate) {
            setCertificate({ certificateId: data.certificateId, courseName: data.courseName, completionDate: data.completionDate });
          }
        } catch {}
      }
    })();
  }, [user, slug]);

  const toggleModule = (modId: string) => {
    setExpandedModule(prev => prev === modId ? null : modId);
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuthModal('signin', 'Please sign in to request enrollment'); return; }
    if (!formName || !formEmail || !formPhone || !formMotivation) { toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' }); return; }
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
              phone: formPhone,
              experienceLevel: formExperience,
              motivation: formMotivation,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            toast({ title: 'Request Submitted!', description: 'Your enrollment request is pending review' });
            enrollmentsCheckedRef.current = false;
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

  const courseFeatures: string[] = (() => {
    if (!course?.features) return [];
    try {
      const parsed = JSON.parse(course.features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const courseTechStack: string[] = (() => {
    if (!course?.techStack) return [];
    try {
      const parsed = JSON.parse(course.techStack);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

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

        {!(loading || minLoading) && <Navbar activePage="courses" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />}
      </>
    );
  }

  if (notFound) {
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

        {!(loading || minLoading) && <Navbar activePage="courses" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />}

        {!(loading || minLoading) && <section style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 120 }}>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 32, color: 'var(--text-light)', marginBottom: 12 }}>Course Not Found</h1>
            <p className="page-subtitle" style={{ color: 'var(--text-dim)', marginBottom: 24 }}>The course you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link href="/#courses" onClick={(e) => { e.preventDefault(); router.push('/'); setTimeout(() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="btn btn-primary"><i className="fa-solid fa-arrow-left" /> View All Programs</Link>
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
      </>
    );
  }

  if (!course) return null;

  return (
    <>
      <title>{course.title} | XFoundry Courses</title>
      <meta name="description" content={course.description || `${course.title} course by XFoundry. Enroll now and start learning.`} />
      <meta property="og:title" content={`${course.title} | XFoundry Courses`} />
      <meta property="og:description" content={course.description || `${course.title} course by XFoundry.`} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${course.title} | XFoundry Courses`} />
      <meta name="twitter:description" content={course.description || `${course.title} course by XFoundry.`} />

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

      {!(loading || minLoading) && <Navbar activePage="courses" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />}

      {!(loading || minLoading) && <div className="page-transition-enter">

      <section style={{ background: 'var(--black)', padding: '160px 60px 40px', position: 'relative', overflow: 'hidden', zIndex: 2 }}>
        <div className="container-max" style={{ paddingLeft: isMobile ? 16 : undefined, paddingRight: isMobile ? 16 : undefined, maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 36, fontWeight: 800, color: 'var(--text-light)', marginTop: 16 }}>
              {course.title.split('&').length > 1 ? (
                <>{course.title.split('&')[0].trim()}&amp; <span className="v-highlight">{course.title.split('&')[1].trim()}</span></>
              ) : (
                <>{course.title.split(' ').slice(0, Math.ceil(course.title.split(' ').length / 2)).join(' ')} <span className="v-highlight">{course.title.split(' ').slice(Math.ceil(course.title.split(' ').length / 2)).join(' ')}</span></>
              )}
            </h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <div className="course-main reveal-up">
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
                        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)', paddingLeft: 56 }}>
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

            <aside className="enroll-card reveal-up reveal-delay-1">
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
                    <WaveInput label="Full Name *" type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                    <WaveInput label="Email Address *" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
                    <WaveInput label="Phone Number *" type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+20..." required />
                    <div className="form-group">
                      <label>Experience Level</label>
                      <select value={formExperience} onChange={(e) => setFormExperience(e.target.value)}>
                        <option value="" disabled>Select level...</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <WaveInput label="What motivates you? *" type="text" value={formMotivation} onChange={(e) => setFormMotivation(e.target.value)} required />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }} disabled={enrolling}>
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

      <section className="cta-section">
        <div className="cta-content reveal-up">
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
      </div>}

      <TestModal test={activeTest} onClose={() => { setActiveTest(null); fetchStudentTests(); }} onSubmitted={fetchStudentTests} />

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
