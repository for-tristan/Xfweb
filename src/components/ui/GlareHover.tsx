'use client';

import './GlareHover.css';

interface GlareHoverProps {
  width?: string;
  height?: string;
  background?: string;
  borderRadius?: string;
  borderColor?: string;
  children?: React.ReactNode;
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  transitionDuration?: number;
  playOnce?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function GlareHover({
  width = '100%',
  height = '100%',
  background = 'transparent',
  borderRadius = '14px',
  borderColor = 'var(--border-color)',
  children,
  glareColor = '#ffffff',
  glareOpacity = 0.3,
  glareAngle = -30,
  glareSize = 300,
  transitionDuration = 800,
  playOnce = false,
  className = '',
  style = {},
  onClick,
}: GlareHoverProps) {
  const hex = glareColor.replace('#', '');
  let rgba = glareColor;
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }

  const vars: React.CSSProperties = {
    ['--gh-width' as string]: width,
    ['--gh-height' as string]: height,
    ['--gh-bg' as string]: background,
    ['--gh-br' as string]: borderRadius,
    ['--gh-angle' as string]: `${glareAngle}deg`,
    ['--gh-duration' as string]: `${transitionDuration}ms`,
    ['--gh-size' as string]: `${glareSize}%`,
    ['--gh-rgba' as string]: rgba,
    ['--gh-border' as string]: borderColor,
  };

  return (
    <div
      className={`glare-hover ${playOnce ? 'glare-hover--play-once' : ''} ${className}`}
      style={{ ...vars, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
