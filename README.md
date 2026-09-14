# Helio — Rooftop Solar Feasibility & Sustainability Advisor

Helio helps Indian homeowners answer a practical question: **does rooftop
solar make sense for my home?** It walks through location, roof size, and
electricity usage to produce a transparent, planning-level estimate of
system size, generation, cost, PM Surya Ghar subsidy, savings, payback
period, and CO₂ impact — with every number traced back to either a formula
or a clearly labelled assumption.

## Problem Statement

Homeowners considering rooftop solar in India usually have to either pay for
a sales visit or piece together generic online calculators that hide their
assumptions, ignore local solar resource data, and don't explain *why* a
system size is recommended. There's no free, transparent, India-specific
tool that ties location, roof geometry, electricity bills, and the PM Surya
Ghar subsidy together into one coherent, explainable estimate.

## Solution

Helio is a small full-stack app: a guided React wizard collects location,
roof area, and electricity bill inputs; a FastAPI backend runs the sizing,
financial, subsidy, and environmental calculations against configurable
assumptions and two free public data sources (OpenStreetMap/Nominatim and
NASA POWER); and the results are presented as a dashboard with a
rule-based (not ML) suitability recommendation, a downloadable PDF report,
and a side-by-side comparison of three panel technologies.

## Features

- Location search (city / pincode / locality) via Nominatim, with a map view and a manual
  lat/lon fallback if search is unavailable
- Roof area input via presets, custom value, or an optional GPS-assisted polygon estimate
- Electricity bill entry with optional best-effort OCR (Tesseract) from an uploaded photo
- Solar resource lookup via NASA POWER (`ALLSKY_SFC_SW_DWN`), with a labelled fallback
- Side-by-side comparison of Polycrystalline, Mono PERC, and Bifacial panels
- PM Surya Ghar central subsidy estimate (tiered, capped)
- Full financial analysis: gross cost, net cost, monthly/annual savings, payback period
- CO₂ avoided per year (configurable emissions factor)
- Transparent, rule-based (non-ML) suitability recommendation with stated reasons
- Downloadable PDF feasibility report
- No accounts, no database, no stored bills

## Architecture

```
React (Vite) Frontend  →  FastAPI Backend  →  Calculation Services  →  Free External APIs
```

- **Frontend** (`frontend/`): a linear wizard (Location → Roof Area → Electricity Bill →
  Results) built with React + TypeScript + Tailwind. One API call (`POST /api/analyze`)
  returns a complete, self-consistent result object that the Results page renders as a
  dashboard — this avoids re-deriving numbers in multiple places and keeps the frontend a
  thin presentation layer.
- **Backend** (`backend/`): FastAPI routes are thin controllers; all logic lives in
  `app/services/*.py`, each module owning one concern (solar sizing, subsidy, finance,
  environment, location, NASA POWER, electricity/tariff, OCR, recommendation, PDF report).
  Every tunable number (panel specs, cost per watt, subsidy tiers, performance factor,
  emissions factor, fallback irradiance, default tariff) lives in one file,
  `backend/app/config.py`.
- No database. No authentication. Uploaded bill images are processed in memory and
  discarded — nothing is written to disk.

