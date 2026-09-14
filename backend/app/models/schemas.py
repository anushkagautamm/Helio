"""Pydantic request/response models shared across API routes."""
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Location (Section 3)
# ---------------------------------------------------------------------------
class LocationSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=200)


class LocationResult(BaseModel):
    lat: float
    lon: float
    display_name: str
    attribution: str = "© OpenStreetMap contributors"


class ReverseGeocodeRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


# ---------------------------------------------------------------------------
# Roof area (Section 4)
# ---------------------------------------------------------------------------
class GPSPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class RoofGPSRequest(BaseModel):
    points: list[GPSPoint] = Field(..., min_length=3, max_length=8)


class RoofGPSResponse(BaseModel):
    area_sqm: float
    area_sqft: float
    point_count: int
    warning: str = (
        "GPS-based area is an estimate only. Consumer-grade phone/browser GPS "
        "can be off by several metres per point, so treat this as a rough "
        "planning figure, not a precise roof measurement."
    )


# ---------------------------------------------------------------------------
# Electricity bill (Section 5)
# ---------------------------------------------------------------------------
class OCRResponse(BaseModel):
    success: bool
    units_kwh: Optional[float] = None
    units_source: str = "unavailable"  # "stated" | "derived_meter_diff" | "proximity_match" | "unavailable"
    units_confidence: str = "none"  # "high" | "medium" | "low" | "none"
    units_note: Optional[str] = None
    current_meter_reading: Optional[float] = None
    previous_meter_reading: Optional[float] = None
    bill_amount_inr: Optional[float] = None
    amount_source: str = "unavailable"  # "stated" | "amount_in_words" | "unavailable"
    amount_confidence: str = "none"  # "high" | "medium" | "none"
    billing_period: Optional[str] = None
    detected_tariff_inr_per_kwh: Optional[float] = None
    raw_text: Optional[str] = None
    message: str


# ---------------------------------------------------------------------------
# Full analysis (Sections 6-14)
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    location_label: Optional[str] = None
    roof_area_sqft: float = Field(..., gt=0, le=100000)
    monthly_units_kwh: Optional[float] = Field(default=None, ge=0)
    monthly_bill_inr: Optional[float] = Field(default=None, ge=0)


class SolarResource(BaseModel):
    irradiance_kwh_per_m2_day: float
    monthly_irradiance_kwh_per_m2_day: list[float] = Field(default_factory=list)  # Jan..Dec
    source: str  # "NASA POWER" or "Fallback assumption"
    is_fallback: bool
    note: str


class ElectricityInfo(BaseModel):
    monthly_units_kwh: Optional[float]
    monthly_bill_inr: Optional[float]
    tariff_inr_per_kwh: float
    tariff_source: str  # "Derived from your bill" or "Default assumption"


class RoofInfo(BaseModel):
    gross_area_sqft: float
    gross_area_sqm: float
    usable_area_sqm: float
    usable_fraction: float


class SubsidyTierBreakdown(BaseModel):
    label: str
    kw_in_tier: float
    rate_per_kw_inr: float
    amount_inr: float


class CostBreakdown(BaseModel):
    """
    Decomposes gross_cost_inr into components that sum back to the same
    total — panel/module price alone is not the installed-system cost
    (Section 9). Planning-level split, not a certified cost audit.
    """
    module_cost_inr: float
    inverter_bos_cost_inr: float
    installation_epc_cost_inr: float


class PanelResult(BaseModel):
    panel_id: str
    panel_name: str
    panel_watt: int
    cost_per_watt_inr: float
    panel_count: int
    system_capacity_kw: float
    monthly_generation_kwh: float
    annual_generation_kwh: float
    monthly_generation_series_kwh: list[float] = Field(default_factory=list)  # Jan..Dec estimate
    gross_cost_inr: float
    cost_breakdown: Optional[CostBreakdown] = None
    subsidy_inr: float
    subsidy_breakdown: list[SubsidyTierBreakdown] = Field(default_factory=list)
    net_cost_inr: float
    monthly_savings_inr: float
    annual_savings_inr: float
    payback_years: Optional[float]
    payback_years_int: Optional[int]
    payback_months_remainder: Optional[int]
    co2_avoided_kg_per_year: float
    lifetime_co2_avoided_kg: float
    consumption_offset_percent: Optional[float] = None


class Recommendation(BaseModel):
    rating: str  # Highly Suitable | Suitable | Potentially Suitable | Needs Further Assessment
    headline: str
    reasons: list[str]
    based_on_panel_id: str


