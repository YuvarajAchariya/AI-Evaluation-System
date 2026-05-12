import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { questionsAPI } from '../services/api';

/* ─── Style tokens ───────────────────────────────────────────── */
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
    background: 'linear-gradient(90deg,rgba(102,126,234,0.14),rgba(118,75,162,0.08))',
    borderBottom: '1px solid #e0e7ff',
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: '#fff',
    boxShadow: '0 4px 12px rgba(102,126,234,0.35)',
    flexShrink: 0,
  },
  headerTitle: { color: '#1e293b', fontWeight: 800, fontSize: '1.1rem', margin: 0 },
  cardBody: { padding: '24px' },

  /* Add button */
  btnAdd: {
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.85rem',
    padding: '9px 18px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 3px 10px rgba(102,126,234,0.3)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  },

  /* Alert */
  alertSuccess: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 10, padding: '12px 16px',
    color: '#15803d', fontWeight: 600, fontSize: '0.88rem', marginBottom: 20,
  },
  alertDanger: {
    background: '#fff1f2', border: '1px solid #fecdd3',
    borderRadius: 10, padding: '12px 16px',
    color: '#b91c1c', fontWeight: 600, fontSize: '0.88rem', marginBottom: 20,
  },
  alertInfo: {
    background: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: 10, padding: '12px 16px',
    color: '#1d4ed8', fontWeight: 500, fontSize: '0.85rem', marginBottom: 20,
    display: 'flex', alignItems: 'flex-start', gap: 8,
  },

  /* Section title */
  sectionTitle: {
    color: '#1e293b', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  sectionCount: {
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    color: '#fff', borderRadius: 20,
    padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700,
  },

  /* Table */
  tableWrapper: {
    maxHeight: 480, overflowY: 'auto',
    borderRadius: 12, border: '1px solid #e8ecf0',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  thead: { background: 'linear-gradient(90deg,#1e293b,#334155)', position: 'sticky', top: 0, zIndex: 1 },
  th: {
    color: '#cbd5e1', fontWeight: 600, fontSize: '0.72rem',
    letterSpacing: '0.5px', textTransform: 'uppercase',
    padding: '12px 14px', whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 14px', color: '#374151',
    borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle',
  },
  trEven: { background: '#f8fafc' },
  trOdd: { background: '#ffffff' },

  /* Badges */
  badge: (color, bg) => ({
    background: bg, color, border: `1px solid ${color}33`,
    borderRadius: 20, padding: '3px 10px',
    fontSize: '0.7rem', fontWeight: 700, display: 'inline-block',
  }),

  /* Delete button */
  btnDelete: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 7,
    color: '#dc2626', fontWeight: 600, fontSize: '0.78rem',
    padding: '5px 10px', cursor: 'pointer',
    transition: 'background 0.15s',
    fontFamily: 'inherit',
  },

  /* Empty state */
  emptyBox: {
    textAlign: 'center', padding: '48px 20px',
    background: '#f8fafc', borderRadius: 12,
    border: '1px dashed #cbd5e1',
  },
  emptyIcon: { fontSize: '2.5rem', marginBottom: 12 },
  emptyTitle: { color: '#334155', fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 },
  emptyText: { color: '#94a3b8', fontSize: '0.83rem' },

  /* Stats card */
  statsCard: {
    background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  statsHeader: {
    background: 'linear-gradient(90deg,rgba(102,126,234,0.1),rgba(118,75,162,0.06))',
    borderBottom: '1px solid #e0e7ff',
    padding: '12px 18px',
  },
  statsHeaderTitle: { color: '#1e293b', fontWeight: 700, fontSize: '0.88rem', margin: 0 },
  statsBody: { padding: '18px' },
  statsRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid #f1f5f9',
  },
  statsKey: { color: '#64748b', fontWeight: 600, fontSize: '0.83rem' },
  statsVal: { color: '#1e293b', fontWeight: 800, fontSize: '0.95rem' },

  /* ── Modal overlay ── */
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 1055,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '40px 20px', overflowY: 'auto',
  },
  modal: {
    background: '#fff',
    borderRadius: 20,
    width: '100%', maxWidth: 900,
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    background: 'linear-gradient(90deg,#1e293b,#334155)',
    padding: '20px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  modalTitle: { color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 },
  modalClose: {
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 8, color: '#fff', fontSize: '1rem', cursor: 'pointer',
    width: 34, height: 34,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit',
  },
  modalBody: { padding: '28px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' },
  modalFooter: {
    background: '#f8fafc', borderTop: '1px solid #e8ecf0',
    padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10,
  },

  /* Form inputs */
  formGroup: { marginBottom: 16 },
  label: { color: '#374151', fontWeight: 600, fontSize: '0.82rem', marginBottom: 6, display: 'block' },
  input: {
    width: '100%', background: '#fff',
    border: '1px solid #e2e8f0', borderRadius: 8,
    color: '#1e293b', padding: '9px 12px',
    fontSize: '0.875rem', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%', background: '#fff',
    border: '1px solid #e2e8f0', borderRadius: 8,
    color: '#1e293b', padding: '9px 12px',
    fontSize: '0.875rem', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
    resize: 'vertical', minHeight: 72,
    transition: 'border-color 0.15s',
  },
  select: {
    width: '100%', background: '#fff',
    border: '1px solid #e2e8f0', borderRadius: 8,
    color: '#1e293b', padding: '9px 12px',
    fontSize: '0.875rem', outline: 'none',
    fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box',
  },
  formHint: { color: '#94a3b8', fontSize: '0.75rem', marginTop: 4 },

  /* Divider */
  divider: { border: 'none', borderTop: '1px solid #e8ecf0', margin: '20px 0' },

  /* Question card in modal */
  qCard: {
    border: '1px solid #e0e7ff',
    borderLeft: '4px solid #667eea',
    borderRadius: 12, overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(102,126,234,0.08)',
  },
  qCardHead: {
    background: 'linear-gradient(90deg,rgba(102,126,234,0.07),rgba(118,75,162,0.04))',
    borderBottom: '1px solid #e0e7ff',
    padding: '10px 16px',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  qCardHeadNum: { color: '#667eea', fontWeight: 800, fontSize: '0.85rem' },
  qIdBadge: {
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    color: '#fff', borderRadius: 20,
    padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700,
  },
  qCardBody: { padding: '16px' },

  /* Footer buttons */
  btnClear: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 9, color: '#64748b',
    fontWeight: 600, fontSize: '0.83rem',
    padding: '8px 16px', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnCancel: {
    background: '#f1f5f9', border: '1px solid #cbd5e1',
    borderRadius: 9, color: '#475569',
    fontWeight: 600, fontSize: '0.83rem',
    padding: '8px 16px', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSubmit: {
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    border: 'none', borderRadius: 9, color: '#fff',
    fontWeight: 700, fontSize: '0.85rem',
    padding: '9px 20px', cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(102,126,234,0.3)',
    fontFamily: 'inherit',
  },
  btnSubmitDisabled: {
    background: '#e2e8f0', border: 'none',
    borderRadius: 9, color: '#94a3b8',
    fontWeight: 700, fontSize: '0.85rem',
    padding: '9px 20px', cursor: 'not-allowed',
    fontFamily: 'inherit',
  },
};

/* ─── Badge helpers ─────────────────────────────────────────── */
const diffBadge = (d) => {
  const map = {
    easy: { color: '#15803d', bg: '#dcfce7' },
    medium: { color: '#b45309', bg: '#fef3c7' },
    hard: { color: '#b91c1c', bg: '#fee2e2' },
  };
  return map[d] || { color: '#6b7280', bg: '#f3f4f6' };
};
const typeBadge = (t) => {
  const map = {
    descriptive: { color: '#1d4ed8', bg: '#eff6ff' },
    programming: { color: '#0369a1', bg: '#e0f2fe' },
    theory: { color: '#1e293b', bg: '#f1f5f9' },
    practical: { color: '#15803d', bg: '#dcfce7' },
  };
  return map[t] || { color: '#6b7280', bg: '#f3f4f6' };
};

/* ─── Component ─────────────────────────────────────────────── */
const UploadAnswerSchema = ({ user, subjectId }) => {
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [btnHov, setBtnHov] = useState({});
  const hov = (k, v) => setBtnHov(h => ({ ...h, [k]: v }));

  const [bulkQuestions, setBulkQuestions] = useState([
    { questionText: '', referenceAnswer: '', marks: '' },
    { questionText: '', referenceAnswer: '', marks: '' },
    { questionText: '', referenceAnswer: '', marks: '' },
    { questionText: '', referenceAnswer: '', marks: '' },
    { questionText: '', referenceAnswer: '', marks: '' },
  ]);

  const [commonForm, setCommonForm] = useState({
    questionId: '',
    subjectName: user?.subject || 'General',
    difficulty: 'medium',
    questionType: 'descriptive',
    keywords: '',
  });

  /* ── Load questions ── */
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionsAPI.getQuestionsBySubject(subjectId);
      if (response.data.success) setQuestions(response.data.data);
    } catch (error) {
      console.error('Error loading questions:', error);
      setMessage('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectId) loadQuestions();
  }, [subjectId]);

  /* ── Handlers ── */
  const handleCommonFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'questionId') {
      const fourDigits = value.replace(/\D/g, '').slice(0, 4);
      setCommonForm({ ...commonForm, [name]: fourDigits });
    } else {
      setCommonForm({ ...commonForm, [name]: value });
    }
  };

  const handleBulkQuestionChange = (index, field, value) => {
    const updated = [...bulkQuestions];
    if (field === 'marks') {
      updated[index][field] = value.replace(/\D/g, '').slice(0, 3);
    } else {
      updated[index][field] = value;
    }
    setBulkQuestions(updated);
  };

  const handleAddBulkQuestions = async (e) => {
    e.preventDefault();

    if (!commonForm.questionId) {
      setMessage('Please enter a 4-digit Question ID for all questions');
      return;
    }
    if (!/^\d{4}$/.test(commonForm.questionId)) {
      setMessage('Please enter a valid 4-digit ID (numbers only, 1000-9999)');
      return;
    }

    const invalidQuestions = bulkQuestions.filter(q => !q.questionText || !q.referenceAnswer || !q.marks);
    if (invalidQuestions.length > 0) {
      setMessage(`Please fill in all fields for all 5 questions.`);
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const existingQuestions = questions.filter(q => q.questionId.startsWith(commonForm.questionId));
      if (existingQuestions.length > 0) {
        setMessage(`Question ID ${commonForm.questionId} already exists. Please use a different ID.`);
        return;
      }

      const questionsToCreate = bulkQuestions.map((question, index) => ({
        questionId: `${commonForm.questionId}-${index + 1}`,
        questionText: question.questionText,
        referenceAnswer: question.referenceAnswer,
        maxMarks: parseInt(question.marks),
        subjectId,
        subjectName: commonForm.subjectName,
        difficulty: commonForm.difficulty,
        questionType: commonForm.questionType,
        keywords: commonForm.keywords.split(',').map(k => k.trim()).filter(k => k),
        evaluatorId: user?.id || user?.evaluatorId || null,
      }));

      console.log('📤 Sending bulk questions data:', questionsToCreate);

      const createPromises = questionsToCreate.map(qd => questionsAPI.createQuestion(qd));
      const results = await Promise.all(createPromises);
      const allSuccessful = results.every(r => r.data.success);

      if (allSuccessful) {
        setMessage(`✅ Successfully added all 5 questions with ID: ${commonForm.questionId}`);
        setCommonForm({ questionId: '', subjectName: user?.subject || 'General', difficulty: 'medium', questionType: 'descriptive', keywords: '' });
        setBulkQuestions(Array(5).fill(null).map(() => ({ questionText: '', referenceAnswer: '', marks: '' })));
        setShowModal(false);
        await loadQuestions();
      } else {
        const errors = results.filter(r => !r.data.success).map(r => r.data.error);
        setMessage(`❌ Some questions failed to add: ${errors.join(', ')}`);
      }
    } catch (error) {
      setMessage('❌ Error adding questions: ' + (error.response?.data?.error || 'Failed to add questions'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const response = await questionsAPI.deleteQuestion(questionId);
        if (response.data.success) {
          setMessage('✅ Question deleted successfully');
          await loadQuestions();
        }
      } catch (error) {
        setMessage('❌ Error deleting question: ' + (error.response?.data?.error || 'Delete failed'));
      }
    }
  };

  const handleClearForm = () => {
    setCommonForm({ questionId: '', subjectName: user?.subject || 'General', difficulty: 'medium', questionType: 'descriptive', keywords: '' });
    setBulkQuestions(Array(5).fill(null).map(() => ({ questionText: '', referenceAnswer: '', marks: '' })));
  };

  /* ── Stats ── */
  const totalMarks = questions.reduce((s, q) => s + (q.maxMarks || q.marks || 0), 0);
  const diffCounts = { easy: 0, medium: 0, hard: 0 };
  const typeCounts = { descriptive: 0, programming: 0, theory: 0, practical: 0 };
  questions.forEach(q => {
    if (diffCounts[q.difficulty] !== undefined) diffCounts[q.difficulty]++;
    if (typeCounts[q.questionType] !== undefined) typeCounts[q.questionType]++;
  });

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* ── Modal ── */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={s.modalHeader}>
              <h5 style={s.modalTitle}>➕ Add 5 Questions (Same ID)</h5>
              <button style={s.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Modal body */}
            <div style={s.modalBody}>
              <div style={s.alertInfo}>
                <span>ℹ️</span>
                <span>
                  Enter one 4-digit ID for all 5 questions. Each question will get a unique ID like:{' '}
                  <strong>1234-1</strong>, <strong>1234-2</strong>, etc.
                </span>
              </div>

              {/* Common fields */}
              <Row>
                <Col md={4}>
                  <div style={s.formGroup}>
                    <label style={s.label}>4-Digit Common ID *</label>
                    <input
                      style={s.input}
                      type="text"
                      name="questionId"
                      value={commonForm.questionId}
                      onChange={handleCommonFormChange}
                      placeholder="e.g., 1234"
                      maxLength="4"
                      required
                    />
                    <div style={s.formHint}>Common ID for all 5 questions</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Subject Name *</label>
                    <input
                      style={s.input}
                      type="text"
                      name="subjectName"
                      value={commonForm.subjectName}
                      onChange={handleCommonFormChange}
                      placeholder="Enter subject name"
                      required
                    />
                  </div>
                </Col>
                <Col md={2}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Difficulty</label>
                    <select style={s.select} name="difficulty" value={commonForm.difficulty} onChange={handleCommonFormChange}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </Col>
                <Col md={2}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Type</label>
                    <select style={s.select} name="questionType" value={commonForm.questionType} onChange={handleCommonFormChange}>
                      <option value="descriptive">Descriptive</option>
                      <option value="programming">Programming</option>
                      <option value="theory">Theory</option>
                      <option value="practical">Practical</option>
                    </select>
                  </div>
                </Col>
              </Row>

              <div style={s.formGroup}>
                <label style={s.label}>Common Keywords (comma separated)</label>
                <input
                  style={s.input}
                  type="text"
                  name="keywords"
                  value={commonForm.keywords}
                  onChange={handleCommonFormChange}
                  placeholder="ai, machine learning, neural networks"
                />
              </div>

              <hr style={s.divider} />
              <p style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>
                Enter 5 Questions:
              </p>

              {/* Per-question cards */}
              {bulkQuestions.map((question, index) => (
                <div style={s.qCard} key={index}>
                  <div style={s.qCardHead}>
                    <span style={s.qCardHeadNum}>Question {index + 1}</span>
                    <span style={s.qIdBadge}>
                      ID: {commonForm.questionId || '____'}-{index + 1}
                    </span>
                  </div>
                  <div style={s.qCardBody}>
                    <div style={s.formGroup}>
                      <label style={s.label}>Question Text *</label>
                      <textarea
                        style={s.textarea}
                        value={question.questionText}
                        onChange={e => handleBulkQuestionChange(index, 'questionText', e.target.value)}
                        placeholder={`Enter question ${index + 1} text...`}
                        required
                      />
                    </div>
                    <Row>
                      <Col md={8}>
                        <div style={s.formGroup}>
                          <label style={s.label}>Reference Answer *</label>
                          <textarea
                            style={s.textarea}
                            value={question.referenceAnswer}
                            onChange={e => handleBulkQuestionChange(index, 'referenceAnswer', e.target.value)}
                            placeholder={`Enter reference answer for question ${index + 1}...`}
                            required
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div style={s.formGroup}>
                          <label style={s.label}>Marks *</label>
                          <input
                            style={s.input}
                            type="text"
                            value={question.marks}
                            onChange={e => handleBulkQuestionChange(index, 'marks', e.target.value)}
                            placeholder="e.g., 10"
                            maxLength="3"
                            required
                          />
                          <div style={s.formHint}>Max 999 marks</div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div style={s.modalFooter}>
              <button style={s.btnClear} type="button" onClick={handleClearForm}>Clear Form</button>
              <button style={s.btnCancel} type="button" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                style={loading ? s.btnSubmitDisabled : s.btnSubmit}
                type="button"
                disabled={loading}
                onClick={handleAddBulkQuestions}
              >
                {loading ? '⏳ Adding 5 Questions…' : '✅ Add All 5 Questions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Page ── */}
      <div style={s.wrapper}>
        <div style={s.card}>
          {/* Header */}
          <div style={s.cardHeader}>
            <div style={s.headerLeft}>
              <div style={s.headerIcon}>📋</div>
              <h4 style={s.headerTitle}>Manage Questions &amp; Answers</h4>
            </div>
            <button
              style={{
                ...s.btnAdd,
                ...(btnHov.add ? { transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(102,126,234,0.4)' } : {}),
              }}
              onMouseEnter={() => hov('add', true)}
              onMouseLeave={() => hov('add', false)}
              onClick={() => setShowModal(true)}
            >
              ➕ Add 5 Questions (Same ID)
            </button>
          </div>

          <div style={s.cardBody}>
            {/* Alert */}
            {message && (
              <div style={message.includes('✅') ? s.alertSuccess : s.alertDanger}>
                {message}
              </div>
            )}

            <Row className="g-4">
              {/* Questions table */}
              <Col md={8}>
                <div style={s.sectionTitle}>
                  Existing Questions
                  <span style={s.sectionCount}>{questions.length}</span>
                </div>

                {loading ? (
                  <div style={{ ...s.emptyBox }}>
                    <div style={s.emptyIcon}>⏳</div>
                    <div style={s.emptyTitle}>Loading questions…</div>
                  </div>
                ) : questions.length > 0 ? (
                  <div style={s.tableWrapper}>
                    <table style={s.table}>
                      <thead style={s.thead}>
                        <tr>
                          {['ID', 'Question', 'Reference Answer', 'Marks', 'Difficulty', 'Type', 'Actions'].map(h => (
                            <th key={h} style={s.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map((question, i) => {
                          const diff = diffBadge(question.difficulty);
                          const type = typeBadge(question.questionType);
                          return (
                            <tr key={question._id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                              <td style={s.td}>
                                <span style={s.badge('#334155', '#f1f5f9')}>{question.questionId}</span>
                              </td>
                              <td style={s.td}>
                                <strong style={{ fontSize: '0.83rem', color: '#1e293b' }}>{question.questionText}</strong>
                                {question.keywords && question.keywords.length > 0 && (
                                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {question.keywords.map((kw, ki) => (
                                      <span key={ki} style={s.badge('#64748b', '#f1f5f9')}>{kw}</span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td style={{ ...s.td, maxWidth: 180 }}>
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                  {question.referenceAnswer
                                    ? question.referenceAnswer.substring(0, 100) + '…'
                                    : 'No answer'}
                                </span>
                              </td>
                              <td style={s.td}>
                                <span style={s.badge('#0369a1', '#e0f2fe')}>{question.maxMarks}</span>
                              </td>
                              <td style={s.td}>
                                <span style={s.badge(diff.color, diff.bg)}>{question.difficulty}</span>
                              </td>
                              <td style={s.td}>
                                <span style={s.badge(type.color, type.bg)}>{question.questionType}</span>
                              </td>
                              <td style={s.td}>
                                <button
                                  style={{
                                    ...s.btnDelete,
                                    ...(btnHov[question._id] ? { background: 'rgba(239,68,68,0.15)' } : {}),
                                  }}
                                  onMouseEnter={() => hov(question._id, true)}
                                  onMouseLeave={() => hov(question._id, false)}
                                  onClick={() => handleDeleteQuestion(question._id)}
                                >
                                  🗑 Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={s.emptyBox}>
                    <div style={s.emptyIcon}>❓</div>
                    <div style={s.emptyTitle}>No Questions Added Yet</div>
                    <div style={s.emptyText}>Click "Add 5 Questions" to create your first set of questions.</div>
                  </div>
                )}
              </Col>

              {/* Stats card */}
              <Col md={4}>
                <div style={s.statsCard}>
                  <div style={s.statsHeader}>
                    <p style={s.statsHeaderTitle}>📊 Question Statistics</p>
                  </div>
                  <div style={s.statsBody}>
                    <div style={s.statsRow}>
                      <span style={s.statsKey}>Total Questions</span>
                      <span style={s.statsVal}>{questions.length}</span>
                    </div>
                    <div style={s.statsRow}>
                      <span style={s.statsKey}>Total Marks</span>
                      <span style={s.statsVal}>{totalMarks}</span>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div style={{ ...s.statsKey, marginBottom: 8 }}>By Difficulty</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(diffCounts).map(([d, cnt]) => (
                          <span key={d} style={s.badge(diffBadge(d).color, diffBadge(d).bg)}>
                            {d.charAt(0).toUpperCase() + d.slice(1)}: {cnt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div style={{ ...s.statsKey, marginBottom: 8 }}>By Type</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(typeCounts).map(([t, cnt]) => (
                          <span key={t} style={s.badge(typeBadge(t).color, typeBadge(t).bg)}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}: {cnt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadAnswerSchema;