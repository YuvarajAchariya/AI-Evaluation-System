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

  /* Left decorative panel */
  leftPanel: {
    width: '42%',
    background: 'linear-gradient(145deg, #eef2ff 0%, #e0e7ff 40%, #c7d2fe 100%)',
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
    background: 'rgba(99,102,241,0.12)',
    top: -80, left: -80,
  },
  circle2: {
    position: 'absolute',
    width: 220, height: 220,
    borderRadius: '50%',
    background: 'rgba(79,70,229,0.10)',
    bottom: 20, right: -60,
  },
  circle3: {
    position: 'absolute',
    width: 140, height: 140,
    borderRadius: '50%',
    background: 'rgba(165,180,252,0.5)',
    bottom: 180, left: 30,
  },

  leftContent: { position: 'relative', zIndex: 1, textAlign: 'center' },

  bigIcon: {
    width: 100, height: 100,
    borderRadius: 28,
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 46,
    margin: '0 auto 1.6rem',
    boxShadow: '0 16px 40px rgba(99,102,241,0.35)',
  },

  leftTitle: {
    fontSize: '1.7rem',
    fontWeight: 800,
    color: '#1e1b4b',
    marginBottom: '0.6rem',
    lineHeight: 1.2,
  },
  leftSub: {
    fontSize: '0.95rem',
    color: '#4338ca',
    lineHeight: 1.6,
    maxWidth: 260,
    margin: '0 auto',
  },

  badgesWrap: { marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: 10 },
  badge: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.65)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 12,
    padding: '10px 16px',
    backdropFilter: 'blur(8px)',
  },
  badgeDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    background: '#6366f1',
    boxShadow: '0 0 6px #6366f1',
    flexShrink: 0,
  },
  badgeText: { fontSize: '0.83rem', fontWeight: 600, color: '#3730a3' },

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
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  formHeader: { marginBottom: '2rem' },
  formTitle: { fontSize: '1.65rem', fontWeight: 900, color: '#111827', marginBottom: 4 },
  formSub: { fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 },

  divider: {
    height: 1,
    background: 'linear-gradient(90deg, #6366f1 0%, #e0e7ff 100%)',
    borderRadius: 2,
    marginBottom: '1.8rem',
  },

  label: {
    fontSize: '0.85rem', fontWeight: 700,
    color: '#374151', marginBottom: 6, display: 'block',
  },

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

  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
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
const AdminLogin = ({ onLogin, onBack }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value.length <= 10) setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields'); return;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long'); return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long'); return;
    }

    const defaultAdmins = [
      { username: 'admin', password: 'admin123' },
      { username: 'superadmin', password: 'super123' },
      { username: 'administrator', password: 'admin@2024' },
    ];

    const isValidAdmin = defaultAdmins.find(
      (a) => a.username === formData.username && a.password === formData.password
    );

    if (isValidAdmin) {
      setError('');
      onLogin({
        role: 'admin',
        username: formData.username,
        id: `admin_${formData.username}`,
        loginTime: new Date().toISOString(),
        displayName: formData.username.charAt(0).toUpperCase() + formData.username.slice(1),
      });
    } else {
      setError('Invalid username or password');
    }
  };

  const inputStyle = (field) => ({
    ...S.input,
    borderColor: focused === field ? '#6366f1' : '#e5e7eb',
    boxShadow: focused === field ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
  });

  const badges = [
    'Full System Administration',
    'User & Role Management',
    'AI Evaluation Oversight',
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
          <div style={S.bigIcon}>🛡️</div>
          <div style={S.leftTitle}>Admin Portal</div>
          <div style={S.leftSub}>
            Secure access to full system control — manage users, rubrics, and AI evaluations.
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
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#4f46e5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; }}
          >
            ← Back to Home
          </button>

          {/* Header */}
          <div style={S.formHeader}>
            <div style={S.formTitle}>Welcome, Admin 🛡️</div>
            <div style={S.formSub}>AI Evaluation System · Admin Portal</div>
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
            {/* Username */}
            <div>
              <label style={S.label}>Username</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>👤</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter admin username"
                  maxLength="10"
                  style={inputStyle('username')}
                  onFocus={() => setFocused('username')}
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
                  placeholder="Enter admin password"
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
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.35)'; }}
            >
              Authenticate →
            </button>
          </form>

          <div style={S.hint}>Restricted to authorised administrators only</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;