```
helio/
├── frontend/            React + Vite + TypeScript + Tailwind
│   └── src/{components,pages,services,utils,styles}
├── backend/
│   └── app/{main.py,config.py,models,routes,services}
├── tests/backend/        pytest suite for calculation logic
├── pytest.ini
├── README.md
└── DEVELOPMENT_NOTES.md
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet/react-leaflet (maps),
  Recharts (charts)
- **Backend**: Python 3.12, FastAPI, Pydantic v2, httpx, pytesseract + Pillow (OCR),
  ReportLab (PDF)
- **External data**: OpenStreetMap / Nominatim (geocoding), NASA POWER (solar irradiance)
- **Testing**: pytest

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- (Optional, for bill-photo OCR) [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
  installed and on your `PATH`. Without it, OCR upload will report itself unavailable and
  manual bill entry still works fully. On Windows:
  `winget install -e --id UB-Mannheim.TesseractOCR` (this installer needs a one-time UAC
  ("Yes, allow this app...") approval — expected for any installer writing to Program Files).

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://127.0.0.1:8000` (interactive docs at `/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to
`http://127.0.0.1:8000`, so both servers need to be running.

### Tests

```bash
# from the repo root, with the backend venv active
pip install -r backend/requirements.txt
pytest
```

## API Overview

| Endpoint | Purpose |
|---|---|
| `POST /api/location/search` | Geocode a query via Nominatim (cached, rate-limit friendly) |
| `POST /api/location/reverse` | Reverse-geocode a map-picked/GPS point to a place name (never fails — falls back to coordinates) |
| `POST /api/roof/gps-area` | Estimate roof area from 3–8 GPS points (Haversine/shoelace) |
| `POST /api/electricity/ocr` | Best-effort OCR extraction from a bill photo |
| `POST /api/analyze` | Run the full sizing/financial/subsidy/environmental/recommendation pipeline |
| `POST /api/report/pdf` | Render the analysis result as a downloadable PDF |
| `GET /api/health` | Liveness check |

## Calculation Formulas

All formulas below use configurable constants from `backend/app/config.py`.

- **Usable roof area** = gross roof area (m²) × `USABLE_ROOF_FRACTION` (0.65)
- **Panel count** = `floor(usable roof area / PANEL_AREA_SQM)`, `PANEL_AREA_SQM` = 1.6 m²
- **System capacity (kW)** = panel count × panel wattage / 1000
- **Monthly generation (kWh)** = system kW × daily irradiance (kWh/m²/day) × 30 ×
  `SYSTEM_PERFORMANCE_FACTOR` (0.75)
- **Annual generation** = monthly generation × 12
- **Effective tariff (₹/kWh)** = bill amount ÷ units, when both are available; otherwise
  `DEFAULT_TARIFF_INR_PER_KWH` (₹7/kWh), clearly labelled as an assumption
- **Gross system cost** = system capacity in watts × cost per watt
- **PM Surya Ghar subsidy** — see below
- **Net system cost** = gross cost − subsidy (floored at 0)
- **Monthly savings** = monthly generation × effective tariff
- **Annual savings** = monthly savings × 12
- **Payback period (years)** = net cost ÷ annual savings (undefined/`null` if savings ≤ 0)
- **CO₂ avoided per year (kg)** = annual generation × `CO2_EMISSION_FACTOR_KG_PER_KWH` (0.82)
- **Lifetime CO₂ avoided** = annual CO₂ avoided × `SYSTEM_LIFETIME_YEARS` (25, flat — no
  degradation modelled), shown as an illustrative planning figure
- **Monthly generation series** = each calendar month's own NASA POWER long-term average
  irradiance run through the same generation formula, so the seasonal chart reflects real data
  rather than a flat average repeated twelve times

## PM Surya Ghar Subsidy

Helio estimates the central subsidy under the **PM Surya Ghar: Muft Bijli Yojana** scheme
using the published tiered structure:

- ₹30,000 per kW for the first 2 kW
- ₹18,000 per kW for capacity between 2–3 kW
- Capped at ₹78,000 total, regardless of system size above 3 kW

Example: a 1 kW system → ₹30,000; 2 kW → ₹60,000; 3 kW → ₹78,000; anything larger → still
₹78,000. **This is an estimate only.** Eligibility, disbursement, and process depend on your
DISCOM and the government order in force at the time you apply — always verify through
official government channels before making decisions. Helio is not an official government
portal.

## Assumptions (all configurable in `backend/app/config.py`)

| Assumption | Default | Used for |
|---|---|---|
| Usable roof fraction | 65% | Roof sizing |
| Panel footprint | 1.6 m²/panel | Panel count |
| System performance factor | 75% | Generation estimate |
| Fallback solar irradiance | 5.5 kWh/m²/day | Used only if NASA POWER is unreachable |
| Default electricity tariff | ₹7/kWh | Used only if bill data is insufficient |
| CO₂ emission factor | 0.82 kg/kWh | Environmental impact |
| System lifetime | 25 years | Illustrative lifetime CO₂ figure only |
| Panel cost | ₹40/₹48/₹56 per W (Poly/Mono PERC/Bifacial) | Cost estimate |

## Limitations

- All generation, cost, and savings figures are **preliminary planning estimates**, not an
  engineering-grade design, structural assessment, or shading analysis.
- NASA POWER's `ALLSKY_SFC_SW_DWN` is a long-term climatological average, not real-time or
  hyper-local data.
- GPS-based roof area is explicitly **not** a precise measurement — consumer GPS error of
  several metres can meaningfully skew a small polygon's area.
- OCR extraction is best-effort and can misread bills; always review extracted values.
- The recommendation engine is intentionally simple and rule-based — it is not a substitute
  for a professional site assessment.

## Privacy

- No user accounts, no database, no persistent storage of any kind.
- Uploaded bill images are processed in memory for a single OCR request and discarded —
  never written to disk or sent to any third-party service.
- Location searches are cached in-process only (not persisted) to reduce load on the public
  Nominatim instance.

## Deployment Notes

Helio has no database and no auth, so deployment is just "run two stateless services." Netlify
only serves static frontends and JS functions — it can't run a Python/FastAPI process — so the
usual split is **frontend on Netlify, backend on a separate ASGI-capable host**, connected via
the environment variables below.

### Environment variables

| Variable | Where | Default | Set it to |
|---|---|---|---|
| `CORS_ORIGINS` | Backend | `http://localhost:5173,http://127.0.0.1:5173` (local dev) | Comma-separated list of the exact frontend origin(s) allowed to call the API, e.g. `https://helio.netlify.app` |
| `NOMINATIM_USER_AGENT` | Backend | A placeholder local-dev string | A real, identifying User-Agent with a working contact, e.g. `Helio/1.0 (contact: you@yourdomain.com)` — **required** before production traffic; see below |
| `VITE_API_BASE_URL` | Frontend (build-time) | `/api` (same-domain reverse proxy) | The backend's full base URL including `/api`, e.g. `https://helio-api.onrender.com/api` — only needed when frontend and backend are on different domains, which is the case for a Netlify-hosted frontend |

### Backend

Deploy to any ASGI-capable host — Render, Railway, Fly.io, a small VM/container running
`uvicorn app.main:app`, or behind `gunicorn -k uvicorn.workers.UvicornWorker`. Set `CORS_ORIGINS`
to your Netlify site's URL (and any preview/staging domains you use, comma-separated).

Respect Nominatim's usage policy in production: set `NOMINATIM_USER_AGENT` to your real app name
and a working contact email or project URL (see `backend/app/config.py`) — a generic or
placeholder User-Agent risks being rate-limited or blocked outright. Avoid bulk/automated
queries, and consider self-hosting Nominatim or switching to a paid geocoding provider if traffic
grows.

### Frontend (Netlify)

1. `npm run build` in `frontend/` produces static files in `frontend/dist/`. The repo-root
   `netlify.toml` already configures Netlify's base directory (`frontend`), build command
   (`npm run build`), and publish directory (`frontend/dist`), plus an SPA redirect — connecting
   the Netlify site to this repo is enough, no manual dashboard configuration needed.
2. In the Netlify site's environment variables, set `VITE_API_BASE_URL` to your deployed
   backend's URL (see `frontend/.env.example`) — this is required for Netlify specifically, since
   the frontend and backend are on different domains and there's no same-domain `/api` proxy in
   production the way Vite's dev server provides locally.
3. Because the frontend and backend are now on different origins, the browser's own requests are
   real cross-origin calls — make sure the backend's `CORS_ORIGINS` includes the exact Netlify
   URL (including `https://`, no trailing slash).
