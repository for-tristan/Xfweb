'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, size: `${Math.random() * 2 + 1}px`,
    duration: `${Math.random() * 20 + 15}s`, delay: `${Math.random() * 15}s`,
  }));
}
const particles = generateParticles(50);

function UnlockStudentPanel({ admin, modules, unlockLoading, handleUnlock, handleLock, handleUnlockAll, enrollments, fmt, actionLoading }: {
  admin: User;
  modules: CourseModule[];
  unlockLoading: string | null;
  handleUnlock: (userId: string, moduleId: string) => void;
  handleLock: (userId: string, moduleId: string) => void;
  handleUnlockAll: (userId: string, courseId: string) => void;
  enrollments: Enrollment[];
  fmt: (d: string) => string;
  actionLoading: string | null;
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
        const userModules = modules.filter(m => m.courseId === enr.courseId);
        const courseId = enr.courseId;
        const courseLabel = courseId === 'ml-bootcamp' ? 'ML Bootcamp' : 'Linux Basics';

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
                  onClick={() => handleUnlockAll(userId, courseId)}
                  disabled={unlockLoading === `${userId}-all`}
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
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'enrollments' | 'users' | 'progress' | 'modules' | 'analytics'>('enrollments');
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

  const COURSE_TOTAL_MODULES: Record<string, number> = {
    'ml-bootcamp': 8,
    'linux-basics': 6,
  };

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

  useEffect(() => { if (admin) { fetchEnrollments(statusFilter); fetchUsers(); loadNotifications(); } }, [admin, statusFilter, fetchEnrollments, fetchUsers, loadNotifications]);

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
            <li><a href="/#services">Services</a></li>
            <li><a href="/#projects">Projects</a></li>
            <li><a href="/#courses">Courses</a></li>
            <li><a href="/study">Study</a></li>
            <li><a href="/#team">Team</a></li>
            <li><a href="/#contact">Contact</a></li>
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
        <section className="hero" style={{ minHeight: '40vh', paddingTop: 80, paddingBottom: 40 }}>
          <div className="grid-bg"></div><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="scan-line"></div>
          <div className="hero-content reveal" style={{ textAlign: 'center' }}>
            <h1 className="hero-title" style={{ fontSize: 'clamp(32px, 4vw, 60px)' }}>Command <span className="highlight">Center</span></h1>
            <p className="hero-subtitle">Manage enrollments, users, and platform activity.</p>
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="section" style={{ paddingTop: 80, paddingBottom: 100 }}>
          <div className="grid-bg"></div><div className="scan-line"></div>
          <div className="section-header reveal">
            <span className="section-tag">Overview</span>
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
                  {['all', 'ml-bootcamp', 'linux-basics'].map(c => (
                    <button key={c} className={`filter-btn${modulesCourseFilter === c ? ' active' : ''}`} onClick={() => { setModulesCourseFilter(c); fetchModules(c); }}>
                      {c === 'all' ? 'All Courses' : c === 'ml-bootcamp' ? 'ML Bootcamp' : 'Linux Basics'}
                    </button>
                  ))}
                </div>
                <button onClick={handleSeedModules} disabled={seedLoading} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 11 }}>
                  <i className={seedLoading ? 'fas fa-spinner fa-spin' : 'fas fa-database'} style={{ marginRight: 6 }}></i>Seed Content
                </button>
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
                    {adminModules.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 40, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No modules found. Click "Seed Content" to create modules.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                        {adminModules.map(mod => {
                          const unlockCount = mod.unlocks.length;
                          const courseLabel = mod.courseId === 'ml-bootcamp' ? 'ML Bootcamp' : 'Linux Basics';
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
                    )}
                  </div>

                  {/* Section B: Per-Student Module Access Control */}
                  <div>
                    <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 16, marginBottom: 20, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="fas fa-key" style={{ color: 'var(--primary-red)' }}></i>Student Module Access
                    </h3>
                    <UnlockStudentPanel admin={admin} modules={adminModules} unlockLoading={unlockLoading} handleUnlock={handleUnlock} handleLock={handleLock} handleUnlockAll={handleUnlockAll} enrollments={enrollments} fmt={fmt} actionLoading={actionLoading} />
                  </div>
                </>
              )}
            </div>
            </>
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
