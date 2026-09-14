import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import analyze, electricity, location, products, quote, report, roof

app = FastAPI(
    title="Helio API",
    description="Rooftop Solar Feasibility & Sustainability Advisor for Indian Homes",
    version="1.0.0",
)

# Allowed frontend origins, comma-separated (e.g. "https://helio.example.com,
# https://staging-helio.example.com"). Falls back to the local Vite dev
# server so `uvicorn app.main:app` keeps working out of the box in
# development. Set CORS_ORIGINS in production to the real frontend
# origin(s) — see README "Deployment" section.
_default_dev_origins = "http://localhost:5173,http://127.0.0.1:5173"
_cors_origins_env = os.environ.get("CORS_ORIGINS", _default_dev_origins)
allowed_origins = [origin.strip() for origin in _cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(location.router)
app.include_router(roof.router)
app.include_router(electricity.router)
app.include_router(analyze.router)
app.include_router(report.router)
app.include_router(products.router)
app.include_router(quote.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "helio-api"}
