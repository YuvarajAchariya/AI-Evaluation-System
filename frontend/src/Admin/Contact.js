import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

/* ─── Inline style tokens ─────────────────────────────────────────── */
const styles = {
  wrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    padding: '48px 0 64px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  pageTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#fff',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  pageSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    marginBottom: '32px',
    fontSize: '0.95rem',
  },

  /* ── Form card ── */
  formCard: {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
  },
  formCardHeader: {
    background: 'linear-gradient(90deg, rgba(255,193,7,0.18) 0%, rgba(255,152,0,0.12) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #ffc107, #ff8f00)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    boxShadow: '0 4px 12px rgba(255,193,7,0.4)',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 700,
    fontSize: '1.05rem',
    margin: 0,
  },
  formBody: {
    padding: '32px 28px',
  },

  /* ── Form controls ── */
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: 600,
    fontSize: '0.83rem',
    marginBottom: '6px',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    display: 'block',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: '12px',
    color: '#fff',
    padding: '12px 16px',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: '12px',
    color: '#fff',
    padding: '12px 16px',
    fontSize: '0.95rem',
    outline: 'none',
    resize: 'vertical',
    minHeight: '140px',
    transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },

  /* ── Submit button ── */
  submitBtn: {
    background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#1a1a2e',
    fontWeight: 800,
    fontSize: '1rem',
    padding: '14px 36px',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    boxShadow: '0 6px 24px rgba(255,193,7,0.45)',
    transition: 'transform 0.18s, box-shadow 0.18s, opacity 0.18s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },

  /* ── Success alert ── */
  alert: {
    background: 'rgba(40,199,111,0.15)',
    border: '1px solid rgba(40,199,111,0.35)',
    borderRadius: '12px',
    color: '#6fffb0',
    padding: '14px 20px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.93rem',
    fontWeight: 500,
    animation: 'fadeInDown 0.4s ease',
  },

  /* ── Info card ── */
  infoCard: {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
    height: '100%',
  },
  infoCardHeader: {
    background: 'linear-gradient(90deg, rgba(102,126,234,0.25) 0%, rgba(118,75,162,0.18) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  infoHeaderIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
  },
  infoBody: {
    padding: '28px 24px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '24px',
    padding: '16px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.07)',
    transition: 'background 0.2s',
  },
  infoIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '4px',
  },
  infoValue: {
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
};

/* ─── Focus hover helper (used via onFocus/onBlur) ─────────────────── */
const focusStyle = {
  borderColor: 'rgba(255,193,7,0.7)',
  boxShadow: '0 0 0 3px rgba(255,193,7,0.15)',
  background: 'rgba(255,255,255,0.10)',
};

/* ─── Info items data ────────────────────────────────────────────── */
const infoItems = [
  {
    icon: '✉️',
    bg: 'linear-gradient(135deg, #667eea, #764ba2)',
    label: 'Email',
    value: 'support@aievaluation.com',
  },
  {
    icon: '📞',
    bg: 'linear-gradient(135deg, #11998e, #38ef7d)',
    label: 'Phone',
    value: '+1 (555) 123-4567',
  },
  {
    icon: '🕐',
    bg: 'linear-gradient(135deg, #f093fb, #f5576c)',
    label: 'Office Hours',
    value: 'Monday – Friday: 9:00 AM – 5:00 PM',
  },
  {
    icon: '🚨',
    bg: 'linear-gradient(135deg, #ffc107, #ff8f00)',
    label: 'Emergency Support',
    value: '24/7 for critical system issues',
  },
];

/* ─── Component ─────────────────────────────────────────────────── */
const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState({});
  const [btnHover, setBtnHover] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFocus = (name) => setFocused((f) => ({ ...f, [name]: true }));
  const handleBlur  = (name) => setFocused((f) => ({ ...f, [name]: false }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const fieldStyle = (name, base) => ({
    ...base,
    ...(focused[name] ? focusStyle : {}),
  });

  return (
    <div style={styles.wrapper}>
      {/* Global keyframes injected once */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px rgba(48,43,99,0.9) inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>

      <Container>
        {/* Page heading */}
        <h2 style={styles.pageTitle}>Contact Support</h2>
        <p style={styles.pageSubtitle}>We're here to help — reach out anytime.</p>

        {/* Success alert */}
        {submitted && (
          <div style={styles.alert}>
            <span>✅</span>
            Thank you for your message! We'll get back to you soon.
          </div>
        )}

        <Row className="g-4">
          {/* ── Left: form ── */}
          <Col md={8}>
            <div style={styles.formCard}>
              <div style={styles.formCardHeader}>
                <div style={styles.headerIcon}>✉️</div>
                <h5 style={styles.headerTitle}>Send us a Message</h5>
              </div>

              <div style={styles.formBody}>
                <form onSubmit={handleSubmit}>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <label style={styles.label}>Your Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={() => handleFocus('name')}
                        onBlur={() => handleBlur('name')}
                        placeholder="Enter your name"
                        required
                        style={fieldStyle('name', styles.input)}
                      />
                    </Col>
                    <Col md={6}>
                      <label style={styles.label}>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => handleFocus('email')}
                        onBlur={() => handleBlur('email')}
                        placeholder="Enter your email"
                        required
                        style={fieldStyle('email', styles.input)}
                      />
                    </Col>
                  </Row>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={styles.label}>Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onFocus={() => handleFocus('subject')}
                      onBlur={() => handleBlur('subject')}
                      placeholder="Enter subject"
                      required
                      style={fieldStyle('subject', styles.input)}
                    />
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <label style={styles.label}>Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onFocus={() => handleFocus('message')}
                      onBlur={() => handleBlur('message')}
                      placeholder="Enter your message"
                      required
                      style={fieldStyle('message', styles.textarea)}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      ...styles.submitBtn,
                      ...(btnHover
                        ? { transform: 'translateY(-2px)', boxShadow: '0 10px 30px rgba(255,193,7,0.55)', opacity: 0.93 }
                        : {}),
                    }}
                    onMouseEnter={() => setBtnHover(true)}
                    onMouseLeave={() => setBtnHover(false)}
                  >
                    <span>🚀</span> Send Message
                  </button>
                </form>
              </div>
            </div>
          </Col>

          {/* ── Right: info ── */}
          <Col md={4}>
            <div style={styles.infoCard}>
              <div style={styles.infoCardHeader}>
                <div style={styles.infoHeaderIcon}>📋</div>
                <h5 style={styles.headerTitle}>Contact Information</h5>
              </div>

              <div style={styles.infoBody}>
                {infoItems.map((item) => (
                  <div key={item.label} style={styles.infoItem}>
                    <div style={{ ...styles.infoIconBox, background: item.bg }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={styles.infoLabel}>{item.label}</div>
                      <div style={styles.infoValue}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Contact;