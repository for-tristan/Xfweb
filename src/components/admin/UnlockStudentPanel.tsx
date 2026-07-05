'use client';

/**
 * UnlockStudentPanel — admin panel for unlocking/locking course modules
 * per student. Shows approved enrollments with per-module unlock toggles.
 */

import type {
  AdminUser,
  AdminEnrollment,
  AdminCourse,
  CourseModuleItem,
} from './types';

interface UnlockStudentPanelProps {
  admin: AdminUser;
  modules: CourseModuleItem[];
  unlockLoading: string | null;
  handleUnlock: (userId: string, moduleId: string) => void;
  handleLock: (userId: string, moduleId: string) => void;
  handleUnlockAll: (userId: string, courseId: string) => void;
  enrollments: AdminEnrollment[];
  fmt: (d: string) => string;
  actionLoading: string | null;
  courses: AdminCourse[];
}

export function UnlockStudentPanel({
  admin: _admin,
  modules,
  unlockLoading,
  handleUnlock,
  handleLock,
  handleUnlockAll,
  enrollments,
  fmt: _fmt,
  actionLoading: _actionLoading,
  courses,
}: UnlockStudentPanelProps) {
  const approvedEnrollments = enrollments.filter((e) => e.status === 'approved');

  if (approvedEnrollments.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
          backdropFilter: 'blur(20px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
          border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
          borderRadius: 12,
        }}
      >
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          No approved students yet. Approve enrollments first.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxHeight: 500,
        overflowY: 'auto',
      }}
    >
      {approvedEnrollments.map((enr) => {
        const userId = enr.user.id;
        const courseObj = courses.find((c) => c.slug === enr.courseId);
        const courseCUID = courseObj?.id;
        const courseLabel = courseObj ? courseObj.title : enr.courseId;
        const userModules = courseCUID
          ? modules.filter((m) => m.courseId === courseCUID)
          : [];

        return (
          <div
            key={enr.id}
            style={{
              background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
              backdropFilter: 'blur(20px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
              border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
              padding: '16px 20px',
              borderRadius: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: enr.user.avatar
                      ? 'transparent'
                      : 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {enr.user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={enr.user.avatar}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    enr.user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>
                    {enr.user.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    {enr.user.email} &middot; {courseLabel}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {userModules.map((mod) => {
                  const isUnlocked = (mod.unlocks || []).some((u) => u.userId === userId);
                  const isLoading = unlockLoading === `${userId}-${mod.id}`;
                  return (
                    <button
                      key={mod.id}
                      onClick={() =>
                        isUnlocked ? handleLock(userId, mod.id) : handleUnlock(userId, mod.id)
                      }
                      disabled={isLoading}
                      className="btn"
                      title={isUnlocked ? `Lock Module ${mod.moduleOrder}` : `Unlock Module ${mod.moduleOrder}`}
                      style={{
                        padding: '6px 14px',
                        fontSize: 11,
                        minWidth: 100,
                        background: isUnlocked
                          ? 'rgba(239,68,68,0.1)'
                          : 'color-mix(in srgb, var(--accent) 10%, transparent)',
                        border: isUnlocked
                          ? '1px solid rgba(239,68,68,0.3)'
                          : '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                        color: isUnlocked ? 'var(--error-color)' : 'var(--accent)',
                      }}
                    >
                      <i
                        className={
                          isLoading
                            ? 'fa-solid fa-spinner fa-spin'
                            : isUnlocked
                              ? 'fa-solid fa-lock'
                              : 'fa-solid fa-lock-open'
                        }
                        style={{ marginRight: 6, fontSize: 10 }}
                      ></i>
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
                  <i
                    className={
                      unlockLoading === `${userId}-all`
                        ? 'fa-solid fa-spinner fa-spin'
                        : 'fa-solid fa-unlock'
                    }
                    style={{ marginRight: 6, fontSize: 10 }}
                  ></i>
                  All
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default UnlockStudentPanel;
