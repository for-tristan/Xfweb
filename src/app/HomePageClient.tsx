'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { SkeletonHero, SkeletonSectionHeader, SkeletonServiceCard, SkeletonCourseCard } from '@/components/SkeletonScreens';
import { ChatModal } from '@/components/ChatModal';
import ConfirmModal from '@/components/ConfirmModal';
import VideoTemplate from '@/components/video/VideoTemplate';
import { SearchModal, AuthModal } from '@/lib/PageModals';
import { AvatarCropModal } from '@/components/AvatarCropModal';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { WaveInput } from '@/components/WaveInput';
import { WaveTextarea } from '@/components/WaveTextarea';
import { SectionReveal, StaggerReveal, ScrollProgressBar } from '@/components/ScrollAnimations';
import { Logo } from '@/components/Logo';
import GradualBlur from '@/components/GradualBlur';
import ScrollFadeSection from '@/components/ScrollFadeSection';
import DraggableScroll from '@/components/DraggableScroll';
import { SmartImage } from '@/components/SmartImage';

// Extracted section components (see src/components/home/)
import { BlurText } from '@/components/home/BlurText';
import { FaqItem } from '@/components/home/FaqItem';
import { EnrollButton } from '@/components/home/EnrollButton';
import { ServicesSection } from '@/components/home/ServicesSection';
import { ProjectsSection } from '@/components/home/ProjectsSection';
import { FaqSection } from '@/components/home/FaqSection';
import { TeamSection } from '@/components/home/TeamSection';
import { Footer } from '@/components/home/Footer';

// Shared constants (single source of truth for contact info, socials, etc.)
import { SITE, CONTACT, SOCIAL } from '@/lib/constants';


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
  { title: 'Contact Us', category: 'Page', desc: 'Get in touch with our team', link: '#contact' },
  { title: 'Our Team', category: 'Page', desc: 'Meet Marwan Montaser', link: '#team' },
];

// BlurText, FaqItem, and EnrollButton are now imported from @/components/home/
// (see imports at top of file). This eliminates ~100 lines of inline component
// definitions that were hard to find in a 1959-line file.


