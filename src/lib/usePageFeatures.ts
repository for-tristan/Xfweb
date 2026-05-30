'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  emailVerified?: string | null;
  phone?: string | null;
  company?: string | null;
  avatar?: string | null;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  courseLevel?: string;
  duration?: string;
  enrolledAt: string;
  status?: string;
  experienceLevel?: string | null;
  motivation?: string | null;
}

interface SearchItem {
  title: string;
  category: string;
  desc: string;
  link: string;
}

// ═══════════════════════════════════════════════════
// SEARCH DATA
// ═══════════════════════════════════════════════════

const searchData: SearchItem[] = [
  { title: 'AI & Machine Learning', category: 'Service', desc: 'Intelligent systems with ML algorithms', link: '/services/ai-ml' },
  { title: 'Custom Software Dev', category: 'Service', desc: 'End-to-end software development', link: '/services/software-dev' },
  { title: 'Tech Education & Training', category: 'Service', desc: 'Training programs and courses', link: '/services/training' },
  { title: 'ML Engineer Bootcamp', category: 'Course', desc: '8-week machine learning program', link: '/courses/ml-bootcamp' },
  { title: 'Linux Basics Course', category: 'Course', desc: 'Linux administration fundamentals', link: '/courses/linux-basics' },
  { title: 'Contact Us', category: 'Page', desc: 'Get in touch with our team', link: '/#contact' },
];

// ═══════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════

