'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { SkeletonHero, SkeletonSectionHeader, SkeletonServiceCard, SkeletonCourseCard } from '@/components/SkeletonScreens';
import { ChatModal } from '@/components/ChatModal';
import ConfirmModal from '@/components/ConfirmModal';
import VideoTemplate from '@/components/video/VideoTemplate';
import Link from 'next/dist/client/link';


// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
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

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`reveal reveal-delay-${Math.min(index + 1, 5)}`} style={{ border: '1px solid var(--border-color)', borderRadius: 2, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '20px 24px', background: open ? 'rgba(220,20,60,0.04)' : 'var(--card-bg)',
        border: 'none', color: 'var(--text-light)', fontSize: 15, fontWeight: 700,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        cursor: 'pointer', textAlign: 'left', fontFamily: "'Space Grotesk', sans-serif",
        transition: 'background 0.3s ease',
      }}>
        <span><span style={{ color: 'var(--primary-red)', marginRight: 12, fontSize: 13 }}>{String(index + 1).padStart(2, '0')}</span>{question}</span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 12, color: 'var(--primary-red)', flexShrink: 0 }} />
      </button>
      <div style={{ maxHeight: open ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
        <div style={{ padding: '0 24px 20px', color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.8, fontWeight: 500, paddingLeft: 62 }}>
          {answer}
        </div>
      </div>
    </div>
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

  // ── Dashboard ──
  const [dashTab, setDashTab] = useState('profile');

  // ── Profile Edit ──
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
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
  const [notifications, setNotifications] = useState<Array<{id:string;title:string;message:string;type:string;read:boolean;createdAt:string}>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // ── Cancel enrollment ──
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  // Confirm modals
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; confirmLabel: string; danger: boolean; icon: string; onConfirm: () => void }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, icon: 'fas fa-exclamation-triangle', onConfirm: () => {} });

  const openConfirm = (title: string, message: string, onConfirm: () => void, opts?: { confirmLabel?: string; danger?: boolean; icon?: string }) => {
    setConfirmModal({
      open: true, title, message,
      confirmLabel: opts?.confirmLabel || 'Confirm',
      danger: opts?.danger !== undefined ? opts.danger : false,
      icon: opts?.icon || 'fas fa-exclamation-triangle',
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');



  // ── Refs ──
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════
useEffect(() => {
  setParticles(generateParticles(50));
}, []);
  // Auth check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch { /* not authed */ }
      setAuthLoading(false);
    })();
  }, []);

  // Load enrollments & quotes when user logs in
  const loadEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    try {
      const res = await fetch('/api/courses/my-enrollments');
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments);
        setEnrolledCourses(data.enrollments.map((e: Enrollment) => e.courseId));
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
      if (res.ok) { toast({ title: 'Friend Added!' }); loadFriends(); }
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
      { confirmLabel: 'Cancel Request', danger: false, icon: 'fas fa-paper-plane' }
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

  // Scroll detection
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      // Active nav highlighting
      const scrollPos = window.scrollY + 150;
      const ids = ['home', 'services', 'projects', 'courses', 'team', 'contact'];
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('x-foundry-theme') || 'dark') as 'dark' | 'light';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }, [theme]);

  // Custom cursor
  useEffect(() => {
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; };
    const animate = () => { rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(animate); };
    const onOver = (e: MouseEvent) => { const t = e.target as HTMLElement; if (t.closest('a, button, input, select, textarea, .service-card, .project-card, .filter-btn, .course-card, .team-card, .social-link, .nav-auth-btn, .nav-user-btn, .nav-logout-btn')) ring.classList.add('hovered'); };
    const onOut = (e: MouseEvent) => { const t = e.target as HTMLElement; if (t.closest('a, button, input, select, textarea, .service-card, .project-card, .filter-btn, .course-card, .team-card, .social-link, .nav-auth-btn, .nav-user-btn, .nav-logout-btn')) ring.classList.remove('hovered'); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    animate();
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseover', onOver); document.removeEventListener('mouseout', onOut); };
  }, []);

  // Load profile data when dashboard opens or profile tab selected
  useEffect(() => {
    if (dashboardOpen && user) {
      setProfileName(user.name || '');
      setProfileUsername(user.username || '');
      setProfilePhone((user as Record<string, unknown>).phone as string || '');
      setProfileCompany((user as Record<string, unknown>).company as string || '');
    }
  }, [dashboardOpen, user]);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    const els = document.querySelectorAll('.reveal');
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [authModalOpen, dashboardOpen, serviceModal]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setAuthModalOpen(false); setDashboardOpen(false); setSearchOpen(false); setServiceModal(null); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);



  // ═══════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('x-foundry-theme', next);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = next === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  };

  const openAuthModal = (tab: 'signin' | 'signup', msg?: string) => {
    setAuthTab(tab);
    setAuthMessage(msg || '');
    setAuthModalOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' }); return; }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
      const data = await res.json();
      if (res.ok) { setUser(data.user); setAuthModalOpen(false); setDqName(data.user.name); setDqEmail(data.user.email); setCqEmail(data.user.email); setProfileName(data.user.name); setProfilePhone(data.user.phone || ''); setProfileCompany(data.user.company || ''); toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` }); setLoginEmail(''); setLoginPassword(''); }
      else { toast({ title: 'Login Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setLoginLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) { toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' }); return; }
    if (signupPassword.length < 6) { toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword, phone: signupPhone || undefined, company: signupCompany || undefined, role: signupRole }) });
      const data = await res.json();
      if (res.ok) { setUser(data.user); setAuthModalOpen(false); setDqName(data.user.name); setDqEmail(data.user.email); setCqEmail(data.user.email); toast({ title: 'Account created!', description: `Welcome to X.Foundry, ${data.user.name}` }); setSignupName(''); setSignupEmail(''); setSignupPassword(''); setSignupPhone(''); setSignupCompany(''); }
      else { toast({ title: 'Signup Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setSignupLoading(false);
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setUser(null); setEnrollments([]); setEnrolledCourses([]); setQuotes([]);
    setDashboardOpen(false);
    toast({ title: 'Logged out', description: 'See you soon!' });
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
    if (newPassword.length < 6) { toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
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
    if (enrolledCourses.includes(course.id)) { toast({ title: 'Already Enrolled', description: `You're already enrolled in ${course.name}` }); return; }
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
      { confirmLabel: 'Enroll', icon: 'fas fa-graduation-cap' }
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
      { confirmLabel: 'Cancel Enrollment', danger: true, icon: 'fas fa-times-circle' }
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
      setProfilePhone((user as Record<string, unknown>).phone as string || '');
      setProfileCompany((user as Record<string, unknown>).company as string || '');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
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
    if (pw.length >= 6) s++; if (pw.length >= 10) s++; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 2) return 'weak'; if (s <= 3) return 'medium'; return 'strong';
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
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
          setDynamicCourses((coursesData.courses || []).map((c: { id: string; title: string; slug: string; description: string; level: string; duration: string; price: string; icon: string; features: string[]; moduleCount?: number }) => ({
            id: c.slug,
            name: c.title,
            category: c.level + ' Course',
            description: c.description,
            level: c.level,
            duration: c.duration,
            price: c.price,
            icon: c.icon,
            features: Array.isArray(c.features) ? c.features : JSON.parse(c.features || '[]'),
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
      {/* ──── GLOBAL PARTICLES ──── */}
      {particles.length > 0 && (
      <div className="global-particles">
      {particles.map((p) => (
          <div key={p.id} className="particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: p.duration, animationDelay: p.delay }} />
        ))}
      </div>
     )}
      {/* ──── CUSTOM CURSOR ──── */}
      <div ref={cursorDotRef} className="cursor-dot" />
      <div ref={cursorRingRef} className="cursor-ring" />

      {/* ═══════════════════════════════════════════════════
          NAVIGATION
          ═══════════════════════════════════════════════════ */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
        <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>X<span>.</span>Foundry</a>

        <ul className={`nav-links${mobileMenuOpen ? ' active' : ''}`} id="navLinks">
          <li><a href="#home" className={activeNav === 'home' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
          <li><a href="#services" className={activeNav === 'services' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
          <li><a href="#projects" className={activeNav === 'projects' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }}>Projects</a></li>
          <li><a href="#courses" className={activeNav === 'courses' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Courses</a></li>
          <li><a href="/study" className={activeNav === 'study' ? 'active' : ''} onClick={(e) => { e.preventDefault(); router.push('/study'); }}>Study</a></li>
          {user && (
            <li><a href="/dashboard" className={activeNav === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}>Dashboard</a></li>
          )}

          <li><a href="#team" className={activeNav === 'team' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('team'); }}>Team</a></li>
          <li><a href="#contact" className={activeNav === 'contact' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
          {user && user.role === 'admin' && (
            <li><a href="/admin" style={{ color: '#dc143c' }} onClick={() => setMobileMenuOpen(false)}>Admin</a></li>
          )}

            
        </ul>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={handleThemeToggle} title="Toggle Theme">
            <i className="fas fa-moon" id="themeIcon" />
          </button>
          <button className="nav-search-btn" onClick={() => setSearchOpen(true)} title="Search">
            <i className="fas fa-search" />
          </button>

          {!user && (
            <>
              <button className="nav-auth-btn" onClick={() => openAuthModal('signin')}>Sign In</button>
              <button className="nav-auth-btn nav-auth-btn-filled" onClick={() => openAuthModal('signup')}>Sign Up</button>
            </>
          )}
          {user && (
            <>
              <div style={{ position: 'relative' }}>
                <button className="nav-search-btn" onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifications(); }} title="Notifications" style={{ position: 'relative' }}>
                  <i className="fas fa-bell" />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#dc143c', fontSize: 9, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--dark-gray)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: typeof window !== 'undefined' && window.innerWidth <= 768 ? -60 : 0, width: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'calc(100vw - 40px)' : 340, maxWidth: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'calc(100vw - 40px)' : 340, background: 'var(--dark-gray)', border: '1px solid var(--border-color)', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 10001, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>Notifications</span>
                      {unreadCount > 0 && <button onClick={async () => { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readAll: true }) }); loadNotifications(); }} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Mark all read</button>}
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}><i className="fas fa-bell-slash" style={{ display: 'block', fontSize: 24, marginBottom: 10, opacity: 0.3 }}></i>No notifications</div>
                      ) : notifications.slice(0, 10).map((n) => (
                        <div key={n.id} onClick={async () => { if (!n.read) { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId: n.id }) }); loadNotifications(); } }} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(220,20,60,0.03)', transition: 'background 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-red)', flexShrink: 0 }} />}
                            <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 12, color: 'var(--text-light)' }}>{n.title}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, paddingLeft: n.read ? 0 : 14 }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button className="nav-user-btn" onClick={() => setDashboardOpen(true)}>
                <span className="nav-user-avatar">
                  {user.avatar
                    ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : user.name.charAt(0).toUpperCase()
                  }
                </span>
               <span className="nav-user-name">{user.name.split(' ')[0]}</span>
              </button>
              <button className="nav-logout-btn" onClick={handleLogout}>Logout</button>
            </>
          )}
          <div className={`menu-toggle${mobileMenuOpen ? ' active' : ''}`} id="menuToggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════ */}
      {authLoading ? (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
          <SkeletonHero />
          <div style={{ marginTop: 80, width: '100%', maxWidth: 1200, padding: '0 20px' }}>
            <SkeletonSectionHeader />
            <div className="services-grid">
              <SkeletonServiceCard />
              <SkeletonServiceCard />
              <SkeletonServiceCard />
            </div>
            <div style={{ marginTop: 80 }}>
              <SkeletonSectionHeader />
              <div className="courses-container">
                <SkeletonCourseCard />
                <SkeletonCourseCard />
              </div>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* ═══════════════════════════════════════════════════
          HERO — XFOUNDRY ANIMATED INTRO
          ═══════════════════════════════════════════════════ */}
      <section className="hero" id="home">
        <div className="grid-bg"></div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="scan-line"></div>

        {/* Animated video background layer */}
        <div className="hero-video-layer">
          <VideoTemplate />
        </div>

        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SERVICES SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="section services" id="services">
        <div className="grid-bg"></div>
        <div className="scan-line"></div>

        <div className="section-header reveal">
          <span className="section-tag">What We Do</span>
          <h2 className="section-title">Services</h2>
          <div className="section-divider"></div>
          <p className="section-desc" style={{ marginTop: 22 }}>
            Comprehensive technology solutions designed to accelerate your digital transformation.
          </p>
        </div>

        <div className="services-grid">
          {servicesDataArr.length > 0 ? servicesDataArr.map((service, idx) => (
            <div key={service.id} className={`service-card reveal reveal-delay-${Math.min(idx + 1, 5)}`} style={{ cursor: 'pointer' }} onClick={() => router.push(`/services/${service.slug}`)}>
              <span className="service-number">{String(idx + 1).padStart(2, '0')}</span>
              <i className={`${service.icon} service-icon`}></i>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <span className="service-link">Learn More <i className="fas fa-arrow-right"></i></span>
            </div>
          )) : (
            <div className="reveal" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>No services available yet.</div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PROJECTS SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="section projects" id="projects">
        <div className="grid-bg"></div>
        <div className="scan-line"></div>

        <div className="section-header reveal">
          <span className="section-tag">Our Work</span>
          <h2 className="section-title">Featured Projects</h2>
          <div className="section-divider"></div>
          <p className="section-desc" style={{ marginTop: 22 }}>
            Explore our portfolio of real-world projects.
          </p>
        </div>

        <div className="projects-grid">
          <div className="project-card reveal reveal-delay-1" style={{ display: (projectFilter === 'all' || projectFilter === 'ai') ? 'block' : 'none' }} data-category="ai">
            <div className="project-image">
              <i className="fas fa-robot"></i>
              <div className="project-overlay">
                <a href="https://github.com/for-tristan/JackAi" target="_blank" rel="noopener noreferrer" className="btn btn-primary">View Case Study</a>
              </div>
            </div>
            <div className="project-info">
              <div className="project-tags"><span className="project-tag">AI</span></div>
              <h3>Jack Voice Assistant</h3>
              <p>A fully Functional AI voice assistant for seamless human-computer interaction.</p>
            </div>
          </div>
          <div className="project-card reveal reveal-delay-2" style={{ display: (projectFilter === 'all' || projectFilter === 'linux') ? 'block' : 'none' }} data-category="linux">
            <div className="project-image">
              <i className="fas fa-file-archive"></i>
              <div className="project-overlay">
                <a href="https://github.com/for-tristan/Transparent-Dotfiles" target="_blank" rel="noopener noreferrer" className="btn btn-primary">View Case Study</a>
              </div>
            </div>
            <div className="project-info">
              <div className="project-tags"><span className="project-tag">Linux</span><span className="project-tag">UI</span></div>
              <h3>Transparent Dotfiles</h3>
              <p>HyDE config files for more clean and transparent look to Arch Linux.</p>
            </div>
          </div>
          <div className="project-card reveal reveal-delay-3" style={{ display: (projectFilter === 'all' || projectFilter === 'web') ? 'block' : 'none' }} data-category="web">
            <div className="project-image">
              <i className="fas fa-globe"></i>
              <div className="project-overlay">
                <a href="https://github.com/for-tristan/Real-time-web-view" target="_blank" rel="noopener noreferrer" className="btn btn-primary">View Case Study</a>
              </div>
            </div>
            <div className="project-info">
              <div className="project-tags"><span className="project-tag">Software</span><span className="project-tag">Java</span></div>
              <h3>Real-time Web View</h3>
              <p>This Project shows visual changes in the website while coding in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          COURSES SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="section courses" id="courses">
        <div className="grid-bg"></div>
        <div className="scan-line"></div>

        <div className="section-header reveal">
          <span className="section-tag">Learn With Us</span>
          <h2 className="section-title">Tech Programs</h2>
          <div className="section-divider"></div>
          <p className="section-desc" style={{ marginTop: 22 }}>
            Master technologies with our expert-led programs.
          </p>
        </div>

        <div className="courses-container">
          {availableCourses.length > 0 ? availableCourses.map((course, idx) => {
            const techTags = course.features.slice(0, 4);
            return (
              <div key={course.id} className="course-card reveal">
                <div className="course-image" style={{ cursor: 'pointer' }} onClick={() => router.push(`/courses/${course.id}`)}>
                  <i className={course.icon}></i>
                  <span className="course-level">{course.level}</span>
                </div>
                <div className="course-content">
                  <span className="course-category">{course.category}</span>
                  <h3 style={{ cursor: 'pointer' }} onClick={() => router.push(`/courses/${course.id}`)}>{course.name}</h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span className="meta-item"><i className="fas fa-clock"></i> {course.duration}</span>
                    <span className="meta-item"><i className="fas fa-users"></i> Enrolling Now</span>
                  </div>
                  <div className="course-modules">
                    {techTags.map((tag, ti) => <span key={ti} className="module-tag">{tag}</span>)}
                  </div>
                  <div className="course-footer" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" style={{ fontSize: 11, padding: '10px 20px', border: 'none' }} onClick={() => openEnrollModal(course)}>
                      {enrolledCourses.includes(course.id) ? '✓ Enrolled' : 'Enroll Now →'}
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="reveal" style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', gridColumn: '1 / -1' }}>No courses available yet.</div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FAQ SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="section" id="faq" style={{ background: 'var(--black)' }}>
        <div className="grid-bg"></div><div className="scan-line"></div>
        <div className="section-header reveal">
          <span className="section-tag">Got Questions?</span>
          <h2 className="section-title">FAQ</h2>
          <div className="section-divider"></div>
          <p className="section-desc" style={{ marginTop: 22 }}>Everything you need to know about X-Foundry courses and services.</p>
        </div>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { q: 'How do I enroll in a course?', a: 'Sign up for a free account, browse our courses, and click "Enroll Now". Fill in your experience level and motivation, then submit your request. An admin will review and approve it, usually within 24 hours.' },
            { q: 'Are the courses really free?', a: 'Yes! All X-Foundry courses are currently 100% free. We believe quality tech education should be accessible to everyone. This may change in the future, but enrolled students will always have access.' },
            { q: 'How long do the courses take to complete?', a: 'Course durations vary. The ML Engineer Bootcamp is 8 weeks, and Linux Basics is 4 weeks. You can learn at your own pace — all course materials remain accessible even after the official duration ends.' },
            { q: 'Will I receive a certificate?', a: 'Yes, upon completing all course modules and meeting the requirements, you will receive a certificate of completion that you can add to your resume or LinkedIn profile.' },
            { q: 'How do I request a custom software project?', a: 'Navigate to our Contact section or use the "Request Quote" button on any service page. Fill in your project details, and our team will get back to you within 24 hours with a tailored proposal.' },
            { q: 'What technologies do you work with?', a: 'We specialize in modern tech stacks including React, Next.js, Python, TensorFlow, PyTorch, Node.js, Docker, AWS, and more. We choose the right tools for each project based on requirements and scalability needs.' },
            { q: 'Can I cancel my enrollment?', a: 'Yes, you can cancel your enrollment request at any time from your dashboard under "My Enrollments". If you have already been approved, you can still cancel and your progress will be saved if you decide to re-enroll later.' },
            { q: 'How do I contact support?', a: `You can reach us through the Contact form on our website, via email at ${contactEmail}, or through our Discord community. We also have an AI assistant (XAI) available on every page to answer quick questions.` },
          ].map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TEAM SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="section team" id="team">
        <div className="grid-bg"></div>
        <div className="scan-line"></div>

        <div className="section-header reveal">
          <span className="section-tag">Our People</span>
          <h2 className="section-title">Meet The Team</h2>
          <div className="section-divider"></div>
          <p className="section-desc" style={{ marginTop: 22 }}>
            The people behind {siteName}
          </p>

        </div>

        <div className="team-grid">
          {dynamicTeam.length > 0 ? dynamicTeam.map((m, idx) => (
            <div key={m.id} className="team-card reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="team-avatar" style={m.avatar ? { padding: 0 } : {}}>
                {m.avatar
                  ? <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : <i className={m.icon || 'fas fa-user-tie'}></i>
                }
              </div>
              <h3>{m.name}</h3>
              <span className="team-role">{m.role}</span>
              {m.bio && <p className="team-bio">{m.bio}</p>}
              {(m.linkedinUrl || m.githubUrl) && (
                <div className="team-socials">
                  {m.linkedinUrl && <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-link" style={{ position: 'relative', zIndex: 11 }}><i className="fab fa-linkedin-in"></i></a>}
                  {m.githubUrl && <a href={m.githubUrl} target="_blank" rel="noopener noreferrer" className="social-link" style={{ position: 'relative', zIndex: 11 }}><i className="fab fa-github"></i></a>}
                </div>
              )}
            </div>
          )) : (
            <div className="reveal" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <i className="fas fa-users" style={{ fontSize: 32, marginBottom: 16, opacity: 0.3, display: 'block' }}></i>
              <p style={{ fontSize: 15, fontWeight: 600 }}>No team members yet.</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Check back soon to meet the team.</p>
            </div>
          )}
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════
          CONTACT SECTION
          ══════════════════════════════════════════════════ */}
      <section className="section contact" id="contact">
        <div className="grid-bg"></div>
        <div className="scan-line"></div>

        <div className="section-header reveal">
          <span className="section-tag">Get In Touch</span>
          <h2 className="section-title">Request A Quote</h2>
          <div className="section-divider"></div>
          <p className="section-desc" style={{ marginTop: 22 }}>
            Ready to transform your project? Let&apos;s discuss how X-Foundry can help you achieve your goals.
          </p>
        </div>

        <div className="contact-container">
          <div className="contact-info reveal">
            <h3>Let&apos;s Build Something Amazing Together</h3>
            <p>Whether you need custom software development, AI integration, security auditing, or team training — we&apos;re here to help. Reach out and let&apos;s start a conversation about your next big project.</p>
            <ul className="info-list">
              <li className="info-item">
                <div className="info-icon"><i className="fas fa-envelope"></i></div>
                <div className="info-text">
                  <h4>Email Us</h4>
                  <p>{contactEmail}</p>
                </div>
              </li>
              <li className="info-item">
                <div className="info-icon"><i className="fas fa-phone-alt"></i></div>
                <div className="info-text">
                  <h4>Call Us</h4>
                  <p>{contactPhone}</p>
                </div>
              </li>
              <li className="info-item">
                <div className="info-icon"><i className="fas fa-clock"></i></div>
                <div className="info-text">
                  <h4>Business Hours</h4>
                  <p>{businessHours}</p>
                </div>
              </li>
            </ul>
          </div>

            <div className="quote-form reveal">
              <div style={{ display: cqSuccess ? 'none' : 'block' }}>
              <div className="form-header">
                <i className="fas fa-paper-plane"></i>
                <h3>Send Your Inquiry</h3>
              </div>
              <form onSubmit={handleContactQuote}>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input type="text" placeholder="John" value={cqFirstName} onChange={(e) => setCqFirstName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input type="text" placeholder="Doe" value={cqLastName} onChange={(e) => setCqLastName(e.target.value)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" placeholder="john@company.com" value={cqEmail} onChange={(e) => setCqEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="+1 (234) 567890" value={cqPhone} onChange={(e) => setCqPhone(e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Company Name</label>
                    <input type="text" placeholder="Your Company" value={cqCompany} onChange={(e) => setCqCompany(e.target.value)} />
                  </div>
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
                <div className="form-group">
                  <label>Project Details *</label>
                  <textarea placeholder="Tell us about your project, goals, timeline..." value={cqMessage} onChange={(e) => setCqMessage(e.target.value)} required></textarea>
                </div>
                <button type="submit" className="submit-btn" disabled={cqLoading}>
                  {cqLoading ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Inquiry</>}
                </button>
              </form>
            </div>
            <div className={`form-success${cqSuccess ? ' show' : ''}`}>
              <div className="success-icon"><i className="fas fa-check"></i></div>
              <h4>Inquiry Submitted!</h4>
              <p style={{ color: 'var(--text-dim)', marginTop: 10 }}>Our team will review your inquiry and get back to you within 24 hours.</p>
              <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={resetContactForm}>Submit Another</button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="footer-effects">
          <div className="grid-bg"></div>
          <div className="scan-line"></div>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#home" className="logo" style={{ display: 'inline-block', marginBottom: 20 }} onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>X<span>.</span>Foundry</a>
            <p>Pioneering the future of technology through innovation, research, and education. Building solutions that transform industries and empower human potential.</p>
            <div className="footer-socials">
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in"></i></a>
              <a href={githubUrl} target="_blank" rel="noopener noreferrer"><i className="fab fa-github"></i></a>
              <a href={discordUrl} target="_blank" rel="noopener noreferrer"><i className="fab fa-discord"></i></a>
            </div>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
              <li><a href="#projects" onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }}>Projects</a></li>
              <li><a href="#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Courses</a></li>
              <li><a href="/study">Study</a></li>
              <li><a href="#team" onClick={(e) => { e.preventDefault(); scrollToSection('team'); }}>Team</a></li>
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
              <li><a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
              <li><a href={`tel:${contactPhone}`}>{contactPhone}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 X-Foundry. All Rights Reserved.</p>
        </div>
      </footer>
      </>
      )}
      {/* ═══════════════════════════════════════════════════
          SEARCH MODAL
          ═══════════════════════════════════════════════════ */}
      <div className={`search-modal${searchOpen ? ' active' : ''}`} id="searchModal" onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}>
        <button className="close-search" onClick={() => setSearchOpen(false)}>&times;</button>
        <div className="search-modal-content">
          <input type="text" className="modal-search-input" placeholder="Search services, projects, courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <div className="search-results">
            {searchQuery.length >= 2 ? (
              filteredSearch.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 20, fontWeight: 600 }}>No results found.</p>
              ) : (
                filteredSearch.map((item, i) => (
                  <div key={i} className="search-result-item" onClick={() => { setSearchOpen(false); setSearchQuery(''); if (item.link.startsWith('#')) { setTimeout(() => scrollToSection(item.link.replace('#', '')), 200); } else { router.push(item.link); } }}>
                    <h4>{item.title}</h4>
                    <p>{item.desc} <span style={{ color: 'var(--primary-red)' }}>[{item.category}]</span></p>
                  </div>
                ))
              )
            ) : (
              <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 20, fontWeight: 600 }}>Type at least 2 characters...</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          AUTH MODAL
          ═══════════════════════════════════════════════════ */}
      <div className={`auth-modal-overlay${authModalOpen ? ' active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) { setAuthModalOpen(false); setForgotStep('idle'); } }}>
        <div className="auth-modal" style={forgotStep !== 'idle' ? {} : undefined}>
          {forgotStep === 'email' ? (
            <>
              <div className="auth-modal-header">
                <h2>Forgot Password</h2>
                <button className="auth-modal-close" onClick={() => { setAuthModalOpen(false); setForgotStep('idle'); }}>&times;</button>
              </div>
              <div className="auth-modal-body">
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                  Enter the email associated with your account and we&apos;ll send you a 6-digit verification code.
                </p>
                <form onSubmit={handleForgotSubmit}>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" placeholder="your@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                  </div>
                  <button type="submit" className="submit-btn" disabled={forgotLoading} style={{ marginTop: 8 }}>
                    {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Sending Code...</> : <><i className="fas fa-paper-plane"></i> Send Reset Code</>}
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={() => setForgotStep('idle')} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: 6, fontSize: 11 }}></i> Back to Sign In
                  </button>
                </div>
              </div>
            </>
          ) : forgotStep === 'code' ? (
            <>
              <div className="auth-modal-header">
                <h2>Verify Code</h2>
                <button className="auth-modal-close" onClick={() => { setAuthModalOpen(false); setForgotStep('idle'); }}>&times;</button>
              </div>
              <div className="auth-modal-body">
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                  A 6-digit code was sent to <strong style={{ color: 'var(--text-light)' }}>{forgotEmail}</strong>. Enter it below along with your new password.
                </p>
                <form onSubmit={handleResetSubmit}>
                  <div className="form-group">
                    <label>6-Digit Code</label>
                    <input type="text" value={resetCode} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setResetCode(v); }} placeholder="000000" required maxLength={6} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }} />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="submit-btn" disabled={resetLoading} style={{ marginTop: 8 }}>
                    {resetLoading ? <><i className="fas fa-spinner fa-spin"></i> Resetting Password...</> : <><i className="fas fa-check"></i> Reset Password</>}
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={() => setForgotStep('idle')} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}>
                    <i className="fas fa-arrow-left" style={{ marginRight: 6, fontSize: 11 }}></i> Back to Sign In
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="auth-modal-header">
                <h2>{authTab === 'signin' ? 'Sign In' : 'Create Account'}</h2>
                <button className="auth-modal-close" onClick={() => setAuthModalOpen(false)}>&times;</button>
              </div>

              <div className="auth-modal-tabs">
                <button className={`auth-modal-tab${authTab === 'signin' ? ' active' : ''}`} onClick={() => { setAuthTab('signin'); setAuthMessage(''); }}>Sign In</button>
                <button className={`auth-modal-tab${authTab === 'signup' ? ' active' : ''}`} onClick={() => { setAuthTab('signup'); setAuthMessage(''); }}>Create Account</button>
              </div>

              <div className="auth-modal-body">
                {authMessage && <div className="auth-modal-message">{authMessage}</div>}

                {authTab === 'signin' ? (
                  <form onSubmit={handleLogin}>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" placeholder="your@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input type="password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                    </div>
                    <div style={{ textAlign: 'right', marginBottom: 8 }}>
                      <button type="button" onClick={() => { setForgotStep('email'); setForgotEmail(loginEmail); }} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }}>
                        Forgot Password?
                      </button>
                    </div>
                    <button type="submit" className="submit-btn" disabled={loginLoading} style={{ marginTop: 0 }}>
                      {loginLoading ? <><i className="fas fa-spinner fa-spin"></i> Signing In...</> : <><i className="fas fa-arrow-right"></i> Sign In</>}
                    </button>
                  
                  </form>
                ) : (
                  <form onSubmit={handleSignup}>
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input type="text" placeholder="John Doe" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" placeholder="your@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Password *</label>
                      <input type="password" placeholder="Min. 6 characters" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                      {signupPassword && (
                        <div className="xf-password-strength">
                          <div className={`xf-password-strength-bar ${getPasswordStrength(signupPassword)}`}></div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Phone</label>
                        <input type="tel" placeholder="+1 (555) 000-0000" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Role</label>
                        <select value={signupRole} onChange={(e) => setSignupRole(e.target.value)} style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none' }}>
                          <option value="student">Student</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Company</label>
                      <input type="text" placeholder="Your company (optional)" value={signupCompany} onChange={(e) => setSignupCompany(e.target.value)} />
                    </div>
                    <button type="submit" className="submit-btn" disabled={signupLoading} style={{ marginTop: 8 }}>
                      {signupLoading ? <><i className="fas fa-spinner fa-spin"></i> Creating Account...</> : <><i className="fas fa-user-plus"></i> Create Account</>}
                    </button>
                   
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>

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
                <span style={{ width: 40, height: 40, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                  <i className={svc.icon} style={{ color: 'var(--primary-red)', fontSize: 16 }}></i>
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
                    <i className={f.icon || 'fas fa-check'} style={{ color: 'var(--primary-red)', fontSize: 11 }}></i>
                    <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 600 }}>{f.title}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '12px 24px' }} onClick={() => { setServiceModal(null); router.push(`/services/${svc.slug}`); }}>
                  Learn More <i className="fas fa-arrow-right"></i>
                </button>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '12px 24px' }} onClick={() => { setServiceModal(null); scrollToSection('contact'); }}>
                  Request a Quote <i className="fas fa-paper-plane"></i>
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
              <button className={`dash-tab${dashTab === 'profile' ? ' active' : ''}`} onClick={() => setDashTab('profile')}><i className="fas fa-user" style={{ marginRight: 6 }}></i>Profile</button>
              <button className={`dash-tab${dashTab === 'courses' ? ' active' : ''}`} onClick={() => setDashTab('courses')}>Courses</button>
              <button className={`dash-tab${dashTab === 'my-enrollments' ? ' active' : ''}`} onClick={() => setDashTab('my-enrollments')}>My Enrollments</button>
              <button className={`dash-tab${dashTab === 'request-quote' ? ' active' : ''}`} onClick={() => setDashTab('request-quote')}>Request Quote</button>
              <button className={`dash-tab${dashTab === 'my-quotes' ? ' active' : ''}`} onClick={() => setDashTab('my-quotes')}>My Quotes</button>
              <button className={`dash-tab${dashTab === 'friends' ? ' active' : ''}`} onClick={() => { setDashTab('friends'); loadFriends(); }}><i className="fas fa-user-friends" style={{ marginRight: 6 }}></i>Friends</button>
              <button className={`dash-tab${dashTab === 'messages' ? ' active' : ''}`} onClick={() => { setDashTab('messages'); loadFriends(); }}><i className="fas fa-comment-dots" style={{ marginRight: 6 }}></i>Messages</button>
            </div>

            <div className="dashboard-modal-body">
              {/* ── PROFILE TAB ── */}
              {dashTab === 'profile' && (
                <div style={{ maxWidth: 480, margin: '0 auto' }}>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 4, color: 'var(--text-light)' }}>My Profile</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 28, fontSize: 14 }}>Manage your account details and profile picture</p>

                  {/* Avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(220,20,60,0.1)', border: '2px solid rgba(220,20,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 24, fontWeight: 900, overflow: 'hidden' }}>
                        {user?.avatar
                          ? <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span>{user?.name.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <label style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--dark-gray)' }}>
                        <i className={`fas fa-${avatarUploading ? 'spinner fa-spin' : 'camera'}`} style={{ fontSize: 10, color: '#fff' }}></i>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 2 }}>{user?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{user?.email}</div>
                      {user?.username && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{user.username}</div>}
                      <div style={{ marginTop: 4, padding: '2px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(220,20,60,0.1)', color: 'var(--primary-red)', border: '1px solid rgba(220,20,60,0.2)', display: 'inline-block' }}>{user?.role}</div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleProfileSave}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Full Name</label>
                      <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Username</label>
                      <input type="text" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="your_unique_username" style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Phone</label>
                      <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+20 10..." style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }} />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Company</label>
                      <input type="text" value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)} placeholder="Your company name" style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }} />
                    </div>
                    <button type="submit" disabled={profileSaving} className="submit-btn" style={{ width: '100%', opacity: profileSaving ? 0.6 : 1 }}>
                      {profileSaving ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Saving...</> : <><i className="fas fa-save" style={{ marginRight: 8 }}></i> Save Profile</>}
                    </button>
                  </form>
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => {
                        openConfirm(
                          'Delete Account',
                          'Are you sure you want to delete your account? This action is PERMANENT and cannot be undone. All your data, progress, and certificates will be lost.',
                          async () => {
                            try {
                              const res = await fetch('/api/user/delete-account', { method: 'DELETE' });
                              if (res.ok) { window.location.href = '/'; }
                              else { toast({ title: 'Failed', description: (await res.json()).error, variant: 'destructive' }); }
                            } catch { toast({ title: 'Error', description: 'Failed to delete account', variant: 'destructive' }); }
                          },
                          { confirmLabel: 'Delete Forever', danger: true, icon: 'fas fa-skull-crossbones' }
                        );
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 0',
                        background: 'transparent',
                        border: '1px solid rgba(239,68,68,0.4)',
                        color: '#ef4444',
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "'Space Grotesk', sans-serif",
                        cursor: 'pointer',
                        borderRadius: 2,
                      }}
                    >
                      <i className="fas fa-trash-alt" style={{ marginRight: 8 }}></i>Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* ── COURSES TAB ── */}
              {dashTab === 'courses' && (
                <div>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 4, color: 'var(--text-light)' }}>Available Courses</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Enroll in our free courses and start learning today</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {availableCourses.map((course) => {
                      const isEnrolled = enrolledCourses.includes(course.id);
                      return (
                        <div key={course.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 16 }}>
                              <i className={course.icon}></i>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--primary-red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{course.category}</div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>{course.name}</div>
                            </div>
                          </div>
                          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>{course.description}</p>
                          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-dim)' }}><i className="fas fa-signal" style={{ color: 'var(--primary-red)', fontSize: 11 }}></i>{course.level}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-dim)' }}><i className="fas fa-clock" style={{ color: 'var(--primary-red)', fontSize: 11 }}></i>{course.duration}</span>
                            <span style={{ background: 'rgba(76,175,80,0.1)', color: '#4caf50', padding: '2px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, border: '1px solid rgba(76,175,80,0.2)' }}>{course.price}</span>
                          </div>
                          <button className={`submit-btn${isEnrolled ? '' : ''}`} disabled={isEnrolled} onClick={() => openEnrollModal(course)} style={{ padding: '10px 0', fontSize: 11, letterSpacing: 2, marginTop: 0, opacity: isEnrolled ? 0.5 : 1 }}>
                            {isEnrolled ? '✓ Enrolled' : <><i className="fas fa-plus"></i> Enroll Now</>}
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
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 4, color: 'var(--text-light)' }}>My Enrollments</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Track your enrollment requests and their status</p>
                  {enrollmentsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--primary-red)' }}></i></div>
                  ) : enrollments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                      <i className="fas fa-book-open" style={{ fontSize: 36, color: 'rgba(220,20,60,0.3)', display: 'block', marginBottom: 12 }}></i>
                      <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 8 }}>No enrollments yet</h4>
                      <p style={{ fontSize: 14 }}>Browse our courses and submit an enrollment request</p>
                      <button className="btn btn-primary" style={{ marginTop: 16, fontSize: 11, padding: '10px 24px' }} onClick={() => setDashTab('courses')}>Browse Courses</button>
                    </div>
                  ) : (
                    <div>
                      {enrollments.map((enr) => {
                        const statusStyles: Record<string, { bg: string; color: string; border: string; label: string }> = {
                          pending: { bg: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.25)', label: 'Pending Review' },
                          approved: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', label: 'Approved' },
                          declined: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', label: 'Declined' },
                        };
                        const st = statusStyles[enr.status] || statusStyles.pending;
                        return (
                          <div key={enr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 40, height: 40, background: 'rgba(220,20,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 14 }}>
                                <i className={enr.courseId === 'ml-bootcamp' ? 'fas fa-brain' : 'fas fa-terminal'}></i>
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 2 }}>{enr.courseName}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Enrolled {formatDate(enr.enrolledAt)}</span>
                                  {enr.experienceLevel && <span style={{ fontSize: 11, color: '#666' }}><i className="fas fa-signal" style={{ marginRight: 4, fontSize: 10 }}></i>{enr.experienceLevel}</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ padding: '4px 14px', borderRadius: 2, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: st.bg, color: st.color, border: st.border }}>
                                {st.label}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fas fa-clock" style={{ color: 'var(--primary-red)', fontSize: 11 }}></i>{enr.duration}</span>
                              <button
                                onClick={() => handleCancelEnrollment(enr.id)}
                                disabled={cancelLoading === enr.id}
                                style={{
                                  padding: '7px 16px',
                                  background: 'transparent',
                                  border: '1px solid rgba(239,68,68,0.4)',
                                  color: '#ef4444',
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: 1,
                                  cursor: 'pointer',
                                  opacity: cancelLoading === enr.id ? 0.5 : 1,
                                  transition: 'all 0.2s',
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <i className={cancelLoading === enr.id ? 'fas fa-spinner fa-spin' : 'fas fa-times'} style={{ fontSize: 10 }} />
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
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 4, color: 'var(--text-light)' }}>Request a Quote</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Tell us about your project and we&apos;ll get back to you within 24 hours</p>
                  <form onSubmit={handleDashQuote}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input type="text" placeholder="John Doe" value={dqName} onChange={(e) => setDqName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input type="email" placeholder="your@email.com" value={dqEmail} onChange={(e) => setDqEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div className="form-group">
                        <label>Phone</label>
                        <input type="tel" placeholder="+1 (555) 000-0000" value={dqPhone} onChange={(e) => setDqPhone(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Company</label>
                        <input type="text" placeholder="Your Company" value={dqCompany} onChange={(e) => setDqCompany(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Service *</label>
                      <select value={dqService} onChange={(e) => setDqService(e.target.value)} required style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none' }}>
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
                      <select value={dqBudget} onChange={(e) => setDqBudget(e.target.value)} style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none' }}>
                        <option value="">Select budget range...</option>
                        <option value="Under $5,000">Under $5,000</option>
                        <option value="$5,000 - $15,000">$5,000 - $15,000</option>
                        <option value="$15,000 - $50,000">$15,000 - $50,000</option>
                        <option value="$50,000+">$50,000+</option>
                        <option value="Not sure yet">Not sure yet</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Project Details *</label>
                      <textarea placeholder="Tell us about your project, goals, timeline..." value={dqDescription} onChange={(e) => setDqDescription(e.target.value)} required></textarea>
                    </div>
                    <button type="submit" className="submit-btn" disabled={dqLoading}>
                      {dqLoading ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Quote Request</>}
                    </button>
                  </form>
                </div>
              )}

              {/* ── MY QUOTES TAB ── */}
              {dashTab === 'my-quotes' && (
                <div>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 4, color: 'var(--text-light)' }}>My Quotes</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Track the status of your quote requests</p>
                  {quotesLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--primary-red)' }}></i></div>
                  ) : quotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                      <i className="fas fa-clipboard-list" style={{ fontSize: 36, color: 'rgba(220,20,60,0.3)', display: 'block', marginBottom: 12 }}></i>
                      <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 8 }}>No quotes yet</h4>
                      <p style={{ fontSize: 14 }}>Submit a quote request to get started</p>
                      <button className="btn btn-primary" style={{ marginTop: 16, fontSize: 11, padding: '10px 24px' }} onClick={() => setDashTab('request-quote')}>Request a Quote</button>
                    </div>
                  ) : (
                    <div>
                      {quotes.map((q) => (
                        <div key={q.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: 20, marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                            <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>{q.serviceType}</span>
                            <span style={{
                              padding: '3px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                              background: q.status === 'pending' ? 'rgba(255,193,7,0.1)' : q.status === 'reviewed' ? 'rgba(33,150,243,0.1)' : 'rgba(76,175,80,0.1)',
                              color: q.status === 'pending' ? '#ffc107' : q.status === 'reviewed' ? '#2196f3' : '#4caf50',
                              border: `1px solid ${q.status === 'pending' ? 'rgba(255,193,7,0.2)' : q.status === 'reviewed' ? 'rgba(33,150,243,0.2)' : 'rgba(76,175,80,0.2)'}`,
                            }}>{q.status === 'replied' ? <><i className="fas fa-check-circle" style={{ marginRight: 4, fontSize: 9 }}></i>Replied</> : q.status === 'reviewed' ? <><i className="fas fa-eye" style={{ marginRight: 4, fontSize: 9 }}></i>Reviewed</> : <><i className="fas fa-clock" style={{ marginRight: 4, fontSize: 9 }}></i>Pending</>}</span>
                          </div>
                          <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{q.description}</p>
                          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fas fa-calendar" style={{ color: 'var(--primary-red)', fontSize: 10 }}></i>{formatDate(q.createdAt)}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fas fa-user" style={{ color: 'var(--primary-red)', fontSize: 10 }}></i>{q.name}</span>
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
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 4, color: 'var(--text-light)' }}>Friends</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>Manage your friends and friend requests</p>

                  {/* Add Friend */}
                  <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                    <input
                      type="text"
                      value={addFriendUsername}
                      onChange={(e) => setAddFriendUsername(e.target.value)}
                      placeholder="Enter username to add..."
                      style={{
                        flex: 1, padding: '10px 14px',
                        background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                        color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif",
                        outline: 'none', borderRadius: 2,
                      }}
                    />
                    <button type="submit" disabled={addFriendLoading} className="submit-btn" style={{ width: 'auto', padding: '10px 20px', opacity: addFriendLoading ? 0.6 : 1, fontSize: 13 }}>
                      {addFriendLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Sending...</> : <><i className="fas fa-user-plus" style={{ marginRight: 6 }}></i>Add</>}
                    </button>
                  </form>

                  {/* Pending Requests */}
                  {pendingRequests.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--primary-red)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                        <i className="fas fa-inbox" style={{ marginRight: 6 }}></i>Pending Requests ({pendingRequests.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pendingRequests.map((req) => (
                          <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 13, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {req.avatar ? <img src={req.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : req.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{req.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{req.username}</div>
                            </div>
                            <button onClick={() => handleAcceptFriend(req.id)} style={{ padding: '6px 14px', borderRadius: 2, border: 'none', background: 'var(--primary-red, #dc143c)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Accept</button>
                            <button onClick={() => handleRejectFriend(req.id)} style={{ padding: '6px 14px', borderRadius: 2, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>Decline</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent Requests */}
                  {sentRequests.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                        <i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i>Sent Requests ({sentRequests.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sentRequests.map((req) => (
                          <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {req.avatar ? <img src={req.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : req.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{req.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{req.username} <span style={{ color: '#ffc107', fontSize: 10 }}>&middot; Pending</span></div>
                            </div>
                            <button onClick={() => handleCancelSentRequest(req.id)} style={{ padding: '6px 14px', borderRadius: 2, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
                              <i className="fas fa-times" style={{ fontSize: 10, marginRight: 4 }}></i>Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Friends List */}
                  <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                    <i className="fas fa-users" style={{ marginRight: 6 }}></i>All Friends ({friends.length})
                  </h4>
                  {friendsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--primary-red)' }}></i></div>
                  ) : friends.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                      <i className="fas fa-user-friends" style={{ fontSize: 36, color: 'rgba(220,20,60,0.3)', display: 'block', marginBottom: 12 }}></i>
                      <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 8 }}>No friends yet</h4>
                      <p style={{ fontSize: 14 }}>Add a friend by their username to get started</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {friends.map((f) => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 13, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                            {f.avatar ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : f.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{f.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{f.username}</div>
                          </div>
                          <button onClick={() => { setDashTab('messages'); }} style={{ padding: '6px 14px', borderRadius: 2, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--primary-red)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-comment" style={{ fontSize: 10 }}></i> Message
                          </button>
                          <button onClick={() => handleRemoveFriend(f.id)} style={{ padding: '6px 14px', borderRadius: 2, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
                            <i className="fas fa-user-minus" style={{ fontSize: 10 }}></i>
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
                      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 4, color: 'var(--text-light)' }}>Messages</h3>
                      <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Chat with your friends</p>
                    </div>
                    <button onClick={() => { setDashboardOpen(false); setChatOpen(true); }} className="submit-btn" style={{ width: 'auto', padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-expand"></i> Open Chat
                    </button>
                  </div>
                  {friends.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                      <i className="fas fa-comment-dots" style={{ fontSize: 36, color: 'rgba(220,20,60,0.3)', display: 'block', marginBottom: 12 }}></i>
                      <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 8 }}>No conversations</h4>
                      <p style={{ fontSize: 14 }}>Add friends first to start messaging</p>
                      <button className="btn btn-primary" style={{ marginTop: 16, fontSize: 11, padding: '10px 24px' }} onClick={() => setDashTab('friends')}>Go to Friends</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {friends.map((f) => (
                        <button key={f.id} onClick={() => { setSelectedChatFriend(f); setDashboardOpen(false); setChatOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2, cursor: 'pointer', textAlign: 'left', width: '100%', color: 'var(--text-light)', transition: 'border-color 0.2s' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 14, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                            {f.avatar ? <img src={f.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : f.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{f.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{f.username}</div>
                          </div>
                          <i className="fas fa-chevron-right" style={{ color: 'var(--text-dim)', fontSize: 11 }}></i>
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
          <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <button className="modal-close" onClick={() => setEnrollModalOpen(false)}>
              <i className="fas fa-times"></i>
            </button>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
            
              <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 4 }}>Enrollment Request</h2>
              <p style={{ color: 'var(--primary-red)', fontSize: 13, fontWeight: 700 }}>{enrollCourse.name}</p>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 6 }}>Fill in your details below. Your request will be reviewed by an admin.</p>
            </div>

            <form onSubmit={handleEnrollSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  <i className="fas fa-user" style={{ marginRight: 6, color: 'var(--primary-red)', fontSize: 11 }}></i>Full Name
                </label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  style={{ width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-dim)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  <i className="fas fa-envelope" style={{ marginRight: 6, color: 'var(--primary-red)', fontSize: 11 }}></i>Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-dim)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', borderRadius: 2 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Experience Level *</label>
                <select
                  value={erExperience}
                  onChange={(e) => setErExperience(e.target.value)}
                  required
                  style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none' }}
                >
                  <option value="">Select your level...</option>
                  <option value="Beginner">Beginner - No prior experience</option>
                  <option value="Intermediate">Intermediate - Some experience</option>
                  <option value="Advanced">Advanced - Working professional</option>
                  <option value="Expert">Expert - Deep domain knowledge</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Why do you want to join? *</label>
                <textarea
                  value={erMotivation}
                  onChange={(e) => setErMotivation(e.target.value)}
                  required
                  placeholder="Tell us about your goals, what you hope to learn, and how this course will help you..."
                  rows={4}
                  style={{ width: '100%', padding: '14px 18px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, outline: 'none', resize: 'vertical', minHeight: 100 }}
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={enrollLoading}
                style={{ width: '100%', opacity: enrollLoading ? 0.6 : 1, padding: '16px', fontSize: 13, letterSpacing: 3 }}
              >
                {enrollLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Submitting...</> : <><i className="fas fa-paper-plane" style={{ marginRight: 8 }}></i> Submit Enrollment Request</>}
              </button>

              <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 11, marginTop: 16, lineHeight: 1.6 }}>
                <i className="fas fa-info-circle" style={{ marginRight: 4 }}></i>
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
    </>
  );
}
