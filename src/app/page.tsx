'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCustomCursor } from '@/hooks/useCustomCursor';

import { SkeletonHero, SkeletonSectionHeader, SkeletonServiceCard, SkeletonCourseCard } from '@/components/SkeletonScreens';
// WordSpinner removed — replaced by .xf-loader CSS dots
import { ChatModal } from '@/components/ChatModal';
import ConfirmModal from '@/components/ConfirmModal';
import VideoTemplate from '@/components/video/VideoTemplate';
import { SearchModal, AuthModal } from '@/lib/PageModals';
import { AvatarCropModal } from '@/components/AvatarCropModal';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { WaveInput } from '@/components/WaveInput';
import { WaveTextarea } from '@/components/WaveTextarea';
import { SectionReveal, StaggerReveal, ScrollProgressBar, ParallaxLayer, TextSplitReveal, CounterAnimation, TiltCard, GlowButton, FloatingParticles, MorphingShape } from '@/components/ScrollAnimations';
import { Logo } from '@/components/Logo';
import GradualBlur from '@/components/GradualBlur';


// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  emailVerified?: string | null;
  phone: string | null;
  company: string | null;
  avatar: string | null;
}

interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  courseLevel: string;
  duration: string;
  status: string;
  experienceLevel: string | null;
  motivation: string | null;
  enrolledAt: string;
  deletedAt: string | null;
}

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  serviceType: string;
  budget: string | null;
  description: string;
  status: string;
  createdAt: string;
}

interface Course {
  id: string;
  name: string;
  category: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  icon: string;
  features: string[];
  enrollmentCount?: number;
}

// ═══════════════════════════════════════════════════
// DATA (dynamic fallback)
// ═══════════════════════════════════════════════════

const fallbackCourses: Course[] = [];

interface DynamicService {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  status: string;
  features: { id: string; title: string; description: string; icon: string }[];
}

