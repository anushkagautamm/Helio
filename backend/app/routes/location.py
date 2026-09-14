from fastapi import APIRouter, HTTPException

from app.models.schemas import LocationResult, LocationSearchRequest, ReverseGeocodeRequest
from app.services.location import LocationLookupError, reverse_geocode, search_location

router = APIRouter(prefix="/api/location", tags=["location"])


@router.post("/search", response_model=list[LocationResult])
async def search(request: LocationSearchRequest):
    try:
        return await search_location(request.query)
    except LocationLookupError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/reverse", response_model=LocationResult)
async def reverse(request: ReverseGeocodeRequest):
    # Never raises — a map-picked point without a resolvable place name still
    # falls back to plain coordinates so the user isn't blocked.
    return await reverse_geocode(request.lat, request.lon)
