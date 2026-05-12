import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

/* ─── helpers ─────────────────────────────────────────────────── */
const calcGrade = (pct) => {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

const pctColor  = (p) => p >= 80 ? '#15803d' : p >= 60 ? '#d97706' : '#dc2626';
const pctBg     = (p) => p >= 80 ? '#dcfce7' : p >= 60 ? '#fef3c7' : '#fee2e2';
const pctBar    = (p) => p >= 80 ? '#22c55e' : p >= 60 ? '#f59e0b' : '#ef4444';

const gradeStyle = (g) => {
  const m = {
    'A+': { c: '#15803d', bg: '#dcfce7' }, 'A':  { c: '#15803d', bg: '#dcfce7' },
    'B+': { c: '#b45309', bg: '#fef3c7' }, 'B':  { c: '#b45309', bg: '#fef3c7' },
    'C':  { c: '#0369a1', bg: '#e0f2fe' }, 'D':  { c: '#6b7280', bg: '#f3f4f6' },
    'F':  { c: '#b91c1c', bg: '#fee2e2' },
  };
  return m[g] || { c: '#6b7280', bg: '#f3f4f6' };
};

const statusStyle = (s) => {
  const m = {
    'Completed':    { c: '#15803d', bg: '#dcfce7' },
    'Re-evaluated': { c: '#b45309', bg: '#fef3c7' },
    'Pending':      { c: '#6b7280', bg: '#f3f4f6' },
  };
  return m[s] || { c: '#6b7280', bg: '#f3f4f6' };
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }); }
  catch { return d; }
};

const aggregateByStudent = (docs) => {
  const map = {};
  docs.forEach((doc) => {
    const sid = doc.universalId || doc.studentId || doc.fileId || 'Unknown';
    if (!map[sid]) {
      map[sid] = {
        studentId: sid,
        studentName: doc.studentName || sid,
        totalMarks: 0, maxMarks: 0,
        submissionDate: null,
        requiresCorrection: false,
        evaluationStage: doc.evaluation_stage || '',
        docs: [],
      };
    }
    const e = map[sid];
    e.totalMarks += parseFloat(doc.ai_marks_awarded ?? doc.marksAwarded ?? 0);
    e.maxMarks   += parseFloat(doc.maxMarks ?? 10);
    if (doc.requires_human_correction) e.requiresCorrection = true;
    if (doc.evaluation_stage) e.evaluationStage = doc.evaluation_stage;
    const dt = doc.evaluationDate || doc.timestamp_utc;
    if (dt && (!e.submissionDate || new Date(dt) > new Date(e.submissionDate))) e.submissionDate = dt;
    e.docs.push(doc);
  });

  return Object.values(map).map((e, idx) => {
    const pct = e.maxMarks > 0 ? Math.round((e.totalMarks / e.maxMarks) * 100) : 0;
    let status = 'Completed';
    if (e.requiresCorrection) status = 'Re-evaluated';
    else if (e.evaluationStage === 'pending' || e.evaluationStage === 'initial_ai_evaluation') status = 'Pending';
    return {
      id: idx + 1,
      studentId: e.studentId,
      studentName: e.studentName,
      totalMarks: parseFloat(e.totalMarks.toFixed(2)),
      maxMarks: parseFloat(e.maxMarks.toFixed(0)),
      percentage: pct,
      grade: calcGrade(pct),
      submissionDate: fmtDate(e.submissionDate),
      rawDate: e.submissionDate,
      status,
      questions: e.docs,
    };
  });
};

