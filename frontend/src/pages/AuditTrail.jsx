import { useEffect, useState, useRef } from 'react';
import { auditApi, formatDate } from '../api';

const ACTION_ICONS = {
  PROPOSAL_SUBMIT: '📝',
  PROPOSAL_APPROVE: '✅',
  PROPOSAL_REJECT: '❌',
  PROGRESS_UPDATE: '🔄',
  COMMUNITY_REPORT_SUBMIT: '👥',
  COMPLAINT_SUBMIT: '⚠️',
  WRITE: '✏️',
  DELETE: '🗑️',
};

const ACTION_COLORS = {
  PROPOSAL_APPROVE: '#10b981',
  PROPOSAL_REJECT: '#f43f5e',
  PROGRESS_UPDATE: '#4f46e5',
  COMMUNITY_REPORT_SUBMIT: '#8b5cf6',
  COMPLAINT_SUBMIT: '#f59e0b',
};

export default function AuditTrail() {
  const [ledger, setLedger] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    auditApi.getLedger({ limit: 200 }).then(data => {
      setLedger(data.entries || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    setVerifyProgress(0);

    // Animate progress sweep
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 95) { clearInterval(interval); setVerifyProgress(95); }
      else setVerifyProgress(Math.round(p));
    }, 80);

    const result = await auditApi.verify();
    clearInterval(interval);
    setVerifyProgress(100);
    setTimeout(() => { setVerifyResult(result); setVerifying(false); }, 300);
  }

  const filtered = ledger.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      if (!e.action?.toLowerCase().includes(q) && !e.actor?.toLowerCase().includes(q) && !e.table?.toLowerCase().includes(q)) return false;
    }
    if (filterAction && e.action !== filterAction) return false;
    return true;
  });

  const uniqueActions = [...new Set(ledger.map(e => e.action))];

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 12, fontWeight: 600, color: '#6366f1', marginBottom: 16 }}>
            🔗 SHA-256 Hash-Chained Ledger
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Tamper-Evident Audit Trail
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, maxWidth: 700, lineHeight: 1.7 }}>
            Every action is SHA-256 hash-chained — each entry's hash includes the previous entry's hash. If any past record was edited, the chain breaks instantly and is visible to anyone.
          </p>
        </div>

        {/* Verify Block */}
        <div className="glass-card-static" style={{ padding: 28, marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                🔗 Chain Integrity Verification
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {ledger.length} entries in ledger · Click to verify all hashes
              </div>
            </div>

            <button onClick={handleVerify} className="btn-primary" disabled={verifying}
              style={{ minWidth: 200, background: verifyResult?.valid === false ? 'linear-gradient(135deg,#f43f5e,#e11d48)' : undefined }}>
              {verifying ? `Verifying... ${verifyProgress}%` : verifyResult ? 'Re-Verify Chain' : '🔍 Verify Chain Integrity'}
            </button>
          </div>

          {/* Verify Progress */}
          {verifying && (
            <div style={{ marginTop: 16 }}>
              <div className="progress-track" style={{ height: 6 }}>
                <div className="progress-fill" style={{
                  width: `${verifyProgress}%`,
                  background: 'linear-gradient(90deg, #4f46e5, #8b5cf6, #06b6d4)',
                  transition: 'width 0.1s ease',
                }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Hashing entries {Math.round(verifyProgress / 100 * ledger.length)} / {ledger.length}...</div>
            </div>
          )}

          {/* Verify Result */}
          {verifyResult && !verifying && (
            <div style={{
              marginTop: 20, padding: 20, borderRadius: 12,
              background: verifyResult.valid ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
              border: `1px solid ${verifyResult.valid ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              display: 'flex', gap: 16, alignItems: 'flex-start',
            }}>
              <div style={{ fontSize: 36, lineHeight: 1 }}>{verifyResult.valid ? '✅' : '🔴'}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: verifyResult.valid ? '#059669' : '#dc2626', marginBottom: 4 }}>
                  {verifyResult.valid ? 'Chain Intact — Ledger is unmodified' : 'CHAIN BROKEN — Tampering Detected!'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{verifyResult.message}</div>
                {verifyResult.broken_at !== undefined && (
                  <div style={{ marginTop: 10, padding: 12, background: 'rgba(244,63,94,0.1)', borderRadius: 8, fontSize: 12, color: '#dc2626' }}>
                    Broken at entry #{verifyResult.broken_at}: action={verifyResult.entry?.action}, actor={verifyResult.entry?.actor}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                  Verified at {new Date().toLocaleTimeString()} · {verifyResult.total} entries checked
                </div>
              </div>
            </div>
          )}
        </div>

        {/* How it works */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { icon: '📝', title: 'Every Action Logged', desc: 'Proposal, approval, fund release, progress update — all auto-logged with actor + timestamp' },
            { icon: '🔗', title: 'Hash-Chained', desc: 'Each entry\'s SHA-256 hash includes the previous hash. Edit one entry and all subsequent hashes break' },
            { icon: '🔍', title: 'Anyone Can Verify', desc: 'Click "Verify Chain" to traverse all entries. Tampered records are instantly surfaced with entry number' },
          ].map(c => (
            <div key={c.icon} className="glass-card-static" style={{ padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input className="input-glass" style={{ paddingLeft: 38 }} placeholder="Search by action, actor, table..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-glass" style={{ flex: '0 1 200px' }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            <option value="">All Actions</option>
            {uniqueActions.map(a => <option key={a}>{a}</option>)}
          </select>
          <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} entries</div>
        </div>

        {/* Ledger */}
        <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <div className="skeleton" style={{ height: 20, width: '100%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 20, width: '100%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 20, width: '100%' }} />
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 600 }}>
              {filtered.map((entry, i) => (
                <div key={entry.index} style={{
                  display: 'flex', gap: 16, padding: '14px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  alignItems: 'flex-start',
                  background: i === 0 ? 'rgba(99,102,241,0.03)' : 'transparent',
                }}>
                  {/* Index + icon */}
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 36 }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{ACTION_ICONS[entry.action] || '🔹'}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>#{entry.index}</div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: ACTION_COLORS[entry.action] || '#6366f1',
                      }}>{entry.action}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>by</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{entry.actor}</span>
                      <span style={{ fontSize: 11, color: '#475569' }}>on</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{entry.table}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
                      {new Date(entry.timestamp).toLocaleString('en-IN')}
                    </div>
                    {/* Hash display */}
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#374151', wordBreak: 'break-all' }}>
                      <span style={{ color: '#4b5563' }}>hash: </span>
                      <span style={{ color: '#4f46e5' }}>{entry.hash?.slice(0, 32)}…</span>
                    </div>
                  </div>

                  {/* Chain link icon */}
                  <div style={{ flexShrink: 0, color: '#374151', fontSize: 16 }}>🔗</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

