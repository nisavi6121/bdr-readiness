# Discovery Notes

The assignment mirrors a common B2B marketing operations problem: BDRs receive a daily MQL queue, but the queue is stale, opaque, and disconnected from actual call readiness.

Key observations:

- Engagement recency matters more than lifetime score depth. A contact who attended an event last week is more ready than one who accumulated 100 email-send events two years ago.
- Raw activity counts are misleading because automated email sends can dominate history (DQ-8: ~30% of records in this dataset are automation-inflated).
- Leads and contacts need a shared score, but their data density differs — contacts inherit richer account relationships and longer engagement histories. Entity-type normalisation is essential.
- Current MQL status is a legacy outcome, not a trustworthy model input. It reflects the last time a threshold was crossed, not whether the person is ready to take a call today.
- Some records are structurally not actionable even when their engagement looks strong. Hard blockers must be surfaced explicitly, not buried in a score penalty.
- The 9-segment lead/contact framework captures real differences in data confidence: a converted contact linked to a known lead (C1/L1) is more trustworthy than an orphan contact (C4) with no conversion history.

The synthetic dataset is designed to make these tensions visible rather than merely produce neat sample rows.
