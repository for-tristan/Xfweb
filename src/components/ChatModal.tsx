'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@/lib/usePageFeatures';
import { WaveInput } from '@/components/WaveInput';


interface Friend {
  id: string;
  friendId: string;
  name: string;
  username: string;
  avatar: string | null;
  createdAt: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface ConversationPreview {
  friend: Friend;
  lastMessage?: Message;
  unreadCount: number;
}


interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  friends: Friend[];
  initialFriend?: Friend | null;
}

export function ChatModal({ open, onClose, user, friends, initialFriend }: ChatModalProps) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [mobileVH, setMobileVH] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialFriendAppliedRef = useRef(false);
  const lastVHRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileVH(0);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setMobileVH(vv.height);
      const prev = lastVHRef.current;
      if (prev > 0 && vv.height < prev - 100) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        });
      }
      lastVHRef.current = vv.height;
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [isMobile]);

  const loadConversations = useCallback(async () => {
    if (!user || !open) return;
    try {
      const res = await fetch('/api/chat/unread');
      if (res.ok) {
        const data = await res.json();
        setTotalUnread(data.totalUnread || 0);

        const convos: ConversationPreview[] = friends.map((f) => {
          const unread = data.conversations?.find((c: { userId: string }) => c.userId === f.friendId);
          return {
            friend: f,
            unreadCount: unread?.unreadCount || 0,
          };
        });

        setConversations(convos);
      }
    } catch {  }
  }, [user, friends, open]);

  const loadMessages = useCallback(async (friend: Friend) => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat?userId=${friend.friendId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {  }
    setLoadingMessages(false);
  }, [user]);

  useEffect(() => {
    if (!open || !selectedFriend || !user) return;
    const tick = () => {
      loadConversations();
      loadMessages(selectedFriend);
    };
    tick();
    pollIntervalRef.current = setInterval(tick, 10000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [open, selectedFriend, user, loadConversations, loadMessages]);

  useEffect(() => {
    if (open && initialFriend && !initialFriendAppliedRef.current) {
      initialFriendAppliedRef.current = true;
      const id = setTimeout(() => {
        setSelectedFriend(initialFriend);
        setMessages([]);
        loadMessages(initialFriend);
        if (isMobile) {
          setMobileView('chat');
        }
      }, 0);
      return () => clearTimeout(id);
    }
    if (!open) {
      initialFriendAppliedRef.current = false;
      setMobileView('list');
    }
    return undefined;
  }, [open, initialFriend, loadMessages, isMobile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedFriend && (!isMobile || mobileView === 'chat')) inputRef.current?.focus();
  }, [selectedFriend, isMobile, mobileView]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFriend || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedFriend.friendId,
          content: newMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewMessage('');
        loadMessages(selectedFriend);
        loadConversations();
      }
    } catch {  }
    setSending(false);
  };

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setMessages([]);
    loadMessages(friend);
    if (isMobile) {
      setMobileView('chat');
    }
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (!open || !user) return null;

  const modalContainerStyle: React.CSSProperties = isMobile
    ? {
        width: '100%',
        height: mobileVH > 0 ? mobileVH : '100dvh',
        ...((typeof window !== 'undefined' && !CSS.supports('height', '100dvh') && mobileVH === 0)
          ? { height: '100vh' }
          : {}),
        background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
        backdropFilter: 'blur(24px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        border: 'none',
        borderRadius: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
      }
    : {
        width: '100%',
        maxWidth: 800,
        height: '80vh',
        maxHeight: 600,
        background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
        backdropFilter: 'blur(24px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px color-mix(in srgb, var(--accent) 6%, transparent)',
      };

  const listTransform = isMobile
    ? (mobileView === 'list' ? 'translateX(0)' : 'translateX(-100%)')
    : 'none';
  const chatTransform = isMobile
    ? (mobileView === 'chat' ? 'translateX(0)' : 'translateX(100%)')
    : 'none';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Messages"
      data-lenis-prevent
      style={{
        position: 'fixed', inset: 0, zIndex: 10002,
        background: isMobile ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={modalContainerStyle}
      >
        <div style={{
          padding: isMobile ? '8px 12px' : '16px 20px',
          borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0, fontSize: isMobile ? 15 : 16, fontWeight: 800,
            fontFamily: 'var(--font-heading, Inter Tight)',
            color: 'var(--text-light, #fff)',
            display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10,
          }}>
            {isMobile && mobileView === 'chat' && selectedFriend ? (
              <>
                <button
                  onClick={handleBackToList}
                  aria-label="Back to friends"
                  style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--text-light, #fff)', cursor: 'pointer',
                    fontSize: 16,
                    minWidth: 44, minHeight: 44,
                    width: 44, height: 44,
                    padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: -4,
                    borderRadius: 8,
                  }}
                >
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)', fontSize: 11, fontWeight: 700,
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {selectedFriend.avatar
                    ? <img src={selectedFriend.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : selectedFriend.name.charAt(0).toUpperCase()
                  }
                </div>
                <span style={{ fontSize: 14 }}>{selectedFriend.name}</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-comment-dots" style={{ color: 'var(--accent)', fontSize: isMobile ? 14 : 16 }} />
                Messages
                {totalUnread > 0 && (
                  <span style={{
                    padding: '1px 8px', borderRadius: 10,
                    background: 'var(--accent)',
                    fontSize: 11, fontWeight: 700, color: 'var(--text-light)',
                  }}>
                    {totalUnread}
                  </span>
                )}
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close messages"
            style={{
              background: 'color-mix(in srgb, var(--text-light) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
              color: 'var(--text-dim, #666)', cursor: 'pointer', fontSize: 18,
              padding: 0,
              minWidth: isMobile ? 44 : 'auto',
              minHeight: isMobile ? 44 : 'auto',
              width: isMobile ? 44 : 'auto',
              height: isMobile ? 44 : 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
            }}
          >
            <i className="fa-solid fa-times" />
          </button>
        </div>

        <div style={{
          flex: 1, display: 'flex', overflow: 'hidden', position: 'relative',
          ...(isMobile ? { overflow: 'hidden' } : {}),
        }}>
          <div style={{
            width: isMobile ? '100%' : 260,
            flexShrink: 0,
            borderRight: isMobile ? 'none' : '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
            display: 'flex', flexDirection: 'column',
            background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
            position: isMobile ? 'absolute' : 'relative',
            inset: isMobile ? 0 : 'auto',
            zIndex: isMobile ? 1 : 'auto',
            ...(isMobile ? {
              transform: listTransform,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
            } : {}),
          }}>
            <div style={{ padding: isMobile ? '8px 12px' : '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-dim, #888)', textTransform: 'uppercase', letterSpacing: 1 }}>
              <i className="fa-solid fa-users" style={{ marginRight: 6 }} />
              Friends ({friends.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {friends.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim, #666)', fontSize: 13 }}>
                  <i className="fa-solid fa-user-friends" style={{ display: 'block', fontSize: 20, marginBottom: 8, opacity: 0.4 }} />
                  No friends yet
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.friend.friendId}
                    onClick={() => handleSelectFriend(convo.friend)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%',
                      padding: isMobile ? '10px 12px' : '10px 16px',
                      ...(isMobile ? { minHeight: 56 } : {}),
                      background: selectedFriend?.friendId === convo.friend.friendId
                        ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                      border: 'none', borderBottom: '1px solid color-mix(in srgb, var(--border-color) 20%, transparent)',
                      cursor: 'pointer', textAlign: 'left',
                      color: 'var(--text-light, #fff)',
                      transition: 'background 0.15s',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFriend?.friendId !== convo.friend.friendId) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFriend?.friendId !== convo.friend.friendId) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)', fontSize: 13, fontWeight: 700,
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {convo.friend.avatar
                        ? <img src={convo.friend.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : convo.friend.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light, #fff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {convo.friend.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim, #888)' }}>
                        @{convo.friend.username}
                      </div>
                    </div>
                    {convo.unreadCount > 0 && (
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--accent)',
                        fontSize: 10, fontWeight: 800, color: 'var(--text-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: isMobile ? 'absolute' : 'relative',
            inset: isMobile ? 0 : 'auto',
            zIndex: isMobile ? 2 : 'auto',
            background: 'color-mix(in srgb, var(--card-bg) 80%, transparent)',
            ...(isMobile ? {
              transform: chatTransform,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
            } : {}),
          }}>
            {selectedFriend ? (
              <>
                {!isMobile && (
                  <div style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)', fontSize: 12, fontWeight: 700,
                      overflow: 'hidden',
                    }}>
                      {selectedFriend.avatar
                        ? <img src={selectedFriend.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : selectedFriend.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light, #fff)' }}>
                        {selectedFriend.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim, #888)' }}>
                        @{selectedFriend.username}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
                  flex: 1, overflowY: 'auto', padding: isMobile ? 10 : 16,
                  display: 'flex', flexDirection: 'column', gap: 6,
                  boxShadow: isMobile ? 'inset 0 8px 12px -8px rgba(0,0,0,0.3)' : 'none',
                }}>
                  {loadingMessages ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim, #666)', fontSize: 13 }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-dim, #666)', fontSize: 13 }}>
                      <i className="fa-solid fa-paper-plane" style={{ fontSize: 24, opacity: 0.3 }} />
                      <span>No messages yet. Say hi!</span>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user.id;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div style={{
                            maxWidth: '75%',
                            padding: '10px 14px',
                            borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            background: isMine ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 6%, transparent)',
                            color: isMine ? '#fff' : 'var(--text-light, #fff)',
                            fontSize: 13, lineHeight: 1.5,
                            fontFamily: 'var(--font-body, Inter Tight)',
                          }}>
                            <div>{msg.content}</div>
                            <div style={{
                              fontSize: 10, marginTop: 4,
                              opacity: 0.6, textAlign: isMine ? 'right' : 'left',
                            }}>
                              {formatTime(msg.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: isMobile ? '8px 10px' : '12px 16px',
                    ...(isMobile ? { paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' } : {}),
                    borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
                    display: 'flex', gap: isMobile ? 8 : 10, alignItems: 'center',
                    flexShrink: 0,
                    background: 'color-mix(in srgb, var(--card-bg) 80%, transparent)',
                    zIndex: 10,
                  }}
                >
                  <WaveInput
                    label={`Message ${selectedFriend.name}...`}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    maxLength={2000}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    style={{
                      minWidth: isMobile ? 44 : 'auto',
                      minHeight: isMobile ? 44 : 'auto',
                      height: isMobile ? 44 : 'auto',
                      width: isMobile ? 44 : 'auto',
                      padding: isMobile ? 0 : '10px 16px',
                      borderRadius: 8, border: 'none',
                      background: newMessage.trim() ? 'var(--accent)' : 'color-mix(in srgb, var(--text-light) 6%, transparent)',
                      color: newMessage.trim() ? '#fff' : 'var(--text-dim, #666)',
                      fontSize: 13, fontWeight: 600, cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: "'Space Grotesk', sans-serif",
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxSizing: 'border-box',
                    }}
                  >
                    {sending ? (
                      <i className="fa-solid fa-spinner fa-spin" />
                    ) : (
                      <i className="fa-solid fa-paper-plane" />
                    )}
                    {!isMobile && <span>Send</span>}
                  </button>
                </form>
              </>
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12, color: 'var(--text-dim, #666)',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 10%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="fa-solid fa-comments" style={{ fontSize: 24, color: 'var(--accent)', opacity: 0.5 }} />
                </div>
                <span style={{ fontSize: 14, fontFamily: 'var(--font-body, Inter Tight)' }}>
                  Select a friend to start chatting
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
