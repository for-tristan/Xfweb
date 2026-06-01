'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomCursor } from '@/hooks/useCustomCursor';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { AuthGate, HeroEffects } from '@/lib/PageModals';
import { Navbar } from '@/components/Navbar';
import { Logo } from '@/components/Logo';


interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="xf-loader"><span /><span /><span /></div></div>}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const router = useRouter();
  const dotRef = useRef<HTMLDivElement>(null);
  useCustomCursor(dotRef);

  const {
    user, loading, minLoading, theme, toggleTheme, changeTheme, scrolled, mobileMenuOpen, setMobileMenuOpen,
    searchOpen, setSearchOpen, searchQuery, setSearchQuery, filteredSearch,
    authModalOpen, setAuthModalOpen, authTab, setAuthTab, authMessage, openAuthModal,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginLoading, handleLogin,
    signupName, setSignupName, signupEmail, setSignupEmail, signupPassword, setSignupPassword, signupConfirmPassword, setSignupConfirmPassword,
    signupPhone, setSignupPhone, signupCompany, setSignupCompany, signupLoading, handleSignup,
    handleLogout, getPasswordStrength,
    dashboardOpen, setDashboardOpen,
    forgotStep, setForgotStep, forgotEmail, setForgotEmail, forgotLoading, handleForgotSubmit,
    resetCode, setResetCode, newPassword, setNewPassword, resetLoading, handleResetSubmit,
    verificationStep, setVerificationStep, verificationEmail, verificationCode, setVerificationCode,
    verificationLoading, handleVerifyEmail, handleResendVerification, resendLoading,
    notifOpen, setNotifOpen, notifications, unreadCount, loadNotifications, setNotifications, setUnreadCount,
    profileName, setProfileName, profileUsername, setProfileUsername, profilePhone, setProfilePhone, profileCompany, setProfileCompany,
    profileSaving, avatarUploading, handleAvatarUpload, handleAvatarUploaded, handleProfileSave,
    scrollToSection,
  } = usePageFeatures();

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // File upload state
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch { /* ignore */ }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch('/api/ai/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setActiveConvId(convId);
      }
    } catch { /* ignore */ }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations?id=${convId}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeConvId === convId) {
          setActiveConvId(null);
          setMessages([]);
        }
        loadConversations();
      }
    } catch { /* ignore */ }
  }, [activeConvId, loadConversations]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/ai/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachedFile({ name: data.fileName, content: data.content, size: data.fileSize });
        inputRef.current?.focus();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process file');
      }
    } catch {
      alert('Failed to upload file');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove attached file
  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  // Typing animation — reveals text progressively, word by word
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback((msgId: string, fullText: string) => {
    // Clear any previous typing animation
    if (typingRef.current) clearInterval(typingRef.current);

    let pos = 0;
    const words = fullText.split(/(\s+)/); // Split keeping whitespace
    let accumulated = '';

    // Show the first chunk immediately for responsiveness
    const firstChunk = words.slice(0, 3).join('');
    accumulated = firstChunk;
    pos = 3;

    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, content: accumulated, isStreaming: true } : m
    ));

    typingRef.current = setInterval(() => {
      if (pos >= words.length) {
        // Done — show full text and stop
        clearInterval(typingRef.current!);
        typingRef.current = null;
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, content: fullText, isStreaming: false } : m
        ));
        return;
      }

      // Reveal a few words per tick
      const chunk = words.slice(pos, pos + 2).join('');
      pos += 2;
      accumulated += chunk;

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: accumulated } : m
      ));

      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 25); // 25ms per tick — fast but visible typing effect
  }, []);

  // Cleanup typing animation on unmount
  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !attachedFile) || sending) return;
    const userMsg = input.trim() || (attachedFile ? 'Explain this file to me' : '');
    const fileData = attachedFile;
    setInput('');
    setAttachedFile(null);
    setSending(true);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Display message (with file indicator)
    const displayMsg = fileData ? `📄 ${fileData.name}\n${userMsg}` : userMsg;

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: displayMsg,
      createdAt: new Date().toISOString(),
    };

    // Add placeholder assistant message for typing animation
    const streamMsgId = `stream-${Date.now()}`;
    const streamMsg: ChatMessage = {
      id: streamMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, tempUserMsg, streamMsg]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: userMsg,
          fileContent: fileData?.content,
          fileName: fileData?.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Start typing animation with the full reply
        startTyping(streamMsgId, data.reply);

        if (!activeConvId) {
          setActiveConvId(data.conversationId);
          loadConversations();
        }
      } else {
        let errorMsg = 'Failed to get response';
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch { /* ignore */ }
        setMessages(prev => prev.map(m =>
          m.id === streamMsgId ? { ...m, content: `⚠️ Error: ${errorMsg}`, isStreaming: false } : m
        ));
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === streamMsgId ? { ...m, content: '⚠️ Network error. Please try again.', isStreaming: false } : m
      ));
    }
    setSending(false);
  }, [input, sending, activeConvId, loadConversations, attachedFile, startTyping]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const lang = lines[0]?.trim() || '';
        const code = lang ? lines.slice(1).join('\n') : lines.join('\n');
        return (
          <pre key={i} className="ai-code-block">
            {lang && <div className="ai-code-lang">{lang}</div>}
            <code>{code}</code>
          </pre>
        );
      }
      // Inline code
      const inlineParts = part.split(/(`[^`]+`)/g);
      return (
        <span key={i}>
          {inlineParts.map((p, j) =>
            p.startsWith('`') && p.endsWith('`') ? (
              <code key={j} className="ai-inline-code">{p.slice(1, -1)}</code>
            ) : (
              <span key={j} style={{ whiteSpace: 'pre-wrap' }}>{p}</span>
            )
          )}
        </span>
      );
    });
  };

  return (
    <>
      <title>XF AI | Chat</title>
      <meta name="description" content="Chat with XF AI — your intelligent assistant for coding, learning, and tech career advice." />

      <div className="global-particles" id="globalParticles" />
      <div className="cursor-dot" ref={dotRef} id="cursorDot" />

      <AuthGate loading={loading} minLoading={minLoading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to chat with XF AI')} onSignUp={() => openAuthModal('signup')} />

      {!(loading || minLoading) && (
        <>
          <Navbar
            activePage="chat" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
            user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme}
            onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout}
            notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount}
            loadNotifications={loadNotifications} setNotifications={setNotifications as any} setUnreadCount={setUnreadCount as any}
            dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen}
          />

          <div className="zai-chat-page">
            {/* Sidebar */}
            <div className={`zai-chat-sidebar${sidebarOpen ? ' open' : ''}`}>
              <div className="zai-sidebar-header">
                <button className="zai-new-chat-btn" onClick={() => { setActiveConvId(null); setMessages([]); }}>
                  <i className="fa-solid fa-plus" />
                  <span>New Chat</span>
                </button>
                <button className="zai-sidebar-collapse" onClick={() => setSidebarOpen(false)}>
                  <i className="fa-solid fa-chevron-left" />
                </button>
              </div>
              <div className="zai-sidebar-conversations">
                {conversations.length === 0 && (
                  <div className="zai-sidebar-empty">No conversations yet</div>
                )}
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`zai-conv-item${activeConvId === conv.id ? ' active' : ''}`}
                    onClick={() => loadMessages(conv.id)}
                  >
                    <i className="fa-regular fa-message" />
                    <span className="zai-conv-title">{conv.title}</span>
                    <button
                      className="zai-conv-delete"
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Main area */}
            <div className="zai-chat-main">
              {/* Header */}
              <div className="zai-chat-header">
                {!sidebarOpen && (
                  <button className="zai-sidebar-open-btn" onClick={() => setSidebarOpen(true)}>
                    <i className="fa-solid fa-bars" />
                  </button>
                )}
                <div className="zai-header-center">
                  <Logo style={{ height: 22, width: 22 }} />
                  <span className="zai-header-title">XF AI</span>
                </div>
                <div className="zai-model-pill">Llama 3.3 70B</div>
              </div>

              {/* Messages area */}
              <div className="zai-messages-area">
                {messages.length === 0 ? (
                  <div className="zai-empty-state">
                    <div className="zai-empty-icon">
                      <Logo style={{ height: 48, width: 48, opacity: 0.4 }} />
                    </div>
                    <h2 className="zai-empty-title">How can I help you today?</h2>
                    <p className="zai-empty-sub">Ask me about coding, debugging, learning paths, or tech careers.</p>
                  </div>
                ) : (
                  <div className="zai-messages-list">
                    {messages.map(msg => (
                      <div key={msg.id} className={`zai-msg ${msg.role}`}>
                        {msg.role === 'assistant' && (
                          <div className="zai-msg-avatar">
                            <Logo style={{ height: 18, width: 18 }} />
                          </div>
                        )}
                        <div className={`zai-msg-content${msg.isStreaming ? ' streaming' : ''}`}>
                          {msg.role === 'assistant' ? (
                            msg.content ? renderContent(msg.content) : (
                              <span className="zai-cursor-blink">▍</span>
                            )
                          ) : msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="zai-input-wrapper">
                <div className="zai-input-container">
                  {/* File preview chip */}
                  {attachedFile && (
                    <div className="zai-file-chip">
                      <i className="fa-solid fa-file-lines" />
                      <span className="zai-file-chip-name">{attachedFile.name}</span>
                      <span className="zai-file-chip-size">{(attachedFile.size / 1024).toFixed(0)}KB</span>
                      <button className="zai-file-chip-x" onClick={removeAttachedFile}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  )}
                  <div className="zai-input-bar">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.csv,.md"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    <button
                      className="zai-attach-btn"
                      aria-label="Attach file"
                      title="Attach PDF, TXT, CSV, or MD"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <i className="fa-solid fa-spinner fa-spin" />
                      ) : (
                        <i className="fa-solid fa-plus" />
                      )}
                    </button>
                    <textarea
                      ref={inputRef}
                      className="zai-textarea"
                      placeholder={attachedFile ? `Ask about ${attachedFile.name}...` : 'Message XF AI'}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      disabled={sending}
                    />
                    <button
                      className="zai-send-btn"
                      onClick={sendMessage}
                      disabled={(!input.trim() && !attachedFile) || sending}
                      aria-label="Send message"
                    >
                      <i className="fa-solid fa-arrow-up" />
                    </button>
                  </div>
                </div>
                <p className="zai-input-disclaimer">XF AI can make mistakes. Consider checking important info.</p>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        /* ═══════════════════════════════════════════
           Z.AI-INSPIRED CHAT LAYOUT
           ═══════════════════════════════════════════ */

        .zai-chat-page {
          display: flex;
          height: 100vh;
          padding-top: 80px;
          background: var(--bg);
          color: var(--text-light);
          position: relative;
          overflow: hidden;
        }

        /* ═══ Sidebar ═══ */
        .zai-chat-sidebar {
          width: 260px;
          min-width: 260px;
          background: color-mix(in srgb, var(--card-bg) 50%, transparent);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border-right: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
          z-index: 10;
        }
        .zai-chat-sidebar:not(.open) {
          margin-left: -260px;
          opacity: 0;
          pointer-events: none;
        }
        .zai-sidebar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 14px;
          border-bottom: 1px solid color-mix(in srgb, var(--border-color) 40%, transparent);
        }
        .zai-new-chat-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          color: var(--accent);
          border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
          cursor: pointer;
          font-size: 0.84rem;
          font-weight: 600;
          font-family: 'Space Grotesk', sans-serif;
          transition: all 0.2s;
        }
        .zai-new-chat-btn:hover {
          background: color-mix(in srgb, var(--accent) 18%, transparent);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
        }
        .zai-sidebar-collapse {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--text-light) 6%, transparent);
          border: 1px solid color-mix(in srgb, var(--border-color) 80%, transparent);
          color: var(--text-light);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
        }
        .zai-sidebar-collapse:hover {
          color: var(--accent);
          border-color: color-mix(in srgb, var(--accent) 40%, transparent);
          background: color-mix(in srgb, var(--accent) 8%, transparent);
        }
        .zai-sidebar-conversations {
          flex: 1;
          overflow-y: auto;
          padding: 8px 8px;
        }
        .zai-sidebar-conversations::-webkit-scrollbar {
          width: 4px;
        }
        .zai-sidebar-conversations::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--text-dim) 30%, transparent);
          border-radius: 4px;
        }
        .zai-sidebar-empty {
          color: var(--text-dim);
          font-size: 0.8rem;
          text-align: center;
          padding: 32px 12px;
          font-family: 'Space Grotesk', sans-serif;
          opacity: 0.7;
        }
        .zai-conv-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
          margin-bottom: 2px;
          position: relative;
        }
        .zai-conv-item:hover {
          background: color-mix(in srgb, var(--text-light) 5%, transparent);
        }
        .zai-conv-item.active {
          background: color-mix(in srgb, var(--accent) 8%, transparent);
        }
        .zai-conv-item > i {
          font-size: 12px;
          color: var(--text-dim);
          flex-shrink: 0;
        }
        .zai-conv-title {
          flex: 1;
          font-size: 0.82rem;
          font-family: 'Space Grotesk', sans-serif;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--text-light);
        }
        .zai-conv-delete {
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 10px;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .zai-conv-item:hover .zai-conv-delete {
          opacity: 1;
        }
        .zai-conv-delete:hover {
          color: #ef4444;
          background: color-mix(in srgb, #ef4444 10%, transparent);
        }

        /* ═══ Main Area ═══ */
        .zai-chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
        }

        /* Header */
        .zai-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 20px;
          border-bottom: 1px solid color-mix(in srgb, var(--border-color) 40%, transparent);
          background: color-mix(in srgb, var(--card-bg) 30%, transparent);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          min-height: 52px;
        }
        .zai-sidebar-open-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--text-light) 6%, transparent);
          border: 1px solid color-mix(in srgb, var(--border-color) 80%, transparent);
          color: var(--text-light);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }
        .zai-sidebar-open-btn:hover {
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border-color: color-mix(in srgb, var(--accent) 40%, transparent);
          color: var(--accent);
        }
        .zai-header-center {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .zai-header-title {
          font-family: 'Inter Tight', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-light);
        }
        .zai-model-pill {
          font-size: 0.65rem;
          font-weight: 600;
          font-family: 'Space Grotesk', sans-serif;
          padding: 4px 10px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--accent) 8%, transparent);
          color: var(--accent);
          letter-spacing: 0.3px;
          border: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
        }

        /* Messages area */
        .zai-messages-area {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .zai-messages-area::-webkit-scrollbar {
          width: 6px;
        }
        .zai-messages-area::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--text-dim) 20%, transparent);
          border-radius: 6px;
        }

        /* Empty state */
        .zai-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          text-align: center;
          padding: 40px 20px;
          gap: 8px;
        }
        .zai-empty-icon {
          margin-bottom: 8px;
        }
        .zai-empty-title {
          font-family: 'Inter Tight', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-light);
          margin: 0;
        }
        .zai-empty-sub {
          color: var(--text-dim);
          font-size: 0.88rem;
          font-family: 'Space Grotesk', sans-serif;
          margin: 0 0 20px 0;
        }
        .zai-suggestions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          max-width: 540px;
          width: 100%;
        }
        .zai-suggest-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 14px;
          background: color-mix(in srgb, var(--card-bg) 50%, transparent);
          border: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);
          color: var(--text-dim);
          cursor: pointer;
          font-size: 0.82rem;
          font-family: 'Space Grotesk', sans-serif;
          transition: all 0.2s;
          text-align: left;
          line-height: 1.4;
        }
        .zai-suggest-card i {
          font-size: 0.9rem;
          margin-top: 2px;
          flex-shrink: 0;
          color: var(--accent);
          opacity: 0.7;
        }
        .zai-suggest-card:hover {
          color: var(--text-light);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
          background: color-mix(in srgb, var(--accent) 5%, transparent);
        }
        .zai-suggest-card:hover i {
          opacity: 1;
        }

        /* Messages list */
        .zai-messages-list {
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 780px;
          width: 100%;
          margin: 0 auto;
        }

        /* Message */
        .zai-msg {
          display: flex;
          gap: 12px;
          max-width: 100%;
        }
        .zai-msg.user {
          justify-content: flex-end;
          padding-right: 4px;
        }
        .zai-msg-avatar {
          width: 30px;
          height: 30px;
          min-width: 30px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .zai-msg-content {
          padding: 12px 18px;
          border-radius: 18px;
          font-size: 0.9rem;
          line-height: 1.65;
          font-family: 'Space Grotesk', sans-serif;
          max-width: 85%;
          word-break: break-word;
        }
        .zai-msg.user .zai-msg-content {
          background: color-mix(in srgb, var(--accent) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
          color: var(--text-light);
          border-bottom-right-radius: 6px;
        }
        .zai-msg.assistant .zai-msg-content {
          background: transparent;
          color: var(--text-light);
          border-bottom-left-radius: 6px;
        }

        /* Streaming cursor */
        .zai-msg-content.streaming {
          min-height: 24px;
        }
        .zai-cursor-blink {
          color: var(--accent);
          animation: cursor-pulse 0.8s ease-in-out infinite;
          font-size: 0.95rem;
        }
        @keyframes cursor-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Code blocks */
        .ai-code-block {
          background: color-mix(in srgb, var(--black, #000) 60%, transparent);
          border: 1px solid color-mix(in srgb, var(--border-color) 60%, transparent);
          border-radius: 10px;
          padding: 14px 18px;
          margin: 10px 0;
          overflow-x: auto;
          font-size: 0.82rem;
          font-family: 'Sarasa Mono SC', 'Fira Code', monospace;
        }
        .ai-code-lang {
          font-size: 0.7rem;
          color: var(--accent);
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ai-inline-code {
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          padding: 2px 7px;
          border-radius: 5px;
          font-family: 'Sarasa Mono SC', 'Fira Code', monospace;
          font-size: 0.84rem;
        }

        /* ═══ Input area ═══ */
        .zai-input-wrapper {
          padding: 8px 16px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .zai-input-container {
          width: 100%;
          max-width: 780px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* File chip */
        .zai-file-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px 6px 12px;
          margin: 0 0 0 16px;
          border-radius: 10px 10px 0 0;
          background: color-mix(in srgb, var(--accent) 10%, var(--card-bg));
          border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
          border-bottom: none;
          font-size: 0.78rem;
          font-family: 'Space Grotesk', sans-serif;
        }
        .zai-file-chip > i {
          color: var(--accent);
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .zai-file-chip-name {
          color: var(--text-light);
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 180px;
        }
        .zai-file-chip-size {
          color: var(--text-dim);
          font-size: 0.7rem;
        }
        .zai-file-chip-x {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 0.65rem;
          transition: all 0.15s;
          flex-shrink: 0;
          margin-left: 2px;
        }
        .zai-file-chip-x:hover {
          color: #ef4444;
          background: color-mix(in srgb, #ef4444 12%, transparent);
        }

        /* The main input bar — single rounded container */
        .zai-input-bar {
          display: flex;
          align-items: flex-end;
          gap: 0;
          padding: 10px 12px 10px 6px;
          border-radius: 16px;
          border: 1.5px solid color-mix(in srgb, var(--border-color) 60%, transparent);
          background: color-mix(in srgb, var(--card-bg) 60%, transparent);
          backdrop-filter: blur(20px) saturate(1.3);
          -webkit-backdrop-filter: blur(20px) saturate(1.3);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .zai-input-bar:focus-within {
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 8%, transparent);
        }

        /* Plus button — left side */
        .zai-attach-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .zai-attach-btn:hover {
          color: var(--text-light);
          background: color-mix(in srgb, var(--text-light) 8%, transparent);
        }

        /* Textarea — fills remaining space */
        .zai-textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.92rem;
          font-family: 'Space Grotesk', sans-serif;
          resize: none;
          outline: none;
          min-height: 24px;
          max-height: 160px;
          line-height: 1.5;
          padding: 6px 8px;
        }
        .zai-textarea::placeholder {
          color: var(--text-dim);
          opacity: 0.5;
        }

        /* Send button — right side, round */
        .zai-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 50%;
          background: var(--accent);
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .zai-send-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: scale(1.05);
        }
        .zai-send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
        .zai-send-btn:disabled {
          opacity: 0.2;
          cursor: not-allowed;
          background: var(--text-dim);
        }

        .zai-input-disclaimer {
          font-size: 0.68rem;
          color: var(--text-dim);
          opacity: 0.45;
          font-family: 'Space Grotesk', sans-serif;
          text-align: center;
          margin: 0;
          padding-top: 2px;
        }

        /* ═══ Responsive ═══ */
        @media (max-width: 768px) {
          .zai-chat-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 100;
            padding-top: 80px;
          }
          .zai-chat-sidebar:not(.open) {
            margin-left: -260px;
          }
          .zai-suggestions-grid {
            grid-template-columns: 1fr;
          }
          .zai-messages-list {
            padding: 16px 12px;
          }
          .zai-input-wrapper {
            padding: 6px 8px 8px;
          }
          .zai-input-container {
            max-width: 100%;
          }
          .zai-msg-content {
            max-width: 92%;
          }
        }
      `}</style>
    </>
  );
}
