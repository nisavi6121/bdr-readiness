# Design Decisions

## Rules-Based Model

A transparent rules-based model was chosen because no labeled outcomes exist (meetings booked, opportunities created, revenue won). A supervised ML model would look sophisticated but would be less honest — the model would be fitting noise without signal. Rules-based scoring can be validated against BDR team intuition in a calibration session.

## Differentiated Weights by Entity Type

- **Leads:** `Final Score = 0.75 × Engagement + 0.15 × Account Fit + 0.10 × Profile Fit`
- **Contacts:** `Final Score = 0.60 × Engagement + 0.25 × Account Fit + 0.15 × Profile Fit`

Engagement remains the dominant signal for both types — it is the only component that reflects real-time buyer behaviour. Contacts get higher account fit and profile fit weights because they are linked to CRM accounts with richer, more reliable firmographic data. Applying the same weights to both types would penalise leads for a structural data gap that is not their fault.

## Per-Type Engagement Scoring

Engagement is computed per campaign type before aggregation. This prevents email automation from burying event-attendance signals. Type weights (Event 30%, Webinar 25%, Content Syndication 20%, Telemarketing 10%, Email 10%, Advertisement 5%) reflect typical B2B buying intent hierarchy.

## Exponential Decay with 30-Day Half-Life

A 30-day half-life was chosen because B2B buying cycles are typically 3-6 months, but recency effects are strongest in the first month. An event from yesterday should count at 1.0; the same event 30 days ago at 0.5; 90 days ago at ~0.125.

## Volume Capping (not log-scaling)

Volume is capped per campaign type (Event=3, Webinar=5, Email=10, etc.) and scored as `count / cap`. This is simpler to calibrate than `log(1 + count)` and has the same diminishing-returns property: each additional event above the cap adds nothing. Recency and volume are multiplicative — both must be non-zero for a type to contribute.

## 95th-Percentile Ceiling Normalisation

Engagement signals are normalised within entity type using a 95th-percentile ceiling rather than min-max. The 95th percentile becomes the "perfect score" (100); everything else is scaled proportionally and clipped to 100. This prevents a small number of highly-active outliers from compressing the entire distribution, which is a known failure mode of min-max normalisation on right-skewed engagement data.

## Automation Filter

Events with `member_status = Sent` are excluded from the genuine engagement signal. This is the primary control for DQ-8 (automation-inflated engagement). Records where automation share exceeds 70% are additionally capped at Follow Up tier regardless of final score — the signal is unreliable enough that Call Now designation should not rest on it.

## Segment Multipliers — Account Data Source Quality

The 9-segment framework (C1-C4, L1-L5) encodes data confidence, not prospect quality. Lead segments are defined entirely by account data source availability:

- L1: lead matched to an account record in CRM (highest confidence)
- L2: no match, but both ZoomInfo industry and employee enrichment are present
- L3: no match, industry enrichment only
- L4: no match, employee count enrichment only
- L5: no account match, no enrichment (lowest confidence)

Contact segments use lead origin linkage and named account status (C1 = both present, C4 = neither). MQL status was explicitly excluded from segmentation — it reflects legacy process state, not data confidence.

## Differentiated Tier Thresholds

Leads use lower thresholds (Call Now ≥65, Follow Up ≥35) than contacts (Call Now ≥70, Follow Up ≥40) because leads have higher engagement weight and shorter engagement histories, resulting in a structurally lower score distribution. The same absolute threshold applied to both would suppress lead Call Now rates unfairly.

## Hard Blockers as Actionability Flags

Only three conditions are treated as hard blockers (Flagged tier):
- Non-Prospect persona (Competitor, Employee, Vendor)
- Account-level do-not-contact
- No-longer-with-company

Email opt-out and bounced email are **soft flags** — they do not change the tier, but they suppress the email channel and appear as action notes in the BDR queue. A high-readiness opted-out contact is still a valuable prospect via phone or event channels. Conflating channel constraints with prospect quality produces a misleading score.

## Missing Data Policy

Missing job_level or job_persona values are imputed with the within-entity-type median derived score. Missing account linkage, industry, phone, and title are flagged as DQ issues but do not automatically reduce the score. The confidence rating degrades instead. This avoids treating incomplete data as disqualifying.
