'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function XAIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey! I'm XAI, your X-Foundry assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/xai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "I'm having connectivity issues. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* Floating Button */}
     

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 10000,
          width: 370, height: 480, borderRadius: 4,
          background: 'var(--dark-gray)', border: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.3s ease',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(220,20,60,0.05)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary-red)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#fff', fontWeight: 900,
            }}>X</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-light)', letterSpacing: 1 }}>XAI</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>X-Foundry Assistant</div>
            </div>
            <div style={{
              marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)',
            }} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                maxWidth: '85%', padding: '10px 14px', borderRadius: 4,
                fontSize: 13, lineHeight: 1.6,
                background: m.role === 'user' ? 'rgba(220,20,60,0.15)' : 'rgba(255,255,255,0.04)',
                border: m.role === 'user' ? '1px solid rgba(220,20,60,0.2)' : '1px solid var(--border-color)',
                color: 'var(--text-light)', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                fontWeight: 500,
              }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{
                padding: '10px 14px', borderRadius: 4, fontSize: 13,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                color: 'var(--text-dim)', alignSelf: 'flex-start', fontWeight: 500,
              }}>
                <i className="fas fa-ellipsis fa-beat-fade" style={{ marginRight: 6 }} />Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid var(--border-color)',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask XAI anything..."
              style={{
                flex: 1, padding: '10px 14px', fontSize: 13, fontWeight: 500,
                background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                color: 'var(--text-light)', outline: 'none', borderRadius: 2,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 2,
                background: input.trim() && !loading ? 'var(--primary-red)' : 'rgba(255,255,255,0.05)',
                border: 'none', color: input.trim() && !loading ? '#fff' : 'var(--text-dim)',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, transition: 'all 0.2s ease',
              }}
            >
              <i className={`fas fa-${loading ? 'spinner fa-spin' : 'paper-plane'}`} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
