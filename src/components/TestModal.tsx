'use client';

import { useState, useEffect, useCallback } from 'react';

interface TestQuestion {
  id: string;
  questionText: string;
  options: string[];
  questionType: string;
  points: number;
  questionOrder: number;
}

interface TestAttempt {
  score: number;
  totalPoints: number;
  passed: boolean;
  submittedAt: string;
}

interface StudentTest {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  questionCount: number;
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
  questions: TestQuestion[];
  hasCompleted: boolean;
  attempt: TestAttempt | null;
}

interface TestModalProps {
  test: StudentTest | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function TestModal({ test, onClose, onSubmitted }: TestModalProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [testStartedAt, setTestStartedAt] = useState<string | null>(null);
  const [results, setResults] = useState<{
    success: boolean;
    score: number;
    totalPoints: number;
    passed: boolean;
    scorePercentage: number;
    correctQuestionIds: string[];
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (test && !test.hasCompleted) {
      setTimeLeft(test.timeLimit * 60);
      setTestStartedAt(new Date().toISOString());
    }
  }, [test]);

  useEffect(() => {
    if (!test || test.hasCompleted || timeLeft <= 0 || results) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, timeLeft, results, test?.hasCompleted]);

  useEffect(() => {
    if (timeLeft === 0 && test && !test.hasCompleted && !results && !submitting) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (!test || submitting || results) return;

    const answeredCount = Object.keys(answers).length;
    if (answeredCount === 0) {
      setError('Please answer at least one question');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/courses/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test.id, answers, startedAt: testStartedAt }),
      });

      const data = await res.json();

      if (res.ok) {
        setResults({
          success: true,
          score: data.score,
          totalPoints: data.totalPoints,
          passed: data.passed,
          scorePercentage: data.scorePercentage,
          correctQuestionIds: data.correctQuestionIds || [],
        });
        if (onSubmitted) onSubmitted();
      } else {
        setError(data.error || 'Failed to submit test');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setSubmitting(false);
  }, [test, submitting, results, answers, onSubmitted]);

  if (!test) return null;

  const questions = test.questions;
  if (!questions || questions.length === 0) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(16px) saturate(1.4)', WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20,
      }} data-lenis-prevent onClick={onClose}>
        <div style={{
          background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
          borderRadius: 16,
          padding: '32px 40px', maxWidth: 480, width: '100%', textAlign: 'center',
          boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px color-mix(in srgb, var(--accent) 6%, transparent)',
        }} onClick={(e) => e.stopPropagation()}>
          <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: 36, color: 'var(--warning-color)', marginBottom: 16, display: 'block' }} />
          <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--text-light)', fontFamily: 'var(--font-heading, Inter Tight)', fontWeight: 800 }}>No Questions Available</h3>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 20, fontFamily: 'var(--font-body, Inter Tight)' }}>This test does not have any questions yet.</p>
          <button className="v-btn v-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const isTimeLow = timeLeft <= 60 && timeLeft > 0;

  if (test.hasCompleted && test.attempt && !results) {
    const pct = test.attempt.totalPoints > 0
      ? Math.round((test.attempt.score / test.attempt.totalPoints) * 100)
      : 0;
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(16px) saturate(1.4)', WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20,
      }} data-lenis-prevent onClick={onClose}>
        <div style={{
          background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
          borderRadius: 16,
          padding: '36px 40px', maxWidth: 520, width: '100%',
          boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px color-mix(in srgb, var(--accent) 6%, transparent)',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, color: 'var(--text-light)', margin: 0, fontFamily: 'var(--font-heading, Inter Tight)', fontWeight: 800 }}>{test.title}</h3>
            <button onClick={onClose} className="v-modal-close" style={{ background: 'color-mix(in srgb, var(--text-light) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)', borderRadius: 8, color: 'var(--text-dim)', fontSize: 20, cursor: 'pointer', padding: 4, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-times" /></button>
          </div>

          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
              background: test.attempt.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `3px solid ${test.attempt.passed ? 'var(--success-color)' : 'var(--error-color)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`fas ${test.attempt.passed ? 'fa-check' : 'fa-times'}`} style={{ fontSize: 36, color: test.attempt.passed ? 'var(--success-color)' : 'var(--error-color)' }} />
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: test.attempt.passed ? 'var(--success-color)' : 'var(--error-color)', marginBottom: 4 }}>{pct}%</div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 8 }}>
              {test.attempt.score} / {test.attempt.totalPoints} points
            </div>
            <div style={{
              display: 'inline-block', padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: test.attempt.passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: test.attempt.passed ? 'var(--success-color)' : 'var(--error-color)',
            }}>
              {test.attempt.passed ? 'PASSED' : 'FAILED'} (Passing: {test.passingScore}%)
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 16 }}>
              Submitted on {new Date(test.attempt.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            <p style={{ fontSize: 12, color: '#eab308', marginTop: 8 }}>
              <i className="fa-solid fa-info-circle" style={{ marginRight: 6 }} />
              Contact admin if you need to retake this test.
            </p>
          </div>

          <button className="v-btn v-btn-ghost" style={{ width: '100%' }} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(16px) saturate(1.4)', WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20,
      }} data-lenis-prevent onClick={onClose}>
        <div style={{
          background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
          borderRadius: 16,
          padding: '36px 40px', maxWidth: 520, width: '100%',
          boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px color-mix(in srgb, var(--accent) 6%, transparent)',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, color: 'var(--text-light)', margin: 0, fontFamily: 'var(--font-heading, Inter Tight)', fontWeight: 800 }}>Test Results</h3>
            <button onClick={onClose} className="v-modal-close" style={{ background: 'color-mix(in srgb, var(--text-light) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)', borderRadius: 8, color: 'var(--text-dim)', fontSize: 20, cursor: 'pointer', padding: 4, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-times" /></button>
          </div>

          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
              background: results.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `3px solid ${results.passed ? 'var(--success-color)' : 'var(--error-color)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`fas ${results.passed ? 'fa-trophy' : 'fa-times'}`} style={{ fontSize: 36, color: results.passed ? 'var(--success-color)' : 'var(--error-color)' }} />
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 4, fontWeight: 700 }}>{test.title}</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: results.passed ? 'var(--success-color)' : 'var(--error-color)', marginBottom: 4 }}>
              {results.scorePercentage}%
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 8 }}>
              {results.score} / {results.totalPoints} points
            </div>
            <div style={{
              display: 'inline-block', padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: results.passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: results.passed ? 'var(--success-color)' : 'var(--error-color)',
            }}>
              {results.passed ? 'PASSED' : 'FAILED'} (Passing: {test.passingScore}%)
            </div>
          </div>

          <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 20, borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)', paddingTop: 16 }}>
            {questions.map((q, idx) => {
              const isCorrect = results.correctQuestionIds.includes(q.id);
              return (
                <div key={q.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13,
                }}>
                  <i className={`fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ color: isCorrect ? 'var(--success-color)' : 'var(--error-color)', fontSize: 14, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Q{idx + 1}: {q.questionText}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 12, flexShrink: 0 }}>
                    {isCorrect ? `${q.points}pt` : '0pt'}
                  </span>
                </div>
              );
            })}
          </div>

          <button className="v-btn v-btn-ghost" style={{ width: '100%' }} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(16px) saturate(1.4)', WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20,
    }} data-lenis-prevent onClick={onClose}>
      <div style={{
        background: 'color-mix(in srgb, var(--card-bg) 92%, transparent)',
        backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
        border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
        borderRadius: 16,
        maxWidth: 680, width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px color-mix(in srgb, var(--accent) 6%, transparent)',
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{
          padding: '16px 24px', borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 16, color: 'var(--text-light)', margin: 0, fontFamily: 'var(--font-heading, Inter Tight)', fontWeight: 800 }}>{test.title}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 0' }}>
              Question {currentQ + 1} of {questions.length} &middot; {answeredCount}/{questions.length} answered
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '2px 0 0', opacity: 0.7 }}>
              <i className="fa-solid fa-hourglass-half" style={{ marginRight: 4, fontSize: 10, color: 'var(--accent)' }} />
              Duration: {test.timeLimit} min
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 16, fontWeight: 700, fontFamily: 'monospace',
              background: isTimeLow ? 'color-mix(in srgb, var(--error-color) 15%, transparent)' : 'color-mix(in srgb, var(--text-light) 5%, transparent)',
              color: isTimeLow ? 'var(--error-color)' : timeLeft <= 300 ? '#eab308' : 'var(--text-light)',
              border: `1px solid ${isTimeLow ? 'color-mix(in srgb, var(--error-color) 30%, transparent)' : 'color-mix(in srgb, var(--border-color) 60%, transparent)'}`,
              animation: isTimeLow ? 'pulse 1s infinite' : 'none',
            }}>
              <i className="fa-solid fa-clock" style={{ marginRight: 6, fontSize: 13 }} />
              {formatTime(test.timeLimit * 60 - timeLeft)} / {formatTime(test.timeLimit * 60)}
            </div>
            <button onClick={onClose} className="v-modal-close" style={{ background: 'color-mix(in srgb, var(--text-light) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)', borderRadius: 8, color: 'var(--text-dim)', fontSize: 18, cursor: 'pointer', padding: 4, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-times" />
            </button>
          </div>
        </div>

        <div style={{
          padding: '12px 24px', borderBottom: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
          display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0,
        }}>
          {questions.map((qq, idx) => (
            <button
              key={qq.id}
              onClick={() => setCurrentQ(idx)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: idx === currentQ ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : answers[qq.id] !== undefined ? 'color-mix(in srgb, var(--success-color) 10%, transparent)' : 'transparent',
                borderColor: idx === currentQ ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : answers[qq.id] !== undefined ? 'color-mix(in srgb, var(--success-color) 30%, transparent)' : 'color-mix(in srgb, var(--border-color) 60%, transparent)',
                color: idx === currentQ ? 'var(--accent)' : answers[qq.id] !== undefined ? 'var(--success-color)' : 'var(--text-dim)',
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', fontSize: 12, fontWeight: 700,
              padding: '3px 10px', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            }}>
              {q.points} point{q.points !== 1 ? 's' : ''}
            </span>
          </div>

          <h4 style={{ fontSize: 17, color: 'var(--text-light)', lineHeight: 1.5, marginBottom: 20 }}>
            {q.questionText}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (results || submitting) return;
                  setAnswers(prev => ({ ...prev, [q.id]: idx }));
                }}
                style={{
                  padding: '12px 16px', borderRadius: 8, border: '1px solid',
                  textAlign: 'left', cursor: submitting ? 'default' : 'pointer',
                  background: answers[q.id] === idx ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'color-mix(in srgb, var(--text-light) 2%, transparent)',
                  borderColor: answers[q.id] === idx ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'color-mix(in srgb, var(--border-color) 60%, transparent)',
                  color: answers[q.id] === idx ? 'var(--text-light)' : 'var(--text-dim)',
                  fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', border: `2px solid ${answers[q.id] === idx ? 'var(--accent)' : 'color-mix(in srgb, var(--border-color) 60%, transparent)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  flexShrink: 0, color: answers[q.id] === idx ? 'var(--accent)' : 'var(--text-dim)',
                  background: answers[q.id] === idx ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          padding: '16px 24px', borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <button
            className="v-btn v-btn-ghost"
            disabled={currentQ === 0}
            onClick={() => setCurrentQ(prev => prev - 1)}
            style={{ opacity: currentQ === 0 ? 0.4 : 1 }}
          >
            <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }} /> Previous
          </button>

          {error && <span style={{ fontSize: 12, color: 'var(--error-color)' }}>{error}</span>}

          {currentQ < questions.length - 1 ? (
            <button className="v-btn v-btn-accent" onClick={() => setCurrentQ(prev => prev + 1)}>
              Next <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }} />
            </button>
          ) : (
            <button
              className="v-btn v-btn-accent"
              onClick={handleSubmit}
              disabled={submitting || timeLeft === 0}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              <i className={submitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'} style={{ marginRight: 8 }} />
              {submitting ? 'Submitting...' : timeLeft === 0 ? 'Time Up!' : 'Submit Test'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
