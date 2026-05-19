'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@/lib/usePageFeatures';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════
// CHAT MODAL
// ═══════════════════════════════════════════════════

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialFriendAppliedRef = useRef(false);

  // Load conversation previews
  const loadConversations = useCallback(async () => {
    if (!user || !open) return;
    try {
      const res = await fetch('/api/chat/unread');
      if (res.ok) {
        const data = await res.json();
        setTotalUnread(data.totalUnread || 0);

        // Build conversation list from friends + unread data
        const convos: ConversationPreview[] = friends.map((f) => {
          const unread = data.conversations?.find((c: { userId: string }) => c.userId === f.friendId);
          return {
            friend: f,
            unreadCount: unread?.unreadCount || 0,
          };
        });

        setConversations(convos);
      }
    } catch { /* ignore */ }
  }, [user, friends, open]);

  // Load messages for selected friend
  const loadMessages = useCallback(async (friend: Friend) => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat?userId=${friend.friendId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* ignore */ }
    setLoadingMessages(false);
  }, [user]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!open || !selectedFriend || !user) return;
    const tick = () => {
      loadConversations();
      loadMessages(selectedFriend);
    };
    tick();
    pollIntervalRef.current = setInterval(tick, 3000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [open, selectedFriend, user, loadConversations, loadMessages]);

  // Auto-select initial friend when modal opens
  useEffect(() => {
    if (open && initialFriend && !initialFriendAppliedRef.current) {
      initialFriendAppliedRef.current = true;
      // Schedule to avoid cascading render warning
      const id = setTimeout(() => {
        setSelectedFriend(initialFriend);
        setMessages([]);
        loadMessages(initialFriend);
      }, 0);
      return () => clearTimeout(id);
    }
    if (!open) {
      initialFriendAppliedRef.current = false;
    }
    return undefined;
  }, [open, initialFriend, loadMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when friend selected
  useEffect(() => {
    if (selectedFriend) inputRef.current?.focus();
  }, [selectedFriend]);

  // Handle send message
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
    } catch { /* ignore */ }
    setSending(false);
  };

  // Select friend
  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setMessages([]);
    loadMessages(friend);
  };

  // Format time
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Messages"
      style={{
        position: 'fixed', inset: 0, zIndex: 10002,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 800, height: '80vh', maxHeight: 600,
          background: 'var(--dark-gray, #0f0f0f)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          borderRadius: 12, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{
            margin: 0, fontSize: 16, fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            color: 'var(--text-light, #fff)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <i className="fas fa-comment-dots" style={{ color: 'var(--primary-red, #dc143c)' }} />
            Messages
            {totalUnread > 0 && (
              <span style={{
                padding: '1px 8px', borderRadius: 10,
                background: 'var(--primary-red, #dc143c)',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                {totalUnread}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close messages"
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-dim, #666)', cursor: 'pointer', fontSize: 18, padding: 4,
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Sidebar: Friend List */}
          <div style={{
            width: 260, flexShrink: 0,
            borderRight: '1px solid var(--border-color, rgba(255,255,255,0.1))',
            display: 'flex', flexDirection: 'column',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-dim, #888)', textTransform: 'uppercase', letterSpacing: 1 }}>
              <i className="fas fa-users" style={{ marginRight: 6 }} />
              Friends ({friends.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {friends.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim, #666)', fontSize: 13 }}>
                  <i className="fas fa-user-friends" style={{ display: 'block', fontSize: 20, marginBottom: 8, opacity: 0.4 }} />
                  No friends yet
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.friend.friendId}
                    onClick={() => handleSelectFriend(convo.friend)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 16px',
                      background: selectedFriend?.friendId === convo.friend.friendId
                        ? 'rgba(220,20,60,0.1)' : 'transparent',
                      border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer', textAlign: 'left',
                      color: 'var(--text-light, #fff)',
                      transition: 'background 0.15s',
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
                      background: 'rgba(220,20,60,0.1)',
                      border: '1px solid rgba(220,20,60,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--primary-red, #dc143c)', fontSize: 13, fontWeight: 700,
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
                        background: 'var(--primary-red, #dc143c)',
                        fontSize: 10, fontWeight: 800, color: '#fff',
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

          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(220,20,60,0.1)',
                    border: '1px solid rgba(220,20,60,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary-red, #dc143c)', fontSize: 12, fontWeight: 700,
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

                {/* Messages */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: 16,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {loadingMessages ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim, #666)', fontSize: 13 }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-dim, #666)', fontSize: 13 }}>
                      <i className="fas fa-paper-plane" style={{ fontSize: 24, opacity: 0.3 }} />
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
                            maxWidth: '70%',
                            padding: '10px 14px',
                            borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            background: isMine ? 'var(--primary-red, #dc143c)' : 'rgba(255,255,255,0.06)',
                            color: isMine ? '#fff' : 'var(--text-light, #fff)',
                            fontSize: 13, lineHeight: 1.5,
                            fontFamily: "'Space Grotesk', sans-serif",
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

                {/* Message Input */}
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                    display: 'flex', gap: 10, alignItems: 'center',
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedFriend.name}...`}
                    maxLength={2000}
                    style={{
                      flex: 1, padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-light, #fff)',
                      fontSize: 13,
                      fontFamily: "'Space Grotesk', sans-serif",
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    style={{
                      padding: '10px 16px', borderRadius: 8, border: 'none',
                      background: newMessage.trim() ? 'var(--primary-red, #dc143c)' : 'rgba(255,255,255,0.06)',
                      color: newMessage.trim() ? '#fff' : 'var(--text-dim, #666)',
                      fontSize: 13, fontWeight: 600, cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: "'Space Grotesk', sans-serif",
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {sending ? (
                      <i className="fas fa-spinner fa-spin" />
                    ) : (
                      <i className="fas fa-paper-plane" />
                    )}
                    <span className="hidden sm:inline">Send</span>
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
                  background: 'rgba(220,20,60,0.05)',
                  border: '1px solid rgba(220,20,60,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="fas fa-comments" style={{ fontSize: 24, color: 'var(--primary-red, #dc143c)', opacity: 0.5 }} />
                </div>
                <span style={{ fontSize: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
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
