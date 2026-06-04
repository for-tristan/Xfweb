'use client';

import React, { useRef, useEffect } from 'react';

interface WaveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  children?: React.ReactNode;
}

export function WaveTextarea({ label, children, value, ...rest }: WaveTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add/remove .has-value class based on whether textarea has content
  useEffect(() => {
    const el = textareaRef.current;
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
    <div className="wave-group wave-group-textarea">
      <textarea
        ref={textareaRef}
        className="textarea"
        value={value}
        placeholder={label}
        rows={3}
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
