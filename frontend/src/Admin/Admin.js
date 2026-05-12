import React from 'react';
import AdminDashboard from './AdminDashboard';

/* ─── Shared styles ─────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    padding: '2rem',
  },
  card: {
    background: '#ffffff',
    border: '1.5px solid #f3f4f6',
    borderRadius: 24,
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    padding: '3rem 2.5rem',
    textAlign: 'center',
    maxWidth: 460,
    width: '100%',
  },
  iconWrap: (color) => ({
    width: 72, height: 72,
    borderRadius: 20,
    background: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34,
    margin: '0 auto 1.4rem',
    boxShadow: `0 10px 30px ${color}55`,
  }),
  heading: {
    fontSize: '1.55rem', fontWeight: 900,
    color: '#111827', marginBottom: 8,
  },
  sub: {
    fontSize: '0.93rem', color: '#6b7280',
    lineHeight: 1.65, marginBottom: '1.8rem',
  },
  btn: (bg, border, text) => ({
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '11px 28px',
    borderRadius: 12,
    border: `1.5px solid ${border}`,
    background: bg,
    color: text,
    fontSize: '0.92rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.25s ease',
  }),
};

/* ─── Reusable error card ───────────────────────────────── */
function ErrorCard({ icon, iconBg, title, subtitle, message, onLogout, btnLabel }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.iconWrap(iconBg)}>{icon}</div>
        <div style={S.heading}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
            {subtitle}
          </div>
        )}
        <div style={S.sub}>{message}</div>
        <button
          style={S.btn(
            hovered ? '#fee2e2' : '#fff',
            '#fca5a5',
            '#dc2626'
          )}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onLogout}
        >
          ← {btnLabel}
        </button>
      </div>
    </div>
  );
}

/* ─── Admin ─────────────────────────────────────────────── */
const Admin = ({ user, onLogout }) => {
  if (!user) {
    return (
      <ErrorCard
        icon="🔍"
        iconBg="linear-gradient(135deg, #fca5a5, #ef4444)"
        title="User Not Found"
        message="Unable to load user information. Please try logging in again."
        onLogout={onLogout}
        btnLabel="Return to Login"
      />
    );
  }

  if (user.role !== 'admin') {
    return (
      <ErrorCard
        icon="🚫"
        iconBg="linear-gradient(135deg, #fbbf24, #f59e0b)"
        title="Access Denied"
        subtitle="Insufficient Permissions"
        message="You don't have admin privileges to access this section."
        onLogout={onLogout}
        btnLabel="Return to Login"
      />
    );
  }

  /* ── Active admin banner + dashboard ── */
  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* Admin mode banner */}
      <div style={{
        background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '10px 16px',
        fontSize: '0.88rem',
        fontWeight: 700,
        letterSpacing: '0.3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: '1rem' }}>🛡️</span>
        <strong>Admin Mode Active</strong>
        <span style={{ opacity: 0.85, fontWeight: 400 }}>— You have full system access</span>
      </div>

      <AdminDashboard user={user} onLogout={onLogout} />
    </div>
  );
};

export default Admin;