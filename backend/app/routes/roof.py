from fastapi import APIRouter, HTTPException

from app.models.schemas import RoofGPSRequest, RoofGPSResponse
from app.services.roof import polygon_area_sqm, sqm_to_sqft

router = APIRouter(prefix="/api/roof", tags=["roof"])


@router.post("/gps-area", response_model=RoofGPSResponse)
async def gps_area(request: RoofGPSRequest):
    if len(request.points) < 3:
        raise HTTPException(status_code=400, detail="At least 3 GPS points are required to estimate an area.")

    area_sqm = polygon_area_sqm(request.points)
    if area_sqm <= 0:
        raise HTTPException(
            status_code=400,
            detail="Could not compute a valid area from these points. Try walking a clearer perimeter.",
        )

    return RoofGPSResponse(
        area_sqm=round(area_sqm, 2),
        area_sqft=round(sqm_to_sqft(area_sqm), 1),
        point_count=len(request.points),
    )
