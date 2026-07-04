'use client';

import React, { useEffect, useState } from 'react';

/**
 * GlassSurface — frosted glass effect with backdrop-filter.
 *
 * SIMPLIFIED: The previous version generated SVG displacement maps and
 * used SVG filters for a "liquid glass" refraction effect. This was:
 *   1. Dead code — svgSupported was always false (set to false on mount,
 *      never set to true), so the SVG path never executed.
 *   2. Still paid the cost — the ResizeObserver fired on every layout
 *      change and regenerated the SVG data URL, burning CPU.
 *   3. Incompatible — Safari and Firefox were explicitly excluded.
 *
 * Now it's just backdrop-filter with a solid fallback. 10x cheaper.
 */

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  blur?: number;
  backgroundOpacity?: number;
  saturation?: number;
  className?: string;
  style?: React.CSSProperties;
  isDark?: boolean;
}

const DARK_THEMES = new Set([
  'midnight', 'oled', 'phantom', 'synthwave', 'frost',
  'cyberpunk', 'crimson-night', 'aurora', 'volcano', 'slate',
  'deep-ocean', 'dusk', 'espresso', 'moss', 'twilight', 'crimson',
]);

function useThemeDarkMode(): boolean {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const resolve = () => {
      const theme = document.documentElement.getAttribute('data-theme') || '';
      if (!theme) { setIsDark(false); return; }
      setIsDark(DARK_THEMES.has(theme));
    };
    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = '100%',
  height = 'auto',
  borderRadius = 999,
  blur = 11,
  backgroundOpacity = 0.1,
  saturation = 1.8,
  className = '',
  style = {},
  isDark: isDarkProp,
}) => {
  const isDarkFromTheme = useThemeDarkMode();
  const isDarkMode = isDarkProp !== undefined ? isDarkProp : isDarkFromTheme;

  const blurPx = Math.max(4, Math.min(20, blur));
  const sat = Math.max(1, Math.min(2, saturation));
  const filterStr = `blur(${blurPx}px) saturate(${sat})`;

  const baseStyles: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
  };

  let containerStyles: React.CSSProperties;
  if (isDarkMode) {
    containerStyles = {
      ...baseStyles,
      background: `rgba(255, 255, 255, ${backgroundOpacity * 0.3})`,
      backdropFilter: filterStr,
      WebkitBackdropFilter: filterStr,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'none',
    };
  } else {
    containerStyles = {
      ...baseStyles,
      background: `rgba(255, 255, 255, ${backgroundOpacity * 0.4})`,
      backdropFilter: filterStr,
      WebkitBackdropFilter: filterStr,
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: 'none',
    };
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden transition-all duration-[260ms] ease-out ${className}`}
      style={containerStyles}
    >
      <div className="w-full h-full flex items-center justify-center p-2 rounded-[inherit] relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
