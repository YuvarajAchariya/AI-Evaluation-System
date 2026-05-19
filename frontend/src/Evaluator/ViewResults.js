import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';

/* ─── Style tokens ──────────────────────────────────────────────── */
const s = {
  wrapper: {
    padding: '28px',
    background: '#ffffff',
    minHeight: '100%',
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },

  /* Main card */
  card: {
    background: '#ffffff',
    border: '1px solid #e8ecf0',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  },
  cardHeader: {
    background: 'linear-gradient(90deg,rgba(14,165,233,0.14),rgba(6,182,212,0.08))',
    borderBottom: '1px solid #e0f2fe',
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
    boxShadow: '0 4px 12px rgba(14,165,233,0.35)',
    flexShrink: 0,
  },
  headerTitle: { color: '#1e293b', fontWeight: 800, fontSize: '1.1rem', margin: 0 },
  cardBody: { padding: '24px' },

  /* Stat cards */
  statCard: (accent) => ({
    background: `linear-gradient(135deg,rgba(${accent},0.07),rgba(${accent},0.03))`,
    border: `1px solid rgba(${accent},0.2)`,
    borderRadius: 14,
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
  }),
  statNum: (color) => ({
    fontSize: '2rem', fontWeight: 800, color, margin: 0, lineHeight: 1,
  }),
  statLabel: { color: '#94a3b8', fontSize: '0.78rem', marginTop: 6, display: 'block' },

  /* Filter bar */
  filterBar: {
    background: '#f8fafc',
    border: '1px solid #e8ecf0',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterGroup: { display: 'flex', alignItems: 'center', gap: 10 },
  filterLabel: { color: '#64748b', fontWeight: 600, fontSize: '0.83rem', whiteSpace: 'nowrap' },
  select: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    color: '#1e293b',
    padding: '8px 12px',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnExport: {
    background: 'linear-gradient(135deg,#11998e,#38ef7d)',
    border: 'none',
    borderRadius: 10,
    color: '#1a1a2e',
    fontWeight: 700,
    fontSize: '0.83rem',
    padding: '9px 18px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 3px 10px rgba(17,153,142,0.3)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },

  /* Table */
  tableWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #e8ecf0',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  thead: { background: 'linear-gradient(90deg,#1e293b,#334155)' },
  th: {
    color: '#cbd5e1',
    fontWeight: 600,
    fontSize: '0.72rem',
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

  /* Progress bar */
  progressTrack: {
    background: '#f1f5f9',
    borderRadius: 99,
    height: 6,
    overflow: 'hidden',
    marginTop: 6,
  },

  /* Badges */
  gradeBadge: (color, bg) => ({
    background: bg,
    color,
    border: `1px solid ${color}33`,
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.3px',
    display: 'inline-block',
  }),

  /* View details button */
  btnView: {
    background: 'linear-gradient(135deg,rgba(102,126,234,0.1),rgba(118,75,162,0.07))',
    border: '1px solid rgba(102,126,234,0.3)',
    borderRadius: 8,
    color: '#667eea',
    fontWeight: 600,
    fontSize: '0.78rem',
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.15s',
    whiteSpace: 'nowrap',
  },

  /* Loading / Empty state */
  empty: { textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: '0.9rem' },
  loading: { textAlign: 'center', padding: '48px 0', color: '#0ea5e9', fontSize: '0.9rem' },
  error: { textAlign: 'center', padding: '48px 0', color: '#dc2626', fontSize: '0.9rem' },

  /* ── Modal overlay ── */
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 1050,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 820,
    maxHeight: '90vh',
    boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    background: 'linear-gradient(90deg,#1e293b,#334155)',
    padding: '20px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  },
  modalTitle: { color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 },
  modalClose: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 8,
    color: '#fff',
    fontSize: '1.1rem',
    cursor: 'pointer',
    width: 34, height: 34,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  modalBody: {
    overflowY: 'auto',
    padding: '24px',
    flex: 1,
  },

  /* Student summary strip inside modal */
  studentStrip: {
    background: 'linear-gradient(90deg,rgba(14,165,233,0.08),rgba(6,182,212,0.05))',
    border: '1px solid #e0f2fe',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex', flexWrap: 'wrap', gap: 24,
    marginBottom: 24,
  },
  stripItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  stripKey: { color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' },
  stripVal: { color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 },

  /* Question card */
  qCard: {
    border: '1px solid #e8ecf0',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  qCardHead: {
    background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)',
    borderBottom: '1px solid #e8ecf0',
    padding: '12px 18px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 10,
  },
  qNum: { color: '#0ea5e9', fontWeight: 800, fontSize: '0.82rem' },
  qCardBody: { padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 },
  fieldLabel: {
    color: '#64748b', fontWeight: 600, fontSize: '0.72rem',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    marginBottom: 4, display: 'block',
  },
  fieldText: {
    color: '#374151', fontSize: '0.88rem', lineHeight: 1.6,
    background: '#f8fafc', border: '1px solid #e8ecf0',
    borderRadius: 8, padding: '10px 14px',
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },
  marksRow: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
  },
  marksPill: (color, bg) => ({
    background: bg, color, border: `1px solid ${color}33`,
    borderRadius: 20, padding: '4px 14px',
    fontWeight: 700, fontSize: '0.82rem',
    display: 'inline-flex', alignItems: 'center', gap: 5,
  }),
  miniBar: (pct) => ({
    flex: 1, minWidth: 100,
    height: 8, borderRadius: 99,
    background: '#f1f5f9',
    position: 'relative', overflow: 'hidden',
  }),
  miniBarFill: (pct) => ({
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: `${Math.min(pct, 100)}%`,
    background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444',
    borderRadius: 99,
    transition: 'width 0.5s',
  }),
};

/* ─── Helpers ───────────────────────────────────────────────────── */
const calcGrade = (pct) => {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

const gradeStyle = (grade) => {
  const map = {
    'A+': { color: '#15803d', bg: '#dcfce7' },
    'A': { color: '#15803d', bg: '#dcfce7' },
    'B+': { color: '#b45309', bg: '#fef3c7' },
    'B': { color: '#b45309', bg: '#fef3c7' },
    'C': { color: '#0369a1', bg: '#e0f2fe' },
    'D': { color: '#6b7280', bg: '#f3f4f6' },
    'F': { color: '#b91c1c', bg: '#fee2e2' },
  };
  return map[grade] || { color: '#6b7280', bg: '#f3f4f6' };
};

const statusStyle = (status) => {
  const map = {
    'Completed': { color: '#15803d', bg: '#dcfce7' },
    'Re-evaluated': { color: '#b45309', bg: '#fef3c7' },
    'Pending': { color: '#6b7280', bg: '#f3f4f6' },
  };
  return map[status] || { color: '#6b7280', bg: '#f3f4f6' };
};

const pctColor = (p) => p >= 80 ? '#15803d' : p >= 60 ? '#d97706' : '#dc2626';
const pctBar = (p) => p >= 80 ? '#22c55e' : p >= 60 ? '#f59e0b' : '#ef4444';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: '2-digit',
    });
  } catch { return dateStr; }
};

/* Aggregate raw docs → one row per student, keeping raw docs for modal */
const aggregateByStudent = (docs) => {
  const map = {};

  docs.forEach((doc) => {
    // Python system: base_id="7070", questionId="7070-5", universalId="UNIV-7070"
    // Mongoose model: studentId, universalId
    const sid =
      doc.base_id ||
      (doc.universalId ? doc.universalId.replace(/^UNIV-/, '') : null) ||
      doc.studentId ||
      doc.fileId ||
      (doc.questionId ? doc.questionId.toString().split('-')[0] : null) ||
      'Unknown';

    const sName = doc.studentName || doc.student_label || doc.studentId || sid;

    if (!map[sid]) {
      map[sid] = {
        studentId: sid,
        studentName: sName,
        totalMarks: 0,
        maxMarks: 0,
        submissionDate: null,
        requiresCorrection: false,
        reEvaluated: false,
        evaluationStage: doc.evaluation_stage || '',
        docs: [],
      };
    }
    const entry = map[sid];
    if (sName !== sid && entry.studentName === entry.studentId) entry.studentName = sName;

    // Marks: human_corrected > evaluator_score > ai_score/score > marksAwarded
    const wasReEval = !!(doc.reEvaluated || (doc.evaluator_score != null && doc.evaluator_score !== doc.ai_score));
    let awarded;
    if (wasReEval && doc.human_corrected_marks != null) {
      awarded = parseFloat(doc.human_corrected_marks);
    } else if (wasReEval && doc.evaluator_score != null) {
      awarded = parseFloat(doc.evaluator_score);
    } else {
      awarded = parseFloat(doc.ai_marks_awarded ?? doc.ai_score ?? doc.score ?? doc.marksAwarded ?? 0);
    }
    const max = parseFloat(doc.maxMarks ?? 10);
    entry.totalMarks += isNaN(awarded) ? 0 : awarded;
    entry.maxMarks   += isNaN(max) ? 10 : max;

    if (doc.requires_human_correction) entry.requiresCorrection = true;
    if (wasReEval) entry.reEvaluated = true;
    if (doc.evaluation_stage) entry.evaluationStage = doc.evaluation_stage;

    const docDate = doc.evaluationDate || doc.timestamp_utc || doc.savedAt || doc.createdAt;
    if (docDate && (!entry.submissionDate || new Date(docDate) > new Date(entry.submissionDate))) {
      entry.submissionDate = docDate;
    }
    entry.docs.push(doc);
  });

  return Object.values(map).map((entry, idx) => {
    const pct = entry.maxMarks > 0
      ? Math.round((entry.totalMarks / entry.maxMarks) * 100)
      : 0;

    let status = 'Completed';
    if (entry.reEvaluated) status = 'Re-evaluated';
    else if (entry.requiresCorrection) status = 'Re-evaluated';
    else if (
      entry.evaluationStage === 'pending' ||
      entry.evaluationStage === 'initial_ai_evaluation'
    ) status = 'Pending';

    return {
      id: idx + 1,
      studentId: entry.studentId,
      studentName: entry.studentName,
      totalMarks: parseFloat(entry.totalMarks.toFixed(2)),
      maxMarks: parseFloat(entry.maxMarks.toFixed(0)),
      percentage: pct,
      grade: calcGrade(pct),
      submissionDate: formatDate(entry.submissionDate),
      status,
      questions: entry.docs, // ← raw per-question docs
    };
  });
};

