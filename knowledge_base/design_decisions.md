# Design Decisions

## Rules-Based Model

A transparent rules-based model was chosen because no labeled outcomes exist (meetings booked, opportunities created, revenue won). A supervised ML model would look sophisticated but would be less honest — the model would be fitting noise without signal. Rules-based scoring can be validated against BDR team intuition in a calibration session.

## 3-Component Architecture

**Final Score = 0.60 × Engagement + 0.22 × Account Fit + 0.18 × Profile Fit**

Engagement dominates because it is the only component that reflects real-time buyer behaviour. Account fit and profile fit are lagging signals that change slowly; engagement changes week to week.

## Per-Type Engagement Scoring

Engagement is computed per campaign type before aggregation. This prevents email automation from burying event-attendance signals. Type weights (Event 30%, Webinar 25%, Content Syndication 20%, Telemarketing 10%, Email 10%, Advertisement 5%) reflect typical B2B buying intent hierarchy.

## Exponential Decay with 30-Day Half-Life

A 30-day half-life was chosen because B2B buying cycles are typically 3-6 months, but recency effects are strongest in the first month. An event from yesterday should count at 1.0; the same event 30 days ago at 0.5; 90 days ago at ~0.125.

## Automation Filter

Events with `member_status = Sent` are excluded from the engagement signal. This is the primary control for DQ-8 (automation-inflated engagement). The automation share flag is still surfaced on the record for BDR context, but it does not apply a second penalty inside the score.

## Segment Multipliers

The 9-segment framework (C1-C4, L1-L5) encodes data confidence, not just record type. C1 (converted contact, named account) gets full weight. C4 (orphan contact with no lead origin) and L5 (unclaimed lead with no MQL) get the lowest weights. This reflects that the account fit signal is more reliable when we have more data about the conversion path.

## Lead vs Contact Fairness

Engagement signals are min-max normalised within entity type. This prevents contacts from monopolising the top tiers simply by having longer histories. The normalisation ensures that a Lead with the best engagement among all leads can score as high as a Contact with the best engagement among all contacts.

## Blockers as Actionability Flags

Opt-out, bounced email, no-longer-with-company, account-level do-not-contact, and non-prospect personas (Competitor, Employee, Vendor) are not penalised inside the score. They receive the **Flagged** tier and a human-readable blocker reason. This keeps the score honest — a blocked record might actually have high readiness; the BDR needs to see both facts.

## Missing Data Policy

Missing job_level or job_persona values are imputed with the within-entity-type median derived score. Missing account linkage, industry, phone, and title are flagged as DQ issues but do not automatically reduce the score. The confidence rating degrades instead. This avoids treating incomplete data as disqualifying.
