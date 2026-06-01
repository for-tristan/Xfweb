'use client';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
  onClick?: () => void;
  highlight?: boolean;
}
export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  isFixed?: boolean;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  // Vaulta extra panel content
  user?: any;
  theme?: string;
  onChangeTheme?: (theme: string) => void;
  onOpenAuth?: (tab: 'signin' | 'signup', msg?: string) => void;
  onLogout?: () => void;
  notifications?: { id: string; title: string; message: string; read: boolean; createdAt: string; type?: string }[];
  unreadCount?: number;
  loadNotifications?: () => void;
  onAcceptFriend?: (friendshipId: string) => void;
  onRejectFriend?: (friendshipId: string) => void;
  setDashboardOpen?: (open: boolean) => void;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#B497CF', '#5227FF'],
  items = [],
  displayItemNumbering = true,
  className,
  logoUrl,
  menuButtonColor = '#fff',
  openMenuButtonColor = '#fff',
  accentColor = '#5227FF',
  isFixed = false,
  changeMenuColorOnOpen = true,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
  // Vaulta extras
  user,
  theme,
  onChangeTheme,
  onOpenAuth,
  onLogout,
  notifications = [],
  unreadCount = 0,
  loadNotifications,
  onAcceptFriend,
  onRejectFriend,
  setDashboardOpen,
}: StaggeredMenuProps) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const textWrapRef = useRef<HTMLSpanElement | null>(null);
  const [textLines, setTextLines] = useState<string[]>(['Menu', 'Close']);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);

  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);

  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  // Initialize GSAP — runs on mount and when deps change
  const initGsap = useCallback(() => {
    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    const textInner = textInnerRef.current;

    if (!panel || !textInner) return;

    let preLayers: HTMLElement[] = [];
    if (preContainer) {
      preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
    }
    preLayerElsRef.current = preLayers;

    const offscreen = position === 'left' ? -100 : 100;
    gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
    if (preContainer) {
      gsap.set(preContainer, { xPercent: 0, opacity: 1 });
    }

    gsap.set(textInner, { yPercent: 0 });

    if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });

    // Hide backdrop initially
    if (backdropRef.current) gsap.set(backdropRef.current, { autoAlpha: 0 });
  }, [menuButtonColor, position]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      initGsap();
    });
    return () => ctx.revert();
  }, [initGsap]);

  // Re-sync GSAP inline styles when the component becomes visible on resize
  // (parent .staggered-menu-mobile-only toggles display:none/block at 1570px)
  React.useEffect(() => {
    let prevVisible = false;
    const checkVisibility = () => {
      const wrapper = document.querySelector('.staggered-menu-mobile-only');
      if (!wrapper) return;
      const isVisible = window.getComputedStyle(wrapper).display !== 'none';
      if (isVisible && !prevVisible) {
        // Component just became visible — re-initialize GSAP to fix stale styles
        requestAnimationFrame(() => {
          gsap.context(() => {
            initGsap();
          });
        });
      }
      prevVisible = isVisible;
    };
    // Check on resize
    window.addEventListener('resize', checkVisibility);
    // Also check initially
    checkVisibility();
    return () => window.removeEventListener('resize', checkVisibility);
  }, [initGsap]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
    ) as HTMLElement[];
    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { ['--sm-num-opacity' as any]: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;

      tl.to(
        itemEls,
        { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1, from: 'start' } },
        itemsStart
      );

      if (numberEls.length) {
        tl.to(
          numberEls,
          { duration: 0.6, ease: 'power2.out', ['--sm-num-opacity' as any]: 1, stagger: { each: 0.08, from: 'start' } },
          itemsStart + 0.1
        );
      }
    }

    // Backdrop fade-in
    if (backdropRef.current) {
      tl.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 0);
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();

    const offscreen = position === 'left' ? -100 : 100;

    // Backdrop fade-out (run in parallel with panel close)
    if (backdropRef.current) {
      gsap.to(backdropRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
    }

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });

        const numberEls = Array.from(
          panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
        ) as HTMLElement[];
        if (numberEls.length) gsap.set(numberEls, { ['--sm-num-opacity' as any]: 0 });

        busyRef.current = false;
      }
    });
  }, [position]);



  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, { color: targetColor, delay: 0.18, duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  React.useEffect(() => {
    if (toggleBtnRef.current) {
      if (changeMenuColorOnOpen) {
        const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
        gsap.set(toggleBtnRef.current, { color: targetColor });
      } else {
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      }
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;

    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const cycles = 3;

    const seq: string[] = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu';
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);

    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });

    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;

    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out'
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }

    animateColor(target);
    animateText(target);
  }, [playOpen, playClose, animateColor, animateText, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateColor(false);
      animateText(false);
    }
  }, [playClose, animateColor, animateText, onMenuClose]);

  React.useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu]);

  return (
    <div
      className={`sm-scope z-40 pointer-events-none ${isFixed ? 'fixed top-0 left-0 w-screen h-screen' : 'w-full h-full'}`}
    >
      {/* ═══ Backdrop blur overlay ═══ */}
      <div
        ref={backdropRef}
        className="sm-backdrop pointer-events-auto"
        onClick={closeMenu}
        aria-hidden="true"
      />

      <div
        className={
          (className ? className + ' ' : '') + 'staggered-menu-wrapper pointer-events-none relative w-full h-full z-40'
        }
        style={accentColor ? ({ ['--sm-accent' as any]: accentColor } as React.CSSProperties) : undefined}
        data-position={position}
        data-open={open || undefined}
      >
        <div
          ref={preLayersRef}
          className="sm-prelayers absolute top-0 right-0 bottom-0 pointer-events-none z-[5]"
          aria-hidden="true"
        >
          {(() => {
            const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
            let arr = [...raw];
            if (arr.length >= 3) {
              const mid = Math.floor(arr.length / 2);
              arr.splice(mid, 1);
            }
            return arr.map((c, i) => (
              <div
                key={i}
                className="sm-prelayer absolute top-0 right-0 h-full w-full translate-x-0"
                style={{ background: c }}
              />
            ));
          })()}
        </div>

        <header
          className="staggered-menu-header absolute top-0 right-0 flex items-center justify-end pr-[1.5em] pt-[1.5em] bg-transparent pointer-events-none z-30"
          aria-label="Main navigation header"
        >
          <button
            ref={toggleBtnRef}
            className={`sm-toggle relative inline-flex items-center bg-transparent border-0 cursor-pointer font-semibold text-[1.1rem] leading-none overflow-visible pointer-events-auto${
              open ? 'sm-toggle-open' : ''
            }`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="staggered-menu-panel"
            onClick={toggleMenu}
            type="button"
          >
            <span
              ref={textWrapRef}
              className="sm-toggle-textWrap relative inline-block h-[1em] overflow-hidden whitespace-nowrap"
              aria-hidden="true"
            >
              <span ref={textInnerRef} className="sm-toggle-textInner flex flex-col leading-none">
                {textLines.map((l, i) => (
                  <span className="sm-toggle-line block h-[1em] leading-none" key={i}>
                    {l}
                  </span>
                ))}
              </span>
            </span>
          </button>
        </header>

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel absolute top-0 right-0 h-full flex flex-col p-[6em_2em_2em_2em] overflow-y-auto z-10 pointer-events-auto"
          aria-hidden={!open}
        >
          <div className="sm-panel-inner flex-1 flex flex-col gap-5">
            <ul
              className="sm-panel-list list-none m-0 p-0 flex flex-col gap-2"
              role="list"
              data-numbering={displayItemNumbering || undefined}
            >
              {items && items.length ? (
                items.map((it, idx) => (
                  <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={it.label + idx}>
                    {it.onClick ? (
                      <button
                        className="sm-panel-item relative text-black font-semibold cursor-pointer leading-none uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline bg-transparent border-0 text-left w-full"
                        aria-label={it.ariaLabel}
                        data-index={idx + 1}
                        onClick={() => { it.onClick?.(); closeMenu(); }}
                      >
                        <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                          {it.label}
                        </span>
                      </button>
                    ) : (
                      <a
                        className={`sm-panel-item relative text-black font-semibold cursor-pointer leading-none uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline${it.highlight ? ' sm-panel-item-highlight' : ''}`}
                        href={it.link}
                        aria-label={it.ariaLabel}
                        data-index={idx + 1}
                        onClick={() => closeMenu()}
                      >
                        <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                          {it.label}
                        </span>
                      </a>
                    )}
                  </li>
                ))
              ) : (
                <li className="sm-panel-itemWrap relative overflow-hidden leading-none" aria-hidden="true">
                  <span className="sm-panel-item relative text-black font-semibold cursor-pointer leading-none uppercase transition-[background,color] duration-150 ease-linear inline-block no-underline">
                    <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                      No items
                    </span>
                  </span>
                </li>
              )}
            </ul>

            {/* ═══ VAULTA EXTRAS ═══ */}
            <div className="sm-vaulta-extras mt-auto pt-8 flex flex-col gap-6">
              {/* Theme selector */}
              {onChangeTheme && theme && (
                <div className="flex items-center gap-4">
                  <label className="sm-extras-label flex items-center gap-2" htmlFor="sm-theme-select">
                    <i className="fa-solid fa-palette" style={{ fontSize: 14 }} />
                    Theme
                  </label>
                  <select
                    id="sm-theme-select"
                    value={theme}
                    onChange={(e) => onChangeTheme(e.target.value)}
                    className="sm-extras-select flex-1"
                  >
                    <optgroup label="Dark">
                      {['crimson','midnight','oled','phantom','synthwave','frost','cyberpunk','crimson-night','aurora','volcano','slate','deep-ocean','dusk','espresso','moss','twilight'].map(t => (
                        <option key={t} value={t}>{t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Light">
                      {['light','sand','lavender','mint','rose-gold','honey','clay','sage','peach'].map(t => (
                        <option key={t} value={t}>{t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}

              {/* Notifications (logged-in only) */}
              {user && notifications.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="sm-extras-label" style={{ gap: 8, display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-bell" style={{ fontSize: 14 }} />
                    Notifications{unreadCount > 0 ? ` (${unreadCount} new)` : ''}
                  </span>
                  <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
                    {notifications.slice(0, 6).map((n) => {
                      const timeAgo = (() => {
                        try {
                          const diff = Date.now() - new Date(n.createdAt).getTime();
                          const mins = Math.floor(diff / 60000);
                          if (mins < 1) return 'just now';
                          if (mins < 60) return `${mins}m ago`;
                          const hrs = Math.floor(mins / 60);
                          if (hrs < 24) return `${hrs}h ago`;
                          const days = Math.floor(hrs / 24);
                          return `${days}d ago`;
                        } catch { return ''; }
                      })();
                      const typeIcon = n.type === 'friend_request' ? 'fa-user-plus' : n.type === 'enrollment' ? 'fa-graduation-cap' : n.type === 'achievement' ? 'fa-trophy' : 'fa-circle-info';
                      return (
                        <div
                          key={n.id}
                          className={`sm-notif-item ${n.read ? 'sm-notif-read' : 'sm-notif-unread'}`}
                          onClick={async () => {
                            if (!n.read) {
                              try { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationId: n.id }) }); } catch {}
                              loadNotifications?.();
                            }
                          }}
                        >
                          <div className="sm-notif-header">
                            <i className={`fa-solid ${typeIcon}`} style={{ fontSize: 12, color: 'var(--sm-accent)', flexShrink: 0 }} />
                            <span className="sm-notif-title">{n.title}</span>
                            {timeAgo && <span className="sm-notif-time">{timeAgo}</span>}
                          </div>
                          {n.message && <p className="sm-notif-msg">{n.message}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auth / Profile */}
              {!user ? (
                <div className="flex gap-4">
                  <button
                    className="sm-auth-btn sm-auth-signin flex-1"
                    onClick={() => { onOpenAuth?.('signin'); closeMenu(); }}
                  >
                    Sign In
                  </button>
                  <button
                    className="sm-auth-btn sm-auth-signup flex-1"
                    onClick={() => { onOpenAuth?.('signup'); closeMenu(); }}
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    className="sm-profile-pill"
                    onClick={() => { setDashboardOpen?.(true); closeMenu(); }}
                  >
                    <span className="sm-profile-avatar">
                      {user.avatar ? <img src={user.avatar} alt="" className="sm-profile-avatar-img" /> : user.name?.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="sm-profile-name">{user.name}</span>
                      <span className="sm-profile-email">{user.email}</span>
                    </div>
                  </button>
                  <button
                    className="sm-logout-btn"
                    onClick={() => { onLogout?.(); closeMenu(); }}
                  >
                    <i className="fa-solid fa-sign-out-alt" style={{ fontSize: 15 }} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
/* ═══ Theme-aware CSS variables ═══ */
.sm-scope {
  --sm-panel-bg: var(--card-bg, #111111);
  --sm-panel-text: var(--text-light, #efefef);
  --sm-panel-text-dim: var(--text-dim, #999);
  --sm-panel-border: var(--border-color, rgba(255,255,255,0.08));
  --sm-panel-input-bg: var(--input-bg, rgba(255,255,255,0.03));
}
[data-theme="light"] .sm-scope,
[data-theme="sand"] .sm-scope,
[data-theme="lavender"] .sm-scope,
[data-theme="mint"] .sm-scope,
[data-theme="rose-gold"] .sm-scope,
[data-theme="honey"] .sm-scope,
[data-theme="clay"] .sm-scope,
[data-theme="sage"] .sm-scope,
[data-theme="peach"] .sm-scope {
  --sm-panel-bg: #ffffff;
  --sm-panel-text: #1a1a1a;
  --sm-panel-text-dim: #666;
  --sm-panel-border: rgba(0,0,0,0.08);
  --sm-panel-input-bg: rgba(0,0,0,0.03);
}

/* ═══ Backdrop ═══ */
.sm-scope .sm-backdrop { position: fixed; inset: 0; z-index: 1; background: rgba(0,0,0,0.35); backdrop-filter: blur(8px) saturate(1.2); -webkit-backdrop-filter: blur(8px) saturate(1.2); opacity: 0; visibility: hidden; cursor: pointer; }
[data-theme="light"] .sm-scope .sm-backdrop,
[data-theme="sand"] .sm-scope .sm-backdrop,
[data-theme="lavender"] .sm-scope .sm-backdrop,
[data-theme="mint"] .sm-scope .sm-backdrop,
[data-theme="rose-gold"] .sm-scope .sm-backdrop,
[data-theme="honey"] .sm-scope .sm-backdrop,
[data-theme="clay"] .sm-scope .sm-backdrop,
[data-theme="sage"] .sm-scope .sm-backdrop,
[data-theme="peach"] .sm-scope .sm-backdrop { background: rgba(255,255,255,0.4); backdrop-filter: blur(8px) saturate(1.1); -webkit-backdrop-filter: blur(8px) saturate(1.1); }

/* ═══ Layout ═══ */
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 40; pointer-events: none; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; right: 0; display: flex; align-items: center; justify-content: flex-end; padding-right: 1.5em; padding-top: 1.5em; background: transparent; pointer-events: none; z-index: 30; }
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope .sm-toggle { position: relative; display: inline-flex; align-items: center; background: transparent; border: none; cursor: pointer; color: var(--text-light, #e9e9ef); font-weight: 700; font-size: 1.1rem; line-height: 1; overflow: visible; z-index: 999; }
.sm-scope .sm-toggle.sm-toggle-open { color: var(--sm-panel-text, #fff); }
.sm-scope .sm-toggle:focus-visible { outline: 2px solid var(--sm-accent, #ffffffaa); outline-offset: 4px; border-radius: 4px; }
.sm-scope .sm-toggle-textWrap { position: relative; display: inline-block; height: 1em; overflow: hidden; white-space: nowrap; min-width: 4ch; }
.sm-scope .sm-toggle-textInner { display: flex; flex-direction: column; line-height: 1; }
.sm-scope .sm-toggle-line { display: block; height: 1em; line-height: 1; }


/* ═══ Panel ═══ */
.sm-scope .staggered-menu-panel { position: absolute; top: 0; right: 0; width: clamp(340px, 46vw, 600px); height: 100%; background: var(--sm-panel-bg); display: flex; flex-direction: column; padding: 5em 2.5em 2em 2.5em; overflow-y: auto; z-index: 10; }
.sm-scope [data-position='left'] .staggered-menu-panel { right: auto; left: 0; }
.sm-scope .sm-prelayers { position: absolute; top: 0; right: 0; bottom: 0; width: clamp(340px, 46vw, 600px); pointer-events: none; z-index: 5; }
.sm-scope [data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-prelayer { position: absolute; top: 0; right: 0; height: 100%; width: 100%; transform: translateX(0); }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }

/* ═══ Nav items ═══ */
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1; }
.sm-scope .sm-panel-item { position: relative; color: var(--sm-panel-text); font-weight: 700; font-size: clamp(2.2rem, 5.5vw, 3.8rem); cursor: pointer; line-height: 1.15; letter-spacing: -1.5px; text-transform: uppercase; transition: color 0.25s; display: block; text-decoration: none; padding-right: 3.5rem; }
.sm-scope .sm-panel-itemLabel { display: inline-block; will-change: transform; transform-origin: 50% 100%; }
.sm-scope .sm-panel-item:hover { color: var(--sm-accent, #ff0000); }
.sm-scope .sm-panel-item-highlight { color: var(--sm-accent, #dc143c) !important; }
.sm-scope .sm-panel-item-highlight:hover { color: var(--sm-accent, #dc143c) !important; text-shadow: 0 0 18px color-mix(in srgb, var(--sm-accent, #dc143c) 35%, transparent); }
.sm-scope .sm-panel-item-highlight::after { color: var(--sm-accent, #dc143c) !important; }

/* ═══ Item numbers ═══ */
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); position: absolute; top: 0; right: 0; font-size: 0.35em; font-weight: 500; color: var(--sm-accent, #ff0000); letter-spacing: 1px; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); transition: opacity 0.3s ease; line-height: 1; }

/* ═══ Vaulta Extras ═══ */
.sm-scope .sm-vaulta-extras { color: var(--sm-panel-text); }
.sm-scope .sm-extras-label { font-size: 0.8rem; font-weight: 700; color: var(--sm-panel-text-dim); text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }
.sm-scope .sm-extras-select { flex: 1; font-size: 0.95rem; background: var(--sm-panel-input-bg); border: 1px solid var(--sm-panel-border); border-radius: 10px; padding: 0.65rem 0.9rem; color: var(--sm-panel-text); cursor: pointer; outline: none; transition: border-color 0.2s; }
.sm-scope .sm-extras-select:focus { border-color: var(--sm-accent); }

/* ═══ Notifications ═══ */
.sm-scope .sm-notif-item { font-size: 0.85rem; padding: 0.7rem 0.85rem; border-radius: 10px; cursor: pointer; transition: all 0.2s; color: var(--sm-panel-text-dim); }
.sm-scope .sm-notif-unread { color: var(--sm-panel-text); background: color-mix(in srgb, var(--sm-accent) 10%, transparent); }
.sm-scope .sm-notif-item:hover { background: color-mix(in srgb, var(--sm-accent) 6%, transparent); }
.sm-scope .sm-notif-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem; }
.sm-scope .sm-notif-title { font-weight: 700; flex: 1; font-size: 0.88rem; }
.sm-scope .sm-notif-time { font-size: 0.7rem; color: var(--sm-panel-text-dim); white-space: nowrap; margin-left: auto; }
.sm-scope .sm-notif-msg { margin: 0; font-size: 0.78rem; line-height: 1.4; color: var(--sm-panel-text-dim); opacity: 0.85; padding-left: 1.3rem; }

/* ═══ Auth buttons ═══ */
.sm-scope .sm-auth-btn { font-size: 1rem; font-weight: 700; padding: 0.85rem 1.5rem; border-radius: 12px; cursor: pointer; transition: all 0.2s; text-align: center; }
.sm-scope .sm-auth-signin { background: transparent; border: 1.5px solid var(--sm-panel-border); color: var(--sm-panel-text); }
.sm-scope .sm-auth-signin:hover { border-color: var(--sm-accent); color: var(--sm-accent); }
.sm-scope .sm-auth-signup { background: var(--sm-accent); border: none; color: #fff; }
.sm-scope .sm-auth-signup:hover { opacity: 0.9; }

/* ═══ Profile pill ═══ */
.sm-scope .sm-profile-pill { display: flex; align-items: center; gap: 0.9rem; width: 100%; text-align: left; font-size: 1rem; font-weight: 500; color: var(--sm-panel-text); background: transparent; border: 1.5px solid var(--sm-panel-border); border-radius: 14px; padding: 0.85rem 1rem; cursor: pointer; transition: border-color 0.2s; }
.sm-scope .sm-profile-pill:hover { border-color: var(--sm-accent); }
.sm-scope .sm-profile-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--sm-accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 800; flex-shrink: 0; }
.sm-scope .sm-profile-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.sm-scope .sm-profile-name { font-weight: 700; font-size: 1rem; color: var(--sm-panel-text); }
.sm-scope .sm-profile-email { font-size: 0.8rem; color: var(--sm-panel-text-dim); }

/* ═══ Logout ═══ */
.sm-scope .sm-logout-btn { display: flex; align-items: center; gap: 0.7rem; width: 100%; text-align: left; font-size: 1rem; font-weight: 500; color: var(--sm-panel-text-dim); background: transparent; border: 1.5px solid color-mix(in srgb, var(--sm-panel-border) 60%, transparent); border-radius: 12px; padding: 0.7rem 1rem; cursor: pointer; transition: all 0.2s; }
.sm-scope .sm-logout-btn:hover { color: var(--sm-accent); border-color: var(--sm-accent); }

/* ═══ Responsive ═══ */
@media (max-width: 1570px) { .sm-scope .sm-toggle { font-size: 1rem; } }
@media (max-width: 1024px) { .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; } .sm-scope .sm-prelayers { width: 100%; } }
@media (max-width: 640px) { .sm-scope .staggered-menu-panel { width: 100%; left: 0; right: 0; } .sm-scope .sm-prelayers { width: 100%; } }
      `}</style>
    </div>
  );
};

export default StaggeredMenu;
