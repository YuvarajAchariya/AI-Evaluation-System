import React, { useState, useEffect } from 'react';
import axios from 'axios';

/* ─── Style tokens ──────────────────────────────────────────────── */
const s = {
  wrapper: {
    padding: '28px',
    background: '#ffffff',
    minHeight: '100%',
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },

  /* Card */
  card: {
    background: '#ffffff',
    border: '1px solid #e8ecf0',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  },
  cardHeader: {
    background: 'linear-gradient(90deg,rgba(255,193,7,0.15),rgba(255,152,0,0.08))',
    borderBottom: '1px solid #f0e8d0',
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: 'linear-gradient(135deg,#ffc107,#ff8f00)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
    boxShadow: '0 4px 12px rgba(255,193,7,0.35)',
    flexShrink: 0,
  },
  headerTitle: {
    color: '#1e293b',
    fontWeight: 800,
    fontSize: '1.1rem',
    margin: 0,
  },
  cardBody: { padding: '24px' },

  /* Info banner */
  infoBanner: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 12,
    color: '#1d4ed8',
    padding: '12px 16px',
    fontSize: '0.88rem',
    fontWeight: 500,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  /* Table */
  tableWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #e8ecf0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  thead: {
    background: 'linear-gradient(90deg,#1e293b,#334155)',
  },
  th: {
    color: '#cbd5e1',
    fontWeight: 600,
    fontSize: '0.75rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    padding: '13px 16px',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '13px 16px',
    color: '#374151',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  },
  trEven: { background: '#f8fafc' },
  trOdd: { background: '#ffffff' },

  /* Badge */
  badge: {
    background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.3px',
  },

  /* Action button */
  btnReEval: {
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.8rem',
    padding: '7px 14px',
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(102,126,234,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    whiteSpace: 'nowrap',
  },

  /* Modal overlay */
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.50)',
    backdropFilter: 'blur(5px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    padding: 24,
  },
  modal: {
    background: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90vh',
    boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'modalIn 0.25s ease',
  },
  modalHeader: {
    background: 'linear-gradient(90deg,rgba(102,126,234,0.1),rgba(118,75,162,0.07))',
    borderBottom: '1px solid #e8ecf0',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  modalTitle: { color: '#1e293b', fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8, margin: 0 },
  btnClose: {
    background: '#f1f5f9', border: 'none', borderRadius: 8,
    width: 30, height: 30, cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#64748b',
  },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1 },

  /* Info row inside modal */
  infoRow: {
    background: '#f8fafc',
    border: '1px solid #e8ecf0',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 10,
    fontSize: '0.88rem',
    color: '#374151',
  },
  infoKey: { color: '#64748b', fontWeight: 700, marginRight: 8 },

  /* Section divider */
  sectionDivider: {
    borderTop: '1px dashed #e2e8f0',
    margin: '16px 0',
  },

  /* Scrollable read-only text block */
  textBlock: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: '0.87rem',
    color: '#374151',
    lineHeight: 1.6,
    maxHeight: 100,
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },

  fieldLabel: {
    color: '#64748b',
    fontWeight: 700,
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: 5,
    display: 'block',
  },

  label: {
    color: '#374151',
    fontWeight: 600,
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: 6,
    display: 'block',
  },
  input: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    color: '#1e293b',
    padding: '11px 14px',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  },
  inputFocus: {
    borderColor: '#667eea',
    boxShadow: '0 0 0 3px rgba(102,126,234,0.15)',
  },
  modalFooter: {
    background: '#f8fafc',
    borderTop: '1px solid #e8ecf0',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    flexShrink: 0,
  },
  btnCancel: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    color: '#64748b',
    fontWeight: 600,
    fontSize: '0.88rem',
    padding: '10px 20px',
    cursor: 'pointer',
  },
  btnSubmit: {
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.88rem',
    padding: '10px 22px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(102,126,234,0.4)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },

  /* success toast */
  toast: {
    position: 'fixed',
    bottom: 32,
    right: 32,
    background: 'linear-gradient(135deg,#22c55e,#16a34a)',
    color: '#fff',
    borderRadius: 12,
    padding: '14px 22px',
    fontWeight: 700,
    fontSize: '0.9rem',
    boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
    zIndex: 99999,
    animation: 'toastIn 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  emptyRow: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.9rem' },
};

