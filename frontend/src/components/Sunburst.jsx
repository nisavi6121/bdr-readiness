import React, { useMemo } from 'react'
import Plot from 'react-plotly.js'

/**
 * Sunburst: inner ring = 3 components (sized by weight × achieved score),
 *           outer ring = sub-signals sized proportionally within component.
 *           Color intensity = achieved fraction of max.
 */
export default function Sunburst({ record }) {
  const data = useMemo(() => {
    if (!record) return null
    const bd = record.breakdown
    const eng = record.engagement_detail || {}
    const prof = record.profile || {}

    // Inner ring items
    const components = [
      { id: 'eng', label: 'Engagement', score: bd.engagement_score, weight: 0.60 },
      { id: 'acc', label: 'Account Fit', score: bd.account_fit_score, weight: 0.22 },
      { id: 'prof', label: 'Profile Fit', score: bd.profile_fit_score, weight: 0.18 },
    ]

    // Outer ring: engagement sub-signals
    const typeWeights = { event: 0.30, webinar: 0.25, content_syndication: 0.20, telemarketing: 0.10, email: 0.10, advertisement: 0.05 }
    const engSubs = Object.entries(typeWeights).map(([key, tw]) => ({
      id: `eng_${key}`,
      parent: 'eng',
      label: key.replace(/_/g, ' '),
      val: eng[key] || 0,
      maxVal: tw,
    }))

    // Outer ring: account fit sub-signals (approximate)
    const accSubs = [
      { id: 'acc_icp', parent: 'acc', label: 'ICP Industry', val: record.icp_flag ? 30 : 0, maxVal: 30 },
      { id: 'acc_named', parent: 'acc', label: 'Named Account', val: record.named_account_flag ? 25 : 0, maxVal: 25 },
      { id: 'acc_emp', parent: 'acc', label: 'Employees', val: (record.employee_fit || 0) * 15, maxVal: 15 },
      { id: 'acc_intent', parent: 'acc', label: 'Intent', val: (record.account_intent_score || 0) / 100 * 10, maxVal: 10 },
    ]

    // Outer ring: profile fit sub-signals
    const profSubs = [
      { id: 'prof_level', parent: 'prof', label: 'Job Level', val: (prof.job_level_score || 0) * 50, maxVal: 50 },
      { id: 'prof_persona', parent: 'prof', label: 'Job Persona', val: (prof.job_persona_score || 0) * 50, maxVal: 50 },
    ]

    const ids = ['root', ...components.map(c => c.id), ...engSubs.map(s => s.id), ...accSubs.map(s => s.id), ...profSubs.map(s => s.id)]
    const labels = ['Score', ...components.map(c => c.label), ...engSubs.map(s => s.label), ...accSubs.map(s => s.label), ...profSubs.map(s => s.label)]
    const parents = ['', ...components.map(() => 'root'), ...engSubs.map(s => s.parent), ...accSubs.map(s => s.parent), ...profSubs.map(s => s.parent)]

    // Values = contribution to final score
    const engTotal = components[0].score * 0.60
    const accTotal = components[1].score * 0.22
    const profTotal = components[2].score * 0.18
    const innerVals = [engTotal + accTotal + profTotal, engTotal, accTotal, profTotal]

    // Outer values: proportional within parent
    const engSubVals = engSubs.map(s => s.val > 0 ? (s.val / (engSubs.reduce((a, b) => a + b.val, 0) || 1)) * engTotal : 0.001)
    const accSubVals = accSubs.map(s => s.maxVal > 0 ? (s.val / (accSubs.reduce((a, b) => a + b.maxVal, 0))) * accTotal : 0.001)
    const profSubVals = profSubs.map(s => (s.val / 100) * profTotal || 0.001)

    const vals = [...innerVals, ...engSubVals, ...accSubVals, ...profSubVals]

    // Color: fraction of max possible contribution
    const colors = [
      'rgba(79,124,255,0.6)',
      `rgba(79,124,255,${0.4 + 0.6 * bd.engagement_score / 100})`,
      `rgba(34,197,94,${0.4 + 0.6 * bd.account_fit_score / 100})`,
      `rgba(167,139,250,${0.4 + 0.6 * bd.profile_fit_score / 100})`,
      ...engSubs.map(s => `rgba(79,124,255,${0.2 + 0.8 * Math.min(s.val / (s.maxVal || 1), 1)})`),
      ...accSubs.map(s => `rgba(34,197,94,${0.2 + 0.8 * Math.min(s.val / (s.maxVal || 1), 1)})`),
      ...profSubs.map(s => `rgba(167,139,250,${0.2 + 0.8 * Math.min(s.val / 50, 1)})`),
    ]

    return { ids, labels, parents, vals, colors }
  }, [record])

  if (!data) return null

  return (
    <div className="sunburst-wrap">
      <Plot
        data={[{
          type: 'sunburst',
          ids: data.ids,
          labels: data.labels,
          parents: data.parents,
          values: data.vals,
          marker: { colors: data.colors, line: { width: 1, color: 'rgba(13,15,20,0.8)' } },
          branchvalues: 'total',
          textfont: { family: 'DM Sans', color: '#e8eaf0', size: 11 },
          hovertemplate: '<b>%{label}</b><br>Contribution: %{value:.2f}<extra></extra>',
          insidetextorientation: 'radial',
        }]}
        layout={{
          width: 400,
          height: 380,
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          margin: { l: 10, r: 10, t: 10, b: 10 },
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
      />
    </div>
  )
}