/* ─── PDF Export ─────────────────────────────────────────────── */
const exportPDF = (results, stats) => {
  const printWin = window.open('', '_blank', 'width=900,height=700');
  const rows = results.map((r, i) => `
    <tr style="background:${i%2===0?'#f8fafc':'#fff'}">
      <td>${r.studentId}</td>
      <td><strong>${r.studentName}</strong></td>
      <td>${r.totalMarks} / ${r.maxMarks}</td>
      <td style="color:${pctColor(r.percentage)};font-weight:700">${r.percentage}%</td>
      <td><span style="background:${gradeStyle(r.grade).bg};color:${gradeStyle(r.grade).c};padding:2px 10px;border-radius:12px;font-weight:700;font-size:0.8rem">${r.grade}</span></td>
      <td><span style="background:${statusStyle(r.status).bg};color:${statusStyle(r.status).c};padding:2px 10px;border-radius:12px;font-size:0.8rem">${r.status}</span></td>
      <td>${r.submissionDate}</td>
    </tr>`).join('');

  printWin.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>Evaluation Results – PDF Export</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',sans-serif;color:#1e293b;background:#fff;padding:28px}
      h1{font-size:1.4rem;font-weight:800;margin-bottom:4px}
      .sub{color:#64748b;font-size:0.85rem;margin-bottom:20px}
      .stats{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
      .stat{background:#f1f5f9;border-radius:10px;padding:14px 20px;min-width:140px;text-align:center}
      .stat-val{font-size:1.6rem;font-weight:800;color:#1e293b}
      .stat-lbl{font-size:0.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
      table{width:100%;border-collapse:collapse;font-size:0.82rem}
      th{background:#1e293b;color:#cbd5e1;font-size:0.7rem;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left}
      td{padding:9px 12px;border-bottom:1px solid #f1f5f9;color:#374151;vertical-align:middle}
      .footer{margin-top:24px;font-size:0.75rem;color:#94a3b8;text-align:right}
      @media print{body{padding:10px}.no-print{display:none}}
    </style></head><body>
    <h1>📊 Evaluation Results</h1>
    <div class="sub">Generated on ${new Date().toLocaleString('en-IN')} · AI Evaluation System</div>
    <div class="stats">
      ${stats.map(st=>`<div class="stat"><div class="stat-val">${st.value}</div><div class="stat-lbl">${st.label}</div></div>`).join('')}
    </div>
    <table>
      <thead><tr>
        <th>Student ID</th><th>Student Name</th><th>Total Marks</th>
        <th>Percentage</th><th>Grade</th><th>Status</th><th>Date</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">AI Evaluation System · Total ${results.length} records exported</div>
    <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  printWin.document.close();
};

/* ─── Generate Report ────────────────────────────────────────── */
const generateReport = (results, stats) => {
  const avgPct = stats.find(s => s.label === 'Average Score')?.raw || 0;
  const topStudents = [...results].sort((a,b) => b.percentage - a.percentage).slice(0, 5);
  const distribution = {
    'A+ / A (≥80%)': results.filter(r => r.percentage >= 80).length,
    'B+ / B (60–79%)': results.filter(r => r.percentage >= 60 && r.percentage < 80).length,
    'C / D (40–59%)': results.filter(r => r.percentage >= 40 && r.percentage < 60).length,
    'F (< 40%)': results.filter(r => r.percentage < 40).length,
  };

  const reportWin = window.open('', '_blank', 'width=960,height=760');
  reportWin.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>Evaluation Report</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',sans-serif;color:#1e293b;background:#f8fafc;padding:32px}
      .page{max-width:860px;margin:0 auto;background:#fff;border-radius:16px;padding:36px;box-shadow:0 8px 32px rgba(0,0,0,0.1)}
      .header{background:linear-gradient(135deg,#1e293b,#334155);color:#fff;border-radius:12px;padding:28px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center}
      .header h1{font-size:1.4rem;font-weight:800;margin-bottom:4px}
      .header p{opacity:.7;font-size:0.85rem}
      .header .icon{font-size:3rem;opacity:.3}
      .section-title{font-size:1rem;font-weight:700;color:#1e293b;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;display:flex;align-items:center;gap:8px}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
      .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;text-align:center}
      .stat-val{font-size:1.8rem;font-weight:800}
      .stat-lbl{font-size:0.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
      .section{margin-bottom:28px}
      .dist-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;font-size:0.88rem}
      .dist-label{width:150px;color:#374151;font-weight:600;flex-shrink:0}
      .dist-bar-track{flex:1;background:#f1f5f9;border-radius:99px;height:10px;overflow:hidden}
      .dist-bar-fill{height:100%;border-radius:99px}
      .dist-count{width:30px;text-align:right;color:#64748b;font-weight:600;font-size:0.8rem}
      table{width:100%;border-collapse:collapse;font-size:0.82rem}
      th{background:#f1f5f9;color:#64748b;font-size:0.7rem;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;font-weight:600}
      td{padding:9px 12px;border-bottom:1px solid #f8fafc;color:#374151}
      .badge{padding:3px 10px;border-radius:12px;font-weight:700;font-size:0.75rem}
      .insights{background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:18px}
      .insight-item{display:flex;gap:10px;margin-bottom:10px;font-size:0.88rem;color:#0c4a6e}
      .footer{margin-top:28px;font-size:0.75rem;color:#94a3b8;text-align:center;padding-top:16px;border-top:1px solid #e2e8f0}
      @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0}}
    </style></head><body>
    <div class="page">
      <div class="header">
        <div>
          <h1>📋 Evaluation Report</h1>
          <p>AI-powered evaluation system · Generated ${new Date().toLocaleString('en-IN')}</p>
        </div>
        <div class="icon">📊</div>
      </div>

      <div class="section">
        <div class="section-title">📈 Summary Statistics</div>
        <div class="stats">
          ${stats.map(st=>`<div class="stat"><div class="stat-val" style="color:${st.color}">${st.value}</div><div class="stat-lbl">${st.label}</div></div>`).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">📊 Grade Distribution</div>
        ${Object.entries(distribution).map(([label, count]) => {
          const pct = results.length > 0 ? Math.round((count/results.length)*100) : 0;
          const color = label.startsWith('A') ? '#22c55e' : label.startsWith('B') ? '#f59e0b' : label.startsWith('C') ? '#0ea5e9' : '#ef4444';
          return `<div class="dist-row">
            <div class="dist-label">${label}</div>
            <div class="dist-bar-track"><div class="dist-bar-fill" style="width:${pct}%;background:${color}"></div></div>
            <div class="dist-count">${count}</div>
          </div>`;
        }).join('')}
      </div>

      <div class="section">
        <div class="section-title">🏆 Top 5 Performers</div>
        <table>
          <thead><tr><th>#</th><th>Student ID</th><th>Name</th><th>Marks</th><th>Score</th><th>Grade</th></tr></thead>
          <tbody>${topStudents.map((r,i)=>`
            <tr style="background:${i%2===0?'#f8fafc':'#fff'}">
              <td><strong>${i+1}</strong></td>
              <td>${r.studentId}</td>
              <td><strong>${r.studentName}</strong></td>
              <td>${r.totalMarks} / ${r.maxMarks}</td>
              <td style="color:${pctColor(r.percentage)};font-weight:700">${r.percentage}%</td>
              <td><span class="badge" style="background:${gradeStyle(r.grade).bg};color:${gradeStyle(r.grade).c}">${r.grade}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">💡 Insights</div>
        <div class="insights">
          <div class="insight-item">📌 <span>Total of <strong>${results.length}</strong> students were evaluated in this session.</span></div>
          <div class="insight-item">✅ <span><strong>${distribution['A+ / A (≥80%)']}</strong> students achieved an A grade (≥80%).</span></div>
          <div class="insight-item">⚠️ <span><strong>${distribution['F (< 40%)']}</strong> students scored below 40% and may need extra support.</span></div>
          <div class="insight-item">🔄 <span><strong>${results.filter(r=>r.status==='Re-evaluated').length}</strong> evaluations were flagged for re-evaluation by the AI.</span></div>
          <div class="insight-item">📊 <span>Class average score is <strong>${avgPct.toFixed(1)}%</strong>.</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📋 Full Evaluation Results</div>
        <table>
          <thead><tr><th>#</th><th>Student ID</th><th>Name</th><th>Marks</th><th>Score</th><th>Grade</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>${results.map((r,i)=>`
            <tr style="background:${i%2===0?'#f8fafc':'#fff'}">
              <td>${i+1}</td>
              <td>${r.studentId}</td>
              <td><strong>${r.studentName}</strong></td>
              <td>${r.totalMarks} / ${r.maxMarks}</td>
              <td style="color:${pctColor(r.percentage)};font-weight:700">${r.percentage}%</td>
              <td><span class="badge" style="background:${gradeStyle(r.grade).bg};color:${gradeStyle(r.grade).c}">${r.grade}</span></td>
              <td><span class="badge" style="background:${statusStyle(r.status).bg};color:${statusStyle(r.status).c}">${r.status}</span></td>
              <td>${r.submissionDate}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">AI Evaluation System · Confidential Report · ${new Date().toLocaleDateString('en-IN')}</div>
    </div>
    <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`);
  reportWin.document.close();
};

/* ─── Style tokens ───────────────────────────────────────────── */
const s = {
  wrapper: { padding: '28px', background: '#f8fafc', minHeight: '100%', fontFamily: "'Inter','Segoe UI',sans-serif" },
  card: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', marginBottom: 24 },
  cardHeader: { background: 'linear-gradient(90deg,#1e293b,#334155)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontWeight: 700, fontSize: '1rem', margin: 0 },
  cardBody: { padding: '24px' },

  statCard: (accent) => ({ background: `linear-gradient(135deg,rgba(${accent},.09),rgba(${accent},.04))`, border: `1px solid rgba(${accent},.2)`, borderRadius: 14, padding: '20px', textAlign: 'center' }),
  statNum: (color) => ({ fontSize: '2rem', fontWeight: 800, color, margin: 0 }),
  statLabel: { color: '#94a3b8', fontSize: '0.78rem', marginTop: 6, display: 'block' },

  filterBar: { background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  filterGroup: { display: 'flex', alignItems: 'center', gap: 10 },
  filterLabel: { color: '#64748b', fontWeight: 600, fontSize: '0.83rem' },
  select: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b', padding: '7px 12px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' },

  tableWrapper: { borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  thead: { background: 'linear-gradient(90deg,#1e293b,#334155)' },
  th: { color: '#cbd5e1', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '12px 16px', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', color: '#374151', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  trEven: { background: '#f8fafc' }, trOdd: { background: '#fff' },
  progressTrack: { background: '#f1f5f9', borderRadius: 99, height: 6, overflow: 'hidden', marginTop: 5 },

  badge: (color, bg) => ({ background: bg, color, border: `1px solid ${color}33`, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-block' }),

  btn: (grad, shadow) => ({ background: grad, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.83rem', padding: '9px 20px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: shadow || 'none', transition: 'transform .15s,box-shadow .15s', fontFamily: 'inherit' }),

  empty: { textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: '0.9rem' },
  loading: { textAlign: 'center', padding: '48px 0', color: '#0ea5e9', fontSize: '0.9rem' },
  errorTd: { textAlign: 'center', padding: '48px 0', color: '#dc2626', fontSize: '0.9rem' },

  /* Modal */
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 820, maxHeight: '90vh', boxShadow: '0 24px 64px rgba(0,0,0,.22)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader: { background: 'linear-gradient(90deg,#1e293b,#334155)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  modalTitle: { color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 },
  modalClose: { background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 8, color: '#fff', fontSize: '1.1rem', cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { overflowY: 'auto', padding: 24, flex: 1 },

  studentStrip: { background: 'linear-gradient(90deg,rgba(14,165,233,.08),rgba(6,182,212,.05))', border: '1px solid #e0f2fe', borderRadius: 12, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 },
  stripItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  stripKey: { color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' },
  stripVal: { color: '#1e293b', fontSize: '0.88rem', fontWeight: 700 },

  qCard: { border: '1px solid #e8ecf0', borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  qHead: { background: 'linear-gradient(90deg,#f8fafc,#f1f5f9)', borderBottom: '1px solid #e8ecf0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  qBody: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  fieldLabel: { color: '#64748b', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'block' },
  fieldText: { color: '#374151', fontSize: '0.85rem', lineHeight: 1.6, background: '#f8fafc', border: '1px solid #e8ecf0', borderRadius: 8, padding: '10px 14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  pill: (color, bg) => ({ background: bg, color, border: `1px solid ${color}33`, borderRadius: 20, padding: '3px 12px', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }),
  miniTrack: { flex: 1, minWidth: 80, height: 7, borderRadius: 99, background: '#f1f5f9', position: 'relative', overflow: 'hidden' },
  miniFill: (p) => ({ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(p,100)}%`, background: pctBar(p), borderRadius: 99, transition: 'width .5s' }),
};

/* ─── Details Modal ─────────────────────────────────────────── */
const DetailsModal = ({ student, onClose }) => {
  if (!student) return null;
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h5 style={s.modalTitle}>📋 Student Evaluation Details</h5>
          <button style={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <div style={s.studentStrip}>
            {[
              { k: 'Student ID',   v: student.studentId },
              { k: 'Name',         v: student.studentName },
              { k: 'Total Marks',  v: `${student.totalMarks} / ${student.maxMarks}` },
              { k: 'Percentage',   v: `${student.percentage}%` },
              { k: 'Grade',        v: student.grade },
              { k: 'Status',       v: student.status },
              { k: 'Date',         v: student.submissionDate },
            ].map(({ k, v }) => (
              <div style={s.stripItem} key={k}>
                <span style={s.stripKey}>{k}</span>
                <span style={s.stripVal}>{v}</span>
              </div>
            ))}
          </div>

          {student.questions.length === 0 ? (
            <p style={s.empty}>No question details available.</p>
          ) : student.questions.map((q, i) => {
            const awarded = parseFloat(q.ai_marks_awarded ?? q.marksAwarded ?? 0);
            const maxM    = parseFloat(q.maxMarks ?? 10);
            const qPct    = maxM > 0 ? Math.round((awarded / maxM) * 100) : 0;
            const qNum    = q.questionNumber || q.questionId || (i + 1);
            const fb      = q.ai_feedback || q.detailed_feedback || q.justification || '—';

            return (
              <div style={s.qCard} key={q._id || i}>
                <div style={s.qHead}>
                  <span style={{ color: '#0ea5e9', fontWeight: 800, fontSize: '0.82rem' }}>Question {qNum}</span>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    <span style={s.pill(pctColor(qPct), pctBg(qPct))}>🎯 {awarded} / {maxM}</span>
                    {q.is_answer_correct === true  && <span style={s.pill('#15803d','#dcfce7')}>✔ Correct</span>}
                    {q.is_answer_correct === false && <span style={s.pill('#b91c1c','#fee2e2')}>✘ Incorrect</span>}
                    {q.requires_human_correction   && <span style={s.pill('#b45309','#fef3c7')}>⚠ Needs Review</span>}
                  </div>
                </div>
                <div style={s.qBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={s.fieldLabel}>Score</span>
                    <span style={{ color: pctColor(qPct), fontWeight: 700, fontSize: '0.82rem' }}>{qPct}%</span>
                  </div>
                  <div style={s.miniTrack}><div style={s.miniFill(qPct)} /></div>

                  {(q.questionText || q.questionName) && (
                    <div><span style={s.fieldLabel}>❓ Question</span>
                    <div style={s.fieldText}>{q.questionText || q.questionName}</div></div>
                  )}
                  {q.studentAnswer && (
                    <div><span style={s.fieldLabel}>✍️ Student Answer</span>
                    <div style={s.fieldText}>{q.studentAnswer}</div></div>
                  )}
                  {q.referenceAnswer && (
                    <div><span style={s.fieldLabel}>📖 Reference Answer</span>
                    <div style={{ ...s.fieldText, borderColor: '#bbf7d0', background: '#f0fdf4' }}>{q.referenceAnswer}</div></div>
                  )}
                  <div><span style={s.fieldLabel}>🤖 AI Feedback</span>
                  <div style={{ ...s.fieldText, borderColor: '#bae6fd', background: '#f0f9ff' }}>{fb}</div></div>

                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b' }}>
                    {q.ai_model_used && <span><strong>Model:</strong> {q.ai_model_used}</span>}
                    {q.evaluation_stage && <span><strong>Stage:</strong> {q.evaluation_stage}</span>}
                    {(q.evaluationDate || q.timestamp_utc) && <span><strong>Evaluated:</strong> {fmtDate(q.evaluationDate || q.timestamp_utc)}</span>}
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

/* ─── Main Component ─────────────────────────────────────────── */
const ViewResults = () => {
  const [filter,   setFilter]   = useState('all');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [btnHov,   setBtnHov]   = useState({});
  const hov = (k, v) => setBtnHov(h => ({ ...h, [k]: v }));

  /* Fetch */
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch('http://localhost:5000/api/all-evaluations');
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setResults(aggregateByStudent(Array.isArray(data) ? data : (data.data || [])));
      } catch (e) {
        setError(e.message || 'Failed to fetch evaluations');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* Derived */
  const filtered     = filter === 'all' ? results : results.filter(r => r.status === filter);
  const total        = results.length;
  const avgPct       = total > 0 ? results.reduce((a,r) => a + r.percentage, 0) / total : 0;
  const topPerformer = total > 0 ? results.reduce((t, c) => c.percentage > t.percentage ? c : t, results[0]) : null;
  const reEvalCount  = results.filter(r => r.status === 'Re-evaluated').length;

  const stats = [
    { label: 'Total Students', value: total,                  raw: total,   color: '#3b82f6', accent: '59,130,246' },
    { label: 'Average Score',  value: `${avgPct.toFixed(1)}%`, raw: avgPct, color: '#22c55e', accent: '34,197,94'  },
    { label: 'Highest Grade',  value: topPerformer ? topPerformer.grade : '—', raw: 0, color: '#f59e0b', accent: '245,158,11' },
    { label: 'Re-evaluated',   value: reEvalCount,            raw: reEvalCount, color: '#0ea5e9', accent: '14,165,233' },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');`}</style>

      {selected && <DetailsModal student={selected} onClose={() => setSelected(null)} />}

      <div style={s.wrapper}>

        {/* Page header */}
        <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', color: '#fff', borderRadius: 16, padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
          <div>
            <h4 style={{ fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>📊 Evaluation Results</h4>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.83rem', margin: '4px 0 0' }}>All student evaluations from the AI system</p>
          </div>
          <span style={{ fontSize: '2.8rem', opacity: .2 }}>🎓</span>
        </div>

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

        {/* Main table card */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h5 style={s.headerTitle}>🗂 Student Evaluation Records</h5>
            <button
              style={{ ...s.btn('linear-gradient(135deg,#3b82f6,#6366f1)'), ...(btnHov.refresh ? { transform: 'translateY(-1px)' } : {}) }}
              onMouseEnter={() => hov('refresh', true)}
              onMouseLeave={() => hov('refresh', false)}
              onClick={() => { setLoading(true); setError(null); fetch('http://localhost:5000/api/all-evaluations').then(r=>r.json()).then(d=>setResults(aggregateByStudent(Array.isArray(d)?d:(d.data||[])))).catch(e=>setError(e.message)).finally(()=>setLoading(false)); }}
            >🔄 Refresh</button>
          </div>

          <div style={s.cardBody}>
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
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                Showing {filtered.length} of {total} records
              </span>
            </div>

            {/* Table */}
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead style={s.thead}>
                  <tr>
                    {['#', 'Student ID', 'Student Name', 'Total Marks', 'Score', 'Grade', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={s.loading}>⏳ Loading evaluations…</td></tr>
                  ) : error ? (
                    <tr><td colSpan={9} style={s.errorTd}>⚠️ {error}</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={9} style={s.empty}>📭 No records found.</td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={r.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                      <td style={{ ...s.td, color: '#94a3b8', width: 40 }}>{i + 1}</td>
                      <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.studentId}</td>
                      <td style={s.td}><strong>{r.studentName}</strong></td>
                      <td style={{ ...s.td, minWidth: 130 }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{r.totalMarks}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}> / {r.maxMarks}</span>
                        <div style={s.progressTrack}>
                          <div style={{ height: '100%', width: `${r.percentage}%`, background: pctBar(r.percentage), borderRadius: 99, transition: 'width .4s' }} />
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(pctColor(r.percentage), pctBg(r.percentage))}>{r.percentage}%</span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(gradeStyle(r.grade).c, gradeStyle(r.grade).bg)}>{r.grade}</span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(statusStyle(r.status).c, statusStyle(r.status).bg)}>{r.status}</span>
                      </td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#64748b' }}>{r.submissionDate}</td>
                      <td style={s.td}>
                        <button
                          style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.07))', border: '1px solid rgba(99,102,241,.3)', borderRadius: 8, color: '#6366f1', fontWeight: 600, fontSize: '0.78rem', padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .15s', ...(btnHov[r.id] ? { transform: 'translateY(-1px)' } : {}) }}
                          onMouseEnter={() => hov(r.id, true)}
                          onMouseLeave={() => hov(r.id, false)}
                          onClick={() => setSelected(r)}
                        >👁 Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Export card */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h5 style={s.headerTitle}>⬇️ Export Options</h5>
          </div>
          <div style={{ padding: '22px 24px', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {/* Export PDF */}
            <button
              disabled={loading || results.length === 0}
              style={{
                ...s.btn('linear-gradient(135deg,#ef4444,#dc2626)', '0 4px 14px rgba(239,68,68,.35)'),
                opacity: (loading || results.length === 0) ? .5 : 1,
                ...(btnHov.pdf ? { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(239,68,68,.45)' } : {}),
              }}
              onMouseEnter={() => hov('pdf', true)}
              onMouseLeave={() => hov('pdf', false)}
              onClick={() => exportPDF(filtered, stats)}
            >
              📄 Export as PDF
            </button>

            {/* Generate Report */}
            <button
              disabled={loading || results.length === 0}
              style={{
                ...s.btn('linear-gradient(135deg,#6366f1,#7c3aed)', '0 4px 14px rgba(99,102,241,.35)'),
                opacity: (loading || results.length === 0) ? .5 : 1,
                ...(btnHov.report ? { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(99,102,241,.45)' } : {}),
              }}
              onMouseEnter={() => hov('report', true)}
              onMouseLeave={() => hov('report', false)}
              onClick={() => generateReport(results, stats)}
            >
              📋 Generate Report
            </button>

            <span style={{ color: '#94a3b8', fontSize: '0.8rem', alignSelf: 'center', marginLeft: 6 }}>
              {results.length > 0 ? `${results.length} records ready` : 'No data to export'}
            </span>
          </div>
        </div>

      </div>
    </>
  );
};

export default ViewResults;