/* ─── Details Modal ──────────────────────────────────────────────── */
const DetailsModal = ({ student, onClose }) => {
  if (!student) return null;

  const { grade } = gradeStyle(student.grade);

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div style={s.modalHeader}>
          <h5 style={s.modalTitle}>
            📋 Student Evaluation Details
          </h5>
          <button style={s.modalClose} onClick={onClose}>✕</button>
        </div>

        <div style={s.modalBody}>
          {/* Student summary strip */}
          <div style={s.studentStrip}>
            {[
              { k: 'Student ID', v: student.studentId },
              { k: 'Student Name', v: student.studentName },
              { k: 'Total Marks', v: `${student.totalMarks} / ${student.maxMarks}` },
              { k: 'Percentage', v: `${student.percentage}%` },
              { k: 'Grade', v: student.grade },
              { k: 'Status', v: student.status },
              { k: 'Date', v: student.submissionDate },
            ].map(({ k, v }) => (
              <div style={s.stripItem} key={k}>
                <span style={s.stripKey}>{k}</span>
                <span style={s.stripVal}>{v}</span>
              </div>
            ))}
          </div>

          {/* Per-question cards */}
          {student.questions.length === 0 ? (
            <p style={s.empty}>No question details available.</p>
          ) : student.questions.map((q, i) => {
            // Marks: human_corrected > evaluator_score > ai_score/score > marksAwarded
            const wasReEvaluated = !!(q.reEvaluated || (q.evaluator_score != null && q.evaluator_score !== q.ai_score));
            let awarded;
            if (wasReEvaluated && q.human_corrected_marks != null) {
              awarded = parseFloat(q.human_corrected_marks);
            } else if (wasReEvaluated && q.evaluator_score != null) {
              awarded = parseFloat(q.evaluator_score);
            } else {
              awarded = parseFloat(q.ai_marks_awarded ?? q.ai_score ?? q.score ?? q.marksAwarded ?? 0);
            }
            const maxM = parseFloat(q.maxMarks ?? 10);
            const qPct = maxM > 0 ? Math.round((awarded / maxM) * 100) : 0;
            // questionId like "7070-5" → display "Question 5"
            const qNum = q.questionNumber ||
              (q.questionId && q.questionId.toString().includes('-')
                ? q.questionId.toString().split('-').pop()
                : q.questionId) ||
              (i + 1);
            // Feedback from Python system
            const feedback = q.detailed_feedback || q.ai_feedback || q.justification || q.summary || '—';
            const isCorrect = q.is_answer_correct ?? q.qa_approved;
            const needsHuman = q.requires_human_correction;
            const evaluatorFeedback = q.evaluatorFeedback;
            // Rich fields from Python system
            const summaryText = q.summary;
            const conceptualAcc = q.conceptual_accuracy;
            const completeness = q.completeness;
            const strengths = q.strengths;
            const improvements = q.improvements;
            const spellingGrammar = q.spelling_grammar;
            const aiModelUsed = q.model_used || q.ai_model_used;

            return (
              <div style={s.qCard} key={q._id || i}>
                {/* Question card header */}
                <div style={s.qCardHead}>
                  <span style={s.qNum}>Question {qNum}</span>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Marks pill */}
                    <span style={s.marksPill(pctColor(qPct), pctColor(qPct) + '18')}>
                      🎯 {awarded} / {maxM} marks
                    </span>

                    {/* Correct badge */}
                    {isCorrect === true && (
                      <span style={s.marksPill('#15803d', '#dcfce7')}>✔ Correct</span>
                    )}
                    {isCorrect === false && (
                      <span style={s.marksPill('#b91c1c', '#fee2e2')}>✘ Incorrect</span>
                    )}

                    {/* Re-evaluated badge */}
                    {wasReEvaluated && (
                      <span style={s.marksPill('#7c3aed', '#ede9fe')}>🔄 Re-evaluated</span>
                    )}

                    {/* Needs review badge */}
                    {needsHuman && !wasReEvaluated && (
                      <span style={s.marksPill('#b45309', '#fef3c7')}>⚠ Needs Review</span>
                    )}
                  </div>
                </div>

                <div style={s.qCardBody}>
                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={s.fieldLabel} css={{ marginBottom: 0 }}>Score Progress</span>
                      <span style={{ color: pctColor(qPct), fontWeight: 700, fontSize: '0.82rem' }}>{qPct}%</span>
                    </div>
                    <div style={s.miniBar(qPct)}>
                      <div style={s.miniBarFill(qPct)} />
                    </div>
                  </div>

                  {/* Question Text */}
                  {(q.questionText || q.questionName) && (
                    <div>
                      <span style={s.fieldLabel}>❓ Question</span>
                      <div style={s.fieldText}>{q.questionText || q.questionName}</div>
                    </div>
                  )}

                  {/* Student Answer */}
                  {q.studentAnswer && (
                    <div>
                      <span style={s.fieldLabel}>✍️ Student Answer</span>
                      <div style={s.fieldText}>{q.studentAnswer}</div>
                    </div>
                  )}

                  {/* Reference Answer */}
                  {q.referenceAnswer && (
                    <div>
                      <span style={s.fieldLabel}>📖 Reference Answer</span>
                      <div style={{ ...s.fieldText, borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                        {q.referenceAnswer}
                      </div>
                    </div>
                  )}

                  {/* AI Feedback */}
                  <div>
                    <span style={s.fieldLabel}>🤖 AI Feedback</span>
                    <div style={{ ...s.fieldText, borderColor: '#bae6fd', background: '#f0f9ff' }}>
                      {feedback}
                    </div>
                  </div>

                  {/* Evaluator Feedback (only if re-evaluated) */}
                  {evaluatorFeedback && (
                    <div>
                      <span style={s.fieldLabel}>👤 Evaluator Feedback</span>
                      <div style={{ ...s.fieldText, borderColor: '#c4b5fd', background: '#faf5ff' }}>
                        {evaluatorFeedback}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {summaryText && (
                    <div>
                      <span style={s.fieldLabel}>📝 Summary</span>
                      <div style={{ ...s.fieldText, borderColor: '#e0f2fe', background: '#f0f9ff' }}>{summaryText}</div>
                    </div>
                  )}

                  {/* Conceptual Accuracy */}
                  {conceptualAcc && (
                    <div>
                      <span style={s.fieldLabel}>🧠 Conceptual Accuracy</span>
                      <div style={s.fieldText}>{conceptualAcc}</div>
                    </div>
                  )}

                  {/* Completeness */}
                  {completeness && (
                    <div>
                      <span style={s.fieldLabel}>✅ Completeness</span>
                      <div style={s.fieldText}>{completeness}</div>
                    </div>
                  )}

                  {/* Strengths */}
                  {strengths && (
                    <div>
                      <span style={s.fieldLabel}>💪 Strengths</span>
                      <div style={{ ...s.fieldText, borderColor: '#bbf7d0', background: '#f0fdf4' }}>{strengths}</div>
                    </div>
                  )}

                  {/* Improvements */}
                  {improvements && (
                    <div>
                      <span style={s.fieldLabel}>🔧 Improvements</span>
                      <div style={{ ...s.fieldText, borderColor: '#fde68a', background: '#fffbeb' }}>{improvements}</div>
                    </div>
                  )}

                  {/* Spelling / Grammar */}
                  {spellingGrammar && spellingGrammar !== 'No issues detected' && (
                    <div>
                      <span style={s.fieldLabel}>🔤 Spelling & Grammar</span>
                      <div style={{ ...s.fieldText, borderColor: '#fca5a5', background: '#fff1f2' }}>{spellingGrammar}</div>
                    </div>
                  )}

                  {/* Extra info row */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {aiModelUsed && (
                      <div style={s.stripItem}>
                        <span style={s.stripKey}>AI Model</span>
                        <span style={{ ...s.stripVal, fontSize: '0.8rem', color: '#64748b' }}>{aiModelUsed}</span>
                      </div>
                    )}
                    {q.evaluation_stage && (
                      <div style={s.stripItem}>
                        <span style={s.stripKey}>Evaluation Stage</span>
                        <span style={{ ...s.stripVal, fontSize: '0.8rem', color: '#64748b' }}>{q.evaluation_stage}</span>
                      </div>
                    )}
                    {(q.evaluationDate || q.timestamp_utc || q.savedAt) && (
                      <div style={s.stripItem}>
                        <span style={s.stripKey}>Evaluated On</span>
                        <span style={{ ...s.stripVal, fontSize: '0.8rem', color: '#64748b' }}>
                          {formatDate(q.evaluationDate || q.timestamp_utc || q.savedAt)}
                        </span>
                      </div>
                    )}
                    {q.learning_shots_used != null && (
                      <div style={s.stripItem}>
                        <span style={s.stripKey}>Learning Shots</span>
                        <span style={{ ...s.stripVal, fontSize: '0.8rem', color: '#64748b' }}>{q.learning_shots_used}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */
const ViewResults = ({ subjectId }) => {
  const [filter, setFilter] = useState('all');
  const [btnHov, setBtnHov] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // student row for details modal

  const hov = (k, v) => setBtnHov(h => ({ ...h, [k]: v }));

  /* ── Fetch ── */
  useEffect(() => {
    const fetchEvaluations = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:5000/api/all-evaluations');
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        const rows = aggregateByStudent(Array.isArray(data) ? data : (data.data || []));
        setResults(rows);
      } catch (err) {
        setError(err.message || 'Failed to fetch evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, [subjectId]);

  /* ── Derived stats ── */
  const filteredResults = filter === 'all' ? results : results.filter(r => r.status === filter);
  const totalStudents = results.length;
  const averageMarks = totalStudents > 0
    ? results.reduce((acc, r) => acc + r.percentage, 0) / totalStudents
    : 0;
  const topPerformer = totalStudents > 0
    ? results.reduce((top, cur) => cur.totalMarks > top.totalMarks ? cur : top, results[0])
    : null;

  const stats = [
    { label: 'Total Students', value: totalStudents, color: '#3b82f6', accent: '59,130,246' },
    { label: 'Average Marks', value: `${averageMarks.toFixed(1)}%`, color: '#22c55e', accent: '34,197,94' },
    { label: 'Highest Grade', value: topPerformer ? topPerformer.grade : '—', color: '#f59e0b', accent: '245,158,11' },
    { label: 'Re-evaluated', value: results.filter(r => r.status === 'Re-evaluated').length, color: '#0ea5e9', accent: '14,165,233' },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── Details Modal ── */}
      {selected && <DetailsModal student={selected} onClose={() => setSelected(null)} />}

      <div style={s.wrapper}>
        <div style={s.card}>
          {/* Header */}
          <div style={s.cardHeader}>
            <div style={s.headerIcon}>📊</div>
            <h4 style={s.headerTitle}>Evaluation Results</h4>
          </div>

          <div style={s.cardBody}>
            {/* Stats */}
            <Row className="g-3 mb-4">
              {stats.map(st => (
                <Col md={3} key={st.label}>
                  <div style={s.statCard(st.accent)}>
                    <h3 style={s.statNum(st.color)}>{loading ? '…' : st.value}</h3>
                    <span style={s.statLabel}>{st.label}</span>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Filter bar */}
            <div style={s.filterBar}>
              <div style={s.filterGroup}>
                <span style={s.filterLabel}>Filter by Status:</span>
                <select style={s.select} value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Re-evaluated">Re-evaluated</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <button
                style={{
                  ...s.btnExport,
                  ...(btnHov.export
                    ? { transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(17,153,142,0.4)' }
                    : {}),
                }}
                onMouseEnter={() => hov('export', true)}
                onMouseLeave={() => hov('export', false)}
              >
                ⬇️ Export Results
              </button>
            </div>

            {/* Table */}
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead style={s.thead}>
                  <tr>
                    {['Student ID', 'Student Name', 'Total Marks', 'Percentage', 'Grade', 'Status', 'Submission Date', 'Action'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={s.loading}>⏳ Loading evaluation data…</td></tr>
                  ) : error ? (
                    <tr><td colSpan={8} style={s.error}>⚠️ {error}</td></tr>
                  ) : filteredResults.length === 0 ? (
                    <tr><td colSpan={8} style={s.empty}>📭 No results found for the selected filter.</td></tr>
                  ) : filteredResults.map((result, i) => (
                    <tr key={result.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td style={s.td}>{result.studentId}</td>
                      <td style={s.td}><strong>{result.studentName}</strong></td>
                      <td style={{ ...s.td, minWidth: 130 }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{result.totalMarks}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}> / {result.maxMarks}</span>
                        <div style={s.progressTrack}>
                          <div style={{
                            height: '100%', width: `${result.percentage}%`,
                            background: pctBar(result.percentage), borderRadius: 99, transition: 'width 0.4s',
                          }} />
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.gradeBadge(pctColor(result.percentage), pctColor(result.percentage) + '18')}>
                          {result.percentage}%
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.gradeBadge(gradeStyle(result.grade).color, gradeStyle(result.grade).bg)}>
                          {result.grade}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.gradeBadge(statusStyle(result.status).color, statusStyle(result.status).bg)}>
                          {result.status}
                        </span>
                      </td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{result.submissionDate}</td>
                      <td style={s.td}>
                        <button
                          style={{
                            ...s.btnView,
                            ...(btnHov[result.id]
                              ? { background: 'rgba(102,126,234,0.15)', transform: 'translateY(-1px)' }
                              : {}),
                          }}
                          onMouseEnter={() => hov(result.id, true)}
                          onMouseLeave={() => hov(result.id, false)}
                          onClick={() => setSelected(result)}
                        >
                          👁 View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewResults;