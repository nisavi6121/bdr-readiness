import React from 'react'

export default function Methodology() {
  return (
    <div>
      <h1 className="page-title">Methodology</h1>
      <p className="page-subtitle">How the readiness score works — every decision explained</p>

      <div className="methodology-content">
        <h2>Model Overview</h2>
        <p>
          The BDR Readiness Score replaces a binary MQL threshold with a transparent, decomposed
          0-100 readiness signal. It deliberately does not use <code>is_mql</code>,{' '}
          <code>mkto_lead_score</code>, <code>mql_date</code>, <code>lead_status</code>, or{' '}
          <code>created_date</code> as scoring inputs — those fields reflect legacy process state,
          not genuine buying readiness.
        </p>

        <div className="formula-box">
          Final Score = 0.60 × Engagement + 0.22 × Account Fit + 0.18 × Profile Fit
        </div>

        <h2>Component 1 — Engagement (60 pts)</h2>
        <p>
          Engagement is the dominant signal because it measures real behavioural intent, not
          assigned field values. It is computed per campaign type so that a single attended event
          is not diluted by a hundred automated email sends.
        </p>
        <h3>Per-type weights</h3>
        <ul>
          <li><strong>Event:</strong> 30% — highest-intent, human attendance signal</li>
          <li><strong>Webinar:</strong> 25% — strong interest, lower commitment than in-person</li>
          <li><strong>Content Syndication:</strong> 20% — demonstrated research intent</li>
          <li><strong>Telemarketing:</strong> 10% — direct conversation, moderate intent</li>
          <li><strong>Email:</strong> 10% — broad and often automated; discounted accordingly</li>
          <li><strong>Advertisement:</strong> 5% — weakest signal; passive impression</li>
        </ul>
        <h3>Recency decay</h3>
        <p>
          Each event is weighted by <code>exp(−k × age_days)</code> with a 30-day half-life
          (<code>k = ln(2) / 30</code>). An event 30 days ago counts at 50%, 60 days ago at 25%.
          Volume uses <code>log(1 + count)</code> to avoid letting spam campaigns dominate.
        </p>
        <h3>Automation filter</h3>
        <p>
          Events with <code>member_status = Sent</code> are excluded before computing the per-type
          signal. This prevents automation-inflated histories (DQ-8) from inflating the score.
          The <code>automation_inflated_flag</code> is shown on the record but does not silently
          penalise the score a second time.
        </p>
        <h3>Lead vs Contact fairness</h3>
        <p>
          Engagement signals are min-max normalised <em>within</em> entity type before being
          projected onto the 0-100 scale. Contacts naturally accumulate richer histories; leads
          would be systematically buried under a shared normalisation. This keeps the comparison fair.
        </p>

        <h2>Component 2 — Account Fit (22 pts)</h2>
        <p>
          Account fit measures how well the record's company matches the ideal customer profile,
          weighted by a segment multiplier that encodes the data confidence of the record type.
        </p>
        <h3>Sub-signals</h3>
        <ul>
          <li><strong>ICP Industry:</strong> 30 pts — Software, Financial Services, Healthcare, Telecom, Energy</li>
          <li><strong>Named Account:</strong> 25 pts — pre-identified strategic target</li>
          <li><strong>Industry match:</strong> 20 pts — overlaps ICP by definition when ICP flag is set</li>
          <li><strong>Employee Count:</strong> 15 pts — 500–10 000 = 1.0, 100–50 000 = 0.65, else 0.25</li>
          <li><strong>Intent Score:</strong> 10 pts — third-party account-level intent signal (0-100 normalised)</li>
        </ul>
        <h3>Segment multipliers (9-segment framework)</h3>
        <ul>
          <li><strong>C1</strong> (Converted contact + named account): 1.00</li>
          <li><strong>L1 / C2</strong> (Converted linked lead / converted contact): 0.85</li>
          <li><strong>L2</strong> (Converted, broken link): 0.60</li>
          <li><strong>C3 / L4</strong> (Named contact / MQL lead): 0.55</li>
          <li><strong>L3</strong> (MQL + named account lead): 0.45</li>
          <li><strong>L5</strong> (Other lead): 0.35</li>
          <li><strong>C4</strong> (Orphan contact): 0.30</li>
        </ul>

        <h2>Component 3 — Profile Fit (18 pts)</h2>
        <p>
          Profile fit uses job level and job persona to capture whether the contact is a plausible
          decision-maker or influencer for a cybersecurity purchase.
        </p>
        <div className="formula-box">
          Profile Fit = (job_level_score + job_persona_score) / 2
        </div>
        <h3>Job level scores</h3>
        <ul>
          <li>C-Level: 1.00 · VP: 0.85 · Director: 0.70 · Manager: 0.50 · Individual Contributor: 0.30</li>
        </ul>
        <h3>Job persona scores</h3>
        <ul>
          <li>CISO: 1.00 · Technical Buyer: 0.90 · Financial Buyer: 0.75 · Influencer: 0.50 · Non-Prospect: 0.00</li>
        </ul>
        <h3>Imputation</h3>
        <p>
          Missing job_level or job_persona values are imputed with the <em>within-entity-type
          median</em> derived score. This avoids population mean bias (which would blend leads and
          contacts) and treats missing data as typical rather than disqualifying.
        </p>

        <h2>Hard Blockers (Flagged tier)</h2>
        <p>
          Hard blockers do not affect the score — they are an orthogonal actionability layer.
          Any record with one or more of the following conditions receives the <strong>Flagged</strong> tier
          regardless of score:
        </p>
        <ul>
          <li>Email opt-out</li>
          <li>Bounced email</li>
          <li>No longer with company</li>
          <li>Account-level do-not-contact</li>
          <li>True persona is Competitor, Employee, or Vendor</li>
        </ul>

        <h2>Data Quality Flags</h2>
        <p>
          DQ flags are shown on each record as a count and detail string. They do not reduce the
          score but reduce the confidence rating (High → Medium → Low at flag counts 1 and 3).
          Issues simulated: broken conversion links, duplicate emails, overwritten MQL dates,
          ETL-dominated timestamps, score field asymmetry, non-prospect contamination,
          completeness gaps, automation-inflated engagement, opted-out/bounced records,
          and free-email leakage.
        </p>

        <h2>Why Rules-Based?</h2>
        <p>
          No labeled outcomes (meetings booked, opportunities created, revenue) exist in this
          dataset. A supervised ML model would produce impressive-looking outputs without a
          ground truth to validate against. A transparent rules-based model is more honest,
          easier to audit, and can be validated directly against BDR team intuition during a
          calibration session.
        </p>
      </div>
    </div>
  )
}
