'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePageFeatures } from '@/lib/usePageFeatures';
import ConfirmModal from '@/components/ConfirmModal';
import { Navbar } from '@/components/Navbar';
import { SearchModal } from '@/lib/PageModals';

// ── TYPES ──

interface InstructorCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  icon: string;
  status: string;
  features: string[];
  prerequisites: string;
  techStack: string;
  moduleCount: number;
  enrollmentCount: number;
  instructor?: { id: string; name: string; email: string; avatar: string | null };
  createdAt: string;
  updatedAt: string;
}

interface InstructorModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  moduleOrder: number;
  testCount: number;
  unlocks: { id: string; userId: string; moduleId: string; unlockedBy: string; createdAt: string; user: { id: string; name: string; email: string; avatar: string | null } }[];
  createdAt: string;
  updatedAt: string;
}

interface InstructorEnrollment {
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
  user: { id: string; name: string; email: string; role: string; avatar: string | null };
}

interface InstructorAnalytics {
  totalStudents: number;
  pendingEnrollments: number;
  approvedEnrollments: number;
  coursePopularity: Array<{ courseId: string; courseName: string; _count: { id: number } }>;
  dailyTrends: Record<string, number>;
  testPassRates: Array<{ testId: string; testTitle: string; moduleTitle: string; totalAttempts: number; passedAttempts: number; passRate: number }>;
  overallPassRate: number;
  totalTestAttempts: number;
  totalPassed: number;
}

interface InstructorProgress {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  completedModules: number[];
  totalModules: number;
  completionPercentage: number;
  lastAccessed: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; role: string; avatar: string | null };
}

interface InstructorTest {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  questionCount: number;
  attemptCount: number;
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  createdAt: string;
}

interface InstructorTestFull {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
  module: { id: string; title: string; courseId: string };
  questions: { id: string; questionText: string; questionType: string; options: string; correctAnswer: number; points: number; questionOrder: number; createdAt: string }[];
  attempts: { id: string; userId: string; score: number; totalPoints: number; passed: boolean; startedAt: string; submittedAt: string | null; createdAt: string; user: { id: string; name: string; email: string; avatar: string | null } }[];
  unlocks: { id: string; userId: string; unlockedBy: string; createdAt: string; user: { id: string; name: string; email: string } }[];
}

interface ModuleStudy {
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
  timeSpent: number;
  studied: boolean;
  lastStudied: string;
  testScores: { testId: string; testTitle: string; score: number; totalPoints: number; passed: boolean; submittedAt: string | null }[];
}

// ── HELPERS ──

const fmt = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; }
};

const fmtTime = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; }
};

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

const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ── MAIN COMPONENT ──

