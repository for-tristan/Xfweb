'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NavActions } from '@/lib/PageModals';
import { darkThemes, lightThemes } from './ThemePicker';

interface NavbarProps {
  scrolled: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  user: any;
  activePage?: string;
  activeNav?: string;
  scrollToSection: (section: string) => void;
  onNavClick?: (e: React.MouseEvent<HTMLElement>) => void;
  // NavActions props
  theme: string;
  onToggleTheme: () => void;
  onChangeTheme: (theme: string) => void;
  onSearchOpen: () => void;
  onOpenAuth: (tab: 'signin' | 'signup', msg?: string) => void;
  onLogout: () => void;
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
  notifications: { id: string; title: string; message: string; read: boolean; createdAt: string; type?: string }[];
  unreadCount: number;
  loadNotifications: () => void;
  setNotifications: React.Dispatch<React.SetStateAction<{ id: string; title: string; message: string; read: boolean; createdAt: string; type?: string }[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  dashboardOpen: boolean;
  setDashboardOpen: (open: boolean) => void;
  // Friend request handlers (for mobile notification actions)
  onAcceptFriend?: (friendshipId: string) => void;
  onRejectFriend?: (friendshipId: string) => void;
}

export function Navbar({
  scrolled, mobileMenuOpen, setMobileMenuOpen, user,
  activePage, activeNav, scrollToSection, onNavClick,
  theme, onToggleTheme, onChangeTheme, onSearchOpen, onOpenAuth, onLogout,
  notifOpen, setNotifOpen, notifications, unreadCount, loadNotifications, setNotifications, setUnreadCount,
  dashboardOpen, setDashboardOpen,
  onAcceptFriend, onRejectFriend,
}: NavbarProps) {
  const isHome = activePage === 'home';

  const isActive = (section: string) => {
    if (isHome && activeNav) return activeNav === section;
    return activePage === section;
  };

  const closeMobile = () => setMobileMenuOpen(false);

  // Track which notification is expanded in mobile drawer
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
  const toggleNotifExpand = (id: string) => {
    setExpandedNotifId(prev => prev === id ? null : id);
  };

  // Extract friendship ID from friend request notification
  // The notification message format is "X sent you a friend request" or "X accepted your friend request"
  const getFriendshipIdFromNotif = async (notifId: string) => {
    try {
      // The notification itself doesn't store friendshipId directly.
      // For friend_request type, we need to look it up via the pending requests.
      // We'll use the friends API to get pending requests and match.
      const res = await fetch('/api/friends');
      if (res.ok) {
        const data = await res.json();
        const pending = data.pendingRequests || [];
        // The notification message contains the sender name; match against pending requests
        const notif = notifications.find(n => n.id === notifId);
        if (!notif) return null;
        const match = pending.find((p: any) => notif.message.includes(p.name));
        return match?.id || null;
      }
    } catch { /* ignore */ }
    return null;
  };

  const handleMobileAccept = async (notifId: string) => {
    const friendshipId = await getFriendshipIdFromNotif(notifId);
    if (friendshipId && onAcceptFriend) {
      onAcceptFriend(friendshipId);
    }
  };

  const handleMobileReject = async (notifId: string) => {
    const friendshipId = await getFriendshipIdFromNotif(notifId);
    if (friendshipId && onRejectFriend) {
      onRejectFriend(friendshipId);
    }
  };

  const handleMarkNotifRead = async (notifId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId }),
      });
      loadNotifications();
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readAll: true }),
      });
      loadNotifications();
    } catch { /* ignore */ }
  };

  // Friend request notifications for the drawer
  const friendRequestNotifs = notifications.filter(n => n.type === 'friend_request' && !n.read);
  const otherNotifs = notifications.filter(n => n.type !== 'friend_request');

  return (
    <nav
      className={`navbar${scrolled ? ' scrolled' : ''}`}
      id="navbar"
      onClick={onNavClick}
    >
      {isHome ? (
        <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>X<span>.</span>Foundry</a>
      ) : (
        <Link href="/" className="logo">X<span>.</span>Foundry</Link>
      )}

      {/* Compact inline nav — visible between 1570px and 1140px */}
      <ul className="nav-links-compact">
        {isHome ? (
          <li><a href="#home" className={isActive('home') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
        ) : (
          <li><Link href="/">Home</Link></li>
        )}
        <li><a href="/#services" className={isActive('services') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
        <li><a href="/#courses" className={isActive('courses') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Programs</a></li>
        <li><Link href="/games" className={isActive('games') ? 'active' : ''}>Games</Link></li>
        <li><Link href="/study" className={isActive('study') ? 'active' : ''}>Study</Link></li>
        {user && <li><Link href="/dashboard" className={isActive('dashboard') ? 'active' : ''}>Dashboard</Link></li>}
        <li><a href="/#contact" className={isActive('contact') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
        {user && user.role === 'admin' && (
          <li><Link href="/admin" style={{ color: 'var(--primary-red)' }}>Admin</Link></li>
        )}
      </ul>

      <ul className={`nav-links${mobileMenuOpen ? ' active' : ''}`} id="navLinks">
        {/* Mobile menu header with close button */}
        <li className="mobile-menu-header" aria-hidden="true">
          <span className="mobile-menu-brand">X<span>.</span>Foundry</span>
          <button className="mobile-menu-close" onClick={closeMobile} aria-label="Close menu">&times;</button>
        </li>

        {isHome ? (
          <li><a href="#home" className={isActive('home') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('home'); closeMobile(); }}>Home</a></li>
        ) : (
          <li><Link href="/" onClick={closeMobile}>Home</Link></li>
        )}
        <li><a href="/#services" className={isActive('services') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('services'); closeMobile(); }}>Services</a></li>
        <li><a href="/#courses" className={isActive('courses') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('courses'); closeMobile(); }}>Programs</a></li>
        <li><Link href="/games" className={isActive('games') ? 'active' : ''} onClick={closeMobile}>Games</Link></li>
        <li><Link href="/study" className={isActive('study') ? 'active' : ''} onClick={closeMobile}>Study</Link></li>
        {user && <li><Link href="/dashboard" className={isActive('dashboard') ? 'active' : ''} onClick={closeMobile}>Dashboard</Link></li>}
        <li><a href="/#contact" className={isActive('contact') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('contact'); closeMobile(); }}>Contact</a></li>
        {user && user.role === 'admin' && (
          <li><Link href="/admin" style={{ color: 'var(--primary-red)' }} onClick={closeMobile}>Admin</Link></li>
        )}

        {/* Mobile-only theme section — select dropdown */}
        <li className="mobile-menu-divider" aria-hidden="true" />
        <li className="mobile-theme-section">
          <label className="mobile-theme-label" htmlFor="mobile-theme-select">Theme</label>
          <select
            id="mobile-theme-select"
            className="mobile-theme-select"
            value={theme}
            onChange={(e) => onChangeTheme(e.target.value)}
          >
            <optgroup label="Dark">
              {darkThemes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
            <optgroup label="Light">
              {lightThemes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
          </select>
        </li>

        {/* Mobile-only notifications section */}
        {user && (
          <li className="mobile-notif-section">
            <div className="mobile-notif-header">
              <span className="mobile-notif-title">
                <i className="fa-solid fa-bell" style={{ marginRight: 6, fontSize: 13 }} />
                Notifications
                {unreadCount > 0 && <span className="mobile-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </span>
              {unreadCount > 0 && (
                <button className="mobile-notif-mark-read" onClick={handleMarkAllRead}>Mark all read</button>
              )}
            </div>
            <div className="mobile-notif-list">
              {notifications.length === 0 ? (
                <div className="mobile-notif-empty">
                  <i className="fa-solid fa-bell-slash" />
                  <span>No notifications</span>
                </div>
              ) : (
                notifications.map((n) => {
                  const isExpanded = expandedNotifId === n.id;
                  return (
                    <div
                      key={n.id}
                      className={`mobile-notif-item${n.read ? '' : ' unread'}${isExpanded ? ' expanded' : ''}`}
                      onClick={() => { toggleNotifExpand(n.id); if (!n.read) handleMarkNotifRead(n.id); }}
                    >
                      <div className="mobile-notif-item-row">
                        {!n.read && <div className="mobile-notif-dot" />}
                        <span className="mobile-notif-item-title">{n.title}</span>
                        <i className={`fa-solid fa-chevron-down mobile-notif-chevron${isExpanded ? ' open' : ''}`} />
                      </div>
                      {isExpanded && (
                        <>
                          <div className="mobile-notif-item-msg">{n.message}</div>
                          {n.type === 'friend_request' && !n.read && (
                            <div className="mobile-notif-actions">
                              <button
                                className="mobile-notif-accept"
                                onClick={(e) => { e.stopPropagation(); handleMobileAccept(n.id); }}
                              >
                                Accept
                              </button>
                              <button
                                className="mobile-notif-decline"
                                onClick={(e) => { e.stopPropagation(); handleMobileReject(n.id); }}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </li>
        )}

        <li className="mobile-menu-actions">
          <button className="mobile-action-btn" onClick={() => { onSearchOpen(); closeMobile(); }}>
            <i className="fa-solid fa-search" />
            <span>Search</span>
          </button>
        </li>
        {!user ? (
          <li className="mobile-menu-actions">
            <button className="mobile-auth-btn" onClick={() => { onOpenAuth('signin'); closeMobile(); }}>Sign In</button>
            <button className="mobile-auth-btn mobile-auth-btn-filled" onClick={() => { onOpenAuth('signup'); closeMobile(); }}>Sign Up</button>
          </li>
        ) : (
          <li className="mobile-menu-user">
            <button className="mobile-user-btn" onClick={() => { setDashboardOpen(true); closeMobile(); }}>
              <span className="nav-user-avatar">
                {user.avatar
                  ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : user.name.charAt(0).toUpperCase()
                }
              </span>
              <div className="mobile-user-info">
                <span className="mobile-user-name">{user.name}</span>
                <span className="mobile-user-email">{user.email}</span>
              </div>
            </button>
            <button className="mobile-logout-btn" onClick={() => { onLogout(); closeMobile(); }}>
              <i className="fa-solid fa-sign-out-alt" />
              <span>Log Out</span>
            </button>
          </li>
        )}
      </ul>

      <NavActions
        theme={theme} onToggleTheme={onToggleTheme} onChangeTheme={onChangeTheme} onSearchOpen={onSearchOpen}
        user={user} onOpenAuth={onOpenAuth} onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen} onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
        notifOpen={notifOpen} setNotifOpen={setNotifOpen}
        notifications={notifications} unreadCount={unreadCount}
        loadNotifications={loadNotifications} setNotifications={setNotifications as any} setUnreadCount={setUnreadCount as any}
        dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen}
      />
    </nav>
  );
}
