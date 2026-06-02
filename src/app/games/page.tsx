'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomCursor } from '@/hooks/useCustomCursor';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Navbar';
import { Logo } from '@/components/Logo';
import {
  GameQuestion,
  GAMES,
  LANGUAGES,
  DIFFICULTIES,
  getShuffledQuestions,
} from '@/lib/gameQuestions';

import { SearchModal, AuthModal, AuthGate, ProfileModal, HeroEffects } from '@/lib/PageModals';
import GradualBlur from '@/components/GradualBlur';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return mobile;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════

export default function GamesPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toast } = useToast();
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

  const dotRef = useRef<HTMLDivElement>(null);
  useCustomCursor(dotRef);

  // ── Game State ──
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState('python');
  const [selectedDiff, setSelectedDiff] = useState('easy');
  const [phase, setPhase] = useState<'select' | 'loading' | 'playing' | 'results' | 'leaderboard'>('select');
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [phaseKey, setPhaseKey] = useState(0); // for re-triggering animations
  const [scoreAnimated, setScoreAnimated] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  // ── Leaderboard State ──
  const [lbData, setLbData] = useState<any[]>([]);
  const [lbGame, setLbGame] = useState('all');
  const [lbLang, setLbLang] = useState('all');
  const [lbDiff, setLbDiff] = useState('all');
  const [lbLoading, setLbLoading] = useState(false);

  // ── Timer ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, startTime]);

  // ── Effects ──
  useEffect(() => {
    window.scrollTo(0, 0);
    const c = document.getElementById('globalParticles');
    if (c) {
      for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.setAttribute('data-particle', 'true');
        p.style.left = Math.random() * 100 + '%';
        p.style.width = p.style.height = Math.random() * 2 + 1 + 'px';
        p.style.animationDuration = (Math.random() * 20 + 15) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';
        c.appendChild(p);
      }
    }
    const onScroll = () => {
      document.querySelectorAll('.reveal').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 100) el.classList.add('visible');
      });
    };
    const checkBottom = () => setAtBottom(window.innerHeight + window.scrollY >= document.body.scrollHeight - 80);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('scroll', checkBottom);
    onScroll();
    checkBottom();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', checkBottom);
      const container = document.getElementById('globalParticles');
      if (container) container.querySelectorAll('[data-particle]').forEach(p => p.remove());
    };
  }, []);

  // ── Game Logic ──

  const startGame = useCallback(async () => {
    if (!selectedGame) return;
    setPhase('loading');
    setPhaseKey(k => k + 1);

    await new Promise(r => setTimeout(r, 800));

    const qs = getShuffledQuestions(selectedGame, selectedLang, selectedDiff, 5);
    if (qs.length === 0) {
      toast({ title: 'No Questions', description: 'No questions available for this combination yet.', variant: 'destructive' });
      setPhase('select');
      return;
    }
    setQuestions(qs);
    setCurrentQ(0);
    setAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setTotalScore(0);
    setStartTime(Date.now());
    setElapsed(0);
    setPhase('playing');
    setPhaseKey(k => k + 1);
  }, [selectedGame, selectedLang, selectedDiff, toast]);

  const handleAnswer = (idx: number) => {
    if (showResult) return;
    setAnswer(idx);
    setShowResult(true);
    const isCorrect = idx === questions[currentQ].correctIndex;
    if (isCorrect) {
      const diffMultiplier = selectedDiff === 'hard' ? 3 : selectedDiff === 'medium' ? 2 : 1;
      setCorrectCount(prev => prev + 1);
      setTotalScore(prev => prev + 100 * diffMultiplier);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      const finalElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(finalElapsed);
      setPhase('results');
      setPhaseKey(k => k + 1);
      setScoreAnimated(false);
      setTimeout(() => setScoreAnimated(true), 100);
      if (user) {
        submitScore(finalElapsed);
      }
    } else {
      setCurrentQ(prev => prev + 1);
      setAnswer(null);
      setShowResult(false);
    }
  };

  const submitScore = async (timeSpent: number) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/games/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: selectedGame,
          language: selectedLang,
          difficulty: selectedDiff,
          score: totalScore,
          correct: correctCount,
          total: questions.length,
          timeSpent,
        }),
      });
      if (res.ok) {
        toast({ title: 'Score Saved!', description: `Score: ${totalScore}` });
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const loadLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (lbGame !== 'all') params.set('game', lbGame);
      if (lbLang !== 'all') params.set('language', lbLang);
      if (lbDiff !== 'all') params.set('difficulty', lbDiff);
      const res = await fetch(`/api/games/leaderboard?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLbData(data.leaderboard || []);
      }
    } catch { /* ignore */ }
    setLbLoading(false);
  }, [lbGame, lbLang, lbDiff]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // ── Shared Navbar ──
  const renderNavbar = () => (loading || minLoading) ? null : (
    <Navbar activePage="games" scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} scrollToSection={scrollToSection} theme={theme} onToggleTheme={toggleTheme} onChangeTheme={changeTheme} onSearchOpen={() => setSearchOpen(true)} onOpenAuth={openAuthModal} onLogout={handleLogout} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifications={notifications} unreadCount={unreadCount} loadNotifications={loadNotifications} setNotifications={setNotifications as any} setUnreadCount={setUnreadCount as any} dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} />
  );

  // ═══════════════════════════════════════════
  // RENDER: Phase Select
  // ═══════════════════════════════════════════
  const renderGameSelect = () => (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 20, marginBottom: 40 }}>
      {GAMES.map((g, i) => {
        const isSelected = selectedGame === g.id;
        return (
          <button
            key={g.id}
            className={`game-card${isSelected ? ' selected' : ''}`}
            onClick={() => setSelectedGame(g.id)}
            style={{ animation: `slideInUp 0.5s ease ${i * 0.12}s both` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="card-icon-wrap">
                <i className={g.icon} style={{ fontSize: 18, color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="card-title">{g.name}</div>
                <div className="card-desc">{g.desc}</div>
              </div>
            </div>
            {isSelected && <div className="selected-bar" />}
          </button>
        );
      })}
    </div>
  );

  const renderConfigPanel = () => (
    <div className="game-config-panel">
      {/* Language picker */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase',
          letterSpacing: 0.5, marginBottom: 10, fontFamily: "var(--font-body)",
        }}>
          Language
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {LANGUAGES.map((l) => {
            const isActive = selectedLang === l.id;
            return (
              <button
                key={l.id}
                className={`game-picker-btn${isActive ? ' active' : ''}`}
                onClick={() => setSelectedLang(l.id)}
              >
                <i className={l.icon} style={{ fontSize: 12 }} />
                {l.name}
              </button>
            );
          })}
        </div>
      </div>
      {/* Difficulty picker */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase',
          letterSpacing: 0.5, marginBottom: 10, fontFamily: "var(--font-body)",
        }}>
          Difficulty
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {DIFFICULTIES.map((d) => {
            const isActive = selectedDiff === d.id;
            return (
              <button
                key={d.id}
                className={`game-picker-btn${isActive ? ' active' : ''}`}
                onClick={() => setSelectedDiff(d.id)}
                style={isActive ? { background: d.color, borderColor: d.color } : undefined}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      </div>
      {/* Start button */}
      <button
        className="game-btn-primary"
        onClick={startGame}
        disabled={!selectedGame}
      >
        START GAME <i className="fa-solid fa-play" style={{ marginLeft: 8, fontSize: 12 }} />
      </button>
    </div>
  );

  // ═══════════════════════════════════════════
  // RENDER: Loading
  // ═══════════════════════════════════════════
  const renderLoading = () => {
    const gameInfo = GAMES.find(g => g.id === selectedGame);
    const langInfo = LANGUAGES.find(l => l.id === selectedLang);
    const diffInfo = DIFFICULTIES.find(d => d.id === selectedDiff);

    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '60px 20px' }} key={`loading-${phaseKey}`}>
        {/* Spinning icon */}
        <div style={{
          width: 80, height: 80, margin: '0 auto 28px',
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
          border: '2px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulseRing 2s ease-in-out infinite',
        }}>
          <i className={gameInfo?.icon || 'fa-solid fa-code'} style={{ fontSize: 28, color: 'var(--accent)', animation: 'spinSlow 3s linear infinite', display: 'inline-block' }} />
        </div>

        {/* Main text */}
        <div style={{
          fontFamily: "var(--font-heading)", fontSize: isMobile ? 16 : 18, fontWeight: 700,
          color: 'var(--text-light)', marginBottom: 8,
          animation: 'slideInUp 0.4s ease both',
        }}>
          Getting Questions Ready
        </div>

        {/* Subtext with typing dots */}
        <div style={{
          fontSize: 12, color: 'var(--text-dim)', fontFamily: "var(--font-body)",
          marginBottom: 32,
          animation: 'slideInUp 0.4s ease 0.1s both',
        }}>
          Loading {diffInfo?.name} {langInfo?.name} challenges<span className="loading-dots" />
        </div>

        {/* Game info pills */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
          animation: 'slideInUp 0.4s ease 0.15s both',
        }}>
          {gameInfo && (
            <span style={{
              padding: '4px 12px', borderRadius: 999,
              background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
              backdropFilter: 'blur(12px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
              border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
              fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
              letterSpacing: 0.5,
              fontFamily: "var(--font-body)",
            }}>
              <i className={gameInfo.icon} style={{ marginRight: 4 }} />{gameInfo.name}
            </span>
          )}
          {langInfo && (
            <span style={{
              padding: '4px 12px', borderRadius: 999,
              background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
              backdropFilter: 'blur(12px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
              border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
              fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
              letterSpacing: 0.5,
              fontFamily: "var(--font-body)",
            }}>
              <i className={langInfo.icon} style={{ marginRight: 4 }} />{langInfo.name}
            </span>
          )}
          {diffInfo && (
            <span style={{
              padding: '4px 12px', borderRadius: 999,
              background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
              backdropFilter: 'blur(12px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
              border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
              fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
              letterSpacing: 0.5,
              fontFamily: "var(--font-body)",
            }}>
              {diffInfo.name}
            </span>
          )}
        </div>

        {/* Animated progress bar */}
        <div style={{
          width: 200, margin: '28px auto 0',
          height: 3, background: 'var(--input-bg)',
          borderRadius: 8, overflow: 'hidden',
          animation: 'slideInUp 0.4s ease 0.2s both',
        }}>
          <div style={{
            width: '40%', height: '100%',
            background: 'linear-gradient(90deg, var(--accent), transparent)',
            borderRadius: 8,
            animation: 'loadingBar 1.8s ease-in-out infinite',
          }} />
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // RENDER: Game Playing
  // ═══════════════════════════════════════════
  const renderPlaying = () => {
    const q = questions[currentQ];
    if (!q) return null;

    const gameInfo = GAMES.find(g => g.id === selectedGame);
    const langInfo = LANGUAGES.find(l => l.id === selectedLang);
    const diffInfo = DIFFICULTIES.find(d => d.id === selectedDiff);
    const isCorrect = answer === q.correctIndex;

    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }} key={`q-${currentQ}-${phaseKey}`}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, flexWrap: 'wrap', gap: 12,
          animation: 'slideInUp 0.4s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className={gameInfo?.icon} style={{ fontSize: 16, color: 'var(--accent)' }} />
            <span style={{
              fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700,
              color: 'var(--text-light)',
            }}>
              {gameInfo?.name}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: 999,
              background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
              backdropFilter: 'blur(12px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
              border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
              color: 'var(--text-dim)', fontSize: 9, fontWeight: 700,
              letterSpacing: 0.5,
            }}>
              {diffInfo?.name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
              <i className={langInfo?.icon} style={{ marginRight: 4 }} />{langInfo?.name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700,
              color: 'var(--text-light)',
              transition: 'all 0.3s ease',
            }}>
              {totalScore}
            </span>
            <span style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
              backdropFilter: 'blur(12px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
              border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
              fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 700,
              color: 'var(--text-dim)',
            }}>
              <i className="fa-solid fa-clock" style={{ marginRight: 6, fontSize: 10 }} />
              {formatTime(elapsed)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 4, background: 'var(--input-bg)',
          borderRadius: 8, marginBottom: 24, overflow: 'hidden',
        }}>
          <div style={{
            width: `${((currentQ + (showResult ? 1 : 0)) / questions.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 70%, white))',
            borderRadius: 8, transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
            backgroundSize: '200% 100%',
            animation: 'progressShine 2s linear infinite',
          }} />
        </div>

        {/* Question counter */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
          letterSpacing: 0.02, marginBottom: 12,
          fontFamily: "var(--font-body)",
          animation: 'slideInUp 0.3s ease both',
        }}>
          Question {currentQ + 1} of {questions.length}
        </div>

        {/* Code display */}
        <div style={{
          background: 'var(--input-bg)',
          border: '0.5px solid var(--border-color)',
          borderRadius: 12, padding: isMobile ? '16px 12px' : '20px 24px',
          marginBottom: 24, overflowX: 'auto',
          animation: 'slideInUp 0.4s ease 0.1s both',
          transition: 'border-color 0.3s ease',
          borderColor: showResult ? (isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border-color)',
        }}>
          <pre style={{
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontSize: isMobile ? 12 : 14, lineHeight: 1.7,
            color: 'var(--text-light)', margin: 0, whiteSpace: 'pre',
          }}>
            {q.code}
          </pre>
        </div>

        {/* Question prompt */}
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'var(--text-light)',
          marginBottom: 16, fontFamily: "var(--font-body)",
          animation: 'slideInUp 0.4s ease 0.15s both',
        }}>
          {selectedGame === 'bug-hunter' && <><i className="fa-solid fa-bug" style={{ marginRight: 6 }} />Find the bug and pick the fix:</>}
          {selectedGame === 'whats-output' && <><i className="fa-solid fa-eye" style={{ marginRight: 6 }} />What does this code output?</>}
          {selectedGame === 'code-completion' && <><i className="fa-solid fa-puzzle-piece" style={{ marginRight: 6 }} />Fill in the blank:</>}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            let color = 'var(--text-light)';
            let prefix = letter;

            const isCorrectOpt = showResult && idx === q.correctIndex;
            const isWrongOpt = showResult && idx === answer && idx !== q.correctIndex;
            const isDimmed = showResult && idx !== q.correctIndex && idx !== answer;

            if (isCorrectOpt) {
              color = 'var(--success-color)';
              prefix = '✓';
            } else if (isWrongOpt) {
              color = 'var(--error-color)';
              prefix = '✗';
            } else if (showResult) {
              color = 'var(--text-dim)';
            }

            const optClass = `game-option${isCorrectOpt ? ' correct' : ''}${isWrongOpt ? ' wrong' : ''}${isDimmed ? ' dimmed' : ''}`;

            return (
              <button
                key={idx}
                className={optClass}
                onClick={() => handleAnswer(idx)}
                disabled={showResult}
                style={{ animation: `optionReveal 0.4s ease ${idx * 0.08}s both` }}
              >
                <div className="option-circle" style={isCorrectOpt || isWrongOpt ? {} : undefined}>
                  {prefix}
                </div>
                <code style={{
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                  fontSize: isMobile ? 12 : 13, color, lineHeight: 1.4,
                }}>
                  {opt}
                </code>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showResult && (
          <div style={{
            background: isCorrect ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
            border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: 12, padding: '16px 18px', marginBottom: 20,
            animation: 'slideInUp 0.3s ease both',
          }}>
            <div style={{
              fontSize: 12, fontWeight: 600, marginBottom: 6,
              color: isCorrect ? 'var(--success-color)' : 'var(--error-color)',
              fontFamily: "var(--font-body)",
            }}>
              {isCorrect ? <><i className="fa-solid fa-check" style={{ marginRight: 4 }} />Correct!</> : <><i className="fa-solid fa-times" style={{ marginRight: 4 }} />Incorrect</>}
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6,
              fontFamily: "var(--font-body)",
            }}>
              {q.explanation}
            </div>
          </div>
        )}

        {/* Next button */}
        {showResult && (
          <button
            className="game-btn-primary"
            onClick={nextQuestion}
            style={{ animation: 'slideInUp 0.3s ease 0.2s both', fontSize: 13, letterSpacing: 0.5 }}
          >
            {currentQ + 1 >= questions.length ? 'VIEW RESULTS' : 'NEXT QUESTION'} <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8, fontSize: 11 }} />
          </button>
        )}

        {/* Quit button */}
        <button
          className="game-btn-secondary quit"
          onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase('select'); setPhaseKey(k => k + 1); }}
          style={{ marginTop: 10 }}
        >
          QUIT GAME
        </button>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // RENDER: Results
  // ═══════════════════════════════════════════
  const renderResults = () => {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const gameInfo = GAMES.find(g => g.id === selectedGame);

    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }} key={`results-${phaseKey}`}>
        <div style={{
          fontFamily: "var(--font-heading)", fontSize: isMobile ? 22 : 28, fontWeight: 700,
          color: 'var(--text-light)', marginBottom: 8,
          animation: 'slideInUp 0.5s ease both',
        }}>
          GAME OVER
        </div>
        <div style={{
          fontSize: 13, color: 'var(--text-dim)', marginBottom: 32,
          animation: 'slideInUp 0.5s ease 0.1s both',
        }}>
          {gameInfo?.name} — {LANGUAGES.find(l => l.id === selectedLang)?.name} — {DIFFICULTIES.find(d => d.id === selectedDiff)?.name}
        </div>

        {/* Score circle */}
        <div className={`game-score-circle${scoreAnimated ? ' animated' : ''}`}>
          <div style={{
            fontFamily: "var(--font-heading)", fontSize: isMobile ? 28 : 36, fontWeight: 700,
            color: 'var(--accent)',
          }}>
            {totalScore}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 0.02 }}>
            points
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32,
        }}>
          {[
            { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 80 ? 'var(--success-color)' : accuracy >= 50 ? 'var(--warning-color)' : 'var(--error-color)', delay: '0.2s' },
            { label: 'Correct', value: `${correctCount}/${questions.length}`, color: 'var(--text-light)', delay: '0.3s' },
            { label: 'Time', value: formatTime(elapsed), color: 'var(--accent)', delay: '0.4s' },
          ].map((s, i) => (
            <div key={i} className="game-stat-card" style={{ animation: `slideInUp 0.4s ease ${s.delay} both` }}>
              <div style={{
                fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700,
                color: s.color, marginBottom: 4,
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: 9, color: 'var(--text-dim)',
                letterSpacing: 0.02, fontFamily: "var(--font-body)",
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {!user && (
          <div style={{
            background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
            backdropFilter: 'blur(12px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
            border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
            fontSize: 12, color: 'var(--text-dim)',
            animation: 'slideInUp 0.4s ease 0.5s both',
          }}>
            <i className="fa-solid fa-info-circle" style={{ marginRight: 6, color: 'var(--accent)' }} />
            Sign in to save your scores to the leaderboard!
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, animation: 'slideInUp 0.4s ease 0.6s both' }}>
          <button
            className="game-btn-primary"
            onClick={() => { setPhase('select'); setPhaseKey(k => k + 1); }}
            style={{ flex: 1, fontSize: 12, letterSpacing: 0.5 }}
          >
            PLAY AGAIN
          </button>
          <button
            className="game-btn-secondary"
            onClick={() => { setPhase('leaderboard'); setPhaseKey(k => k + 1); }}
            style={{ flex: 1, padding: '14px 20px', fontSize: 12, fontWeight: 600, fontFamily: "var(--font-heading)", letterSpacing: 0.5 }}
          >
            LEADERBOARD
          </button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // RENDER: Leaderboard
  // ═══════════════════════════════════════════
  const renderLeaderboard = () => (
    <div style={{ maxWidth: 900, margin: '0 auto' }} key={`lb-${phaseKey}`}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
        animation: 'slideInUp 0.4s ease both',
      }}>
        <div style={{
          fontFamily: "var(--font-heading)", fontSize: isMobile ? 14 : 16, fontWeight: 700,
          color: 'var(--text-light)',
        }}>
          <i className="fa-solid fa-trophy" style={{
            color: 'var(--accent)', marginRight: 10,
            animation: 'floatY 3s ease-in-out infinite',
            display: 'inline-block',
         }} />
          LEADERBOARD
        </div>
        <button
          className="game-btn-secondary"
          onClick={() => { setPhase('select'); setPhaseKey(k => k + 1); }}
          style={{ width: 'auto', padding: '8px 16px', fontSize: 11, fontWeight: 700 }}
        >
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} /> BACK TO GAMES
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', animation: 'slideInUp 0.4s ease 0.1s both' }}>
        <select
          value={lbGame}
          onChange={(e) => setLbGame(e.target.value)}
        >
          <option value="all">All Games</option>
          {GAMES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select
          value={lbLang}
          onChange={(e) => setLbLang(e.target.value)}
        >
          <option value="all">All Languages</option>
          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select
          value={lbDiff}
          onChange={(e) => setLbDiff(e.target.value)}
        >
          <option value="all">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Leaderboard list */}
      {lbLoading ? (
        <div style={{
          background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
          backdropFilter: 'blur(20px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
          border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
          borderRadius: 12, padding: 60, textAlign: 'center',
          color: 'var(--text-dim)', fontSize: 12,
          animation: 'slideInUp 0.4s ease 0.2s both',
        }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />
          Loading leaderboard...
        </div>
      ) : lbData.length === 0 ? (
        <div style={{
          background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
          backdropFilter: 'blur(20px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
          border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
          borderRadius: 12, padding: 60, textAlign: 'center',
          animation: 'slideInUp 0.4s ease 0.2s both',
        }}>
          <i className="fa-solid fa-trophy" style={{ fontSize: 32, color: 'var(--text-dim)', opacity: 0.2, display: 'block', marginBottom: 12 }} />
          <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600, fontFamily: "var(--font-body)" }}>
            No scores yet. Be the first to play!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, animation: 'slideInUp 0.4s ease 0.2s both' }}>
          {lbData.map((entry, i) => {
            const isMe = user && entry.userId === user.id;
            const isTop3 = i < 3;
            const rankColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-dim)';
            const rankIcon = i === 0 ? 'fa-solid fa-trophy' : i === 1 ? 'fa-solid fa-medal' : i === 2 ? 'fa-solid fa-award' : null;
            const gamesPlayed = entry.gamesPlayed || 1;

            if (isMobile) {
              // Mobile: card layout
              return (
                <div key={entry.userId || entry.id}
                  style={{
                    background: isMe ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
                    backdropFilter: 'blur(20px) saturate(1.6)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                    border: `0.5px solid ${isMe ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : isTop3 ? `${rankColor}30` : 'color-mix(in srgb, var(--text-light) 10%, transparent)'}`,
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    animation: `slideInLeft 0.3s ease ${i * 0.04}s both`,
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!isMe) (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--accent) 25%, transparent)'; }}
                  onMouseLeave={(e) => { if (!isMe) (e.currentTarget as HTMLElement).style.borderColor = isTop3 ? `${rankColor}30` : 'color-mix(in srgb, var(--text-light) 10%, transparent)'; }}
                >
                  {/* Rank */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isTop3 ? `${rankColor}15` : 'var(--input-bg)',
                    border: `1px solid ${isTop3 ? `${rankColor}40` : 'color-mix(in srgb, var(--text-light) 10%, transparent)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {rankIcon ? (
                      <i className={rankIcon} style={{ fontSize: 11, color: rankColor }} />
                    ) : (
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, color: rankColor }}>{i + 1}</span>
                    )}
                  </div>
                  {/* Avatar + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                      backdropFilter: 'blur(12px) saturate(1.4)',
                      WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                      border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {entry.userAvatar
                        ? <img src={entry.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : entry.userName?.charAt(0).toUpperCase()
                      }
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: isMe ? 700 : 600,
                      color: isMe ? 'var(--accent)' : 'var(--text-light)',
                      fontFamily: "var(--font-body)",
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {entry.userName}
                    </span>
                  </div>
                  {/* Score + Time stacked */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700,
                      color: isTop3 ? rankColor : 'var(--text-light)', lineHeight: 1.2,
                    }}>
                      {entry.score?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: "var(--font-body)", marginTop: 2 }}>
                      {formatTime(entry.timeSpent)} &middot; {gamesPlayed} game{gamesPlayed !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            }

            // Desktop: clean row layout
            return (
              <div key={entry.userId || entry.id}
                style={{
                  background: isMe ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'color-mix(in srgb, var(--card-bg) 60%, transparent)',
                  backdropFilter: 'blur(20px) saturate(1.6)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                  border: `0.5px solid ${isMe ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : isTop3 ? `${rankColor}20` : 'color-mix(in srgb, var(--text-light) 10%, transparent)'}`,
                  borderRadius: 12, padding: '12px 18px',
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 100px 80px 90px',
                  alignItems: 'center', gap: 12,
                  animation: `slideInLeft 0.3s ease ${i * 0.04}s both`,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => { if (!isMe) (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--accent) 25%, transparent)'; }}
                onMouseLeave={(e) => { if (!isMe) (e.currentTarget as HTMLElement).style.borderColor = isTop3 ? `${rankColor}20` : 'color-mix(in srgb, var(--text-light) 10%, transparent)'; }}
              >
                {/* Rank */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isTop3 ? `${rankColor}15` : 'var(--input-bg)',
                  border: `1px solid ${isTop3 ? `${rankColor}40` : 'color-mix(in srgb, var(--text-light) 10%, transparent)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {rankIcon ? (
                    <i className={rankIcon} style={{ fontSize: 13, color: rankColor }} />
                  ) : (
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 700, color: rankColor }}>{i + 1}</span>
                  )}
                </div>

                {/* Player */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                    backdropFilter: 'blur(12px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                    border: '0.5px solid color-mix(in srgb, var(--text-light) 10%, transparent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    {entry.userAvatar
                      ? <img src={entry.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : entry.userName?.charAt(0).toUpperCase()
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: isMe ? 700 : 600,
                      color: isMe ? 'var(--accent)' : 'var(--text-light)',
                      fontFamily: "var(--font-body)",
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {entry.userName}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "var(--font-body)" }}>
                      {entry.correct && entry.total ? `${entry.correct}/${entry.total} correct` : ''}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div>
                  <div style={{
                    fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700,
                    color: isTop3 ? rankColor : 'var(--text-light)',
                    lineHeight: 1.2,
                  }}>
                    {entry.score?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "var(--font-body)" }}>
                    points
                  </div>
                </div>

                {/* Games */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700,
                    color: 'var(--text-light)', lineHeight: 1.2,
                  }}>
                    {gamesPlayed}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "var(--font-body)" }}>
                    games
                  </div>
                </div>

                {/* Time */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700,
                    color: 'var(--accent)', lineHeight: 1.2,
                  }}>
                    {formatTime(entry.timeSpent)}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "var(--font-body)" }}>
                    total time
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════
  return (
    <>
      <title>Code Games | XFoundry</title>
      <meta name="description" content="Sharpen your coding skills with fun interactive games. Bug Hunter, What's the Output, and Code Completion." />

      <div className="global-particles" id="globalParticles" />
      <div className="cursor-dot" ref={dotRef} id="cursorDot" />

      <AuthGate loading={loading} minLoading={minLoading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to play code games')} onSignUp={() => openAuthModal('signup')} />
      {renderNavbar()}

      {!(loading || minLoading) && <div className="page-transition-enter">
        {/* HERO */}
        <section className="course-hero">
          <HeroEffects />
          <div className="hero-content">
            <h1 style={{ fontFamily: "var(--font-heading)" }}>Code<br /><span className="v-highlight">Games</span></h1>
            <div className="hero-meta" style={{ marginTop: 24 }}>
              <div className="v-step-badge"><i className="fa-solid fa-bug" /> Debug</div>
              <div className="v-step-badge"><i className="fa-solid fa-terminal" /> Predict</div>
              <div className="v-step-badge"><i className="fa-solid fa-puzzle-piece" /> Complete</div>
            </div>
            <div className="breadcrumb" style={{ marginTop: 24 }}>
              <Link href="/" style={{ color: 'var(--text-dim)' }}>Home</Link> <span>/</span> <span style={{ color: 'var(--text-light)' }}>Games</span>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="section" style={{ background: 'var(--black)' }}>
          <div className="container-max" style={{ paddingTop: 20, paddingBottom: 80, paddingLeft: isMobile ? 16 : undefined, paddingRight: isMobile ? 16 : undefined }}>

            {phase === 'select' && (
              <>
                {renderGameSelect()}
                {selectedGame && renderConfigPanel()}

                {/* Leaderboard quick access */}
                <div style={{ textAlign: 'center', marginTop: 20, animation: 'slideInUp 0.4s ease 0.3s both' }}>
                  <button
                    className="game-btn-secondary trophy"
                    onClick={() => { setPhase('leaderboard'); setPhaseKey(k => k + 1); }}
                    style={{ width: 'auto', padding: '10px 24px', fontSize: 12, fontWeight: 700, display: 'inline-flex' }}
                  >
                    <i className="fa-solid fa-trophy" style={{ marginRight: 8, color: 'var(--accent)', display: 'inline-block' }} />
                    VIEW LEADERBOARD
                  </button>
                </div>
              </>
            )}

            {phase === 'loading' && renderLoading()}
            {phase === 'playing' && renderPlaying()}
            {phase === 'results' && renderResults()}
            {phase === 'leaderboard' && renderLeaderboard()}

          </div>
        </section>
      </div>}

      {/* FOOTER */}
      {!(loading || minLoading) &&<footer className="v-footer">
  <div className="v-footer-grid">
    <div className="v-footer-brand">
      <Link href="/" className="nav-logo" style={{ display: 'inline-block', marginBottom: 20 }}><Logo className="nav-logo-img" style={{ height: 40 }} /></Link>
      <p>Pioneering the future of technology through innovation, research, and education. Building solutions that transform industries and empower human potential.</p>
      <div className="v-footer-socials">
        <a href="https://www.linkedin.com/in/marwan-montaser-067054387/" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-linkedin-in" /></a>
        <a href="https://github.com/for-tristan" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-github" /></a>
        <a href="https://discord.gg/TVRxJg3rcN" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-discord" /></a>
      </div>
    </div>
    <div className="v-footer-column">
      <h4>Quick Links</h4>
      <ul className="v-footer-links">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/#services">Services</Link></li>
        <li><Link href="/#courses">Programs</Link></li>
        <li><Link href="/games">Games</Link></li>
        <li><Link href="/study">Study</Link></li>
      </ul>
    </div>
    <div className="v-footer-column">
      <h4>Roadmap &amp; Practice</h4>
      <ul className="v-footer-links">
        <li><Link href="https://roadmap.sh">Developer Roadmap</Link></li>
        <li><Link href="https://neetcode.io/roadmap">NeetCode Roadmap</Link></li>
        <li><Link href="https://leetcode.com/">LeetCode</Link></li>
        <li><Link href="https://www.hackerrank.com/">HackerRank</Link></li>
        <li><Link href="https://www.codewars.com/">CodeWars</Link></li>
      </ul>
    </div>
    <div className="v-footer-column">
      <h4>Contact</h4>
      <ul className="v-footer-links">
        <li><a href="mailto:xfoundationcom@gmail.com">xfoundationcom@gmail.com</a></li>
        <li><a href="tel:+201234567890">+201234567890</a></li>
      </ul>
    </div>
  </div>
  <div className="v-footer-bottom">
    <p>&copy; {new Date().getFullYear()} X-Foundry. All Rights Reserved.</p>
  </div>
</footer>}

      {/* Modals */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} setQuery={setSearchQuery} results={filteredSearch} onSelect={(link) => { if (link.startsWith('#')) { scrollToSection(link.replace('#', '')); } else { router.push(link); } }} />
      <AuthModal
        open={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setForgotStep('idle'); }}
        tab={authTab} setTab={setAuthTab} message={authMessage}
        loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} loginLoading={loginLoading} onLogin={handleLogin}
        signupName={signupName} setSignupName={setSignupName} signupEmail={signupEmail} setSignupEmail={setSignupEmail} signupPassword={signupPassword} setSignupPassword={setSignupPassword} signupConfirmPassword={signupConfirmPassword} setSignupConfirmPassword={setSignupConfirmPassword}
        signupPhone={signupPhone} setSignupPhone={setSignupPhone} signupCompany={signupCompany} setSignupCompany={setSignupCompany} signupLoading={signupLoading} onSignup={handleSignup}
        getPasswordStrength={getPasswordStrength}
        forgotStep={forgotStep} setForgotStep={setForgotStep} forgotEmail={forgotEmail} setForgotEmail={setForgotEmail} forgotLoading={forgotLoading} onForgotSubmit={handleForgotSubmit}
        resetCode={resetCode} setResetCode={setResetCode} newPassword={newPassword} setNewPassword={setNewPassword} resetLoading={resetLoading} onResetSubmit={handleResetSubmit}
        verificationStep={verificationStep} setVerificationStep={setVerificationStep} verificationEmail={verificationEmail} verificationCode={verificationCode} setVerificationCode={setVerificationCode} verificationLoading={verificationLoading} onVerifyEmail={handleVerifyEmail} onResendVerification={handleResendVerification} resendLoading={resendLoading}
      />
      <ProfileModal open={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} profileName={profileName} setProfileName={setProfileName} profileUsername={profileUsername} setProfileUsername={setProfileUsername} profilePhone={profilePhone} setProfilePhone={setProfilePhone} profileCompany={profileCompany} setProfileCompany={setProfileCompany} profileSaving={profileSaving} avatarUploading={avatarUploading} onProfileSave={handleProfileSave} onAvatarUpload={handleAvatarUpload} onAvatarUploaded={handleAvatarUploaded} />

      {!atBottom && (
        <GradualBlur target="page" position="bottom" height="3.5rem" strength={1} divCount={6} curve="bezier" exponential={false} opacity={1} zIndex={50} />
      )}
    </>
  );
}