export default function InstructorPage() {
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

  // ── Auth check ──
  const authCheckedRef = useRef(false);
  useEffect(() => {
    if (loading || authCheckedRef.current) return;
    authCheckedRef.current = true;
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      router.push('/');
      toast({ title: 'Access Denied', description: 'Instructor access required', variant: 'destructive' });
    }
  }, [loading, user]);

  // ── Tab state ──
  const [tab, setTab] = useState<'overview' | 'courses' | 'modules' | 'enrollments' | 'tests' | 'students'>('overview');

  // ── Analytics ──
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const r = await fetch('/api/instructor/analytics');
      if (r.ok) setAnalytics(await r.json());
    } catch {}
    setAnalyticsLoading(false);
  }, []);

  // ── Courses ──
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<InstructorCourse | null>(null);
  const [courseForm, setCourseForm] = useState({ title: '', slug: '', description: '', level: 'Beginner', duration: '', price: '', icon: 'fa-solid fa-book', status: 'active', features: [] as string[], prerequisites: '', techStack: '' });
  const [courseFeatureInput, setCourseFeatureInput] = useState('');
  const [courseSaving, setCourseSaving] = useState(false);

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try { const r = await fetch('/api/instructor/courses'); if (r.ok) setCourses((await r.json()).courses); } catch {}
    setCoursesLoading(false);
  }, []);

  const openNewCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({ title: '', slug: '', description: '', level: 'Beginner', duration: '', price: '', icon: 'fa-solid fa-book', status: 'active', features: [], prerequisites: '', techStack: '' });
    setCourseFeatureInput('');
    setShowCourseForm(true);
  };

  const openEditCourseForm = (c: InstructorCourse) => {
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
      const r = await fetch('/api/instructor/courses', { method: editingCourse ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingCourse ? { ...body, id: editingCourse.id } : body) });
      if (r.ok) { fetchCourses(); fetchAnalytics(); setShowCourseForm(false); toast({ title: editingCourse ? 'Course Updated' : 'Course Created' }); }
      else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Failed to save course.', variant: 'destructive' }); }
    setCourseSaving(false);
  };

  const handleDeleteCourse = (c: InstructorCourse) => {
    openConfirm('Delete Course', `Are you sure you want to delete "${c.title}"? All modules, enrollments, and student progress will also be removed. This cannot be undone.`, async () => {
      try {
        const r = await fetch('/api/instructor/courses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) });
        if (r.ok) { fetchCourses(); fetchAnalytics(); toast({ title: 'Course Deleted' }); }
        else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleCourseTitleChange = (title: string) => {
    setCourseForm(f => ({ ...f, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
  };

  // ── Modules ──
  const [modules, setModules] = useState<InstructorModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesCourseFilter, setModulesCourseFilter] = useState('all');
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<InstructorModule | null>(null);
  const [moduleForm, setModuleForm] = useState({ courseId: '', title: '', description: '', content: '', moduleOrder: 1 });
  const [moduleSaving, setModuleSaving] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState<string | null>(null);
  const [showModuleUnlock, setShowModuleUnlock] = useState<string | null>(null);

  const fetchModules = useCallback(async (courseId?: string) => {
    setModulesLoading(true);
    try {
      const q = courseId && courseId !== 'all' ? `?courseId=${courseId}` : '';
      const r = await fetch(`/api/instructor/modules${q}`);
      if (r.ok) setModules((await r.json()).modules);
    } catch {}
    setModulesLoading(false);
  }, []);

  const openNewModuleForm = () => {
    setEditingModule(null);
    setModuleForm({ courseId: modulesCourseFilter !== 'all' ? modulesCourseFilter : '', title: '', description: '', content: '', moduleOrder: 1 });
    setShowModuleForm(true);
  };

  const openEditModuleForm = (m: InstructorModule) => {
    setEditingModule(m);
    setModuleForm({ courseId: m.courseId, title: m.title, description: m.description, content: m.content, moduleOrder: m.moduleOrder });
    setShowModuleForm(true);
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) { toast({ title: 'Validation Error', description: 'Module title is required', variant: 'destructive' }); return; }
    if (!moduleForm.courseId && !editingModule) { toast({ title: 'Validation Error', description: 'Please select a course', variant: 'destructive' }); return; }
    setModuleSaving(true);
    try {
      const body = { ...moduleForm };
      const r = await fetch('/api/instructor/modules', { method: editingModule ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingModule ? { ...body, id: editingModule.id } : body) });
      if (r.ok) { fetchModules(modulesCourseFilter); fetchCourses(); setShowModuleForm(false); toast({ title: editingModule ? 'Module Updated' : 'Module Created' }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save module.', variant: 'destructive' }); }
    setModuleSaving(false);
  };

  const handleDeleteModule = (m: InstructorModule) => {
    openConfirm('Delete Module', `Are you sure you want to delete module "${m.title}"? This cannot be undone.`, async () => {
      try {
        const r = await fetch('/api/instructor/modules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId: m.id }) });
        if (r.ok) { fetchModules(modulesCourseFilter); fetchCourses(); toast({ title: 'Module Deleted' }); }
        else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleUnlockModule = async (userId: string, moduleId: string) => {
    const key = `${userId}-${moduleId}`;
    setUnlockLoading(key);
    try {
      const r = await fetch('/api/instructor/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, moduleId }) });
      if (r.ok) { fetchModules(modulesCourseFilter); toast({ title: 'Module Unlocked' }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    setUnlockLoading(null);
  };

  const handleLockModule = async (userId: string, moduleId: string) => {
    const key = `${userId}-${moduleId}`;
    setUnlockLoading(key);
    try {
      const r = await fetch('/api/instructor/modules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, moduleId }) });
      if (r.ok) { fetchModules(modulesCourseFilter); toast({ title: 'Module Locked' }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    setUnlockLoading(null);
  };

  const handleUnlockAllModules = async (userId: string, courseId: string) => {
    setUnlockLoading(`${userId}-all`);
    try {
      const r = await fetch('/api/instructor/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, courseId, unlockAll: true }) });
      if (r.ok) { const d = await r.json(); toast({ title: 'Modules Unlocked', description: `${d.created} modules unlocked` }); fetchModules(modulesCourseFilter); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    setUnlockLoading(null);
  };

  // ── Enrollments ──
  const [enrollments, setEnrollments] = useState<InstructorEnrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async (status?: string) => {
    setEnrollmentsLoading(true);
    try {
      const p = status && status !== 'all' ? `?status=${status}` : '';
      const r = await fetch(`/api/instructor/enrollments${p}`);
      if (r.ok) setEnrollments((await r.json()).enrollments);
    } catch {}
    setEnrollmentsLoading(false);
  }, []);

  const handleEnrollmentStatus = async (enrollmentId: string, status: string) => {
    setActionLoading(enrollmentId);
    try {
      const r = await fetch('/api/instructor/enrollments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId, status }) });
      if (r.ok) { fetchEnrollments(statusFilter); fetchAnalytics(); toast({ title: `Enrollment ${status}` }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    setActionLoading(null);
  };

  const handleRemoveEnrollment = (id: string) => {
    openConfirm('Remove Enrollment', 'Are you sure you want to permanently remove this enrollment? The student\'s progress and module access will also be removed.', async () => {
      setActionLoading(id);
      try {
        const r = await fetch('/api/instructor/enrollments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId: id }) });
        if (r.ok) { fetchEnrollments(statusFilter); fetchAnalytics(); toast({ title: 'Enrollment Removed' }); }
        else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Remove', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  // ── Tests ──
  const [tests, setTests] = useState<InstructorTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<InstructorTestFull | null>(null);
  const [testEnrolledStudents, setTestEnrolledStudents] = useState<{ user: { id: string; name: string; email: string; avatar: string | null } }[]>([]);
  const [testActionLoading, setTestActionLoading] = useState<string | null>(null);
  const [showTestForm, setShowTestForm] = useState(false);
  const [testForm, setTestForm] = useState({ moduleId: '', title: '', description: '', timeLimit: 30, passingScore: 70 });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 });
  const [testsSaving, setTestsSaving] = useState(false);
  const [editingTest, setEditingTest] = useState<InstructorTest | null>(null);

  const fetchTests = useCallback(async () => {
    setTestsLoading(true);
    try { const r = await fetch('/api/instructor/tests'); if (r.ok) setTests((await r.json()).tests); } catch {}
    setTestsLoading(false);
  }, []);

  const fetchTestDetail = async (testId: string) => {
    setSelectedTestId(testId);
    setSelectedTest(null);
    setTestEnrolledStudents([]);
    try {
      const r = await fetch(`/api/instructor/tests?testId=${testId}`);
      if (r.ok) {
        const d = await r.json();
        setSelectedTest(d.test);
        setTestEnrolledStudents(d.enrolledStudents || []);
      } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to load test details.', variant: 'destructive' }); }
  };

  const handleCreateTest = async () => {
    if (!testForm.moduleId || !testForm.title.trim()) { toast({ title: 'Validation Error', description: 'Module and title are required', variant: 'destructive' }); return; }
    setTestsSaving(true);
    try {
      const r = await fetch('/api/instructor/tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testForm) });
      if (r.ok) { fetchTests(); setShowTestForm(false); setTestForm({ moduleId: '', title: '', description: '', timeLimit: 30, passingScore: 70 }); toast({ title: 'Test Created' }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to create test.', variant: 'destructive' }); }
    setTestsSaving(false);
  };

  const handleUpdateTest = async () => {
    if (!editingTest) return;
    setTestsSaving(true);
    try {
      const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingTest.id, ...testForm }) });
      if (r.ok) { fetchTests(); setShowTestForm(false); setEditingTest(null); toast({ title: 'Test Updated' }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to update test.', variant: 'destructive' }); }
    setTestsSaving(false);
  };

  const handleDeleteTest = (t: InstructorTest) => {
    openConfirm('Delete Test', `Are you sure you want to delete test "${t.title}"? All questions and attempts will be removed.`, async () => {
      try {
        const r = await fetch('/api/instructor/tests', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id }) });
        if (r.ok) { fetchTests(); if (selectedTestId === t.id) { setSelectedTestId(null); setSelectedTest(null); } toast({ title: 'Test Deleted' }); }
        else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleAddQuestion = async () => {
    if (!selectedTestId || !questionForm.questionText.trim()) { toast({ title: 'Validation Error', description: 'Question text is required', variant: 'destructive' }); return; }
    setTestsSaving(true);
    try {
      const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addQuestion', testId: selectedTestId, questionText: questionForm.questionText, options: questionForm.options, correctAnswer: questionForm.correctAnswer, points: questionForm.points }) });
      if (r.ok) { fetchTestDetail(selectedTestId); setShowQuestionForm(false); setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }); toast({ title: 'Question Added' }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to add question.', variant: 'destructive' }); }
    setTestsSaving(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedTestId) return;
    openConfirm('Delete Question', 'Are you sure you want to delete this question?', async () => {
      try {
        const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteQuestion', testId: selectedTestId, questionId }) });
        if (r.ok) { fetchTestDetail(selectedTestId); toast({ title: 'Question Deleted' }); }
        else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleUnlockTest = async (testId: string, userId: string) => {
    setTestActionLoading(`${testId}-${userId}`);
    try {
      const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unlock', testId, userId }) });
      if (r.ok) { fetchTestDetail(testId); toast({ title: 'Test Unlocked' }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    setTestActionLoading(null);
  };

  const handleLockTest = async (testId: string, userId: string) => {
    setTestActionLoading(`${testId}-${userId}`);
    try {
      const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lock', testId, userId }) });
      if (r.ok) { fetchTestDetail(testId); toast({ title: 'Test Locked' }); }
      else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
    setTestActionLoading(null);
  };

  const handleResetAttempt = async (testId: string, userId: string, userName: string) => {
    openConfirm('Reset Attempt', `Are you sure you want to reset the test attempt for ${userName}?`, async () => {
      setTestActionLoading(`${testId}-${userId}`);
      try {
        const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resetAttempt', testId, userId }) });
        if (r.ok) { fetchTestDetail(testId); toast({ title: 'Attempt Reset' }); }
        else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
      setTestActionLoading(null);
    }, { confirmLabel: 'Reset', danger: true, icon: 'fa-solid fa-undo' });
  };

  const handleResetAllAttempts = (testId: string) => {
    openConfirm('Reset All Attempts', 'Are you sure you want to reset ALL attempts for this test? This cannot be undone.', async () => {
      setTestActionLoading(testId);
      try {
        const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resetAllAttempts', testId }) });
        if (r.ok) { fetchTestDetail(testId); const d = await r.json(); toast({ title: 'All Attempts Reset', description: d.message }); }
        else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed.', variant: 'destructive' }); }
      setTestActionLoading(null);
    }, { confirmLabel: 'Reset All', danger: true, icon: 'fa-solid fa-undo' });
  };

  // ── Students / Progress ──
  const [studentProgress, setStudentProgress] = useState<InstructorProgress[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<InstructorProgress | null>(null);
  const [studentStudyData, setStudentStudyData] = useState<ModuleStudy[]>([]);
  const [studyLoading, setStudyLoading] = useState(false);

  const fetchProgress = useCallback(async () => {
    setProgressLoading(true);
    try {
      const r = await fetch('/api/instructor/progress');
      if (r.ok) setStudentProgress((await r.json()).progress);
    } catch {}
    setProgressLoading(false);
  }, []);

  const fetchStudentDetail = async (p: InstructorProgress) => {
    setSelectedStudent(p);
    setStudyLoading(true);
    try {
      const r = await fetch(`/api/instructor/progress?includeStudy=true&userId=${p.userId}&courseId=${p.courseId}`);
      if (r.ok) {
        const d = await r.json();
        setStudentStudyData(d.moduleStudies || []);
      }
    } catch {}
    setStudyLoading(false);
  };

  // ── Data loading on tab change ──
  useEffect(() => {
    if (tab === 'overview') fetchAnalytics();
    else if (tab === 'courses') fetchCourses();
    else if (tab === 'modules') fetchModules(modulesCourseFilter);
    else if (tab === 'enrollments') fetchEnrollments(statusFilter);
    else if (tab === 'tests') fetchTests();
    else if (tab === 'students') fetchProgress();
  }, [tab]);

  // ── Scroll reveal observer ──
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, tab]);

  // ── Logout handler ──
  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    router.push('/');
  };

  // ── Computed values ──
  const pendingCount = enrollments.filter(e => e.status === 'pending').length;
  const activeCourseCount = courses.filter(c => c.status === 'active').length;

  // ── Loading guard ──
  if (loading || minLoading) return (
    <>
      <div className="xf-loader"><div className="xf-loader-dot" /><div className="xf-loader-dot" /><div className="xf-loader-dot" /></div>
    </>
  );
  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) return null;

  // ── Modal overlay styles ──
  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 10002,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(16px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    animation: 'confirmFadeIn 0.2s ease',
  };

  const modalCard: React.CSSProperties = {
    width: '100%', maxWidth: 560,
    background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
    backdropFilter: 'blur(24px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
    borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px color-mix(in srgb, var(--accent) 6%, transparent)',
    animation: 'confirmSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    maxHeight: '90vh', overflowY: 'auto',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid color-mix(in srgb, var(--border-color) 70%, transparent)',
    background: 'var(--input-bg)', color: 'var(--text-light)',
    fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: 'var(--text-dim)',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block',
    fontFamily: 'var(--font-heading)',
  };

  return (
    <>
    <style>{`
      @keyframes confirmFadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes confirmSlideUp { from { opacity: 0; transform: translateY(12px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
    `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--text-light)', fontFamily: "var(--font-body)", fontWeight: 400 }}>

        {/* ═══ NAV ═══ */}
        <Navbar activePage="instructor" scrolled={true} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />

        {/* ═══ HERO ═══ */}
        <section className="course-hero" style={{ minHeight: '30vh' }}>
          <div className="hero-content">
            <h1 style={{ fontFamily: "var(--font-heading)" }}>Instructor<br /><span className="v-highlight">Dashboard</span></h1>
            <div className="hero-meta" style={{ marginTop: 24 }}>
              <div className="v-step-badge"><i className="fa-solid fa-chalkboard-user" /> Courses</div>
              <div className="v-step-badge"><i className="fa-solid fa-chart-line" /> Analytics</div>
            </div>
          </div>
        </section>

        {/* ═══ STATS OVERVIEW ═══ */}
        <section className="section" style={{ paddingTop: 60, paddingBottom: 40 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { label: 'Total Students', val: analytics?.totalStudents ?? '—', color: 'var(--accent)', icon: 'fa-users', num: '01' },
              { label: 'Pending', val: analytics?.pendingEnrollments ?? '—', color: 'var(--warning-color)', icon: 'fa-clock', num: '02' },
              { label: 'Active Courses', val: activeCourseCount, color: 'var(--success-color)', icon: 'fa-graduation-cap', num: '03' },
              { label: 'Test Pass Rate', val: analytics?.overallPassRate !== undefined ? `${analytics.overallPassRate}%` : '—', color: 'var(--info-color)', icon: 'fa-chart-pie', num: '04' },
            ].map((s, i) => (
              <div key={s.label} className={`service-card reveal reveal-delay-${i + 1}`}>
                <span className="service-number" style={{ color: s.color }}>{s.num}</span>
                <i className={`fas ${s.icon} service-icon`} style={{ color: s.color }}></i>
                <h3>{s.label}</h3>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 40, fontWeight: 700, color: s.color, marginTop: 12 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ TABS ═══ */}
        <section className="section" style={{ paddingTop: 0, paddingBottom: 60 }}>
          <div className="projects-filter reveal" style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 56, flexWrap: 'wrap' }}>
            <button className={`filter-btn${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>
              <i className="fa-solid fa-chart-line" style={{ marginRight: 8 }}></i>Overview
            </button>
            <button className={`filter-btn${tab === 'courses' ? ' active' : ''}`} onClick={() => setTab('courses')}>
              <i className="fa-solid fa-graduation-cap" style={{ marginRight: 8 }}></i>Courses
            </button>
            <button className={`filter-btn${tab === 'modules' ? ' active' : ''}`} onClick={() => setTab('modules')}>
              <i className="fa-solid fa-key" style={{ marginRight: 8 }}></i>Modules
            </button>
            <button className={`filter-btn${tab === 'enrollments' ? ' active' : ''}`} onClick={() => setTab('enrollments')}>
              <i className="fa-solid fa-user-graduate" style={{ marginRight: 8 }}></i>Enrollments{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
            <button className={`filter-btn${tab === 'tests' ? ' active' : ''}`} onClick={() => setTab('tests')}>
              <i className="fa-solid fa-file-alt" style={{ marginRight: 8 }}></i>Tests
            </button>
            <button className={`filter-btn${tab === 'students' ? ' active' : ''}`} onClick={() => setTab('students')}>
              <i className="fa-solid fa-users" style={{ marginRight: 8 }}></i>Students
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════
              OVERVIEW TAB
              ═══════════════════════════════════════════════════ */}
          {tab === 'overview' && (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              {/* Analytics Cards */}
              <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
                <div style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-user-check" style={{ color: 'var(--accent)', fontSize: 16 }}></i>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Approved Enrollments</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>{analytics?.approvedEnrollments ?? 0}</div>
                </div>

                <div style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-hourglass-half" style={{ color: 'var(--warning-color)', fontSize: 16 }}></i>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending Enrollments</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: 'var(--warning-color)' }}>{analytics?.pendingEnrollments ?? 0}</div>
                </div>

                <div style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-book-open" style={{ color: 'var(--success-color)', fontSize: 16 }}></i>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Courses</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: 'var(--success-color)' }}>{activeCourseCount}</div>
                </div>

                <div style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'color-mix(in srgb, var(--info-color) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--info-color) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-trophy" style={{ color: 'var(--info-color)', fontSize: 16 }}></i>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Test Pass Rate</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: 'var(--info-color)' }}>{analytics?.overallPassRate ?? 0}%</div>
                </div>
              </div>

              {/* Course Popularity */}
              {analytics?.coursePopularity && analytics.coursePopularity.length > 0 && (
                <div className="reveal" style={{ marginBottom: 40 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--text-light)', marginBottom: 20 }}>
                    <i className="fa-solid fa-fire" style={{ color: 'var(--accent)', marginRight: 10 }}></i>Course Popularity
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analytics.coursePopularity.map((cp, i) => {
                      const maxCount = Math.max(...analytics.coursePopularity.map(c => c._count.id), 1);
                      const pct = Math.round((cp._count.id / maxCount) * 100);
                      return (
                        <div key={i} style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 10, padding: '14px 20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)' }}>{cp.courseName}</span>
                            <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{cp._count.id} enrollments</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--input-bg)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: 'var(--accent)', transition: 'width 0.5s ease' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Test Pass Rates */}
              {analytics?.testPassRates && analytics.testPassRates.length > 0 && (
                <div className="reveal" style={{ marginBottom: 40 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--text-light)', marginBottom: 20 }}>
                    <i className="fa-solid fa-chart-bar" style={{ color: 'var(--accent)', marginRight: 10 }}></i>Test Performance
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {analytics.testPassRates.map((tr, i) => (
                      <div key={i} style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 10, padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 4 }}>{tr.testTitle}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>{tr.moduleTitle}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--input-bg)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${tr.passRate}%`, borderRadius: 3, background: tr.passRate >= 70 ? 'var(--success-color)' : tr.passRate >= 50 ? 'var(--warning-color)' : 'var(--error-color)', transition: 'width 0.5s ease' }}></div>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: tr.passRate >= 70 ? 'var(--success-color)' : tr.passRate >= 50 ? 'var(--warning-color)' : 'var(--error-color)' }}>{tr.passRate}%</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>{tr.passedAttempts}/{tr.totalAttempts} passed</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity (Daily Trends) */}
              {analytics?.dailyTrends && (
                <div className="reveal">
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--text-light)', marginBottom: 20 }}>
                    <i className="fa-solid fa-calendar-week" style={{ color: 'var(--accent)', marginRight: 10 }}></i>Enrollment Trends (Last 7 Days)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                    {Object.entries(analytics.dailyTrends).map(([date, count]) => {
                      const numCount = Number(count);
                      const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                      const maxCount = Math.max(...Object.values(analytics.dailyTrends).map(Number), 1);
                      const pct = Math.round((numCount / maxCount) * 100);
                      return (
                        <div key={date} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>{dayName}</div>
                          <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 8 }}>
                            <div style={{ width: '60%', height: `${Math.max(pct, 8)}%`, borderRadius: 6, background: numCount > 0 ? 'var(--accent)' : 'var(--input-bg)', transition: 'height 0.5s ease', minHeight: 6 }}></div>
                          </div>
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: numCount > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>{numCount}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              COURSES TAB
              ═══════════════════════════════════════════════════ */}
          {tab === 'courses' && (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--text-light)' }}>
                  Your Courses ({courses.length})
                </h3>
                <button onClick={openNewCourseForm} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 12 }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: 8 }}></i>Add Course
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="reveal" style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <i className="fa-solid fa-graduation-cap" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Courses Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>Create your first course to start teaching.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  {courses.map((c, idx) => (
                    <div key={c.id} className="project-card reveal" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className={c.icon || 'fa-solid fa-book'} style={{ color: 'var(--accent)', fontSize: 18 }}></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-light)' }}>{c.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.level} &middot; {c.duration}</div>
                          </div>
                        </div>
                        <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: c.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: c.status === 'active' ? 'var(--success-color)' : 'var(--error-color)', border: c.status === 'active' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>{c.status}</span>
                      </div>

                      {c.description && <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>}

                      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-dim)' }}>
                        <span><i className="fa-solid fa-puzzle-piece" style={{ marginRight: 4, color: 'var(--accent)' }}></i>{c.moduleCount} modules</span>
                        <span><i className="fa-solid fa-users" style={{ marginRight: 4, color: 'var(--accent)' }}></i>{c.enrollmentCount} students</span>
                        <span><i className="fa-solid fa-tag" style={{ marginRight: 4, color: 'var(--accent)' }}></i>{c.price}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, borderTop: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', paddingTop: 16 }}>
                        <button onClick={() => openEditCourseForm(c)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 11 }}>
                          <i className="fa-solid fa-pen" style={{ marginRight: 6 }}></i>Edit
                        </button>
                        <button onClick={() => handleDeleteCourse(c)} className="btn" style={{ padding: '8px 16px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                          <i className="fa-solid fa-trash-alt" style={{ marginRight: 6 }}></i>Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              MODULES TAB
              ═══════════════════════════════════════════════════ */}
          {tab === 'modules' && (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--text-light)' }}>Modules</h3>
                  <select value={modulesCourseFilter} onChange={e => { setModulesCourseFilter(e.target.value); fetchModules(e.target.value); }} style={{ ...inputStyle, width: 'auto', minWidth: 180, padding: '8px 12px', fontSize: 12 }}>
                    <option value="all">All Courses</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <button onClick={openNewModuleForm} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 12 }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: 8 }}></i>Add Module
                </button>
              </div>

              {modulesLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)' }}></i></div>
              ) : modules.length === 0 ? (
                <div className="reveal" style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <i className="fa-solid fa-puzzle-piece" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Modules Found</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>Create modules to organize your course content.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {modules.map((m, idx) => {
                    const courseName = courses.find(c => c.id === m.courseId)?.title || m.courseId;
                    return (
                      <div key={m.id} className="project-card reveal" style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: 'var(--accent)' }}>
                              {String(m.moduleOrder).padStart(2, '0')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-light)' }}>{m.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{courseName} &middot; {m.testCount} test{m.testCount !== 1 ? 's' : ''} &middot; {m.unlocks?.length || 0} unlocked</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setShowModuleUnlock(showModuleUnlock === m.id ? null : m.id)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 11 }}>
                              <i className="fa-solid fa-key" style={{ marginRight: 6 }}></i>{showModuleUnlock === m.id ? 'Hide' : 'Unlocks'}
                            </button>
                            <button onClick={() => openEditModuleForm(m)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 11 }}>
                              <i className="fa-solid fa-pen" style={{ marginRight: 6 }}></i>Edit
                            </button>
                            <button onClick={() => handleDeleteModule(m)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                              <i className="fa-solid fa-trash-alt" style={{ marginRight: 6 }}></i>
                            </button>
                          </div>
                        </div>

                        {/* Unlock panel */}
                        {showModuleUnlock === m.id && (
                          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                              <i className="fa-solid fa-lock-open" style={{ marginRight: 6 }}></i>Unlocked for {m.unlocks?.length || 0} student{m.unlocks?.length !== 1 ? 's' : ''}
                            </div>
                            {m.unlocks && m.unlocks.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {m.unlocks.map(u => (
                                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--accent) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{u.user.name}</span>
                                    <button onClick={() => handleLockModule(u.userId, m.id)} disabled={unlockLoading === `${u.userId}-${m.id}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)', fontSize: 11, padding: '2px 4px' }}>
                                      <i className={unlockLoading === `${u.userId}-${m.id}` ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-times'}></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--text-dim)', opacity: 0.7 }}>No students unlocked yet.</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              ENROLLMENTS TAB
              ═══════════════════════════════════════════════════ */}
          {tab === 'enrollments' && (
            <>
              <div className="projects-filter reveal" style={{ justifyContent: 'center', marginBottom: 48 }}>
                {['all', 'pending', 'approved', 'declined'].map(s => (
                  <button key={s} className={`filter-btn${statusFilter === s ? ' active' : ''}`} onClick={() => { setStatusFilter(s); fetchEnrollments(s); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>

              <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                {enrollments.length === 0 ? (
                  <div className="reveal" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <i className="fa-solid fa-inbox" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Enrollments Found</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>{statusFilter !== 'all' ? 'Try changing the filter.' : 'Enrollment requests will appear here.'}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {enrollments.map((e, idx) => {
                      const sb = statusBadge(e.status);
                      return (
                        <div key={e.id} className="project-card reveal" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 250 }}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: e.user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 16, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                                {e.user.avatar ? <img src={e.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : e.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-light)', marginBottom: 2 }}>{e.user.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{e.user.email}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                              <span style={{ padding: '4px 16px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: sb.bg, color: sb.color, border: sb.border }}>{e.status}</span>
                              <span style={{ fontSize: 12, color: 'var(--text-dim)', minWidth: 130, textAlign: 'right' }}>{fmt(e.enrolledAt)}</span>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16, paddingLeft: 58 }}>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Course</div>
                              <div style={{ fontSize: 14, color: 'var(--text-light)', fontWeight: 700 }}>{e.courseName}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Experience</div>
                              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{e.experienceLevel || e.courseLevel}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Duration</div>
                              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{e.duration}</div>
                            </div>
                            {e.motivation && (
                              <div style={{ flex: '1 1 100%' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Motivation</div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 500 }}>{e.motivation}</div>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: 10, paddingLeft: 58, paddingTop: 14, borderTop: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)' }}>
                            {e.status === 'pending' && (
                              <>
                                <button onClick={() => handleEnrollmentStatus(e.id, 'approved')} disabled={actionLoading === e.id} className="btn btn-primary" style={{ padding: '9px 24px', fontSize: 11 }}>
                                  <i className={actionLoading === e.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'} style={{ marginRight: 6 }}></i>Approve
                                </button>
                                <button onClick={() => handleEnrollmentStatus(e.id, 'declined')} disabled={actionLoading === e.id} className="btn btn-secondary" style={{ padding: '9px 24px', fontSize: 11 }}>
                                  <i className={actionLoading === e.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-times'} style={{ marginRight: 6 }}></i>Decline
                                </button>
                              </>
                            )}
                            <button onClick={() => handleRemoveEnrollment(e.id)} disabled={actionLoading === e.id} className="btn" style={{ padding: '9px 24px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)', marginLeft: 'auto' }}>
                              <i className={actionLoading === e.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'} style={{ marginRight: 6 }}></i>Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════
              TESTS TAB
              ═══════════════════════════════════════════════════ */}
          {tab === 'tests' && (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--text-light)' }}>Tests ({tests.length})</h3>
                <button onClick={() => { setEditingTest(null); setTestForm({ moduleId: '', title: '', description: '', timeLimit: 30, passingScore: 70 }); setShowTestForm(true); }} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 12 }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: 8 }}></i>Create Test
                </button>
              </div>

              {testsLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)' }}></i></div>
              ) : tests.length === 0 ? (
                <div className="reveal" style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <i className="fa-solid fa-file-alt" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Tests Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>Create tests to evaluate your students.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {tests.map((t, idx) => {
                    const courseName = courses.find(c => c.id === t.courseId)?.title || t.courseId;
                    return (
                      <div key={t.id} className="project-card reveal" style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-light)', marginBottom: 4 }}>{t.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                              <i className="fa-solid fa-puzzle-piece" style={{ marginRight: 4 }}></i>{t.moduleTitle} &middot;
                              <i className="fa-solid fa-list-ol" style={{ marginLeft: 8, marginRight: 4 }}></i>{t.questionCount} Qs &middot;
                              <i className="fa-solid fa-pen-to-square" style={{ marginLeft: 8, marginRight: 4 }}></i>{t.attemptCount} attempts &middot;
                              <i className="fa-solid fa-clock" style={{ marginLeft: 8, marginRight: 4 }}></i>{t.timeLimit}m &middot;
                              <i className="fa-solid fa-bullseye" style={{ marginLeft: 8, marginRight: 4 }}></i>{t.passingScore}% pass
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => fetchTestDetail(t.id)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 11 }}>
                              <i className="fa-solid fa-eye" style={{ marginRight: 6 }}></i>View
                            </button>
                            <button onClick={() => { setEditingTest(t); setTestForm({ moduleId: t.moduleId, title: t.title, description: t.description, timeLimit: t.timeLimit, passingScore: t.passingScore }); setShowTestForm(true); }} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 11 }}>
                              <i className="fa-solid fa-pen" style={{ marginRight: 6 }}></i>Edit
                            </button>
                            <button onClick={() => handleDeleteTest(t)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                              <i className="fa-solid fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Test Detail Panel */}
              {selectedTest && (
                <div className="reveal" style={{ marginTop: 32, background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', borderRadius: 12, padding: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--text-light)' }}>{selectedTest.title}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{selectedTest.module.title} &middot; {selectedTest.questions.length} questions &middot; {selectedTest.attempts.length} attempts</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setShowQuestionForm(true)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 11 }}>
                        <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>Add Question
                      </button>
                      <button onClick={() => handleResetAllAttempts(selectedTest.id)} disabled={testActionLoading === selectedTest.id} className="btn" style={{ padding: '8px 16px', fontSize: 11, background: 'transparent', border: '1px solid rgba(234,179,8,0.4)', color: 'var(--warning-color)' }}>
                        <i className={testActionLoading === selectedTest.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-undo'} style={{ marginRight: 6 }}></i>Reset All
                      </button>
                      <button onClick={() => { setSelectedTest(null); setSelectedTestId(null); }} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 11 }}>
                        <i className="fa-solid fa-times" style={{ marginRight: 6 }}></i>Close
                      </button>
                    </div>
                  </div>

                  {/* Questions */}
                  <div style={{ marginBottom: 28 }}>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 14 }}>
                      <i className="fa-solid fa-list-ol" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Questions
                    </h4>
                    {selectedTest.questions.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', opacity: 0.7 }}>No questions yet. Add some to make this test functional.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {selectedTest.questions.map((q, qi) => {
                          let options: string[] = [];
                          try { options = JSON.parse(q.options); } catch { options = []; }
                          return (
                            <div key={q.id} style={{ background: 'var(--input-bg)', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>
                                  <span style={{ color: 'var(--accent)', marginRight: 8 }}>Q{qi + 1}.</span>{q.questionText}
                                </div>
                                {options.length > 0 && (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 4 }}>
                                    {options.map((opt, oi) => (
                                      <div key={oi} style={{ fontSize: 12, color: oi === q.correctAnswer ? 'var(--success-color)' : 'var(--text-dim)', fontWeight: oi === q.correctAnswer ? 700 : 400, padding: '2px 8px', borderRadius: 4, background: oi === q.correctAnswer ? 'rgba(34,197,94,0.08)' : 'transparent' }}>
                                        {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctAnswer && <i className="fa-solid fa-check" style={{ marginLeft: 4, fontSize: 10 }}></i>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)', fontSize: 12, padding: 4 }}>
                                <i className="fa-solid fa-trash-alt"></i>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Test Unlocks */}
                  <div style={{ marginBottom: 28 }}>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 14 }}>
                      <i className="fa-solid fa-key" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Test Access
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {testEnrolledStudents.map(es => {
                        const isUnlocked = selectedTest.unlocks.some(u => u.userId === es.user.id);
                        const isLoading = testActionLoading === `${selectedTest.id}-${es.user.id}`;
                        return (
                          <div key={es.user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: isUnlocked ? 'rgba(34,197,94,0.08)' : 'var(--input-bg)', border: isUnlocked ? '1px solid rgba(34,197,94,0.2)' : '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{es.user.name}</span>
                            <button
                              onClick={() => isUnlocked ? handleLockTest(selectedTest.id, es.user.id) : handleUnlockTest(selectedTest.id, es.user.id)}
                              disabled={isLoading}
                              style={{ background: 'none', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', color: isUnlocked ? 'var(--success-color)' : 'var(--text-dim)', fontSize: 11, padding: '2px 6px' }}
                              title={isUnlocked ? 'Lock test' : 'Unlock test'}
                            >
                              <i className={isLoading ? 'fa-solid fa-spinner fa-spin' : isUnlocked ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock'}></i>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grades / Attempts */}
                  {selectedTest.attempts.length > 0 && (
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 14 }}>
                        <i className="fa-solid fa-chart-bar" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Grades
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedTest.attempts.map(a => (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: 'var(--input-bg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', overflow: 'hidden' }}>
                                {a.user.avatar ? <img src={a.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : a.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{a.user.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.submittedAt ? fmtTime(a.submittedAt) : 'In progress'}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: a.passed ? 'var(--success-color)' : 'var(--error-color)' }}>{a.score}/{a.totalPoints}</div>
                                <div style={{ fontSize: 10, color: a.passed ? 'var(--success-color)' : 'var(--error-color)', fontWeight: 700 }}>{a.passed ? 'PASSED' : 'FAILED'}</div>
                              </div>
                              <button onClick={() => handleResetAttempt(selectedTest.id, a.userId, a.user.name)} disabled={testActionLoading === `${selectedTest.id}-${a.userId}`} style={{ background: 'none', border: '1px solid rgba(234,179,8,0.4)', borderRadius: 6, cursor: 'pointer', color: 'var(--warning-color)', fontSize: 10, padding: '4px 10px' }} title="Reset attempt">
                                <i className={testActionLoading === `${selectedTest.id}-${a.userId}` ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-undo'} style={{ marginRight: 4 }}></i>Reset
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              STUDENTS TAB
              ═══════════════════════════════════════════════════ */}
          {tab === 'students' && (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div className="reveal" style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'var(--text-light)' }}>
                  Student Progress ({studentProgress.length})
                </h3>
              </div>

              {progressLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--accent)' }}></i></div>
              ) : studentProgress.length === 0 ? (
                <div className="reveal" style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <i className="fa-solid fa-users" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Students Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>Students will appear here once they enroll in your courses.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {studentProgress.map((p, idx) => {
                    const pc = progressColor(p.completionPercentage);
                    return (
                      <div key={p.id} className="project-card reveal" style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: p.user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 16, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                              {p.user.avatar ? <img src={p.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : p.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-light)' }}>{p.user.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.user.email} &middot; {p.courseName}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: pc.bg, color: pc.text, border: `1px solid color-mix(in srgb, ${pc.text} 25%, transparent)` }}>{pc.label}</span>
                            <button onClick={() => fetchStudentDetail(p)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 11 }}>
                              <i className="fa-solid fa-eye" style={{ marginRight: 6 }}></i>Details
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginTop: 16, paddingLeft: 58 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.completedModules.length}/{p.totalModules} modules completed</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: pc.text }}>{p.completionPercentage}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--input-bg)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${p.completionPercentage}%`, borderRadius: 3, background: pc.bar, transition: 'width 0.5s ease' }}></div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>Last accessed: {fmt(p.lastAccessed)}</div>
                        </div>

                        {/* Student Detail Panel */}
                        {selectedStudent?.id === p.id && (
                          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', paddingLeft: 58 }}>
                            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 14 }}>
                              <i className="fa-solid fa-chart-line" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Module Details
                            </h4>
                            {studyLoading ? (
                              <div style={{ textAlign: 'center', padding: 20 }}><i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--accent)' }}></i></div>
                            ) : studentStudyData.length === 0 ? (
                              <p style={{ fontSize: 13, color: 'var(--text-dim)', opacity: 0.7 }}>No module data available.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {studentStudyData.map(ms => (
                                  <div key={ms.moduleId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, background: 'var(--input-bg)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 12, color: 'var(--accent)', width: 28 }}>M{String(ms.moduleOrder).padStart(2, '0')}</span>
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>{ms.moduleTitle}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                          {ms.studied ? (
                                            <span style={{ color: 'var(--success-color)' }}><i className="fa-solid fa-check" style={{ marginRight: 4 }}></i>Studied</span>
                                          ) : (
                                            <span>Not started</span>
                                          )}
                                          {ms.timeSpent > 0 && <span style={{ marginLeft: 10 }}><i className="fa-solid fa-clock" style={{ marginRight: 3 }}></i>{formatDuration(ms.timeSpent)}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                      {ms.testScores.map(ts => (
                                        <div key={ts.testId} style={{ textAlign: 'right' }}>
                                          <div style={{ fontSize: 12, fontWeight: 700, color: ts.passed ? 'var(--success-color)' : ts.score > 0 ? 'var(--error-color)' : 'var(--text-dim)' }}>
                                            {ts.score > 0 ? `${ts.score}/${ts.totalPoints}` : '—'}
                                          </div>
                                          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{ts.testTitle}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════════════ */}

      {/* Confirm Modal */}
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

      {/* Course Form Modal */}
      {showCourseForm && (
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowCourseForm(false); }}>
          <div style={modalCard}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: 'var(--text-light)' }}>{editingCourse ? 'Edit Course' : 'Create Course'}</h3>
              <button onClick={() => setShowCourseForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 16, padding: 4 }}><i className="fa-solid fa-times"></i></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} placeholder="Course title" value={courseForm.title} onChange={e => handleCourseTitleChange(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Slug</label>
                <input style={inputStyle} placeholder="course-slug" value={courseForm.slug} onChange={e => setCourseForm(f => ({ ...f, slug: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Course description" value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Level</label>
                  <select style={inputStyle} value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Duration</label>
                  <input style={inputStyle} placeholder="e.g. 8 Weeks" value={courseForm.duration} onChange={e => setCourseForm(f => ({ ...f, duration: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Price</label>
                  <input style={inputStyle} placeholder="e.g. Free or $99" value={courseForm.price} onChange={e => setCourseForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Icon (FontAwesome)</label>
                  <input style={inputStyle} placeholder="fa-solid fa-book" value={courseForm.icon} onChange={e => setCourseForm(f => ({ ...f, icon: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={courseForm.status} onChange={e => setCourseForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Features</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="Add a feature" value={courseFeatureInput} onChange={e => setCourseFeatureInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const t = courseFeatureInput.trim(); if (t) { setCourseForm(f => ({ ...f, features: [...f.features, t] })); setCourseFeatureInput(''); } } }} />
                  <button onClick={() => { const t = courseFeatureInput.trim(); if (t) { setCourseForm(f => ({ ...f, features: [...f.features, t] })); setCourseFeatureInput(''); } }} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}><i className="fa-solid fa-plus"></i></button>
                </div>
                {courseForm.features.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {courseForm.features.map((f, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)', fontSize: 12, color: 'var(--text-light)' }}>
                        {f}
                        <button onClick={() => setCourseForm(prev => ({ ...prev, features: prev.features.filter((_, fi) => fi !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-color)', fontSize: 10, padding: 0 }}><i className="fa-solid fa-times"></i></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Prerequisites</label>
                <input style={inputStyle} placeholder="Course prerequisites" value={courseForm.prerequisites} onChange={e => setCourseForm(f => ({ ...f, prerequisites: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Tech Stack</label>
                <input style={inputStyle} placeholder="e.g. Python, TensorFlow, PyTorch" value={courseForm.techStack} onChange={e => setCourseForm(f => ({ ...f, techStack: e.target.value }))} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowCourseForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 12, background: 'transparent', border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
              <button onClick={editingCourse ? handleSaveCourse : handleSaveCourse} disabled={courseSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 12 }}>
                {courseSaving && <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>}
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Form Modal */}
      {showModuleForm && (
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowModuleForm(false); }}>
          <div style={modalCard}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: 'var(--text-light)' }}>{editingModule ? 'Edit Module' : 'Add Module'}</h3>
              <button onClick={() => setShowModuleForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 16, padding: 4 }}><i className="fa-solid fa-times"></i></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {!editingModule && (
                <div>
                  <label style={labelStyle}>Course</label>
                  <select style={inputStyle} value={moduleForm.courseId} onChange={e => setModuleForm(f => ({ ...f, courseId: e.target.value }))}>
                    <option value="">Select a course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} placeholder="Module title" value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Module description" value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Content (Markdown)</label>
                <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }} placeholder="Module content in markdown..." value={moduleForm.content} onChange={e => setModuleForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Module Order</label>
                <input type="number" style={inputStyle} value={moduleForm.moduleOrder} onChange={e => setModuleForm(f => ({ ...f, moduleOrder: parseInt(e.target.value) || 1 }))} min={1} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowModuleForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 12, background: 'transparent', border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
              <button onClick={handleSaveModule} disabled={moduleSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 12 }}>
                {moduleSaving && <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>}
                {editingModule ? 'Update Module' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Form Modal */}
      {showTestForm && (
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowTestForm(false); }}>
          <div style={modalCard}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: 'var(--text-light)' }}>{editingTest ? 'Edit Test' : 'Create Test'}</h3>
              <button onClick={() => setShowTestForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 16, padding: 4 }}><i className="fa-solid fa-times"></i></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {!editingTest && (
                <div>
                  <label style={labelStyle}>Module</label>
                  <select style={inputStyle} value={testForm.moduleId} onChange={e => setTestForm(f => ({ ...f, moduleId: e.target.value }))}>
                    <option value="">Select a module</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title} ({courses.find(c => c.id === m.courseId)?.title || 'Unknown'})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} placeholder="Test title" value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Test description" value={testForm.description} onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Time Limit (minutes)</label>
                  <input type="number" style={inputStyle} value={testForm.timeLimit} onChange={e => setTestForm(f => ({ ...f, timeLimit: parseInt(e.target.value) || 30 }))} min={1} />
                </div>
                <div>
                  <label style={labelStyle}>Passing Score (%)</label>
                  <input type="number" style={inputStyle} value={testForm.passingScore} onChange={e => setTestForm(f => ({ ...f, passingScore: parseInt(e.target.value) || 70 }))} min={0} max={100} />
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowTestForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 12, background: 'transparent', border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
              <button onClick={editingTest ? handleUpdateTest : handleCreateTest} disabled={testsSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 12 }}>
                {testsSaving && <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>}
                {editingTest ? 'Update Test' : 'Create Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowQuestionForm(false); }}>
          <div style={modalCard}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: 'var(--text-light)' }}>Add Question</h3>
              <button onClick={() => setShowQuestionForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 16, padding: 4 }}><i className="fa-solid fa-times"></i></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Question Text</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Enter your question" value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Options</label>
                {questionForm.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input type="radio" name="correctAnswer" checked={questionForm.correctAnswer === i} onChange={() => setQuestionForm(f => ({ ...f, correctAnswer: i }))} style={{ accentColor: 'var(--accent)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', width: 20 }}>{String.fromCharCode(65 + i)}</span>
                    <input style={inputStyle} placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt} onChange={e => { const newOpts = [...questionForm.options]; newOpts[i] = e.target.value; setQuestionForm(f => ({ ...f, options: newOpts })); }} />
                  </div>
                ))}
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Select the radio button next to the correct answer.</div>
              </div>
              <div>
                <label style={labelStyle}>Points</label>
                <input type="number" style={{ ...inputStyle, width: 100 }} value={questionForm.points} onChange={e => setQuestionForm(f => ({ ...f, points: parseInt(e.target.value) || 1 }))} min={1} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowQuestionForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 12, background: 'transparent', border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
              <button onClick={handleAddQuestion} disabled={testsSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 12 }}>
                {testsSaving && <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>}Add Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ GLOBAL MODALS ═══ */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => { router.push(link); setSearchOpen(false); }} />
    </>
  );
}
