from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import OCRResponse
from app.services.ocr import extract_from_image_bytes

router = APIRouter(prefix="/api/electricity", tags=["electricity"])

_MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB


@router.post("/ocr", response_model=OCRResponse)
async def ocr_bill(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/jpg"):
        raise HTTPException(status_code=400, detail="Please upload a JPEG, PNG, or WebP image.")

    contents = await file.read()
    if len(contents) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image is too large (max 8 MB).")

    # Processed entirely in memory; never written to disk (Section 19 — privacy).
    return extract_from_image_bytes(contents)
