'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

interface DraggableScrollProps {
  children: React.ReactNode;
  className?: string;

  autoSpeed?: number;
}


export default function DraggableScroll({ children, className = '', autoSpeed = 0 }: DraggableScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const dragDistance = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);

  const currentPos = useRef(0);
  const targetPos = useRef(0);
  const velocity = useRef(0);

  const animFrame = useRef<number | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPaused = useRef(false);

  const LERP = 0.1;
  const MAX_MOMENTUM = 600;
  const halfWidth = useRef(0);

  const measureHalfWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    halfWidth.current = track.scrollWidth / 2;
  }, []);

  const normalizePosition = useCallback((pos: number) => {
    if (halfWidth.current <= 0) return pos;
    while (pos <= -halfWidth.current) pos += halfWidth.current;
    while (pos > 0) pos -= halfWidth.current;
    return pos;
  }, []);

  const animate = useCallback(() => {
    if (autoSpeed > 0 && !isDragging.current && !autoPaused.current) {
      targetPos.current -= autoSpeed;
    }

    targetPos.current = normalizePosition(targetPos.current);

    let delta = targetPos.current - currentPos.current;
    if (halfWidth.current > 0 && Math.abs(delta) > halfWidth.current / 2) {
      if (delta > 0) delta -= halfWidth.current;
      else delta += halfWidth.current;
    }
    currentPos.current += delta * LERP;
    currentPos.current = normalizePosition(currentPos.current);

    velocity.current = delta * LERP;

    const track = trackRef.current;
    if (track) {
      track.style.transform = `translate3d(${currentPos.current}px, 0, 0)`;
    }

    animFrame.current = requestAnimationFrame(animate);
  }, [autoSpeed, normalizePosition]);

  const startAnimation = useCallback(() => {
    if (animFrame.current === null) {
      animFrame.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const pauseAutoScroll = useCallback(() => {
    autoPaused.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const resumeAutoScroll = useCallback((delay = 2000) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      autoPaused.current = false;
    }, delay);
  }, []);

  const applyMomentum = useCallback(() => {
    if (dragDistance.current < 5) return;
    const raw = velocity.current * 6;
    const clamped = Math.max(-MAX_MOMENTUM, Math.min(MAX_MOMENTUM, raw));
    targetPos.current += clamped;
  }, []);

  const endDrag = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setGrabbing(false);
    applyMomentum();
    resumeAutoScroll();
  }, [applyMomentum, resumeAutoScroll]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragDistance.current = 0;
    startX.current = e.pageX;
    scrollStart.current = targetPos.current;
    lastX.current = e.pageX;
    lastTime.current = Date.now();
    setGrabbing(true);
    pauseAutoScroll();
  }, [pauseAutoScroll]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();

    const walk = e.pageX - startX.current;
    dragDistance.current = Math.abs(walk);
    targetPos.current = scrollStart.current + walk;

    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (e.pageX - lastX.current) / dt * 16;
    }
    lastX.current = e.pageX;
    lastTime.current = now;
  }, []);

  const onMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const onMouseLeave = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setGrabbing(false);
    applyMomentum();
    resumeAutoScroll(800);
  }, [applyMomentum, resumeAutoScroll]);

  const onMouseEnter = useCallback(() => {}, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      isDragging.current = true;
      dragDistance.current = 0;
      startX.current = touch.clientX;
      scrollStart.current = targetPos.current;
      lastX.current = touch.clientX;
      lastTime.current = Date.now();
      pauseAutoScroll();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const touch = e.touches[0];
      const walk = touch.clientX - startX.current;
      dragDistance.current = Math.abs(walk);
      targetPos.current = scrollStart.current + walk;

      const now = Date.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        velocity.current = (touch.clientX - lastX.current) / dt * 16;
      }
      lastX.current = touch.clientX;
      lastTime.current = now;
    };

    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      applyMomentum();
      resumeAutoScroll();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [pauseAutoScroll, resumeAutoScroll, applyMomentum]);

  useEffect(() => {
    measureHalfWidth();
    startAnimation();

    const onResize = () => measureHalfWidth();
    window.addEventListener('resize', onResize);

    const onGlobalMouseUp = () => {
      endDrag();
    };
    window.addEventListener('mouseup', onGlobalMouseUp);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onGlobalMouseUp);
      if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [measureHalfWidth, startAnimation, endDrag]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        overflow: 'hidden',
        cursor: grabbing ? 'grabbing' : 'grab',
        userSelect: grabbing ? 'none' : 'auto',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      <div ref={trackRef} style={{ display: 'flex', gap: '32px', width: 'max-content', willChange: 'transform', padding: '20px 0 40px' }}>
        {children}
      </div>
    </div>
  );
}
