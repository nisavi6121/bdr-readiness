import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import Sunburst from '../components/Sunburst.jsx'

function TierBadge({ tier }) {
  const cls = {
    'Call Now': 'tier-badge tier-call-now',
    'Follow Up': 'tier-badge tier-follow-up',
    'Nurture': 'tier-badge tier-nurture',
    'Flagged': 'tier-badge tier-flagged',
  }[tier] || 'tier-badge tier-nurture'
  return <span className={cls}>{tier}</span>
}

function KV({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="kv-row">
      <span className="kv-key">{label}</span>
      <span className="kv-val">{String(value)}</span>
    </div>
  )
}

function BreakdownBar({ label, score, max, color }) {
  const pct = max > 0 ? (score / max) * 100 : 0
  return (
    <div className="breakdown-row">
      <span className="breakdown-label">{label}</span>
      <div className="breakdown-bar-bg">
        <div className="breakdown-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="breakdown-num mono">{score.toFixed(1)}</span>
    </div>
  )
}

export default function RecordInspector() {
  const { id } = useParams()
  const [record, setRecord] = useState(null)
  const [engagement, setEngagement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([api.record(id), api.engagement(id)])
      .then(([rec, eng]) => { setRecord(rec); setEngagement(eng) })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading">Loading record…</div>
  if (err) return <div className="loading" style={{ color: 'var(--red)' }}>Error: {err}</div>
  if (!record) return null

  const bd = record.breakdown

  return (
    <div>
      <Link to="/" className="back-link">← Back to Queue</Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {record.first_name} {record.last_name}
          </h1>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>
            {record.title || 'No title'} · {record.entity_type} · {record.lineage_type}
          </div>
        </div>
        <TierBadge tier={record.tier} />
      </div>

      <div className="metric-row" style={{ marginBottom: 20 }}>
        <div className="metric-card">
          <div className="metric-label">Final Score</div>
          <div className="metric-value blue">{bd.final_score.toFixed(1)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Engagement</div>
          <div className="metric-value">{bd.engagement_score.toFixed(1)}<span style={{ fontSize: '0.75rem', color: 'var(--text3)', marginLeft: 4 }}>/100 × 0.60</span></div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Account Fit</div>
          <div className="metric-value">{bd.account_fit_score.toFixed(1)}<span style={{ fontSize: '0.75rem', color: 'var(--text3)', marginLeft: 4 }}>/100 × 0.22</span></div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Profile Fit</div>
          <div className="metric-value">{bd.profile_fit_score.toFixed(1)}<span style={{ fontSize: '0.75rem', color: 'var(--text3)', marginLeft: 4 }}>/100 × 0.18</span></div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Confidence</div>
          <div className={`metric-value conf-${record.confidence.toLowerCase()}`}>{record.confidence}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">DQ Flags</div>
          <div className="metric-value" style={{ color: record.dq_flag_count > 0 ? 'var(--amber)' : 'var(--text)' }}>
            {record.dq_flag_count}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left column: profile + explanation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title">Profile</div>
            <div className="kv-list">
              <KV label="Email" value={record.email} />
              <KV label="Phone" value={record.phone} />
              <KV label="Account" value={record.account_name} />
              <KV label="Industry" value={record.industry} />
              <KV label="Job Level" value={record.job_level} />
              <KV label="Job Persona" value={record.job_persona} />
              <KV label="True Persona" value={record.true_persona} />
              <KV label="Segment" value={record.segment} />
              <KV label="Seg. Multiplier" value={record.segment_multiplier?.toFixed(2)} />
              <KV label="BDR Action" value={record.bdr_action} />
            </div>
            {record.hard_blocker && (
              <div className="blocker-box">
                <strong>Hard Blocker:</strong> {record.hard_blocker_reasons}
              </div>
            )}
            {record.score_explanation && (
              <div className="explanation-box">{record.score_explanation}</div>
            )}
            {record.dq_flags && (
              <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--amber)' }}>
                DQ issues: {record.dq_flags}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Score Breakdown</div>
            <div className="score-breakdown-bars">
              <BreakdownBar label="Engagement (×0.60)" score={bd.engagement_score} max={100} color="var(--accent)" />
              <BreakdownBar label="Account Fit (×0.22)" score={bd.account_fit_score} max={100} color="var(--green)" />
              <BreakdownBar label="Profile Fit (×0.18)" score={bd.profile_fit_score} max={100} color="var(--purple)" />
            </div>
          </div>
        </div>

        {/* Right column: sunburst + engagement history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title">Score Composition</div>
            <Sunburst record={record} />
          </div>

          <div className="card">
            <div className="card-title">Engagement History</div>
            <div className="engagement-section">
              {!engagement || engagement.rows.length === 0
                ? <div className="empty">No campaign history found.</div>
                : (
                  <div className="table-wrap" style={{ border: 'none' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Campaign</th>
                        </tr>
                      </thead>
                      <tbody>
                        {engagement.rows.map((row, i) => (
                          <tr key={i}>
                            <td className="mono" style={{ color: 'var(--text2)' }}>{row.response_date}</td>
                            <td>{row.campaign_type}</td>
                            <td>
                              {row.member_status}
                              {row.is_automated && <span className="auto-tag" style={{ marginLeft: 6 }}>auto</span>}
                            </td>
                            <td className="mono" style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{row.campaign_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