class SubsidyMeta(BaseModel):
    source_name: str
    source_url: str
    effective_date: str
    accessed_date: str
    is_special_category_state: bool
    note: str


class AnalyzeResponse(BaseModel):
    location: LocationResult | None
    roof: RoofInfo
    electricity: ElectricityInfo
    solar_resource: SolarResource
    panel_results: list[PanelResult]
    recommended_panel_id: str
    recommendation: Recommendation
    assumptions: dict[str, str]
    subsidy_meta: Optional[SubsidyMeta] = None


# ---------------------------------------------------------------------------
# Real product catalogue — "Compare Actual Products" advanced feature
# (Section: manufacturer/model comparison). Optional, secondary to the main
# technology-level recommendation above.
# ---------------------------------------------------------------------------
class ProductInfo(BaseModel):
    id: str
    manufacturer: str
    model: str
    watt_min: int
    watt_max: int
    technology: str
    efficiency_percent: Optional[float] = None
    price_per_watt_min: Optional[float] = None
    price_per_watt_max: Optional[float] = None
    price_available: bool
    almm_listed: bool
    warranty_years: Optional[int] = None
    source_name: str
    source_url: str
    source_date: str


class ProductEstimateRequest(BaseModel):
    product_id: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    location_label: Optional[str] = None
    roof_area_sqft: float = Field(..., gt=0, le=100000)
    monthly_units_kwh: Optional[float] = Field(default=None, ge=0)
    monthly_bill_inr: Optional[float] = Field(default=None, ge=0)
    # The panel_id the user was previously looking at, so the response can
    # show exactly what changed relative to it (Section 5 — "clearly
    # explain if the selected product changes panel count/cost/etc").
    baseline_panel_id: str


class ProductEstimateDeltas(BaseModel):
    panel_count_delta: int
    system_capacity_kw_delta: float
    gross_cost_inr_delta: float
    annual_generation_kwh_delta: float
    annual_savings_inr_delta: float
    payback_years_delta: Optional[float] = None


class ProductEstimateResponse(BaseModel):
    product: ProductInfo
    result: Optional[PanelResult] = None
    baseline_panel_id: str
    deltas: Optional[ProductEstimateDeltas] = None
    price_used_per_watt: Optional[float] = None
    price_is_indicative: bool
    # Populated instead of `result` when the product has no publicly
    # available price — cost/savings/payback genuinely cannot be estimated,
    # so they're omitted rather than guessed. Sizing-only info still shown.
    unavailable_reason: Optional[str] = None
    panel_count_if_known: Optional[int] = None
    system_capacity_kw_if_known: Optional[float] = None


# ---------------------------------------------------------------------------
# "Compare My Solar Quote" — optional advanced feature (Sections 6-7).
# Deliberately structured so a future "Bring Your Own Quote" multi-quote
# comparison can reuse QuoteInfo without a rewrite (each quote is already a
# standalone, identifiable record — a list of these plus an id would be all
# that's needed to extend this to Quote A vs B vs C).
# ---------------------------------------------------------------------------
class QuoteInfo(BaseModel):
    installer_name: Optional[str] = None
    panel_manufacturer: Optional[str] = None
    panel_model: Optional[str] = None
    panel_watt: Optional[float] = None
    panel_count: Optional[int] = None
    system_capacity_kw: Optional[float] = None
    inverter_brand: Optional[str] = None
    total_price_inr: Optional[float] = None
    installation_charges_inr: Optional[float] = None
    subsidy_assumed_inr: Optional[float] = None
    mounting_structure: Optional[str] = None
    warranty_info: Optional[str] = None


class QuoteExtractResponse(BaseModel):
    success: bool
    quote: QuoteInfo
    fields_found: list[str] = Field(default_factory=list)
    fields_missing: list[str] = Field(default_factory=list)
    raw_text: Optional[str] = None
    message: str


class QuoteCompareRequest(BaseModel):
    quote: QuoteInfo
    analysis: AnalyzeResponse
    # Which of analysis.panel_results to compare the quote against; defaults
    # to analysis.recommended_panel_id if not given.
    compare_to_panel_id: Optional[str] = None


class QuoteComparisonItem(BaseModel):
    label: str
    helio_value: str
    quote_value: str
    note: str  # plain-English, hedged language — never "bad"/"scam"/"overpriced"


class QuoteComparisonResponse(BaseModel):
    items: list[QuoteComparisonItem]
    summary: str
