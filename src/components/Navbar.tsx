'use client';

import Link from 'next/link';
import { NavActions } from '@/lib/PageModals';
import { darkThemes, lightThemes } from './ThemePicker';

interface NavbarProps {
  scrolled: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  user: any;
  activePage?: string; // 'home' | 'study' | 'dashboard' | 'courses' | 'services' | 'games' | 'admin'
  activeNav?: string; // For home page scroll-based active tracking
  scrollToSection: (section: string) => void;
  onNavClick?: (e: React.MouseEvent<HTMLElement>) => void; // Home page: close mobile on empty click
  // NavActions props
  theme: string;
  onToggleTheme: () => void;
  onChangeTheme: (theme: string) => void;
  onSearchOpen: () => void;
  onOpenAuth: (tab: 'signin' | 'signup', msg?: string) => void;
  onLogout: () => void;
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
  notifications: { id: string; title: string; message: string; read: boolean; createdAt: string }[];
  unreadCount: number;
  loadNotifications: () => void;
  setNotifications: React.Dispatch<React.SetStateAction<{ id: string; title: string; message: string; read: boolean; createdAt: string }[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  dashboardOpen: boolean;
  setDashboardOpen: (open: boolean) => void;
}

export function Navbar({
  scrolled, mobileMenuOpen, setMobileMenuOpen, user,
  activePage, activeNav, scrollToSection, onNavClick,
  theme, onToggleTheme, onChangeTheme, onSearchOpen, onOpenAuth, onLogout,
  notifOpen, setNotifOpen, notifications, unreadCount, loadNotifications, setNotifications, setUnreadCount,
  dashboardOpen, setDashboardOpen,
}: NavbarProps) {
  const isHome = activePage === 'home';

  // Determine if a nav link is active
  const isActive = (section: string) => {
    if (isHome && activeNav) return activeNav === section;
    return activePage === section;
  };

  const closeMobile = () => setMobileMenuOpen(false);

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

        {/* Mobile-only theme section */}
        <li className="mobile-menu-divider" aria-hidden="true" />
        <li className="mobile-theme-section">
          <span className="mobile-theme-label">Theme</span>
          <span className="mobile-theme-group-label">Dark</span>
          <div className="mobile-theme-grid">
            {darkThemes.map((t) => (
              <button
                key={t.id}
                className={`mobile-theme-chip${theme === t.id ? ' active' : ''}`}
                onClick={() => { onChangeTheme(t.id); }}
              >
                <span className="mobile-theme-dot" style={{ background: t.accent }} />
                {t.name}
              </button>
            ))}
          </div>
          <span className="mobile-theme-group-label">Light</span>
          <div className="mobile-theme-grid">
            {lightThemes.map((t) => (
              <button
                key={t.id}
                className={`mobile-theme-chip${theme === t.id ? ' active' : ''}`}
                onClick={() => { onChangeTheme(t.id); }}
              >
                <span className="mobile-theme-dot" style={{ background: t.accent }} />
                {t.name}
              </button>
            ))}
          </div>
        </li>
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
        loadNotifications={loadNotifications} setNotifications={setNotifications} setUnreadCount={setUnreadCount}
        dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen}
      />
    </nav>
  );
}
