import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';

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
    marginBottom: 24,
  },
  cardHeader: {
    background: 'linear-gradient(90deg,rgba(168,85,247,0.12),rgba(139,92,246,0.07))',
    borderBottom: '1px solid #ede9fe',
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
    boxShadow: '0 4px 12px rgba(168,85,247,0.35)',
    flexShrink: 0,
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { color: '#1e293b', fontWeight: 800, fontSize: '1.1rem', margin: 0 },
  headerSub: { color: '#7e22ce', fontSize: '0.78rem', marginTop: 2 },
  cardBody: { padding: '24px' },

  /* Stat cards */
  statCard: (accent) => ({
    background: `linear-gradient(135deg,rgba(${accent},0.08),rgba(${accent},0.03))`,
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

  /* Filter / controls bar */
  filterBar: {
    background: '#f8fafc',
    border: '1px solid #e8ecf0',
    borderRadius: 12,
    padding: '14px 20px',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterGroup: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
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
  inputSearch: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    color: '#1e293b',
    padding: '8px 14px',
    fontSize: '0.85rem',
    outline: 'none',
    fontFamily: 'inherit',
    width: 200,
  },

  /* Refresh button */
  btnRefresh: {
    background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.83rem',
    padding: '9px 18px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 3px 10px rgba(168,85,247,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },

  /* Table */
  tableWrapper: {
    borderRadius: 12,
    overflow: 'auto',
    border: '1px solid #e8ecf0',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  thead: { background: 'linear-gradient(90deg,#1e293b,#334155)' },
  th: {
    color: '#cbd5e1',
    fontWeight: 600,
    fontSize: '0.72rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    padding: '13px 14px',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 14px',
    color: '#374151',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  },
  trEven: { background: '#f8fafc' },
  trOdd:  { background: '#ffffff' },

  /* Badges */
  badge: (color, bg) => ({
    background: bg,
    color,
    border: `1px solid ${color}33`,
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.3px',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  }),

  /* Pagination */
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  pageInfo: { color: '#64748b', fontSize: '0.82rem' },
  pageBtn: (active) => ({
    background: active ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : '#fff',
    border: active ? 'none' : '1px solid #e2e8f0',
    borderRadius: 8,
    color: active ? '#fff' : '#374151',
    fontWeight: active ? 700 : 500,
    fontSize: '0.82rem',
    padding: '6px 14px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    boxShadow: active ? '0 2px 8px rgba(168,85,247,0.35)' : 'none',
  }),

  /* Empty / Loading / Error */
  center: { textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: '0.9rem' },

  /* Expanded detail panel */
  detailPanel: {
    background: '#f8fafc',
    border: '1px solid #ede9fe',
    borderRadius: 12,
    padding: '16px 20px',
    marginTop: 4,
    fontSize: '0.83rem',
    color: '#475569',
    lineHeight: 1.7,
  },
  detailRow: { display: 'flex', gap: 8, marginBottom: 4 },
  detailKey: { color: '#64748b', fontWeight: 600, minWidth: 130, flexShrink: 0 },
  detailVal: { color: '#1e293b', wordBreak: 'break-word' },

  btnExpand: {
    background: 'transparent',
    border: '1px solid rgba(168,85,247,0.35)',
    borderRadius: 8,
    color: '#a855f7',
    fontWeight: 600,
    fontSize: '0.75rem',
    padding: '4px 10px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    whiteSpace: 'nowrap',
  },
};

/* ─── Helpers ───────────────────────────────────────────────────── */
const fmtDate = (ts) => {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
};

const scoreGapBadge = (gap) => {
  if (gap === 0) return s.badge('#15803d', '#dcfce7');
  if (gap > 0)   return s.badge('#b45309', '#fef3c7');
  return                s.badge('#b91c1c', '#fee2e2');
};

const scoreGapLabel = (gap) => {
  if (gap === 0) return '✔ Agreed';
  if (gap > 0)   return `+${gap} Override`;
  return `${gap} Override`;
};

const PAGE_SIZE = 15;

/* ─── Component ─────────────────────────────────────────────────── */
const FeedbackView = ({ subjectId }) => {
  const [records,    setRecords]    = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterGap,  setFilterGap]  = useState('all');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [expanded,   setExpanded]   = useState({});
  const [btnHov,     setBtnHov]     = useState({});
  const hov = (k, v) => setBtnHov(h => ({ ...h, [k]: v }));

  /* ── Fetch records ── */
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const res  = await fetch(`http://localhost:5000/api/feedback-memory?limit=200&skip=0`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load feedback memory.');
      setRecords(data.records || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  /* ── Fetch stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch('http://localhost:5000/api/feedback-memory/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchRecords(); fetchStats(); }, [fetchRecords, fetchStats]);

  /* ── Filter + search ── */
  const filtered = records.filter(r => {
    const matchGap =
      filterGap === 'all'        ? true :
      filterGap === 'agreed'     ? r.score_gap === 0 :
      filterGap === 'overridden' ? r.score_gap !== 0 : true;

    const q = search.toLowerCase();
    const matchSearch = !q || (
      (r.question      || '').toLowerCase().includes(q) ||
      (r.student_label || '').toLowerCase().includes(q) ||
      (r.question_id   || '').toLowerCase().includes(q) ||
      (r.base_id       || '').toLowerCase().includes(q)
    );
    return matchGap && matchSearch;
  });

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const pageRecords = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  /* ── Stat card values ── */
  const overrideCount  = records.filter(r => r.score_gap !== 0).length;
  const agreedCount    = records.filter(r => r.score_gap === 0).length;
  const avgAiScore     = records.length ? (records.reduce((a, r) => a + (r.ai_score || 0), 0) / records.length).toFixed(2) : '—';
  const overridePct    = records.length ? ((overrideCount / records.length) * 100).toFixed(1) : '—';

  const statCards = [
    { label: 'Total Records',    value: total || records.length, color: '#7c3aed', accent: '124,58,237' },
    { label: 'AI Agreed',        value: agreedCount,             color: '#15803d', accent: '21,128,61'  },
    { label: 'Overrides',        value: overrideCount,           color: '#d97706', accent: '217,119,6'  },
    { label: 'Override Rate',    value: `${overridePct}%`,       color: '#be123c', accent: '190,18,60'  },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={s.wrapper}>

        {/* ── Main card ── */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.headerIcon}>🧠</div>
            <div style={s.headerTitleWrap}>
              <h4 style={s.headerTitle}>Feedback Memory</h4>
              <div style={s.headerSub}>AI learning history from evaluator corrections</div>
            </div>
          </div>

          <div style={s.cardBody}>
            {/* ── Stats ── */}
            <Row className="g-3 mb-4">
              {statCards.map(sc => (
                <Col md={3} key={sc.label}>
                  <div style={s.statCard(sc.accent)}>
                    <h3 style={s.statNum(sc.color)}>{sc.value}</h3>
                    <span style={s.statLabel}>{sc.label}</span>
                  </div>
                </Col>
              ))}
            </Row>

            {/* ── Additional stats from /stats endpoint ── */}
            {stats && (
              <div style={{
                background: 'linear-gradient(135deg,rgba(168,85,247,0.06),rgba(124,58,237,0.03))',
                border: '1px solid rgba(168,85,247,0.18)',
                borderRadius: 12,
                padding: '14px 20px',
                marginBottom: 20,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 24,
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.8rem' }}>MAE (Score Gap)</span>
                  <div style={{ color: '#1e293b', fontWeight: 800, fontSize: '1.1rem' }}>
                    {stats.mae !== undefined ? stats.mae.toFixed(3) : '—'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.8rem' }}>Avg AI Score</span>
                  <div style={{ color: '#1e293b', fontWeight: 800, fontSize: '1.1rem' }}>{avgAiScore}</div>
                </div>
                {stats.totalRecords !== undefined && (
                  <div>
                    <span style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.8rem' }}>Total in DB</span>
                    <div style={{ color: '#1e293b', fontWeight: 800, fontSize: '1.1rem' }}>{stats.totalRecords}</div>
                  </div>
                )}
                {stats.overrideRate !== undefined && (
                  <div>
                    <span style={{ color: '#7e22ce', fontWeight: 700, fontSize: '0.8rem' }}>Override Rate</span>
                    <div style={{ color: '#1e293b', fontWeight: 800, fontSize: '1.1rem' }}>
                      {(stats.overrideRate * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Filter bar ── */}
            <div style={s.filterBar}>
              <div style={s.filterGroup}>
                <span style={s.filterLabel}>Filter:</span>
                <select style={s.select} value={filterGap} onChange={e => { setFilterGap(e.target.value); setPage(1); }}>
                  <option value="all">All Records</option>
                  <option value="agreed">AI Agreed</option>
                  <option value="overridden">Overridden</option>
                </select>
                <input
                  style={s.inputSearch}
                  type="text"
                  placeholder="Search question / student / ID…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <button
                style={{
                  ...s.btnRefresh,
                  ...(btnHov.refresh ? { transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(168,85,247,0.5)' } : {}),
                  opacity: loading ? 0.7 : 1,
                }}
                onClick={() => { fetchRecords(); fetchStats(); }}
                disabled={loading}
                onMouseEnter={() => hov('refresh', true)}
                onMouseLeave={() => hov('refresh', false)}
              >
                🔄 Refresh
              </button>
            </div>

            {/* ── Content ── */}
            {loading ? (
              <div style={s.center}>
                <Spinner animation="border" style={{ color: '#a855f7', width: 40, height: 40 }} />
                <p style={{ marginTop: 14 }}>Loading feedback memory...</p>
              </div>
            ) : error ? (
              <div style={{
                background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12,
                padding: '20px 24px', color: '#be123c', textAlign: 'center',
              }}>
                <strong>⚠️ Error:</strong> {error}
              </div>
            ) : filtered.length === 0 ? (
              <div style={s.center}>🧠 No feedback memory records found.</div>
            ) : (
              <>
                <div style={s.tableWrapper}>
                  <table style={s.table}>
                    <thead style={s.thead}>
                      <tr>
                        {['#', 'Student', 'Question', 'Student Answer', 'AI Score', 'Eval Score', 'Gap', 'Feedback', 'Timestamp', ''].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRecords.map((r, i) => {
                        const rowIdx = (safePage - 1) * PAGE_SIZE + i;
                        const isEven = rowIdx % 2 === 0;
                        const rowId  = r._id || r.record_id || i;
                        const isExp  = !!expanded[rowId];

                        return (
                          <React.Fragment key={rowId}>
                            <tr style={isEven ? s.trEven : s.trOdd}>
                              <td style={{ ...s.td, color: '#94a3b8', fontSize: '0.78rem' }}>
                                {r.record_id ?? rowIdx + 1}
                              </td>
                              <td style={s.td}>
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{r.student_label || '—'}</span>
                              </td>
                              <td style={{ ...s.td, maxWidth: 180 }}>
                                <span style={{ color: '#374151' }} title={r.question}>
                                  {r.question ? (r.question.length > 55 ? r.question.slice(0, 55) + '…' : r.question) : '—'}
                                </span>
                                {r.question_id && (
                                  <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 2 }}>
                                    ID: {r.question_id}
                                  </div>
                                )}
                              </td>
                              <td style={{ ...s.td, maxWidth: 160 }}>
                                <span title={r.student_answer}>
                                  {r.student_answer ? (r.student_answer.length > 45 ? r.student_answer.slice(0, 45) + '…' : r.student_answer) : '—'}
                                </span>
                              </td>
                              <td style={{ ...s.td, textAlign: 'center' }}>
                                <span style={{ fontWeight: 700, color: '#7c3aed' }}>{r.ai_score ?? '—'}</span>
                              </td>
                              <td style={{ ...s.td, textAlign: 'center' }}>
                                <span style={{ fontWeight: 700, color: '#15803d' }}>{r.evaluator_score ?? '—'}</span>
                              </td>
                              <td style={{ ...s.td, textAlign: 'center' }}>
                                <span style={scoreGapBadge(r.score_gap ?? 0)}>
                                  {scoreGapLabel(r.score_gap ?? 0)}
                                </span>
                              </td>
                              <td style={{ ...s.td, maxWidth: 160 }}>
                                <span title={r.evaluator_feedback}>
                                  {r.evaluator_feedback
                                    ? (r.evaluator_feedback.length > 40 ? r.evaluator_feedback.slice(0, 40) + '…' : r.evaluator_feedback)
                                    : '—'}
                                </span>
                              </td>
                              <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: '0.77rem', color: '#64748b' }}>
                                {fmtDate(r.timestamp)}
                              </td>
                              <td style={s.td}>
                                <button
                                  style={{
                                    ...s.btnExpand,
                                    background: isExp ? 'rgba(168,85,247,0.08)' : 'transparent',
                                  }}
                                  onClick={() => toggleExpand(rowId)}
                                >
                                  {isExp ? '▲ Less' : '▼ More'}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded detail row */}
                            {isExp && (
                              <tr style={{ background: '#faf5ff' }}>
                                <td colSpan={10} style={{ padding: '0 14px 14px 14px', borderBottom: '1px solid #ede9fe' }}>
                                  <div style={s.detailPanel}>
                                    {[
                                      ['Full Question',      r.question],
                                      ['Full Student Answer',r.student_answer],
                                      ['Evaluator Feedback', r.evaluator_feedback],
                                      ['Override Reason',    r.override_reason],
                                      ['Question ID',        r.question_id],
                                      ['Base ID',            r.base_id],
                                      ['FAISS Index',        r.faiss_index],
                                      ['Record ID',          r.record_id],
                                      ['Timestamp',          fmtDate(r.timestamp)],
                                    ].map(([k, v]) => v !== undefined && v !== null && v !== '' ? (
                                      <div key={k} style={s.detailRow}>
                                        <span style={s.detailKey}>{k}:</span>
                                        <span style={s.detailVal}>{String(v)}</span>
                                      </div>
                                    ) : null)}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                <div style={s.pagination}>
                  <span style={s.pageInfo}>
                    Showing {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={s.pageBtn(false)} disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                      ‹ Prev
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const pg = totalPages <= 7 ? i + 1 : (safePage <= 4 ? i + 1 : safePage - 3 + i);
                      if (pg < 1 || pg > totalPages) return null;
                      return (
                        <button key={pg} style={s.pageBtn(pg === safePage)} onClick={() => setPage(pg)}>
                          {pg}
                        </button>
                      );
                    })}
                    <button style={s.pageBtn(false)} disabled={safePage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                      Next ›
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default FeedbackView;
