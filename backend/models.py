from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class RecordSummary(BaseModel):
    record_id: str
    entity_type: str
    tier: str
    final_score: float
    confidence: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    account_name: Optional[str] = None
    industry: Optional[str] = None
    meaningful_30d: int = 0
    days_since_last_engagement: Optional[float] = None
    dq_flag_count: int = 0
    segment: Optional[str] = None
    hard_blocker: bool = False


class ScoreBreakdown(BaseModel):
    engagement_score: float
    account_fit_score: float
    profile_fit_score: float
    final_score: float
    engagement_weight: float
    account_fit_weight: float
    profile_fit_weight: float


class RecordDetail(BaseModel):
    record_id: str
    entity_type: str
    tier: str
    final_score: float
    confidence: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    account_name: Optional[str] = None
    account_id: Optional[str] = None
    industry: Optional[str] = None
    job_level: Optional[str] = None
    job_persona: Optional[str] = None
    lineage_type: Optional[str] = None
    segment: Optional[str] = None
    segment_multiplier: Optional[float] = None
    hard_blocker: bool = False
    hard_blocker_reasons: Optional[str] = None
    dq_flag_count: int = 0
    dq_flags: Optional[str] = None
    score_explanation: Optional[str] = None
    bdr_action: Optional[str] = None
    breakdown: ScoreBreakdown
    engagement_detail: dict[str, Any] = {}
    profile: dict[str, Any] = {}


class EngagementRow(BaseModel):
    response_date: Optional[str] = None
    campaign_type: Optional[str] = None
    member_status: Optional[str] = None
    is_automated: bool = False
    campaign_id: Optional[str] = None


class RecordEngagement(BaseModel):
    scoring_person_id: str
    rows: list[EngagementRow]


class TierCounts(BaseModel):
    Call_Now: int = 0
    Follow_Up: int = 0
    Nurture: int = 0
    Flagged: int = 0
    total: int = 0


class PortfolioStats(BaseModel):
    tier_counts: TierCounts
    median_score: float
    mean_score: float
    entity_type_scores: dict[str, float]
    industry_scores: dict[str, float]
    dq_total_flags: int


class PaginatedRecords(BaseModel):
    total: int
    page: int
    page_size: int
    records: list[RecordSummary]
