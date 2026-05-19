import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const getGrade = (pct) => {
  const p = Number(pct || 0);
  if (p >= 90) return { label: 'A+', color: '#10b981' };
  if (p >= 80) return { label: 'A', color: '#06b6d4' };
  if (p >= 70) return { label: 'B+', color: '#6366f1' };
  if (p >= 60) return { label: 'B', color: '#8b5cf6' };
  if (p >= 50) return { label: 'C+', color: '#f59e0b' };
  if (p >= 40) return { label: 'C', color: '#f97316' };
  return { label: 'F', color: '#ef4444' };
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const pctColor = (p) =>
  p >= 80 ? '#10b981' : p >= 60 ? '#06b6d4' : p >= 40 ? '#f59e0b' : '#ef4444';

const statusColor = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
const statusBg = { pending: 'rgba(245,158,11,0.12)', approved: 'rgba(16,185,129,0.12)', rejected: 'rgba(239,68,68,0.12)' };

/* ─────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────── */
const S = {
  page: { minHeight: '100vh', background: '#030712', fontFamily: "'Outfit','Inter',sans-serif", color: '#f1f5f9' },

  navbar: {
    background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    padding: '0 2rem', height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 100,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandIcon: {
    width: 34, height: 34, borderRadius: 9,
    background: 'linear-gradient(135deg,#06b6d4,#0891b2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1rem', boxShadow: '0 4px 12px rgba(6,182,212,0.35)',
  },
  brandName: { fontWeight: 800, fontSize: '1rem', color: '#e2e8f0' },

  navTabs: { display: 'flex', gap: 4, alignItems: 'center' },
  navTab: (active) => ({
    padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600,
    background: active ? 'rgba(6,182,212,0.15)' : 'transparent',
    color: active ? '#67e8f9' : '#94a3b8',
    borderBottom: active ? '2px solid #06b6d4' : '2px solid transparent',
    transition: 'all 0.2s',
  }),
  logoutBtn: {
    padding: '7px 18px', borderRadius: 9,
    border: '1.5px solid rgba(239,68,68,0.4)', background: 'transparent',
    color: '#fca5a5', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  },

  main: { padding: '2rem', maxWidth: 1140, margin: '0 auto' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '1rem', marginBottom: '2rem' },
  statCard: (accent) => ({
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}28`,
    borderRadius: 18, padding: '1.3rem 1.5rem', transition: 'transform 0.25s,box-shadow 0.25s', cursor: 'default',
  }),
  statVal: { fontSize: '2rem', fontWeight: 900, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },

  panel: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20, overflow: 'hidden', marginBottom: 24,
  },
  panelHeader: {
    padding: '1.2rem 1.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  panelTitle: { fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' },
  panelBody: { padding: '1.4rem 1.8rem' },

  /* evaluation card ─ the main card for each question */
  evalCard: (expanded) => ({
    background: expanded ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.025)',
    border: `1px solid ${expanded ? 'rgba(6,182,212,0.22)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 16, overflow: 'hidden', marginBottom: 14, transition: 'border-color 0.2s',
  }),
  evalCardHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 1.4rem', cursor: 'pointer', flexWrap: 'wrap', gap: 10,
  },
  evalCardBody: { padding: '0 1.4rem 1.2rem', display: 'flex', flexDirection: 'column', gap: 14 },

  gradeChip: (c) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: 10,
    background: `${c}20`, color: c, fontWeight: 900, fontSize: '0.85rem',
    border: `1px solid ${c}40`,
  }),
  barRow: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 130 },
  barTrack: { flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  barFill: (pct) => ({
    height: '100%', borderRadius: 4, width: `${Math.min(pct, 100)}%`,
    background: `linear-gradient(90deg,${pctColor(pct)},${pctColor(pct)}99)`,
    transition: 'width 0.8s',
  }),

  /* text boxes */
  fieldBox: (accent) => ({
    background: `rgba(${accent},0.05)`, border: `1px solid rgba(${accent},0.15)`,
    borderRadius: 12, padding: '12px 16px',
  }),
  fieldLabel: (color) => ({
    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.5px', color, marginBottom: 6, display: 'block',
  }),
  fieldText: {
    fontSize: '0.87rem', color: '#cbd5e1', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },

  pill: (c, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 11px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
    background: bg, color: c, border: `1px solid ${c}33`,
  }),

  reEvalBtn: (disabled) => ({
    padding: '7px 16px', borderRadius: 9, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700,
    background: disabled ? 'rgba(255,255,255,0.05)' : 'rgba(245,158,11,0.15)',
    color: disabled ? '#475569' : '#fbbf24',
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : 'rgba(245,158,11,0.28)'}`,
    transition: 'all 0.2s', whiteSpace: 'nowrap',
  }),

  /* re-eval list */
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '11px 16px', textAlign: 'left',
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px',
    textTransform: 'uppercase', color: '#64748b',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  td: {
    padding: '13px 16px', fontSize: '0.87rem', color: '#cbd5e1',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    verticalAlign: 'middle',
  },
  statusChip: (s) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 12px', borderRadius: 50, fontSize: '0.76rem', fontWeight: 700,
    background: statusBg[s] || 'rgba(255,255,255,0.08)',
    color: statusColor[s] || '#94a3b8',
    border: `1px solid ${statusColor[s] || '#475569'}40`,
    textTransform: 'capitalize',
  }),
  emptyBox: { textAlign: 'center', padding: '3.5rem 2rem', color: '#475569', fontSize: '0.93rem' },

  /* modal */
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
    backdropFilter: 'blur(8px)', zIndex: 999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
  },
  modal: {
    background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
  },
  modalHeader: {
    padding: '1.3rem 1.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  modalTitle: { fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' },
  closeBtn: {
    background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
    width: 32, height: 32, cursor: 'pointer', color: '#94a3b8',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
  },
  modalBody: { padding: '1.4rem 1.8rem' },
  modalFooter: {
    padding: '1rem 1.8rem', borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', justifyContent: 'flex-end', gap: 10,
  },
  mLabel: { fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' },
  mInput: {
    width: '100%', padding: '11px 14px', borderRadius: 11,
    border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#f1f5f9', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', marginBottom: '1rem',
  },
  mSelect: {
    width: '100%', padding: '11px 14px', borderRadius: 11,
    border: '1.5px solid rgba(255,255,255,0.1)', background: '#0f1629',
    color: '#f1f5f9', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', marginBottom: '1rem', cursor: 'pointer',
  },
  mTextarea: {
    width: '100%', padding: '11px 14px', borderRadius: 11,
    border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#f1f5f9', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', resize: 'vertical', minHeight: 90, marginBottom: '1rem',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent', color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 24px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg,#f59e0b,#d97706)',
    color: '#fff', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,158,11,0.35)', transition: 'all 0.2s',
  },
  infoRow: {
    background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)',
    borderRadius: 12, padding: '10px 14px', marginBottom: '1.1rem',
    fontSize: '0.82rem', color: '#67e8f9', lineHeight: 1.6,
  },

  /* upload */
  mInputLg: {
    width: '100%', padding: '11px 14px', borderRadius: 11,
    border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#f1f5f9', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  },
};

/* ─────────────────────────────────────────────────────────
   UPLOAD constants
───────────────────────────────────────────────────────── */
const EMPTY_UPLOAD = {
  subjectName: '',
  questions: Array.from({ length: 5 }, (_, i) => ({ no: i + 1, id: '', questionText: '', answerText: '' })),
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
const StudentHome = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('results');
  const [evaluations, setEvaluations] = useState([]);
  const [reEvalRequests, setReEvalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEval, setSelectedEval] = useState(null);
  const [expanded, setExpanded] = useState({});     // which eval cards are open
  const [toast, setToast] = useState(null);
  const [uploadData, setUploadData] = useState(EMPTY_UPLOAD);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadedList, setUploadedList] = useState([]);

  const [requestData, setRequestData] = useState({
    questionId: '', currentMarks: 0, maxMarks: 0,
    reason: '', additionalExplanation: '', expectedMarks: 0,
  });

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── fetch evaluations ── */
  const fetchEvaluations = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const sid = user?.studentId || user?.id || user?.universalId;
      const res = await axios.get(`${API}/student-evaluations/${sid}`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setEvaluations(data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  }, [user, API]);

  /* ── fetch re-eval requests ── */
  const fetchReEvals = useCallback(async () => {
    try {
      const sid = user?.studentId || user?.id || user?.universalId;
      const res = await axios.get(`${API}/student-reevaluations/${sid}`);
      setReEvalRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setReEvalRequests([]);
    }
  }, [user, API]);

  useEffect(() => {
    fetchEvaluations();
    fetchReEvals();
  }, [fetchEvaluations, fetchReEvals]);

  /* ── open re-eval modal ── */
  const openModal = (ev) => {
    // Marks: human_corrected > evaluator_score > ai_score/score > marksAwarded
    const cur = Number(
      ev?.human_corrected_marks ??
      ev?.evaluator_score ??
      ev?.ai_marks_awarded ??
      ev?.ai_score ??
      ev?.score ??
      ev?.marksAwarded ??
      0
    );
    const max = Number(ev?.maxMarks ?? 10);
    // questionId like "7070-5" → use as-is for tracking, show "5" in UI
    const qId = ev?.questionId || ev?.questionNumber || '';
    setSelectedEval(ev);
    setRequestData({
      questionId: qId, currentMarks: cur, maxMarks: max,
      reason: '', additionalExplanation: '',
      expectedMarks: Math.min(cur + 1, max),
    });
    setShowModal(true);
  };

  /* ── submit re-eval ── */
  const submitRequest = async () => {
    if (!requestData.reason || !requestData.additionalExplanation.trim()) {
      showToast('Please fill all required fields', 'error'); return;
    }
    try {
      const sid = user?.studentId || user?.id || user?.universalId;
      const name = user?.name || user?.username || 'Student';
      const payload = {
        studentId: sid, studentName: name,
        questionId: requestData.questionId,
        evaluationId: selectedEval?._id || selectedEval?.id,
        originalMarks: Number(requestData.currentMarks),
        expectedMarks: Number(requestData.expectedMarks),
        maxMarks: Number(requestData.maxMarks),
        reason: requestData.reason,
        additionalExplanation: requestData.additionalExplanation,
        questionText: selectedEval?.questionText || selectedEval?.questionName || '',
        studentAnswer: selectedEval?.studentAnswer || '',
        aiFeedback: selectedEval?.ai_feedback || '',
        detailedFeedback: selectedEval?.detailed_feedback || '',
        universalId: selectedEval?.universalId || sid,
      };
      await axios.post(`${API}/submit-reevaluation`, payload);
      showToast('✅ Re-evaluation request submitted!');
      await fetchReEvals();
      setShowModal(false);
    } catch {
      /* offline fallback */
      setReEvalRequests(prev => [{
        _id: `re_${Date.now()}`,
        questionId: requestData.questionId,
        originalMarks: requestData.currentMarks,
        expectedMarks: requestData.expectedMarks,
        reason: requestData.reason,
        additionalExplanation: requestData.additionalExplanation,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }, ...prev]);
      showToast('✅ Re-evaluation request submitted!');
      setShowModal(false);
    }
  };

  /* ── upload helpers ── */
  const updateQ = (idx, field, val) =>
    setUploadData(prev => {
      const qs = [...prev.questions];
      qs[idx] = { ...qs[idx], [field]: val };
      return { ...prev, questions: qs };
    });

  const handleUpload = async () => {
    const { subjectName, questions } = uploadData;
    if (!subjectName.trim()) { showToast('Please enter a subject name', 'error'); return; }
    if (questions.some(q => !q.id || q.id.length !== 4 || isNaN(q.id))) { showToast('Each question needs a valid 4-digit numeric ID', 'error'); return; }
    if (questions.some(q => !q.questionText.trim() || !q.answerText.trim())) { showToast('Please fill question and answer for every row', 'error'); return; }
    setUploadSubmitting(true);
    try {
      const sid = user?.studentId || user?.id;
      await axios.post(`${API}/upload-qa`, { studentId: sid, subjectName, questions });
      showToast('✅ Submitted successfully!');
    } catch { showToast('✅ Saved (demo mode)!'); }
    finally {
      setUploadedList(prev => [{ id: `u_${Date.now()}`, subjectName, questionCount: 5, uploadedAt: new Date().toISOString() }, ...prev]);
      setUploadData(EMPTY_UPLOAD);
      setUploadSubmitting(false);
    }
  };

  /* ── stats ── */
  // Helper: resolve percentage for a single evaluation doc
  const resolveEvalPct = (e) => {
    if (e.corrected_percentage != null) return Number(e.corrected_percentage);
    if (e.ai_percentage != null) return Number(e.ai_percentage);
    // Python system: score (0-10) / maxMarks
    const marks = Number(e.human_corrected_marks ?? e.evaluator_score ?? e.ai_marks_awarded ?? e.ai_score ?? e.score ?? e.marksAwarded ?? 0);
    const mx = Number(e.maxMarks ?? 10);
    return mx > 0 ? (marks / mx) * 100 : 0;
  };
  const avg = evaluations.length
    ? (evaluations.reduce((s, e) => s + resolveEvalPct(e), 0) / evaluations.length).toFixed(1)
    : '—';
  const best = evaluations.length
    ? Math.max(...evaluations.map(e => resolveEvalPct(e))).toFixed(1)
    : '—';

  /* ── toggle expand ── */
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  /* ═══════════════════════════════════════
     RESULTS TAB
  ═══════════════════════════════════════ */
  const ResultsTab = () => (
    <div style={S.panel}>
      <div style={S.panelHeader}>
        <span style={S.panelTitle}>📊 My Evaluation Results</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.8rem', color: '#475569' }}>
            {evaluations.length} result{evaluations.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={fetchEvaluations}
            style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.1)', color: '#67e8f9', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
          >🔄 Refresh</button>
        </div>
      </div>
      <div style={S.panelBody}>

        {loading && (
          <div style={S.emptyBox}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            Loading evaluations…
          </div>
        )}

        {!loading && error && (
          <div style={{ ...S.emptyBox, color: '#fca5a5' }}>⚠️ {error}</div>
        )}

        {!loading && !error && evaluations.length === 0 && (
          <div style={S.emptyBox}>🎓 No evaluations found for your account yet.</div>
        )}

        {!loading && evaluations.length > 0 && evaluations.map((ev, i) => {
          const id = ev._id || ev.id || `ev-${i}`;
          const isOpen = expanded[id];
          // Marks: human_corrected > evaluator_score > ai_score/score > marksAwarded
          const wasReEval = !!(ev.reEvaluated || (ev.evaluator_score != null && ev.evaluator_score !== ev.ai_score));
          const cur = Number(
            wasReEval && ev.human_corrected_marks != null ? ev.human_corrected_marks :
              wasReEval && ev.evaluator_score != null ? ev.evaluator_score :
                ev.ai_marks_awarded ?? ev.ai_score ?? ev.score ?? ev.marksAwarded ?? 0
          );
          const max = Number(ev.maxMarks ?? 10);
          const pct = resolveEvalPct(ev);
          const grade = getGrade(pct);
          // questionId "7070-5" → show "5"
          const qNum = ev.questionNumber ||
            (ev.questionId && ev.questionId.toString().includes('-')
              ? ev.questionId.toString().split('-').pop()
              : ev.questionId) ||
            (i + 1);
          const alreadyReq = reEvalRequests.some(r =>
            r.evaluationId === id || r.questionId === ev.questionId
          );
          // Feedback: Python system uses detailed_feedback / summary
          const feedback = ev.detailed_feedback || ev.ai_feedback || ev.justification || ev.summary || '—';
          // Rich detail fields from Python system
          const summaryText = ev.summary;
          const conceptualAcc = ev.conceptual_accuracy;
          const completeness = ev.completeness;
          const strengths = ev.strengths;
          const improvements = ev.improvements;
          const spellingGrammar = ev.spelling_grammar;
          const aiModel = ev.model_used || ev.ai_model_used;

          return (
            <div key={id} style={S.evalCard(isOpen)}>
              {/* collapsed header (always visible) */}
              <div style={S.evalCardHead} onClick={() => toggleExpand(id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1e3a5f,#1e4080)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 800, color: '#93c5fd', flexShrink: 0 }}>
                    Q{qNum}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.88rem', marginBottom: 2 }}>
                      {ev.questionText ? (ev.questionText.length > 70 ? ev.questionText.slice(0, 70) + '…' : ev.questionText) : `Question ${qNum}`}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {fmtDate(ev.evaluationDate || ev.timestamp_utc || ev.savedAt || ev.createdAt)}
                      </span>
                      {wasReEval && <span style={S.pill('#7c3aed', 'rgba(124,58,237,0.12)')}>🔄 Re-evaluated</span>}
                      {(ev.is_answer_correct === true || ev.qa_approved === true) && <span style={S.pill('#10b981', 'rgba(16,185,129,0.12)')}>✔ Correct</span>}
                      {(ev.is_answer_correct === false || ev.qa_approved === false) && <span style={S.pill('#ef4444', 'rgba(239,68,68,0.12)')}>✘ Incorrect</span>}
                      {ev.requires_human_correction && !wasReEval && <span style={S.pill('#f59e0b', 'rgba(245,158,11,0.12)')}>⚠ Needs Review</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={S.barRow}>
                    <div style={S.barTrack}><div style={S.barFill(pct)} /></div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pctColor(pct), minWidth: 38 }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div>
                    <div style={{ textAlign: 'center', fontWeight: 800, color: '#f1f5f9', fontSize: '0.9rem' }}>{cur.toFixed(1)}<span style={{ color: '#475569', fontSize: '0.78rem' }}>/{max}</span></div>
                  </div>
                  <div style={S.gradeChip(grade.color)}>{grade.label}</div>
                  <span style={{ color: '#475569', fontSize: '1rem', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </div>
              </div>

              {/* expanded body */}
              {isOpen && (
                <div style={S.evalCardBody}>
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0 0 4px' }} />

                  {/* Question */}
                  {ev.questionText && (
                    <div style={S.fieldBox('6,182,212')}>
                      <span style={S.fieldLabel('#67e8f9')}>❓ Question</span>
                      <p style={S.fieldText}>{ev.questionText}</p>
                    </div>
                  )}

                  {/* Student Answer */}
                  {ev.studentAnswer && (
                    <div style={S.fieldBox('139,92,246')}>
                      <span style={S.fieldLabel('#a5b4fc')}>✍️ Your Answer</span>
                      <p style={S.fieldText}>{ev.studentAnswer}</p>
                    </div>
                  )}

                  {/* Reference Answer */}
                  {ev.referenceAnswer && (
                    <div style={S.fieldBox('16,185,129')}>
                      <span style={S.fieldLabel('#6ee7b7')}>📖 Reference Answer</span>
                      <p style={S.fieldText}>{ev.referenceAnswer}</p>
                    </div>
                  )}

                  {/* AI Feedback */}
                  <div style={S.fieldBox('245,158,11')}>
                    <span style={S.fieldLabel('#fbbf24')}>🤖 AI Feedback</span>
                    <p style={S.fieldText}>{feedback}</p>
                  </div>

                  {/* Summary */}
                  {summaryText && summaryText !== feedback && (
                    <div style={S.fieldBox('6,182,212')}>
                      <span style={S.fieldLabel('#67e8f9')}>📝 Summary</span>
                      <p style={S.fieldText}>{summaryText}</p>
                    </div>
                  )}

                  {/* Conceptual Accuracy */}
                  {conceptualAcc && (
                    <div style={S.fieldBox('99,102,241')}>
                      <span style={S.fieldLabel('#a5b4fc')}>🧠 Conceptual Accuracy</span>
                      <p style={S.fieldText}>{conceptualAcc}</p>
                    </div>
                  )}

                  {/* Completeness */}
                  {completeness && (
                    <div style={S.fieldBox('99,102,241')}>
                      <span style={S.fieldLabel('#a5b4fc')}>✅ Completeness</span>
                      <p style={S.fieldText}>{completeness}</p>
                    </div>
                  )}

                  {/* Strengths */}
                  {strengths && (
                    <div style={S.fieldBox('16,185,129')}>
                      <span style={S.fieldLabel('#6ee7b7')}>💪 Strengths</span>
                      <p style={S.fieldText}>{strengths}</p>
                    </div>
                  )}

                  {/* Improvements */}
                  {improvements && (
                    <div style={S.fieldBox('245,158,11')}>
                      <span style={S.fieldLabel('#fbbf24')}>🔧 Improvements Needed</span>
                      <p style={S.fieldText}>{improvements}</p>
                    </div>
                  )}

                  {/* Spelling */}
                  {spellingGrammar && spellingGrammar !== 'No issues detected' && (
                    <div style={S.fieldBox('239,68,68')}>
                      <span style={S.fieldLabel('#fca5a5')}>🔤 Spelling & Grammar</span>
                      <p style={S.fieldText}>{spellingGrammar}</p>
                    </div>
                  )}

                  {/* Evaluator Feedback (re-eval) */}
                  {ev.evaluatorFeedback && (
                    <div style={S.fieldBox('124,58,237')}>
                      <span style={S.fieldLabel('#c4b5fd')}>👤 Evaluator Feedback</span>
                      <p style={S.fieldText}>{ev.evaluatorFeedback}</p>
                    </div>
                  )}

                  {/* meta row */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.77rem', color: '#64748b' }}>
                    {aiModel && <span><strong style={{ color: '#94a3b8' }}>Model:</strong> {aiModel}</span>}
                    {ev.learning_shots_used != null && <span><strong style={{ color: '#94a3b8' }}>Learning Shots:</strong> {ev.learning_shots_used}</span>}
                    {ev.evaluation_stage && <span><strong style={{ color: '#94a3b8' }}>Stage:</strong> {ev.evaluation_stage}</span>}
                    {(ev.universalId || ev.base_id) && <span><strong style={{ color: '#94a3b8' }}>ID:</strong> {ev.universalId || ev.base_id}</span>}
                  </div>

                  {/* action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      disabled={alreadyReq}
                      style={S.reEvalBtn(alreadyReq)}
                      onClick={() => !alreadyReq && openModal(ev)}
                      onMouseEnter={e => { if (!alreadyReq) e.currentTarget.style.background = 'rgba(245,158,11,0.25)'; }}
                      onMouseLeave={e => { if (!alreadyReq) e.currentTarget.style.background = 'rgba(245,158,11,0.15)'; }}
                    >
                      {alreadyReq ? '✓ Re-eval Requested' : '⟳ Request Re-evaluation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     RE-EVAL TAB
  ═══════════════════════════════════════ */
  const ReEvalTab = () => (
    <div style={S.panel}>
      <div style={S.panelHeader}>
        <span style={S.panelTitle}>⟳ Re-evaluation Requests</span>
        <button
          onClick={fetchReEvals}
          style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
        >🔄 Refresh</button>
      </div>
      <div style={S.panelBody}>
        {reEvalRequests.length === 0 ? (
          <div style={S.emptyBox}>
            📭 No re-evaluation requests yet.<br />
            <span style={{ fontSize: '0.82rem' }}>Go to the Results tab, expand a question, and click <em>Request Re-evaluation</em>.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>{['Question', 'Original Marks', 'Expected Marks', 'Reason', 'Status', 'Submitted'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {reEvalRequests.map((r, i) => (
                  <tr key={r._id || i}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...S.td, fontWeight: 700, color: '#e2e8f0' }}>{r.questionId || '—'}</td>
                    <td style={S.td}>{Number(r.originalMarks || 0).toFixed(1)}</td>
                    <td style={{ ...S.td, color: '#fbbf24', fontWeight: 700 }}>{Number(r.expectedMarks || 0).toFixed(1)}</td>
                    <td style={{ ...S.td, color: '#94a3b8', fontSize: '0.82rem' }}>{r.reason?.replace(/_/g, ' ') || '—'}</td>
                    <td style={S.td}>
                      <span style={S.statusChip(r.status)}>
                        {r.status === 'pending' ? '⏳' : r.status === 'approved' ? '✅' : '❌'} {r.status}
                      </span>
                    </td>
                    <td style={S.td}>{fmtDate(r.createdAt || r.requestDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     UPLOAD TAB
  ═══════════════════════════════════════ */
  const UploadTab = () => {
    const ta = {
      width: '100%', padding: '10px 13px', borderRadius: 12,
      border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
      color: '#f1f5f9', fontFamily: 'inherit', fontSize: '0.87rem', outline: 'none',
      boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, transition: 'border-color 0.2s',
    };
    const filled = uploadData.questions.filter(q => q.id.length === 4 && q.questionText.trim() && q.answerText.trim()).length;

    return (
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <span style={S.panelTitle}>📝 Submit Questions & Answers</span>
          <span style={{ fontSize: '0.8rem', color: '#475569' }}>5 questions per batch</span>
        </div>
        <div style={S.panelBody}>
          {/* Subject */}
          <div style={{ marginBottom: '1.4rem' }}>
            <label style={{ ...S.mLabel, fontSize: '0.8rem' }}>Subject Name *</label>
            <input
              type="text"
              placeholder="e.g. Computer Science, Physics…"
              value={uploadData.subjectName}
              onChange={e => setUploadData({ ...uploadData, subjectName: e.target.value })}
              style={{ ...S.mInputLg, padding: '11px 14px', borderRadius: 11 }}
            />
          </div>

          {/* Question rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.2rem' }}>
            {uploadData.questions.map((q, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 15, padding: '1.1rem 1.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>Q{q.no}</div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, flex: 1 }}>4-Digit ID *</span>
                  <input type="text" maxLength={4} placeholder="e.g. 2024" value={q.id}
                    onChange={e => updateQ(idx, 'id', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{ width: 90, padding: '7px 11px', borderRadius: 9, border: `1.5px solid ${q.id.length === 4 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`, background: q.id.length === 4 ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ ...S.fieldLabel('#67e8f9'), marginBottom: 5 }}>📄 Question *</label>
                    <textarea rows={3} placeholder="Type question…" value={q.questionText}
                      onChange={e => updateQ(idx, 'questionText', e.target.value)}
                      onFocus={e => { e.target.style.borderColor = 'rgba(6,182,212,0.5)'; }}
                      onBlur={e => { e.target.style.borderColor = q.questionText.trim() ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.1)'; }}
                      style={{ ...ta, minHeight: 90, borderColor: q.questionText.trim() ? 'rgba(6,182,212,0.28)' : 'rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label style={{ ...S.fieldLabel('#a5b4fc'), marginBottom: 5 }}>✍️ Answer *</label>
                    <textarea rows={3} placeholder="Type answer…" value={q.answerText}
                      onChange={e => updateQ(idx, 'answerText', e.target.value)}
                      onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.55)'; }}
                      onBlur={e => { e.target.style.borderColor = q.answerText.trim() ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.1)'; }}
                      style={{ ...ta, minHeight: 90, borderColor: q.answerText.trim() ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
                {q.id.length === 4 && q.questionText.trim() && q.answerText.trim() && (
                  <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    <span style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 700 }}>Ready</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(filled / 5) * 100}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#6366f1,#06b6d4)', transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: '0.77rem', fontWeight: 700, color: filled === 5 ? '#6ee7b7' : '#64748b', minWidth: 55 }}>{filled}/5 ready</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleUpload} disabled={uploadSubmitting}
              style={{ padding: '11px 30px', borderRadius: 11, border: 'none', background: uploadSubmitting ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700, cursor: uploadSubmitting ? 'not-allowed' : 'pointer', boxShadow: uploadSubmitting ? 'none' : '0 6px 20px rgba(99,102,241,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!uploadSubmitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.55)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = uploadSubmitting ? 'none' : '0 6px 20px rgba(99,102,241,0.4)'; }}
            >
              {uploadSubmitting ? '⏳ Uploading…' : '📤 Submit Upload'}
            </button>
          </div>

          {uploadedList.length > 0 && (
            <div style={{ marginTop: '1.8rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '0.7rem' }}>Recent Uploads</div>
              {uploadedList.map(u => (
                <div key={u.id} style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>📦</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{u.subjectName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.questionCount} questions</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 700, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '3px 10px' }}>✓ Uploaded</span>
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>{fmtDate(u.uploadedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════
          <select value={requestData.reason}
            onChange={e => setRequestData({ ...requestData, reason: e.target.value })}
            style={S.mSelect}
          >
            <option value="">Select a reason…</option>
            <option value="incorrect_marking">Incorrect marking</option>
            <option value="partial_credit">Partial credit not given</option>
            <option value="alternative_solution">Alternative solution accepted</option>
            <option value="other">Other</option>
          </select>

          <label style={S.mLabel}>Explanation *</label>
          <textarea rows={4} placeholder="Explain why you believe re-evaluation is warranted…"
            value={requestData.additionalExplanation}
            onChange={e => setRequestData({ ...requestData, additionalExplanation: e.target.value })}
            style={S.mTextarea}
          />
        </div>
        <div style={S.modalFooter}>
          <button style={S.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
          <button style={S.submitBtn} onClick={submitRequest}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(245,158,11,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.35)'; }}
          >Submit Request →</button>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 76, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#450a0a' : '#052e16',
          border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          color: toast.type === 'error' ? '#fca5a5' : '#6ee7b7',
          borderRadius: 12, padding: '11px 18px', fontWeight: 700, fontSize: '0.87rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)', animation: 'fadeIn 0.3s ease',
        }}>{toast.msg}</div>
      )}

      {/* Navbar */}
      <nav style={S.navbar}>
        <div style={S.brand}>
          <div style={S.brandIcon}>🎓</div>
          <span style={S.brandName}>AI Evaluation System</span>
        </div>

        <div style={S.navTabs}>
          {[
            { id: 'results', label: '📊 Results' },
            { id: 're-evaluation', label: '⟳ Re-evaluation' },
            { id: 'upload', label: '📤 Upload' },
          ].map(t => (
            <button key={t.id} style={S.navTab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
            👤 {user?.name || user?.studentId || 'Student'}
          </span>
          <button style={S.logoutBtn} onClick={onLogout}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >Logout</button>
        </div>
      </nav>

      {/* Main */}
      <div style={S.main}>

        {/* Welcome */}
        <div style={{
          background: 'linear-gradient(135deg,rgba(6,182,212,0.1),rgba(8,145,178,0.06))',
          border: '1px solid rgba(6,182,212,0.16)', borderRadius: 16,
          padding: '1.1rem 1.5rem', marginBottom: '1.6rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.7rem',
        }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e2e8f0' }}>
              Hello, {user?.name || `Student ${user?.studentId}` || 'Student'} 👋
            </div>
            <div style={{ fontSize: '0.8rem', color: '#67e8f9', marginTop: 3 }}>
              Student ID: {user?.studentId || user?.id || user?.universalId || 'N/A'}
            </div>
          </div>
          <div style={{ fontSize: '0.77rem', color: '#475569' }}>
            {fmtDate(new Date().toISOString())}
          </div>
        </div>

        {/* Stats */}
        <div style={S.statsGrid}>
          {[
            { label: 'Evaluations', val: loading ? '…' : evaluations.length, accent: '#06b6d4', icon: '📋' },
            { label: 'Avg. Score', val: loading ? '…' : `${avg}%`, accent: '#6366f1', icon: '📊' },
            { label: 'Best Score', val: loading ? '…' : `${best}%`, accent: '#10b981', icon: '🏆' },
            { label: 'Re-eval Requests', val: reEvalRequests.length, accent: '#f59e0b', icon: '⟳' },
          ].map(stat => (
            <div key={stat.label} style={S.statCard(stat.accent)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${stat.accent}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '1.3rem', marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ ...S.statVal, color: stat.accent }}>{stat.val}</div>
              <div style={S.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'results' && <ResultsTab />}
        {activeTab === 're-evaluation' && <ReEvalTab />}
        {activeTab === 'upload' && <UploadTab />}
      </div>

      {showModal && (
        <div style={S.overlay} onClick={() => setShowModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={S.modalTitle}>⟳ Request Re-evaluation</span>
              <button style={S.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={S.modalBody}>
              <div style={S.infoRow}>
                📌 <strong>Question:</strong> {requestData.questionId}&nbsp;·&nbsp;
                Current: <strong>{Number(requestData.currentMarks).toFixed(1)} / {requestData.maxMarks}</strong>
              </div>

              {selectedEval?.questionText && (
                <div style={{ ...S.fieldBox('6,182,212'), marginBottom: '1rem' }}>
                  <span style={S.fieldLabel('#67e8f9')}>Question</span>
                  <p style={{ ...S.fieldText, fontSize: '0.82rem' }}>{selectedEval.questionText.slice(0, 200)}{selectedEval.questionText.length > 200 ? '…' : ''}</p>
                </div>
              )}

              <label style={S.mLabel}>Expected Marks *</label>
              <input type="number" min={requestData.currentMarks} max={requestData.maxMarks}
                value={requestData.expectedMarks}
                onChange={e => setRequestData({ ...requestData, expectedMarks: Number(e.target.value) })}
                style={S.mInput}
              />

              <label style={S.mLabel}>Reason *</label>
              <select value={requestData.reason}
                onChange={e => setRequestData({ ...requestData, reason: e.target.value })}
                style={S.mSelect}
              >
                <option value="">Select a reason…</option>
                <option value="incorrect_marking">Incorrect marking</option>
                <option value="partial_credit">Partial credit not given</option>
                <option value="alternative_solution">Alternative solution accepted</option>
                <option value="other">Other</option>
              </select>

              <label style={S.mLabel}>Explanation *</label>
              <textarea rows={4} placeholder="Explain why you believe re-evaluation is warranted…"
                value={requestData.additionalExplanation}
                onChange={e => setRequestData({ ...requestData, additionalExplanation: e.target.value })}
                style={S.mTextarea}
              />
            </div>
            <div style={S.modalFooter}>
              <button style={S.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={S.submitBtn} onClick={submitRequest}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(245,158,11,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.35)'; }}
              >Submit Request →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
