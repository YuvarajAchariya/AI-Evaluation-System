import React, { useState, lazy, Suspense } from 'react';
import { Container, Row, Col, Spinner, Modal } from 'react-bootstrap';

// Use lazy loading to avoid circular dependencies
const UploadAnswerSchema = lazy(() => import('./UploadAns'));
const ReEvaluation      = lazy(() => import('./ReEvaluation'));
const ViewResults       = lazy(() => import('./ViewResults'));
const FeedbackView      = lazy(() => import('./FeedbackView'));

/* ─── Loading fallback ──────────────────────────────────────────── */
const LoadingFallback = () => (
  <div style={s.fallback}>
    <Spinner animation="border" role="status" style={{ color: '#ffc107', width: 40, height: 40 }}>
      <span className="visually-hidden">Loading...</span>
    </Spinner>
    <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 12, fontSize: '0.9rem' }}>
      Loading component...
    </p>
  </div>
);

/* ─── Style tokens ──────────────────────────────────────────────── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#f4f6fb',
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },

  /* Header */
  header: {
    background: '#ffffff',
    borderBottom: '1px solid #e8ecf0',
    padding: '18px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  headerLeft: {},
  headerTitle: {
    fontSize: '1.55rem',
    fontWeight: 800,
    background: 'linear-gradient(90deg,#11998e,#0d7a6e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    lineHeight: 1.2,
  },
  headerSub: {
    color: '#7a8693',
    fontSize: '0.82rem',
    marginTop: 3,
  },
  headerBtns: { display: 'flex', gap: 10, alignItems: 'center' },

  /* Buttons */
  btnGreen: {
    background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    border: 'none',
    borderRadius: 12,
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.88rem',
    padding: '10px 20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 4px 18px rgba(59,130,246,0.35)',
    transition: 'transform 0.18s, box-shadow 0.18s',
  },
  btnLogout: {
    background: 'rgba(255,59,59,0.15)',
    border: '1px solid rgba(255,59,59,0.4)',
    borderRadius: 12,
    color: '#ff6b6b',
    fontWeight: 600,
    fontSize: '0.88rem',
    padding: '10px 20px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },

  /* Body */
  body: { padding: '28px 32px 48px' },

  /* Sidebar */
  sidebar: {
    background: '#ffffff',
    border: '1px solid #e8ecf0',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
    marginBottom: 20,
  },
  sidebarHeader: {
    background: 'linear-gradient(90deg,rgba(102,126,234,0.1),rgba(118,75,162,0.07))',
    borderBottom: '1px solid #e8ecf0',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  sidebarHeaderIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16,
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
  },
  sidebarTitle: { color: '#1e293b', fontWeight: 700, fontSize: '0.95rem' },

  /* Nav tabs */
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f3f7',
    background: active ? '#f0fdf9' : 'transparent',
    borderLeft: active ? '3px solid #11998e' : '3px solid transparent',
    color: active ? '#11998e' : '#64748b',
    fontWeight: active ? 700 : 500,
    fontSize: '0.88rem',
    transition: 'all 0.2s',
    userSelect: 'none',
  }),
  navIcon: (active) => ({
    width: 32, height: 32, borderRadius: 8,
    background: active ? 'rgba(17,153,142,0.12)' : '#f1f5f9',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14,
    transition: 'background 0.2s',
  }),

  /* Quick actions card */
  quickCard: {
    background: '#ffffff',
    border: '1px solid #e8ecf0',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  },
  quickHeader: {
    background: 'linear-gradient(90deg,rgba(255,193,7,0.1),rgba(255,152,0,0.07))',
    borderBottom: '1px solid #f0f3f7',
    padding: '14px 20px',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  quickHeaderIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg,#ffc107,#ff8f00)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
    boxShadow: '0 4px 10px rgba(255,193,7,0.35)',
  },
  quickBody: { padding: '18px 20px' },
  quickNote: { color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.55, marginTop: 10 },

  /* Content area */
  content: {
    background: '#ffffff',
    border: '1px solid #e8ecf0',
    borderRadius: 16,
    minHeight: 400,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  },

  /* Fallback */
  fallback: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, background: '#ffffff' },

  /* Modal */
  modal: {
    background: 'rgba(15,12,41,0.97)',
    backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    color: '#fff',
  },
  modalHeader: {
    background: 'linear-gradient(90deg,rgba(102,126,234,0.2),rgba(118,75,162,0.14))',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '20px 28px',
  },
  modalTitle: { color: '#fff', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 },
  modalBody: { padding: '28px', background: 'transparent' },
  modalFooter: { borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 28px', background: 'transparent' },

  /* Stat cards inside modal */
  statCard: (accent) => ({
    background: `rgba(${accent},0.08)`,
    border: `1px solid rgba(${accent},0.2)`,
    borderRadius: 14,
    padding: '20px',
    textAlign: 'center',
  }),
  statNum: (color) => ({ fontSize: '1.9rem', fontWeight: 800, color, margin: 0, lineHeight: 1 }),
  statLabel: { color: '#64748b', fontSize: '0.8rem', marginTop: 6 },

  /* Alerts */
  alertSuccess: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 14,
    color: '#15803d',
    padding: '16px 20px',
    marginBottom: 20,
  },
  alertError: {
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: 14,
    color: '#be123c',
    padding: '16px 20px',
  },
  alertHeading: { fontWeight: 700, fontSize: '1rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 },
  alertBody: { fontSize: '0.88rem', opacity: 0.85, margin: 0 },

  // Detailed result row
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f1f5f9',
    padding: '7px 0',
    fontSize: '0.85rem',
    color: '#475569',
  },
  resultScore: { fontWeight: 700, color: '#11998e' },
};

