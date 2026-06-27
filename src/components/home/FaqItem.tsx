'use client';

/**
 * FaqItem — collapsible FAQ entry with animated expand/collapse.
 */

import { useState } from 'react';

interface FaqItemProps {
  question: string;
  answer: string;
  index: number;
}

export function FaqItem({ question, answer, index }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`v-faq-item${open ? ' v-faq-active' : ''}`}>
      <button onClick={() => setOpen(!open)}>
        <span className="v-faq-question">{question}</span>
        <span className="v-faq-icon-wrap">
          <i className={`fa-solid ${open ? 'fa-minus' : 'fa-plus'}`} style={{ fontSize: 12 }} />
        </span>
      </button>
      <div
        className="v-faq-answer"
        style={{
          maxHeight: open ? 500 : 0,
          opacity: open ? 1 : 0,
          padding: open ? undefined : '0 24px 0',
          overflow: 'hidden',
        }}
      >
        {answer}
      </div>
    </div>
  );
}

export default FaqItem;
