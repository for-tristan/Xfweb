'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePageFeatures } from '@/lib/usePageFeatures';
import ConfirmModal from '@/components/ConfirmModal';
import ReactMarkdown from 'react-markdown';
import { Navbar } from '@/components/Navbar';
import { SearchModal } from '@/lib/PageModals';
import { WaveInput } from '@/components/WaveInput';
import { WaveTextarea } from '@/components/WaveTextarea';
import GradualBlur from '@/components/GradualBlur';
import { SmartImage } from '@/components/SmartImage';

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
  isGlobal: boolean;
  moduleCount: number;
  enrollmentCount: number;
  instructor?: { id: string; name: string; email: string; avatar: string | null };
  createdAt: string;
  updatedAt: string;
}

interface CourseModuleItem {
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

interface InstructorTest {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  questionCount: number;
  attemptCount: number;
  moduleTitle: string;
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

interface InstructorAnalytics {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  pendingEnrollments: number;
  approvedEnrollments: number;
  totalModules: number;
  totalTests: number;
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

  const authCheckedRef = useRef(false);
  useEffect(() => {
    if (loading || authCheckedRef.current) return;
    authCheckedRef.current = true;
    if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      router.push('/');
      toast({ title: 'Access Denied', description: 'Instructor access required', variant: 'destructive' });
    }
  }, [loading, user]);

  const [tab, setTab] = useState<'enrollments' | 'courses' | 'tests' | 'students'>('enrollments');
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    const checkBottom = () => setAtBottom(window.innerHeight + window.scrollY >= document.body.scrollHeight - 80);
    window.addEventListener('scroll', checkBottom);
    checkBottom();