/* ─── Nav config ────────────────────────────────────────────────── */
const navItems = [
  { key: 'upload',    icon: '📤', label: 'Upload Answer Schema' },
  { key: 're-evaluate', icon: '🔄', label: 'Re-evaluation' },
  { key: 'results',   icon: '📊', label: 'View Results' },
  { key: 'feedback',  icon: '🧠', label: 'Feedback Memory' },
];

/* ─── Component ─────────────────────────────────────────────────── */
const EvaluatorHome = ({ user, onLogout }) => {
  const [activeTab, setActiveTab]                   = useState('upload');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationStatus, setEvaluationStatus]     = useState(null);
  const [evaluationMessage, setEvaluationMessage]   = useState('');
  const [evaluationResults, setEvaluationResults]   = useState(null);
  const [btnHover, setBtnHover]                     = useState({});

  const hov = (key, val) => setBtnHover(h => ({ ...h, [key]: val }));

  const triggerEvaluation = async () => {
    setShowEvaluationModal(true);
    setEvaluationStatus('loading');
    setEvaluationMessage('Starting AI evaluation process...');
    setEvaluationResults(null);

    try {
      const response = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: user.subjectId, evaluatorName: user.name }),
      });
      const data = await response.json();
      if (response.ok) {
        setEvaluationStatus('success');
        setEvaluationMessage(data.message || 'Evaluation completed successfully!');
        setEvaluationResults(data.results);
      } else {
        setEvaluationStatus('error');
        setEvaluationMessage(data.error || 'Evaluation failed. Please try again.');
      }
    } catch (error) {
      setEvaluationStatus('error');
      setEvaluationMessage('Failed to connect to evaluation service. Please ensure the backend server is running.');
      console.error('Evaluation error:', error);
    }
  };

  const closeModal = () => {
    setShowEvaluationModal(false);
    setEvaluationStatus(null);
    setEvaluationMessage('');
    setEvaluationResults(null);
  };

  const renderContent = () => {
    const props = { user, subjectId: user.subjectId };
    const map = {
      'upload':      <UploadAnswerSchema {...props} />,
      're-evaluate': <ReEvaluation      {...props} />,
      'results':     <ViewResults       {...props} />,
      'feedback':    <FeedbackView      {...props} />,
    };
    return (
      <Suspense fallback={<LoadingFallback />}>
        {map[activeTab] || map['upload']}
      </Suspense>
    );
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .ev-modal .modal-content { background: #ffffff !important; border: 1px solid #e8ecf0 !important; border-radius: 20px !important; color: #1e293b; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
        .ev-modal .modal-header { background: linear-gradient(90deg,rgba(102,126,234,0.08),rgba(118,75,162,0.05)); border-bottom: 1px solid #e8ecf0 !important; border-radius: 20px 20px 0 0 !important; padding: 20px 28px; }
        .ev-modal .modal-title { color: #1e293b; font-weight: 800; }
        .ev-modal .modal-body  { padding: 28px; }
        .ev-modal .modal-footer{ border-top: 1px solid #e8ecf0 !important; padding: 16px 28px; background: #f8fafc; border-radius: 0 0 20px 20px; }
      `}</style>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <h2 style={s.headerTitle}>AI Evaluation System</h2>
          <div style={s.headerSub}>
            Welcome, <strong style={{ color: '#1e293b' }}>{user.name}</strong>
            &nbsp;·&nbsp;Subject: <strong style={{ color: '#11998e' }}>{user.subjectId}</strong>
          </div>
        </div>
        <div style={s.headerBtns}>
          <button
            style={{
              ...s.btnGreen,
              ...(btnHover.hdrRun ? { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(59,130,246,0.5)' } : {}),
              opacity: evaluationStatus === 'loading' ? 0.6 : 1,
            }}
            onClick={triggerEvaluation}
            disabled={evaluationStatus === 'loading'}
            onMouseEnter={() => hov('hdrRun', true)}
            onMouseLeave={() => hov('hdrRun', false)}
          >
            🤖 {evaluationStatus === 'loading' ? 'Evaluating...' : 'Run AI Evaluation'}
          </button>
          <button
            style={{
              ...s.btnLogout,
              ...(btnHover.logout ? { background: 'rgba(255,59,59,0.28)' } : {}),
            }}
            onClick={onLogout}
            onMouseEnter={() => hov('logout', true)}
            onMouseLeave={() => hov('logout', false)}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={s.body}>
        <Row className="g-4">
          {/* Sidebar */}
          <Col md={3}>
            {/* Nav card */}
            <div style={s.sidebar}>
              <div style={s.sidebarHeader}>
                <div style={s.sidebarHeaderIcon}>📋</div>
                <span style={s.sidebarTitle}>Evaluation Dashboard</span>
              </div>
              {navItems.map((item) => (
                <div
                  key={item.key}
                  style={s.navItem(activeTab === item.key)}
                  onClick={() => setActiveTab(item.key)}
                >
                  <div style={s.navIcon(activeTab === item.key)}>{item.icon}</div>
                  {item.label}
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={s.quickCard}>
              <div style={s.quickHeader}>
                <div style={s.quickHeaderIcon}>⚡</div>
                <span style={{ ...s.sidebarTitle, fontSize: '0.88rem' }}>Quick Actions</span>
              </div>
              <div style={s.quickBody}>
                <button
                  style={{
                    ...s.btnGreen,
                    width: '100%',
                    justifyContent: 'center',
                    ...(btnHover.sideRun ? { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(59,130,246,0.5)' } : {}),
                    opacity: evaluationStatus === 'loading' ? 0.6 : 1,
                  }}
                  onClick={triggerEvaluation}
                  disabled={evaluationStatus === 'loading'}
                  onMouseEnter={() => hov('sideRun', true)}
                  onMouseLeave={() => hov('sideRun', false)}
                >
                  🤖 {evaluationStatus === 'loading' ? 'Processing...' : 'Run AI Evaluation'}
                </button>
                <p style={s.quickNote}>
                  Run the AI evaluation process to evaluate all uploaded answer sheets against reference answers.
                </p>
              </div>
            </div>
          </Col>

          {/* Main content */}
          <Col md={9}>
            <div style={s.content}>
              {renderContent()}
            </div>
          </Col>
        </Row>
      </div>

      {/* ── Evaluation Modal ── */}
      <Modal
        show={showEvaluationModal}
        onHide={closeModal}
        centered
        size="lg"
        dialogClassName="ev-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            🤖 AI Evaluation Process
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Loading */}
          {evaluationStatus === 'loading' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Spinner animation="border" style={{ color: '#667eea', width: 50, height: 50 }} />
              <h5 style={{ color: '#1e293b', marginTop: 18, fontWeight: 700 }}>Evaluating Answers...</h5>
              <p style={{ color: '#64748b', marginBottom: 6 }}>{evaluationMessage}</p>
              <small style={{ color: '#94a3b8' }}>
                This may take a few moments depending on the number of answers to evaluate...
              </small>
            </div>
          )}

          {/* Success */}
          {evaluationStatus === 'success' && (
            <div>
              <div style={s.alertSuccess}>
                <div style={s.alertHeading}>✅ Evaluation Complete!</div>
                <p style={s.alertBody}>{evaluationMessage}</p>
              </div>

              {evaluationResults && (
                <>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 12 }}>
                    Evaluation Summary:
                  </p>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <div style={s.statCard('102,126,234')}>
                        <h4 style={s.statNum('#a78bfa')}>{evaluationResults.totalEvaluated}</h4>
                        <div style={s.statLabel}>Questions Evaluated</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={s.statCard('56,239,125')}>
                        <h4 style={s.statNum('#38ef7d')}>{evaluationResults.overallPercentage}%</h4>
                        <div style={s.statLabel}>Overall Score</div>
                      </div>
                    </Col>
                  </Row>

                  {evaluationResults.detailedResults?.length > 0 && (
                    <>
                      <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 8 }}>
                        Detailed Results:
                      </p>
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e8ecf0',
                        borderRadius: 12,
                        padding: '4px 14px',
                        maxHeight: 220,
                        overflowY: 'auto',
                      }}>
                        {evaluationResults.detailedResults.map((result, index) => (
                          <div key={index} style={s.resultRow}>
                            <span>{result.questionId}</span>
                            <span style={s.resultScore}>{result.marksAwarded}/{result.maxMarks}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Error */}
          {evaluationStatus === 'error' && (
            <div style={s.alertError}>
              <div style={s.alertHeading}>⚠️ Evaluation Failed</div>
              <p style={s.alertBody}>{evaluationMessage}</p>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          {evaluationStatus !== 'loading' && (
            <button
              style={{
                ...s.btnGreen,
                ...(btnHover.modalClose ? { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(59,130,246,0.5)' } : {}),
              }}
              onClick={closeModal}
              onMouseEnter={() => hov('modalClose', true)}
              onMouseLeave={() => hov('modalClose', false)}
            >
              Close
            </button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EvaluatorHome;