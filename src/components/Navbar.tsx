'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { NavActions } from '@/lib/PageModals';
import { darkThemes, lightThemes } from './ThemePicker';
import { Logo } from './Logo';
import GlassSurface from './GlassSurface';
import StaggeredMenu, { StaggeredMenuHandle } from './StaggeredMenu';

interface NavbarProps {
  scrolled: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  user: any;
  activePage?: string;
  activeNav?: string;
  scrollToSection: (section: string) => void;
  onNavClick?: (e: React.MouseEvent<HTMLElement>) => void;
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
  const staggeredMenuRef = useRef<StaggeredMenuHandle>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1570 && staggeredMenuRef.current?.isOpen()) {
        staggeredMenuRef.current.close();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (section: string) => {
    if (isHome && activeNav) return activeNav === section;
    return activePage === section;
  };

  const logoLink = isHome ? (
    <a href="#home" className="nav-logo" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>
      <Logo className="nav-logo-img" />
    </a>
  ) : (
    <Link href="/" className="nav-logo">
      <Logo className="nav-logo-img" />
    </Link>
  );

  const staggeredMenuItems = [
    { label: 'Home', ariaLabel: 'Go to home page', link: '/', onClick: isHome ? () => scrollToSection('home') : undefined },
    { label: 'Services', ariaLabel: 'View our services', link: '/#services', onClick: isHome ? () => scrollToSection('services') : undefined },
    { label: 'Programs', ariaLabel: 'View our programs', link: '/#courses', onClick: isHome ? () => scrollToSection('courses') : undefined },
    { label: 'Contact', ariaLabel: 'Get in touch', link: '/#contact', onClick: isHome ? () => scrollToSection('contact') : undefined },
    ...(user ? [
      { label: 'Games', ariaLabel: 'Play games', link: '/games' },
      { label: 'Study', ariaLabel: 'Study zone', link: '/study' },
      { label: 'Dashboard', ariaLabel: 'Your dashboard', link: '/dashboard' },
      { label: 'AI', ariaLabel: 'AI chatbot', link: '/chat', highlight: true },
    ] : []),
    ...(user && user.role === 'admin' ? [{ label: 'Admin', ariaLabel: 'Admin panel', link: '/admin' }] : []),
    ...(user && user.role === 'instructor' ? [{ label: 'Instructor', ariaLabel: 'Instructor panel', link: '/instructor' }] : []),
  ];

  return (
    <nav
      className={`navbar${scrolled ? ' scrolled' : ''}`}
      id="navbar"
      onClick={onNavClick}
    >
      {logoLink}
      <GlassSurface
        className="nav-pill-wrapper"
        width="fit-content"
        height="fit-content"
        borderRadius={999}
        backgroundOpacity={scrolled ? 0.16 : 0.1}
        blur={14}
        displace={1}
        distortionScale={-80}
        redOffset={0}
        greenOffset={5}
        blueOffset={10}
        saturation={1.8}
        brightness={55}
        style={{
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: scrolled ? 'scale(0.97)' : 'scale(1)',
          minWidth: 'max-content',
        }}
      >
        <ul className="nav-links-compact">
          {isHome ? (
            <li><a href="#home" className={isActive('home') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
          ) : (
            <li><Link href="/">Home</Link></li>
          )}
          {isHome ? (
            <li><a href="#services" className={isActive('services') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
          ) : (
            <li><Link href="/#services">Services</Link></li>
          )}
          {isHome ? (
            <li><a href="#courses" className={isActive('courses') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Programs</a></li>
          ) : (
            <li><Link href="/#courses">Programs</Link></li>
          )}
          {isHome ? (
            <li><a href="#contact" className={isActive('contact') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
          ) : (
            <li><Link href="/#contact">Contact</Link></li>
          )}
          {user && <li><Link href="/games" className={isActive('games') ? 'active' : ''}>Games</Link></li>}
          {user && <li><Link href="/study" className={isActive('study') ? 'active' : ''}>Study</Link></li>}
          {user && <li><Link href="/dashboard" className={isActive('dashboard') ? 'active' : ''}>Dashboard</Link></li>}
          {user && <li><Link href="/chat" className={`nav-ai-link${isActive('chat') ? ' active' : ''}`}>AI</Link></li>}
          {user && user.role === 'admin' && (
            <li><Link href="/admin" style={{ color: 'var(--primary-red)' }}>Admin</Link></li>
          )}
          {user && user.role === 'instructor' && (
            <li><Link href="/instructor" style={{ color: 'var(--primary-red)' }}>Instructor</Link></li>
          )}
        </ul>
        <ul className="nav-links" id="navLinks">
          {isHome ? (
            <li><a href="#home" className={isActive('home') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
          ) : (
            <li><Link href="/">Home</Link></li>
          )}
          {isHome ? (
            <li><a href="#services" className={isActive('services') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
          ) : (
            <li><Link href="/#services">Services</Link></li>
          )}
          {isHome ? (
            <li><a href="#courses" className={isActive('courses') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('courses'); }}>Programs</a></li>
          ) : (
            <li><Link href="/#courses">Programs</Link></li>
          )}
          {isHome ? (
            <li><a href="#contact" className={isActive('contact') ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
          ) : (
            <li><Link href="/#contact">Contact</Link></li>
          )}
          {user && <li><Link href="/games" className={isActive('games') ? 'active' : ''}>Games</Link></li>}
          {user && <li><Link href="/study" className={isActive('study') ? 'active' : ''}>Study</Link></li>}
          {user && <li><Link href="/dashboard" className={isActive('dashboard') ? 'active' : ''}>Dashboard</Link></li>}
          {user && <li><Link href="/chat" className={`nav-ai-link${isActive('chat') ? ' active' : ''}`}>AI</Link></li>}
          {user && user.role === 'admin' && (
            <li><Link href="/admin" style={{ color: 'var(--primary-red)' }}>Admin</Link></li>
          )}
          {user && user.role === 'instructor' && (
            <li><Link href="/instructor" style={{ color: 'var(--primary-red)' }}>Instructor</Link></li>
          )}
        </ul>
      </GlassSurface>
      <NavActions
        theme={theme} onToggleTheme={onToggleTheme} onChangeTheme={onChangeTheme} onSearchOpen={onSearchOpen}
        user={user} onOpenAuth={onOpenAuth} onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen} onToggleMobile={() => staggeredMenuRef.current?.toggle()}
        notifOpen={notifOpen} setNotifOpen={setNotifOpen}
        notifications={notifications} unreadCount={unreadCount}
        loadNotifications={loadNotifications} setNotifications={setNotifications as any} setUnreadCount={setUnreadCount as any}
        dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen}
      />
      {user && (
        <StaggeredMenu
          ref={staggeredMenuRef}
          position="right"
          items={staggeredMenuItems}
          displayItemNumbering={true}
          menuButtonColor="var(--text-light, #fff)"
          openMenuButtonColor="var(--text-light, #fff)"
          changeMenuColorOnOpen={true}
          colors={['color-mix(in srgb, var(--accent) 40%, #111)', 'color-mix(in srgb, var(--accent) 70%, #222)']}
          accentColor="var(--accent, #dc143c)"
          isFixed={true}
          closeOnClickAway={true}
          hideToggle={false}
          onMenuOpen={() => setMobileMenuOpen(true)}
          onMenuClose={() => setMobileMenuOpen(false)}
          user={user}
          theme={theme}
          onChangeTheme={onChangeTheme}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          notifications={notifications}
          unreadCount={unreadCount}
          loadNotifications={loadNotifications}
          onAcceptFriend={onAcceptFriend}
          onRejectFriend={onRejectFriend}
          setDashboardOpen={setDashboardOpen}
        />
      )}
    </nav>
  );
}
