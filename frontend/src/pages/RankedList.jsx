import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

function TierBadge({ tier }) {
  const cls = {
    'Call Now': 'tier-badge tier-call-now',
    'Follow Up': 'tier-badge tier-follow-up',
    'Nurture': 'tier-badge tier-nurture',
    'Flagged': 'tier-badge tier-flagged',
  }[tier] || 'tier-badge tier-nurture'
  return <span className={cls}>{tier}</span>
}

function ScoreBar({ score }) {
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{ width: `${score}%` }} />
      </div>
      <span className="score-num mono">{score.toFixed(1)}</span>
    </div>
  )
}

function Conf({ val }) {
  const cls = { High: 'conf-high', Medium: 'conf-medium', Low: 'conf-low' }[val] || ''
  return <span className={cls}>{val}</span>
}

export default function RankedList() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState({ tiers: [], entity_types: [], industries: [] })
  const [portfolio, setPortfolio] = useState(null)

  const [filters, setFilters] = useState({
    tier: 'Call Now,Follow Up',
    entity_type: '',
    industry: '',
    named_only: false,
    min_score: 0,
  })
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50

  useEffect(() => {
    api.filterOptions().then(setOptions).catch(console.error)
    api.portfolio().then(setPortfolio).catch(console.error)
  }, [])

  const fetchRecords = useCallback(() => {
    setLoading(true)
    api.records({ ...filters, named_only: filters.named_only || undefined, page, page_size: PAGE_SIZE })
      .then(data => { setRecords(data.records); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  const tc = portfolio?.tier_counts
  return (
    <div>
      <h1 className="page-title">BDR Readiness Queue</h1>
      <p className="page-subtitle">Scored and ranked — {total.toLocaleString()} records matching current filters</p>

      {portfolio && (
        <div className="metric-row">
          <div className="metric-card">
            <div className="metric-label">Total Scored</div>
            <div className="metric-value blue">{tc?.total?.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Call Now</div>
            <div className="metric-value green">{tc?.Call_Now?.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Follow Up</div>
            <div className="metric-value amber">{tc?.Follow_Up?.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Flagged</div>
            <div className="metric-value red">{tc?.Flagged?.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Median Score</div>
            <div className="metric-value">{portfolio.median_score?.toFixed(1)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">DQ Flags</div>
            <div className="metric-value">{portfolio.dq_total_flags?.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="filters">
        <div className="filter-group">
          <label className="filter-label">Tier</label>
          <select value={filters.tier} onChange={e => setFilter('tier', e.target.value)}>
            <option value="">All tiers</option>
            <option value="Call Now">Call Now</option>
            <option value="Follow Up">Follow Up</option>
            <option value="Nurture">Nurture</option>
            <option value="Flagged">Flagged</option>
            <option value="Call Now,Follow Up">Call Now + Follow Up</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Entity type</label>
          <select value={filters.entity_type} onChange={e => setFilter('entity_type', e.target.value)}>
            <option value="">All</option>
            {options.entity_types.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Industry</label>
          <select value={filters.industry} onChange={e => setFilter('industry', e.target.value)}>
            <option value="">All industries</option>
            {options.industries.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Min score</label>
          <input type="number" min={0} max={100} value={filters.min_score}
            onChange={e => setFilter('min_score', Number(e.target.value))} style={{ width: 80 }} />
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={filters.named_only}
            onChange={e => setFilter('named_only', e.target.checked)} />
          Named accounts only
        </label>
      </div>

      {loading
        ? <div className="loading">Loading records…</div>
        : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Tier</th>
                  <th>Score</th>
                  <th>Confidence</th>
                  <th>Account</th>
                  <th>Industry</th>
                  <th>Segment</th>
                  <th>30d eng.</th>
                  <th>Last eng.</th>
                  <th>DQ flags</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0
                  ? <tr><td colSpan={12}><div className="empty">No records match the current filters.</div></td></tr>
                  : records.map(r => (
                    <tr key={r.record_id} onClick={() => navigate(`/record/${r.record_id}`)}>
                      <td className="mono" style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{r.record_id}</td>
                      <td>{r.first_name} {r.last_name}</td>
                      <td style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>{r.entity_type}</td>
                      <td><TierBadge tier={r.tier} /></td>
                      <td style={{ minWidth: 140 }}><ScoreBar score={r.final_score} /></td>
                      <td><Conf val={r.confidence} /></td>
                      <td style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>{r.account_name || '—'}</td>
                      <td style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>{r.industry || '—'}</td>
                      <td className="mono" style={{ color: 'var(--purple)', fontSize: '0.78rem' }}>{r.segment || '—'}</td>
                      <td className="mono">{r.meaningful_30d}</td>
                      <td className="mono" style={{ color: 'var(--text3)' }}>
                        {r.days_since_last_engagement != null ? `${Math.round(r.days_since_last_engagement)}d` : '—'}
                      </td>
                      <td className="mono" style={{ color: r.dq_flag_count > 0 ? 'var(--amber)' : 'var(--text3)' }}>
                        {r.dq_flag_count}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )
      }

      <div className="pagination">
        <span>Page {page} · {total.toLocaleString()} results</span>
        <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
        <button className="page-btn" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next ›</button>
      </div>
    </div>
  )
}
