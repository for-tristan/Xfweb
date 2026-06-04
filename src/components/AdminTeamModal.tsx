'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WaveInput } from '@/components/WaveInput';
import { WaveTextarea } from '@/components/WaveTextarea';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  icon: string;
  linkedinUrl: string;
  githubUrl: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  icon: string;
  linkedinUrl: string;
  githubUrl: string;
  displayOrder: string;
}

interface AdminTeamModalProps {
  open: boolean;
  onClose: () => void;
  onTeamSaved?: () => void;
}

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

const emptyForm: FormData = {
  name: '',
  role: '',
  bio: '',
  avatar: '',
  icon: 'fa-solid fa-user-tie',
  linkedinUrl: '',
  githubUrl: '',
  displayOrder: '0',
};

function memberToForm(m: TeamMember): FormData {
  return {
    name: m.name,
    role: m.role,
    bio: m.bio,
    avatar: m.avatar,
    icon: m.icon,
    linkedinUrl: m.linkedinUrl,
    githubUrl: m.githubUrl,
    displayOrder: String(m.displayOrder),
  };
}

// ═══════════════════════════════════════════════════
// ADMIN TEAM MODAL
// ═══════════════════════════════════════════════════

export function AdminTeamModal({ open, onClose, onTeamSaved }: AdminTeamModalProps) {
  const { toast } = useToast();

  // State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formVisible, setFormVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ─── Responsive Detection ───────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ─── Fetch Members ──────────────────────────────
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to load team members', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error fetching team members', variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      resetForm();
    } else {
      setFormVisible(false);
      setEditingId(null);
      setDeleteConfirmId(null);
    }
  }, [open, fetchMembers]);

  // ─── Form Handlers ──────────────────────────────
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormVisible(false);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormVisible(true);
  };

  const handleStartEdit = (member: TeamMember) => {
    setForm(memberToForm(member));
    setEditingId(member.id);
    setFormVisible(true);
    setDeleteConfirmId(null);
  };

  const handleCancelForm = () => {
    resetForm();
  };

  // ─── Save (Create / Update) ─────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast({ title: 'Validation Error', description: 'Name and Role are required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
        icon: form.icon.trim() || 'fa-solid fa-user-tie',
        linkedinUrl: form.linkedinUrl.trim(),
        githubUrl: form.githubUrl.trim(),
        displayOrder: Number(form.displayOrder) || 0,
      };

      const url = '/api/admin/team';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: editingId ? 'Member Updated' : 'Member Added',
          description: `${payload.name} has been ${editingId ? 'updated' : 'added'} successfully.`,
        });
        resetForm();
        fetchMembers();
        onTeamSaved?.();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to save member', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error saving member', variant: 'destructive' });
    }
    setSaving(false);
  };

  // ─── Delete ─────────────────────────────────────
  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        toast({ title: 'Member Deleted', description: 'Team member has been removed.' });
        setDeleteConfirmId(null);
        if (editingId === id) resetForm();
        fetchMembers();
        onTeamSaved?.();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to delete member', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error deleting member', variant: 'destructive' });
    }
    setSaving(false);
  };

  // ─── Early Return ───────────────────────────────
  if (!open) return null;

  // ═══════════════════════════════════════════════
  // STYLES (shared)
  // ═══════════════════════════════════════════════

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
    background: 'var(--input-bg)',
    color: 'var(--text-light, #fff)',
    fontSize: 13,
    fontFamily: "'Space Grotesk', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-dim, #888)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  };

  const fieldColStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manage Team Members"
      data-lenis-prevent
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : 20,
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: isMobile ? '100vh' : '80vh',
          height: isMobile ? '100vh' : undefined,
          background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          border: isMobile ? 'none' : '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
          borderRadius: isMobile ? 0 : 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isMobile ? 'none' : '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px color-mix(in srgb, var(--accent) 6%, transparent)',
          paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0,
          paddingLeft: isMobile ? 'env(safe-area-inset-left, 0px)' : 0,
          paddingRight: isMobile ? 'env(safe-area-inset-right, 0px)' : 0,
        }}
      >
        {/* ─── Header ──────────────────────────── */}
        <div
          style={{
            padding: isMobile ? '12px 16px' : '16px 24px',
            borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: isMobile ? 15 : 16,
              fontWeight: 700,
              fontFamily: 'var(--font-heading, Inter Tight)',
              color: 'var(--text-light, #fff)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              letterSpacing: 1,
            }}
          >
            <i className="fa-solid fa-users-cog" style={{ color: 'var(--accent)', fontSize: isMobile ? 14 : 16 }} />
            Manage Team
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'color-mix(in srgb, var(--text-light) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
              color: 'var(--text-dim, #666)',
              cursor: 'pointer',
              fontSize: 18,
              padding: 0,
              minWidth: isMobile ? 44 : 'auto',
              minHeight: isMobile ? 44 : 'auto',
              width: isMobile ? 44 : 'auto',
              height: isMobile ? 44 : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim, #666)'; }}
          >
            <i className="fa-solid fa-times" />
          </button>
        </div>

        {/* ─── Scrollable Body ─────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? 16 : 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* ── Add Member Toggle ──────────────── */}
          {!formVisible && (
            <button
              onClick={handleStartAdd}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                border: '1px dashed color-mix(in srgb, var(--border-color) 40%, transparent)',
                background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
                color: 'var(--accent)',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: isMobile ? 48 : 'auto',
                width: '100%',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)';
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 5%, transparent)';
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-color) 40%, transparent)';
              }}
            >
              <i className="fa-solid fa-plus" />
              Add New Team Member
            </button>
          )}

          {/* ── Add / Edit Form ────────────────── */}
          {formVisible && (
            <form
              onSubmit={handleSave}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
                borderRadius: 10,
                padding: isMobile ? 16 : 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Form Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className={editingId ? 'fa-solid fa-user-edit' : 'fa-solid fa-user-plus'} style={{ color: 'var(--accent)', fontSize: 14 }} />
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-light, #fff)',
                  }}
                >
                  {editingId ? 'Edit Team Member' : 'New Team Member'}
                </span>
              </div>

              {/* Row 1: Name & Role */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 14,
                }}
              >
                <WaveInput
                  label="Name *"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
                <WaveInput
                  label="Role *"
                  type="text"
                  value={form.role}
                  onChange={(e) => updateField('role', e.target.value)}
                  required
                />
              </div>

              {/* Row 2: Bio (full width) */}
              <WaveTextarea
                label="Bio"
                value={form.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={3}
              />

              {/* Row 3: Avatar URL & Icon */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 14,
                }}
              >
                <WaveInput
                  label="Avatar URL"
                  type="text"
                  value={form.avatar}
                  onChange={(e) => updateField('avatar', e.target.value)}
                />
                <WaveInput
                  label="Icon Class"
                  type="text"
                  value={form.icon}
                  onChange={(e) => updateField('icon', e.target.value)}
                />
              </div>

              {/* Row 4: LinkedIn & GitHub URLs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 14,
                }}
              >
                <WaveInput
                  label="LinkedIn URL"
                  type="text"
                  value={form.linkedinUrl}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                />
                <WaveInput
                  label="GitHub URL"
                  type="text"
                  value={form.githubUrl}
                  onChange={(e) => updateField('githubUrl', e.target.value)}
                />
              </div>

              {/* Row 5: Display Order */}
              <div style={{ maxWidth: 200 }}>
                <WaveInput
                  label="Display Order"
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => updateField('displayOrder', e.target.value)}
                  min={0}
                />
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'flex-end',
                  paddingTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={handleCancelForm}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
                    background: 'transparent',
                    color: 'var(--text-dim, #888)',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: isMobile ? 44 : 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)';
                    e.currentTarget.style.color = 'var(--text-light, #fff)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-color) 60%, transparent)';
                    e.currentTarget.style.color = 'var(--text-dim, #888)';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'var(--text-light)',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: saving ? 0.6 : 1,
                    minHeight: isMobile ? 44 : 'auto',
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.currentTarget.style.filter = 'brightness(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) e.currentTarget.style.filter = 'none';
                  }}
                >
                  {saving ? (
                    <i className="fa-solid fa-spinner fa-spin" />
                  ) : (
                    <i className={editingId ? 'fa-solid fa-check' : 'fa-solid fa-plus'} />
                  )}
                  {editingId ? 'Update Member' : 'Save Member'}
                </button>
              </div>
            </form>
          )}

          {/* ── Divider ────────────────────────── */}
          <div
            style={{
              height: 1,
              background: 'color-mix(in srgb, var(--border-color) 30%, transparent)',
              margin: 0,
            }}
          />

          {/* ── Members List Header ─────────────── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-dim, #888)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontFamily: "'Space Grotesk', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="fa-solid fa-list" style={{ fontSize: 10 }} />
              Team Members
              {!loading && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                    color: 'var(--accent)',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '0 6px',
                  }}
                >
                  {members.length}
                </span>
              )}
            </span>
          </div>

          {/* ── Members List ───────────────────── */}
          {loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                color: 'var(--text-dim, #666)',
                fontSize: 13,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8, fontSize: 16, color: 'var(--accent)' }} />
              Loading team members...
            </div>
          ) : members.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 10,
                padding: '40px 20px',
                color: 'var(--text-dim, #666)',
                fontSize: 13,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="fa-solid fa-user-friends" style={{ fontSize: 18, color: 'var(--accent)', opacity: 0.5 }} />
              </div>
              No team members yet. Add your first member above.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    background: 'var(--card-bg)',
                    border: `1px solid ${
                      deleteConfirmId === member.id
                        ? 'color-mix(in srgb, var(--accent) 30%, transparent)'
                        : 'color-mix(in srgb, var(--border-color) 30%, transparent)'
                    }`,
                    borderRadius: 10,
                    padding: isMobile ? 14 : 16,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Avatar / Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: member.avatar
                        ? 'transparent'
                        : 'color-mix(in srgb, var(--accent) 8%, transparent)',
                      border: member.avatar
                        ? 'none'
                        : '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                      fontSize: 16,
                      overflow: 'hidden',
                    }}
                  >
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                      />
                    ) : (
                      <i className={member.icon} />
                    )}
                  </div>

                  {/* Info */}
                  <div
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      minWidth: 0,
                    }}
                  >
                    {/* Name + Role */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-light, #fff)',
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {member.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--accent)',
                          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                          padding: '2px 8px',
                          borderRadius: 8,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {member.role}
                      </span>
                    </div>

                    {/* Bio (truncated) */}
                    {member.bio && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: 'var(--text-dim, #888)',
                          lineHeight: 1.5,
                          fontFamily: "'Space Grotesk', sans-serif",
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {member.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    {(member.linkedinUrl || member.githubUrl) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        {member.linkedinUrl && (
                          <a
                            href={member.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 11,
                              color: 'var(--text-dim, #888)',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#0a66c2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim, #888)'; }}
                          >
                            <i className="fa-brands fa-linkedin" style={{ fontSize: 12 }} />
                            LinkedIn
                          </a>
                        )}
                        {member.githubUrl && (
                          <a
                            href={member.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 11,
                              color: 'var(--text-dim, #888)',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim, #888)'; }}
                          >
                            <i className="fa-brands fa-github" style={{ fontSize: 12 }} />
                            GitHub
                          </a>
                        )}
                      </div>
                    )}

                    {/* Delete Confirmation */}
                    {deleteConfirmId === member.id && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--accent)',
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          <i className="fa-solid fa-exclamation-triangle" style={{ marginRight: 4 }} />
                          Are you sure you want to delete this member?
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleDelete(member.id)}
                            disabled={saving}
                            style={{
                              padding: '5px 14px',
                              borderRadius: 8,
                              border: 'none',
                              background: 'var(--accent)',
                              color: 'var(--text-light)',
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: "'Space Grotesk', sans-serif",
                              cursor: saving ? 'not-allowed' : 'pointer',
                              opacity: saving ? 0.6 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (!saving) e.currentTarget.style.filter = 'brightness(1.15)';
                            }}
                            onMouseLeave={(e) => {
                              if (!saving) e.currentTarget.style.filter = 'none';
                            }}
                          >
                            {saving ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-trash" />}
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            style={{
                              padding: '5px 14px',
                              borderRadius: 8,
                              border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
                              background: 'transparent',
                              color: 'var(--text-dim, #888)',
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: "'Space Grotesk', sans-serif",
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)';
                              e.currentTarget.style.color = 'var(--text-light, #fff)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-color) 60%, transparent)';
                              e.currentTarget.style.color = 'var(--text-dim, #888)';
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions (top-right) */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => handleStartEdit(member)}
                      aria-label={`Edit ${member.name}`}
                      title="Edit"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
                        background: 'transparent',
                        color: 'var(--text-dim, #888)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        transition: 'all 0.2s',
                        minHeight: isMobile ? 44 : 'auto',
                        minWidth: isMobile ? 44 : 'auto',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--accent)';
                        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)';
                        e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 6%, transparent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-dim, #888)';
                        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-color) 40%, transparent)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(deleteConfirmId === member.id ? null : member.id)}
                      aria-label={`Delete ${member.name}`}
                      title="Delete"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
                        background: 'transparent',
                        color: deleteConfirmId === member.id ? 'var(--accent)' : 'var(--text-dim, #888)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        transition: 'all 0.2s',
                        minHeight: isMobile ? 44 : 'auto',
                        minWidth: isMobile ? 44 : 'auto',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--accent)';
                        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)';
                        e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 6%, transparent)';
                      }}
                      onMouseLeave={(e) => {
                        if (deleteConfirmId !== member.id) {
                          e.currentTarget.style.color = 'var(--text-dim, #888)';
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-color) 40%, transparent)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
