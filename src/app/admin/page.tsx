'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePageFeatures } from '@/lib/usePageFeatures';
import ConfirmModal from '@/components/ConfirmModal';
import ReactMarkdown from 'react-markdown';
import { Navbar } from '@/components/Navbar';
import { SearchModal, AuthModal, AuthGate } from '@/lib/PageModals';
import { WaveInput } from '@/components/WaveInput';
import { WaveTextarea } from '@/components/WaveTextarea';
import GradualBlur from '@/components/GradualBlur';

// Extracted admin types + components (see src/components/admin/)
import type {
  AdminUser,
  AdminEnrollment,
  ProgressEntry,
  ServiceFeature,
  AdminService,
  AdminCourse,
  CourseModuleItem,
  AdminAnalytics,
  AdminQuote,
} from '@/components/admin/types';
import { UnlockStudentPanel } from '@/components/admin/UnlockStudentPanel';
import { SmartImage } from '@/components/SmartImage';
import { rafThrottle } from '@/lib/throttle';

// Legacy type aliases for backward compat with inline references in this file
type User = AdminUser;
type Enrollment = AdminEnrollment;

// All admin types (User, Enrollment, ProgressEntry, ServiceFeature,
// AdminService, AdminCourse, CourseModuleItem, AdminAnalytics, AdminQuote)
// are now imported from @/components/admin/types. See that file for the
// canonical definitions.

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; confirmLabel: string; danger: boolean; icon: string; onConfirm: () => void }>({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, icon: 'fa-solid fa-exclamation-triangle', onConfirm: () => {} });
  const openConfirm = (title: string, message: string, onConfirm: () => void, opts?: { confirmLabel?: string; danger?: boolean; icon?: string }) => {
    setConfirmModal({
      open: true, title, message,
      confirmLabel: opts?.confirmLabel || 'Confirm',
      danger: opts?.danger !== undefined ? opts.danger : true,
      icon: opts?.icon || 'fa-solid fa-exclamation-triangle',
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, open: false }));
      },
    });
  };
  const {
    user, loading, minLoading, theme, toggleTheme, changeTheme, scrollToSection,
    notifOpen, setNotifOpen, notifications, setNotifications, unreadCount, setUnreadCount, loadNotifications,
    mobileMenuOpen, setMobileMenuOpen, searchOpen, setSearchOpen, searchQuery, setSearchQuery, filteredSearch,
    scrolled, openAuthModal, dashboardOpen, setDashboardOpen, router: featureRouter,
  } = usePageFeatures();
  const adminCheckedRef = useRef(false);
  useEffect(() => {
    if (loading || adminCheckedRef.current) return;
    adminCheckedRef.current = true;
    if (!user || user.role !== 'admin') {
      router.push('/');
      toast({ title: 'Access Denied', description: 'Admin access required', variant: 'destructive' });
    }
  }, [loading, user]);
  const [tab, setTab] = useState<'enrollments' | 'users' | 'progress' | 'modules' | 'quotes' | 'team' | 'services' | 'courses' | 'tests' | 'projects' | 'analytics'>('enrollments');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [studentProgress, setStudentProgress] = useState<ProgressEntry[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [editModules, setEditModules] = useState<number[]>([]);
  const [progressSaving, setProgressSaving] = useState(false);

  const moduleCounts: Record<string, number> = {};


  const [adminModules, setAdminModules] = useState<CourseModuleItem[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesCourseFilter, setModulesCourseFilter] = useState('all');
  const [seedLoading, setSeedLoading] = useState(false);
  const [allModules, setAllModules] = useState<CourseModuleItem[]>([]);

  const [adminQuotes, setAdminQuotes] = useState<AdminQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quoteFilter, setQuoteFilter] = useState('all');
  const [quoteActionLoading, setQuoteActionLoading] = useState<string | null>(null);
  const fetchQuotes = useCallback(async () => {
    setQuotesLoading(true);
    try { const r = await fetch('/api/admin/quotes'); if (r.ok) { const d = await r.json(); setAdminQuotes(d.quotes || []); } } catch {}
    setQuotesLoading(false);
  }, []);
  const updateQuoteStatus = async (id: string, status: string) => {
    setQuoteActionLoading(id);
    try {
      const r = await fetch('/api/admin/quotes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      if (r.ok) { fetchQuotes(); } else { toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Failed to update quote status.', variant: 'destructive' }); }
    setQuoteActionLoading(null);
  };

  interface TeamMember { id: string; name: string; role: string; bio: string; avatar: string; icon: string; linkedinUrl: string; githubUrl: string; displayOrder: number; createdAt: string; updatedAt: string; }
  const [adminTeam, setAdminTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', role: '', bio: '', avatar: '', icon: 'fa-solid fa-user-tie', linkedinUrl: '', githubUrl: '', displayOrder: 1 });
  const fetchTeam = useCallback(async () => {
    setTeamLoading(true);
    try { const r = await fetch('/api/admin/team'); if (r.ok) { const d = await r.json(); setAdminTeam(d.members || []); } } catch {}
    setTeamLoading(false);
  }, []);
  const openNewTeamForm = () => { setEditingTeamMember(null); setTeamForm({ name: '', role: '', bio: '', avatar: '', icon: 'fa-solid fa-user-tie', linkedinUrl: '', githubUrl: '', displayOrder: adminTeam.length + 1 }); setShowTeamForm(true); };
  const openEditTeamForm = (m: TeamMember) => { setEditingTeamMember(m); setTeamForm({ name: m.name, role: m.role, bio: m.bio, avatar: m.avatar, icon: m.icon, linkedinUrl: m.linkedinUrl, githubUrl: m.githubUrl, displayOrder: m.displayOrder }); setShowTeamForm(true); };
  const handleSaveTeamMember = async () => {
    if (!teamForm.name || !teamForm.role) { toast({ title: 'Validation Error', description: 'Name and role are required', variant: 'destructive' }); return; }
    setTeamSaving(true);
    try {
      const r = await fetch('/api/admin/team', { method: editingTeamMember ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingTeamMember ? { ...teamForm, id: editingTeamMember.id } : teamForm) });
      if (r.ok) { fetchTeam(); setShowTeamForm(false); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setTeamSaving(false);
  };
  const handleDeleteTeamMember = (id: string) => {
    openConfirm('Delete Team Member', 'Are you sure you want to remove this team member? This action cannot be undone.', async () => {
      try { const r = await fetch('/api/admin/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); if (r.ok) fetchTeam(); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const [unlockLoading, setUnlockLoading] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    const checkBottom = rafThrottle(() => setAtBottom(window.innerHeight + window.scrollY >= document.body.scrollHeight - 80));
    window.addEventListener('scroll', checkBottom);
    checkBottom();

    return () => { observer.disconnect(); window.removeEventListener('scroll', checkBottom); };
  }, [loading]);


  const fetchEnrollments = useCallback(async (status?: string) => {
    try { const p = status && status !== 'all' ? `?status=${status}` : ''; const r = await fetch(`/api/admin/enrollments${p}`); if (r.ok) setEnrollments((await r.json()).enrollments); } catch {}
  }, []);
  const fetchUsers = useCallback(async () => {
    try { const r = await fetch('/api/admin/users'); if (r.ok) setUsers((await r.json()).users); } catch {}
  }, []);
  const fetchProgress = useCallback(async () => {
    setProgressLoading(true);
    try { const r = await fetch('/api/admin/progress'); if (r.ok) setStudentProgress((await r.json()).progress); } catch {}
    setProgressLoading(false);
  }, []);
  const fetchModules = useCallback(async (courseId?: string) => {
    setModulesLoading(true);
    try {
      const q = courseId && courseId !== 'all' ? `?courseId=${courseId}` : '';
      const r = await fetch(`/api/admin/modules${q}`);
      if (r.ok) {
        const data = (await r.json()).modules;
        setAdminModules(data);
        if (!courseId || courseId === 'all') {
          setAllModules(data);
        } else {
          fetch('/api/admin/modules').then(ar => ar.ok ? ar.json().then(ad => setAllModules(ad.modules)) : null).catch(() => {});
        }
      }
    } catch {}
    setModulesLoading(false);
  }, []);
  const handleSeedModules = async () => {
    setSeedLoading(true);
    try { const r = await fetch('/api/admin/modules/seed', { method: 'POST' }); const d = await r.json(); if (r.ok) { toast({ title: 'Modules Seeded', description: `${d.created} new, ${d.skipped} skipped` }); fetchModules(modulesCourseFilter); } else toast({ title: 'Error', description: d.error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setSeedLoading(false);
  };
  const handleUnlock = async (userId: string, moduleId: string) => {
    const key = `${userId}-${moduleId}`;
    setUnlockLoading(key);
    try { const r = await fetch('/api/admin/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, moduleId }) }); if (r.ok) fetchModules(modulesCourseFilter); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setUnlockLoading(null);
  };
  const handleUnlockAll = async (userId: string, courseId: string) => {
    setUnlockLoading(`${userId}-all`);
    try { const r = await fetch('/api/admin/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, courseId, unlockAll: true }) }); if (r.ok) { const d = await r.json(); toast({ title: 'Modules Unlocked', description: `${d.created} modules unlocked` }); fetchModules(modulesCourseFilter); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setUnlockLoading(null);
  };
  const handleLock = async (userId: string, moduleId: string) => {
    const key = `${userId}-${moduleId}`;
    setUnlockLoading(key);
    try { const r = await fetch('/api/admin/modules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, moduleId }) }); if (r.ok) fetchModules(modulesCourseFilter); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setUnlockLoading(null);
  };
  const handleEditProgress = (p: ProgressEntry) => {
    setEditingProgress(p.id);
    setEditModules([...p.completedModules]);
  };
  const handleSaveProgress = async (p: ProgressEntry) => {
    setProgressSaving(true);
    try {
      const r = await fetch('/api/admin/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: p.userId,
          courseId: p.courseId,
          courseName: p.courseName,
          completedModules: editModules,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setStudentProgress(prev => prev.map(sp => sp.id === p.id ? { ...sp, completedModules: data.progress.completedModules, completionPercentage: data.progress.completionPercentage } : sp));
        setEditingProgress(null);
        setEditModules([]);
      } else {
        toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', description: 'Failed to save progress.', variant: 'destructive' }); }
    setProgressSaving(false);
  };
  const handleToggleModule = (moduleNum: number) => {
    setEditModules(prev => prev.includes(moduleNum) ? prev.filter(m => m !== moduleNum) : [...prev, moduleNum].sort((a, b) => a - b));
  };
  const handleResetProgress = (p: ProgressEntry) => {
    openConfirm('Reset Progress', `Are you sure you want to reset ${p.user.name}'s progress for ${p.courseName}? This action cannot be undone.`, async () => {
      setProgressSaving(true);
      try {
        const r = await fetch('/api/admin/progress', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: p.userId, courseId: p.courseId }),
        });
        if (r.ok) {
          setStudentProgress(prev => prev.map(sp => sp.id === p.id ? { ...sp, completedModules: [], completionPercentage: 0 } : sp));
        } else {
          toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
        }
      } catch { toast({ title: 'Error', description: 'Failed to reset progress.', variant: 'destructive' }); }
      setProgressSaving(false);
    }, { confirmLabel: 'Reset', danger: true, icon: 'fa-solid fa-undo' });
  };

  const [certSending, setCertSending] = useState<string | null>(null);
  const handleSendCertificate = (p: ProgressEntry) => {
    if (p.completionPercentage !== 100) {
      toast({ title: 'Validation Error', description: 'Certificate can only be sent when progress is at 100%', variant: 'destructive' });
      return;
    }
    openConfirm('Send Certificate', `Send certificate to ${p.user.name} (${p.user.email}) for ${p.courseName}?`, async () => {
      setCertSending(p.id);
      try {
        const r = await fetch('/api/admin/certificate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: p.userId, courseId: p.courseId }),
        });
        const d = await r.json();
        if (r.ok) {
          toast({ title: 'Certificate Sent', description: `${d.message}. Certificate ID: ${d.certificateId}` });
        } else {
          toast({ title: 'Error', description: d.error, variant: 'destructive' });
        }
      } catch { toast({ title: 'Error', description: 'Failed to send certificate.', variant: 'destructive' }); }
      setCertSending(null);
    }, { confirmLabel: 'Send', danger: false, icon: 'fa-solid fa-certificate' });
  };

  interface ModuleStudyEntry {
    moduleId: string;
    moduleTitle: string;
    moduleOrder: number;
    timeSpent: number;
    studied: boolean;
    lastStudied: string;
  }
  const [studyData, setStudyData] = useState<Record<string, ModuleStudyEntry[]>>({});
  const [studyLoading, setStudyLoading] = useState<string | null>(null);

  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [serviceForm, setServiceForm] = useState({ title: '', slug: '', description: '', icon: 'fa-solid fa-cog', status: 'active' as string, displayOrder: 0 });
  const [serviceFeatures, setServiceFeatures] = useState<ServiceFeature[]>([]);
  const [newServiceFeature, setNewServiceFeature] = useState<ServiceFeature>({ title: '', description: '', icon: 'fa-solid fa-check' });
  const [serviceSaving, setServiceSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    try { const r = await fetch('/api/admin/services'); if (r.ok) setServices((await r.json()).services); } catch {}
    setServicesLoading(false);
  }, []);

  const openNewServiceForm = () => {
    setEditingService(null);
    setServiceForm({ title: '', slug: '', description: '', icon: 'fa-solid fa-cog', status: 'active', displayOrder: services.length });
    setServiceFeatures([]);
    setNewServiceFeature({ title: '', description: '', icon: 'fa-solid fa-check' });
    setShowServiceForm(true);
  };

  const openEditServiceForm = (s: AdminService) => {
    setEditingService(s);
    setServiceForm({ title: s.title, slug: s.slug, description: s.description, icon: s.icon, status: s.status, displayOrder: s.displayOrder });
    setServiceFeatures([...s.features]);
    setNewServiceFeature({ title: '', description: '', icon: 'fa-solid fa-check' });
    setShowServiceForm(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.title.trim()) { toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' }); return; }
    setServiceSaving(true);
    try {
      const body = { ...serviceForm, slug: serviceForm.slug || serviceForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), features: serviceFeatures };
      const r = await fetch('/api/admin/services', { method: editingService ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingService ? { ...body, id: editingService.id } : body) });
      if (r.ok) { fetchServices(); setShowServiceForm(false); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save service.', variant: 'destructive' }); }
    setServiceSaving(false);
  };

  const handleToggleServiceStatus = async (s: AdminService) => {
    setActionLoading(s.id);
    const newStatus = s.status === 'active' ? 'hidden' : 'active';
    try { const r = await fetch('/api/admin/services', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, status: newStatus }) }); if (r.ok) fetchServices(); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setActionLoading(null);
  };

  const handleDeleteService = (s: AdminService) => {
    openConfirm('Delete Service', `Are you sure you want to delete service "${s.title}"? This action cannot be undone.`, async () => {
      setActionLoading(s.id);
      try { const r = await fetch('/api/admin/services', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id }) }); if (r.ok) fetchServices(); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleServiceTitleChange = (title: string) => {
    setServiceForm(f => ({ ...f, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
  };

  const addServiceFeature = () => {
    if (!newServiceFeature.title.trim()) return;
    setServiceFeatures(prev => [...prev, { ...newServiceFeature }]);
    setNewServiceFeature({ title: '', description: '', icon: 'fa-solid fa-check' });
  };

  const removeServiceFeature = (idx: number) => {
    setServiceFeatures(prev => prev.filter((_, i) => i !== idx));
  };

  interface AdminProject {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    tags: string;
    icon: string;
    imageUrl: string;
    projectUrl: string;
    status: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
  }
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: '', slug: '', description: '', category: 'web',
    tags: '', icon: 'fa-solid fa-code', imageUrl: '', projectUrl: '',
    status: 'active' as string, displayOrder: 0,
  });
  const [projectSaving, setProjectSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try { const r = await fetch('/api/admin/projects'); if (r.ok) setAdminProjects((await r.json()).projects); } catch {}
    setProjectsLoading(false);
  }, []);

  const openNewProjectForm = () => {
    setEditingProject(null);
    setProjectForm({ title: '', slug: '', description: '', category: 'web', tags: '', icon: 'fa-solid fa-code', imageUrl: '', projectUrl: '', status: 'active', displayOrder: adminProjects.length });
    setShowProjectForm(true);
  };

  const openEditProjectForm = (p: AdminProject) => {
    setEditingProject(p);
    setProjectForm({
      title: p.title, slug: p.slug, description: p.description,
      category: p.category, tags: Array.isArray(p.tags) ? (p.tags as unknown as string[]).join(', ') : p.tags,
      icon: p.icon, imageUrl: p.imageUrl, projectUrl: p.projectUrl,
      status: p.status, displayOrder: p.displayOrder,
    });
    setShowProjectForm(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.title.trim()) { toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' }); return; }
    setProjectSaving(true);
    try {
      const tagsArr = projectForm.tags
        ? JSON.stringify(projectForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean))
        : '[]';
      const body = {
        ...projectForm,
        slug: projectForm.slug || projectForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        tags: tagsArr,
      };
      const r = await fetch('/api/admin/projects', {
        method: editingProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProject ? { ...body, id: editingProject.id } : body),
      });
      if (r.ok) { fetchProjects(); setShowProjectForm(false); toast({ title: editingProject ? 'Project Updated' : 'Project Created' }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save project.', variant: 'destructive' }); }
    setProjectSaving(false);
  };

  const handleToggleProjectStatus = async (p: AdminProject) => {
    setActionLoading(p.id);
    const newStatus = p.status === 'active' ? 'hidden' : 'active';
    try {
      const r = await fetch('/api/admin/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, status: newStatus }) });
      if (r.ok) fetchProjects(); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    setActionLoading(null);
  };

  const handleDeleteProject = (p: AdminProject) => {
    openConfirm('Delete Project', `Are you sure you want to delete project "${p.title}"? This action cannot be undone.`, async () => {
      setActionLoading(p.id);
      try { const r = await fetch('/api/admin/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) }); if (r.ok) fetchProjects(); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleProjectTitleChange = (title: string) => {
    setProjectForm(f => ({ ...f, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
  };

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [courseForm, setCourseForm] = useState({ title: '', slug: '', description: '', level: 'beginner', duration: '', price: '', icon: 'fa-solid fa-book', status: 'active' as string, features: [] as string[], prerequisites: '', techStack: '' });
  const [courseFeatureInput, setCourseFeatureInput] = useState('');
  const [courseSaving, setCourseSaving] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [courseModules, setCourseModules] = useState<CourseModuleItem[]>([]);
  const [courseModulesLoading, setCourseModulesLoading] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', content: '', moduleOrder: 1 });
  const [modulePreviewOpen, setModulePreviewOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModuleItem | null>(null);
  const [moduleSaving, setModuleSaving] = useState(false);

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try { const r = await fetch('/api/admin/courses'); if (r.ok) setCourses((await r.json()).courses); } catch {}
    setCoursesLoading(false);
  }, []);

  const fetchCourseModules = useCallback(async (courseId: string) => {
    setCourseModulesLoading(true);
    try { const r = await fetch(`/api/admin/modules?courseId=${courseId}`); if (r.ok) { const d = await r.json(); setCourseModules(d.modules || []); } } catch {}
    setCourseModulesLoading(false);
  }, []);

  const openNewCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({ title: '', slug: '', description: '', level: 'beginner', duration: '', price: '', icon: 'fa-solid fa-book', status: 'active', features: [], prerequisites: '', techStack: '' });
    setCourseFeatureInput('');
    setShowCourseForm(true);
  };

  const openEditCourseForm = (c: AdminCourse) => {
    setEditingCourse(c);
    setCourseForm({ title: c.title, slug: c.slug, description: c.description, level: c.level, duration: c.duration, price: c.price, icon: c.icon, status: c.status, features: [...c.features], prerequisites: c.prerequisites || '', techStack: c.techStack || '' });
    setCourseFeatureInput('');
    setShowCourseForm(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title.trim()) { toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' }); return; }
    setCourseSaving(true);
    try {
      const body = { ...courseForm, slug: courseForm.slug || courseForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') };
      const r = await fetch('/api/admin/courses', { method: editingCourse ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingCourse ? { ...body, id: editingCourse.id } : body) });
      if (r.ok) { fetchCourses(); setShowCourseForm(false); } else { const d = await r.json(); toast({ title: 'Error', description: `${d.error}${d.details ? '. ' + d.details : ''}`, variant: 'destructive' }); }
    } catch (e) { toast({ title: 'Error', description: 'Failed to save course.', variant: 'destructive' }); }
    setCourseSaving(false);
  };

  const handleToggleCourseStatus = async (c: AdminCourse) => {
    setActionLoading(c.id);
    const newStatus = c.status === 'active' ? 'hidden' : 'active';
    try { const r = await fetch('/api/admin/courses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, status: newStatus }) }); if (r.ok) fetchCourses(); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setActionLoading(null);
  };

  const handleDeleteCourse = (c: AdminCourse) => {
    openConfirm('Delete Course', `Are you sure you want to delete course "${c.title}"? All modules for this course will also be deleted. Existing enrollments won't cascade, but student access to course content will be affected.`, async () => {
      setActionLoading(c.id);
      try { const r = await fetch('/api/admin/courses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) }); if (r.ok) { fetchCourses(); if (expandedCourseId === c.id) { setExpandedCourseId(null); setCourseModules([]); } } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleCourseTitleChange = (title: string) => {
    setCourseForm(f => ({ ...f, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
  };

  const addCourseFeature = () => {
    const trimmed = courseFeatureInput.trim();
    if (!trimmed) return;
    setCourseForm(f => ({ ...f, features: [...f.features, trimmed] }));
    setCourseFeatureInput('');
  };

  const removeCourseFeature = (idx: number) => {
    setCourseForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  const toggleCourseModules = async (courseId: string) => {
    if (expandedCourseId === courseId) { setExpandedCourseId(null); setCourseModules([]); return; }
    setExpandedCourseId(courseId);
    fetchCourseModules(courseId);
  };

  const openNewModuleForm = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '', content: '', moduleOrder: courseModules.length + 1 });
    setShowModuleForm(true);
  };

  const openEditModuleForm = (m: CourseModuleItem) => {
    setEditingModule(m);
    setModuleForm({ title: m.title, description: m.description, content: m.content, moduleOrder: m.moduleOrder });
    setShowModuleForm(true);
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) { toast({ title: 'Validation Error', description: 'Module title is required', variant: 'destructive' }); return; }
    if (!expandedCourseId) return;
    setModuleSaving(true);
    try {
      const body = { ...moduleForm, courseId: expandedCourseId };
      const r = await fetch('/api/admin/modules', { method: editingModule ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingModule ? { ...body, id: editingModule.id } : body) });
      if (r.ok) { fetchCourseModules(expandedCourseId); fetchCourses(); setShowModuleForm(false); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save module.', variant: 'destructive' }); }
    setModuleSaving(false);
  };

  const handleDeleteModule = (m: CourseModuleItem) => {
    openConfirm('Delete Module', `Are you sure you want to delete module "${m.title}"? This action cannot be undone.`, async () => {
      setActionLoading(m.id);
      try { const r = await fetch('/api/admin/modules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId: m.id }) }); if (r.ok) { fetchCourseModules(expandedCourseId!); fetchCourses(); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  interface AdminTest { id: string; moduleId: string; title: string; description: string; timeLimit: number; passingScore: number; questionCount: number; attemptCount: number; moduleTitle: string; createdAt: string; }
  interface AdminTestFull { id: string; moduleId: string; title: string; description: string; timeLimit: number; passingScore: number; createdAt: string; updatedAt: string; module: { id: string; title: string; courseId: string }; questions: { id: string; questionText: string; questionType: string; options: string; correctAnswer: number; points: number; questionOrder: number; createdAt: string }[]; attempts: { id: string; userId: string; score: number; totalPoints: number; passed: boolean; startedAt: string; submittedAt: string | null; createdAt: string; user: { id: string; name: string; email: string; avatar: string | null } }[]; unlocks: { id: string; userId: string; unlockedBy: string; createdAt: string; user: { id: string; name: string; email: string } }[]; }
  const [adminTests, setAdminTests] = useState<AdminTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsSaving, setTestsSaving] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<AdminTestFull | null>(null);
  const [testEnrolledStudents, setTestEnrolledStudents] = useState<{ user: { id: string; name: string; email: string; avatar: string | null } }[]>([]);
  const [testActionLoading, setTestActionLoading] = useState<string | null>(null);
  const [showTestForm, setShowTestForm] = useState(false);
  const [testForm, setTestForm] = useState({ moduleId: '', title: '', description: '', timeLimit: 30, passingScore: 70 });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 });
  const fetchTests = useCallback(async () => {
    setTestsLoading(true);
    try { const r = await fetch('/api/admin/tests'); if (r.ok) setAdminTests((await r.json()).tests); } catch {}
    setTestsLoading(false);
  }, []);
  const fetchTestDetail = async (testId: string) => {
    setSelectedTestId(testId);
    setSelectedTest(null);
    setTestEnrolledStudents([]);
    try {
      const r = await fetch(`/api/admin/tests?testId=${testId}`);
      if (r.ok) {
        const d = await r.json();
        setSelectedTest(d.test);
        setTestEnrolledStudents(d.enrolledStudents || []);
      } else { const d = await r.json(); toast({ title: 'Error', description: `${d.error}${d.details ? '. ' + d.details : ''}`, variant: 'destructive' }); }
    } catch (e) { toast({ title: 'Error', description: 'Failed to load test details.', variant: 'destructive' }); }
  };
  const handleCreateTest = async () => {
    if (!testForm.moduleId || !testForm.title.trim()) { toast({ title: 'Validation Error', description: 'Module and title are required', variant: 'destructive' }); return; }
    setTestsSaving(true);
    try {
      const r = await fetch('/api/admin/tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testForm) });
      if (r.ok) { fetchTests(); setShowTestForm(false); setTestForm({ moduleId: '', title: '', description: '', timeLimit: 30, passingScore: 70 }); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setTestsSaving(false);
  };
  const handleAddQuestion = async () => {
    if (!selectedTestId || !questionForm.questionText.trim()) { toast({ title: 'Validation Error', description: 'Question text is required', variant: 'destructive' }); return; }
    const validOptions = questionForm.options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) { toast({ title: 'Validation Error', description: 'At least 2 options are required', variant: 'destructive' }); return; }
    setTestsSaving(true);
    try {
      const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addQuestion', testId: selectedTestId, questionText: questionForm.questionText, options: validOptions, correctAnswer: questionForm.correctAnswer, points: questionForm.points }) });
      if (r.ok) { fetchTestDetail(selectedTestId); fetchTests(); setShowQuestionForm(false); setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setTestsSaving(false);
  };
  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedTestId) return;
    openConfirm('Delete Question', 'Are you sure you want to delete this question? This action cannot be undone.', async () => {
      setTestActionLoading(questionId);
      try {
        const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteQuestion', testId: selectedTestId, questionId }) });
        if (r.ok) { fetchTestDetail(selectedTestId); fetchTests(); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setTestActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };
  const handleResetAttempt = (testId: string, userId: string, userName: string) => {
    openConfirm('Reset Attempt', `Are you sure you want to reset ${userName}'s attempt? They will be able to retake the test.`, async () => {
      setTestActionLoading(`reset-${userId}`);
      try {
        const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resetAttempt', testId, userId }) });
        if (r.ok) { if (selectedTestId === testId) fetchTestDetail(testId); fetchTests(); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setTestActionLoading(null);
    }, { confirmLabel: 'Reset', danger: true, icon: 'fa-solid fa-undo' });
  };
  const handleDeleteTest = (testId: string) => {
    openConfirm('Delete Test', 'Are you sure you want to delete this test and all its questions, attempts, and unlocks? This action cannot be undone.', async () => {
      setTestActionLoading(testId);
      try {
        const r = await fetch('/api/admin/tests', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: testId }) });
        if (r.ok) { fetchTests(); if (selectedTestId === testId) { setSelectedTestId(null); setSelectedTest(null); } } else { const d = await r.json(); toast({ title: 'Error', description: `${d.error}${d.details ? '. ' + d.details : ''}`, variant: 'destructive' }); }
      } catch (e) { toast({ title: 'Error', description: 'Failed to delete test.', variant: 'destructive' }); }
      setTestActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };
  const handleUnlockTest = async (testId: string, userId: string) => {
    setTestActionLoading(`unlock-${userId}`);
    try {
      const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unlock', testId, userId }) });
      if (r.ok) { await fetchTestDetail(testId); toast({ title: 'Test Unlocked', description: 'Student can now access this test.' }); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to unlock test', variant: 'destructive' }); }
    setTestActionLoading(null);
  };
  const handleLockTest = (testId: string, userId: string, userName: string) => {
    openConfirm('Lock Test', `Lock test for ${userName}? They will no longer be able to access it.`, async () => {
      setTestActionLoading(`lock-${userId}`);
      try {
        const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lock', testId, userId }) });
        if (r.ok) { await fetchTestDetail(testId); toast({ title: 'Test Locked', description: 'Student access revoked and in-progress attempts removed.' }); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Failed to lock test.', variant: 'destructive' }); }
      setTestActionLoading(null);
    }, { confirmLabel: 'Lock', danger: true, icon: 'fa-solid fa-lock' });
  };
  const addQuestionOption = () => setQuestionForm(f => ({ ...f, options: [...f.options, ''] }));
  const removeQuestionOption = (idx: number) => setQuestionForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx), correctAnswer: f.correctAnswer >= f.options.length - 1 ? 0 : f.correctAnswer }));
  const updateQuestionOption = (idx: number, val: string) => setQuestionForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? val : o) }));

  const fetchStudyData = async (userId: string, courseId: string) => {
    const key = `${userId}-${courseId}`;
    setStudyLoading(key);
    try {
      const r = await fetch(`/api/admin/progress?userId=${userId}&courseId=${courseId}&includeStudy=true`);
      if (r.ok) {
        const d = await r.json();
        if (d.moduleStudies) {
          setStudyData(prev => ({ ...prev, [key]: d.moduleStudies }));
        }
      }
    } catch {}
    setStudyLoading(null);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  useEffect(() => { if (user?.role === 'admin') { fetchEnrollments(statusFilter); fetchUsers(); loadNotifications(); fetchCourses(); } }, [user, statusFilter, fetchEnrollments, fetchUsers, loadNotifications, fetchCourses]);

  const handleStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try { const r = await fetch('/api/admin/enrollments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId: id, status }) }); if (r.ok) fetchEnrollments(statusFilter); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setActionLoading(null);
  };

  const handleRemove = (id: string) => {
    openConfirm('Remove Enrollment', 'Are you sure you want to permanently remove this enrollment? This action cannot be undone.', async () => {
      setActionLoading(id);
      try { const r = await fetch('/api/admin/enrollments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId: id }) }); if (r.ok) fetchEnrollments(statusFilter); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Remove', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    const roleLabels: Record<string, string> = { admin: 'admin', instructor: 'instructor', student: 'student' };
    const action = `change this user's role to ${roleLabels[newRole] || newRole}`;
    openConfirm('Change Role', `Are you sure you want to ${action}?`, async () => {
      setActionLoading(userId);
      try { const r = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role: newRole }) }); if (r.ok) fetchUsers(); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Change Role', danger: false, icon: 'fa-solid fa-user-shield' });
  };

  const handleDeleteUser = (userId: string) => {
    openConfirm('Delete User', 'Are you sure you want to permanently delete this user? This will also delete all their enrollments and quote requests. This action cannot be undone.', async () => {
      setActionLoading(userId);
      try { const r = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) }); if (r.ok) fetchUsers(); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-user-times' });
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast({ title: 'See you soon!', description: 'You have been logged out.' });
    router.push('/');
  };
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const pendingCount = enrollments.filter(e => e.status === 'pending').length;
  const approvedCount = enrollments.filter(e => e.status === 'approved').length;
  const declinedCount = enrollments.filter(e => e.status === 'declined').length;

  if (loading || minLoading) return (
    <>
      <div className="xf-loader"><div className="xf-loader-dot" /><div className="xf-loader-dot" /><div className="xf-loader-dot" /></div>
    </>
  );
  if (!user || user.role !== 'admin') return null;

  const statusBadge = (s: string) => {
    const m: Record<string, { bg: string; color: string; border: string }> = {
      pending: { bg: 'rgba(234,179,8,0.12)', color: 'var(--warning-color)', border: '1px solid rgba(234,179,8,0.25)' },
      approved: { bg: 'rgba(34,197,94,0.12)', color: 'var(--success-color)', border: '1px solid rgba(34,197,94,0.25)' },
      declined: { bg: 'rgba(239,68,68,0.12)', color: 'var(--error-color)', border: '1px solid rgba(239,68,68,0.25)' },
    };
    return m[s] || m.pending;
  };

  const progressColor = (pct: number) => {
    if (pct > 75) return { bar: 'var(--success-color)', bg: 'rgba(34,197,94,0.12)', text: 'var(--success-color)', label: 'On Track' };
    if (pct >= 50) return { bar: 'var(--warning-color)', bg: 'rgba(234,179,8,0.12)', text: 'var(--warning-color)', label: 'In Progress' };
    return { bar: 'var(--error-color)', bg: 'rgba(239,68,68,0.12)', text: 'var(--error-color)', label: 'Needs Attention' };
  };

  return (
    <>

      <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--text-light)', fontFamily: "var(--font-body)", fontWeight: 400 }}>
        <Navbar activePage="admin" scrolled={true} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />
        <section className="section" style={{ paddingTop: 100, paddingBottom: 60 }}>
          <div className="section-header reveal">
            <span className="section-tag"></span>
            <h2 className="section-title">Platform <span className="v-highlight">Statistics</span></h2>
            <div className="section-divider"></div>
          </div>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { label: 'Total Users', val: users.length, color: 'var(--accent)', icon: 'fa-users', num: '01' },
              { label: 'Pending', val: pendingCount, color: 'var(--warning-color)', icon: 'fa-clock', num: '02' },
              { label: 'Approved', val: approvedCount, color: 'var(--success-color)', icon: 'fa-check-circle', num: '03' },
              { label: 'Declined', val: declinedCount, color: 'var(--error-color)', icon: 'fa-times-circle', num: '04' },
            ].map((s, i) => (
              <div key={s.label} className={`service-card reveal reveal-delay-${i + 1}`}>
                <span className="service-number" style={{ color: s.color }}>{s.num}</span>
                <i className={`fas ${s.icon} service-icon`} style={{ color: s.color }}></i>
                <h3>{s.label}</h3>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 44, fontWeight: 700, color: s.color, marginTop: 12 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="section" style={{ paddingTop: 48, paddingBottom: 60 }}>

          <div className="projects-filter reveal" style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 56 }}>
            <button className={`filter-btn${tab === 'enrollments' ? ' active' : ''}`} onClick={() => setTab('enrollments')}>
              <i className="fa-solid fa-user-graduate" style={{ marginRight: 8 }}></i>Enrollments{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
            <button className={`filter-btn${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
              <i className="fa-solid fa-database" style={{ marginRight: 8 }}></i>Users Database
            </button>
            <button className={`filter-btn${tab === 'progress' ? ' active' : ''}`} onClick={() => { setTab('progress'); fetchProgress(); }}>
              <i className="fa-solid fa-tasks" style={{ marginRight: 8 }}></i>Student Progress
            </button>
            <button className={`filter-btn${tab === 'modules' ? ' active' : ''}`} onClick={() => { setTab('modules'); fetchModules(modulesCourseFilter); }}>
              <i className="fa-solid fa-key" style={{ marginRight: 8 }}></i>Modules
            </button>
            <button className={`filter-btn${tab === 'quotes' ? ' active' : ''}`} onClick={() => { setTab('quotes'); fetchQuotes(); }}>
              <i className="fa-solid fa-envelope-open-text" style={{ marginRight: 8 }}></i>Quotes{adminQuotes.filter(q => q.status === 'pending').length > 0 ? ` (${adminQuotes.filter(q => q.status === 'pending').length})` : ''}
            </button>
            <button className={`filter-btn${tab === 'team' ? ' active' : ''}`} onClick={() => { setTab('team'); fetchTeam(); }}>
              <i className="fa-solid fa-users" style={{ marginRight: 8 }}></i>Team
            </button>
            <button className={`filter-btn${tab === 'services' ? ' active' : ''}`} onClick={() => { setTab('services'); fetchServices(); }}>
              <i className="fa-solid fa-concierge-bell" style={{ marginRight: 8 }}></i>Services
            </button>
            <button className={`filter-btn${tab === 'projects' ? ' active' : ''}`} onClick={() => { setTab('projects'); fetchProjects(); }}>
              <i className="fa-solid fa-folder-open" style={{ marginRight: 8 }}></i>Projects
            </button>
            <button className={`filter-btn${tab === 'courses' ? ' active' : ''}`} onClick={() => { setTab('courses'); fetchCourses(); }}>
              <i className="fa-solid fa-graduation-cap" style={{ marginRight: 8 }}></i>Courses
            </button>
            <button className={`filter-btn${tab === 'tests' ? ' active' : ''}`} onClick={() => { setTab('tests'); fetchTests(); }}>
              <i className="fa-solid fa-file-alt" style={{ marginRight: 8 }}></i>Tests
            </button>
            <button className={`filter-btn${tab === 'analytics' ? ' active' : ''}`} onClick={() => { setTab('analytics'); if (!analytics) { fetch('/api/admin/analytics').then(r => r.json()).then(d => setAnalytics(d)).catch(() => {}); } }}>
              <i className="fa-solid fa-chart-bar" style={{ marginRight: 8 }}></i>Analytics
            </button>
          </div>
          {tab === 'enrollments' && (
            <>
              <div className="projects-filter reveal" style={{ justifyContent: 'center', marginBottom: 48 }}>
                {['all', 'pending', 'approved', 'declined'].map(s => (
                  <button key={s} className={`filter-btn${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>

              {enrollments.length === 0 ? (
                <div className="reveal" style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fa-solid fa-inbox" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Requests Found</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>{statusFilter !== 'all' ? 'Try changing the filter.' : 'Requests will appear here when users apply.'}</p>
                </div>
              ) : (
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {enrollments.map((e, idx) => {
                    const sb = statusBadge(e.status);
                    return (
                      <div key={e.id} className="project-card reveal" style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: e.user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 16, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                              {e.user.avatar
                                ? <SmartImage src={e.user.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : e.user.name.charAt(0).toUpperCase()
                              }
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 4 }}>{e.user.name}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{e.user.email}</div>
                              {e.user.phone && (
                                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>
                                  <i className="fa-solid fa-phone" style={{ fontSize: 10, marginRight: 4 }}></i>{e.user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                            <span style={{ padding: '5px 18px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: sb.bg, color: sb.color, border: sb.border }}>{e.status}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 150, textAlign: 'right' }}>{fmt(e.enrolledAt)}</span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20, paddingLeft: 64 }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Course</div>
                            <div style={{ fontSize: 14, color: 'var(--text-light)', fontWeight: 700 }}>{e.courseName}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Experience</div>
                            <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{e.experienceLevel || e.courseLevel}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Duration</div>
                            <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{e.duration}</div>
                          </div>
                          {e.motivation && (
                            <div style={{ flex: '1 1 100%' }}>
                              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Motivation</div>
                              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 500 }}>{e.motivation}</div>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 12, paddingLeft: 64, paddingTop: 16, borderTop: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)' }}>
                          {e.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatus(e.id, 'approved')} disabled={actionLoading === e.id} className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 11 }}>
                                <i className={actionLoading === e.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'} style={{ marginRight: 6 }}></i>Accept
                              </button>
                              <button onClick={() => handleStatus(e.id, 'declined')} disabled={actionLoading === e.id} className="btn btn-secondary" style={{ padding: '10px 28px', fontSize: 11 }}>
                                <i className={actionLoading === e.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-times'} style={{ marginRight: 6 }}></i>Decline
                              </button>
                            </>
                          )}
                          <button onClick={() => handleRemove(e.id)} disabled={actionLoading === e.id} className="btn" style={{ padding: '10px 28px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)', marginLeft: 'auto' }}>
                            <i className={actionLoading === e.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'} style={{ marginRight: 6 }}></i>Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {tab === 'users' && (
            users.length === 0 ? (
              <div className="reveal" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <i className="fa-solid fa-users" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Users Yet</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Users will appear here after signing up.</p>
              </div>
            ) : (
              <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {users.map((u, idx) => (
                  <div key={u.id} className={`project-card reveal reveal-delay-${Math.min(idx + 1, 5)}`} style={{ padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: u.avatar ? 'transparent' : (u.role === 'admin' ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : u.role === 'instructor' ? 'color-mix(in srgb, #6b9bf5 15%, transparent)' : 'var(--input-bg)'), border: u.role === 'admin' ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : u.role === 'instructor' ? '1px solid color-mix(in srgb, #6b9bf5 30%, transparent)' : '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: u.role === 'admin' ? 'var(--accent)' : u.role === 'instructor' ? '#6b9bf5' : 'var(--text-dim)', overflow: 'hidden', flexShrink: 0 }}>
                        {u.avatar
                          ? <SmartImage src={u.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : u.name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-light)', marginBottom: 2 }}>{u.name}{u.id === user!.id && <span style={{fontSize:11,color:"var(--text-dim)",fontWeight:500}}> (you)</span>}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{u.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ padding: '5px 16px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: u.role === 'admin' ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : u.role === 'instructor' ? 'color-mix(in srgb, #6b9bf5 12%, transparent)' : 'rgba(148,163,184,0.1)', color: u.role === 'admin' ? 'var(--accent)' : u.role === 'instructor' ? '#6b9bf5' : '#94a3b8', border: u.role === 'admin' ? '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' : u.role === 'instructor' ? '1px solid color-mix(in srgb, #6b9bf5 25%, transparent)' : '1px solid rgba(148,163,184,0.15)' }}>{u.role}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 120 }}>{fmt(u.createdAt)}</span>
                      {u.id !== user!.id && (
                        <>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'admin')}
                              disabled={actionLoading === u.id}
                              className="btn"
                              style={{ padding: '8px 16px', fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}
                            >
                              <i className={actionLoading === u.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-shield-alt'} style={{ marginRight: 6 }}></i>
                              Make Admin
                            </button>
                          )}
                          {u.role !== 'instructor' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'instructor')}
                              disabled={actionLoading === u.id}
                              className="btn"
                              style={{ padding: '8px 16px', fontSize: 11, background: 'color-mix(in srgb, #6b9bf5 10%, transparent)', border: '1px solid color-mix(in srgb, #6b9bf5 30%, transparent)', color: '#6b9bf5' }}
                            >
                              <i className={actionLoading === u.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-chalkboard-user'} style={{ marginRight: 6 }}></i>
                              Make Instructor
                            </button>
                          )}
                          {u.role !== 'student' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'student')}
                              disabled={actionLoading === u.id}
                              className="btn"
                              style={{ padding: '8px 16px', fontSize: 11, background: 'transparent', border: '1px solid rgba(234,179,8,0.4)', color: 'var(--warning-color)' }}
                            >
                              <i className={actionLoading === u.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-user'} style={{ marginRight: 6 }}></i>
                              Make Student
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="btn"
                            style={{ padding: '8px 16px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}
                          >
                            <i className={actionLoading === u.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'} style={{ marginRight: 6 }}></i>Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {tab === 'progress' && (
            progressLoading ? (
              <div className="reveal" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--accent)', marginBottom: 16, display: 'block' }}></i>
                <p style={{ color: 'var(--text-dim)' }}>Loading student progress...</p>
              </div>
            ) : studentProgress.length === 0 ? (
              <div className="reveal" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <i className="fa-solid fa-chart-line" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Progress Data</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Student progress will appear here once they start courses.</p>
              </div>
            ) : (
              <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }} className="reveal">
                  {(() => {
                    const total = studentProgress.length;
                    const avgCompletion = total > 0 ? Math.round(studentProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / total) : 0;
                    const completedCount = studentProgress.filter(p => p.completionPercentage === 100).length;
                    const atRiskCount = studentProgress.filter(p => p.completionPercentage < 50).length;
                    return [
                      { label: 'Total Records', val: total, icon: 'fa-book-open', color: 'var(--accent)' },
                      { label: 'Avg Completion', val: `${avgCompletion}%`, icon: 'fa-chart-pie', color: 'var(--success-color)' },
                      { label: 'Completed', val: completedCount, icon: 'fa-trophy', color: 'var(--warning-color)' },
                      { label: 'At Risk', val: atRiskCount, icon: 'fa-exclamation-triangle', color: 'var(--error-color)' },
                    ].map((s, i) => (
                      <div key={s.label} style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', padding: 24, borderRadius: 12 }}>
                        <i className={`fas ${s.icon}`} style={{ fontSize: 18, color: s.color, marginBottom: 12, display: 'block' }}></i>
                        <div style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: "var(--font-heading)", marginBottom: 4 }}>{s.val}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{s.label}</div>
                      </div>
                    ));
                  })()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {studentProgress.map((p, idx) => {
                    const pc = progressColor(p.completionPercentage);
                    return (
                      <div key={p.id} className={`project-card reveal reveal-delay-${Math.min(idx + 1, 5)}`} style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: p.user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 16, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                              {p.user.avatar
                                ? <SmartImage src={p.user.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : p.user.name.charAt(0).toUpperCase()
                              }
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 4 }}>{p.user.name}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{p.user.email}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                            <span style={{ padding: '5px 16px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: pc.bg, color: pc.text, border: `1px solid ${pc.text}33` }}>{pc.label}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 120, textAlign: 'right' }}>{fmt(p.lastAccessed)}</span>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', paddingLeft: 64 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>
                                <i className="fa-solid fa-book" style={{ color: 'var(--accent)', marginRight: 8, fontSize: 12 }}></i>
                                {p.courseName}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: pc.text, fontFamily: "var(--font-heading)" }}>{editingProgress === p.id ? Math.round((editModules.length / p.totalModules) * 100) : p.completionPercentage}%</span>
                                {editingProgress !== p.id && (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => handleEditProgress(p)} className="btn" style={{ padding: '4px 12px', fontSize: 10, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}>
                                      <i className="fa-solid fa-edit" style={{ marginRight: 4 }}></i>Edit
                                    </button>
                                    <button
                                      onClick={() => handleResetProgress(p)}
                                      disabled={progressSaving}
                                      className="btn"
                                      style={{ padding: '4px 12px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}
                                    >
                                      <i className={progressSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-redo'} style={{ marginRight: 4 }}></i>Reset
                                    </button>
                                    {p.completionPercentage === 100 && (
                                      <button
                                        onClick={() => handleSendCertificate(p)}
                                        disabled={certSending === p.id}
                                        className="btn"
                                        style={{ padding: '4px 12px', fontSize: 10, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', color: 'var(--warning-color)' }}
                                      >
                                        <i className={certSending === p.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-certificate'} style={{ marginRight: 4 }}></i>Send Cert
                                      </button>
                                    )}
                                    <button
                                      onClick={() => fetchStudyData(p.userId, p.courseId)}
                                      disabled={studyLoading === `${p.userId}-${p.courseId}`}
                                      className="btn"
                                      style={{ padding: '4px 12px', fontSize: 10, background: studyData[`${p.userId}-${p.courseId}`] ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent', border: studyData[`${p.userId}-${p.courseId}`] ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: studyData[`${p.userId}-${p.courseId}`] ? 'var(--accent)' : 'var(--text-dim)' }}
                                    >
                                      <i className={studyLoading === `${p.userId}-${p.courseId}` ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-eye'} style={{ marginRight: 4 }}></i>{studyData[`${p.userId}-${p.courseId}`] ? 'Hide Study' : 'Study Data'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ height: 10, background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${editingProgress === p.id ? (editModules.length / p.totalModules) * 100 : p.completionPercentage}%`, background: `linear-gradient(90deg, ${pc.bar}, ${pc.bar}cc)`, borderRadius: 999, transition: 'width 0.6s ease' }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                              {editingProgress === p.id ? editModules.length : p.completedModules.length} of {p.totalModules} modules completed
                            </div>
                            {editingProgress === p.id && (
                              <div style={{ marginTop: 16, padding: '16px 20px', background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                  <i className="fa-solid fa-tasks" style={{ marginRight: 6, color: 'var(--accent)' }}></i>Toggle Completed Modules
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                                  {Array.from({ length: p.totalModules }, (_, i) => i + 1).map(modNum => {
                                    const isChecked = editModules.includes(modNum);
                                    return (
                                      <button
                                        key={modNum}
                                        onClick={() => handleToggleModule(modNum)}
                                        style={{
                                          padding: '6px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                                          background: isChecked ? 'rgba(34,197,94,0.12)' : 'var(--input-bg)',
                                          border: isChecked ? '1px solid rgba(34,197,94,0.3)' : '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                                          color: isChecked ? 'var(--success-color)' : 'var(--text-dim)',
                                          cursor: 'pointer', fontFamily: "var(--font-body)",
                                          display: 'flex', alignItems: 'center', gap: 6,
                                        }}
                                      >
                                        <i className={isChecked ? 'fa-solid fa-check-square' : 'far fa-square'} style={{ fontSize: 11 }}></i>
                                        M{String(modNum).padStart(2, '0')}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                  <button
                                    onClick={() => handleSaveProgress(p)}
                                    disabled={progressSaving}
                                    className="btn btn-primary"
                                    style={{ padding: '8px 20px', fontSize: 11 }}
                                  >
                                    <i className={progressSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'} style={{ marginRight: 6 }}></i>
                                    {progressSaving ? 'Saving...' : 'Save Progress'}
                                  </button>
                                  <button
                                    onClick={() => { setEditingProgress(null); setEditModules([]); }}
                                    className="btn"
                                    style={{ padding: '8px 20px', fontSize: 11, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {studyData[`${p.userId}-${p.courseId}`] && editingProgress !== p.id && (
                              <div style={{ marginTop: 16, padding: '16px 20px', background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <i className="fa-solid fa-clock" style={{ color: 'var(--accent)' }}></i>Module Study Activity
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 120px', gap: 1, fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, padding: '0 8px' }}>
                                  <span>Module</span>
                                  <span>Title</span>
                                  <span>Studied</span>
                                  <span>Time Spent</span>
                                </div>
                                {studyData[`${p.userId}-${p.courseId}`].map((ms) => (
                                  <div key={ms.moduleId} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 120px', gap: 1, padding: '10px 8px', borderBottom: '0.5px solid color-mix(in srgb, var(--text-light) 6%, transparent)', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>M{String(ms.moduleOrder).padStart(2, '0')}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{ms.moduleTitle}</span>
                                    <span style={{
                                      padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-block', textAlign: 'center',
                                      background: ms.studied ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)',
                                      color: ms.studied ? 'var(--success-color)' : 'var(--error-color)',
                                      border: ms.studied ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.15)',
                                    }}>
                                      <i className={ms.studied ? 'fa-solid fa-check' : 'fa-solid fa-times'} style={{ marginRight: 4, fontSize: 9 }}></i>{ms.studied ? 'Yes' : 'No'}
                                    </span>
                                    <span style={{ fontSize: 12, color: ms.timeSpent > 0 ? 'var(--text-light)' : 'var(--text-dim)', fontWeight: ms.timeSpent > 0 ? 600 : 400 }}>
                                      {ms.timeSpent > 0 ? formatTime(ms.timeSpent) : '--'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ width: 72, height: 72, borderRadius: '50%', border: `2px solid color-mix(in srgb, var(--text-light) 10%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                            <svg width="72" height="72" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                              <circle cx="36" cy="36" r="30" fill="none" stroke="color-mix(in srgb, var(--text-light) 10%, transparent)" strokeWidth="3" />
                              <circle cx="36" cy="36" r="30" fill="none" stroke={pc.bar} strokeWidth="3"
                                strokeDasharray={`${(p.completionPercentage / 100) * 188.5} 188.5`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span style={{ fontSize: 14, fontWeight: 700, color: pc.text, fontFamily: "var(--font-heading)", zIndex: 1 }}>{p.completionPercentage}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
          {tab === 'modules' && (
            <>
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Filter Course: ‎ ‎ ‎   </span>
                  {['all', ...courses.map(c => c.id)].map(cid => (
                    <button key={cid} className={`filter-btn${modulesCourseFilter === cid ? ' active' : ''}`} onClick={() => { setModulesCourseFilter(cid); fetchModules(cid); }}>
                      {cid === 'all' ? 'All Courses' : courses.find(co => co.id === cid)?.title || cid}
                    </button>
                  ))}
                </div>
              </div>

              {modulesLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--accent)' }}></i></div>
              ) : (
                <>
                  <div style={{ marginBottom: 48 }}>
                    <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 20, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="fa-solid fa-book" style={{ color: 'var(--accent)' }}></i>Course Modules
                    </h3>
                    {(() => {
                      const validModules = adminModules.filter(m => courses.some(c => c.id === m.courseId));
                      if (validModules.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: 40, background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12 }}>
                            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No modules found. Go to the Courses tab to add modules to your courses.</p>
                          </div>
                        );
                      }
                      return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                        {validModules.map(mod => {
                          const unlockCount = (mod.unlocks || []).length;
                          const courseObj = courses.find(c => c.id === mod.courseId || c.slug === mod.courseId);
                          const courseLabel = courseObj ? courseObj.title : mod.courseId;
                          return (
                            <div key={mod.id} style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', padding: '20px 24px', borderRadius: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', padding: '2px 8px', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 999 }}>M{String(mod.moduleOrder).padStart(2, '0')}</span>
                                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{courseLabel}</span>
                              </div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 4 }}>{mod.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.5 }}>{mod.description}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="fa-solid fa-user-check" style={{ fontSize: 10, color: unlockCount > 0 ? 'var(--success-color)' : 'var(--text-dim)' }}></i>
                                <span style={{ fontSize: 11, color: unlockCount > 0 ? 'var(--success-color)' : 'var(--text-dim)' }}>{unlockCount} student{unlockCount !== 1 ? 's' : ''} unlocked</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      );
                    })()}
                  </div>

                  <div>
                    <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 20, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="fa-solid fa-key" style={{ color: 'var(--accent)' }}></i>Student Module Access
                    </h3>
                    <UnlockStudentPanel admin={user as any} modules={allModules} unlockLoading={unlockLoading} handleUnlock={handleUnlock} handleLock={handleLock} handleUnlockAll={handleUnlockAll} enrollments={enrollments} fmt={fmt} actionLoading={actionLoading} courses={courses} />
                  </div>
                </>
              )}
            </div>
            </>
          )}
          {tab === 'quotes' && (
            <>
              <div className="projects-filter reveal" style={{ justifyContent: 'center', marginBottom: 48 }}>
                {['all', 'pending', 'reviewed', 'replied'].map(s => (
                  <button key={s} className={`filter-btn${quoteFilter === s ? ' active' : ''}`} onClick={() => setQuoteFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>

              {quotesLoading ? (
                <div className="reveal" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--accent)', marginBottom: 16, display: 'block' }}></i>
                  <p style={{ color: 'var(--text-dim)' }}>Loading quotes...</p>
                </div>
              ) : (() => {
                const filtered = quoteFilter === 'all' ? adminQuotes : adminQuotes.filter(q => q.status === quoteFilter);
                return filtered.length === 0 ? (
                  <div className="reveal" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <i className="fa-solid fa-envelope-open" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                    <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Quotes Found</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>{quoteFilter !== 'all' ? 'Try changing the filter.' : 'Quote requests will appear here when users submit them.'}</p>
                  </div>
                ) : (
                  <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {filtered.map((q) => {
                      const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                        pending: { bg: 'rgba(255,193,7,0.1)', color: 'var(--warning-color)', border: 'rgba(255,193,7,0.2)' },
                        reviewed: { bg: 'rgba(33,150,243,0.1)', color: 'var(--info-color)', border: 'rgba(33,150,243,0.2)' },
                        replied: { bg: 'rgba(76,175,80,0.1)', color: 'var(--success-color)', border: 'rgba(76,175,80,0.2)' },
                      };
                      const sc = statusColors[q.status] || statusColors.pending;
                      const isL = quoteActionLoading === q.id;
                      return (
                        <div key={q.id} className="project-card reveal" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: q.user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 14, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                                {q.user.avatar ? <SmartImage src={q.user.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : q.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-light)', fontFamily: "var(--font-body)" }}>{q.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{q.email}{q.phone ? ` · ${q.phone}` : ''}{q.company ? ` · ${q.company}` : ''}</div>
                              </div>
                            </div>
                            <span style={{ padding: '4px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 999, fontFamily: "var(--font-body)" }}>
                              {q.status}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                            <div style={{ background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, padding: '12px 16px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Service</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-light)' }}>{q.serviceType}</div>
                            </div>
                            {q.budget && (
                              <div style={{ background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, padding: '12px 16px' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Budget</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-light)' }}>{q.budget}</div>
                              </div>
                            )}
                            <div style={{ background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, padding: '12px 16px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Submitted</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-light)' }}>{new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                          </div>

                          <div style={{ background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, padding: '14px 18px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Description</div>
                            <div style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.7 }}>{q.description}</div>
                          </div>

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {q.status !== 'reviewed' && (
                              <button disabled={isL} onClick={() => updateQuoteStatus(q.id, 'reviewed')} className="btn" style={{ padding: '8px 20px', fontSize: 12, background: 'rgba(33,150,243,0.1)', border: '1px solid rgba(33,150,243,0.3)', color: 'var(--info-color)' }}>
                                <i className={isL ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-eye'} style={{ marginRight: 6, fontSize: 10 }}></i>Mark Reviewed
                              </button>
                            )}
                            {q.status !== 'replied' && (
                              <button disabled={isL} onClick={() => updateQuoteStatus(q.id, 'replied')} className="btn" style={{ padding: '8px 20px', fontSize: 12, background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', color: 'var(--success-color)' }}>
                                <i className={isL ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-reply'} style={{ marginRight: 6, fontSize: 10 }}></i>Mark Replied
                              </button>
                            )}
                            {q.status !== 'pending' && (
                              <button disabled={isL} onClick={() => updateQuoteStatus(q.id, 'pending')} className="btn" style={{ padding: '8px 20px', fontSize: 12, background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', color: 'var(--warning-color)' }}>
                                <i className={isL ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-undo'} style={{ marginRight: 6, fontSize: 10 }}></i>Reset to Pending
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
          {tab === 'team' && (
            <div className="reveal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, color: 'var(--text-light)', marginBottom: 4 }}>Team Members</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Manage who appears on the homepage team section</p>
                </div>
                <button onClick={openNewTeamForm} className="btn btn-primary" style={{ fontSize: 12, padding: '10px 20px' }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>Add Member
                </button>
              </div>

              {showTeamForm && (
                <div style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', padding: 24, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <WaveInput label="Name *" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} />
                  <WaveInput label="Role *" value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} />
                  <div style={{ gridColumn: '1 / -1' }}><WaveTextarea label="Bio" value={teamForm.bio} onChange={e => setTeamForm({ ...teamForm, bio: e.target.value })} rows={2} /></div>
                  <WaveInput label="Avatar URL" value={teamForm.avatar} onChange={e => setTeamForm({ ...teamForm, avatar: e.target.value })} />
                  <WaveInput label="Icon Class" value={teamForm.icon} onChange={e => setTeamForm({ ...teamForm, icon: e.target.value })} />
                  <WaveInput label="LinkedIn URL" value={teamForm.linkedinUrl} onChange={e => setTeamForm({ ...teamForm, linkedinUrl: e.target.value })} />
                  <WaveInput label="GitHub URL" value={teamForm.githubUrl} onChange={e => setTeamForm({ ...teamForm, githubUrl: e.target.value })} />
                  <WaveInput label="Display Order" type="number" value={teamForm.displayOrder} onChange={e => setTeamForm({ ...teamForm, displayOrder: parseInt(e.target.value) || 0 })} />
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
                    <button onClick={handleSaveTeamMember} disabled={teamSaving} className="btn btn-primary" style={{ fontSize: 12, padding: '10px 24px' }}>{teamSaving ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Saving...</> : editingTeamMember ? 'Update Member' : 'Add Member'}</button>
                    <button onClick={() => setShowTeamForm(false)} className="btn btn-secondary" style={{ fontSize: 12, padding: '10px 24px' }}>Cancel</button>
                  </div>
                </div>
              )}

              {teamLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)' }}></i></div>
              ) : adminTeam.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fa-solid fa-users" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Team Members</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>Add team members to display them on the homepage.</p>
                </div>
              ) : (
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {adminTeam.map(m => (
                    <div key={m.id} className="project-card" style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: m.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {m.avatar ? <SmartImage src={m.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <i className={m.icon || 'fa-solid fa-user-tie'} style={{ fontSize: 20, color: 'var(--accent)' }}></i>}
                      </div>
                      <div style={{ flex: 1, minWidth: 150 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-light)' }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, letterSpacing: 0.5 }}>{m.role}</div>
                        {m.bio && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>{m.bio}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEditTeamForm(m)} className="btn" style={{ padding: '6px 14px', fontSize: 11 }}><i className="fa-solid fa-edit" style={{ marginRight: 4 }}></i>Edit</button>
                        <button onClick={() => handleDeleteTeamMember(m.id)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error-color)' }}><i className="fa-solid fa-trash" style={{ marginRight: 4 }}></i>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === 'tests' && (
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-file-alt" style={{ color: 'var(--accent)' }}></i>Manage Tests
                </h3>
                <button onClick={() => { setShowTestForm(true); if (!adminModules.length) fetchModules('all'); }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 11 }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>Create Test
                </button>
              </div>

              {showTestForm && (
                <div style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', padding: '32px 40px', borderRadius: 12, marginBottom: 24 }}>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 24 }}>
                    <i className="fa-solid fa-plus" style={{ color: 'var(--accent)', marginRight: 8 }}></i>New Test
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Module *</label>
                      <select value={testForm.moduleId} onChange={e => setTestForm(f => ({ ...f, moduleId: e.target.value }))} style={{ width: '100%' }}>
                        <option value="">Select module...</option>
                        {adminModules.map(m => <option key={m.id} value={m.id}>M{String(m.moduleOrder).padStart(2, '0')}: {m.title}</option>)}
                      </select>
                    </div>
                    <WaveInput label="Title *" value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} />
                    <WaveInput label="Time Limit (minutes)" type="number" value={testForm.timeLimit} onChange={e => setTestForm(f => ({ ...f, timeLimit: parseInt(e.target.value) || 30 }))} />
                    <WaveInput label="Passing Score (%)" type="number" value={testForm.passingScore} onChange={e => setTestForm(f => ({ ...f, passingScore: parseInt(e.target.value) || 70 }))} />
                  </div>
                  <WaveInput label="Description" value={testForm.description} onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))} style={{ marginBottom: 16 }} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleCreateTest} disabled={testsSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 11 }}>
                      <i className={testsSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'} style={{ marginRight: 6 }}></i>{testsSaving ? 'Creating...' : 'Create Test'}
                    </button>
                    <button onClick={() => setShowTestForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 11, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
                  </div>
                </div>
              )}

              {testsLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--accent)' }}></i></div>
              ) : adminTests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fa-solid fa-file-alt" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Tests Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Click "Create Test" to create your first test.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {adminTests.map((t) => (
                    <div key={t.id} className="project-card reveal" style={{ padding: '24px 32px', border: selectedTestId === t.id ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="fa-solid fa-file-alt" style={{ fontSize: 18, color: 'var(--accent)' }}></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 4 }}>{t.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                              Module: {t.moduleTitle} &middot; {t.questionCount} question{t.questionCount !== 1 ? 's' : ''} &middot; {t.attemptCount} attempt{t.attemptCount !== 1 ? 's' : ''} &middot; <span style={{ color: 'var(--accent)', fontWeight: 700 }}><i className="fa-solid fa-clock" style={{ marginRight: 4, fontSize: 10 }}></i>{t.timeLimit} min</span> &middot; Pass: {t.passingScore}%
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                          <button onClick={() => fetchTestDetail(t.id)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: selectedTestId === t.id ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent', border: selectedTestId === t.id ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: selectedTestId === t.id ? 'var(--accent)' : 'var(--text-dim)' }}>
                            <i className="fa-solid fa-eye" style={{ marginRight: 4 }}></i>Details
                          </button>
                          <button onClick={() => handleDeleteTest(t.id)} disabled={testActionLoading === t.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                            <i className={testActionLoading === t.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'} style={{ marginRight: 4 }}></i>Delete
                          </button>
                        </div>
                      </div>

                      {selectedTestId === t.id && (
                        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)' }}>
                          {!selectedTest ? (
                            <div style={{ textAlign: 'center', padding: 30 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 20, color: 'var(--accent)' }}></i></div>
                          ) : (
                            <>
                              <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>
                                    <i className="fa-solid fa-list-ol" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Questions ({selectedTest.questions.length})
                                  </h4>
                                  <button onClick={() => setShowQuestionForm(true)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--success-color)' }}>
                                    <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>Add Question
                                  </button>
                                </div>

                                {showQuestionForm && (
                                  <div style={{ background: 'color-mix(in srgb, var(--card-bg) 40%, transparent)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', padding: 20, borderRadius: 12, marginBottom: 16 }}>
                                    <h5 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', marginBottom: 12 }}>New Question</h5>
                                    <WaveInput label="Question Text *" value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} style={{ marginBottom: 12 }} />
                                    <div style={{ marginBottom: 12 }}>
                                      <label style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Options * <span style={{ fontSize: 9, color: 'var(--warning-color)' }}>(select correct answer by clicking the radio button)</span>
                                      </label>
                                      {questionForm.options.map((opt, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                          <input type="radio" name="correctAnswer" checked={questionForm.correctAnswer === idx} onChange={() => setQuestionForm(f => ({ ...f, correctAnswer: idx }))} style={{ accentColor: 'var(--success-color)', cursor: 'pointer' }} />
                                          <span style={{ fontSize: 12, color: 'var(--text-dim)', width: 20, flexShrink: 0 }}>{String.fromCharCode(65 + idx)}.</span>
                                          <div style={{ flex: 1 }}><WaveInput label={`Option ${String.fromCharCode(65 + idx)}`} value={opt} onChange={e => updateQuestionOption(idx, e.target.value)} /></div>
                                          {questionForm.options.length > 2 && (
                                            <button onClick={() => removeQuestionOption(idx)} style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}><i className="fa-solid fa-times"></i></button>
                                          )}
                                        </div>
                                      ))}
                                      {questionForm.options.length < 6 && (
                                        <button onClick={addQuestionOption} style={{ background: 'none', border: '0.5px dashed color-mix(in srgb, var(--text-light) 15%, transparent)', borderRadius: 12, padding: '6px 12px', color: 'var(--text-dim)', fontSize: 11, cursor: 'pointer', marginTop: 4 }}>
                                          <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>Add Option
                                        </button>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                      <WaveInput label="Points" type="number" value={questionForm.points} onChange={e => setQuestionForm(f => ({ ...f, points: parseInt(e.target.value) || 1 }))} style={{ width: 80 }} />
                                      <button onClick={handleAddQuestion} disabled={testsSaving} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 11, marginTop: 16 }}>
                                        <i className={testsSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'} style={{ marginRight: 4 }}></i>{testsSaving ? 'Adding...' : 'Add Question'}
                                      </button>
                                      <button onClick={() => { setShowQuestionForm(false); setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }); }} className="btn" style={{ padding: '8px 20px', fontSize: 11, marginTop: 16, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
                                    </div>
                                  </div>
                                )}

                                {selectedTest.questions.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-dim)', fontSize: 13 }}>
                                    <i className="fa-solid fa-inbox" style={{ fontSize: 24, display: 'block', marginBottom: 8, opacity: 0.5 }}></i>No questions yet. Add one above.
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedTest.questions.map((q, idx) => {
                                      const opts: string[] = (() => { try { return JSON.parse(q.options); } catch { return []; } })();
                                      return (
                                        <div key={q.id} style={{ background: 'color-mix(in srgb, var(--card-bg) 40%, transparent)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', padding: '14px 18px', borderRadius: 12 }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>
                                              Q{idx + 1}. {q.questionText}
                                              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-dim)' }}>({q.points}pt)</span>
                                            </div>
                                            <button onClick={() => handleDeleteQuestion(q.id)} disabled={testActionLoading === q.id} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error-color)' }}>
                                              <i className={testActionLoading === q.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash'}></i>
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
                                            {opts.map((opt, oi) => (
                                              <span key={oi} style={{
                                                padding: '3px 10px', borderRadius: 999, fontSize: 11,
                                                background: oi === q.correctAnswer ? 'rgba(34,197,94,0.12)' : 'var(--input-bg)',
                                                border: `0.5px solid ${oi === q.correctAnswer ? 'rgba(34,197,94,0.3)' : 'color-mix(in srgb, var(--text-light) 10%, transparent)'}`,
                                                color: oi === q.correctAnswer ? 'var(--success-color)' : 'var(--text-dim)',
                                              }}>
                                                {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctAnswer && <i className="fa-solid fa-check" style={{ marginLeft: 4 }}></i>}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <div style={{ marginBottom: 24 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)', marginBottom: 12 }}>
                                  <i className="fa-solid fa-unlock" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Test Access — Enrolled Students
                                </h4>
                                {(() => {
                                  const students = testEnrolledStudents;
                                  const unlockedUserIds = new Set((selectedTest?.unlocks || []).map((u: { userId: string }) => u.userId));

                                  if (students.length === 0) {
                                    return (
                                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 13, background: 'color-mix(in srgb, var(--card-bg) 40%, transparent)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12 }}>
                                        No approved students enrolled in this course.
                                      </div>
                                    );
                                  }

                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                                      {students.map(({ user }) => {
                                        const isUnlocked = unlockedUserIds.has(user.id);
                                        const isLoading = testActionLoading === (isUnlocked ? `lock-${user.id}` : `unlock-${user.id}`);
                                        return (
                                          <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'color-mix(in srgb, var(--card-bg) 40%, transparent)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
                                                {user.avatar ? <SmartImage src={user.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : user.name.charAt(0).toUpperCase()}
                                              </div>
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                                              </div>
                                            </div>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: isUnlocked ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: isUnlocked ? 'var(--success-color)' : 'var(--error-color)', border: isUnlocked ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)', flexShrink: 0 }}>
                                              {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                                            </span>
                                            <button
                                              onClick={() => isUnlocked ? handleLockTest(t.id, user.id, user.name) : handleUnlockTest(t.id, user.id)}
                                              disabled={isLoading}
                                              className="btn"
                                              style={{ padding: '5px 14px', fontSize: 10, minWidth: 80, background: isUnlocked ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: isUnlocked ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)', color: isUnlocked ? 'var(--error-color)' : 'var(--success-color)', flexShrink: 0 }}
                                            >
                                              <i className={isLoading ? 'fa-solid fa-spinner fa-spin' : isUnlocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'} style={{ marginRight: 4, fontSize: 9 }}></i>
                                              {isUnlocked ? 'Lock' : 'Unlock'}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)', marginBottom: 12 }}>
                                  <i className="fa-solid fa-chart-bar" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Student Attempts
                                </h4>
                                {selectedTest.attempts.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 13 }}>No attempts yet.</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedTest.attempts.map((a) => {
                                      const pct = a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 100) : 0;
                                      return (
                                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', background: 'color-mix(in srgb, var(--card-bg) 40%, transparent)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, flexWrap: 'wrap' }}>
                                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
                                            {a.user.avatar ? <SmartImage src={a.user.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : a.user.name.charAt(0).toUpperCase()}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 150 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{a.user.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.user.email}</div>
                                          </div>
                                          <div style={{ fontSize: 20, fontWeight: 700, color: a.passed ? 'var(--success-color)' : 'var(--error-color)', fontFamily: "var(--font-heading)" }}>{pct}%</div>
                                          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{a.score}/{a.totalPoints}</div>
                                          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: a.passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: a.passed ? 'var(--success-color)' : 'var(--error-color)', border: a.passed ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>{a.passed ? 'PASSED' : 'FAILED'}</span>
                                          {a.submittedAt ? (() => {
                                            const startTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
                                            const endTime = new Date(a.submittedAt).getTime();
                                            const isValid = startTime > 0 && endTime > 0 && startTime < endTime;
                                            const diffMs = isValid ? (endTime - startTime) : 0;
                                            const diffMin = Math.floor(diffMs / 60000);
                                            const diffSec = Math.floor((diffMs % 60000) / 1000);
                                            const durationStr = isValid
                                              ? (diffMin > 0 ? `${diffMin}m ${diffSec}s` : `${diffSec}s`)
                                              : 'N/A';
                                            const overTime = isValid && diffMin >= selectedTest.timeLimit;
                                            return (
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: "var(--font-heading)", background: overTime ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.08)', color: overTime ? 'var(--error-color)' : 'var(--success-color)', border: overTime ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(34,197,94,0.15)' }}><i className="fa-solid fa-stopwatch" style={{ marginRight: 5, fontSize: 9 }}></i>{durationStr}</span>
                                                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{new Date(a.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                              </div>
                                            );
                                          })() : (
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: 'rgba(234,179,8,0.1)', color: 'var(--warning-color)', border: '1px solid rgba(234,179,8,0.25)' }}>IN PROGRESS</span>
                                          )}
                                          <button onClick={() => handleResetAttempt(t.id, a.userId, a.user.name)} disabled={testActionLoading === `reset-${a.userId}`} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: 'var(--warning-color)' }}>
                                            <i className={testActionLoading === `reset-${a.userId}` ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-redo'} style={{ marginRight: 4 }}></i>Reset
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === 'analytics' && (
            !analytics ? (
              <div className="reveal" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--accent)', marginBottom: 16, display: 'block' }}></i>
                <p style={{ color: 'var(--text-dim)' }}>Loading analytics...</p>
              </div>
            ) : (
              <div className="reveal" style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
                  {[
                    { label: 'Total Users', val: analytics.totalUsers, icon: 'fa-users', color: 'var(--accent)' },
                    { label: 'Users This Week', val: analytics.usersThisWeek, icon: 'fa-user-plus', color: 'var(--success-color)' },
                    { label: 'Total Enrollments', val: analytics.totalEnrollments, icon: 'fa-graduation-cap', color: 'var(--warning-color)' },
                    { label: 'Pending Review', val: analytics.pendingEnrollments, icon: 'fa-clock', color: '#f97316' },
                  ].map((s, i) => (
                    <div key={s.label} style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', padding: 24, borderRadius: 12 }}>
                      <i className={`fas ${s.icon}`} style={{ fontSize: 18, color: s.color, marginBottom: 12, display: 'block' }}></i>
                      <div style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: "var(--font-heading)", marginBottom: 4 }}>{s.val}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 20 }}>
                  <i className="fa-solid fa-chart-bar" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Course Popularity
                </h3>
                <div style={{ marginBottom: 48 }}>
                  {(analytics.coursePopularity || []).map((c, i) => {
                    const maxVal = Math.max(...(analytics.coursePopularity || []).map(x => x._count.id));
                    const pct = maxVal > 0 ? (c._count.id / maxVal) * 100 : 0;
                    return (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>{c.courseName}</span>
                          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{c._count.id} enrollments</span>
                        </div>
                        <div style={{ height: 10, background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), #ff4466)', borderRadius: 999, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 20 }}>
                  <i className="fa-solid fa-stream" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Recent Activity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(analytics.recentActivity || []).map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                        {a.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>
                          <span style={{ color: 'var(--text-light)' }}>{a.user.name}</span>
                          {' '}enrolled in <span style={{ color: 'var(--accent)' }}>{a.courseName}</span>
                        </div>
                      </div>
                      <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: a.status === 'approved' ? 'rgba(34,197,94,0.12)' : a.status === 'declined' ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)', color: a.status === 'approved' ? 'var(--success-color)' : a.status === 'declined' ? 'var(--error-color)' : 'var(--warning-color)' }}>{a.status}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', minWidth: 120, textAlign: 'right' }}>{fmt(a.enrolledAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
          {tab === 'services' && (
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-concierge-bell" style={{ color: 'var(--accent)' }}></i>Manage Services
                </h3>
                <button onClick={openNewServiceForm} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 11 }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>Add Service
                </button>
              </div>

              {showServiceForm && (
                <div style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', padding: '32px 40px', borderRadius: 12, marginBottom: 24 }}>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fa-solid fa-edit" style={{ color: 'var(--accent)' }}></i>{editingService ? 'Edit Service' : 'New Service'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <WaveInput label="Title" value={serviceForm.title} onChange={e => handleServiceTitleChange(e.target.value)} />
                    <WaveInput label="Slug" value={serviceForm.slug} onChange={e => setServiceForm(f => ({ ...f, slug: e.target.value }))} />
                    <WaveInput label="Icon (FA class)" value={serviceForm.icon} onChange={e => setServiceForm(f => ({ ...f, icon: e.target.value }))} />
                    <WaveInput label="Display Order" type="number" value={serviceForm.displayOrder} onChange={e => setServiceForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} />
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Status</label>
                      <select value={serviceForm.status} onChange={e => setServiceForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%' }}>
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                  <WaveTextarea label="Description" value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ marginBottom: 16 }} />

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-list" style={{ color: 'var(--accent)' }}></i>Features ({serviceFeatures.length})
                    </label>
                    {serviceFeatures.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {serviceFeatures.map((feat, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12 }}>
                            <i className={feat.icon} style={{ fontSize: 14, color: 'var(--accent)', width: 20, textAlign: 'center' }}></i>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{feat.title}</div>
                              {feat.description && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{feat.description}</div>}
                            </div>
                            <button onClick={() => removeServiceFeature(idx)} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                      <WaveInput label="Feature Title" value={newServiceFeature.title} onChange={e => setNewServiceFeature(f => ({ ...f, title: e.target.value }))} />
                      <WaveInput label="Feature Description" value={newServiceFeature.description} onChange={e => setNewServiceFeature(f => ({ ...f, description: e.target.value }))} />
                      <WaveInput label="Feature Icon" value={newServiceFeature.icon} onChange={e => setNewServiceFeature(f => ({ ...f, icon: e.target.value }))} />
                      <button onClick={addServiceFeature} className="btn" style={{ padding: '8px 14px', fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}>
                        <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>Add
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)' }}>
                    <button onClick={handleSaveService} disabled={serviceSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 11 }}>
                      <i className={serviceSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'} style={{ marginRight: 6 }}></i>{serviceSaving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                    </button>
                    <button onClick={() => setShowServiceForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 11, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
                  </div>
                </div>
              )}

              {servicesLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--accent)' }}></i></div>
              ) : services.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fa-solid fa-concierge-bell" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Services Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Click "Add Service" to create your first service.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[...services].sort((a, b) => a.displayOrder - b.displayOrder).map((s, idx) => (
                    <div key={s.id} className="project-card reveal" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className={s.icon} style={{ fontSize: 18, color: 'var(--accent)' }}></i>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)' }}>{s.title}</div>
                              <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: s.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: s.status === 'active' ? 'var(--success-color)' : 'var(--error-color)', border: s.status === 'active' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>{s.status}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>/ {s.slug} &middot; Order: {s.displayOrder}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={() => openEditServiceForm(s)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}>
                            <i className={actionLoading === s.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-edit'} style={{ marginRight: 4 }}></i>Edit
                          </button>
                          <button onClick={() => handleToggleServiceStatus(s)} disabled={actionLoading === s.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: s.status === 'active' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)', border: s.status === 'active' ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(34,197,94,0.3)', color: s.status === 'active' ? 'var(--warning-color)' : 'var(--success-color)' }}>
                            <i className={actionLoading === s.id ? 'fa-solid fa-spinner fa-spin' : s.status === 'active' ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} style={{ marginRight: 4 }}></i>{s.status === 'active' ? 'Hide' : 'Show'}
                          </button>
                          <button onClick={() => handleDeleteService(s)} disabled={actionLoading === s.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                            <i className={actionLoading === s.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'} style={{ marginRight: 4 }}></i>Delete
                          </button>
                        </div>
                      </div>
                      {s.description && <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>{s.description}</div>}
                      {s.features.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {s.features.map((feat, fidx) => (
                            <span key={fidx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, fontSize: 11, color: 'var(--text-dim)' }}>
                              <i className={feat.icon} style={{ fontSize: 10, color: 'var(--accent)' }}></i>{feat.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === 'projects' && (
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-folder-open" style={{ color: 'var(--accent)' }}></i>
                  Projects ({adminProjects.length})
                </h3>
                <button onClick={openNewProjectForm} className="btn" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-plus"></i> Add Project
                </button>
              </div>

              {showProjectForm && (
                <div style={{ background: 'color-mix(in srgb, var(--card-bg) 80%, transparent)', backdropFilter: 'blur(20px)', border: '1px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 16, padding: 28, marginBottom: 28 }}>
                  <h4 style={{ color: 'var(--text-light)', marginBottom: 20, fontSize: 16 }}>{editingProject ? 'Edit Project' : 'New Project'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Title *</label>
                      <input value={projectForm.title} onChange={e => handleProjectTitleChange(e.target.value)} placeholder="Project name" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-light)', fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Slug</label>
                      <input value={projectForm.slug} onChange={e => setProjectForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-light)', fontSize: 14 }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Description</label>
                      <textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Project description..." style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-light)', fontSize: 14, resize: 'vertical' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Category</label>
                      <select value={projectForm.category} onChange={e => setProjectForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-light)', fontSize: 14 }}>
                        <option value="ai">AI</option>
                        <option value="web">Web</option>
                        <option value="linux">Linux</option>
                        <option value="software">Software</option>
                        <option value="mobile">Mobile</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Tags (comma separated)</label>
                      <input value={projectForm.tags} onChange={e => setProjectForm(f => ({ ...f, tags: e.target.value }))} placeholder="AI, Voice, Assistant" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-light)', fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Icon (Font Awesome class)</label>
                      <input value={projectForm.icon} onChange={e => setProjectForm(f => ({ ...f, icon: e.target.value }))} placeholder="fa-solid fa-robot" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-light)', fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Project URL (GitHub, etc.)</label>
                      <input value={projectForm.projectUrl} onChange={e => setProjectForm(f => ({ ...f, projectUrl: e.target.value }))} placeholder="https://github.com/..." style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-light)', fontSize: 14 }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Image URL (optional)</label>
                      <input value={projectForm.imageUrl} onChange={e => setProjectForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-light)', fontSize: 14 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button onClick={handleSaveProject} disabled={projectSaving} className="btn" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      {projectSaving ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Saving...</> : <><i className="fa-solid fa-check" style={{ marginRight: 8 }}></i>{editingProject ? 'Update' : 'Create'}</>}
                    </button>
                    <button onClick={() => setShowProjectForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              {projectsLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Loading projects...</div>
              ) : adminProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                  <i className="fa-solid fa-folder-open" style={{ fontSize: 32, marginBottom: 16, opacity: 0.3, display: 'block' }}></i>
                  No projects yet. Click "Add Project" to create one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {adminProjects.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', backdropFilter: 'blur(20px)', border: '1px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={p.icon || 'fa-solid fa-code'} style={{ color: 'var(--accent)', fontSize: 16 }}></i>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-light)' }}>{p.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.category} &middot; /{p.slug} &middot; <span style={{ color: p.status === 'active' ? 'var(--success-color)' : 'var(--warning-color)' }}>{p.status}</span></div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleToggleProjectStatus(p)} disabled={actionLoading === p.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: p.status === 'active' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${p.status === 'active' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`, color: p.status === 'active' ? 'var(--warning-color)' : 'var(--success-color)' }}>
                          <i className={actionLoading === p.id ? 'fa-solid fa-spinner fa-spin' : p.status === 'active' ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} style={{ marginRight: 6, fontSize: 10 }}></i>
                          {p.status === 'active' ? 'Hide' : 'Show'}
                        </button>
                        <button onClick={() => openEditProjectForm(p)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}>
                          <i className="fa-solid fa-pen" style={{ marginRight: 6, fontSize: 10 }}></i>Edit
                        </button>
                        <button onClick={() => handleDeleteProject(p)} disabled={actionLoading === p.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                          <i className={actionLoading === p.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'} style={{ marginRight: 6, fontSize: 10 }}></i>Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === 'courses' && (
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--accent)' }}></i>Manage Courses
                </h3>
                <button onClick={openNewCourseForm} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 11 }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>Add Course
                </button>
              </div>

              {showCourseForm && (
                <div style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', padding: '32px 40px', borderRadius: 12, marginBottom: 24 }}>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fa-solid fa-edit" style={{ color: 'var(--accent)' }}></i>{editingCourse ? 'Edit Course' : 'New Course'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <WaveInput label="Title" value={courseForm.title} onChange={e => handleCourseTitleChange(e.target.value)} />
                    <WaveInput label="Slug" value={courseForm.slug} onChange={e => setCourseForm(f => ({ ...f, slug: e.target.value }))} />
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Level</label>
                      <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))} style={{ width: '100%' }}>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="all-levels">All Levels</option>
                      </select>
                    </div>
                    <WaveInput label="Duration" value={courseForm.duration} onChange={e => setCourseForm(f => ({ ...f, duration: e.target.value }))} />
                    <WaveInput label="Price" value={courseForm.price} onChange={e => setCourseForm(f => ({ ...f, price: e.target.value }))} />
                    <WaveInput label="Icon (FA class)" value={courseForm.icon} onChange={e => setCourseForm(f => ({ ...f, icon: e.target.value }))} />
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Status</label>
                      <select value={courseForm.status} onChange={e => setCourseForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%' }}>
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                    <WaveInput label="Tech Stack" value={courseForm.techStack} onChange={e => setCourseForm(f => ({ ...f, techStack: e.target.value }))} />
                  </div>
                  <WaveTextarea label="Description" value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ marginBottom: 16 }} />
                  <WaveTextarea label="Prerequisites" value={courseForm.prerequisites} onChange={e => setCourseForm(f => ({ ...f, prerequisites: e.target.value }))} rows={2} style={{ marginBottom: 16 }} />

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-list" style={{ color: 'var(--accent)' }}></i>Features ({courseForm.features.length})
                    </label>
                    {courseForm.features.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {courseForm.features.map((feat, idx) => (
                          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, fontSize: 12, color: 'var(--text-light)' }}>
                            {feat}
                            <button onClick={() => removeCourseFeature(idx)} style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer', fontSize: 11, padding: 0 }}><i className="fa-solid fa-times"></i></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}><WaveInput label="Add a feature and press Enter" value={courseFeatureInput} onChange={e => setCourseFeatureInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCourseFeature(); } }} /></div>
                      <button onClick={addCourseFeature} className="btn" style={{ padding: '8px 14px', fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}>
                        <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>Add
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)' }}>
                    <button onClick={handleSaveCourse} disabled={courseSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 11 }}>
                      <i className={courseSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'} style={{ marginRight: 6 }}></i>{courseSaving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                    </button>
                    <button onClick={() => setShowCourseForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 11, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
                  </div>
                </div>
              )}

              {coursesLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--accent)' }}></i></div>
              ) : courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fa-solid fa-graduation-cap" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Courses Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Click "Add Course" to create your first course.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {courses.map((c) => (
                    <div key={c.id} className="project-card reveal" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className={c.icon} style={{ fontSize: 20, color: 'var(--accent)' }}></i>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)' }}>{c.title}</div>
                              {c.isGlobal && <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}><i className="fa-solid fa-globe" style={{ marginRight: 4 }}></i>Global</span>}
                              <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: c.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: c.status === 'active' ? 'var(--success-color)' : 'var(--error-color)', border: c.status === 'active' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>{c.status}</span>
                              <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>{c.level}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>/ {c.slug}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                          <button onClick={() => toggleCourseModules(c.id)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: expandedCourseId === c.id ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent', border: expandedCourseId === c.id ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: expandedCourseId === c.id ? 'var(--accent)' : 'var(--text-dim)' }}>
                            <i className="fa-solid fa-layer-group" style={{ marginRight: 4 }}></i>Modules ({c.moduleCount || 0})
                          </button>
                          <button onClick={() => openEditCourseForm(c)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}>
                            <i className="fa-solid fa-edit" style={{ marginRight: 4 }}></i>Edit
                          </button>
                          <button onClick={() => handleToggleCourseStatus(c)} disabled={actionLoading === c.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: c.status === 'active' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)', border: c.status === 'active' ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(34,197,94,0.3)', color: c.status === 'active' ? 'var(--warning-color)' : 'var(--success-color)' }}>
                            <i className={actionLoading === c.id ? 'fa-solid fa-spinner fa-spin' : c.status === 'active' ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} style={{ marginRight: 4 }}></i>{c.status === 'active' ? 'Hide' : 'Show'}
                          </button>
                          <button onClick={() => handleDeleteCourse(c)} disabled={actionLoading === c.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                            <i className={actionLoading === c.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'} style={{ marginRight: 4 }}></i>Delete
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, paddingLeft: 64 }}>
                        {c.duration && (
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Duration</div>
                            <div style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 700 }}>{c.duration}</div>
                          </div>
                        )}
                        {c.price && (
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Price</div>
                            <div style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 700 }}>{c.price}</div>
                          </div>
                        )}
                        {c.techStack && (
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tech Stack</div>
                            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{c.techStack}</div>
                          </div>
                        )}
                      </div>

                      {c.description && <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, paddingLeft: 64 }}>{c.description}</div>}

                      {c.features.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 64 }}>
                          {c.features.map((feat, fidx) => (
                            <span key={fidx} style={{ padding: '3px 12px', background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, fontSize: 11, color: 'var(--text-dim)' }}>
                              <i className="fa-solid fa-check" style={{ marginRight: 4, fontSize: 9, color: 'var(--accent)' }}></i>{feat}
                            </span>
                          ))}
                        </div>
                      )}

                      {expandedCourseId === c.id && (
                        <div style={{ marginTop: 8, padding: '20px 24px', background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <i className="fa-solid fa-layer-group" style={{ color: 'var(--accent)' }}></i>Course Modules
                            </h4>
                            <button onClick={openNewModuleForm} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}>
                              <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>Add Module
                            </button>
                          </div>

                          {showModuleForm && (
                            <div style={{ background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', padding: '20px 24px', borderRadius: 12, marginBottom: 16 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                <i className="fa-solid fa-edit" style={{ color: 'var(--accent)', marginRight: 6 }}></i>{editingModule ? 'Edit Module' : 'New Module'}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, marginBottom: 12 }}>
                                <WaveInput label="Title" value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))} />
                                <WaveInput label="Order" type="number" value={moduleForm.moduleOrder} onChange={e => setModuleForm(f => ({ ...f, moduleOrder: parseInt(e.target.value) || 1 }))} style={{ width: 80 }} />
                              </div>
                              <WaveInput label="Description" value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} style={{ marginBottom: 12 }} />
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
                                  <button onClick={() => setModulePreviewOpen(!modulePreviewOpen)} className="btn" style={{ padding: '3px 10px', fontSize: 10, fontFamily: "var(--font-body)", fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', background: modulePreviewOpen ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent', border: modulePreviewOpen ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' : '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: modulePreviewOpen ? 'var(--accent)' : 'var(--text-dim)' }}>
                                    <i className={modulePreviewOpen ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} style={{ marginRight: 4, fontSize: 9 }}></i>{modulePreviewOpen ? 'Hide' : 'Preview'}
                                  </button>
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6, opacity: 0.6 }}>
                                  Markdown supported. YouTube/Vimeo URLs auto-embed.
                                </div>
                                <WaveTextarea label="Content" value={moduleForm.content} onChange={e => setModuleForm(f => ({ ...f, content: e.target.value }))} rows={6} />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handleSaveModule} disabled={moduleSaving} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 11 }}>
                                  <i className={moduleSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'} style={{ marginRight: 4 }}></i>{moduleSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button onClick={() => { setShowModuleForm(false); setEditingModule(null); setModulePreviewOpen(false); }} className="btn" style={{ padding: '8px 18px', fontSize: 11, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
                              </div>
                              {modulePreviewOpen && moduleForm.content && (
                                <div style={{ marginTop: 16, padding: '16px 20px', background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, maxHeight: 300, overflowY: 'auto' }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                                    <i className="fa-solid fa-eye" style={{ color: 'var(--accent)', marginRight: 6 }}></i>Preview
                                  </div>
                                  <div className="markdown-preview" style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>
                                    <ReactMarkdown components={{
                                      h1: ({children}) => <h1 style={{fontSize: 20, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, marginTop: 16}}>{children}</h1>,
                                      h2: ({children}) => <h2 style={{fontSize: 17, fontWeight: 700, color: 'var(--text-light)', marginBottom: 6, marginTop: 14}}>{children}</h2>,
                                      h3: ({children}) => <h3 style={{fontSize: 15, fontWeight: 700, color: 'var(--text-light)', marginBottom: 4, marginTop: 12}}>{children}</h3>,
                                      p: ({children}) => <p style={{marginBottom: 8}}>{children}</p>,
                                      code: ({children}) => <code style={{background: 'color-mix(in srgb, var(--accent) 10%, transparent)', padding: '1px 5px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace'}}>{children}</code>,
                                      pre: ({children}) => <pre style={{background: 'color-mix(in srgb, var(--card-bg) 80%, transparent)', padding: 12, borderRadius: 12, overflowX: 'auto', marginBottom: 8}}>{children}</pre>,
                                      ul: ({children}) => <ul style={{paddingLeft: 20, marginBottom: 8}}>{children}</ul>,
                                      ol: ({children}) => <ol style={{paddingLeft: 20, marginBottom: 8}}>{children}</ol>,
                                      blockquote: ({children}) => <blockquote style={{borderLeft: '3px solid var(--accent)', paddingLeft: 12, opacity: 0.8, marginBottom: 8}}>{children}</blockquote>,
                                      a: ({children, href}) => <a href={href} target="_blank" rel="noopener noreferrer" style={{color: 'var(--accent)', textDecoration: 'underline'}}>{children}</a>,
                                    }}>{moduleForm.content}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {courseModulesLoading ? (
                            <div style={{ textAlign: 'center', padding: 30 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)' }}></i></div>
                          ) : courseModules.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)', fontSize: 13 }}>No modules yet. Click "Add Module" to create one.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {[...courseModules].sort((a, b) => a.moduleOrder - b.moduleOrder).map(mod => (
                                <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
  backdropFilter: 'blur(12px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, gap: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', padding: '2px 8px', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 999, flexShrink: 0 }}>M{String(mod.moduleOrder).padStart(2, '0')}</span>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.title}</div>
                                      {mod.description && <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.description}</div>}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => openEditModuleForm(mod)} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}>
                                      <i className="fa-solid fa-edit"></i>
                                    </button>
                                    <button onClick={() => handleDeleteModule(mod)} disabled={actionLoading === mod.id} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                                      <i className={actionLoading === mod.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'}></i>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
        <footer className="v-footer">
          <div className="v-footer-bottom" style={{ border: 'none' }}>
            <p><span style={{ color: 'var(--accent)' }}>XFoundry</span> — Admin Panel — {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        danger={confirmModal.danger}
        icon={confirmModal.icon}
      />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => router.push(link)} />
      {!atBottom && (
        <GradualBlur target="page" position="bottom" height="3.5rem" strength={1} divCount={6} curve="bezier" exponential={false} opacity={1} zIndex={50} />
      )}
    </>
  );
}