export function usePageFeatures() {
  const { toast } = useToast();
  const router = useRouter();

  // ── Auth ──
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Auth Modal ──
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState('');

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

  // ── Search ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Theme ──
  // Multi-theme: crimson, midnight, oled, phantom, synthwave, frost, light, sand
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'crimson';
    return localStorage.getItem('x-foundry-theme') || 'crimson';
  });

  // ── UI ──
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Dashboard / Profile Modal ──
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // ── Scroll to section (for navbar hash links) ──
  const scrollToSection = useCallback((sectionId: string) => {
    setMobileMenuOpen(false);
    if (window.location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [router]);

  // ── Notifications ──
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; read: boolean; createdAt: string; type?: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

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

  // ── Profile Editing ──
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ═══════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════

  // Auth check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          // Load profile data immediately
          if (data.user) {
            setProfileName(data.user.name || '');
            setProfileUsername(data.user.username || '');
            setProfilePhone(data.user.phone || '');
            setProfileCompany(data.user.company || '');
          }
        } else if (res.status === 403) {
          // Existing user whose email is not yet verified —
          // force them into the verification flow
          const data = await res.json();
          if (data.needsVerification) {
            setUser(null);
            setVerificationEmail(data.email);
            setVerificationCode('');
            setVerificationStep('pending');
            setAuthModalOpen(true);
            toast({ title: 'Verification Required', description: data.error });
          }
        }
      } catch { /* not authed */ }
      setLoading(false);
    })();
  }, []);

  // Theme init
  useEffect(() => {
    // Map old 'dark' to 'crimson' for backwards compat
    const effectiveTheme = theme === 'dark' ? 'crimson' : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.classList.toggle('dark', effectiveTheme !== 'light' && effectiveTheme !== 'sand');
  }, [theme]);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setAuthModalOpen(false); setSearchOpen(false); setDashboardOpen(false); setNotifOpen(false); setMobileMenuOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ═══════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════

  const toggleTheme = useCallback(() => {
    // Legacy toggle: switch between crimson (dark) and light
    const isDark = theme !== 'light' && theme !== 'sand';
    const next = isDark ? 'light' : 'crimson';
    setTheme(next);
    localStorage.setItem('x-foundry-theme', next);
  }, [theme]);

  const changeTheme = useCallback((newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('x-foundry-theme', newTheme);
  }, []);

  const openAuthModal = useCallback((tab: 'signin' | 'signup', msg?: string) => {
    setAuthTab(tab);
    setAuthMessage(msg || '');
    setAuthModalOpen(true);
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' }); return; }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setProfileName(data.user.name || '');
        setProfileUsername(data.user.username || '');
        setProfilePhone(data.user.phone || '');
        setProfileCompany(data.user.company || '');
        setAuthModalOpen(false);
        setVerificationStep('idle');
        toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` });
        setLoginEmail(''); setLoginPassword('');
      } else if (res.status === 403 && data.needsVerification) {
        // Email not verified — switch to verification screen
        setVerificationEmail(data.email);
        setVerificationCode('');
        setVerificationStep('pending');
        toast({ title: 'Verification Required', description: data.error });
      } else { toast({ title: 'Login Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setLoginLoading(false);
  }, [loginEmail, loginPassword, toast]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
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
          // Show verification screen instead of auto-login
          setVerificationEmail(data.email);
          setVerificationCode('');
          setVerificationStep('pending');
          toast({ title: 'Check your email!', description: 'A 6-digit verification code has been sent to your email.' });
        } else {
          setUser(data.user);
          setProfileName(data.user.name || '');
          setProfileUsername(data.user.username || '');
          setProfilePhone(data.user.phone || '');
          setProfileCompany(data.user.company || '');
          setAuthModalOpen(false);
          toast({ title: 'Account created!', description: `Welcome to X.Foundry, ${data.user.name}` });
        }
        setSignupName(''); setSignupEmail(''); setSignupPassword(''); setSignupConfirmPassword(''); setSignupPhone(''); setSignupCompany('');
      } else { toast({ title: 'Signup Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setSignupLoading(false);
  }, [signupName, signupEmail, signupPassword, signupConfirmPassword, signupPhone, signupCompany, signupRole, toast]);

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setUser(null);
    setDashboardOpen(false);
    setNotifOpen(false);
    setVerificationStep('idle');
    toast({ title: 'Logged out', description: 'See you soon!' });
  }, [toast]);

  // ── Forgot Password ──
  const handleForgotSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [forgotEmail, toast]);

  const handleResetSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [forgotEmail, resetCode, newPassword, toast]);

  // ── Notifications ──
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount((data.notifications || []).filter((n: { read: boolean }) => !n.read).length);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Profile ──
  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: 'File too large', description: 'Avatar must be under 2MB', variant: 'destructive' }); return; }
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/user/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...user, avatar: data.avatarUrl });
        toast({ title: 'Avatar updated!' });
      } else { toast({ title: 'Upload failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' }); }
    setAvatarUploading(false);
  }, [user, toast]);

  // Callback for when avatar is uploaded (from crop modal)
  const handleAvatarUploaded = useCallback((avatarUrl: string) => {
    if (user) setUser({ ...user, avatar: avatarUrl });
  }, [user]);

  const handleProfileSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, username: profileUsername, phone: profilePhone, company: profileCompany }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...user, name: data.user.name, username: data.user.username, phone: data.user.phone, company: data.user.company });
        toast({ title: 'Profile saved!' });
      } else { toast({ title: 'Save failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setProfileSaving(false);
  }, [user, profileName, profilePhone, profileCompany, toast]);

  // ═══════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════

  const filteredSearch = searchQuery.length >= 2
    ? searchData.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const getPasswordStrength = (pw: string) => {
    if (!pw) return '';
    let s = 0;
    if (pw.length >= 8) s++; if (pw.length >= 12) s++; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 2) return 'weak'; if (s <= 3) return 'medium'; return 'strong';
  };

  return {
    user, setUser,
    theme, toggleTheme, changeTheme,
    scrolled, mobileMenuOpen, setMobileMenuOpen,
    searchOpen, setSearchOpen, searchQuery, setSearchQuery, filteredSearch,
    authModalOpen, setAuthModalOpen, authTab, setAuthTab, authMessage, setAuthMessage,
    openAuthModal,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginLoading, handleLogin,
    signupName, setSignupName, signupEmail, setSignupEmail, signupPassword, setSignupPassword, signupConfirmPassword, setSignupConfirmPassword,
    signupPhone, setSignupPhone, signupCompany, setSignupCompany, signupRole, setSignupRole, signupLoading, handleSignup,
    handleLogout,
    scrollToSection,
    getPasswordStrength,
    loading,
    router,
    // Dashboard
    dashboardOpen, setDashboardOpen,
    // Notifications
    notifications, setNotifications, unreadCount, setUnreadCount, notifOpen, setNotifOpen, loadNotifications,
    // Profile editing
    profileName, setProfileName, profileUsername, setProfileUsername, profilePhone, setProfilePhone, profileCompany, setProfileCompany,
    profileSaving, avatarUploading, handleAvatarUpload, handleAvatarUploaded, handleProfileSave,
    // Forgot password
    forgotStep, setForgotStep, forgotEmail, setForgotEmail, forgotLoading, handleForgotSubmit,
    resetCode, setResetCode, newPassword, setNewPassword, resetLoading, handleResetSubmit,
    // Email verification
    verificationStep, setVerificationStep, verificationEmail, setVerificationEmail,
    verificationCode, setVerificationCode, verificationLoading,
    handleVerifyEmail: async (e: React.FormEvent) => {
      e.preventDefault();
      if (!verificationCode) { toast({ title: 'Error', description: 'Please enter the verification code', variant: 'destructive' }); return; }
      setVerificationLoading(true);
      try {
        const res = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: verificationEmail, code: verificationCode }) });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          setProfileName(data.user.name || '');
          setProfileUsername(data.user.username || '');
          setProfilePhone(data.user.phone || '');
          setProfileCompany(data.user.company || '');
          setAuthModalOpen(false);
          setVerificationStep('idle');
          setVerificationCode('');
          toast({ title: 'Email Verified!', description: 'Your account is now active. Welcome to X.Foundry!' });
        } else { toast({ title: 'Verification Failed', description: data.error, variant: 'destructive' }); }
      } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
      setVerificationLoading(false);
    },
    handleResendVerification: async () => {
      if (!verificationEmail) { toast({ title: 'Error', description: 'No email address found', variant: 'destructive' }); return; }
      setResendLoading(true);
      try {
        const res = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: verificationEmail }) });
        const data = await res.json();
        if (res.ok) {
          toast({ title: 'Code Resent!', description: 'A new verification code has been sent to your email.' });
        } else { toast({ title: 'Error', description: data.error, variant: 'destructive' }); }
      } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
      setResendLoading(false);
    },
    resendLoading,
  };
}
