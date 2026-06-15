'use client';

import React, { HTMLAttributes } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function getYouTubeEmbedUrl(url: string): string | null {
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;

  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;

  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;
  return null;
}

function isVideoUrl(line: string): boolean {
  return /https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/\S+/.test(line.trim());
}

function getEmbedUrl(url: string): string | null {
  const yt = getYouTubeEmbedUrl(url);
  if (yt) return yt;
  return getVimeoEmbedUrl(url);
}

const mdStyles: Record<string, React.CSSProperties> = {
  h1: { fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: 'var(--text-light)', margin: '24px 0 12px', lineHeight: 1.3 },
  h2: { fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, color: 'var(--text-light)', margin: '20px 0 10px', lineHeight: 1.3 },
  h3: { fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: 'var(--text-light)', margin: '16px 0 8px', lineHeight: 1.4 },
  h4: { fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: 'var(--text-light)', margin: '14px 0 6px', lineHeight: 1.4 },
  p: { fontFamily: "var(--font-body)", fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.8, margin: '8px 0' },
  ul: { fontFamily: "var(--font-body)", fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.8, margin: '8px 0', paddingLeft: 24 },
  ol: { fontFamily: "var(--font-body)", fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.8, margin: '8px 0', paddingLeft: 24 },
  li: { margin: '4px 0' },
  a: { color: 'var(--primary-red)', textDecoration: 'underline', fontWeight: 600 },
  blockquote: { borderLeft: '3px solid var(--primary-red)', paddingLeft: 16, margin: '16px 0', fontStyle: 'italic', color: 'var(--text-dim)' },
  code: { background: 'var(--input-bg)', padding: '2px 6px', borderRadius: 3, fontSize: 13, color: 'var(--primary-red)', fontFamily: "'Space Grotesk', monospace" },
  hr: { border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' },
  table: { width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: 15 },
  th: { background: 'var(--input-bg)', padding: '10px 14px', border: '1px solid var(--border-color)', color: 'var(--text-light)', fontWeight: 700, textAlign: 'left' },
  td: { padding: '10px 14px', border: '1px solid var(--border-color)', color: 'var(--text-dim)' },
  strong: { color: 'var(--text-light)', fontWeight: 700 },
  em: { fontStyle: 'italic' },
  del: { textDecoration: 'line-through', color: 'var(--text-dim)' },
  img: { maxWidth: '100%', borderRadius: 4, margin: '12px 0' },
  tr: { borderBottom: '1px solid var(--border-color)' },
  thead: { background: 'var(--input-bg)' },
  input: { marginRight: 8, accentColor: 'var(--accent)' },
};

export default function ModuleContent({ content }: { content: string }) {
  if (!content || !content.trim()) return null;

  const lines = content.split('\n');
  const parts: { type: 'video' | 'markdown'; content: string }[] = [];
  let currentMarkdown: string[] = [];

  for (const line of lines) {
    if (isVideoUrl(line)) {
      if (currentMarkdown.length > 0) {
        parts.push({ type: 'markdown', content: currentMarkdown.join('\n') });
        currentMarkdown = [];
      }
      parts.push({ type: 'video', content: line.trim() });
    } else {
      currentMarkdown.push(line);
    }
  }
  if (currentMarkdown.length > 0) {
    parts.push({ type: 'markdown', content: currentMarkdown.join('\n') });
  }

  return (
    <div className="module-content-rendered">
      {parts.map((part, idx) => {
        if (part.type === 'video') {
          const embedUrl = getEmbedUrl(part.content);
          if (!embedUrl) return null;
          return (
            <div key={idx} style={{ margin: '20px 0', position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 4, border: '1px solid var(--border-color)' }}>
              <iframe
                src={embedUrl}
                title="Video"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        return (
          <div key={idx}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 style={mdStyles.h1}>{children}</h1>,
                h2: ({ children }) => <h2 style={mdStyles.h2}>{children}</h2>,
                h3: ({ children }) => <h3 style={mdStyles.h3}>{children}</h3>,
                h4: ({ children }) => <h4 style={mdStyles.h4}>{children}</h4>,
                p: ({ children }) => <p style={mdStyles.p}>{children}</p>,
                ul: ({ children }) => <ul style={mdStyles.ul}>{children}</ul>,
                ol: ({ children }) => <ol style={mdStyles.ol}>{children}</ol>,
                li: ({ children }) => <li style={mdStyles.li}>{children}</li>,
                a: ({ children, href }) => <a href={href} style={mdStyles.a} target="_blank" rel="noopener noreferrer">{children}</a>,
                blockquote: ({ children }) => <blockquote style={mdStyles.blockquote}>{children}</blockquote>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-');
                  if (isBlock) {
                    return <code className={className}>{children}</code>;
                  }
                  return <code style={mdStyles.code}>{children}</code>;
                },
                pre: ({ children }) => {
                  const codeElement = React.Children.toArray(children).find(
                    (child) => React.isValidElement(child) && child.type === 'code'
                  ) as React.ReactElement<HTMLAttributes<HTMLElement>> | undefined;
                  const className = codeElement?.props?.className || '';
                  const language = className.replace('language-', '') || 'text';
                  const codeText = codeElement?.props?.children || '';
                  const codeString = typeof codeText === 'string' ? codeText : String(codeText);

                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={language}
                      customStyle={{
                        margin: '16px 0',
                        borderRadius: 4,
                        fontSize: 13,
                        background: 'var(--dark-gray)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  );
                },
                hr: () => <hr style={mdStyles.hr} />,
                table: ({ children }) => <table style={mdStyles.table}>{children}</table>,
                th: ({ children }) => <th style={mdStyles.th}>{children}</th>,
                td: ({ children }) => <td style={mdStyles.td}>{children}</td>,
                strong: ({ children }) => <strong style={mdStyles.strong}>{children}</strong>,
                em: ({ children }) => <em style={mdStyles.em}>{children}</em>,
                del: ({ children }) => <del style={mdStyles.del}>{children}</del>,
                img: ({ src, alt }) => <img src={src} alt={alt || ''} style={mdStyles.img} />,
                tr: ({ children }) => <tr style={mdStyles.tr}>{children}</tr>,
                thead: ({ children }) => <thead style={mdStyles.thead}>{children}</thead>,
                input: ({ checked, ...props }) => <input type="checkbox" defaultChecked={checked ?? false} style={mdStyles.input} disabled {...props} />,
              }}
            >
              {part.content}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}
