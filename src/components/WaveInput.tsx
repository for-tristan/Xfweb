'use client';

import React, { useRef, useEffect } from 'react';

interface WaveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  children?: React.ReactNode; // For password strength bars, mismatch messages, etc.
}

export function WaveInput({ label, children, value, ...rest }: WaveInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Add/remove .has-value class based on whether input has content
  // (needed for non-required inputs where :valid alone isn't enough)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const sync = () => {
      if (el.value) {
        el.classList.add('has-value');
      } else {
        el.classList.remove('has-value');
      }
    };
    sync();
    el.addEventListener('input', sync);
    el.addEventListener('change', sync);
    return () => {
      el.removeEventListener('input', sync);
      el.removeEventListener('change', sync);
    };
  }, [value]);

  // Split label into characters for wave animation
  const labelChars = label.split('').map((char, i) => (
    <span
      key={i}
      className="label-char"
      style={{ '--index': i } as React.CSSProperties}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

  return (
    <div className="wave-group">
      <input
        ref={inputRef}
        className="input"
        value={value}
        placeholder={label}
        {...rest}
      />
      <label className="label">
        {labelChars}
      </label>
      <span className="bar" />
      {children}
    </div>
  );
}
