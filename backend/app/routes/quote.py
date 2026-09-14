from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import QuoteCompareRequest, QuoteComparisonResponse, QuoteExtractResponse
from app.services.quote import compare_quote_to_estimate, extract_quote_from_image_bytes

router = APIRouter(prefix="/api/quote", tags=["quote"])

_MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB, matches the electricity-bill upload limit


@router.post("/extract", response_model=QuoteExtractResponse)
async def extract_quote(file: UploadFile = File(...)):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(image_bytes) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Uploaded file is too large (max 8 MB).")
    return extract_quote_from_image_bytes(image_bytes)


@router.post("/compare", response_model=QuoteComparisonResponse)
async def compare_quote(request: QuoteCompareRequest):
    return compare_quote_to_estimate(request.quote, request.analysis, request.compare_to_panel_id)
