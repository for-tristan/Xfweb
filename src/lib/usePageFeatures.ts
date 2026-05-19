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
  const [signupPhone, setSignupPhone] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupRole, setSignupRole] = useState('student');
  const [signupLoading, setSignupLoading] = useState(false);

  // ── Search ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Theme ──
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('x-foundry-theme') || 'dark') as 'dark' | 'light';
  });

  // ── UI ──
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Dashboard / Profile Modal ──
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // ── Notifications ──
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; read: boolean; createdAt: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // ── Forgot Password ──
  const [forgotStep, setForgotStep] = useState<'idle' | 'email' | 'code'>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

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
        }
      } catch { /* not authed */ }
      setLoading(false);
    })();
  }, []);

  // Theme init
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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
      if (e.key === 'Escape') { setAuthModalOpen(false); setSearchOpen(false); setDashboardOpen(false); setNotifOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ═══════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('x-foundry-theme', next);
  }, [theme]);

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
        toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` });
        setLoginEmail(''); setLoginPassword('');
      } else { toast({ title: 'Login Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setLoginLoading(false);
  }, [loginEmail, loginPassword, toast]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) { toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' }); return; }
    if (signupPassword.length < 6) { toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword, phone: signupPhone || undefined, company: signupCompany || undefined, role: signupRole }) });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setProfileName(data.user.name || '');
        setProfileUsername(data.user.username || '');
        setProfilePhone(data.user.phone || '');
        setProfileCompany(data.user.company || '');
        setAuthModalOpen(false);
        toast({ title: 'Account created!', description: `Welcome to X.Foundry, ${data.user.name}` });
        setSignupName(''); setSignupEmail(''); setSignupPassword(''); setSignupPhone(''); setSignupCompany('');
      } else { toast({ title: 'Signup Failed', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }); }
    setSignupLoading(false);
  }, [signupName, signupEmail, signupPassword, signupPhone, signupCompany, signupRole, toast]);

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setUser(null);
    setDashboardOpen(false);
    setNotifOpen(false);
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
    if (pw.length >= 6) s++; if (pw.length >= 10) s++; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 2) return 'weak'; if (s <= 3) return 'medium'; return 'strong';
  };

  return {
    user, setUser,
    theme, toggleTheme,
    scrolled, mobileMenuOpen, setMobileMenuOpen,
    searchOpen, setSearchOpen, searchQuery, setSearchQuery, filteredSearch,
    authModalOpen, setAuthModalOpen, authTab, setAuthTab, authMessage, setAuthMessage,
    openAuthModal,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginLoading, handleLogin,
    signupName, setSignupName, signupEmail, setSignupEmail, signupPassword, setSignupPassword,
    signupPhone, setSignupPhone, signupCompany, setSignupCompany, signupRole, setSignupRole, signupLoading, handleSignup,
    handleLogout,
    getPasswordStrength,
    loading,
    router,
    // Dashboard
    dashboardOpen, setDashboardOpen,
    // Notifications
    notifications, setNotifications, unreadCount, setUnreadCount, notifOpen, setNotifOpen, loadNotifications,
    // Profile editing
    profileName, setProfileName, profileUsername, setProfileUsername, profilePhone, setProfilePhone, profileCompany, setProfileCompany,
    profileSaving, avatarUploading, handleAvatarUpload, handleProfileSave,
    // Forgot password
    forgotStep, setForgotStep, forgotEmail, setForgotEmail, forgotLoading, handleForgotSubmit,
    resetCode, setResetCode, newPassword, setNewPassword, resetLoading, handleResetSubmit,
  };
}