    return () => { observer.disconnect(); window.removeEventListener('scroll', checkBottom); };
  }, [loading]);

  // ─── Analytics ───
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

  // ─── Enrollments ───
  const [enrollments, setEnrollments] = useState<InstructorEnrollment[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async (status?: string) => {
    try { const p = status && status !== 'all' ? `?status=${status}` : ''; const r = await fetch(`/api/instructor/enrollments${p}`); if (r.ok) setEnrollments((await r.json()).enrollments); } catch {}
  }, []);

  const handleStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try { const r = await fetch('/api/instructor/enrollments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId: id, status }) }); if (r.ok) fetchEnrollments(statusFilter); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setActionLoading(null);
  };

  const handleRemove = (id: string) => {
    openConfirm('Remove Enrollment', 'Are you sure you want to permanently remove this enrollment? This action cannot be undone.', async () => {
      setActionLoading(id);
      try { const r = await fetch('/api/instructor/enrollments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId: id }) }); if (r.ok) fetchEnrollments(statusFilter); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Remove', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  // ─── Courses ───
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<InstructorCourse | null>(null);
  const [courseForm, setCourseForm] = useState({ title: '', slug: '', description: '', level: 'beginner', duration: '', price: '', icon: 'fa-solid fa-book', status: 'active' as string, features: [] as string[], prerequisites: '', techStack: '' });
  const [courseFeatureInput, setCourseFeatureInput] = useState('');
  const [courseSaving, setCourseSaving] = useState(false);

  // ─── Modules (inside courses) ───
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [courseModules, setCourseModules] = useState<CourseModuleItem[]>([]);
  const [courseModulesLoading, setCourseModulesLoading] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', content: '', moduleOrder: 1 });
  const [modulePreviewOpen, setModulePreviewOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModuleItem | null>(null);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try { const r = await fetch('/api/instructor/courses'); if (r.ok) setCourses((await r.json()).courses); } catch {}
    setCoursesLoading(false);
  }, []);

  const fetchCourseModules = useCallback(async (courseId: string) => {
    setCourseModulesLoading(true);
    try { const r = await fetch(`/api/instructor/modules?courseId=${courseId}`); if (r.ok) { const d = await r.json(); setCourseModules(d.modules || []); } } catch {}
    setCourseModulesLoading(false);
  }, []);

  const openNewCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({ title: '', slug: '', description: '', level: 'beginner', duration: '', price: '', icon: 'fa-solid fa-book', status: 'active', features: [], prerequisites: '', techStack: '' });
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
      if (r.ok) { fetchCourses(); fetchAnalytics(); setShowCourseForm(false); } else { const d = await r.json(); toast({ title: 'Error', description: `${d.error}${d.details ? '. ' + d.details : ''}`, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Failed to save course.', variant: 'destructive' }); }
    setCourseSaving(false);
  };

  const handleToggleCourseStatus = async (c: InstructorCourse) => {
    setActionLoading(c.id);
    const newStatus = c.status === 'active' ? 'hidden' : 'active';
    try { const r = await fetch('/api/instructor/courses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, status: newStatus }) }); if (r.ok) fetchCourses(); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setActionLoading(null);
  };

  const handleDeleteCourse = (c: InstructorCourse) => {
    openConfirm('Delete Course', `Are you sure you want to delete course "${c.title}"? All modules for this course will also be deleted. Existing enrollments won't cascade, but student access to course content will be affected.`, async () => {
      setActionLoading(c.id);
      try { const r = await fetch('/api/instructor/courses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) }); if (r.ok) { fetchCourses(); fetchAnalytics(); if (expandedCourseId === c.id) { setExpandedCourseId(null); setCourseModules([]); } } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
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
      const r = await fetch('/api/instructor/modules', { method: editingModule ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingModule ? { ...body, id: editingModule.id } : body) });
      if (r.ok) { fetchCourseModules(expandedCourseId); fetchCourses(); setShowModuleForm(false); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save module.', variant: 'destructive' }); }
    setModuleSaving(false);
  };

  const handleDeleteModule = (m: CourseModuleItem) => {
    openConfirm('Delete Module', `Are you sure you want to delete module "${m.title}"? This action cannot be undone.`, async () => {
      setActionLoading(m.id);
      try { const r = await fetch('/api/instructor/modules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId: m.id }) }); if (r.ok) { fetchCourseModules(expandedCourseId!); fetchCourses(); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleUnlock = async (userId: string, moduleId: string) => {
    const key = `${userId}-${moduleId}`;
    setUnlockLoading(key);
    try { const r = await fetch('/api/instructor/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, moduleId }) }); if (r.ok) fetchCourseModules(expandedCourseId!); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setUnlockLoading(null);
  };

  const handleLock = async (userId: string, moduleId: string) => {
    const key = `${userId}-${moduleId}`;
    setUnlockLoading(key);
    try { const r = await fetch('/api/instructor/modules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, moduleId }) }); if (r.ok) fetchCourseModules(expandedCourseId!); else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' }); } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setUnlockLoading(null);
  };

  // ─── Tests ───
  const [instructorTests, setInstructorTests] = useState<InstructorTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsSaving, setTestsSaving] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<InstructorTestFull | null>(null);
  const [testEnrolledStudents, setTestEnrolledStudents] = useState<{ user: { id: string; name: string; email: string; avatar: string | null } }[]>([]);
  const [testActionLoading, setTestActionLoading] = useState<string | null>(null);
  const [showTestForm, setShowTestForm] = useState(false);
  const [testForm, setTestForm] = useState({ moduleId: '', title: '', description: '', timeLimit: 30, passingScore: 70 });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 });
  const [allModules, setAllModules] = useState<CourseModuleItem[]>([]);

  const fetchTests = useCallback(async () => {
    setTestsLoading(true);
    try { const r = await fetch('/api/instructor/tests'); if (r.ok) setInstructorTests((await r.json()).tests); } catch {}
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
      } else { const d = await r.json(); toast({ title: 'Error', description: `${d.error}${d.details ? '. ' + d.details : ''}`, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Failed to load test details.', variant: 'destructive' }); }
  };

  const handleCreateTest = async () => {
    if (!testForm.moduleId || !testForm.title.trim()) { toast({ title: 'Validation Error', description: 'Module and title are required', variant: 'destructive' }); return; }
    setTestsSaving(true);
    try {
      const r = await fetch('/api/instructor/tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testForm) });
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
      const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addQuestion', testId: selectedTestId, questionText: questionForm.questionText, options: validOptions, correctAnswer: questionForm.correctAnswer, points: questionForm.points }) });
      if (r.ok) { fetchTestDetail(selectedTestId); fetchTests(); setShowQuestionForm(false); setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
    setTestsSaving(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedTestId) return;
    openConfirm('Delete Question', 'Are you sure you want to delete this question? This action cannot be undone.', async () => {
      setTestActionLoading(questionId);
      try {
        const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteQuestion', testId: selectedTestId, questionId }) });
        if (r.ok) { fetchTestDetail(selectedTestId); fetchTests(); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
      setTestActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleResetAttempt = (testId: string, userId: string, userName: string) => {
    openConfirm('Reset Attempt', `Are you sure you want to reset ${userName}'s attempt? They will be able to retake the test.`, async () => {
      setTestActionLoading(`reset-${userId}`);
      try {
        const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resetAttempt', testId, userId }) });
        if (r.ok) { if (selectedTestId === testId) fetchTestDetail(testId); fetchTests(); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Operation failed. Please try again.', variant: 'destructive' }); }
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

  const handleDeleteTest = (testId: string) => {
    openConfirm('Delete Test', 'Are you sure you want to delete this test and all its questions, attempts, and unlocks? This action cannot be undone.', async () => {
      setTestActionLoading(testId);
      try {
        const r = await fetch('/api/instructor/tests', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: testId }) });
        if (r.ok) { fetchTests(); if (selectedTestId === testId) { setSelectedTestId(null); setSelectedTest(null); } } else { const d = await r.json(); toast({ title: 'Error', description: `${d.error}${d.details ? '. ' + d.details : ''}`, variant: 'destructive' }); }
      } catch { toast({ title: 'Error', description: 'Failed to delete test.', variant: 'destructive' }); }
      setTestActionLoading(null);
    }, { confirmLabel: 'Delete', danger: true, icon: 'fa-solid fa-trash-alt' });
  };

  const handleUnlockTest = async (testId: string, userId: string) => {
    setTestActionLoading(`unlock-${userId}`);
    try {
      const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unlock', testId, userId }) });
      if (r.ok) { await fetchTestDetail(testId); toast({ title: 'Test Unlocked', description: 'Student can now access this test.' }); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to unlock test', variant: 'destructive' }); }
    setTestActionLoading(null);
  };

  const handleLockTest = (testId: string, userId: string, userName: string) => {
    openConfirm('Lock Test', `Lock test for ${userName}? They will no longer be able to access it.`, async () => {
      setTestActionLoading(`lock-${userId}`);
      try {
        const r = await fetch('/api/instructor/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lock', testId, userId }) });
        if (r.ok) { await fetchTestDetail(testId); toast({ title: 'Test Locked', description: 'Student access revoked and in-progress attempts removed.' }); } else toast({ title: 'Error', description: (await r.json()).error, variant: 'destructive' });
      } catch { toast({ title: 'Error', description: 'Failed to lock test.', variant: 'destructive' }); }
      setTestActionLoading(null);
    }, { confirmLabel: 'Lock', danger: true, icon: 'fa-solid fa-lock' });
  };

  const addQuestionOption = () => setQuestionForm(f => ({ ...f, options: [...f.options, ''] }));
  const removeQuestionOption = (idx: number) => setQuestionForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx), correctAnswer: f.correctAnswer >= f.options.length - 1 ? 0 : f.correctAnswer }));
  const updateQuestionOption = (idx: number, val: string) => setQuestionForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? val : o) }));

  // ─── Student Progress ───
  const [studentProgress, setStudentProgress] = useState<InstructorProgress[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [editModules, setEditModules] = useState<number[]>([]);
  const [progressSaving, setProgressSaving] = useState(false);
  const [certSending, setCertSending] = useState<string | null>(null);
  const [studyData, setStudyData] = useState<Record<string, ModuleStudy[]>>({});
  const [studyLoading, setStudyLoading] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setProgressLoading(true);
    try { const r = await fetch('/api/instructor/progress'); if (r.ok) setStudentProgress((await r.json()).progress); } catch {}
    setProgressLoading(false);
  }, []);

  const handleEditProgress = (p: InstructorProgress) => {
    setEditingProgress(p.id);
    setEditModules([...p.completedModules]);
  };

  const handleSaveProgress = async (p: InstructorProgress) => {
    setProgressSaving(true);
    try {
      const r = await fetch('/api/instructor/progress', {
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

  const handleResetProgress = (p: InstructorProgress) => {
    openConfirm('Reset Progress', `Are you sure you want to reset ${p.user.name}'s progress for ${p.courseName}? This action cannot be undone.`, async () => {
      setProgressSaving(true);
      try {
        const r = await fetch('/api/instructor/progress', {
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

  const handleSendCertificate = (p: InstructorProgress) => {
    if (p.completionPercentage !== 100) {
      toast({ title: 'Validation Error', description: 'Certificate can only be sent when progress is at 100%', variant: 'destructive' });
      return;
    }
    openConfirm('Send Certificate', `Send certificate to ${p.user.name} (${p.user.email}) for ${p.courseName}?`, async () => {
      setCertSending(p.id);
      try {
        const r = await fetch('/api/instructor/certificate', {
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

  const fetchStudyData = async (userId: string, courseId: string) => {
    const key = `${userId}-${courseId}`;
    setStudyLoading(key);
    try {
      const r = await fetch(`/api/instructor/progress?userId=${userId}&courseId=${courseId}&includeStudy=true`);
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

  // ─── Initial fetch ───
  useEffect(() => {
    if (user && (user.role === 'instructor' || user.role === 'admin')) {
      fetchEnrollments(statusFilter);
      fetchAnalytics();
      fetchCourses();
      loadNotifications();
    }
  }, [user, statusFilter, fetchEnrollments, fetchAnalytics, fetchCourses, loadNotifications]);

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
  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) return null;

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

  const glassCard = 'color-mix(in srgb, var(--card-bg) 60%, transparent)';
  const glassBlur = 'blur(20px) saturate(1.6)';
  const glassBorder = '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)';
  const innerGlass = 'color-mix(in srgb, var(--card-bg) 50%, transparent)';
  const innerBlur = 'blur(12px) saturate(1.4)';

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--text-light)', fontFamily: "var(--font-body)", fontWeight: 400 }}>
        <Navbar activePage="instructor" scrolled={true} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />

        <section className="section" style={{ paddingTop: 100, paddingBottom: 60 }}>
          <div className="section-header reveal">
            <span className="section-tag"></span>
            <h2 className="section-title">Instructor <span className="v-highlight">Dashboard</span></h2>
            <div className="section-divider"></div>
          </div>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { label: 'Total Courses', val: analytics?.totalCourses ?? courses.length, color: 'var(--accent)', icon: 'fa-graduation-cap', num: '01' },
              { label: 'Pending', val: analytics?.pendingEnrollments ?? pendingCount, color: 'var(--warning-color)', icon: 'fa-clock', num: '02' },
              { label: 'Approved', val: analytics?.approvedEnrollments ?? approvedCount, color: 'var(--success-color)', icon: 'fa-check-circle', num: '03' },
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
            <button className={`filter-btn${tab === 'courses' ? ' active' : ''}`} onClick={() => { setTab('courses'); fetchCourses(); }}>
              <i className="fa-solid fa-graduation-cap" style={{ marginRight: 8 }}></i>Courses
            </button>
            <button className={`filter-btn${tab === 'tests' ? ' active' : ''}`} onClick={() => { setTab('tests'); fetchTests(); }}>
              <i className="fa-solid fa-file-alt" style={{ marginRight: 8 }}></i>Tests
            </button>
            <button className={`filter-btn${tab === 'students' ? ' active' : ''}`} onClick={() => { setTab('students'); fetchProgress(); }}>
              <i className="fa-solid fa-tasks" style={{ marginRight: 8 }}></i>Students
            </button>
          </div>

          {/* ═══════ ENROLLMENTS TAB ═══════ */}
          {tab === 'enrollments' && (
            <>
              <div className="projects-filter reveal" style={{ justifyContent: 'center', marginBottom: 48 }}>
                {['all', 'pending', 'approved', 'declined'].map(s => (
                  <button key={s} className={`filter-btn${statusFilter === s ? ' active' : ''}`} onClick={() => { setStatusFilter(s); fetchEnrollments(s); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
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

          {/* ═══════ COURSES TAB ═══════ */}
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
                <div style={{ background: glassCard, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: glassBorder, padding: '32px 40px', borderRadius: 12, marginBottom: 24 }}>
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
                          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, borderRadius: 12, fontSize: 12, color: 'var(--text-light)' }}>
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
                          {!c.isGlobal && (
                            <button onClick={() => handleDeleteCourse(c)} disabled={actionLoading === c.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}>
                              <i className={actionLoading === c.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'} style={{ marginRight: 4 }}></i>Delete
                            </button>
                          )}
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
                        {c.enrollmentCount > 0 && (
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Enrollments</div>
                            <div style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 700 }}>{c.enrollmentCount}</div>
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
                            <span key={fidx} style={{ padding: '3px 12px', background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, borderRadius: 12, fontSize: 11, color: 'var(--text-dim)' }}>
                              <i className="fa-solid fa-check" style={{ marginRight: 4, fontSize: 9, color: 'var(--accent)' }}></i>{feat}
                            </span>
                          ))}
                        </div>
                      )}

                      {expandedCourseId === c.id && (
                        <div style={{ marginTop: 8, padding: '20px 24px', background: glassCard, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <i className="fa-solid fa-layer-group" style={{ color: 'var(--accent)' }}></i>Course Modules
                            </h4>
                            <button onClick={openNewModuleForm} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}>
                              <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>Add Module
                            </button>
                          </div>

                          {showModuleForm && (
                            <div style={{ background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, padding: '20px 24px', borderRadius: 12, marginBottom: 16 }}>
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
                                <div style={{ marginTop: 16, padding: '16px 20px', background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, borderRadius: 12, maxHeight: 300, overflowY: 'auto' }}>
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
                                <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, borderRadius: 12, gap: 12 }}>
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

          {/* ═══════ TESTS TAB ═══════ */}
          {tab === 'tests' && (
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-file-alt" style={{ color: 'var(--accent)' }}></i>Manage Tests
                </h3>
                <button onClick={async () => { setShowTestForm(true); if (!allModules.length) { try { const r = await fetch('/api/instructor/modules'); if (r.ok) setAllModules((await r.json()).modules); } catch {} } }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 11 }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>Create Test
                </button>
              </div>

              {showTestForm && (
                <div style={{ background: glassCard, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: glassBorder, padding: '32px 40px', borderRadius: 12, marginBottom: 24 }}>
                  <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 24 }}>
                    <i className="fa-solid fa-plus" style={{ color: 'var(--accent)', marginRight: 8 }}></i>New Test
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Module</label>
                      <select value={testForm.moduleId} onChange={e => setTestForm(f => ({ ...f, moduleId: e.target.value }))} style={{ width: '100%' }}>
                        <option value="">Select module...</option>
                        {allModules.map(m => <option key={m.id} value={m.id}>{m.title} (M{String(m.moduleOrder).padStart(2, '0')})</option>)}
                      </select>
                    </div>
                    <WaveInput label="Title" value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} />
                    <WaveInput label="Time Limit (min)" type="number" value={testForm.timeLimit} onChange={e => setTestForm(f => ({ ...f, timeLimit: parseInt(e.target.value) || 30 }))} />
                    <WaveInput label="Passing Score (%)" type="number" value={testForm.passingScore} onChange={e => setTestForm(f => ({ ...f, passingScore: parseInt(e.target.value) || 70 }))} />
                  </div>
                  <WaveTextarea label="Description" value={testForm.description} onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ marginBottom: 16 }} />
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
              ) : instructorTests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fa-solid fa-file-alt" style={{ fontSize: 56, marginBottom: 20, display: 'block', opacity: 0.3 }}></i>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Tests Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Click "Create Test" to add your first test.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {instructorTests.map(t => (
                    <div key={t.id} className="project-card reveal" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="fa-solid fa-file-alt" style={{ fontSize: 20, color: 'var(--accent)' }}></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 4 }}>{t.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Module: {t.moduleTitle}</div>
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16, paddingLeft: 64 }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Questions</div>
                          <div style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 700 }}>{t.questionCount}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Attempts</div>
                          <div style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 700 }}>{t.attemptCount}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Time Limit</div>
                          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{t.timeLimit} min</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pass Score</div>
                          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{t.passingScore}%</div>
                        </div>
                      </div>

                      {selectedTestId === t.id && selectedTest && (
                        <div style={{ marginTop: 8, padding: '20px 24px', background: glassCard, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                            <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <i className="fa-solid fa-file-alt" style={{ color: 'var(--accent)' }}></i>Test Details
                            </h4>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => setShowQuestionForm(!showQuestionForm)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: 'var(--accent)' }}>
                                <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>Add Question
                              </button>
                              <button onClick={() => handleResetAllAttempts(t.id)} disabled={testActionLoading === t.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(234,179,8,0.4)', color: 'var(--warning-color)' }}>
                                <i className={testActionLoading === t.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-undo'} style={{ marginRight: 4 }}></i>Reset All
                              </button>
                            </div>
                          </div>

                          {showQuestionForm && (
                            <div style={{ background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, padding: '20px 24px', borderRadius: 12, marginBottom: 16 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                <i className="fa-solid fa-plus" style={{ color: 'var(--accent)', marginRight: 6 }}></i>New Question
                              </div>
                              <WaveTextarea label="Question Text" value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} rows={2} style={{ marginBottom: 12 }} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                {questionForm.options.map((opt, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="radio" name="correctAnswer" checked={questionForm.correctAnswer === idx} onChange={() => setQuestionForm(f => ({ ...f, correctAnswer: idx }))} style={{ accentColor: 'var(--accent)' }} />
                                    <input type="text" value={opt} onChange={e => updateQuestionOption(idx, e.target.value)} placeholder={`Option ${idx + 1}`} style={{ flex: 1 }} />
                                    {questionForm.options.length > 2 && (
                                      <button onClick={() => removeQuestionOption(idx)} className="btn" style={{ padding: '4px 8px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)' }}><i className="fa-solid fa-times"></i></button>
                                    )}
                                  </div>
                                ))}
                                <button onClick={addQuestionOption} className="btn" style={{ padding: '4px 14px', fontSize: 10, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)', alignSelf: 'flex-start' }}>
                                  <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>Add Option
                                </button>
                              </div>
                              <WaveInput label="Points" type="number" value={questionForm.points} onChange={e => setQuestionForm(f => ({ ...f, points: parseInt(e.target.value) || 1 }))} style={{ marginBottom: 12 }} />
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handleAddQuestion} disabled={testsSaving} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 11 }}>
                                  <i className={testsSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plus'} style={{ marginRight: 4 }}></i>{testsSaving ? 'Adding...' : 'Add Question'}
                                </button>
                                <button onClick={() => setShowQuestionForm(false)} className="btn" style={{ padding: '8px 18px', fontSize: 11, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
                              </div>
                            </div>
                          )}

                          {/* Questions list */}
                          {selectedTest.questions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)', fontSize: 13 }}>No questions yet. Click "Add Question" to create one.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                              {selectedTest.questions.sort((a, b) => a.questionOrder - b.questionOrder).map((q, qi) => (
                                <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, borderRadius: 12, gap: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', padding: '2px 8px', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 999, flexShrink: 0 }}>Q{qi + 1}</span>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.questionText}</div>
                                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{q.points} pt{q.points !== 1 ? 's' : ''} &middot; Correct: Option {q.correctAnswer + 1}</div>
                                    </div>
                                  </div>
                                  <button onClick={() => handleDeleteQuestion(q.id)} disabled={testActionLoading === q.id} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--error-color)', flexShrink: 0 }}>
                                    <i className={testActionLoading === q.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-alt'}></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Unlock/Lock for students */}
                          {testEnrolledStudents.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                <i className="fa-solid fa-lock" style={{ color: 'var(--accent)', marginRight: 6 }}></i>Student Access
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {testEnrolledStudents.map(s => {
                                  const isUnlocked = (selectedTest.unlocks || []).some(u => u.userId === s.user.id);
                                  return (
                                    <div key={s.user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, borderRadius: 12 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
                                          {s.user.avatar ? <SmartImage src={s.user.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : s.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{s.user.name}</div>
                                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.user.email}</div>
                                        </div>
                                      </div>
                                      <button onClick={() => isUnlocked ? handleLockTest(t.id, s.user.id, s.user.name) : handleUnlockTest(t.id, s.user.id)} disabled={testActionLoading === `unlock-${s.user.id}` || testActionLoading === `lock-${s.user.id}`} className="btn" style={{ padding: '4px 14px', fontSize: 10, background: isUnlocked ? 'rgba(239,68,68,0.1)' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: isUnlocked ? '1px solid rgba(239,68,68,0.4)' : '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', color: isUnlocked ? 'var(--error-color)' : 'var(--accent)' }}>
                                        <i className={testActionLoading === `unlock-${s.user.id}` || testActionLoading === `lock-${s.user.id}` ? 'fa-solid fa-spinner fa-spin' : isUnlocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'} style={{ marginRight: 4 }}></i>{isUnlocked ? 'Lock' : 'Unlock'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Attempts / Grades */}
                          {selectedTest.attempts && selectedTest.attempts.length > 0 && (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                <i className="fa-solid fa-chart-bar" style={{ color: 'var(--accent)', marginRight: 6 }}></i>Grades ({selectedTest.attempts.length} attempts)
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedTest.attempts.map(a => (
                                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, borderRadius: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.user.avatar ? 'transparent' : 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
                                        {a.user.avatar ? <SmartImage src={a.user.avatar} alt="" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : a.user.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{a.user.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{fmt(a.createdAt)}</div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: a.passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: a.passed ? 'var(--success-color)' : 'var(--error-color)', border: a.passed ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>{a.passed ? 'Passed' : 'Failed'}</span>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: a.passed ? 'var(--success-color)' : 'var(--error-color)' }}>{a.score}/{a.totalPoints}</span>
                                      <button onClick={() => handleResetAttempt(t.id, a.userId, a.user.name)} disabled={testActionLoading === `reset-${a.userId}`} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid rgba(234,179,8,0.4)', color: 'var(--warning-color)' }}>
                                        <i className={testActionLoading === `reset-${a.userId}` ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-undo'} style={{ marginRight: 4 }}></i>Reset
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════ STUDENTS TAB ═══════ */}
          {tab === 'students' && (
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
                      <div key={s.label} style={{ background: glassCard, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: glassBorder, padding: 24, borderRadius: 12 }}>
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
                            {editingProgress === p.id ? (
                              <div style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                  {Array.from({ length: p.totalModules }, (_, i) => i + 1).map(n => (
                                    <button key={n} onClick={() => handleToggleModule(n)} className="btn" style={{ padding: '3px 10px', fontSize: 10, background: editModules.includes(n) ? 'rgba(34,197,94,0.15)' : 'transparent', border: editModules.includes(n) ? '1px solid rgba(34,197,94,0.4)' : '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: editModules.includes(n) ? 'var(--success-color)' : 'var(--text-dim)' }}>
                                      M{n}
                                    </button>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => handleSaveProgress(p)} disabled={progressSaving} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 10 }}>
                                    <i className={progressSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-save'} style={{ marginRight: 4 }}></i>Save
                                  </button>
                                  <button onClick={() => { setEditingProgress(null); setEditModules([]); }} className="btn" style={{ padding: '6px 16px', fontSize: 10, background: 'transparent', border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)', color: 'var(--text-dim)' }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ height: 8, borderRadius: 999, background: 'color-mix(in srgb, var(--text-light) 8%, transparent)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 999, background: pc.bar, width: `${editingProgress === p.id ? Math.round((editModules.length / p.totalModules) * 100) : p.completionPercentage}%`, transition: 'width 0.4s' }}></div>
                              </div>
                            )}
                          </div>
                        </div>
                        {studyData[`${p.userId}-${p.courseId}`] && (
                          <div style={{ paddingLeft: 64 }}>
                            <div style={{ background: innerGlass, backdropFilter: innerBlur, WebkitBackdropFilter: innerBlur, border: glassBorder, borderRadius: 12, padding: '16px 20px' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                <i className="fa-solid fa-clock" style={{ color: 'var(--accent)', marginRight: 6 }}></i>Study Data
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {studyData[`${p.userId}-${p.courseId}`].map(ms => (
                                  <div key={ms.moduleId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: glassCard, backdropFilter: glassBlur, WebkitBackdropFilter: glassBlur, border: glassBorder, borderRadius: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', padding: '1px 6px', borderRadius: 999 }}>M{String(ms.moduleOrder).padStart(2, '0')}</span>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-light)' }}>{ms.moduleTitle}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <span style={{ fontSize: 11, color: ms.studied ? 'var(--success-color)' : 'var(--text-dim)' }}>
                                        <i className={ms.studied ? 'fa-solid fa-check-circle' : 'fa-regular fa-circle'} style={{ marginRight: 4 }}></i>{ms.studied ? 'Studied' : 'Not started'}
                                      </span>
                                      {ms.timeSpent > 0 && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formatTime(ms.timeSpent)}</span>}
                                      {ms.testScores && ms.testScores.length > 0 && ms.testScores.map(ts => (
                                        <span key={ts.testId} style={{ padding: '1px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700, background: ts.passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: ts.passed ? 'var(--success-color)' : 'var(--error-color)', border: ts.passed ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>
                                          {ts.score}/{ts.totalPoints}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </section>

        <footer className="v-footer">
          <div className="v-footer-bottom" style={{ border: 'none' }}>
            <p><span style={{ color: 'var(--accent)' }}>XFoundry</span> — Instructor Panel — {new Date().getFullYear()}</p>
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
