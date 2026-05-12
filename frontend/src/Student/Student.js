import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';

/* ─── Inline styles ─────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    display: 'flex',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    overflow: 'hidden',
    position: 'relative',
  },

  /* Left decorative panel — teal/cyan theme for students */
  leftPanel: {
    width: '42%',
    background: 'linear-gradient(145deg, #ecfeff 0%, #cffafe 40%, #a5f3fc 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2.5rem',
    position: 'relative',
    overflow: 'hidden',
  },

  circle1: {
    position: 'absolute',
    width: 320, height: 320,
    borderRadius: '50%',
    background: 'rgba(6,182,212,0.12)',
    top: -80, left: -80,
  },
  circle2: {
    position: 'absolute',
    width: 220, height: 220,
    borderRadius: '50%',
    background: 'rgba(8,145,178,0.10)',
    bottom: 20, right: -60,
  },
  circle3: {
    position: 'absolute',
    width: 140, height: 140,
    borderRadius: '50%',
    background: 'rgba(103,232,249,0.5)',
    bottom: 180, left: 30,
  },

  leftContent: { position: 'relative', zIndex: 1, textAlign: 'center' },

  bigIcon: {
    width: 100, height: 100,
    borderRadius: 28,
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 46,
    margin: '0 auto 1.6rem',
    boxShadow: '0 16px 40px rgba(6,182,212,0.35)',
  },

  leftTitle: {
    fontSize: '1.7rem',
    fontWeight: 800,
    color: '#164e63',
    marginBottom: '0.6rem',
    lineHeight: 1.2,
  },
  leftSub: {
    fontSize: '0.95rem',
    color: '#0e7490',
    lineHeight: 1.6,
    maxWidth: 260,
    margin: '0 auto',
  },

  badgesWrap: { marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: 10 },
  badge: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.65)',
    border: '1px solid rgba(6,182,212,0.2)',
    borderRadius: 12,
    padding: '10px 16px',
    backdropFilter: 'blur(8px)',
  },
  badgeDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    background: '#06b6d4',
    boxShadow: '0 0 6px #06b6d4',
    flexShrink: 0,
  },
  badgeText: { fontSize: '0.83rem', fontWeight: 600, color: '#155e75' },

  /* Right form panel */
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2.5rem',
    background: '#ffffff',
    overflowY: 'auto',
  },

  formBox: { width: '100%', maxWidth: 400 },

  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'transparent',
    border: '1.5px solid #d1d5db',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
    marginBottom: '2rem',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },

  formHeader: { marginBottom: '2rem' },
  formTitle: { fontSize: '1.65rem', fontWeight: 900, color: '#111827', marginBottom: 4 },
  formSub:   { fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 },

  divider: {
    height: 1,
    background: 'linear-gradient(90deg, #06b6d4 0%, #cffafe 100%)',
    borderRadius: 2,
    marginBottom: '1.8rem',
  },

  label: {
    fontSize: '0.85rem', fontWeight: 700,
    color: '#374151', marginBottom: 6, display: 'block',
  },

  labelHint: {
    fontSize: '0.78rem',
    color: '#9ca3af',
    fontWeight: 500,
    marginTop: 5,
    display: 'block',
  },

  inputWrap: { position: 'relative', marginBottom: '1.3rem' },

  inputIcon: {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1rem', zIndex: 1,
    pointerEvents: 'none',
  },

  input: {
    width: '100%',
    padding: '13px 14px 13px 42px',
    borderRadius: 12,
    border: '1.5px solid #e5e7eb',
    background: '#f9fafb',
    fontSize: '0.93rem',
    color: '#111827',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  },

  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 6px 20px rgba(6,182,212,0.35)',
    transition: 'all 0.3s ease',
    letterSpacing: '0.3px',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  infoBox: {
    background: '#f0fdff',
    border: '1px solid #a5f3fc',
    borderRadius: 12,
    padding: '14px 16px',
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  infoText: { fontSize: '0.78rem', color: '#0e7490', fontWeight: 500, lineHeight: 1.6 },
};

/* ─── Component ─────────────────────────────────────────── */
const StudentLogin = ({ onLogin, onBack }) => {
  const [formData, setFormData] = useState({ studentId: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId.trim()) {
      setError('Please enter your Student ID'); return;
    }
    if (formData.studentId.trim().length < 3) {
      setError('Please enter a valid Student ID (at least 3 characters)'); return;
    }

    setIsLoading(true);
    try {
      console.log('Student Login Attempt:', formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const userData = {
        role: 'student',
        studentId: formData.studentId.trim(),
        name: `Student ${formData.studentId.trim()}`,
        loginTime: new Date().toISOString(),
      };

      console.log('Login successful:', userData);
      setError('');
      if (onLogin) {
        onLogin(userData);
      } else {
        console.error('onLogin callback is not provided');
        setError('Login system error. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    ...S.input,
    borderColor: focused ? '#06b6d4' : '#e5e7eb',
    boxShadow: focused ? '0 0 0 3px rgba(6,182,212,0.12)' : 'none',
    opacity: isLoading ? 0.7 : 1,
  };

  const badges = [
    'View AI Evaluation Results',
    'Track Performance Analytics',
    'Access Detailed Feedback',
  ];

  return (
    <div style={S.page}>

      {/* ── Left decorative panel ── */}
      <div
        style={S.leftPanel}
        className="d-none d-lg-flex flex-column align-items-center justify-content-center"
      >
        <div style={S.circle1}></div>
        <div style={S.circle2}></div>
        <div style={S.circle3}></div>

        <div style={S.leftContent}>
          <div style={S.bigIcon}>🎓</div>
          <div style={S.leftTitle}>Student Portal</div>
          <div style={S.leftSub}>
            View your AI-evaluated results, performance trends, and personalised feedback instantly.
          </div>

          <div style={S.badgesWrap}>
            {badges.map((b) => (
              <div style={S.badge} key={b}>
                <span style={S.badgeDot}></span>
                <span style={S.badgeText}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={S.rightPanel}>
        <div style={S.formBox}>

          {/* Back button */}
          <button
            style={S.backBtn}
            onClick={onBack}
            disabled={isLoading}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.color = '#0891b2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; }}
          >
            ← Back to Home
          </button>

          {/* Header */}
          <div style={S.formHeader}>
            <div style={S.formTitle}>Hello, Student 🎓</div>
            <div style={S.formSub}>AI Evaluation System · Student Access</div>
          </div>

          {/* Divider */}
          <div style={S.divider}></div>

          {/* Error */}
          {error && (
            <Alert variant="danger" className="mb-4" style={{ borderRadius: 12, fontSize: '0.88rem' }}>
              ⚠️ {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.8rem' }}>
              <label style={S.label}>Student ID</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>🎓</span>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="Enter your Student ID"
                  maxLength={50}
                  disabled={isLoading}
                  style={inputStyle}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </div>
              <span style={S.labelHint}>ℹ️ Enter your unique student identification number</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{ ...S.submitBtn, opacity: isLoading ? 0.8 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(6,182,212,0.5)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(6,182,212,0.35)'; }}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                'Login as Student →'
              )}
            </button>
          </form>

          {/* Info box */}
          <div style={S.infoBox}>
            <div style={S.infoText}>
              🔒 Secure Student Access Portal<br />
              Demo: Enter any Student ID to login
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentLogin;