'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { safeGetItem, safeSetItem, stripPiiForCache } from '@/lib/safeStorage';


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


const searchData: SearchItem[] = [
  { title: 'AI & Machine Learning', category: 'Service', desc: 'Intelligent systems with ML algorithms', link: '/services/ai-ml' },
  { title: 'Custom Software Dev', category: 'Service', desc: 'End-to-end software development', link: '/services/software-dev' },
  { title: 'Tech Education & Training', category: 'Service', desc: 'Training programs and courses', link: '/services/training' },
  { title: 'ML Engineer Bootcamp', category: 'Course', desc: '8-week machine learning program', link: '/courses/ml-bootcamp' },
  { title: 'Linux Basics Course', category: 'Course', desc: 'Linux administration fundamentals', link: '/courses/linux-basics' },
  { title: 'Contact Us', category: 'Page', desc: 'Get in touch with our team', link: '/#contact' },
];


export function usePageFeatures() {
  const { toast } = useToast();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // NOTE: previously this had a 3-second `minLoading` timer that forced
  // AuthGate to show the 3-dot loader for at least 3s on every protected
  // page, even when /api/auth/me returned in 100ms. That was the main
  // cause of "navigation feels laggy" — every page had a 3s artificial
  // delay baked in. Now we just track the actual loading state.
  const [minLoading, setMinLoading] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState('');

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

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'light';
    return safeGetItem('x-foundry-theme') || 'light';
  });

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [dashboardOpen, setDashboardOpen] = useState(false);

  const scrollToSection = useCallback((sectionId: string) => {
    setMobileMenuOpen(false);
    const doScroll = () => {
      const lenis = (window as any).__lenis;
      if (sectionId === 'home') {
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      const el = document.getElementById(sectionId);
      if (!el) return;
      if (lenis) {
        lenis.scrollTo(el, { offset: 0, duration: 1.2 });
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    if (window.location.pathname === '/') {
      doScroll();
    } else {
      router.push('/');
      setTimeout(doScroll, 500);
    }
  }, [router]);

  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; read: boolean; createdAt: string; type?: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

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

  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);


  useEffect(() => {
    (async () => {
      // Fallback for Edge/InPrivate: check sessionStorage first. If the
      // user data is there (stored after login), use it immediately so
      // the user doesn't appear logged out on the next page navigation.
      try {
        const cached = sessionStorage.getItem('xfoundry_user');
        if (cached) {
          const cachedUser = JSON.parse(cached);
          setUser(cachedUser);
          setProfileName(cachedUser.name || '');
          setProfileUsername(cachedUser.username || '');
          setProfilePhone(cachedUser.phone || '');
          setProfileCompany(cachedUser.company || '');
        }
      } catch {}

      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user) {
            setProfileName(data.user.name || '');
            setProfileUsername(data.user.username || '');
            setProfilePhone(data.user.phone || '');
            setProfileCompany(data.user.company || '');
            // Cache for Edge fallback
            try { sessionStorage.setItem('xfoundry_user', JSON.stringify(stripPiiForCache(data.user))); } catch {}
          }
        } else if (res.status === 403) {
          const data = await res.json();
          if (data.needsVerification) {
            setUser(null);
            setVerificationEmail(data.email);
            setVerificationCode('');
            setVerificationStep('pending');
            setAuthModalOpen(true);
            toast({ title: 'Verification Required', description: data.error });
          }
        } else if (res.status === 401) {
          // Cookies not sent (Edge) — but if we have sessionStorage, keep user
          try {
            const cached = sessionStorage.getItem('xfoundry_user');
            if (!cached) setUser(null);
          } catch { setUser(null); }
        }
      } catch {  }
      setLoading(false);
    })();
  }, []);

  // Re-fetch /api/auth/me when the window regains focus, so role changes
  // made by an admin propagate to the user's UI without a manual logout.
  // getCurrentUser() always reads the role fresh from the DB on the
  // server, so server-side ACLs are already correct; this just refreshes
  // the client-side user state so the navbar/buttons update.
  useEffect(() => {
    let lastRefresh = Date.now();
    const onFocus = () => {
      // Throttle to once per 30s to avoid hammering the API on rapid tab switches
      if (Date.now() - lastRefresh < 30000) return;
      lastRefresh = Date.now();
      (async () => {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              try { sessionStorage.setItem('xfoundry_user', JSON.stringify(stripPiiForCache(data.user))); } catch {}
            }
          }
        } catch {}
      })();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    const effectiveTheme = theme === 'dark' ? 'crimson' : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.classList.toggle('dark', effectiveTheme !== 'light' && effectiveTheme !== 'sand');
    window.dispatchEvent(new CustomEvent('xf-theme-change', { detail: { theme: effectiveTheme } }));
  }, [theme]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setAuthModalOpen(false); setSearchOpen(false); setDashboardOpen(false); setNotifOpen(false); setMobileMenuOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);


  const toggleTheme = useCallback(() => {
    const isDark = theme !== 'light' && theme !== 'sand';
    const next = isDark ? 'light' : 'crimson';
    setTheme(next);
    safeSetItem('x-foundry-theme', next);
  }, [theme]);

  const changeTheme = useCallback((newTheme: string) => {
    setTheme(newTheme);
    safeSetItem('x-foundry-theme', newTheme);
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
        // Cache for Edge fallback (cookies might not persist)
        try { sessionStorage.setItem('xfoundry_user', JSON.stringify(stripPiiForCache(data.user))); } catch {}
        setAuthModalOpen(false);
        setVerificationStep('idle');
        toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` });
        setLoginEmail(''); setLoginPassword('');
      } else if (res.status === 403 && data.needsVerification) {
        setVerificationEmail(data.email);
        setVerificationCode('');
        setVerificationStep('pending');
        if (data.emailSent === false) {
          // Email failed to send from login route — auto-trigger resend
          // so the user isn't stuck without a code.
          toast({ title: 'Sending verification code...', description: 'Please wait', variant: 'destructive' });
          try {
            const resendRes = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.email }) });
            if (resendRes.ok) { toast({ title: 'Code Sent!', description: 'A new verification code has been sent to your email.' }); }
            else { toast({ title: 'Verification Required', description: 'Please click Resend Code below.', variant: 'destructive' }); }
          } catch { toast({ title: 'Verification Required', description: 'Please click Resend Code below.', variant: 'destructive' }); }
        } else {
          toast({ title: 'Verification Required', description: data.error });
        }
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
          toast({ title: 'Account created!', description: `Welcome to XFoundry, ${data.user.name}` });
        }
        setSignupName(''); setSignupEmail(''); setSignupPassword(''); setSignupConfirmPassword(''); setSignupPhone(''); setSignupCompany('');
      } else { toast({ title: 'Signup Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setSignupLoading(false);
  }, [signupName, signupEmail, signupPassword, signupConfirmPassword, signupPhone, signupCompany, signupRole, toast]);

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {  }
    try { sessionStorage.removeItem('xfoundry_user'); } catch {}
    setUser(null);
    setDashboardOpen(false);
    setNotifOpen(false);
    setVerificationStep('idle');
    toast({ title: 'Logged out', description: 'See you soon!' });
    router.push('/auth');
  }, [toast, router]);

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

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount((data.notifications || []).filter((n: { read: boolean }) => !n.read).length);
      }
    } catch {  }
  }, []);

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
    minLoading,
    router,
    dashboardOpen, setDashboardOpen,
    notifications, setNotifications, unreadCount, setUnreadCount, notifOpen, setNotifOpen, loadNotifications,
    profileName, setProfileName, profileUsername, setProfileUsername, profilePhone, setProfilePhone, profileCompany, setProfileCompany,
    profileSaving, avatarUploading, handleAvatarUpload, handleAvatarUploaded, handleProfileSave,
    forgotStep, setForgotStep, forgotEmail, setForgotEmail, forgotLoading, handleForgotSubmit,
    resetCode, setResetCode, newPassword, setNewPassword, resetLoading, handleResetSubmit,
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
          toast({ title: 'Email Verified!', description: 'Your account is now active. Welcome to XFoundry!' });
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
