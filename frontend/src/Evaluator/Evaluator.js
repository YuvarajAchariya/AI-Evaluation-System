import React, { useState } from 'react';
import { Container, Row, Col, Form, Alert } from 'react-bootstrap';

/* ─── Inline styles ─────────────────────────────────────── */
const S = {
  /* Page wrapper */
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    display: 'flex',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    overflow: 'hidden',
    position: 'relative',
  },

  /* Left decorative panel */
  leftPanel: {
    width: '42%',
    background: 'linear-gradient(145deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2.5rem',
    position: 'relative',
    overflow: 'hidden',
  },

  /* Decorative circles on left panel */
  circle1: {
    position: 'absolute',
    width: 320, height: 320,
    borderRadius: '50%',
    background: 'rgba(16,185,129,0.12)',
    top: -80, left: -80,
  },
  circle2: {
    position: 'absolute',
    width: 220, height: 220,
    borderRadius: '50%',
    background: 'rgba(5,150,105,0.10)',
    bottom: 20, right: -60,
  },
  circle3: {
    position: 'absolute',
    width: 140, height: 140,
    borderRadius: '50%',
    background: 'rgba(167,243,208,0.5)',
    bottom: 180, left: 30,
  },

  leftContent: { position: 'relative', zIndex: 1, textAlign: 'center' },

  bigIcon: {
    width: 100, height: 100,
    borderRadius: 28,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 46,
    margin: '0 auto 1.6rem',
    boxShadow: '0 16px 40px rgba(16,185,129,0.35)',
  },

  leftTitle: {
    fontSize: '1.7rem',
    fontWeight: 800,
    color: '#064e3b',
    marginBottom: '0.6rem',
    lineHeight: 1.2,
  },
  leftSub: {
    fontSize: '0.95rem',
    color: '#047857',
    lineHeight: 1.6,
    maxWidth: 260,
    margin: '0 auto',
  },

  /* Feature badges */
  badgesWrap: { marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: 10 },
  badge: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 12,
    padding: '10px 16px',
    backdropFilter: 'blur(8px)',
  },
  badgeDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 6px #10b981',
    flexShrink: 0,
  },
  badgeText: { fontSize: '0.83rem', fontWeight: 600, color: '#065f46' },

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

  formBox: { width: '100%', maxWidth: 420 },

  /* Back button */
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
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  /* Form header */
  formHeader: { marginBottom: '2rem' },
  formTitle: { fontSize: '1.65rem', fontWeight: 900, color: '#111827', marginBottom: 4 },
  formSub:   { fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 },

  /* Divider */
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, #10b981 0%, #d1fae5 100%)',
    borderRadius: 2,
    marginBottom: '1.8rem',
  },

  /* Label */
  label: {
    fontSize: '0.85rem', fontWeight: 700,
    color: '#374151', marginBottom: 6, display: 'block',
  },

  /* Input wrapper */
  inputWrap: {
    position: 'relative',
    marginBottom: '1.3rem',
  },
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

  /* Submit button */
  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
    transition: 'all 0.3s ease',
    letterSpacing: '0.3px',
    marginTop: '0.5rem',
  },

  hint: {
    textAlign: 'center',
    marginTop: '1.2rem',
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontWeight: 500,
  },
};

/* ─── Component ─────────────────────────────────────────── */
const EvaluatorLogin = ({ onLogin, onBack }) => {
  const [formData, setFormData] = useState({ subjectId: '', name: '', password: '' });
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'subjectId') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      if (numbersOnly.length <= 5) setFormData({ ...formData, [name]: numbersOnly });
    } else {
      if (value.length <= 10) setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subjectId || !formData.name || !formData.password) {
      setError('Please fill in all fields'); return;
    }
    if (formData.subjectId.length !== 5) {
      setError('Subject ID must be exactly 5 numbers'); return;
    }
    if (formData.name.length < 3) {
      setError('Name must be at least 3 characters long'); return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long'); return;
    }
    console.log('Evaluator Login Attempt:', formData);
    if (formData.password === 'eval123') {
      setError('');
      onLogin && onLogin({ role: 'evaluator', subjectId: formData.subjectId, name: formData.name });
    } else {
      setError('Invalid credentials');
    }
  };

  const inputStyle = (field) => ({
    ...S.input,
    borderColor: focused === field ? '#10b981' : '#e5e7eb',
    boxShadow: focused === field ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
  });

  const badges = [
    'AI-Powered Subject Evaluation',
    'Real-time Answer Analysis',
    'Instant Score Reports',
  ];

  return (
    <div style={S.page}>

      {/* ── Left decorative panel (hidden on small screens via inline media) ── */}
      <div style={S.leftPanel} className="d-none d-lg-flex flex-column align-items-center justify-content-center">
        <div style={S.circle1}></div>
        <div style={S.circle2}></div>
        <div style={S.circle3}></div>

        <div style={S.leftContent}>
          <div style={S.bigIcon}>📝</div>
          <div style={S.leftTitle}>Evaluator Portal</div>
          <div style={S.leftSub}>
            Upload answer scripts and let AI handle intelligent, unbiased evaluation instantly.
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
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#059669'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; }}
          >
            ← Back to Home
          </button>

          {/* Header */}
          <div style={S.formHeader}>
            <div style={S.formTitle}>Welcome back 👋</div>
            <div style={S.formSub}>AI Evaluation System · Evaluator Access</div>
          </div>

          {/* Accent divider */}
          <div style={S.divider}></div>

          {/* Error */}
          {error && (
            <Alert variant="danger" className="mb-4" style={{ borderRadius: 12, fontSize: '0.88rem' }}>
              ⚠️ {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Subject ID */}
            <div>
              <label style={S.label}>Subject ID</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>🔖</span>
                <input
                  type="text"
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  placeholder="Enter 5-digit subject ID"
                  maxLength="5"
                  inputMode="numeric"
                  style={inputStyle('subjectId')}
                  onFocus={() => setFocused('subjectId')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={S.label}>Name</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>👤</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  maxLength="10"
                  style={inputStyle('name')}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.8rem' }}>
              <label style={S.label}>Password</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>🔒</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  maxLength="10"
                  style={inputStyle('password')}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={S.submitBtn}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(16,185,129,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.35)'; }}
            >
              Login as Evaluator →
            </button>
          </form>

          <div style={S.hint}>Subject Evaluator Access</div>
        </div>
      </div>
    </div>
  );
};

export default EvaluatorLogin;