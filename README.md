# BDR Readiness Score

A full-stack BDR prioritisation tool: FastAPI backend + React/Vite frontend.

**Scoring model:** `Final Score = 0.60 × Engagement + 0.22 × Account Fit + 0.18 × Profile Fit`

## Prerequisites

- Python 3.10+
- Node.js 18+ (for frontend)

Install Node.js from https://nodejs.org/ if not present.

## Quick Start (local dev)

```powershell
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the data pipeline (generates + scores 1 000 records)
python generation\generate.py
python backend\pipeline\01_clean.py
python backend\pipeline\02_features.py
python backend\pipeline\03_score.py
python backend\pipeline\04_rank.py

# 3. Start the API
uvicorn backend.main:app --reload --port 8000

# 4. In a second terminal: install and run frontend
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

## API Endpoints (http://localhost:8000)

| Endpoint | Description |
|---|---|
| `GET /api/records` | Paginated, filterable scored queue |
| `GET /api/records/{id}` | Full record detail + score breakdown |
| `GET /api/records/{id}/engagement` | Campaign engagement history |
| `GET /api/portfolio` | Tier counts + portfolio stats |
| `GET /api/knowledge-base` | List KB docs |
| `GET /api/knowledge-base/{name}` | Render KB markdown |
| `GET /api/filters/options` | Available filter values |

## Project Structure

```
bdr_readiness_score/
├── generation/
│   └── generate.py          # Synthetic SFDC-style data (SEED=42)
├── backend/
│   ├── main.py              # FastAPI app
│   ├── models.py            # Pydantic response schemas
│   └── pipeline/
│       ├── 01_clean.py      # Entity resolution + DQ flags
│       ├── 02_features.py   # Per-type engagement features + fit signals
│       ├── 03_score.py      # 3-component scoring
│       └── 04_rank.py       # Tier assignment + BDR actions
├── frontend/
│   ├── src/pages/           # RankedList, RecordInspector, Methodology, KnowledgeBase
│   ├── src/components/      # Sunburst chart
│   └── src/api/client.js    # API fetch wrapper
├── knowledge_base/          # Markdown docs (design, issues, lessons)
├── data/
│   ├── raw/                 # Generated CSVs
│   ├── cleaned/             # After 01_clean
│   ├── features/            # After 02_features
│   └── scored/              # ranked_records.csv (final output)
├── Dockerfile
└── requirements.txt
```

## Scoring Model

### Engagement (60%)
Per campaign type (Event 30%, Webinar 25%, Content Syndication 20%, Telemarketing 10%, Email 10%, Ad 5%).
Decay: `exp(-ln(2)/30 × age_days)` (30-day half-life).
Volume: `log(1 + count)`.
Automation filter: `Sent` status events excluded.
Normalised within entity type (leads vs contacts calibrated separately).

### Account Fit (22%)
Sub-signals: ICP industry (30 pts), Named account (25 pts), Industry (20 pts), Employees (15 pts), Intent (10 pts).
Multiplied by a segment confidence factor (C1=1.00 → C4/L5=0.30–0.35).

### Profile Fit (18%)
`(job_level_score + job_persona_score) / 2`.
Missing values imputed with within-entity-type median (never population mean).

### Tiers
- **Call Now** (≥35): priority outreach within 24h
- **Follow Up** (≥22): schedule within 5 business days
- **Nurture** (<22): long-term sequence
- **Flagged** (hard blocker regardless of score): review before outreach

### Hard Blockers
Email opt-out, bounced email, no longer with company, account do-not-contact, Competitor/Employee/Vendor persona.

## Docker / Cloud Run

```bash
docker build -t bdr-score .
docker run -p 8080:8080 bdr-score
```

Deploy to Cloud Run:
```bash
gcloud run deploy bdr-score --source . --platform managed --region us-central1 --allow-unauthenticated
```