/* ─── Component ─────────────────────────────────────────────────── */
const ReEvaluation = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reEvaluationData, setReEvaluationData] = useState({ newMarks: '', comments: '' });
  const [focused, setFocused] = useState({});
  const [btnHovers, setBtnHovers] = useState({});
  const [toast, setToast] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  /* ── Fetch pending requests ── */
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/reevaluations/pending`);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch re-evaluation requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  /* ── Open modal ── */
  const handleReEvaluate = (request) => {
    setSelectedRequest(request);
    setReEvaluationData({ newMarks: request.originalMarks ?? '', comments: '' });
    setShowModal(true);
  };

  /* ── Submit review ── */
  const handleSubmitReEvaluation = async () => {
    if (reEvaluationData.newMarks === '' || reEvaluationData.newMarks === null) {
      alert('Please enter new marks before submitting.');
      return;
    }
    if (!reEvaluationData.comments.trim()) {
      alert('Please add evaluator comments before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/reevaluations/review/${selectedRequest._id}`, {
        newMarks: Number(reEvaluationData.newMarks),
        comments: reEvaluationData.comments,
        decision: 'approved',
      });
      // Remove from local list
      setRequests(prev => prev.filter(r => r._id !== selectedRequest._id));
      setShowModal(false);
      showToast('✅ Re-evaluation submitted & results updated!');
    } catch (err) {
      console.error('Error submitting re-evaluation:', err);
      alert('Error updating request: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Toast helper ── */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const hov = (k, v) => setBtnHovers(h => ({ ...h, [k]: v }));
  const foc = (k, v) => setFocused(f => ({ ...f, [k]: v }));
  const inp = (k) => ({ ...s.input, ...(focused[k] ? s.inputFocus : {}) });

  /* ── Format date ── */
  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }); }
    catch { return d; }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes modalIn  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── Toast notification ── */}
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.wrapper}>
        <div style={s.card}>
          {/* Header */}
          <div style={s.cardHeader}>
            <div style={s.headerIcon}>🔄</div>
            <h4 style={s.headerTitle}>Re-evaluation Requests</h4>
          </div>

          <div style={s.cardBody}>
            {/* Info banner */}
            <div style={s.infoBanner}>
              ℹ️ Review student re-evaluation requests, update marks, add feedback — changes are saved back to evaluation results.
            </div>

            {/* Table */}
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead style={s.thead}>
                  <tr>
                    {['Student ID', 'Student Name', 'Question', 'Original Marks', 'Expected', 'Max Marks', 'Requested On', 'Status', 'Action'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={{ ...s.emptyRow, color: '#0ea5e9' }}>⏳ Loading requests…</td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan={9} style={s.emptyRow}>📭 No pending re-evaluation requests.</td></tr>
                  ) : (
                    requests.map((req, i) => (
                      <tr key={req._id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                        <td style={s.td}>{req.studentId || '—'}</td>
                        <td style={s.td}><strong>{req.studentName || '—'}</strong></td>
                        <td style={{ ...s.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {req.questionText || '—'}
                        </td>
                        <td style={s.td}><strong style={{ color: '#1e293b' }}>{req.originalMarks ?? '—'}</strong></td>
                        <td style={s.td}>{req.expectedMarks ?? '—'}</td>
                        <td style={s.td}>{req.maxMarks ?? '—'}</td>
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{fmtDate(req.requestDate)}</td>
                        <td style={s.td}><span style={s.badge}>Needs Review</span></td>
                        <td style={s.td}>
                          <button
                            style={{
                              ...s.btnReEval,
                              ...(btnHovers[req._id] ? { transform: 'translateY(-1px)', boxShadow: '0 6px 16px rgba(102,126,234,0.45)' } : {}),
                            }}
                            onClick={() => handleReEvaluate(req)}
                            onMouseEnter={() => hov(req._id, true)}
                            onMouseLeave={() => hov(req._id, false)}
                          >
                            Re-evaluate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={s.modalHeader}>
              <h5 style={s.modalTitle}>✏️ Re-evaluate Answer</h5>
              <button style={s.btnClose} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Modal body */}
            <div style={s.modalBody}>
              {selectedRequest && (
                <>
                  {/* Student & question info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={s.infoRow}>
                      <span style={s.infoKey}>Student:</span>{selectedRequest.studentName}
                    </div>
                    <div style={s.infoRow}>
                      <span style={s.infoKey}>Student ID:</span>{selectedRequest.studentId}
                    </div>
                    <div style={s.infoRow}>
                      <span style={s.infoKey}>Original Marks:</span>
                      <strong style={{ color: '#dc2626' }}>{selectedRequest.originalMarks}</strong>
                      &nbsp;/ {selectedRequest.maxMarks}
                    </div>
                    <div style={s.infoRow}>
                      <span style={s.infoKey}>Expected by Student:</span>
                      <strong style={{ color: '#0369a1' }}>{selectedRequest.expectedMarks}</strong>
                    </div>
                  </div>

                  {/* Question */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={s.fieldLabel}>❓ Question</span>
                    <div style={s.textBlock}>{selectedRequest.questionText || '—'}</div>
                  </div>

                  {/* Student Answer */}
                  {selectedRequest.studentAnswer && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={s.fieldLabel}>✍️ Student's Answer</span>
                      <div style={{ ...s.textBlock, maxHeight: 120 }}>{selectedRequest.studentAnswer}</div>
                    </div>
                  )}

                  {/* AI Feedback */}
                  {(selectedRequest.aiFeedback || selectedRequest.detailedFeedback) && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={s.fieldLabel}>🤖 AI Feedback</span>
                      <div style={{ ...s.textBlock, borderColor: '#bae6fd', background: '#f0f9ff' }}>
                        {selectedRequest.aiFeedback || selectedRequest.detailedFeedback}
                      </div>
                    </div>
                  )}

                  {/* Student's reason */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={s.fieldLabel}>📝 Student's Reason for Re-evaluation</span>
                    <div style={{ ...s.textBlock, borderColor: '#fde68a', background: '#fffbeb' }}>
                      {selectedRequest.reason || '—'}
                    </div>
                  </div>

                  {selectedRequest.additionalExplanation && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={s.fieldLabel}>💬 Additional Explanation</span>
                      <div style={s.textBlock}>{selectedRequest.additionalExplanation}</div>
                    </div>
                  )}

                  <div style={s.sectionDivider} />

                  {/* New marks input */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={s.label}>New Marks (0 – {selectedRequest.maxMarks})</label>
                    <input
                      type="number"
                      min="0"
                      max={selectedRequest.maxMarks}
                      value={reEvaluationData.newMarks}
                      onChange={e => setReEvaluationData({ ...reEvaluationData, newMarks: e.target.value })}
                      onFocus={() => foc('marks', true)}
                      onBlur={() => foc('marks', false)}
                      style={inp('marks')}
                    />
                  </div>

                  {/* Evaluator comments */}
                  <div>
                    <label style={s.label}>Evaluator Feedback / Comments *</label>
                    <textarea
                      rows={3}
                      placeholder="Provide detailed feedback on why marks are being updated…"
                      value={reEvaluationData.comments}
                      onChange={e => setReEvaluationData({ ...reEvaluationData, comments: e.target.value })}
                      onFocus={() => foc('comments', true)}
                      onBlur={() => foc('comments', false)}
                      style={{ ...inp('comments'), resize: 'vertical', minHeight: 90 }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div style={s.modalFooter}>
              <button style={s.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              <button
                disabled={submitting}
                style={{
                  ...s.btnSubmit,
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  ...(btnHovers.submit && !submitting ? { transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(102,126,234,0.5)' } : {}),
                }}
                onClick={handleSubmitReEvaluation}
                onMouseEnter={() => hov('submit', true)}
                onMouseLeave={() => hov('submit', false)}
              >
                {submitting ? '⏳ Saving…' : '✅ Submit Re-evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReEvaluation;
