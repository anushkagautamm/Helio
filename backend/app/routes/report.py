from fastapi import APIRouter
from fastapi.responses import Response

from app.models.schemas import AnalyzeResponse
from app.services.report import build_pdf_report

router = APIRouter(prefix="/api/report", tags=["report"])


@router.post("/pdf")
async def generate_pdf(data: AnalyzeResponse):
    pdf_bytes = build_pdf_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=helio-solar-report.pdf"},
    )