const staticSearchData = [
  { title: 'Jack Voice Assistant', category: 'Project', desc: 'AI voice assistant project', link: '#projects' },
  { title: 'Transparent Dotfiles', category: 'Project', desc: 'Linux customization config', link: '#projects' },
  { title: 'Real-time Web View', category: 'Project', desc: 'Live coding visualization', link: '#projects' },
  { title: 'Contact Us', category: 'Page', desc: 'Get in touch with our team', link: '#contact' },
  { title: 'Our Team', category: 'Page', desc: 'Meet Marwan Montaser', link: '#team' },
];

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 2 + 1}px`,
    duration: `${Math.random() * 20 + 15}s`,
    delay: `${Math.random() * 15}s`,
  }));
}


//
// ═══════════════════════════════════════════════════
// FAQ COMPONENT
// ═══════════════════════════════════════════════════

// Character-by-character reveal component (Vaulta SplitText style)
function BlurText({ text, tag = 'span', className = '', stagger = 0.02 }: { text: string; tag?: string; className?: string; stagger?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRevealed(true);
      } else {
        setRevealed(false);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chars = text.split('').map((char, i) => (
    <span
      key={i}
      className={`blur-char${char === ' ' ? ' space' : ''}`}
      style={revealed ? { transitionDelay: `${i * stagger}s` } : undefined}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

  const El = tag as any;
  return <El ref={ref} className={`blur-text${revealed ? ' revealed' : ''} ${className}`}>{chars}</El>;
}

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`v-faq-item${open ? ' v-faq-active' : ''}`}>
      <button onClick={() => setOpen(!open)}>
        <span className="v-faq-question">{question}</span>
        <span className="v-faq-icon-wrap">
          <i className={`fa-solid ${open ? 'fa-minus' : 'fa-plus'}`} style={{ fontSize: 12 }} />
        </span>
      </button>
      <div className="v-faq-answer" style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, padding: open ? undefined : '0 24px 0', overflow: 'hidden' }}>
        {answer}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ENROLL BUTTON COMPONENT
// ═══════════════════════════════════════════════════

function EnrollButton({ courseId, courseName, onEnroll, status }: {
  courseId: string;
  courseName: string;
  onEnroll: () => void;
  status?: string;
}) {
  if (status === 'approved') {
    return (
      <button className="v-course-enroll-btn enrolled" disabled>
        <i className="fa-solid fa-check" /> Enrolled
      </button>
    );
  }
  if (status === 'pending') {
    return (
      <button className="v-course-enroll-btn pending" disabled>
        <i className="fa-solid fa-hourglass-half" /> Pending...
      </button>
    );
  }
  if (status === 'declined') {
    return (
      <button className="v-course-enroll-btn" onClick={onEnroll}>
        Re-apply →
      </button>
    );
  }
  return (
    <button className="v-course-enroll-btn" onClick={onEnroll}>
      Enroll Now →
    </button>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();

  // ── Auth ──
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [minLoading, setMinLoading] = useState(true);

  // ── Modals ──
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState('');
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // ── Login Form ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Signup Form ──
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupRole, setSignupRole] = useState('student');
  const [signupLoading, setSignupLoading] = useState(false);

  // ── Forgot Password ──
  const [forgotStep, setForgotStep] = useState<'idle' | 'email' | 'code'>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // ── Email Verification ──
  const [verificationStep, setVerificationStep] = useState<'idle' | 'pending'>('idle');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // ── Dashboard ──
  const [dashTab, setDashTab] = useState('profile');

  // ── Profile Edit ──
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<Record<string, string>>({}); // courseId -> status
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // ── Dashboard Quote Form ──
  const [dqName, setDqName] = useState('');
  const [dqEmail, setDqEmail] = useState('');
  const [dqPhone, setDqPhone] = useState('');
  const [dqCompany, setDqCompany] = useState('');
  const [dqService, setDqService] = useState('');
  const [dqBudget, setDqBudget] = useState('');
  const [dqDescription, setDqDescription] = useState('');
  const [dqLoading, setDqLoading] = useState(false);

  // ── Contact Quote Form ──
  const [cqFirstName, setCqFirstName] = useState('');
  const [cqLastName, setCqLastName] = useState('');
  const [cqEmail, setCqEmail] = useState('');
  const [cqPhone, setCqPhone] = useState('');
  const [cqCompany, setCqCompany] = useState('');
  const [cqService, setCqService] = useState('');
  const [cqMessage, setCqMessage] = useState('');
  const [cqLoading, setCqLoading] = useState(false);
  const [cqSuccess, setCqSuccess] = useState(false);



  // ── Service Detail Modal ──
  // ── Enrollment Request Modal ──
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);
  const [erExperience, setErExperience] = useState('');
  const [erMotivation, setErMotivation] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  // ── Notifications ──
  const [notifications, setNotifications] = useState<Array<{id:string;title:string;message:string;read:boolean;createdAt:string;type?:string}>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // ── Cancel enrollment ──
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  // Confirm modals
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; confirmLabel: string; danger: boolean; icon: string; onConfirm: () => void }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, icon: 'fa-solid fa-exclamation-triangle', onConfirm: () => {} });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'password'>('confirm');

  const openConfirm = (title: string, message: string, onConfirm: () => void, opts?: { confirmLabel?: string; danger?: boolean; icon?: string }) => {
    setConfirmModal({
      open: true, title, message,
      confirmLabel: opts?.confirmLabel || 'Confirm',
      danger: opts?.danger !== undefined ? opts.danger : false,
      icon: opts?.icon || 'fa-solid fa-exclamation-triangle',
      onConfirm,
    });
  };

  const [serviceModal, setServiceModal] = useState<string | null>(null);



  // ── Friends ──
  const [friends, setFriends] = useState<Array<{id:string;friendId:string;name:string;username:string;avatar:string|null;createdAt:string}>>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{id:string;friendId:string;name:string;username:string;avatar:string|null;createdAt:string}>>([]);
  const [sentRequests, setSentRequests] = useState<Array<{id:string;friendId:string;name:string;username:string;avatar:string|null;createdAt:string}>>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [addFriendUsername, setAddFriendUsername] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChatFriend, setSelectedChatFriend] = useState<{id:string;friendId:string;name:string;username:string;avatar:string|null;createdAt:string} | null>(null);

  // ── UI ──
  const [scrolled, setScrolled] = useState(false); const [particles, setParticles] = useState<Array<{id:number;left:string;size:string;duration:string;delay:string}>>([]);
  const [atBottom, setAtBottom] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');



  // ── Refs ──
  const cursorDotRef = useRef<HTMLDivElement>(null);
  useCustomCursor(cursorDotRef);


  // ═══════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════
useEffect(() => {
  setParticles(generateParticles(75));
}, []);
  // Minimum 3-second loader display
  useEffect(() => {
    const timer = setTimeout(() => setMinLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  // Auth check — logged-out users can still view the homepage
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else if (res.status === 403) {
          // Existing user whose email is not yet verified —
          // redirect to auth page for verification flow
          const data = await res.json();
          if (data.needsVerification) {
            setUser(null);
            router.push('/auth');
            return;
          }
        } else {
          // Not authenticated — allow browsing but no user
          setUser(null);
        }
      } catch {
        // Not authenticated — allow browsing but no user
        setUser(null);
      }
      setAuthLoading(false);
    })();
  }, [router, toast]);

  // Load enrollments & quotes when user logs in
  const loadEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    try {
      const res = await fetch('/api/courses/my-enrollments');
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments);
        setEnrollmentStatus(Object.fromEntries(data.enrollments.map((e: Enrollment) => [e.courseId, e.status])));
      }
    } catch { /* err */ }
    setEnrollmentsLoading(false);
  }, []);



  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch { /* err */ }
  }, []);

  // ── Friends ──
  const loadFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const res = await fetch('/api/friends');
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setPendingRequests(data.pendingRequests || []);
        setSentRequests(data.sentRequests || []);
      }
    } catch { /* err */ }
    setFriendsLoading(false);
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendUsername.trim()) { toast({ title: 'Error', description: 'Please enter a username', variant: 'destructive' }); return; }
    setAddFriendLoading(true);
    try {
      const res = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friendUsername: addFriendUsername.trim() }) });
      const data = await res.json();
      if (res.ok) { toast({ title: 'Request Sent!', description: data.message }); setAddFriendUsername(''); loadFriends(); }
      else { toast({ title: 'Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setAddFriendLoading(false);
  };

  const handleAcceptFriend = async (friendshipId: string) => {
    try {
      const res = await fetch('/api/friends', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friendshipId, action: 'accept' }) });
      if (res.ok) { toast({ title: 'Friend Added!' }); loadFriends(); loadNotifications(); }
    } catch { /* err */ }
  };

  const handleRejectFriend = async (friendshipId: string) => {
    try {
      const res = await fetch('/api/friends', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friendshipId, action: 'reject' }) });
      if (res.ok) { toast({ title: 'Request Declined' }); loadFriends(); }
    } catch { /* err */ }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      const res = await fetch(`/api/friends?friendshipId=${friendshipId}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'Friend Removed' }); loadFriends(); }
    } catch { /* err */ }
  };

  const handleCancelSentRequest = (friendshipId: string) => {
    openConfirm(
      'Cancel Request',
      'Are you sure you want to cancel this friend request?',
      async () => {
        try {
          const res = await fetch(`/api/friends?friendshipId=${friendshipId}`, { method: 'DELETE' });
          if (res.ok) { toast({ title: 'Request Cancelled' }); loadFriends(); }
        } catch { /* err */ }
      },
      { confirmLabel: 'Cancel Request', danger: false, icon: 'fa-solid fa-paper-plane' }
    );
  };

  const loadQuotes = useCallback(async () => {
    setQuotesLoading(true);
    try {
      const res = await fetch('/api/quotes/my-quotes');
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes);
      }
    } catch { /* err */ }
    setQuotesLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const init = () => { loadEnrollments(); loadQuotes(); loadNotifications(); loadFriends(); };
    init();
  }, [user, loadEnrollments, loadQuotes, loadNotifications, loadFriends]);

  // Poll notifications every 30s so friend requests show up in real-time
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { loadNotifications(); loadFriends(); }, 30000);
    return () => clearInterval(interval);
  }, [user, loadNotifications, loadFriends]);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      // Detect bottom of page
      const distFromBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      setAtBottom(distFromBottom < 80);
      // Active nav highlighting
      const scrollPos = window.scrollY + 150;
      const ids = ['home', 'services', 'courses', 'contact'];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
          setActiveNav(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Theme: initialize from localStorage
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('x-foundry-theme') || 'oled';
    // Backwards compat: map old 'dark' or 'vaulta' to light
    if (saved === 'dark' || saved === 'vaulta') return 'light';
    return saved;
  });
  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    const lightThemeIds = ['light', 'sand', 'lavender', 'mint', 'rose-gold', 'honey', 'clay', 'sage', 'peach'];
    document.documentElement.classList.toggle('dark', !lightThemeIds.includes(theme));
  }, [theme]);

  // Load profile data when dashboard opens or profile tab selected
  useEffect(() => {
    if (dashboardOpen && user) {
      setProfileName(user.name || '');
      setProfileUsername(user.username || '');
      setProfilePhone((user as unknown as Record<string, unknown>).phone as string || '');
      setProfileCompany((user as unknown as Record<string, unknown>).company as string || '');
    }
  }, [dashboardOpen, user]);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.1 });
    const els = document.querySelectorAll('.reveal');
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [authModalOpen, dashboardOpen, serviceModal]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setAuthModalOpen(false); setDashboardOpen(false); setSearchOpen(false); setServiceModal(null); setMobileMenuOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);



  // ═══════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════

  const handleThemeToggle = () => {
    const lightThemeIds = ['light', 'sand', 'lavender', 'mint', 'rose-gold', 'honey', 'clay', 'sage', 'peach'];
    const isDark = !lightThemeIds.includes(theme) && theme !== '';
    const next = isDark ? '' : 'crimson';
    setTheme(next);
    localStorage.setItem('x-foundry-theme', next);
  };

  const handleChangeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('x-foundry-theme', newTheme);
  };

  const openAuthModal = (tab: 'signin' | 'signup', msg?: string) => {
    // Navigate to the /auth page instead of opening a modal
    router.push(`/auth?tab=${tab}${msg ? `&msg=${encodeURIComponent(msg)}` : ''}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' }); return; }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
      const data = await res.json();
      if (res.ok) { setUser(data.user); setAuthModalOpen(false); setVerificationStep('idle'); setDqName(data.user.name); setDqEmail(data.user.email); setCqEmail(data.user.email); setProfileName(data.user.name); setProfilePhone(data.user.phone || ''); setProfileCompany(data.user.company || ''); toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` }); setLoginEmail(''); setLoginPassword(''); }
      else if (res.status === 403 && data.needsVerification) { setVerificationEmail(data.email); setVerificationCode(''); setVerificationStep('pending'); toast({ title: 'Verification Required', description: data.error }); }
      else { toast({ title: 'Login Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setLoginLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) { toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' }); return; }
    if (signupPassword.length < 8) { toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' }); return; }
    if (signupPassword !== signupConfirmPassword) { toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' }); return; }
    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword, phone: signupPhone || undefined, company: signupCompany || undefined, role: signupRole }) });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresVerification) {
          setVerificationEmail(data.email);
          setVerificationCode('');
          setVerificationStep('pending');
          toast({ title: 'Check your email!', description: 'A 6-digit verification code has been sent to your email.' });
        } else {
          setUser(data.user); setAuthModalOpen(false); setDqName(data.user.name); setDqEmail(data.user.email); setCqEmail(data.user.email); toast({ title: 'Account created!', description: `Welcome to XFoundry, ${data.user.name}` });
        }
        setSignupName(''); setSignupEmail(''); setSignupPassword(''); setSignupConfirmPassword(''); setSignupPhone(''); setSignupCompany('');
      } else { toast({ title: 'Signup Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setSignupLoading(false);
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setUser(null); setEnrollments([]); setEnrollmentStatus({}); setQuotes([]);
    setDashboardOpen(false);
    setVerificationStep('idle');
    toast({ title: 'Logged out', description: 'See you soon!' });
    router.push('/');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { toast({ title: 'Error', description: 'Please enter your email', variant: 'destructive' }); return; }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Code Sent!', description: 'If an account exists, a 6-digit code has been sent to your email.' });
        setForgotStep('code');
      } else { toast({ title: 'Error', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setForgotLoading(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) { toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' }); return; }
    if (newPassword.length < 8) { toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' }); return; }
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, code: resetCode, newPassword }) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Password Reset!', description: 'Your password has been updated. You can now sign in.' });
        setForgotStep('idle'); setForgotEmail(''); setResetCode(''); setNewPassword('');
        setAuthTab('signin');
      } else { toast({ title: 'Reset Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setResetLoading(false);
  };

  const openEnrollModal = (course: Course) => {
    if (!user) { openAuthModal('signin', 'Please sign in to enroll in courses'); return; }
    const status = enrollmentStatus[course.id];
    if (status === 'approved') { toast({ title: 'Already Enrolled', description: `You're already enrolled in ${course.name}` }); return; }
    if (status === 'pending') { toast({ title: 'Enrollment Pending', description: `Your enrollment request for ${course.name} is pending review` }); return; }
    if (status === 'declined') { /* allow re-enrollment after decline */ }
    setEnrollCourse(course);
    setErExperience('');
    setErMotivation('');
    setEnrollModalOpen(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollCourse) return;
    if (!user) { openAuthModal('signin'); return; }
    if (!erExperience || !erMotivation) { toast({ title: 'Missing Fields', description: 'Please fill in your experience level and motivation', variant: 'destructive' }); return; }
    openConfirm(
      'Confirm Enrollment',
      `Are you sure you want to enroll in "${enrollCourse.name}"? An admin will review your request.`,
      async () => {
        setEnrollLoading(true);
        try {
          const res = await fetch('/api/courses/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: enrollCourse!.id,
              courseName: enrollCourse!.name,
              courseLevel: enrollCourse!.level,
              duration: enrollCourse!.duration,
              experienceLevel: erExperience,
              motivation: erMotivation,
            }),
          });
          const data = await res.json();
          if (res.ok) { toast({ title: 'Request Submitted!', description: `Your enrollment request for ${enrollCourse!.name} has been submitted.` }); setEnrollModalOpen(false); loadEnrollments(); }
          else { toast({ title: 'Enrollment Failed', description: data.error, variant: 'destructive' }); }
        } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
        setEnrollLoading(false);
      },
      { confirmLabel: 'Enroll', icon: 'fa-solid fa-graduation-cap' }
    );
  };

  const handleCancelEnrollment = (enrollmentId: string, courseName?: string) => {
    openConfirm(
      'Cancel Enrollment',
      `Are you sure you want to cancel your enrollment${courseName ? ` in "${courseName}"` : ''}? This action cannot be undone.`,
      async () => {
        setCancelLoading(enrollmentId);
        try {
          const res = await fetch('/api/courses/cancel-enrollment', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enrollmentId }),
          });
          const data = await res.json();
          if (res.ok) { toast({ title: 'Enrollment Cancelled', description: 'Your enrollment has been cancelled' }); loadEnrollments(); }
          else { toast({ title: 'Cancel Failed', description: data.error, variant: 'destructive' }); }
        } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
        setCancelLoading(null);
      },
      { confirmLabel: 'Cancel Enrollment', danger: true, icon: 'fa-solid fa-times-circle' }
    );
  };

  const handleContactQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cqFirstName || !cqLastName || !cqEmail || !cqService || !cqMessage) { toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' }); return; }
    setCqLoading(true);
    try {
      const res = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `${cqFirstName} ${cqLastName}`, email: cqEmail, phone: cqPhone, company: cqCompany || undefined, serviceType: cqService, description: cqMessage }) });
      const data = await res.json();
      if (res.ok) { setCqSuccess(true); toast({ title: 'Inquiry Submitted!', description: 'We will get back to you within 24 hours' }); }
      else if (res.status === 401) { toast({ title: 'Sign In Required', description: 'Please sign in to submit a quote request', variant: 'destructive' }); }
      else { toast({ title: 'Submission Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setCqLoading(false);
  };

  const handleDashQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dqName || !dqEmail || !dqService || !dqDescription) { toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' }); return; }
    setDqLoading(true);
    try {
      const res = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: dqName, email: dqEmail, phone: dqPhone, company: dqCompany || undefined, serviceType: dqService, budget: dqBudget || undefined, description: dqDescription }) });
      const data = await res.json();
      if (res.ok) { toast({ title: 'Quote Submitted!', description: 'We will get back to you shortly' }); setDqService(''); setDqBudget(''); setDqDescription(''); loadQuotes(); setDashTab('my-quotes'); }
      else { toast({ title: 'Submission Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setDqLoading(false);
  };

  const resetContactForm = () => {
    setCqFirstName(''); setCqLastName(''); setCqEmail(''); setCqPhone(''); setCqCompany(''); setCqService(''); setCqMessage('');
    setCqSuccess(false);
  };

  // ── Profile & Avatar ──
  const loadProfileData = () => {
    if (user) {
      setProfileName(user.name || '');
      setProfileUsername(user.username || '');
      setProfilePhone((user as unknown as Record<string, unknown>).phone as string || '');
      setProfileCompany((user as unknown as Record<string, unknown>).company as string || '');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Avatar must be under 2MB', variant: 'destructive' });
      return;
    }
    setCropImageFile(file);
    setCropModalOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropModalOpen(false);
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');
      const res = await fetch('/api/user/avatar', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setUser({ ...user!, avatar: data.avatarUrl });
        toast({ title: 'Avatar Updated', description: 'Your profile picture has been updated' });
      } else {
        toast({ title: 'Upload Failed', description: (await res.json()).error, variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' }); }
    setAvatarUploading(false);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) { toast({ title: 'Error', description: 'Name is required', variant: 'destructive' }); return; }
    setProfileSaving(true);
    try {
      const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profileName, username: profileUsername, phone: profilePhone, company: profileCompany }) });
      if (res.ok) {
        const data = await res.json();
        setUser({ ...user!, name: data.user.name, username: data.user.username, phone: data.user.phone, company: data.user.company });
        setDqName(data.user.name);
        toast({ title: 'Profile Updated', description: 'Your profile has been saved' });
      } else { toast({ title: 'Update Failed', description: (await res.json()).error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setProfileSaving(false);
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return '';
    let s = 0;
    if (pw.length >= 8) s++; if (pw.length >= 12) s++; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 2) return 'weak'; if (s <= 3) return 'medium'; return 'strong';
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const scrollToSection = (id: string) => {
    // Close the menu first so the body scroll-lock cleanup runs
    // (which restores window.scrollTo to the pre-menu position).
    // Then, after the cleanup has completed, scroll to the target section.
    setMobileMenuOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  };

  // Handle incoming hash fragments (e.g. /#services from other pages)
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      // Poll for element since dynamic sections may not be rendered yet
      let attempts = 0;
      const poll = setInterval(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          // Clean up hash without re-triggering
          history.replaceState(null, '', window.location.pathname);
          clearInterval(poll);
        }
        attempts++;
        if (attempts > 40) clearInterval(poll); // give up after ~2s
      }, 50);
      return () => clearInterval(poll);
    }
  }, []);

  const [dynamicServices, setDynamicServices] = useState<DynamicService[]>([]);
  const [dynamicCourses, setDynamicCourses] = useState<Course[]>([]);
  const [dynamicTeam, setDynamicTeam] = useState<Array<{id:string;name:string;role:string;bio:string;avatar:string;icon:string;linkedinUrl:string;githubUrl:string;displayOrder:number}>>([]);

  // Fetch services, courses, and team from API
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        const [servicesRes, coursesRes, teamRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/courses'),
          fetch('/api/team'),
        ]);
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setDynamicServices(servicesData.services || []);
        }
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setDynamicCourses((coursesData.courses || []).map((c: { id: string; title: string; slug: string; description: string; level: string; duration: string; price: string; icon: string; features: string[]; moduleCount?: number; enrollmentCount?: number }) => ({
            id: c.slug,
            name: c.title,
            category: c.level + ' Course',
            description: c.description,
            level: c.level,
            duration: c.duration,
            price: c.price,
            icon: c.icon,
            features: Array.isArray(c.features) ? c.features : JSON.parse(c.features || '[]'),
            enrollmentCount: c.enrollmentCount || 0,
          })));
        }
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setDynamicTeam(teamData.members || []);
        }
      } catch (e) { console.error('Failed to fetch dynamic data:', e); }
    };
    fetchDynamicData();
  }, []);

  // Site content
  const siteName = 'X-Foundry';
  const contactEmail = 'xfoundationcom@gmail.com';
  const contactPhone = '+201234567890';
  const businessHours = 'Sun - Thu: 9:00 AM - 6:00 PM EET';
  const linkedinUrl = 'https://www.linkedin.com/in/marwan-montaser-067054387/';
  const githubUrl = 'https://github.com/for-tristan';
  const discordUrl = 'https://discord.gg/TVRxJg3rcN';

  const availableCourses = dynamicCourses.length > 0 ? dynamicCourses : fallbackCourses;
  const servicesDataArr = dynamicServices;
  const servicesDataMap: Record<string, DynamicService> = {};
  servicesDataArr.forEach(s => { servicesDataMap[s.slug] = s; });

  // Dynamic search data
  const dynamicSearchData = [
    ...servicesDataArr.map(s => ({ title: s.title, category: 'Service', desc: s.description.substring(0, 60) + '...', link: `/services/${s.slug}` })),
    ...dynamicCourses.map(c => ({ title: c.name, category: 'Course', desc: c.description.substring(0, 60) + '...', link: `/courses/${c.id}` })),
    ...staticSearchData,
  ];

  const filteredSearch = searchQuery.length >= 2
    ? dynamicSearchData.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  return (
    <>

     {/* ──── RESPONSIVE NAV ──── */}


      {/* ──── GLOBAL PARTICLES ──── */}
      {particles.length > 0 && (
      <div className="global-particles" style={{ zIndex: 9 }}>
      {particles.map((p) => (
          <div key={p.id} className="particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: p.duration, animationDelay: p.delay }} />
        ))}
      </div>
     )}
      {/* ──── CUSTOM CURSOR ──── */}
      <div ref={cursorDotRef} className="cursor-dot" />

      {/* ═══════════════════════════════════════════════════
          NAVIGATION
          ═══════════════════════════════════════════════════ */}
        {!(authLoading || minLoading) && <Navbar activePage="home" activeNav={activeNav} scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} onNavClick={(e: React.MouseEvent<HTMLElement>) => { if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('nav-links')) setMobileMenuOpen(false); }} theme={theme} onToggleTheme={handleThemeToggle} onChangeTheme={handleChangeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications as any} setUnreadCount={setUnreadCount as any} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} onAcceptFriend={handleAcceptFriend} onRejectFriend={handleRejectFriend} />}

      {/* ═══════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════ */}
      {(authLoading || minLoading) ? (
        <div className="xf-loader"><div className="xf-loader-dot" /><div className="xf-loader-dot" /><div className="xf-loader-dot" /></div>
      ) : (
      <>

      {/* ═══════════════════════════════════════════════════
          SCROLL PROGRESS BAR
          ═══════════════════════════════════════════════════ */}
      <ScrollProgressBar />

      {/* ═══════════════════════════════════════════════════
          GRADUAL BLUR — bottom page-level scroll blur
          Fades out when scrolled to the bottom so copyright stays clear
          ═══════════════════════════════════════════════════ */}
      {!atBottom && (
        <GradualBlur
          target="page"
          position="bottom"
          height="3.5rem"
          strength={1}
          divCount={6}
          curve="bezier"
          exponential={false}
          opacity={1}
          zIndex={50}
        />
      )}

      {/* ═══════════════════════════════════════════════════
          HERO — VAULTA0 RESTYLED
          ═══════════════════════════════════════════════════ */}
      <section className="v-hero" id="home">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative', zIndex: 10 }}>
          <ParallaxLayer speed={0.15}>
            <div style={{ position: 'relative', width: 720, height: 520, maxWidth: '90vw', maxHeight: '60vh' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                <VideoTemplate />
              </div>
            </div>
          </ParallaxLayer>
        </div>

        <div className="scroll-indicator" style={{ left: 0, right: 0 }}>
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SERVICES SECTION — VAULTA0 RESTYLED
          ═══════════════════════════════════════════════════ */}
      <section className="v-section" id="services">
        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <div className="v-section-badge"><span className="v-badge-text">Services</span></div>
          <h2 className="v-section-title"><BlurText text="Your Digital Future," tag="span" stagger={0.02} /> <span className="v-highlight">Built with Care</span></h2>
          <p className="v-section-desc" style={{ marginTop: 16 }}>
            Comprehensive technology solutions designed to accelerate your digital transformation.
          </p>
          </div>
        </SectionReveal>

        <StaggerReveal staggerDelay={100} direction="up">
        <div className="v-services-grid">
          {servicesDataArr.length > 0 ? servicesDataArr.map((service, idx) => (
              <div key={service.id} className="v-service-card" onClick={() => router.push(`/services/${service.slug}`)}>
              <div className="v-service-icon">
                <i className={service.icon}></i>
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <span className="v-service-link">Learn More <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }}></i></span>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#5d5d5d' }}>No services available yet.</div>
          )}
        </div>
        </StaggerReveal>
      </section>

      {/* ═══════════════════════════════════════════════════
          PROJECTS SECTION — VAULTA0 RESTYLED
          ═══════════════════════════════════════════════════ */}
      <section className="v-section" id="projects">

        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <div className="v-section-badge"><span className="v-badge-text">Projects</span></div>
            <h2 className="v-section-title"><BlurText text="Featured" tag="span" stagger={0.02} /> <span className="v-highlight">Projects</span></h2>
            <p className="v-section-desc" style={{ marginTop: 16 }}>
              Explore our portfolio of real-world projects.
            </p>
          </div>
        </SectionReveal>

        <StaggerReveal direction="up" staggerDelay={100}>
        <div className="v-projects-grid">
            <div className="v-project-card" style={{ display: (projectFilter === 'all' || projectFilter === 'ai') ? 'block' : 'none' }} data-category="ai">
              <div className="v-project-info">
                <div className="v-project-tags"><span className="v-project-tag">AI</span></div>
                <h3>Jack Voice Assistant</h3>
                <p>A fully Functional AI voice assistant for seamless human-computer interaction.</p>
                <a href="https://github.com/for-tristan/JackAi" target="_blank" rel="noopener noreferrer" className="v-project-link">View Case Study →</a>
              </div>
            </div>
            <div className="v-project-card" style={{ display: (projectFilter === 'all' || projectFilter === 'linux') ? 'block' : 'none' }} data-category="linux">
              <div className="v-project-info">
                <div className="v-project-tags"><span className="v-project-tag">Linux</span><span className="v-project-tag">UI</span></div>
                <h3>Transparent Dotfiles</h3>
                <p>HyDE config files for more clean and transparent look to Arch Linux.</p>
                <a href="https://github.com/for-tristan/Transparent-Dotfiles" target="_blank" rel="noopener noreferrer" className="v-project-link">View Case Study →</a>
              </div>
            </div>
            <div className="v-project-card" style={{ display: (projectFilter === 'all' || projectFilter === 'web') ? 'block' : 'none' }} data-category="web">
              <div className="v-project-info">
                <div className="v-project-tags"><span className="v-project-tag">Software</span><span className="v-project-tag">Java</span></div>
                <h3>Real-time Web View</h3>
                <p>This Project shows visual changes in the website while coding in real-time.</p>
                <a href="https://github.com/for-tristan/Real-time-web-view" target="_blank" rel="noopener noreferrer" className="v-project-link">View Case Study →</a>
              </div>
            </div>
        </div>
        </StaggerReveal>
      </section>

      {/* ═══════════════════════════════════════════════════
          COURSES SECTION — VAULTA0 RESTYLED
          ═══════════════════════════════════════════════════ */}
      <section className="v-section" id="courses">

        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <div className="v-section-badge"><span className="v-badge-text">Programs</span></div>
            <h2 className="v-section-title"><BlurText text="Tech" tag="span" stagger={0.02} /> <span className="v-highlight">Programs</span></h2>
            <p className="v-section-desc" style={{ marginTop: 16 }}>
              Master technologies with our expert-led programs.
            </p>
          </div>
        </SectionReveal>

        <StaggerReveal direction="up" staggerDelay={80}>
        <div className="v-courses-grid">
          {availableCourses.length > 0 ? availableCourses.map((course, idx) => {
            const techTags = course.features.slice(0, 4);
            return (
              <div key={course.id} className="v-course-card">
                  <div className="v-course-body">
                    <div className="v-course-top-row">
                      <span className="v-course-category">{course.category}</span>
                      <span className="v-course-level">{course.level}</span>
                    </div>
                    <h3 style={{ cursor: 'pointer' }} onClick={() => router.push(`/courses/${course.id}`)}>{course.name}</h3>
                    <p>{course.description}</p>
                    <div className="v-course-meta">
                      <span><i className="fa-solid fa-clock"></i> {course.duration}</span>
                      <span><i className="fa-solid fa-users"></i> {course.enrollmentCount != null ? `${course.enrollmentCount} enrolled` : 'Enrolling Now'}</span>
                    </div>
                    <div className="v-course-tags">
                      {techTags.map((tag, ti) => <span key={ti} className="v-course-tag">{tag}</span>)}
                    </div>
                    <div className="v-course-footer" style={{ justifyContent: 'flex-end' }}>
                      <EnrollButton courseId={course.id} courseName={course.name} onEnroll={() => openEnrollModal(course)} status={enrollmentStatus[course.id]} />
                    </div>
                  </div>
                </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', gridColumn: '1 / -1' }}>No courses available yet.</div>
          )}
        </div>
        </StaggerReveal>
      </section>

      {/* ═══════════════════════════════════════════════════
          FAQ SECTION — VAULTA0 RESTYLED
          ═══════════════════════════════════════════════════ */}
      <section className="v-section" id="faq">
        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <div className="v-section-badge"><span className="v-badge-text">FAQ</span></div>
            <h2 className="v-section-title"><BlurText text="Got" tag="span" stagger={0.02} /> <span className="v-highlight">Questions?</span></h2>
            <p className="v-section-desc" style={{ marginTop: 16 }}>Everything you need to know about X-Foundry courses and services.</p>
          </div>
        </SectionReveal>
        <StaggerReveal staggerDelay={100} direction="up">
         <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
         {[
            { q: 'how do these programs work?', a: `We dont teach you We Guide, instruct and test you throughout the program, we show you how to do it yourself and work efficiently , dependently and be more productive at what you wanna Learn. ` },
            { q: 'Are the programs really free?', a: 'Yes! For now since we are in our pre-production phase, all courses are completely free of charge.' },
            { q: 'What technologies do you work with?', a: 'We specialize in various technologies including python, java, Frontend Development, and Backend Development, Software Engineering, and more.' },
            { q: 'How do I request a custom project?', a: 'Navigate to our Contact section or use the "Request Quote" button on any service page. Fill in your project details, and our team will get back to you within 24 hours.' },
          ].map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} index={i} />
          ))}
        </div>
        </StaggerReveal>
      </section>

      {/* ═══════════════════════════════════════════════════
          TEAM SECTION — VAULTA0 RESTYLED
          ═══════════════════════════════════════════════════ */}
      <section className="v-section" id="team">

        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <div className="v-section-badge"><span className="v-badge-text">Team</span></div>
            <h2 className="v-section-title"><BlurText text="Meet The" tag="span" stagger={0.02} /> <span className="v-highlight">Team</span></h2>
            <p className="v-section-desc" style={{ marginTop: 16 }}>
              The people behind {siteName}
            </p>
          </div>
        </SectionReveal>

        <StaggerReveal direction="up" staggerDelay={100}>
        <div className="v-team-grid">
          {dynamicTeam.length > 0 ? dynamicTeam.map((m) => (
              <div key={m.id} className="v-team-card">
              <div className="v-team-avatar" style={m.avatar ? { padding: 0 } : {}}>
                {m.avatar
                  ? <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : <i className={m.icon || 'fa-solid fa-user-tie'}></i>
                }
              </div>
              <h3>{m.name}</h3>
              <span className="v-team-role">{m.role}</span>
              {m.bio && <p className="v-team-bio">{m.bio}</p>}
              {(m.linkedinUrl || m.githubUrl) && (
                <div className="v-team-socials">
                  {m.linkedinUrl && <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ position: 'relative', zIndex: 11 }}><i className="fa-brands fa-linkedin-in"></i></a>}
                  {m.githubUrl && <a href={m.githubUrl} target="_blank" rel="noopener noreferrer" style={{ position: 'relative', zIndex: 11 }}><i className="fa-brands fa-github"></i></a>}
                </div>
              )}
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <i className="fa-solid fa-users" style={{ fontSize: 32, marginBottom: 16, opacity: 0.3, display: 'block' }}></i>
              <p style={{ fontSize: 15, fontWeight: 600 }}>No team members yet.</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Check back soon to meet the team.</p>
            </div>
          )}
        </div>
        </StaggerReveal>
      </section>
      
      {/* ═══════════════════════════════════════════════════
          CONTACT SECTION — VAULTA0 RESTYLED
          ══════════════════════════════════════════════════ */}
      <section className="v-section" id="contact">

        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
            <div className="v-section-badge"><span className="v-badge-text">Contact</span></div>
            <h2 className="v-section-title"><BlurText text="Request A" tag="span" stagger={0.02} /> <span className="v-highlight">Quote</span></h2>
            <p className="v-section-desc" style={{ marginTop: 16 }}>
              Ready to transform your project? Let&apos;s discuss how X-Foundry can help you achieve your goals.
            </p>
          </div>
        </SectionReveal>

        <div className="v-contact-grid">
          <SectionReveal direction="left" delay={100}>
            <div className="v-contact-info">
            <h3>Let&apos;s Build Something Amazing Together</h3>
            <p>Whether you need custom software development, AI integration, security auditing, or team training — we&apos;re here to help. Reach out and let&apos;s start a conversation about your next big project.</p>
            <ul className="v-info-list">
              <li className="v-info-item">
                <div className="v-info-icon"><i className="fa-solid fa-envelope"></i></div>
                <div className="v-info-text">
                  <h4>Email Us</h4>
                  <p>{contactEmail}</p>
                </div>
              </li>
              <li className="v-info-item">
                <div className="v-info-icon"><i className="fa-solid fa-phone-alt"></i></div>
                <div className="v-info-text">
                  <h4>Call Us</h4>
                  <p>{contactPhone}</p>
                </div>
              </li>
              <li className="v-info-item">
                <div className="v-info-icon"><i className="fa-solid fa-clock"></i></div>
                <div className="v-info-text">
                  <h4>Business Hours</h4>
                  <p>{businessHours}</p>
                </div>
              </li>
            </ul>
          </div>
          </SectionReveal>

            <SectionReveal direction="right" delay={200}>
              <div className="v-quote-form">
              <div style={{ display: cqSuccess ? 'none' : 'block' }}>
              <div className="v-form-header">
                <i className="fa-solid fa-paper-plane"></i>
                <h3>Send Your Inquiry</h3>
              </div>
              <form onSubmit={handleContactQuote}>
                <div className="form-row">
                  <WaveInput label="First Name *" type="text" value={cqFirstName} onChange={(e) => setCqFirstName(e.target.value)} required />
                  <WaveInput label="Last Name *" type="text" value={cqLastName} onChange={(e) => setCqLastName(e.target.value)} required />
                </div>
                <div className="form-row">
                  <WaveInput label="Email Address *" type="email" value={cqEmail} onChange={(e) => setCqEmail(e.target.value)} required />
                  <WaveInput label="Phone Number" type="tel" value={cqPhone} onChange={(e) => setCqPhone(e.target.value)} />
                </div>
                <div className="form-row">
                  <WaveInput label="Company Name" type="text" value={cqCompany} onChange={(e) => setCqCompany(e.target.value)} />
                  <div className="form-group">
                    <label>Service Interested In *</label>
                    <select value={cqService} onChange={(e) => setCqService(e.target.value)} required>
                      <option value="">Select a service...</option>
                      <option value="AI & Machine Learning">AI &amp; Machine Learning</option>
                      <option value="Custom Software Development">Custom Software Development</option>
                      <option value="Tech Education & Training">Tech Training &amp; Education</option>
                      <option value="Other">Other / Not Sure</option>
                    </select>
                  </div>
                </div>
                <WaveTextarea label="Project Details *" value={cqMessage} onChange={(e) => setCqMessage(e.target.value)} required />
                <button type="submit" className="v-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px 24px' }} disabled={cqLoading}>
                  {cqLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</> : <><i className="fa-solid fa-paper-plane"></i> Submit Inquiry</>}
                </button>
              </form>
            </div>
            <div className={`form-success${cqSuccess ? ' show' : ''}`}>
              <div className="success-icon"><i className="fa-solid fa-check"></i></div>
              <h4>Inquiry Submitted!</h4>
              <p style={{ color: 'var(--text-dim)', marginTop: 10 }}>Our team will review your inquiry and get back to you within 24 hours.</p>
              <button className="v-btn-secondary" style={{ marginTop: 24 }} onClick={resetContactForm}>Submit Another</button>
            </div>
            </div>
            </SectionReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER — VAULTA0 RESTYLED
          ═══════════════════════════════════════════════════ */}
      <footer className="v-footer">

        <div className="v-footer-grid">
          <div className="v-footer-brand">
            <a href="/chat" className="nav-logo" style={{ display: 'inline-block', marginBottom: 20 }}><Logo className="nav-logo-img" style={{ height: 40 }} /></a>
            <p>Pioneering the future of technology through innovation, research, and education. Building solutions that transform industries and empower human potential.</p>
            <div className="v-footer-socials">
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-linkedin-in"></i></a>
              <a href={githubUrl} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-github"></i></a>
              <a href={discordUrl} target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-discord"></i></a>
            </div>
          </div>
          <div className="v-footer-column">
            <h4>Quick Links</h4>
            <ul className="v-footer-links">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
              <li><a href="#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Programs</a></li>
              <li><a href="/games">Games</a></li>
              <li><a href="/study">Study</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </div>
          <div className="v-footer-column">
              <h4>Roadmap & Practice</h4>
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
              <li><a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
              <li><a href={`tel:${contactPhone}`}>{contactPhone}</a></li>
            </ul>
          </div>
        </div>
        <div className="v-footer-bottom">
          <p>&copy; {new Date().getFullYear()} X-Foundry. All Rights Reserved.</p>
        </div>
      </footer>

      </>
      )}
      {/* ═══════════════════════════════════════════════════
          SEARCH MODAL
          ═══════════════════════════════════════════════════ */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => { if (link.startsWith('#')) { scrollToSection(link.replace('#', '')); } else { router.push(link); } }} />

      {/* ═══════════════════════════════════════════════════
          AUTH MODAL (shared component)
          ═══════════════════════════════════════════════════ */}
      <AuthModal
        open={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setForgotStep('idle'); }}
        tab={authTab}
        setTab={setAuthTab}
        message={authMessage}
        loginEmail={loginEmail} setLoginEmail={setLoginEmail}
        loginPassword={loginPassword} setLoginPassword={setLoginPassword}
        loginLoading={loginLoading} onLogin={handleLogin}
        signupName={signupName} setSignupName={setSignupName}
        signupEmail={signupEmail} setSignupEmail={setSignupEmail}
        signupPassword={signupPassword} setSignupPassword={setSignupPassword} signupConfirmPassword={signupConfirmPassword} setSignupConfirmPassword={setSignupConfirmPassword}
        signupPhone={signupPhone} setSignupPhone={setSignupPhone}
        signupCompany={signupCompany} setSignupCompany={setSignupCompany}
        signupLoading={signupLoading} onSignup={handleSignup}
        getPasswordStrength={getPasswordStrength}
        forgotStep={forgotStep} setForgotStep={setForgotStep}
        forgotEmail={forgotEmail} setForgotEmail={setForgotEmail}
        forgotLoading={forgotLoading} onForgotSubmit={handleForgotSubmit}
        resetCode={resetCode} setResetCode={setResetCode}
        newPassword={newPassword} setNewPassword={setNewPassword}
        resetLoading={resetLoading} onResetSubmit={handleResetSubmit}
        verificationStep={verificationStep} setVerificationStep={setVerificationStep} verificationEmail={verificationEmail} verificationCode={verificationCode} setVerificationCode={setVerificationCode} verificationLoading={verificationLoading} onVerifyEmail={async (e: React.FormEvent) => { e.preventDefault(); if (!verificationCode) { toast({ title: 'Error', description: 'Please enter the verification code', variant: 'destructive' }); return; } setVerificationLoading(true); try { const res = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: verificationEmail, code: verificationCode }) }); const data = await res.json(); if (res.ok) { setUser(data.user); setAuthModalOpen(false); setVerificationStep('idle'); setVerificationCode(''); toast({ title: 'Email Verified!', description: 'Your account is now active. Welcome to XFoundry!' }); } else { toast({ title: 'Verification Failed', description: data.error, variant: 'destructive' }); } } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); } setVerificationLoading(false); }} onResendVerification={async () => { if (!verificationEmail) return; setResendLoading(true); try { const res = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: verificationEmail }) }); const data = await res.json(); if (res.ok) { toast({ title: 'Code Resent!', description: 'A new verification code has been sent.' }); } else { toast({ title: 'Error', description: data.error, variant: 'destructive' }); } } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); } setResendLoading(false); }} resendLoading={resendLoading}
      />

      {/* ═══════════════════════════════════════════════════
          DASHBOARD MODAL
          ═══════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════
          SERVICE DETAIL MODAL
          ═══════════════════════════════════════════════════ */}
      {serviceModal && servicesDataMap[serviceModal] && (() => {
        const svc = servicesDataMap[serviceModal];
        return (
        <div className="auth-modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setServiceModal(null); }}>
          <div className="auth-modal" style={{ maxWidth: 640 }}>
            <div className="auth-modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                  <i className={svc.icon} style={{ color: 'var(--accent)', fontSize: 16 }}></i>
                </span>
                {svc.title}
              </h2>
              <button className="auth-modal-close" onClick={() => setServiceModal(null)}>&times;</button>
            </div>
            <div className="auth-modal-body" style={{ padding: '28px 32px' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>{svc.description}</p>
              <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--text-light)', marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase' }}>What We Offer</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
                {svc.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 6 }}>
                    <i className={f.icon || 'fa-solid fa-check'} style={{ color: 'var(--accent)', fontSize: 11 }}></i>
                    <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 600 }}>{f.title}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '12px 24px' }} onClick={() => { setServiceModal(null); router.push(`/services/${svc.slug}`); }}>
                  Learn More <i className="fa-solid fa-arrow-right"></i>
                </button>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '12px 24px' }} onClick={() => { setServiceModal(null); scrollToSection('contact'); }}>
                  Request a Quote <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {user && (
        <div className={`dashboard-modal-overlay${dashboardOpen ? ' active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setDashboardOpen(false); }}>
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2>Dashboard</h2>
              <button className="auth-modal-close" onClick={() => setDashboardOpen(false)}>&times;</button>
            </div>

            <div className="dashboard-modal-header" style={{ padding: '16px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="nav-user-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                {user.avatar
                  ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : user.name.charAt(0).toUpperCase()
                }
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>{user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{user.email} &middot; {user.role}</div>
              </div>
            </div>

            <div className="dashboard-modal-tabs">
              <button className={`dash-tab${dashTab === 'profile' ? ' active' : ''}`} onClick={() => setDashTab('profile')}><i className="fa-solid fa-user" style={{ marginRight: 6 }}></i>Profile</button>
              <button className={`dash-tab${dashTab === 'courses' ? ' active' : ''}`} onClick={() => setDashTab('courses')}>Programs</button>
              <button className={`dash-tab${dashTab === 'my-enrollments' ? ' active' : ''}`} onClick={() => setDashTab('my-enrollments')}>My Enrollments</button>
              <button className={`dash-tab${dashTab === 'request-quote' ? ' active' : ''}`} onClick={() => setDashTab('request-quote')}>Request Quote</button>
              <button className={`dash-tab${dashTab === 'my-quotes' ? ' active' : ''}`} onClick={() => setDashTab('my-quotes')}>My Quotes</button>
              <button className={`dash-tab${dashTab === 'friends' ? ' active' : ''}`} onClick={() => { setDashTab('friends'); loadFriends(); }}><i className="fa-solid fa-user-friends" style={{ marginRight: 6 }}></i>Friends</button>
              <button className={`dash-tab${dashTab === 'messages' ? ' active' : ''}`} onClick={() => { setDashTab('messages'); loadFriends(); }}><i className="fa-solid fa-comment-dots" style={{ marginRight: 6 }}></i>Messages</button>
            </div>

            <div className="dashboard-modal-body">
              {/* ── PROFILE TAB ── */}
              {dashTab === 'profile' && (
                <div style={{ maxWidth: 480, margin: '0 auto' }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--text-light)' }}>My Profile</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 28, fontSize: 14 }}>Manage your account details and profile picture</p>

                  {/* Avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 24, fontWeight: 900, overflow: 'hidden' }}>
                        {user?.avatar
                          ? <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span>{user?.name.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <label style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--card-bg)' }}>
                        <i className={`fa-solid fa-${avatarUploading ? 'spinner fa-spin' : 'camera'}`} style={{ fontSize: 10, color: 'var(--text-light)' }}></i>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 2 }}>{user?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{user?.email}</div>
                      {user?.username && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{user.username}</div>}
                      <div style={{ marginTop: 4, padding: '2px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'inline-block' }}>{user?.role}</div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleProfileSave}>
                    <WaveInput label="Full Name" type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                    <WaveInput label="Username" type="text" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
                    <WaveInput label="Phone" type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                    <WaveInput label="Company" type="text" value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)} />
                    <button type="submit" disabled={profileSaving} className="submit-btn" style={{ width: '100%', opacity: profileSaving ? 0.6 : 1, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {profileSaving ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Saving...</> : <><i className="fa-solid fa-save" style={{ marginRight: 8 }}></i> Save Profile</>}
                    </button>
                  </form>
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
                    {deleteStep === 'confirm' ? (
                      <button
                        onClick={() => { setDeletePassword(''); setDeleteStep('password'); }}
                        style={{
                          width: '100%',
                          padding: '12px 0',
                          background: 'transparent',
                          border: '1px solid rgba(239,68,68,0.4)',
                          color: 'var(--error-color)',
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "'Space Grotesk', sans-serif",
                          cursor: 'pointer',
                          borderRadius: 10,
                        }}
                      >
                        <i className="fa-solid fa-trash-alt" style={{ marginRight: 8 }}></i>Delete Account
                      </button>
                    ) : (
                      <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 16 }}>
                        <p style={{ color: 'var(--error-color)', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                          <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: 6 }}></i>
                          This action is PERMANENT. Enter your password to confirm.
                        </p>
                        <WaveInput
                          label="Password"
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          style={{ marginBottom: 10 }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => { setDeleteStep('confirm'); setDeletePassword(''); }}
                            style={{ flex: 1, padding: '10px 0', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', borderRadius: 10 }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              if (!deletePassword) { toast({ title: 'Error', description: 'Please enter your password', variant: 'destructive' }); return; }
                              setDeleteLoading(true);
                              try {
                                const res = await fetch('/api/user/delete-account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: deletePassword }) });
                                if (res.ok) { window.location.href = '/'; }
                                else { const data = await res.json(); toast({ title: 'Failed', description: data.error, variant: 'destructive' }); }
                              } catch { toast({ title: 'Error', description: 'Failed to delete account', variant: 'destructive' }); }
                              setDeleteLoading(false);
                            }}
                            disabled={deleteLoading || !deletePassword}
                            style={{ flex: 1, padding: '10px 0', background: 'var(--error-color)', border: 'none', color: 'var(--text-light)', fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: deleteLoading ? 'not-allowed' : 'pointer', borderRadius: 10, opacity: deleteLoading ? 0.6 : 1 }}
                          >
                            {deleteLoading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Deleting...</> : <><i className="fa-solid fa-skull-crossbones" style={{ marginRight: 6 }}></i>Delete Forever</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── COURSES TAB ── */}
              {dashTab === 'courses' && (
                <div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--text-light)' }}>Available Courses</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Enroll in our free courses and start learning today</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {availableCourses.map((course) => {
                      const eStatus = enrollmentStatus[course.id];
                      const isApproved = eStatus === 'approved';
                      const isPending = eStatus === 'pending';
                      const isDeclined = eStatus === 'declined';
                      return (
                        <div key={course.id} style={{ background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))', padding: 24, borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 16, borderRadius: 10 }}>
                              <i className={course.icon}></i>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{course.category}</div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>{course.name}</div>
                            </div>
                          </div>
                          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>{course.description}</p>
                          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-dim)' }}><i className="fa-solid fa-signal" style={{ color: 'var(--accent)', fontSize: 11 }}></i>{course.level}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-dim)' }}><i className="fa-solid fa-clock" style={{ color: 'var(--accent)', fontSize: 11 }}></i>{course.duration}</span>
                            <span style={{ background: 'rgba(76,175,80,0.1)', color: 'var(--success-color)', padding: '2px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, border: '1px solid rgba(76,175,80,0.2)' }}>{course.price}</span>
                          </div>
                          <button className="submit-btn" disabled={isApproved || isPending} onClick={() => openEnrollModal(course)} style={{ padding: '10px 0', fontSize: 11, letterSpacing: 1.5, marginTop: 0, opacity: (isApproved || isPending) ? 0.5 : 1, borderRadius: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
                            {isApproved ? <><i className="fa-solid fa-check" style={{ marginRight: 4 }} />Enrolled</> : isPending ? <><i className="fa-solid fa-hourglass-half" style={{ marginRight: 4 }} />Pending...</> : isDeclined ? <><i className="fa-solid fa-redo"></i> Re-apply</> : <><i className="fa-solid fa-plus"></i> Enroll Now</>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── MY ENROLLMENTS TAB ── */}
              {dashTab === 'my-enrollments' && (
                <div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--text-light)' }}>My Enrollments</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Track your enrollment requests and their status</p>
                  {enrollmentsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)' }}></i></div>
                  ) : enrollments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                      <i className="fa-solid fa-book-open" style={{ fontSize: 36, opacity: 0.5, display: 'block', marginBottom: 12 }}></i>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 8 }}>No enrollments yet</h4>
                      <p style={{ fontSize: 14 }}>Browse our courses and submit an enrollment request</p>
                      <button className="btn btn-primary" style={{ marginTop: 16, fontSize: 11, padding: '10px 24px', fontFamily: "'Space Grotesk', sans-serif" }} onClick={() => setDashTab('courses')}>Browse Courses</button>
                    </div>
                  ) : (
                    <div>
                      {enrollments.map((enr) => {
                        const statusStyles: Record<string, { bg: string; color: string; border: string; label: string }> = {
                          pending: { bg: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.25)', label: 'Pending Review' },
                          approved: { bg: 'rgba(34,197,94,0.12)', color: 'var(--success-color)', border: '1px solid rgba(34,197,94,0.25)', label: 'Approved' },
                          declined: { bg: 'rgba(239,68,68,0.12)', color: 'var(--error-color)', border: '1px solid rgba(239,68,68,0.25)', label: 'Declined' },
                        };
                        const st = statusStyles[enr.status] || statusStyles.pending;
                        return (
                          <div key={enr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))', marginBottom: 8, flexWrap: 'wrap', gap: 12, borderRadius: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 40, height: 40, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 14, borderRadius: 10 }}>
                                <i className={enr.courseId === 'ml-bootcamp' ? 'fa-solid fa-brain' : 'fa-solid fa-terminal'}></i>
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 2 }}>{enr.courseName}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Enrolled {formatDate(enr.enrolledAt)}</span>
                                  {enr.experienceLevel && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}><i className="fa-solid fa-signal" style={{ marginRight: 4, fontSize: 10 }}></i>{enr.experienceLevel}</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ padding: '4px 14px', borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: st.bg, color: st.color, border: st.border }}>
                                {st.label}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fa-solid fa-clock" style={{ color: 'var(--accent)', fontSize: 11 }}></i>{enr.duration}</span>
                              <button
                                onClick={() => handleCancelEnrollment(enr.id)}
                                disabled={cancelLoading === enr.id}
                                style={{
                                  padding: '7px 16px',
                                  background: 'transparent',
                                  border: '1px solid rgba(239,68,68,0.4)',
                                  color: 'var(--error-color)',
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: 1,
                                  cursor: 'pointer',
                                  opacity: cancelLoading === enr.id ? 0.5 : 1,
                                  transition: 'all 0.2s',
                                  borderRadius: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <i className={cancelLoading === enr.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-times'} style={{ fontSize: 10 }} />
                                {cancelLoading === enr.id ? '...' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}



              {/* ── REQUEST QUOTE TAB ── */}
              {dashTab === 'request-quote' && (
                <div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--text-light)' }}>Request a Quote</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Tell us about your project and we&apos;ll get back to you within 24 hours</p>
                  <form onSubmit={handleDashQuote}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <WaveInput label="Full Name *" type="text" value={dqName} onChange={(e) => setDqName(e.target.value)} required />
                      <WaveInput label="Email *" type="email" value={dqEmail} onChange={(e) => setDqEmail(e.target.value)} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <WaveInput label="Phone" type="tel" value={dqPhone} onChange={(e) => setDqPhone(e.target.value)} />
                      <WaveInput label="Company" type="text" value={dqCompany} onChange={(e) => setDqCompany(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Service *</label>
                      <select value={dqService} onChange={(e) => setDqService(e.target.value)} required style={{ width: '100%' }}>
                        <option value="">Select a service...</option>
                        <option value="AI & Machine Learning">AI &amp; Machine Learning</option>
                        <option value="Custom Software Development">Custom Software Development</option>
                        <option value="Tech Education & Training">Tech Education &amp; Training</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Budget Range</label>
                      <select value={dqBudget} onChange={(e) => setDqBudget(e.target.value)} style={{ width: '100%' }}>
                        <option value="">Select budget range...</option>
                        <option value="Under $5,000">Under $5,000</option>
                        <option value="$5,000 - $15,000">$5,000 - $15,000</option>
                        <option value="$15,000 - $50,000">$15,000 - $50,000</option>
                        <option value="$50,000+">$50,000+</option>
                        <option value="Not sure yet">Not sure yet</option>
                      </select>
                    </div>
                    <WaveTextarea label="Project Details *" value={dqDescription} onChange={(e) => setDqDescription(e.target.value)} required />
                    <button type="submit" className="submit-btn" disabled={dqLoading} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {dqLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</> : <><i className="fa-solid fa-paper-plane"></i> Submit Quote Request</>}
                    </button>
                  </form>
                </div>
              )}

              {/* ── MY QUOTES TAB ── */}
              {dashTab === 'my-quotes' && (
                <div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--text-light)' }}>My Quotes</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Track the status of your quote requests</p>
                  {quotesLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)' }}></i></div>
                  ) : quotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                      <i className="fa-solid fa-clipboard-list" style={{ fontSize: 36, opacity: 0.5, display: 'block', marginBottom: 12 }}></i>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 8 }}>No quotes yet</h4>
                      <p style={{ fontSize: 14 }}>Submit a quote request to get started</p>
                      <button className="btn btn-primary" style={{ marginTop: 16, fontSize: 11, padding: '10px 24px', fontFamily: "'Space Grotesk', sans-serif" }} onClick={() => setDashTab('request-quote')}>Request a Quote</button>
                    </div>
                  ) : (
                    <div>
                      {quotes.map((q) => (
                        <div key={q.id} style={{ background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))', padding: 20, marginBottom: 12, borderRadius: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>{q.serviceType}</span>
                            <span style={{
                              padding: '3px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderRadius: 9999,
                              background: q.status === 'pending' ? 'rgba(255,193,7,0.1)' : q.status === 'reviewed' ? 'rgba(33,150,243,0.1)' : 'rgba(76,175,80,0.1)',
                              color: q.status === 'pending' ? 'var(--warning-color)' : q.status === 'reviewed' ? '#2196f3' : 'var(--success-color)',
                              border: `1px solid ${q.status === 'pending' ? 'rgba(255,193,7,0.2)' : q.status === 'reviewed' ? 'rgba(33,150,243,0.2)' : 'rgba(76,175,80,0.2)'}`,
                            }}>{q.status === 'replied' ? <><i className="fa-solid fa-check-circle" style={{ marginRight: 4, fontSize: 9 }}></i>Replied</> : q.status === 'reviewed' ? <><i className="fa-solid fa-eye" style={{ marginRight: 4, fontSize: 9 }}></i>Reviewed</> : <><i className="fa-solid fa-clock" style={{ marginRight: 4, fontSize: 9 }}></i>Pending</>}</span>
                          </div>
                          <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{q.description}</p>
                          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fa-solid fa-calendar" style={{ color: 'var(--accent)', fontSize: 10 }}></i>{formatDate(q.createdAt)}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fa-solid fa-user" style={{ color: 'var(--accent)', fontSize: 10 }}></i>{q.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── FRIENDS TAB ── */}
              {dashTab === 'friends' && (
                <div style={{ maxWidth: 560, margin: '0 auto', minHeight: 400 }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--text-light)' }}>Friends</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Manage your friends and friend requests</p>

                  {/* Add Friend */}
                  <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'flex-end' }}>
                    <WaveInput
                      label="Enter username to add..."
                      type="text"
                      value={addFriendUsername}
                      onChange={(e) => setAddFriendUsername(e.target.value)}
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                    <button type="submit" disabled={addFriendLoading} className="submit-btn" style={{ width: 'auto', padding: '10px 20px', opacity: addFriendLoading ? 0.6 : 1, fontSize: 13, borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0 }}>
                      {addFriendLoading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Sending...</> : <><i className="fa-solid fa-user-plus" style={{ marginRight: 6 }}></i>Add</>}
                    </button>
                  </form>

                  {/* Pending Requests */}
                  {pendingRequests.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--accent)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                        <i className="fa-solid fa-inbox" style={{ marginRight: 6 }}></i>Pending Requests ({pendingRequests.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pendingRequests.map((req) => (
                          <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))', borderRadius: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 13, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {req.avatar ? <img src={req.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : req.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{req.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{req.username}</div>
                            </div>
                            <button onClick={() => handleAcceptFriend(req.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--text-light)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Accept</button>
                            <button onClick={() => handleRejectFriend(req.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Decline</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent Requests */}
                  {sentRequests.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                        <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }}></i>Sent Requests ({sentRequests.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sentRequests.map((req) => (
                          <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))', borderRadius: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 5%, transparent)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {req.avatar ? <img src={req.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : req.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{req.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{req.username} <span style={{ color: 'var(--warning-color)', fontSize: 10 }}>&middot; Pending</span></div>
                            </div>
                            <button onClick={() => handleCancelSentRequest(req.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
                              <i className="fa-solid fa-times" style={{ fontSize: 10, marginRight: 4 }}></i>Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Friends List */}
                  <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                    <i className="fa-solid fa-users" style={{ marginRight: 6 }}></i>All Friends ({friends.length})
                  </h4>
                  {friendsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)' }}></i></div>
                  ) : friends.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                      <i className="fa-solid fa-user-friends" style={{ fontSize: 36, opacity: 0.5, display: 'block', marginBottom: 12 }}></i>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 8 }}>No friends yet</h4>
                      <p style={{ fontSize: 14 }}>Add a friend by their username to get started</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {friends.map((f) => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))', borderRadius: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 13, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                            {f.avatar ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : f.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{f.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{f.username}</div>
                          </div>
                          <button onClick={() => { setDashTab('messages'); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fa-solid fa-comment" style={{ fontSize: 10 }}></i> Message
                          </button>
                          <button onClick={() => handleRemoveFriend(f.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
                            <i className="fa-solid fa-user-minus" style={{ fontSize: 10 }}></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* ── MESSAGES TAB ── */}
              {dashTab === 'messages' && (
                <div style={{ maxWidth: 560, margin: '0 auto', minHeight: 400 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--text-light)' }}>Messages</h3>
                      <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Chat with your friends</p>
                    </div>
                   
                  </div>
                  {friends.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                      <i className="fa-solid fa-comment-dots" style={{ fontSize: 36, opacity: 0.5, display: 'block', marginBottom: 12 }}></i>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 8 }}>No conversations</h4>
                      <p style={{ fontSize: 14 }}>Add friends first to start messaging</p>
                      <button className="btn btn-primary" style={{ marginTop: 16, fontSize: 11, padding: '10px 24px', fontFamily: "'Space Grotesk', sans-serif" }} onClick={() => setDashTab('friends')}>Go to Friends</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {friends.map((f) => (
                        <button key={f.id} onClick={() => { setSelectedChatFriend(f); setDashboardOpen(false); setChatOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%', color: 'var(--text-light)', transition: 'border-color 0.2s' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 14, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                            {f.avatar ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : f.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{f.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{f.username}</div>
                          </div>
                          <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-dim)', fontSize: 11 }}></i>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatOpen && user && (
        <ChatModal open={chatOpen} onClose={() => { setChatOpen(false); setSelectedChatFriend(null); }} user={user} friends={friends} initialFriend={selectedChatFriend} />
      )}



      {/* ═══════════════════════════════════════════════════
          ENROLLMENT REQUEST MODAL
          ═══════════════════════════════════════════════════ */}
      {enrollModalOpen && enrollCourse && (
        <div className="modal-overlay" onClick={() => setEnrollModalOpen(false)}>
          <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, borderRadius: 16, border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border-color))" }}>
            <button className="modal-close" onClick={() => setEnrollModalOpen(false)}>
              <i className="fa-solid fa-times"></i>
            </button>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
            
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 4 }}>Enrollment Request</h2>
              <p style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{enrollCourse.name}</p>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 6 }}>Fill in your details below. Your request will be reviewed by an admin.</p>
            </div>

            <form onSubmit={handleEnrollSubmit}>
              <WaveInput label="Full Name" type="text" value={user?.name || ''} disabled />
              <WaveInput label="Email" type="email" value={user?.email || ''} disabled />

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Experience Level *</label>
                <select
                  value={erExperience}
                  onChange={(e) => setErExperience(e.target.value)}
                  required
                  style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid color-mix(in srgb, var(--accent) 15%, var(--border-color))', borderRadius: 10, color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none' }}
                >
                  <option value="">Select your level...</option>
                  <option value="Beginner">Beginner - No prior experience</option>
                  <option value="Intermediate">Intermediate - Some experience</option>
                  <option value="Advanced">Advanced - Working professional</option>
                  <option value="Expert">Expert - Deep domain knowledge</option>
                </select>
              </div>

              <WaveTextarea
                label="Why do you want to join? *"
                value={erMotivation}
                onChange={(e) => setErMotivation(e.target.value)}
                required
                rows={4}
              />

              <button
                type="submit"
                className="submit-btn"
                disabled={enrollLoading}
                style={{ width: '100%', opacity: enrollLoading ? 0.6 : 1, padding: '14px', fontSize: 13, letterSpacing: 1.5, borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {enrollLoading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Submitting...</> : <><i className="fa-solid fa-paper-plane" style={{ marginRight: 8 }}></i> Submit Enrollment Request</>}
              </button>

              <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 11, marginTop: 16, lineHeight: 1.6 }}>
                <i className="fa-solid fa-info-circle" style={{ marginRight: 4, color: 'var(--accent)' }}></i>
                Your request will be reviewed by an admin. You&apos;ll be notified once approved.
              </p>
            </form>
          </div>
        </div>
      )}
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
      <AvatarCropModal
        open={cropModalOpen}
        imageFile={cropImageFile}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}
