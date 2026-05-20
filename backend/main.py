"""FastAPI application. Serves scored data and knowledge-base docs."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.models import (
    EngagementRow,
    PaginatedRecords,
    PortfolioStats,
    RecordDetail,
    RecordEngagement,
    RecordSummary,
    ScoreBreakdown,
    TierCounts,
)

ROOT = Path(__file__).parent.parent
SCORED_DIR = ROOT / "data" / "scored"
CLEANED_DIR = ROOT / "data" / "cleaned"
KB_DIR = ROOT / "knowledge_base"
FRONTEND_DIST = ROOT / "frontend" / "dist"

app = FastAPI(title="BDR Readiness Score API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_ranked: Optional[pd.DataFrame] = None
_cm: Optional[pd.DataFrame] = None


def _ensure_data() -> None:
    global _ranked, _cm
    if _ranked is not None:
        return
    ranked_path = SCORED_DIR / "ranked_records.csv"
    cm_path = CLEANED_DIR / "campaign_members.csv"
    if not ranked_path.exists():
        _run_pipeline()
    _ranked = pd.read_csv(ranked_path)
    _cm = pd.read_csv(cm_path) if cm_path.exists() else pd.DataFrame()


def _run_pipeline() -> None:
    scripts = [
        ROOT / "generation" / "generate.py",
        ROOT / "backend" / "pipeline" / "01_clean.py",
        ROOT / "backend" / "pipeline" / "02_features.py",
        ROOT / "backend" / "pipeline" / "03_score.py",
        ROOT / "backend" / "pipeline" / "04_rank.py",
    ]
    for script in scripts:
        result = subprocess.run([sys.executable, str(script)], capture_output=True, text=True, cwd=str(ROOT))
        if result.returncode != 0:
            raise RuntimeError(f"Pipeline stage {script.name} failed:\n{result.stderr}")


def _s(val) -> Optional[str]:
    """Return None for NaN/None/empty, str otherwise."""
    if val is None:
        return None
    try:
        if pd.isna(val):
            return None
    except (TypeError, ValueError):
        pass
    s = str(val).strip()
    return s if s else None


def _row_to_summary(row: pd.Series) -> RecordSummary:
    return RecordSummary(
        record_id=str(row.get("record_id", "")),
        entity_type=str(row.get("entity_type", "")),
        tier=str(row.get("tier", "")),
        final_score=float(row.get("final_score", 0)),
        confidence=str(row.get("confidence", "")),
        first_name=_s(row.get("first_name")),
        last_name=_s(row.get("last_name")),
        title=_s(row.get("title")),
        account_name=_s(row.get("account_name")),
        industry=_s(row.get("industry")),
        meaningful_30d=int(row.get("meaningful_30d", 0) or 0),
        days_since_last_engagement=float(row["days_since_last_engagement"]) if pd.notna(row.get("days_since_last_engagement")) else None,
        dq_flag_count=int(row.get("dq_flag_count", 0) or 0),
        segment=_s(row.get("segment")),
        hard_blocker=bool(row.get("hard_blocker", False)),
    )


@app.get("/api/records", response_model=PaginatedRecords)
def list_records(
    tier: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    named_only: bool = Query(False),
    min_score: float = Query(0),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    _ensure_data()
    df = _ranked.copy()
    if tier:
        tiers = [t.strip() for t in tier.split(",")]
        df = df[df["tier"].isin(tiers)]
    if entity_type:
        types = [t.strip() for t in entity_type.split(",")]
        df = df[df["entity_type"].isin(types)]
    if industry:
        industries = [i.strip() for i in industry.split(",")]
        df = df[df["industry"].isin(industries)]
    if named_only:
        df = df[df["named_account"].fillna(False)]
    df = df[df["final_score"] >= min_score]

    total = len(df)
    start = (page - 1) * page_size
    page_df = df.iloc[start: start + page_size]
    return PaginatedRecords(
        total=total,
        page=page,
        page_size=page_size,
        records=[_row_to_summary(row) for _, row in page_df.iterrows()],
    )


@app.get("/api/records/{record_id}", response_model=RecordDetail)
def get_record(record_id: str):
    _ensure_data()
    rows = _ranked[_ranked["record_id"] == record_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Record not found")
    row = rows.iloc[0]

    type_cols = [c for c in _ranked.columns if c.startswith("eng_")]
    engagement_detail = {c.replace("eng_", ""): float(row.get(c, 0) or 0) for c in type_cols}

    return RecordDetail(
        record_id=str(row.get("record_id", "")),
        entity_type=str(row.get("entity_type", "")),
        tier=str(row.get("tier", "")),
        final_score=float(row.get("final_score", 0)),
        confidence=str(row.get("confidence", "")),
        first_name=_s(row.get("first_name")),
        last_name=_s(row.get("last_name")),
        email=_s(row.get("email")),
        title=_s(row.get("title")),
        phone=_s(row.get("phone")),
        account_name=_s(row.get("account_name")),
        account_id=_s(row.get("account_id")),
        industry=_s(row.get("industry")),
        job_level=_s(row.get("job_level")),
        job_persona=_s(row.get("job_persona")),
        lineage_type=_s(row.get("lineage_type")),
        segment=_s(row.get("segment")),
        segment_multiplier=float(row["segment_multiplier"]) if pd.notna(row.get("segment_multiplier")) else None,
        hard_blocker=bool(row.get("hard_blocker", False)),
        hard_blocker_reasons=_s(row.get("hard_blocker_reasons")),
        dq_flag_count=int(row.get("dq_flag_count", 0) or 0),
        dq_flags=_s(row.get("dq_flags")),
        score_explanation=_s(row.get("score_explanation")),
        bdr_action=_s(row.get("bdr_action")),
        breakdown=ScoreBreakdown(
            engagement_score=float(row.get("engagement_score", 0) or 0),
            account_fit_score=float(row.get("account_fit_score", 0) or 0),
            profile_fit_score=float(row.get("profile_fit_score", 0) or 0),
            final_score=float(row.get("final_score", 0) or 0),
        ),
        engagement_detail=engagement_detail,
        profile={
            "job_level_score": float(row.get("job_level_score", 0) or 0),
            "job_persona_score": float(row.get("job_persona_score", 0) or 0),
        },
    )


@app.get("/api/records/{record_id}/engagement", response_model=RecordEngagement)
def get_engagement(record_id: str):
    _ensure_data()
    person_rows = _ranked[_ranked["record_id"] == record_id]
    if person_rows.empty:
        raise HTTPException(status_code=404, detail="Record not found")
    scoring_id = person_rows.iloc[0]["scoring_person_id"]

    if _cm is None or _cm.empty:
        return RecordEngagement(scoring_person_id=str(scoring_id), rows=[])

    history = _cm[_cm["scoring_person_id"] == scoring_id].copy()
    history = history.sort_values("response_date", ascending=False).head(30)
    rows = [
        EngagementRow(
            response_date=str(r.get("response_date", "")) or None,
            campaign_type=str(r.get("campaign_type", "")) or None,
            member_status=str(r.get("member_status", "")) or None,
            is_automated=bool(r.get("is_automated", False)),
            campaign_id=str(r.get("campaign_id", "")) or None,
        )
        for _, r in history.iterrows()
    ]
    return RecordEngagement(scoring_person_id=str(scoring_id), rows=rows)


@app.get("/api/portfolio", response_model=PortfolioStats)
def portfolio_stats():
    _ensure_data()
    df = _ranked
    tier_counts = df["tier"].value_counts().to_dict()
    entity_scores = df.groupby("entity_type")["final_score"].mean().round(1).to_dict()
    industry_scores = (
        df.dropna(subset=["industry"])
        .groupby("industry")["final_score"]
        .mean()
        .round(1)
        .to_dict()
    )
    return PortfolioStats(
        tier_counts=TierCounts(
            Call_Now=tier_counts.get("Call Now", 0),
            Follow_Up=tier_counts.get("Follow Up", 0),
            Nurture=tier_counts.get("Nurture", 0),
            Flagged=tier_counts.get("Flagged", 0),
            total=len(df),
        ),
        median_score=float(df["final_score"].median()),
        mean_score=float(df["final_score"].mean().round(1)),
        entity_type_scores=entity_scores,
        industry_scores=industry_scores,
        dq_total_flags=int(df["dq_flag_count"].sum()),
    )


@app.get("/api/knowledge-base")
def list_kb_docs():
    docs = [p.stem for p in sorted(KB_DIR.glob("*.md"))]
    return {"docs": docs}


@app.get("/api/knowledge-base/{doc_name}")
def get_kb_doc(doc_name: str):
    # Sanitize: only alphanumeric + underscores/hyphens
    safe = "".join(c for c in doc_name if c.isalnum() or c in ("_", "-"))
    path = KB_DIR / f"{safe}.md"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Document not found")
    return {"name": safe, "content": path.read_text(encoding="utf-8")}


@app.get("/api/filters/options")
def filter_options():
    _ensure_data()
    df = _ranked
    return {
        "tiers": sorted(df["tier"].dropna().unique().tolist()),
        "entity_types": sorted(df["entity_type"].dropna().unique().tolist()),
        "industries": sorted(df["industry"].dropna().unique().tolist()),
    }


# Serve React build in production
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