export default function Home({
  initialServices = [],
  initialCourses = [],
  initialTeam = [],
  initialProjects = [],
}: {
  initialServices?: DynamicService[];
  initialCourses?: Course[];
  initialTeam?: Array<{id:string;name:string;role:string;bio:string;avatar:string;icon:string;linkedinUrl:string;githubUrl:string;displayOrder:number}>;
  initialProjects?: Array<{id:string;title:string;slug:string;description:string;category:string;tags:string[];icon:string;imageUrl:string;projectUrl:string;status:string;displayOrder:number}>;
}) {
  const { toast } = useToast();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [minLoading, setMinLoading] = useState(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState('');
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupRole, setSignupRole] = useState('student');
  const [signupLoading, setSignupLoading] = useState(false);

  const [forgotStep, setForgotStep] = useState<'idle' | 'email' | 'code'>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [verificationStep, setVerificationStep] = useState<'idle' | 'pending'>('idle');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [dashTab, setDashTab] = useState('profile');

  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<Record<string, string>>({});
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  const [dqName, setDqName] = useState('');
  const [dqEmail, setDqEmail] = useState('');
  const [dqPhone, setDqPhone] = useState('');
  const [dqCompany, setDqCompany] = useState('');
  const [dqService, setDqService] = useState('');
  const [dqBudget, setDqBudget] = useState('');
  const [dqDescription, setDqDescription] = useState('');
  const [dqLoading, setDqLoading] = useState(false);

  const [cqFirstName, setCqFirstName] = useState('');
  const [cqLastName, setCqLastName] = useState('');
  const [cqEmail, setCqEmail] = useState('');
  const [cqPhone, setCqPhone] = useState('');
  const [cqCompany, setCqCompany] = useState('');
  const [cqService, setCqService] = useState('');
  const [cqMessage, setCqMessage] = useState('');
  const [cqLoading, setCqLoading] = useState(false);
  const [cqSuccess, setCqSuccess] = useState(false);


  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);
  const [erExperience, setErExperience] = useState('');
  const [erMotivation, setErMotivation] = useState('');
  const [erPhone, setErPhone] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  const [notifications, setNotifications] = useState<Array<{id:string;title:string;message:string;read:boolean;createdAt:string;type?:string}>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

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


  const [friends, setFriends] = useState<Array<{id:string;friendId:string;name:string;username:string;avatar:string|null;createdAt:string}>>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{id:string;friendId:string;name:string;username:string;avatar:string|null;createdAt:string}>>([]);
  const [sentRequests, setSentRequests] = useState<Array<{id:string;friendId:string;name:string;username:string;avatar:string|null;createdAt:string}>>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [addFriendUsername, setAddFriendUsername] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChatFriend, setSelectedChatFriend] = useState<{id:string;friendId:string;name:string;username:string;avatar:string|null;createdAt:string} | null>(null);

  const [scrolled, setScrolled] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  // Refs to track current scroll-state values without triggering re-renders.
  // The onScroll handler reads these to decide whether setState is needed —
  // calling setState with the same value still runs React's reconciler,
  // which on a 1700-line component causes scroll jank.
  const scrolledRef = useRef(false);
  const atBottomRef = useRef(false);
  const activeNavRef = useRef('home');
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    const timer = setTimeout(() => setMinLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else if (res.status === 403) {
          const data = await res.json();
          if (data.needsVerification) {
            setUser(null);
            router.push('/auth');
            return;
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      setAuthLoading(false);
    })();
  }, [router, toast]);

  const loadEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    try {
      const res = await fetch('/api/courses/my-enrollments');
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments);
        setEnrollmentStatus(Object.fromEntries(data.enrollments.map((e: Enrollment) => [e.courseId, e.status])));
      }
    } catch {  }
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
    } catch {  }
  }, []);

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
    } catch {  }
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
    } catch {  }
  };

  const handleRejectFriend = async (friendshipId: string) => {
    try {
      const res = await fetch('/api/friends', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friendshipId, action: 'reject' }) });
      if (res.ok) { toast({ title: 'Request Declined' }); loadFriends(); }
    } catch {  }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      const res = await fetch(`/api/friends?friendshipId=${friendshipId}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'Friend Removed' }); loadFriends(); }
    } catch {  }
  };

  const handleCancelSentRequest = (friendshipId: string) => {
    openConfirm(
      'Cancel Request',
      'Are you sure you want to cancel this friend request?',
      async () => {
        try {
          const res = await fetch(`/api/friends?friendshipId=${friendshipId}`, { method: 'DELETE' });
          if (res.ok) { toast({ title: 'Request Cancelled' }); loadFriends(); }
        } catch {  }
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
    } catch {  }
    setQuotesLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const init = () => { loadEnrollments(); loadQuotes(); loadNotifications(); loadFriends(); };
    init();
  }, [user, loadEnrollments, loadQuotes, loadNotifications, loadFriends]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { loadNotifications(); loadFriends(); }, 30000);
    return () => clearInterval(interval);
  }, [user, loadNotifications, loadFriends]);

  // Scroll detection — rAF-throttled to avoid layout thrashing.
  // Section positions are cached and only re-read on resize, so the per-frame
  // work is just a few cheap comparisons.
  useEffect(() => {
    const SECTION_IDS = ['home', 'services', 'courses', 'contact'];
    const sectionCache: Record<string, { top: number; height: number }> = {};

    const measureSections = () => {
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) {
          // Use getBoundingClientRect + scrollY instead of offsetTop.
          // offsetTop is relative to offsetParent, which breaks when a
          // section is inside a transformed/fixed container (the hero is
          // wrapped in <ScrollFadeSection pin> which sets position:fixed
          // on its inner div — offsetTop for #home then returns ~0
          // relative to that fixed parent, not the document, so the
          // scroll-spy never detects that the user has scrolled past it).
          // getBoundingClientRect().top + scrollY gives the true
          // document-absolute Y regardless of parent positioning.
          const rect = el.getBoundingClientRect();
          sectionCache[id] = { top: rect.top + window.scrollY, height: rect.height };
        }
      }
    };
    measureSections();

    // Re-measure on resize (debounced) — layout shifts invalidate offsets
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureSections, 200);
    };
    window.addEventListener('resize', onResize, { passive: true });

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const scrollY = window.scrollY;
        // Only call setState when the value ACTUALLY changes.
        // Calling setState with the same value still runs React's
        // reconciler on a 1700-line component = scroll jank.
        const newScrolled = scrollY > 80;
        if (newScrolled !== scrolledRef.current) {
          scrolledRef.current = newScrolled;
          setScrolled(newScrolled);
        }

        const distFromBottom = document.documentElement.scrollHeight - window.innerHeight - scrollY;
        const newAtBottom = distFromBottom < 80;
        if (newAtBottom !== atBottomRef.current) {
          atBottomRef.current = newAtBottom;
          setAtBottom(newAtBottom);
        }

        const scrollPos = scrollY + 150;
        for (const id of SECTION_IDS) {
          const cached = sectionCache[id];
          if (cached && scrollPos >= cached.top && scrollPos < cached.top + cached.height) {
            if (id !== activeNavRef.current) {
              activeNavRef.current = id;
              setActiveNav(id);
            }
            break;
          }
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Re-measure after fonts/images settle
    const settleTimer = setTimeout(measureSections, 600);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      clearTimeout(settleTimer);
    };
  }, []);

  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('x-foundry-theme') || 'oled';
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
    window.dispatchEvent(new CustomEvent('xf-theme-change', { detail: { theme } }));
  }, [theme]);

  useEffect(() => {
    if (dashboardOpen && user) {
      setProfileName(user.name || '');
      setProfileUsername(user.username || '');
      setProfilePhone((user as unknown as Record<string, unknown>).phone as string || '');
      setProfileCompany((user as unknown as Record<string, unknown>).company as string || '');
    }
  }, [dashboardOpen, user]);

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

    return () => { observer.disconnect(); };
  }, [authModalOpen, dashboardOpen, serviceModal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setAuthModalOpen(false); setDashboardOpen(false); setSearchOpen(false); setServiceModal(null); setMobileMenuOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);


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
      else if (res.status === 403 && data.needsVerification) {
        setVerificationEmail(data.email);
        setVerificationCode('');
        setVerificationStep('pending');
        if (data.emailSent === false) {
          // Email failed to send — auto-trigger a resend so the user
          // isn't stuck looking at a code input that will never work.
          toast({ title: 'Verification Required', description: 'Sending verification code...', variant: 'destructive' });
          try {
            const resendRes = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.email }) });
            const resendData = await resendRes.json();
            if (resendRes.ok) { toast({ title: 'Code Sent!', description: 'A new verification code has been sent to your email.' }); }
            else { toast({ title: 'Verification Required', description: 'Could not send code. Please click Resend below.', variant: 'destructive' }); }
          } catch { toast({ title: 'Verification Required', description: 'Please click Resend Code below to get your code.', variant: 'destructive' }); }
        } else {
          toast({ title: 'Verification Required', description: data.error });
        }
      }
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
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {  }
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
    if (status === 'declined') {  }
    setEnrollCourse(course);
    setErExperience('');
    setErMotivation('');
    setEnrollModalOpen(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollCourse) return;
    if (!user) { openAuthModal('signin'); return; }
    if (!erPhone || !erExperience || !erMotivation) { toast({ title: 'Missing Fields', description: 'Please fill in your phone number, experience level and motivation', variant: 'destructive' }); return; }
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
              phone: erPhone,
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
    setMobileMenuOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const lenis = (window as any).__lenis;
        if (id === 'home') {
          if (lenis) {
            lenis.scrollTo(0, { duration: 1.2 });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          return;
        }
        const el = document.getElementById(id);
        if (!el) return;
        if (lenis) {
          lenis.scrollTo(el, { offset: 0, duration: 1.2 });
        } else {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  };

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      let attempts = 0;
      const poll = setInterval(() => {
        const el = document.getElementById(id);
        if (el) {
          const lenis = (window as any).__lenis;
          if (lenis) {
            lenis.scrollTo(el, { offset: 0, duration: 1.2 });
          } else {
            el.scrollIntoView({ behavior: 'smooth' });
          }
          history.replaceState(null, '', window.location.pathname);
          clearInterval(poll);
        }
        attempts++;
        if (attempts > 40) clearInterval(poll);
      }, 50);
      return () => clearInterval(poll);
    }
  }, []);

  // Initialize with server-fetched data so the first paint has real content
  // (no client-side fetch waterfall). The useEffect below still runs to
  // refresh on the client, but it's no longer blocking first paint.
  const [dynamicServices, setDynamicServices] = useState<DynamicService[]>(initialServices);
  const [dynamicCourses, setDynamicCourses] = useState<Course[]>(initialCourses);
  const [dynamicTeam, setDynamicTeam] = useState<Array<{id:string;name:string;role:string;bio:string;avatar:string;icon:string;linkedinUrl:string;githubUrl:string;displayOrder:number}>>(initialTeam);
  const [dynamicProjects, setDynamicProjects] = useState<Array<{id:string;title:string;slug:string;description:string;category:string;tags:string[];icon:string;imageUrl:string;projectUrl:string;status:string;displayOrder:number}>>(initialProjects);

  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        // Client-side refresh: picks up any data that changed since the
        // server render. The API routes are CDN-cached (s-maxage=60,
        // swr=300) and purged via revalidatePath on admin mutations, so
        // this fetch sees fresh data within ~60s of an admin edit.
        // Initial data comes from server-side props (no blocking fetch).
        const [servicesRes, coursesRes, teamRes, projectsRes] = await Promise.all([
          fetch('/api/services', { cache: 'no-store' }),
          fetch('/api/courses', { cache: 'no-store' }),
          fetch('/api/team', { cache: 'no-store' }),
          fetch('/api/projects', { cache: 'no-store' }),
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
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setDynamicProjects(projectsData.projects || []);
        }
      } catch (e) { console.error('Failed to fetch dynamic data:', e); }
    };
    fetchDynamicData();
  }, []);

  // Site constants from @/lib/constants (single source of truth)
  const siteName = SITE.name;
  const contactEmail = CONTACT.email;
  const contactPhone = CONTACT.phone;
  const businessHours = CONTACT.businessHours;
  const linkedinUrl = SOCIAL.linkedin;
  const githubUrl = SOCIAL.github;
  const discordUrl = SOCIAL.discord;

  const availableCourses = dynamicCourses.length > 0 ? dynamicCourses : fallbackCourses;
  const servicesDataArr = dynamicServices;
  const servicesDataMap: Record<string, DynamicService> = {};
  servicesDataArr.forEach(s => { servicesDataMap[s.slug] = s; });

  const dynamicSearchData = [
    ...servicesDataArr.map(s => ({ title: s.title, category: 'Service', desc: s.description.substring(0, 60) + '...', link: `/services/${s.slug}` })),
    ...dynamicCourses.map(c => ({ title: c.name, category: 'Course', desc: c.description.substring(0, 60) + '...', link: `/courses/${c.id}` })),
    ...staticSearchData,
  ];

  const filteredSearch = searchQuery.length >= 2
    ? dynamicSearchData.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];


  return (
    <>
        {!(authLoading || minLoading) && <Navbar activePage="home" activeNav={activeNav} scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} onNavClick={(e: React.MouseEvent<HTMLElement>) => { if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('nav-links')) setMobileMenuOpen(false); }} theme={theme} onToggleTheme={handleThemeToggle} onChangeTheme={handleChangeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications as any} setUnreadCount={setUnreadCount as any} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} onAcceptFriend={handleAcceptFriend} onRejectFriend={handleRejectFriend} />}
      {(authLoading || minLoading) ? (
        <div className="xf-loader"><div className="xf-loader-dot" /><div className="xf-loader-dot" /><div className="xf-loader-dot" /></div>
      ) : (
      <>
      <ScrollProgressBar />
      {!atBottom && (
        <GradualBlur
          target="page"
          position="bottom"
          height="3.5rem"
          strength={1.0}
          divCount={2}
          curve="bezier"
          exponential={false}
          opacity={1}
          zIndex={50}
        />
      )}
      {/* HERO — Pinned + Fade on Scroll
          (ParallaxLayer removed — stacking a second transform on top of the
          pinned+scale+opacity transform from ScrollFadeSection was a major
          cause of scroll jank and "flying" visual artifacts.) */}
      <ScrollFadeSection pin fadeDistance="60vh" zIndex={1}>
      <section className="v-hero" id="home">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative', zIndex: 10 }}>
            <div style={{ position: 'relative', width: 720, height: 520, maxWidth: '90vw', maxHeight: '60vh' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                <VideoTemplate />
              </div>
            </div>
        </div>

        <div className="scroll-indicator" style={{ left: 0, right: 0 }}>
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>
      </ScrollFadeSection>
      <ServicesSection services={servicesDataArr} />
      <ProjectsSection projects={dynamicProjects} />
      <section className="v-section" id="courses">

        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
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
              <div
                key={course.id}
                className="v-course-card"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/courses/${course.id}`)}
                onKeyDown={(e) => {
                  // Enter / Space triggers navigation, matching native link behavior.
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/courses/${course.id}`);
                  }
                }}
                aria-label={`View ${course.name} course details`}
              >
                  <div className="v-course-body">
                    <div className="v-course-top-row">
                      <span className="v-course-category">{course.category}</span>
                      <span className="v-course-level">{course.level}</span>
                    </div>
                    <h3>{course.name}</h3>
                    <p>{course.description}</p>
                    <div className="v-course-meta">
                      <span><i className="fa-solid fa-clock"></i> {course.duration}</span>
                      <span><i className="fa-solid fa-users"></i> {course.enrollmentCount != null ? `${course.enrollmentCount} enrolled` : 'Enrolling Now'}</span>
                    </div>
                    <div className="v-course-tags">
                      {techTags.map((tag, ti) => <span key={ti} className="v-course-tag">{tag}</span>)}
                    </div>
                    <div className="v-course-footer">
                      <span className="v-course-view-link" aria-hidden="true">
                        View Course <i className="fa-solid fa-arrow-right"></i>
                      </span>
                      <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-block' }}>
                        <EnrollButton courseId={course.id} courseName={course.name} onEnroll={() => openEnrollModal(course)} status={enrollmentStatus[course.id]} />
                      </div>
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
      <FaqSection />
      <TeamSection team={dynamicTeam} />
      <section className="v-section" id="contact">

        <SectionReveal direction="up" delay={0}>
          <div className="v-section-header">
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
      <Footer scrollToSection={scrollToSection} />

      </>
      )}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => { if (link.startsWith('#')) { scrollToSection(link.replace('#', '')); } else { router.push(link); } }} />
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
                  ? <SmartImage src={user.avatar} alt="" width={72} height={72} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
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
              {dashTab === 'profile' && (
                <div style={{ maxWidth: 480, margin: '0 auto' }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--text-light)' }}>My Profile</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 28, fontSize: 14 }}>Manage your account details and profile picture</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 24, fontWeight: 900, overflow: 'hidden' }}>
                        {user?.avatar
                          ? <SmartImage src={user.avatar} alt="Avatar" width={120} height={120} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              {dashTab === 'friends' && (
                <div style={{ maxWidth: 560, margin: '0 auto', minHeight: 400 }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--text-light)' }}>Friends</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Manage your friends and friend requests</p>

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

                  {pendingRequests.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--accent)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                        <i className="fa-solid fa-inbox" style={{ marginRight: 6 }}></i>Pending Requests ({pendingRequests.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pendingRequests.map((req) => (
                          <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))', borderRadius: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 13, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {req.avatar ? <SmartImage src={req.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : req.name.charAt(0).toUpperCase()}
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

                  {sentRequests.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                        <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }}></i>Sent Requests ({sentRequests.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sentRequests.map((req) => (
                          <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-color))', borderRadius: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 5%, transparent)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {req.avatar ? <SmartImage src={req.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : req.name.charAt(0).toUpperCase()}
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
                            {f.avatar ? <SmartImage src={f.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : f.name.charAt(0).toUpperCase()}
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
                            {f.avatar ? <SmartImage src={f.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : f.name.charAt(0).toUpperCase()}
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

      {chatOpen && user && (
        <ChatModal open={chatOpen} onClose={() => { setChatOpen(false); setSelectedChatFriend(null); }} user={user} friends={friends} initialFriend={selectedChatFriend} />
      )}
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
              <WaveInput label="Phone Number *" type="tel" value={erPhone} onChange={(e) => setErPhone(e.target.value)} placeholder="+20..." required />

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
