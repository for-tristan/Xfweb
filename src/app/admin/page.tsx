'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
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
  user: { id: string; name: string; email: string; role: string; avatar: string | null; };
}

interface ProgressEntry {
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
  user: { id: string; name: string; email: string; role: string; avatar: string | null; };
}

interface ServiceFeature {
  title: string;
  description: string;
  icon: string;
}

interface AdminService {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  status: string;
  displayOrder: number;
  features: ServiceFeature[];
  createdAt: string;
  updatedAt: string;
}

interface AdminCourse {
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
  moduleCount?: number;
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
  createdAt: string;
  updatedAt: string;
}

interface AdminQuote {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  serviceType: string;
  budget: string | null;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, size: `${Math.random() * 2 + 1}px`,
    duration: `${Math.random() * 20 + 15}s`, delay: `${Math.random() * 15}s`,
  }));
}
const particles = generateParticles(50);

function UnlockStudentPanel({ admin, modules, unlockLoading, handleUnlock, handleLock, handleUnlockAll, enrollments, fmt, actionLoading, courses }: {
  admin: User;
  modules: CourseModule[];
  unlockLoading: string | null;
  handleUnlock: (userId: string, moduleId: string) => void;
  handleLock: (userId: string, moduleId: string) => void;
  handleUnlockAll: (userId: string, courseId: string) => void;
  enrollments: Enrollment[];
  fmt: (d: string) => string;
  actionLoading: string | null;
  courses: AdminCourse[];
}) {
  // Get approved enrollments (unique students)
  const approvedStudents = enrollments
    .filter(e => e.status === 'approved')
    .reduce((acc, e) => {
      if (!acc.find(a => a.user.id === e.user.id)) acc.push(e);
      return acc;
    }, [] as Enrollment[]);

  if (approvedStudents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No approved students yet. Approve enrollments first.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 500, overflowY: 'auto' }}>
      {approvedStudents.map(enr => {
        const userId = enr.user.id;
        // enr.courseId is the slug, find the actual course to get its CUID
        const courseObj = courses.find(c => c.slug === enr.courseId);
        const courseCUID = courseObj?.id;
        const courseLabel = courseObj ? courseObj.title : enr.courseId;
        // Filter modules using the real CUID (not the slug)
        const userModules = courseCUID ? modules.filter(m => m.courseId === courseCUID) : [];

        return (
          <div key={enr.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '16px 20px', borderRadius: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: enr.user.avatar ? 'transparent' : 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--primary-red)', overflow: 'hidden', flexShrink: 0 }}>
                  {enr.user.avatar ? <img src={enr.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : enr.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>{enr.user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{enr.user.email} &middot; {courseLabel}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {userModules.map(mod => {
                  const isUnlocked = mod.unlocks.some(u => u.userId === userId);
                  const isLoading = unlockLoading === `${userId}-${mod.id}`;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => isUnlocked ? handleLock(userId, mod.id) : handleUnlock(userId, mod.id)}
                      disabled={isLoading}
                      className="btn"
                      title={isUnlocked ? `Lock Module ${mod.moduleOrder}` : `Unlock Module ${mod.moduleOrder}`}
                      style={{ padding: '6px 14px', fontSize: 11, minWidth: 100, background: isUnlocked ? 'rgba(239,68,68,0.1)' : 'rgba(220,20,60,0.1)', border: isUnlocked ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(220,20,60,0.3)', color: isUnlocked ? '#ef4444' : 'var(--primary-red)' }}
                    >
                      <i className={isLoading ? 'fas fa-spinner fa-spin' : isUnlocked ? 'fas fa-lock' : 'fas fa-lock-open'} style={{ marginRight: 6, fontSize: 10 }}></i>
                      M{String(mod.moduleOrder).padStart(2, '0')}
                    </button>
                  );
                })}
                <button
                  onClick={() => courseCUID && handleUnlockAll(userId, courseCUID)}
                  disabled={unlockLoading === `${userId}-all` || !courseCUID}
                  className="btn btn-secondary"
                  title="Unlock all modules for this course"
                  style={{ padding: '6px 14px', fontSize: 11 }}
                >
                  <i className={unlockLoading === `${userId}-all` ? 'fas fa-spinner fa-spin' : 'fas fa-unlock'} style={{ marginRight: 6, fontSize: 10 }}></i>All
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const scrollToSection = (sectionId: string) => {
    window.location.href = '/' + '#' + sectionId;
  };
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'enrollments' | 'users' | 'progress' | 'modules' | 'quotes' | 'team' | 'services' | 'courses' | 'tests' | 'analytics'>('enrollments');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [studentProgress, setStudentProgress] = useState<ProgressEntry[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [editModules, setEditModules] = useState<number[]>([]);
  const [progressSaving, setProgressSaving] = useState(false);

  const moduleCounts: Record<string, number> = {};

  // ── Notifications ──
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id:string;title:string;message:string;read:boolean;createdAt:string}>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const loadNotifications = useCallback(async () => {
    try { const r = await fetch('/api/notifications'); if (r.ok) { const d = await r.json(); setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0); } } catch {}
  }, []);

  // ── Module Management ──
  interface CourseModule { id: string; courseId: string; title: string; description: string; moduleOrder: number; unlocks: { id: string; userId: string; moduleId: string; unlockedBy: string; createdAt: string; user: { id: string; name: string; email: string; avatar: string | null } }[] }
  const [adminModules, setAdminModules] = useState<CourseModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesCourseFilter, setModulesCourseFilter] = useState('all');
  const [seedLoading, setSeedLoading] = useState(false);

  // ── Quotes Management ──
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
      if (r.ok) { fetchQuotes(); } else { alert((await r.json()).error); }
    } catch { alert('Failed to update quote status'); }
    setQuoteActionLoading(null);
  };

  // ── Team Management ──
  interface TeamMember { id: string; name: string; role: string; bio: string; avatar: string; icon: string; linkedinUrl: string; githubUrl: string; displayOrder: number; createdAt: string; updatedAt: string; }
  const [adminTeam, setAdminTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', role: '', bio: '', avatar: '', icon: 'fas fa-user-tie', linkedinUrl: '', githubUrl: '', displayOrder: 1 });
  const fetchTeam = useCallback(async () => {
    setTeamLoading(true);
    try { const r = await fetch('/api/admin/team'); if (r.ok) { const d = await r.json(); setAdminTeam(d.members || []); } } catch {}
    setTeamLoading(false);
  }, []);
  const openNewTeamForm = () => { setEditingTeamMember(null); setTeamForm({ name: '', role: '', bio: '', avatar: '', icon: 'fas fa-user-tie', linkedinUrl: '', githubUrl: '', displayOrder: adminTeam.length + 1 }); setShowTeamForm(true); };
  const openEditTeamForm = (m: TeamMember) => { setEditingTeamMember(m); setTeamForm({ name: m.name, role: m.role, bio: m.bio, avatar: m.avatar, icon: m.icon, linkedinUrl: m.linkedinUrl, githubUrl: m.githubUrl, displayOrder: m.displayOrder }); setShowTeamForm(true); };
  const handleSaveTeamMember = async () => {
    if (!teamForm.name || !teamForm.role) { alert('Name and role are required'); return; }
    setTeamSaving(true);
    try {
      const r = await fetch('/api/admin/team', { method: editingTeamMember ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingTeamMember ? { ...teamForm, id: editingTeamMember.id } : teamForm) });
      if (r.ok) { fetchTeam(); setShowTeamForm(false); } else alert((await r.json()).error);
    } catch { alert('Failed'); }
    setTeamSaving(false);
  };
  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm('Delete this team member?')) return;
    try { const r = await fetch('/api/admin/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); if (r.ok) fetchTeam(); else alert((await r.json()).error); } catch { alert('Failed'); }
  };

  const [unlockLoading, setUnlockLoading] = useState<string | null>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  // ── Theme ──
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('x-foundry-theme') || 'dark') as 'dark' | 'light';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('x-foundry-theme', next);
  };

  useEffect(() => {
    const dot = cursorDotRef.current, ring = cursorRingRef.current;
    if (!dot || !ring || !window.matchMedia('(hover: hover)').matches) return;
    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; };
    const animate = () => { rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(animate); };
    const onOver = (e: MouseEvent) => { const t = e.target as HTMLElement; if (t.closest('a, button, input, select, textarea, tr')) ring.classList.add('hovered'); };
    const onOut = (e: MouseEvent) => { const t = e.target as HTMLElement; if (t.closest('a, button, input, select, textarea, tr')) ring.classList.remove('hovered'); };
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseover', onOver); document.addEventListener('mouseout', onOut);
    animate();
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseover', onOver); document.removeEventListener('mouseout', onOut); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) { const data = await res.json(); if (data.user?.role === 'admin') setAdmin(data.user); else window.location.href = '/'; }
        else window.location.href = '/';
      } catch { window.location.href = '/'; }
      finally { setLoading(false); }
    })();
  }, []);

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
    try { const q = courseId && courseId !== 'all' ? `?courseId=${courseId}` : ''; const r = await fetch(`/api/admin/modules${q}`); if (r.ok) setAdminModules((await r.json()).modules); } catch {}
    setModulesLoading(false);
  }, []);
  const handleSeedModules = async () => {
    setSeedLoading(true);
    try { const r = await fetch('/api/admin/modules/seed', { method: 'POST' }); const d = await r.json(); if (r.ok) { alert(`Seeded: ${d.created} new, ${d.skipped} skipped`); fetchModules(modulesCourseFilter); } else alert(d.error); } catch { alert('Failed'); }
    setSeedLoading(false);
  };
  const handleUnlock = async (userId: string, moduleId: string) => {
    const key = `${userId}-${moduleId}`;
    setUnlockLoading(key);
    try { const r = await fetch('/api/admin/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, moduleId }) }); if (r.ok) fetchModules(modulesCourseFilter); else alert((await r.json()).error); } catch { alert('Failed'); }
    setUnlockLoading(null);
  };
  const handleUnlockAll = async (userId: string, courseId: string) => {
    setUnlockLoading(`${userId}-all`);
    try { const r = await fetch('/api/admin/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, courseId, unlockAll: true }) }); if (r.ok) { const d = await r.json(); alert(`${d.created} modules unlocked`); fetchModules(modulesCourseFilter); } else alert((await r.json()).error); } catch { alert('Failed'); }
    setUnlockLoading(null);
  };
  const handleLock = async (userId: string, moduleId: string) => {
    const key = `${userId}-${moduleId}`;
    setUnlockLoading(key);
    try { const r = await fetch('/api/admin/modules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, moduleId }) }); if (r.ok) fetchModules(modulesCourseFilter); else alert((await r.json()).error); } catch { alert('Failed'); }
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
        alert((await r.json()).error);
      }
    } catch { alert('Failed to save progress'); }
    setProgressSaving(false);
  };
  const handleToggleModule = (moduleNum: number) => {
    setEditModules(prev => prev.includes(moduleNum) ? prev.filter(m => m !== moduleNum) : [...prev, moduleNum].sort((a, b) => a - b));
  };
  const handleResetProgress = async (p: ProgressEntry) => {
    if (!confirm(`Reset ${p.user.name}'s progress for ${p.courseName}?`)) return;
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
        alert((await r.json()).error);
      }
    } catch { alert('Failed to reset progress'); }
    setProgressSaving(false);
  };

  // ── Send Certificate ──
  const [certSending, setCertSending] = useState<string | null>(null);
  const handleSendCertificate = async (p: ProgressEntry) => {
    if (p.completionPercentage !== 100) {
      alert('Certificate can only be sent when progress is at 100%');
      return;
    }
    if (!confirm(`Send certificate to ${p.user.name} (${p.user.email}) for ${p.courseName}?`)) return;
    setCertSending(p.id);
    try {
      const r = await fetch('/api/admin/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: p.userId, courseId: p.courseId }),
      });
      const d = await r.json();
      if (r.ok) {
        alert(`${d.message}\n\nCertificate ID: ${d.certificateId}`);
      } else {
        alert(d.error);
      }
    } catch { alert('Failed to send certificate'); }
    setCertSending(null);
  };

  // ── Module Study Data ──
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

  // ── Services Management ──
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [serviceForm, setServiceForm] = useState({ title: '', slug: '', description: '', icon: 'fas fa-cog', status: 'active' as string, displayOrder: 0 });
  const [serviceFeatures, setServiceFeatures] = useState<ServiceFeature[]>([]);
  const [newServiceFeature, setNewServiceFeature] = useState<ServiceFeature>({ title: '', description: '', icon: 'fas fa-check' });
  const [serviceSaving, setServiceSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    try { const r = await fetch('/api/admin/services'); if (r.ok) setServices((await r.json()).services); } catch {}
    setServicesLoading(false);
  }, []);

  const openNewServiceForm = () => {
    setEditingService(null);
    setServiceForm({ title: '', slug: '', description: '', icon: 'fas fa-cog', status: 'active', displayOrder: services.length });
    setServiceFeatures([]);
    setNewServiceFeature({ title: '', description: '', icon: 'fas fa-check' });
    setShowServiceForm(true);
  };

  const openEditServiceForm = (s: AdminService) => {
    setEditingService(s);
    setServiceForm({ title: s.title, slug: s.slug, description: s.description, icon: s.icon, status: s.status, displayOrder: s.displayOrder });
    setServiceFeatures([...s.features]);
    setNewServiceFeature({ title: '', description: '', icon: 'fas fa-check' });
    setShowServiceForm(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.title.trim()) { alert('Title is required'); return; }
    setServiceSaving(true);
    try {
      const body = { ...serviceForm, slug: serviceForm.slug || serviceForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), features: serviceFeatures };
      const r = await fetch('/api/admin/services', { method: editingService ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingService ? { ...body, id: editingService.id } : body) });
      if (r.ok) { fetchServices(); setShowServiceForm(false); } else alert((await r.json()).error);
    } catch { alert('Failed to save service'); }
    setServiceSaving(false);
  };

  const handleToggleServiceStatus = async (s: AdminService) => {
    setActionLoading(s.id);
    const newStatus = s.status === 'active' ? 'hidden' : 'active';
    try { const r = await fetch('/api/admin/services', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, status: newStatus }) }); if (r.ok) fetchServices(); else alert((await r.json()).error); } catch { alert('Failed'); }
    setActionLoading(null);
  };

  const handleDeleteService = async (s: AdminService) => {
    if (!confirm(`Delete service "${s.title}"? This cannot be undone.`)) return;
    setActionLoading(s.id);
    try { const r = await fetch('/api/admin/services', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id }) }); if (r.ok) fetchServices(); else alert((await r.json()).error); } catch { alert('Failed'); }
    setActionLoading(null);
  };

  const handleServiceTitleChange = (title: string) => {
    setServiceForm(f => ({ ...f, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
  };

  const addServiceFeature = () => {
    if (!newServiceFeature.title.trim()) return;
    setServiceFeatures(prev => [...prev, { ...newServiceFeature }]);
    setNewServiceFeature({ title: '', description: '', icon: 'fas fa-check' });
  };

  const removeServiceFeature = (idx: number) => {
    setServiceFeatures(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Courses Management ──
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [courseForm, setCourseForm] = useState({ title: '', slug: '', description: '', level: 'beginner', duration: '', price: '', icon: 'fas fa-book', status: 'active' as string, features: [] as string[], prerequisites: '', techStack: '' });
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
    setCourseForm({ title: '', slug: '', description: '', level: 'beginner', duration: '', price: '', icon: 'fas fa-book', status: 'active', features: [], prerequisites: '', techStack: '' });
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
    if (!courseForm.title.trim()) { alert('Title is required'); return; }
    setCourseSaving(true);
    try {
      const body = { ...courseForm, slug: courseForm.slug || courseForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') };
      const r = await fetch('/api/admin/courses', { method: editingCourse ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingCourse ? { ...body, id: editingCourse.id } : body) });
      if (r.ok) { fetchCourses(); setShowCourseForm(false); } else { const d = await r.json(); alert(d.error + (d.details ? `\n\n${d.details}` : '')); }
    } catch (e) { alert('Failed to save course: ' + String(e)); }
    setCourseSaving(false);
  };

  const handleToggleCourseStatus = async (c: AdminCourse) => {
    setActionLoading(c.id);
    const newStatus = c.status === 'active' ? 'hidden' : 'active';
    try { const r = await fetch('/api/admin/courses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, status: newStatus }) }); if (r.ok) fetchCourses(); else alert((await r.json()).error); } catch { alert('Failed'); }
    setActionLoading(null);
  };

  const handleDeleteCourse = async (c: AdminCourse) => {
    if (!confirm(`Delete course "${c.title}"?\n\nWarning: All modules for this course will also be deleted. Existing enrollments reference courseId as a string so they won't cascade, but student access to course content will be affected.`)) return;
    setActionLoading(c.id);
    try { const r = await fetch('/api/admin/courses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) }); if (r.ok) { fetchCourses(); if (expandedCourseId === c.id) { setExpandedCourseId(null); setCourseModules([]); } } else alert((await r.json()).error); } catch { alert('Failed'); }
    setActionLoading(null);
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
    if (!moduleForm.title.trim()) { alert('Module title is required'); return; }
    if (!expandedCourseId) return;
    setModuleSaving(true);
    try {
      const body = { ...moduleForm, courseId: expandedCourseId };
      const r = await fetch('/api/admin/modules', { method: editingModule ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingModule ? { ...body, id: editingModule.id } : body) });
      if (r.ok) { fetchCourseModules(expandedCourseId); fetchCourses(); setShowModuleForm(false); } else alert((await r.json()).error);
    } catch { alert('Failed to save module'); }
    setModuleSaving(false);
  };

  const handleDeleteModule = async (m: CourseModuleItem) => {
    if (!confirm(`Delete module "${m.title}"?`)) return;
    setActionLoading(m.id);
    try { const r = await fetch('/api/admin/modules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId: m.id }) }); if (r.ok) { fetchCourseModules(expandedCourseId!); fetchCourses(); } else alert((await r.json()).error); } catch { alert('Failed'); }
    setActionLoading(null);
  };

  // ── Tests Management ──
  interface AdminTest { id: string; moduleId: string; title: string; description: string; timeLimit: number; passingScore: number; questionCount: number; attemptCount: number; moduleTitle: string; createdAt: string; }
  interface AdminTestFull { id: string; moduleId: string; title: string; description: string; timeLimit: number; passingScore: number; createdAt: string; updatedAt: string; module: { id: string; title: string; courseId: string }; questions: { id: string; questionText: string; questionType: string; options: string; correctAnswer: number; points: number; questionOrder: number; createdAt: string }[]; attempts: { id: string; userId: string; score: number; totalPoints: number; passed: boolean; submittedAt: string | null; createdAt: string; user: { id: string; name: string; email: string; avatar: string | null } }[]; unlocks: { id: string; userId: string; unlockedBy: string; createdAt: string; user: { id: string; name: string; email: string } }[]; }
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
      } else { const d = await r.json(); alert(d.error + (d.details ? `\n\n${d.details}` : '')); }
    } catch (e) { alert('Failed to load test details: ' + String(e)); }
  };
  const handleCreateTest = async () => {
    if (!testForm.moduleId || !testForm.title.trim()) { alert('Module and title are required'); return; }
    setTestsSaving(true);
    try {
      const r = await fetch('/api/admin/tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testForm) });
      if (r.ok) { fetchTests(); setShowTestForm(false); setTestForm({ moduleId: '', title: '', description: '', timeLimit: 30, passingScore: 70 }); } else alert((await r.json()).error);
    } catch { alert('Failed'); }
    setTestsSaving(false);
  };
  const handleAddQuestion = async () => {
    if (!selectedTestId || !questionForm.questionText.trim()) { alert('Question text is required'); return; }
    const validOptions = questionForm.options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) { alert('At least 2 options are required'); return; }
    setTestsSaving(true);
    try {
      const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addQuestion', testId: selectedTestId, questionText: questionForm.questionText, options: validOptions, correctAnswer: questionForm.correctAnswer, points: questionForm.points }) });
      if (r.ok) { fetchTestDetail(selectedTestId); fetchTests(); setShowQuestionForm(false); setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }); } else alert((await r.json()).error);
    } catch { alert('Failed'); }
    setTestsSaving(false);
  };
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    if (!selectedTestId) return;
    setTestActionLoading(questionId);
    try {
      const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteQuestion', testId: selectedTestId, questionId }) });
      if (r.ok) { fetchTestDetail(selectedTestId); fetchTests(); } else alert((await r.json()).error);
    } catch { alert('Failed'); }
    setTestActionLoading(null);
  };
  const handleResetAttempt = async (testId: string, userId: string, userName: string) => {
    if (!confirm(`Reset ${userName}'s attempt? They will be able to retake the test.`)) return;
    setTestActionLoading(`reset-${userId}`);
    try {
      const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resetAttempt', testId, userId }) });
      if (r.ok) { if (selectedTestId === testId) fetchTestDetail(testId); fetchTests(); } else alert((await r.json()).error);
    } catch { alert('Failed'); }
    setTestActionLoading(null);
  };
  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Delete this test and all its questions, attempts, and unlocks?')) return;
    setTestActionLoading(testId);
    try {
      const r = await fetch('/api/admin/tests', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: testId }) });
      if (r.ok) { fetchTests(); if (selectedTestId === testId) { setSelectedTestId(null); setSelectedTest(null); } } else { const d = await r.json(); alert(d.error + (d.details ? `\n\n${d.details}` : '')); }
    } catch (e) { alert('Failed to delete test: ' + String(e)); }
    setTestActionLoading(null);
  };
  const handleUnlockTest = async (testId: string, userId: string) => {
    setTestActionLoading(`unlock-${userId}`);
    try {
      const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unlock', testId, userId }) });
      if (r.ok) { await fetchTestDetail(testId); toast({ title: 'Test Unlocked', description: 'Student can now access this test.' }); } else alert((await r.json()).error);
    } catch { toast({ title: 'Error', description: 'Failed to unlock test', variant: 'destructive' }); }
    setTestActionLoading(null);
  };
  const handleLockTest = async (testId: string, userId: string, userName: string) => {
    if (!confirm(`Lock test for ${userName}? They will no longer be able to access it.`)) return;
    setTestActionLoading(`lock-${userId}`);
    try {
      const r = await fetch('/api/admin/tests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lock', testId, userId }) });
      if (r.ok) { await fetchTestDetail(testId); toast({ title: 'Test Locked', description: 'Student access revoked and in-progress attempts removed.' }); } else alert((await r.json()).error);
    } catch { toast({ title: 'Error', description: 'Failed to lock test', variant: 'destructive' }); }
    setTestActionLoading(null);
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

  useEffect(() => { if (admin) { fetchEnrollments(statusFilter); fetchUsers(); loadNotifications(); fetchCourses(); } }, [admin, statusFilter, fetchEnrollments, fetchUsers, loadNotifications, fetchCourses]);

  const handleStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try { const r = await fetch('/api/admin/enrollments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId: id, status }) }); if (r.ok) fetchEnrollments(statusFilter); else alert((await r.json()).error); } catch { alert('Failed'); }
    setActionLoading(null);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this enrollment?')) return;
    setActionLoading(id);
    try { const r = await fetch('/api/admin/enrollments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enrollmentId: id }) }); if (r.ok) fetchEnrollments(statusFilter); else alert((await r.json()).error); } catch { alert('Failed'); }
    setActionLoading(null);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const action = newRole === 'admin' ? 'promote to admin' : 'remove admin rights from';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    setActionLoading(userId);
    try { const r = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role: newRole }) }); if (r.ok) fetchUsers(); else alert((await r.json()).error); } catch { alert('Failed'); }
    setActionLoading(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This will also delete all their enrollments and quote requests.')) return;
    setActionLoading(userId);
    try { const r = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) }); if (r.ok) fetchUsers(); else alert((await r.json()).error); } catch { alert('Failed'); }
    setActionLoading(null);
  };

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/'; };
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const pendingCount = enrollments.filter(e => e.status === 'pending').length;
  const approvedCount = enrollments.filter(e => e.status === 'approved').length;
  const declinedCount = enrollments.filter(e => e.status === 'declined').length;

  if (loading) return (
    <>
      <div className="global-particles">{particles.map(p => <div key={p.id} className="particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: p.duration, animationDelay: p.delay }} />)}</div>
      <div ref={cursorDotRef} className="cursor-dot" /><div ref={cursorRingRef} className="cursor-ring" /><div className="scan-line" />
      <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 48, height: 48, border: '3px solid rgba(220,20,60,0.2)', borderTopColor: 'var(--primary-red)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
    </>
  );
  if (!admin) return null;

  const statusBadge = (s: string) => {
    const m: Record<string, { bg: string; color: string; border: string }> = {
      pending: { bg: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.25)' },
      approved: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' },
      declined: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
    };
    return m[s] || m.pending;
  };

  const progressColor = (pct: number) => {
    if (pct > 75) return { bar: '#22c55e', bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: 'On Track' };
    if (pct >= 50) return { bar: '#eab308', bg: 'rgba(234,179,8,0.12)', text: '#eab308', label: 'In Progress' };
    return { bar: '#ef4444', bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: 'Needs Attention' };
  };

  return (
    <>
      <div className="global-particles">{particles.map(p => <div key={p.id} className="particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: p.duration, animationDelay: p.delay }} />)}</div>
      <div ref={cursorDotRef} className="cursor-dot" /><div ref={cursorRingRef} className="cursor-ring" />

      <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>

        {/* ═══ NAV ═══ */}
        <nav className="navbar scrolled" style={{ position: 'relative' }}>
          <a href="/" className="logo">X<span>.</span>Foundry</a>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
            <li><a href="/#projects" onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }}>Projects</a></li>
            <li><a href="/#courses" onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Courses</a></li>
            <li><a href="/study">Study</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/#team" onClick={(e) => { e.preventDefault(); scrollToSection('team'); }}>Team</a></li>
            <li><a href="/#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
            <li><a href="/admin" className="active" style={{ color: 'var(--primary-red)' }}>Admin</a></li>
          </ul>
          <div className="nav-actions">
            <button className="theme-toggle" onClick={handleThemeToggle} title="Toggle Theme">
              <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'} />
            </button>
            {/* Notifications Bell */}
            <div style={{ position: 'relative' }}>
              <button className="nav-search-btn" onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifications(); }} title="Notifications" style={{ position: 'relative' }}>
                <i className="fas fa-bell" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#dc143c', fontSize: 9, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--dark-gray)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 340, background: 'var(--dark-gray)', border: '1px solid var(--border-color)', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 10001, overflow: 'hidden' }}>
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
            <a href="/" className="nav-user-btn" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <span className="nav-user-avatar">
                {admin.avatar
                  ? <img src={admin.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : admin.name.charAt(0).toUpperCase()
                }
              </span>
              {admin.name.split(' ')[0]}
            </a>
            <button className="nav-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* ═══ HERO ═══ */}
      

        {/* ═══ STATS ═══ */}
        <section className="section" style={{ paddingTop: 80, paddingBottom: 100 }}>
          <div className="grid-bg"></div><div className="scan-line"></div>
          <div className="section-header reveal">
            <span className="section-tag"></span>
            <h2 className="section-title">Platform Statistics</h2>
            <div className="section-divider"></div>
          </div>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { label: 'Total Users', val: users.length, color: 'var(--primary-red)', icon: 'fa-users', num: '01' },
              { label: 'Pending', val: pendingCount, color: '#eab308', icon: 'fa-clock', num: '02' },
              { label: 'Approved', val: approvedCount, color: '#22c55e', icon: 'fa-check-circle', num: '03' },
              { label: 'Declined', val: declinedCount, color: '#ef4444', icon: 'fa-times-circle', num: '04' },
            ].map((s, i) => (
              <div key={s.label} className={`service-card reveal reveal-delay-${i + 1}`}>
                <span className="service-number" style={{ color: s.color }}>{s.num}</span>
                <i className={`fas ${s.icon} service-icon`} style={{ color: s.color }}></i>
                <h3>{s.label}</h3>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 44, fontWeight: 900, color: s.color, marginTop: 12 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ DATA SECTION ═══ */}
        <section className="section" style={{ paddingTop: 60, paddingBottom: 120 }}>
          <div className="grid-bg"></div><div className="scan-line"></div>

          {/* Tabs */}
          <div className="projects-filter reveal" style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 56 }}>
            <button className={`filter-btn${tab === 'enrollments' ? ' active' : ''}`} onClick={() => setTab('enrollments')}>
              <i className="fas fa-user-graduate" style={{ marginRight: 8 }}></i>Enrollments{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
            <button className={`filter-btn${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
              <i className="fas fa-database" style={{ marginRight: 8 }}></i>Users Database
            </button>
            <button className={`filter-btn${tab === 'progress' ? ' active' : ''}`} onClick={() => { setTab('progress'); fetchProgress(); }}>
              <i className="fas fa-tasks" style={{ marginRight: 8 }}></i>Student Progress
            </button>
            <button className={`filter-btn${tab === 'modules' ? ' active' : ''}`} onClick={() => { setTab('modules'); fetchModules(modulesCourseFilter); }}>
              <i className="fas fa-key" style={{ marginRight: 8 }}></i>Modules
            </button>
            <button className={`filter-btn${tab === 'quotes' ? ' active' : ''}`} onClick={() => { setTab('quotes'); fetchQuotes(); }}>
              <i className="fas fa-envelope-open-text" style={{ marginRight: 8 }}></i>Quotes{adminQuotes.filter(q => q.status === 'pending').length > 0 ? ` (${adminQuotes.filter(q => q.status === 'pending').length})` : ''}
            </button>
            <button className={`filter-btn${tab === 'team' ? ' active' : ''}`} onClick={() => { setTab('team'); fetchTeam(); }}>
              <i className="fas fa-users" style={{ marginRight: 8 }}></i>Team
            </button>
            <button className={`filter-btn${tab === 'services' ? ' active' : ''}`} onClick={() => { setTab('services'); fetchServices(); }}>
              <i className="fas fa-concierge-bell" style={{ marginRight: 8 }}></i>Services
            </button>
            <button className={`filter-btn${tab === 'courses' ? ' active' : ''}`} onClick={() => { setTab('courses'); fetchCourses(); }}>
              <i className="fas fa-graduation-cap" style={{ marginRight: 8 }}></i>Courses
            </button>
            <button className={`filter-btn${tab === 'tests' ? ' active' : ''}`} onClick={() => { setTab('tests'); fetchTests(); }}>
              <i className="fas fa-file-alt" style={{ marginRight: 8 }}></i>Tests
            </button>
            <button className={`filter-btn${tab === 'analytics' ? ' active' : ''}`} onClick={() => { setTab('analytics'); if (!analytics) { fetch('/api/admin/analytics').then(r => r.json()).then(d => setAnalytics(d)).catch(() => {}); } }}>
              <i className="fas fa-chart-bar" style={{ marginRight: 8 }}></i>Analytics
            </button>
          </div>

          {/* ── ENROLLMENTS ── */}
          {tab === 'enrollments' && (
            <>
              <div className="projects-filter reveal" style={{ justifyContent: 'center', marginBottom: 48 }}>
                {['all', 'pending', 'approved', 'declined'].map(s => (
                  <button key={s} className={`filter-btn${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>

              {enrollments.length === 0 ? (
                <div className="reveal" style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fas fa-inbox" style={{ fontSize: 56, marginBottom: 20, display: 'block', color: 'rgba(220,20,60,0.15)' }}></i>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Requests Found</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>{statusFilter !== 'all' ? 'Try changing the filter.' : 'Requests will appear here when users apply.'}</p>
                </div>
              ) : (
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {enrollments.map((e, idx) => {
                    const sb = statusBadge(e.status);
                    return (
                      <div key={e.id} className="project-card reveal" style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Top row: user + course */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                          {/* User info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: e.user.avatar ? 'transparent' : 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 16, fontWeight: 900, flexShrink: 0, overflow: 'hidden' }}>
                              {e.user.avatar
                                ? <img src={e.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : e.user.name.charAt(0).toUpperCase()
                              }
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 4 }}>{e.user.name}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{e.user.email}</div>
                            </div>
                          </div>
                          {/* Status + Date */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                            <span style={{ padding: '5px 18px', borderRadius: 2, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: sb.bg, color: sb.color, border: sb.border }}>{e.status}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 150, textAlign: 'right' }}>{fmt(e.enrolledAt)}</span>
                          </div>
                        </div>

                        {/* Details row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20, paddingLeft: 64 }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Course</div>
                            <div style={{ fontSize: 14, color: 'var(--text-light)', fontWeight: 700 }}>{e.courseName}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Experience</div>
                            <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{e.experienceLevel || e.courseLevel}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Duration</div>
                            <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{e.duration}</div>
                          </div>
                          {e.motivation && (
                            <div style={{ flex: '1 1 100%' }}>
                              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Motivation</div>
                              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 500 }}>{e.motivation}</div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 12, paddingLeft: 64, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                          {e.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatus(e.id, 'approved')} disabled={actionLoading === e.id} className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 11 }}>
                                <i className={actionLoading === e.id ? 'fas fa-spinner fa-spin' : 'fas fa-check'} style={{ marginRight: 6 }}></i>Accept
                              </button>
                              <button onClick={() => handleStatus(e.id, 'declined')} disabled={actionLoading === e.id} className="btn btn-secondary" style={{ padding: '10px 28px', fontSize: 11 }}>
                                <i className={actionLoading === e.id ? 'fas fa-spinner fa-spin' : 'fas fa-times'} style={{ marginRight: 6 }}></i>Decline
                              </button>
                            </>
                          )}
                          <button onClick={() => handleRemove(e.id)} disabled={actionLoading === e.id} className="btn" style={{ padding: '10px 28px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', marginLeft: 'auto' }}>
                            <i className={actionLoading === e.id ? 'fas fa-spinner fa-spin' : 'fas fa-trash-alt'} style={{ marginRight: 6 }}></i>Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            users.length === 0 ? (
              <div className="reveal" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <i className="fas fa-users" style={{ fontSize: 56, marginBottom: 20, display: 'block', color: 'rgba(220,20,60,0.15)' }}></i>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Users Yet</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Users will appear here after signing up.</p>
              </div>
            ) : (
              <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {users.map((u, idx) => (
                  <div key={u.id} className={`project-card reveal reveal-delay-${Math.min(idx + 1, 5)}`} style={{ padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: u.avatar ? 'transparent' : (u.role === 'admin' ? 'rgba(220,20,60,0.15)' : 'var(--input-bg)'), border: u.role === 'admin' ? '1px solid rgba(220,20,60,0.3)' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: u.role === 'admin' ? 'var(--primary-red)' : 'var(--text-dim)', overflow: 'hidden', flexShrink: 0 }}>
                        {u.avatar
                          ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : u.name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-light)', marginBottom: 2 }}>{u.name}{u.id === admin.id && <span style={{fontSize:11,color:"var(--text-dim)",fontWeight:500}}> (you)</span>}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{u.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ padding: '5px 16px', borderRadius: 2, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: u.role === 'admin' ? 'rgba(220,20,60,0.12)' : 'rgba(148,163,184,0.1)', color: u.role === 'admin' ? 'var(--primary-red)' : '#94a3b8', border: u.role === 'admin' ? '1px solid rgba(220,20,60,0.25)' : '1px solid rgba(148,163,184,0.15)' }}>{u.role}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 120 }}>{fmt(u.createdAt)}</span>
                      {u.id !== admin.id && (
                        <>
                          <button
                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'student' : 'admin')}
                            disabled={actionLoading === u.id}
                            className="btn"
                            style={{ padding: '8px 16px', fontSize: 11, background: u.role === 'admin' ? 'transparent' : 'rgba(220,20,60,0.1)', border: u.role === 'admin' ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(220,20,60,0.3)', color: u.role === 'admin' ? '#eab308' : 'var(--primary-red)' }}
                          >
                            <i className={actionLoading === u.id ? 'fas fa-spinner fa-spin' : u.role === 'admin' ? 'fas fa-user-shield' : 'fas fa-shield-alt'} style={{ marginRight: 6 }}></i>
                            {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="btn"
                            style={{ padding: '8px 16px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}
                          >
                            <i className={actionLoading === u.id ? 'fas fa-spinner fa-spin' : 'fas fa-trash-alt'} style={{ marginRight: 6 }}></i>Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── STUDENT PROGRESS ── */}
          {tab === 'progress' && (
            progressLoading ? (
              <div className="reveal" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary-red)', marginBottom: 16, display: 'block' }}></i>
                <p style={{ color: 'var(--text-dim)' }}>Loading student progress...</p>
              </div>
            ) : studentProgress.length === 0 ? (
              <div className="reveal" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <i className="fas fa-chart-line" style={{ fontSize: 56, marginBottom: 20, display: 'block', color: 'rgba(220,20,60,0.15)' }}></i>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Progress Data</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Student progress will appear here once they start courses.</p>
              </div>
            ) : (
              <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }} className="reveal">
                  {(() => {
                    const total = studentProgress.length;
                    const avgCompletion = total > 0 ? Math.round(studentProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / total) : 0;
                    const completedCount = studentProgress.filter(p => p.completionPercentage === 100).length;
                    const atRiskCount = studentProgress.filter(p => p.completionPercentage < 50).length;
                    return [
                      { label: 'Total Records', val: total, icon: 'fa-book-open', color: 'var(--primary-red)' },
                      { label: 'Avg Completion', val: `${avgCompletion}%`, icon: 'fa-chart-pie', color: '#22c55e' },
                      { label: 'Completed', val: completedCount, icon: 'fa-trophy', color: '#eab308' },
                      { label: 'At Risk', val: atRiskCount, icon: 'fa-exclamation-triangle', color: '#ef4444' },
                    ].map((s, i) => (
                      <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: 24, borderRadius: 2 }}>
                        <i className={`fas ${s.icon}`} style={{ fontSize: 18, color: s.color, marginBottom: 12, display: 'block' }}></i>
                        <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: "'Orbitron', sans-serif", marginBottom: 4 }}>{s.val}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{s.label}</div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Progress List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {studentProgress.map((p, idx) => {
                    const pc = progressColor(p.completionPercentage);
                    return (
                      <div key={p.id} className={`project-card reveal reveal-delay-${Math.min(idx + 1, 5)}`} style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                          {/* Student info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: p.user.avatar ? 'transparent' : 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 16, fontWeight: 900, flexShrink: 0, overflow: 'hidden' }}>
                              {p.user.avatar
                                ? <img src={p.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : p.user.name.charAt(0).toUpperCase()
                              }
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 4 }}>{p.user.name}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{p.user.email}</div>
                            </div>
                          </div>
                          {/* Course + status */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                            <span style={{ padding: '5px 16px', borderRadius: 2, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: pc.bg, color: pc.text, border: `1px solid ${pc.text}33` }}>{pc.label}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 120, textAlign: 'right' }}>{fmt(p.lastAccessed)}</span>
                          </div>
                        </div>

                        {/* Course name + progress bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', paddingLeft: 64 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>
                                <i className="fas fa-book" style={{ color: 'var(--primary-red)', marginRight: 8, fontSize: 12 }}></i>
                                {p.courseName}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 13, fontWeight: 900, color: pc.text, fontFamily: "'Orbitron', sans-serif" }}>{editingProgress === p.id ? Math.round((editModules.length / p.totalModules) * 100) : p.completionPercentage}%</span>
                                {editingProgress !== p.id && (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => handleEditProgress(p)} className="btn" style={{ padding: '4px 12px', fontSize: 10, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
                                      <i className="fas fa-edit" style={{ marginRight: 4 }}></i>Edit
                                    </button>
                                    <button
                                      onClick={() => handleResetProgress(p)}
                                      disabled={progressSaving}
                                      className="btn"
                                      style={{ padding: '4px 12px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}
                                    >
                                      <i className={progressSaving ? 'fas fa-spinner fa-spin' : 'fas fa-redo'} style={{ marginRight: 4 }}></i>Reset
                                    </button>
                                    {p.completionPercentage === 100 && (
                                      <button
                                        onClick={() => handleSendCertificate(p)}
                                        disabled={certSending === p.id}
                                        className="btn"
                                        style={{ padding: '4px 12px', fontSize: 10, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', color: '#eab308' }}
                                      >
                                        <i className={certSending === p.id ? 'fas fa-spinner fa-spin' : 'fas fa-certificate'} style={{ marginRight: 4 }}></i>Send Cert
                                      </button>
                                    )}
                                    <button
                                      onClick={() => fetchStudyData(p.userId, p.courseId)}
                                      disabled={studyLoading === `${p.userId}-${p.courseId}`}
                                      className="btn"
                                      style={{ padding: '4px 12px', fontSize: 10, background: studyData[`${p.userId}-${p.courseId}`] ? 'rgba(220,20,60,0.1)' : 'transparent', border: studyData[`${p.userId}-${p.courseId}`] ? '1px solid rgba(220,20,60,0.3)' : '1px solid var(--border-color)', color: studyData[`${p.userId}-${p.courseId}`] ? 'var(--primary-red)' : 'var(--text-dim)' }}
                                    >
                                      <i className={studyLoading === `${p.userId}-${p.courseId}` ? 'fas fa-spinner fa-spin' : 'fas fa-eye'} style={{ marginRight: 4 }}></i>{studyData[`${p.userId}-${p.courseId}`] ? 'Hide Study' : 'Study Data'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ height: 10, background: 'var(--input-bg)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${editingProgress === p.id ? (editModules.length / p.totalModules) * 100 : p.completionPercentage}%`, background: `linear-gradient(90deg, ${pc.bar}, ${pc.bar}cc)`, borderRadius: 2, transition: 'width 0.6s ease' }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                              {editingProgress === p.id ? editModules.length : p.completedModules.length} of {p.totalModules} modules completed
                            </div>

                            {/* Module checkboxes (editing mode) */}
                            {editingProgress === p.id && (
                              <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--card-bg)', border: '1px solid rgba(220,20,60,0.2)', borderRadius: 2 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                                  <i className="fas fa-tasks" style={{ marginRight: 6, color: 'var(--primary-red)' }}></i>Toggle Completed Modules
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                                  {Array.from({ length: p.totalModules }, (_, i) => i + 1).map(modNum => {
                                    const isChecked = editModules.includes(modNum);
                                    return (
                                      <button
                                        key={modNum}
                                        onClick={() => handleToggleModule(modNum)}
                                        style={{
                                          padding: '6px 14px', borderRadius: 2, fontSize: 12, fontWeight: 700,
                                          background: isChecked ? 'rgba(34,197,94,0.12)' : 'var(--input-bg)',
                                          border: isChecked ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border-color)',
                                          color: isChecked ? '#22c55e' : 'var(--text-dim)',
                                          cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                                          display: 'flex', alignItems: 'center', gap: 6,
                                        }}
                                      >
                                        <i className={isChecked ? 'fas fa-check-square' : 'far fa-square'} style={{ fontSize: 11 }}></i>
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
                                    <i className={progressSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} style={{ marginRight: 6 }}></i>
                                    {progressSaving ? 'Saving...' : 'Save Progress'}
                                  </button>
                                  <button
                                    onClick={() => { setEditingProgress(null); setEditModules([]); }}
                                    className="btn"
                                    style={{ padding: '8px 20px', fontSize: 11, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Module Study Tracking Data */}
                            {studyData[`${p.userId}-${p.courseId}`] && editingProgress !== p.id && (
                              <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <i className="fas fa-clock" style={{ color: 'var(--primary-red)' }}></i>Module Study Activity
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 120px', gap: 1, fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, padding: '0 8px' }}>
                                  <span>Module</span>
                                  <span>Title</span>
                                  <span>Studied</span>
                                  <span>Time Spent</span>
                                </div>
                                {studyData[`${p.userId}-${p.courseId}`].map((ms) => (
                                  <div key={ms.moduleId} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 120px', gap: 1, padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>M{String(ms.moduleOrder).padStart(2, '0')}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{ms.moduleTitle}</span>
                                    <span style={{
                                      padding: '2px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-block', textAlign: 'center',
                                      background: ms.studied ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)',
                                      color: ms.studied ? '#22c55e' : '#ef4444',
                                      border: ms.studied ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.15)',
                                    }}>
                                      <i className={ms.studied ? 'fas fa-check' : 'fas fa-times'} style={{ marginRight: 4, fontSize: 9 }}></i>{ms.studied ? 'Yes' : 'No'}
                                    </span>
                                    <span style={{ fontSize: 12, color: ms.timeSpent > 0 ? 'var(--text-light)' : 'var(--text-dim)', fontWeight: ms.timeSpent > 0 ? 600 : 400 }}>
                                      {ms.timeSpent > 0 ? formatTime(ms.timeSpent) : '--'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Circular percentage indicator */}
                          <div style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid var(--border-color)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                            <svg width="72" height="72" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border-color)" strokeWidth="3" />
                              <circle cx="36" cy="36" r="30" fill="none" stroke={pc.bar} strokeWidth="3"
                                strokeDasharray={`${(p.completionPercentage / 100) * 188.5} 188.5`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span style={{ fontSize: 14, fontWeight: 900, color: pc.text, fontFamily: "'Orbitron', sans-serif", zIndex: 1 }}>{p.completionPercentage}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {/* ── MODULES ── */}
          {tab === 'modules' && (
            <>
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Filter Course: ‎ ‎ ‎   </span>
                  {['all', ...courses.map(c => c.id)].map(cid => (
                    <button key={cid} className={`filter-btn${modulesCourseFilter === cid ? ' active' : ''}`} onClick={() => { setModulesCourseFilter(cid); fetchModules(cid); }}>
                      {cid === 'all' ? 'All Courses' : courses.find(co => co.id === cid)?.title || cid}
                    </button>
                  ))}
                </div>
              </div>

              {modulesLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary-red)' }}></i></div>
              ) : (
                <>
                  {/* Section A: Course Modules Overview */}
                  <div style={{ marginBottom: 48 }}>
                    <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 16, marginBottom: 20, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="fas fa-book" style={{ color: 'var(--primary-red)' }}></i>Course Modules
                    </h3>
                    {(() => {
                      const validModules = adminModules.filter(m => courses.some(c => c.id === m.courseId));
                      if (validModules.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: 40, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
                            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No modules found. Go to the Courses tab to add modules to your courses.</p>
                          </div>
                        );
                      }
                      return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                        {validModules.map(mod => {
                          const unlockCount = mod.unlocks.length;
                          const courseObj = courses.find(c => c.id === mod.courseId || c.slug === mod.courseId);
                          const courseLabel = courseObj ? courseObj.title : mod.courseId;
                          return (
                            <div key={mod.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '20px 24px', borderRadius: 2 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-red)', textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(220,20,60,0.1)', padding: '2px 8px', border: '1px solid rgba(220,20,60,0.2)', borderRadius: 2 }}>M{String(mod.moduleOrder).padStart(2, '0')}</span>
                                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{courseLabel}</span>
                              </div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 4 }}>{mod.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.5 }}>{mod.description}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="fas fa-user-check" style={{ fontSize: 10, color: unlockCount > 0 ? '#22c55e' : 'var(--text-dim)' }}></i>
                                <span style={{ fontSize: 11, color: unlockCount > 0 ? '#22c55e' : 'var(--text-dim)' }}>{unlockCount} student{unlockCount !== 1 ? 's' : ''} unlocked</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      );
                    })()}
                  </div>

                  {/* Section B: Per-Student Module Access Control */}
                  <div>
                    <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 16, marginBottom: 20, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="fas fa-key" style={{ color: 'var(--primary-red)' }}></i>Student Module Access
                    </h3>
                    <UnlockStudentPanel admin={admin} modules={adminModules} unlockLoading={unlockLoading} handleUnlock={handleUnlock} handleLock={handleLock} handleUnlockAll={handleUnlockAll} enrollments={enrollments} fmt={fmt} actionLoading={actionLoading} courses={courses} />
                  </div>
                </>
              )}
            </div>
            </>
          )}

          {/* ── QUOTES ── */}
          {tab === 'quotes' && (
            <>
              <div className="projects-filter reveal" style={{ justifyContent: 'center', marginBottom: 48 }}>
                {['all', 'pending', 'reviewed', 'replied'].map(s => (
                  <button key={s} className={`filter-btn${quoteFilter === s ? ' active' : ''}`} onClick={() => setQuoteFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>

              {quotesLoading ? (
                <div className="reveal" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary-red)', marginBottom: 16, display: 'block' }}></i>
                  <p style={{ color: 'var(--text-dim)' }}>Loading quotes...</p>
                </div>
              ) : (() => {
                const filtered = quoteFilter === 'all' ? adminQuotes : adminQuotes.filter(q => q.status === quoteFilter);
                return filtered.length === 0 ? (
                  <div className="reveal" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <i className="fas fa-envelope-open" style={{ fontSize: 56, marginBottom: 20, display: 'block', color: 'rgba(220,20,60,0.15)' }}></i>
                    <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Quotes Found</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>{quoteFilter !== 'all' ? 'Try changing the filter.' : 'Quote requests will appear here when users submit them.'}</p>
                  </div>
                ) : (
                  <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {filtered.map((q) => {
                      const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                        pending: { bg: 'rgba(255,193,7,0.1)', color: '#ffc107', border: 'rgba(255,193,7,0.2)' },
                        reviewed: { bg: 'rgba(33,150,243,0.1)', color: '#2196f3', border: 'rgba(33,150,243,0.2)' },
                        replied: { bg: 'rgba(76,175,80,0.1)', color: '#4caf50', border: 'rgba(76,175,80,0.2)' },
                      };
                      const sc = statusColors[q.status] || statusColors.pending;
                      const isL = quoteActionLoading === q.id;
                      return (
                        <div key={q.id} className="project-card reveal" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: q.user.avatar ? 'transparent' : 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)', fontSize: 14, fontWeight: 900, flexShrink: 0, overflow: 'hidden' }}>
                                {q.user.avatar ? <img src={q.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : q.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-light)', fontFamily: "'Space Grotesk', sans-serif" }}>{q.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{q.email}{q.phone ? ` · ${q.phone}` : ''}{q.company ? ` · ${q.company}` : ''}</div>
                              </div>
                            </div>
                            <span style={{ padding: '4px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 2, fontFamily: "'Space Grotesk', sans-serif" }}>
                              {q.status}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, padding: '12px 16px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Service</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-light)' }}>{q.serviceType}</div>
                            </div>
                            {q.budget && (
                              <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, padding: '12px 16px' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Budget</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-light)' }}>{q.budget}</div>
                              </div>
                            )}
                            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, padding: '12px 16px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Submitted</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-light)' }}>{new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                          </div>

                          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, padding: '14px 18px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Description</div>
                            <div style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.7 }}>{q.description}</div>
                          </div>

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {q.status !== 'reviewed' && (
                              <button disabled={isL} onClick={() => updateQuoteStatus(q.id, 'reviewed')} className="btn" style={{ padding: '8px 20px', fontSize: 12, background: 'rgba(33,150,243,0.1)', border: '1px solid rgba(33,150,243,0.3)', color: '#2196f3' }}>
                                <i className={isL ? 'fas fa-spinner fa-spin' : 'fas fa-eye'} style={{ marginRight: 6, fontSize: 10 }}></i>Mark Reviewed
                              </button>
                            )}
                            {q.status !== 'replied' && (
                              <button disabled={isL} onClick={() => updateQuoteStatus(q.id, 'replied')} className="btn" style={{ padding: '8px 20px', fontSize: 12, background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', color: '#4caf50' }}>
                                <i className={isL ? 'fas fa-spinner fa-spin' : 'fas fa-reply'} style={{ marginRight: 6, fontSize: 10 }}></i>Mark Replied
                              </button>
                            )}
                            {q.status !== 'pending' && (
                              <button disabled={isL} onClick={() => updateQuoteStatus(q.id, 'pending')} className="btn" style={{ padding: '8px 20px', fontSize: 12, background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', color: '#ffc107' }}>
                                <i className={isL ? 'fas fa-spinner fa-spin' : 'fas fa-undo'} style={{ marginRight: 6, fontSize: 10 }}></i>Reset to Pending
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

          {/* ── TEAM ── */}
          {tab === 'team' && (
            <div className="reveal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text-light)', marginBottom: 4 }}>Team Members</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Manage who appears on the homepage team section</p>
                </div>
                <button onClick={openNewTeamForm} className="btn btn-primary" style={{ fontSize: 12, padding: '10px 20px' }}>
                  <i className="fas fa-plus" style={{ marginRight: 6 }}></i>Add Member
                </button>
              </div>

              {showTeamForm && (
                <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(220,20,60,0.3)', padding: 24, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Name *</label><input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: 13, borderRadius: 2 }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Role *</label><input value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: 13, borderRadius: 2 }} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Bio</label><textarea value={teamForm.bio} onChange={e => setTeamForm({ ...teamForm, bio: e.target.value })} rows={2} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: 13, borderRadius: 2, resize: 'vertical' }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Avatar URL</label><input value={teamForm.avatar} onChange={e => setTeamForm({ ...teamForm, avatar: e.target.value })} placeholder="https://... (leave empty for icon)" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: 13, borderRadius: 2 }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Icon Class</label><input value={teamForm.icon} onChange={e => setTeamForm({ ...teamForm, icon: e.target.value })} placeholder="fas fa-user-tie" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: 13, borderRadius: 2 }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>LinkedIn URL</label><input value={teamForm.linkedinUrl} onChange={e => setTeamForm({ ...teamForm, linkedinUrl: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: 13, borderRadius: 2 }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>GitHub URL</label><input value={teamForm.githubUrl} onChange={e => setTeamForm({ ...teamForm, githubUrl: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: 13, borderRadius: 2 }} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>Display Order</label><input type="number" value={teamForm.displayOrder} onChange={e => setTeamForm({ ...teamForm, displayOrder: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontSize: 13, borderRadius: 2 }} /></div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
                    <button onClick={handleSaveTeamMember} disabled={teamSaving} className="btn btn-primary" style={{ fontSize: 12, padding: '10px 24px' }}>{teamSaving ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Saving...</> : editingTeamMember ? 'Update Member' : 'Add Member'}</button>
                    <button onClick={() => setShowTeamForm(false)} className="btn btn-secondary" style={{ fontSize: 12, padding: '10px 24px' }}>Cancel</button>
                  </div>
                </div>
              )}

              {teamLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--primary-red)' }}></i></div>
              ) : adminTeam.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fas fa-users" style={{ fontSize: 56, marginBottom: 20, display: 'block', color: 'rgba(220,20,60,0.15)' }}></i>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Team Members</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15, opacity: 0.7 }}>Add team members to display them on the homepage.</p>
                </div>
              ) : (
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {adminTeam.map(m => (
                    <div key={m.id} className="project-card" style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: m.avatar ? 'transparent' : 'rgba(220,20,60,0.08)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {m.avatar ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <i className={m.icon || 'fas fa-user-tie'} style={{ fontSize: 20, color: 'var(--primary-red)' }}></i>}
                      </div>
                      <div style={{ flex: 1, minWidth: 150 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-light)' }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--primary-red)', fontWeight: 600, letterSpacing: 1 }}>{m.role}</div>
                        {m.bio && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>{m.bio}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEditTeamForm(m)} className="btn" style={{ padding: '6px 14px', fontSize: 11 }}><i className="fas fa-edit" style={{ marginRight: 4 }}></i>Edit</button>
                        <button onClick={() => handleDeleteTeamMember(m.id)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}><i className="fas fa-trash" style={{ marginRight: 4 }}></i>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TESTS ── */}
          {tab === 'tests' && (
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 16, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fas fa-file-alt" style={{ color: 'var(--primary-red)' }}></i>Manage Tests
                </h3>
                <button onClick={() => { setShowTestForm(true); if (!adminModules.length) fetchModules('all'); }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 11 }}>
                  <i className="fas fa-plus" style={{ marginRight: 6 }}></i>Create Test
                </button>
              </div>

              {showTestForm && (
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '32px 40px', borderRadius: 2, marginBottom: 24 }}>
                  <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 24 }}>
                    <i className="fas fa-plus" style={{ color: 'var(--primary-red)', marginRight: 8 }}></i>New Test
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Module *</label>
                      <select value={testForm.moduleId} onChange={e => setTestForm(f => ({ ...f, moduleId: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }}>
                        <option value="">Select module...</option>
                        {adminModules.map(m => <option key={m.id} value={m.id}>M{String(m.moduleOrder).padStart(2, '0')}: {m.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Title *</label>
                      <input value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Module 1 Quiz" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Time Limit (minutes)</label>
                      <input type="number" value={testForm.timeLimit} onChange={e => setTestForm(f => ({ ...f, timeLimit: parseInt(e.target.value) || 30 }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Passing Score (%)</label>
                      <input type="number" value={testForm.passingScore} onChange={e => setTestForm(f => ({ ...f, passingScore: parseInt(e.target.value) || 70 }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Description</label>
                    <input value={testForm.description} onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional test description" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleCreateTest} disabled={testsSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 11 }}>
                      <i className={testsSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} style={{ marginRight: 6 }}></i>{testsSaving ? 'Creating...' : 'Create Test'}
                    </button>
                    <button onClick={() => setShowTestForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 11, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>Cancel</button>
                  </div>
                </div>
              )}

              {testsLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary-red)' }}></i></div>
              ) : adminTests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fas fa-file-alt" style={{ fontSize: 56, marginBottom: 20, display: 'block', color: 'rgba(220,20,60,0.15)' }}></i>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Tests Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Click "Create Test" to create your first test.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {adminTests.map((t) => (
                    <div key={t.id} className="project-card reveal" style={{ padding: '24px 32px', border: selectedTestId === t.id ? '1px solid rgba(220,20,60,0.4)' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 2, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="fas fa-file-alt" style={{ fontSize: 18, color: 'var(--primary-red)' }}></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 4 }}>{t.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                              Module: {t.moduleTitle} &middot; {t.questionCount} question{t.questionCount !== 1 ? 's' : ''} &middot; {t.attemptCount} attempt{t.attemptCount !== 1 ? 's' : ''} &middot; <span style={{ color: 'var(--primary-red)', fontWeight: 700 }}><i className="fas fa-clock" style={{ marginRight: 4, fontSize: 10 }}></i>{t.timeLimit} min</span> &middot; Pass: {t.passingScore}%
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                          <button onClick={() => fetchTestDetail(t.id)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: selectedTestId === t.id ? 'rgba(220,20,60,0.1)' : 'transparent', border: selectedTestId === t.id ? '1px solid rgba(220,20,60,0.3)' : '1px solid var(--border-color)', color: selectedTestId === t.id ? 'var(--primary-red)' : 'var(--text-dim)' }}>
                            <i className="fas fa-eye" style={{ marginRight: 4 }}></i>Details
                          </button>
                          <button onClick={() => handleDeleteTest(t.id)} disabled={testActionLoading === t.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
                            <i className={testActionLoading === t.id ? 'fas fa-spinner fa-spin' : 'fas fa-trash-alt'} style={{ marginRight: 4 }}></i>Delete
                          </button>
                        </div>
                      </div>

                      {/* Test detail panel */}
                      {selectedTestId === t.id && (
                        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
                          {!selectedTest ? (
                            <div style={{ textAlign: 'center', padding: 30 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 20, color: 'var(--primary-red)' }}></i></div>
                          ) : (
                            <>
                              {/* Questions section */}
                              <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>
                                    <i className="fas fa-list-ol" style={{ color: 'var(--primary-red)', marginRight: 8 }}></i>Questions ({selectedTest.questions.length})
                                  </h4>
                                  <button onClick={() => setShowQuestionForm(true)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
                                    <i className="fas fa-plus" style={{ marginRight: 4 }}></i>Add Question
                                  </button>
                                </div>

                                {showQuestionForm && (
                                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: 20, borderRadius: 2, marginBottom: 16 }}>
                                    <h5 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', marginBottom: 12 }}>New Question</h5>
                                    <div style={{ marginBottom: 12 }}>
                                      <label style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>Question Text *</label>
                                      <input value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} placeholder="Type your question..." style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                      <label style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Options * <span style={{ fontSize: 9, color: '#eab308' }}>(select correct answer by clicking the radio button)</span>
                                      </label>
                                      {questionForm.options.map((opt, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                          <input type="radio" name="correctAnswer" checked={questionForm.correctAnswer === idx} onChange={() => setQuestionForm(f => ({ ...f, correctAnswer: idx }))} style={{ accentColor: '#22c55e', cursor: 'pointer' }} />
                                          <span style={{ fontSize: 12, color: 'var(--text-dim)', width: 20, flexShrink: 0 }}>{String.fromCharCode(65 + idx)}.</span>
                                          <input value={opt} onChange={e => updateQuestionOption(idx, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + idx)}`} style={{ flex: 1, padding: '8px 12px', background: 'var(--input-bg)', border: `1px solid ${questionForm.correctAnswer === idx ? 'rgba(34,197,94,0.4)' : 'var(--border-color)'}`, borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                                          {questionForm.options.length > 2 && (
                                            <button onClick={() => removeQuestionOption(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}><i className="fas fa-times"></i></button>
                                          )}
                                        </div>
                                      ))}
                                      {questionForm.options.length < 6 && (
                                        <button onClick={addQuestionOption} style={{ background: 'none', border: '1px dashed var(--border-color)', borderRadius: 2, padding: '6px 12px', color: 'var(--text-dim)', fontSize: 11, cursor: 'pointer', marginTop: 4 }}>
                                          <i className="fas fa-plus" style={{ marginRight: 4 }}></i>Add Option
                                        </button>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                      <div>
                                        <label style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>Points</label>
                                        <input type="number" value={questionForm.points} onChange={e => setQuestionForm(f => ({ ...f, points: parseInt(e.target.value) || 1 }))} style={{ width: 80, padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                                      </div>
                                      <button onClick={handleAddQuestion} disabled={testsSaving} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 11, marginTop: 16 }}>
                                        <i className={testsSaving ? 'fas fa-spinner fa-spin' : 'fas fa-check'} style={{ marginRight: 4 }}></i>{testsSaving ? 'Adding...' : 'Add Question'}
                                      </button>
                                      <button onClick={() => { setShowQuestionForm(false); setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }); }} className="btn" style={{ padding: '8px 20px', fontSize: 11, marginTop: 16, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>Cancel</button>
                                    </div>
                                  </div>
                                )}

                                {selectedTest.questions.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-dim)', fontSize: 13 }}>
                                    <i className="fas fa-inbox" style={{ fontSize: 24, display: 'block', marginBottom: 8, opacity: 0.5 }}></i>No questions yet. Add one above.
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedTest.questions.map((q, idx) => {
                                      const opts: string[] = (() => { try { return JSON.parse(q.options); } catch { return []; } })();
                                      return (
                                        <div key={q.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '14px 18px', borderRadius: 2 }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>
                                              Q{idx + 1}. {q.questionText}
                                              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-dim)' }}>({q.points}pt)</span>
                                            </div>
                                            <button onClick={() => handleDeleteQuestion(q.id)} disabled={testActionLoading === q.id} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                                              <i className={testActionLoading === q.id ? 'fas fa-spinner fa-spin' : 'fas fa-trash'}></i>
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
                                            {opts.map((opt, oi) => (
                                              <span key={oi} style={{
                                                padding: '3px 10px', borderRadius: 2, fontSize: 11,
                                                background: oi === q.correctAnswer ? 'rgba(34,197,94,0.12)' : 'var(--input-bg)',
                                                border: `1px solid ${oi === q.correctAnswer ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'}`,
                                                color: oi === q.correctAnswer ? '#22c55e' : 'var(--text-dim)',
                                              }}>
                                                {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctAnswer && <i className="fas fa-check" style={{ marginLeft: 4 }}></i>}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Unlock/Lock student panel */}
                              <div style={{ marginBottom: 24 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)', marginBottom: 12 }}>
                                  <i className="fas fa-unlock" style={{ color: 'var(--primary-red)', marginRight: 8 }}></i>Test Access — Enrolled Students
                                </h4>
                                {(() => {
                                  // Use enrolled students directly from the API (already filtered for this course)
                                  const students = testEnrolledStudents;
                                  // Use selectedTest.unlocks (has full unlock data) NOT t.unlocks (summary list has no unlock data)
                                  const unlockedUserIds = new Set((selectedTest?.unlocks || []).map((u: { userId: string }) => u.userId));

                                  if (students.length === 0) {
                                    return (
                                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 13, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
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
                                          <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 2, gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: user.avatar ? 'transparent' : 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: 'var(--primary-red)', overflow: 'hidden', flexShrink: 0 }}>
                                                {user.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : user.name.charAt(0).toUpperCase()}
                                              </div>
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                                              </div>
                                            </div>
                                            <span style={{ padding: '3px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: isUnlocked ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: isUnlocked ? '#22c55e' : '#ef4444', border: isUnlocked ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)', flexShrink: 0 }}>
                                              {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                                            </span>
                                            <button
                                              onClick={() => isUnlocked ? handleLockTest(t.id, user.id, user.name) : handleUnlockTest(t.id, user.id)}
                                              disabled={isLoading}
                                              className="btn"
                                              style={{ padding: '5px 14px', fontSize: 10, minWidth: 80, background: isUnlocked ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: isUnlocked ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)', color: isUnlocked ? '#ef4444' : '#22c55e', flexShrink: 0 }}
                                            >
                                              <i className={isLoading ? 'fas fa-spinner fa-spin' : isUnlocked ? 'fas fa-lock' : 'fas fa-lock-open'} style={{ marginRight: 4, fontSize: 9 }}></i>
                                              {isUnlocked ? 'Lock' : 'Unlock'}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Attempts / Grades */}
                              <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)', marginBottom: 12 }}>
                                  <i className="fas fa-chart-bar" style={{ color: 'var(--primary-red)', marginRight: 8 }}></i>Student Attempts
                                </h4>
                                {selectedTest.attempts.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 13 }}>No attempts yet.</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedTest.attempts.map((a) => {
                                      const pct = a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 100) : 0;
                                      return (
                                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 2, flexWrap: 'wrap' }}>
                                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.user.avatar ? 'transparent' : 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--primary-red)', overflow: 'hidden', flexShrink: 0 }}>
                                            {a.user.avatar ? <img src={a.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : a.user.name.charAt(0).toUpperCase()}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 150 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{a.user.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.user.email}</div>
                                          </div>
                                          <div style={{ fontSize: 20, fontWeight: 900, color: a.passed ? '#22c55e' : '#ef4444', fontFamily: "'Orbitron', sans-serif" }}>{pct}%</div>
                                          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{a.score}/{a.totalPoints}</div>
                                          <span style={{ padding: '3px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: a.passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: a.passed ? '#22c55e' : '#ef4444', border: a.passed ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>{a.passed ? 'PASSED' : 'FAILED'}</span>
                                          {a.submittedAt && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{new Date(a.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                                          <button onClick={() => handleResetAttempt(t.id, a.userId, a.user.name)} disabled={testActionLoading === `reset-${a.userId}`} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#eab308' }}>
                                            <i className={testActionLoading === `reset-${a.userId}` ? 'fas fa-spinner fa-spin' : 'fas fa-redo'} style={{ marginRight: 4 }}></i>Reset
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

          {/* ── ANALYTICS ── */}
          {tab === 'analytics' && (
            !analytics ? (
              <div className="reveal" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary-red)', marginBottom: 16, display: 'block' }}></i>
                <p style={{ color: 'var(--text-dim)' }}>Loading analytics...</p>
              </div>
            ) : (
              <div className="reveal" style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 48 }}>
                  {[
                    { label: 'Total Users', val: analytics.totalUsers, icon: 'fa-users', color: 'var(--primary-red)' },
                    { label: 'Users This Week', val: analytics.usersThisWeek, icon: 'fa-user-plus', color: '#22c55e' },
                    { label: 'Total Enrollments', val: analytics.totalEnrollments, icon: 'fa-graduation-cap', color: '#eab308' },
                    { label: 'Pending Review', val: analytics.pendingEnrollments, icon: 'fa-clock', color: '#f97316' },
                  ].map((s, i) => (
                    <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: 24, borderRadius: 2 }}>
                      <i className={`fas ${s.icon}`} style={{ fontSize: 18, color: s.color, marginBottom: 12, display: 'block' }}></i>
                      <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: "'Orbitron', sans-serif", marginBottom: 4 }}>{s.val}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Course Popularity */}
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 20 }}>
                  <i className="fas fa-chart-bar" style={{ color: 'var(--primary-red)', marginRight: 8 }}></i>Course Popularity
                </h3>
                <div style={{ marginBottom: 48 }}>
                  {((analytics.coursePopularity || []) as Array<Record<string, unknown>>).map((c, i) => {
                    const maxVal = Math.max(...((analytics.coursePopularity || []) as Array<Record<string, unknown>>).map(x => (x._count as Record<string, number>).id));
                    const pct = maxVal > 0 ? ((c._count as Record<string, number>).id / maxVal) * 100 : 0;
                    return (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>{c.courseName}</span>
                          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{(c._count as Record<string, number>).id} enrollments</span>
                        </div>
                        <div style={{ height: 10, background: 'var(--input-bg)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary-red), #ff4466)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Activity */}
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', marginBottom: 20 }}>
                  <i className="fas fa-stream" style={{ color: 'var(--primary-red)', marginRight: 8 }}></i>Recent Activity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {((analytics.recentActivity || []) as Array<Record<string, unknown>>).map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--primary-red)', flexShrink: 0 }}>
                        {(a.user as Record<string, string>).name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>
                          <span style={{ color: 'var(--text-light)' }}>{(a.user as Record<string, string>).name}</span>
                          {' '}enrolled in <span style={{ color: 'var(--primary-red)' }}>{a.courseName}</span>
                        </div>
                      </div>
                      <span style={{ padding: '3px 12px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: a.status === 'approved' ? 'rgba(34,197,94,0.12)' : a.status === 'declined' ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)', color: a.status === 'approved' ? '#22c55e' : a.status === 'declined' ? '#ef4444' : '#eab308' }}>{a.status}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', minWidth: 120, textAlign: 'right' }}>{fmt(a.enrolledAt as string)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
          {/* ── SERVICES ── */}
          {tab === 'services' && (
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 16, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fas fa-concierge-bell" style={{ color: 'var(--primary-red)' }}></i>Manage Services
                </h3>
                <button onClick={openNewServiceForm} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 11 }}>
                  <i className="fas fa-plus" style={{ marginRight: 6 }}></i>Add Service
                </button>
              </div>

              {showServiceForm && (
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '32px 40px', borderRadius: 2, marginBottom: 24 }}>
                  <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fas fa-edit" style={{ color: 'var(--primary-red)' }}></i>{editingService ? 'Edit Service' : 'New Service'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Title</label>
                      <input value={serviceForm.title} onChange={e => handleServiceTitleChange(e.target.value)} placeholder="Service title" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Slug</label>
                      <input value={serviceForm.slug} onChange={e => setServiceForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated-from-title" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-dim)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Icon (FA class)</label>
                      <input value={serviceForm.icon} onChange={e => setServiceForm(f => ({ ...f, icon: e.target.value }))} placeholder="fas fa-cog" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Display Order</label>
                      <input type="number" value={serviceForm.displayOrder} onChange={e => setServiceForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Status</label>
                      <select value={serviceForm.status} onChange={e => setServiceForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }}>
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Description</label>
                    <textarea value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} placeholder="Service description" rows={3} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none', resize: 'vertical' }} />
                  </div>

                  {/* Features */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-list" style={{ color: 'var(--primary-red)' }}></i>Features ({serviceFeatures.length})
                    </label>
                    {serviceFeatures.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {serviceFeatures.map((feat, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
                            <i className={feat.icon} style={{ fontSize: 14, color: 'var(--primary-red)', width: 20, textAlign: 'center' }}></i>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)' }}>{feat.title}</div>
                              {feat.description && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{feat.description}</div>}
                            </div>
                            <button onClick={() => removeServiceFeature(idx)} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Feature Title</div>
                        <input value={newServiceFeature.title} onChange={e => setNewServiceFeature(f => ({ ...f, title: e.target.value }))} placeholder="Feature title" style={{ width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Description</div>
                        <input value={newServiceFeature.description} onChange={e => setNewServiceFeature(f => ({ ...f, description: e.target.value }))} placeholder="Short description" style={{ width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Icon</div>
                        <input value={newServiceFeature.icon} onChange={e => setNewServiceFeature(f => ({ ...f, icon: e.target.value }))} placeholder="fas fa-check" style={{ width: '100%', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                      </div>
                      <button onClick={addServiceFeature} className="btn" style={{ padding: '8px 14px', fontSize: 11, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.3)', color: 'var(--primary-red)' }}>
                        <i className="fas fa-plus" style={{ marginRight: 4 }}></i>Add
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={handleSaveService} disabled={serviceSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 11 }}>
                      <i className={serviceSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} style={{ marginRight: 6 }}></i>{serviceSaving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                    </button>
                    <button onClick={() => setShowServiceForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 11, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>Cancel</button>
                  </div>
                </div>
              )}

              {servicesLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary-red)' }}></i></div>
              ) : services.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fas fa-concierge-bell" style={{ fontSize: 56, marginBottom: 20, display: 'block', color: 'rgba(220,20,60,0.15)' }}></i>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Services Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Click "Add Service" to create your first service.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[...services].sort((a, b) => a.displayOrder - b.displayOrder).map((s, idx) => (
                    <div key={s.id} className="project-card reveal" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 2, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className={s.icon} style={{ fontSize: 18, color: 'var(--primary-red)' }}></i>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)' }}>{s.title}</div>
                              <span style={{ padding: '2px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: s.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: s.status === 'active' ? '#22c55e' : '#ef4444', border: s.status === 'active' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>{s.status}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>/ {s.slug} &middot; Order: {s.displayOrder}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={() => openEditServiceForm(s)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.3)', color: 'var(--primary-red)' }}>
                            <i className={actionLoading === s.id ? 'fas fa-spinner fa-spin' : 'fas fa-edit'} style={{ marginRight: 4 }}></i>Edit
                          </button>
                          <button onClick={() => handleToggleServiceStatus(s)} disabled={actionLoading === s.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: s.status === 'active' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)', border: s.status === 'active' ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(34,197,94,0.3)', color: s.status === 'active' ? '#eab308' : '#22c55e' }}>
                            <i className={actionLoading === s.id ? 'fas fa-spinner fa-spin' : s.status === 'active' ? 'fas fa-eye-slash' : 'fas fa-eye'} style={{ marginRight: 4 }}></i>{s.status === 'active' ? 'Hide' : 'Show'}
                          </button>
                          <button onClick={() => handleDeleteService(s)} disabled={actionLoading === s.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
                            <i className={actionLoading === s.id ? 'fas fa-spinner fa-spin' : 'fas fa-trash-alt'} style={{ marginRight: 4 }}></i>Delete
                          </button>
                        </div>
                      </div>
                      {s.description && <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>{s.description}</div>}
                      {s.features.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {s.features.map((feat, fidx) => (
                            <span key={fidx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, fontSize: 11, color: 'var(--text-dim)' }}>
                              <i className={feat.icon} style={{ fontSize: 10, color: 'var(--primary-red)' }}></i>{feat.title}
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

          {/* ── COURSES ── */}
          {tab === 'courses' && (
            <div className="reveal" style={{ maxWidth: 1100, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 16, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fas fa-graduation-cap" style={{ color: 'var(--primary-red)' }}></i>Manage Courses
                </h3>
                <button onClick={openNewCourseForm} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 11 }}>
                  <i className="fas fa-plus" style={{ marginRight: 6 }}></i>Add Course
                </button>
              </div>

              {showCourseForm && (
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '32px 40px', borderRadius: 2, marginBottom: 24 }}>
                  <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fas fa-edit" style={{ color: 'var(--primary-red)' }}></i>{editingCourse ? 'Edit Course' : 'New Course'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Title</label>
                      <input value={courseForm.title} onChange={e => handleCourseTitleChange(e.target.value)} placeholder="Course title" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Slug</label>
                      <input value={courseForm.slug} onChange={e => setCourseForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated-from-title" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-dim)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Level</label>
                      <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }}>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="all-levels">All Levels</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Duration</label>
                      <input value={courseForm.duration} onChange={e => setCourseForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 8 weeks" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Price</label>
                      <input value={courseForm.price} onChange={e => setCourseForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. $99 or Free" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Icon (FA class)</label>
                      <input value={courseForm.icon} onChange={e => setCourseForm(f => ({ ...f, icon: e.target.value }))} placeholder="fas fa-book" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Status</label>
                      <select value={courseForm.status} onChange={e => setCourseForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }}>
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Tech Stack</label>
                      <input value={courseForm.techStack} onChange={e => setCourseForm(f => ({ ...f, techStack: e.target.value }))} placeholder="e.g. Python, TensorFlow" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Description</label>
                    <textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} placeholder="Course description" rows={3} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none', resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, display: 'block' }}>Prerequisites</label>
                    <textarea value={courseForm.prerequisites} onChange={e => setCourseForm(f => ({ ...f, prerequisites: e.target.value }))} placeholder="e.g. Basic Python knowledge" rows={2} style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none', resize: 'vertical' }} />
                  </div>

                  {/* Features */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-list" style={{ color: 'var(--primary-red)' }}></i>Features ({courseForm.features.length})
                    </label>
                    {courseForm.features.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {courseForm.features.map((feat, idx) => (
                          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, fontSize: 12, color: 'var(--text-light)' }}>
                            {feat}
                            <button onClick={() => removeCourseFeature(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: 0 }}><i className="fas fa-times"></i></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={courseFeatureInput} onChange={e => setCourseFeatureInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCourseFeature(); } }} placeholder="Add a feature and press Enter" style={{ flex: 1, padding: '8px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                      <button onClick={addCourseFeature} className="btn" style={{ padding: '8px 14px', fontSize: 11, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.3)', color: 'var(--primary-red)' }}>
                        <i className="fas fa-plus" style={{ marginRight: 4 }}></i>Add
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={handleSaveCourse} disabled={courseSaving} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 11 }}>
                      <i className={courseSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} style={{ marginRight: 6 }}></i>{courseSaving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                    </button>
                    <button onClick={() => setShowCourseForm(false)} className="btn" style={{ padding: '10px 24px', fontSize: 11, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>Cancel</button>
                  </div>
                </div>
              )}

              {coursesLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary-red)' }}></i></div>
              ) : courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <i className="fas fa-graduation-cap" style={{ fontSize: 56, marginBottom: 20, display: 'block', color: 'rgba(220,20,60,0.15)' }}></i>
                  <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 10, color: 'var(--text-dim)' }}>No Courses Yet</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 15 }}>Click "Add Course" to create your first course.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {courses.map((c) => (
                    <div key={c.id} className="project-card reveal" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 250 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 2, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className={c.icon} style={{ fontSize: 20, color: 'var(--primary-red)' }}></i>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-light)' }}>{c.title}</div>
                              <span style={{ padding: '2px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: c.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: c.status === 'active' ? '#22c55e' : '#ef4444', border: c.status === 'active' ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>{c.status}</span>
                              <span style={{ padding: '2px 10px', borderRadius: 2, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(220,20,60,0.1)', color: 'var(--primary-red)', border: '1px solid rgba(220,20,60,0.2)' }}>{c.level}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>/ {c.slug}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                          <button onClick={() => toggleCourseModules(c.id)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: expandedCourseId === c.id ? 'rgba(220,20,60,0.1)' : 'transparent', border: expandedCourseId === c.id ? '1px solid rgba(220,20,60,0.3)' : '1px solid var(--border-color)', color: expandedCourseId === c.id ? 'var(--primary-red)' : 'var(--text-dim)' }}>
                            <i className="fas fa-layer-group" style={{ marginRight: 4 }}></i>Modules ({c.moduleCount || 0})
                          </button>
                          <button onClick={() => openEditCourseForm(c)} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.3)', color: 'var(--primary-red)' }}>
                            <i className="fas fa-edit" style={{ marginRight: 4 }}></i>Edit
                          </button>
                          <button onClick={() => handleToggleCourseStatus(c)} disabled={actionLoading === c.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: c.status === 'active' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)', border: c.status === 'active' ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(34,197,94,0.3)', color: c.status === 'active' ? '#eab308' : '#22c55e' }}>
                            <i className={actionLoading === c.id ? 'fas fa-spinner fa-spin' : c.status === 'active' ? 'fas fa-eye-slash' : 'fas fa-eye'} style={{ marginRight: 4 }}></i>{c.status === 'active' ? 'Hide' : 'Show'}
                          </button>
                          <button onClick={() => handleDeleteCourse(c)} disabled={actionLoading === c.id} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
                            <i className={actionLoading === c.id ? 'fas fa-spinner fa-spin' : 'fas fa-trash-alt'} style={{ marginRight: 4 }}></i>Delete
                          </button>
                        </div>
                      </div>

                      {/* Course details */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, paddingLeft: 64 }}>
                        {c.duration && (
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Duration</div>
                            <div style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 700 }}>{c.duration}</div>
                          </div>
                        )}
                        {c.price && (
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Price</div>
                            <div style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 700 }}>{c.price}</div>
                          </div>
                        )}
                        {c.techStack && (
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Tech Stack</div>
                            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{c.techStack}</div>
                          </div>
                        )}
                      </div>

                      {c.description && <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, paddingLeft: 64 }}>{c.description}</div>}

                      {c.features.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 64 }}>
                          {c.features.map((feat, fidx) => (
                            <span key={fidx} style={{ padding: '3px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, fontSize: 11, color: 'var(--text-dim)' }}>
                              <i className="fas fa-check" style={{ marginRight: 4, fontSize: 9, color: 'var(--primary-red)' }}></i>{feat}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expanded modules view */}
                      {expandedCourseId === c.id && (
                        <div style={{ marginTop: 8, padding: '20px 24px', background: 'var(--card-bg)', border: '1px solid rgba(220,20,60,0.2)', borderRadius: 2 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <i className="fas fa-layer-group" style={{ color: 'var(--primary-red)' }}></i>Course Modules
                            </h4>
                            <button onClick={openNewModuleForm} className="btn" style={{ padding: '6px 14px', fontSize: 11, background: 'rgba(220,20,60,0.1)', border: '1px solid rgba(220,20,60,0.3)', color: 'var(--primary-red)' }}>
                              <i className="fas fa-plus" style={{ marginRight: 4 }}></i>Add Module
                            </button>
                          </div>

                          {showModuleForm && (
                            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '20px 24px', borderRadius: 2, marginBottom: 16 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                                <i className="fas fa-edit" style={{ color: 'var(--primary-red)', marginRight: 6 }}></i>{editingModule ? 'Edit Module' : 'New Module'}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, marginBottom: 12 }}>
                                <div>
                                  <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Title</div>
                                  <input value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))} placeholder="Module title" style={{ width: '100%', padding: '8px 12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Order</div>
                                  <input type="number" value={moduleForm.moduleOrder} onChange={e => setModuleForm(f => ({ ...f, moduleOrder: parseInt(e.target.value) || 1 }))} style={{ width: '100%', padding: '8px 12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                                </div>
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Description</div>
                                <input value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" style={{ width: '100%', padding: '8px 12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none' }} />
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Content</div>
                                  <button onClick={() => setModulePreviewOpen(!modulePreviewOpen)} className="btn" style={{ padding: '3px 10px', fontSize: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', background: modulePreviewOpen ? 'rgba(220,20,60,0.1)' : 'transparent', border: modulePreviewOpen ? '1px solid rgba(220,20,60,0.3)' : '1px solid var(--border-color)', color: modulePreviewOpen ? 'var(--primary-red)' : 'var(--text-dim)' }}>
                                    <i className={modulePreviewOpen ? 'fas fa-eye-slash' : 'fas fa-eye'} style={{ marginRight: 4, fontSize: 9 }}></i>{modulePreviewOpen ? 'Hide' : 'Preview'}
                                  </button>
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6, opacity: 0.6 }}>
                                  Markdown supported. YouTube/Vimeo URLs auto-embed.
                                </div>
                                <textarea value={moduleForm.content} onChange={e => setModuleForm(f => ({ ...f, content: e.target.value }))} placeholder="Module content (markdown or HTML)" rows={6} style={{ width: '100%', padding: '10px 12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-light)', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, outline: 'none', resize: 'vertical' }} />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handleSaveModule} disabled={moduleSaving} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 11 }}>
                                  <i className={moduleSaving ? 'fas fa-spinner fa-spin' : 'fas fa-save'} style={{ marginRight: 4 }}></i>{moduleSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button onClick={() => { setShowModuleForm(false); setEditingModule(null); setModulePreviewOpen(false); }} className="btn" style={{ padding: '8px 18px', fontSize: 11, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>Cancel</button>
                              </div>
                              {modulePreviewOpen && moduleForm.content && (
                                <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--dark-gray)', border: '1px solid var(--border-color)', borderRadius: 2, maxHeight: 300, overflowY: 'auto' }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                                    <i className="fas fa-eye" style={{ color: 'var(--primary-red)', marginRight: 6 }}></i>Preview
                                  </div>
                                  <div className="markdown-preview" style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>
                                    <ReactMarkdown components={{
                                      h1: ({children}) => <h1 style={{fontSize: 20, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, marginTop: 16}}>{children}</h1>,
                                      h2: ({children}) => <h2 style={{fontSize: 17, fontWeight: 700, color: 'var(--text-light)', marginBottom: 6, marginTop: 14}}>{children}</h2>,
                                      h3: ({children}) => <h3 style={{fontSize: 15, fontWeight: 700, color: 'var(--text-light)', marginBottom: 4, marginTop: 12}}>{children}</h3>,
                                      p: ({children}) => <p style={{marginBottom: 8}}>{children}</p>,
                                      code: ({children}) => <code style={{background: 'rgba(220,20,60,0.1)', padding: '1px 5px', borderRadius: 2, fontSize: 12, fontFamily: 'monospace'}}>{children}</code>,
                                      pre: ({children}) => <pre style={{background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 2, overflowX: 'auto', marginBottom: 8}}>{children}</pre>,
                                      ul: ({children}) => <ul style={{paddingLeft: 20, marginBottom: 8}}>{children}</ul>,
                                      ol: ({children}) => <ol style={{paddingLeft: 20, marginBottom: 8}}>{children}</ol>,
                                      blockquote: ({children}) => <blockquote style={{borderLeft: '3px solid var(--primary-red)', paddingLeft: 12, opacity: 0.8, marginBottom: 8}}>{children}</blockquote>,
                                      a: ({children, href}) => <a href={href} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-red)', textDecoration: 'underline'}}>{children}</a>,
                                    }}>{moduleForm.content}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {courseModulesLoading ? (
                            <div style={{ textAlign: 'center', padding: 30 }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: 'var(--primary-red)' }}></i></div>
                          ) : courseModules.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)', fontSize: 13 }}>No modules yet. Click "Add Module" to create one.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {[...courseModules].sort((a, b) => a.moduleOrder - b.moduleOrder).map(mod => (
                                <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 2, gap: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-red)', textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(220,20,60,0.1)', padding: '2px 8px', border: '1px solid rgba(220,20,60,0.2)', borderRadius: 2, flexShrink: 0 }}>M{String(mod.moduleOrder).padStart(2, '0')}</span>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.title}</div>
                                      {mod.description && <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.description}</div>}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => openEditModuleForm(mod)} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button onClick={() => handleDeleteModule(mod)} disabled={actionLoading === mod.id} className="btn" style={{ padding: '4px 10px', fontSize: 10, background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
                                      <i className={actionLoading === mod.id ? 'fas fa-spinner fa-spin' : 'fas fa-trash-alt'}></i>
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

        {/* ═══ FOOTER ═══ */}
        <footer style={{ borderTop: '1px solid var(--border-color)', padding: '40px 60px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', position: 'relative' }}>
          <div className="grid-bg"></div>
          <span style={{ color: 'var(--primary-red)' }}>X.Foundry</span> &mdash; Admin Panel &mdash; {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
}
