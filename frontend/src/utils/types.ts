export interface LocationResult {
  lat: number
  lon: number
  display_name: string
  attribution: string
}

export interface GPSPoint {
  lat: number
  lon: number
}

export interface RoofGPSResponse {
  area_sqm: number
  area_sqft: number
  point_count: number
  warning: string
}

export type OCRSource = 'stated' | 'derived_meter_diff' | 'proximity_match' | 'amount_in_words' | 'unavailable'
export type OCRConfidence = 'high' | 'medium' | 'low' | 'none'

export interface OCRResponse {
  success: boolean
  units_kwh?: number | null
  units_source: OCRSource
  units_confidence: OCRConfidence
  units_note?: string | null
  current_meter_reading?: number | null
  previous_meter_reading?: number | null
  bill_amount_inr?: number | null
  amount_source: OCRSource
  amount_confidence: OCRConfidence
  billing_period?: string | null
  detected_tariff_inr_per_kwh?: number | null
  raw_text?: string | null
  message: string
}

export interface AnalyzeRequest {
  lat: number
  lon: number
  location_label?: string
  roof_area_sqft: number
  monthly_units_kwh?: number | null
  monthly_bill_inr?: number | null
}

export interface SolarResource {
  irradiance_kwh_per_m2_day: number
  monthly_irradiance_kwh_per_m2_day: number[]
  source: string
  is_fallback: boolean
  note: string
}

export interface ElectricityInfo {
  monthly_units_kwh: number | null
  monthly_bill_inr: number | null
  tariff_inr_per_kwh: number
  tariff_source: string
}

export interface RoofInfo {
  gross_area_sqft: number
  gross_area_sqm: number
  usable_area_sqm: number
  usable_fraction: number
}

export interface SubsidyTierBreakdown {
  label: string
  kw_in_tier: number
  rate_per_kw_inr: number
  amount_inr: number
}

export interface CostBreakdown {
  module_cost_inr: number
  inverter_bos_cost_inr: number
  installation_epc_cost_inr: number
}

export interface PanelResult {
  panel_id: string
  panel_name: string
  panel_watt: number
  cost_per_watt_inr: number
  panel_count: number
  system_capacity_kw: number
  monthly_generation_kwh: number
  annual_generation_kwh: number
  monthly_generation_series_kwh: number[]
  gross_cost_inr: number
  cost_breakdown?: CostBreakdown | null
  subsidy_inr: number
  subsidy_breakdown: SubsidyTierBreakdown[]
  net_cost_inr: number
  monthly_savings_inr: number
  annual_savings_inr: number
  payback_years: number | null
  payback_years_int: number | null
  payback_months_remainder: number | null
  co2_avoided_kg_per_year: number
  lifetime_co2_avoided_kg: number
  consumption_offset_percent: number | null
}

export interface Recommendation {
  rating: 'Highly Suitable' | 'Suitable' | 'Potentially Suitable' | 'Needs Further Assessment'
  headline: string
  reasons: string[]
  based_on_panel_id: string
}

export interface SubsidyMeta {
  source_name: string
  source_url: string
  effective_date: string
  accessed_date: string
  is_special_category_state: boolean
  note: string
}

export interface AnalyzeResponse {
  location: LocationResult | null
  roof: RoofInfo
  electricity: ElectricityInfo
  solar_resource: SolarResource
  panel_results: PanelResult[]
  recommended_panel_id: string
  recommendation: Recommendation
  assumptions: Record<string, string>
  subsidy_meta?: SubsidyMeta | null
}

// ---------------------------------------------------------------------------
// Real product catalogue — "Compare Actual Products" advanced feature.
// ---------------------------------------------------------------------------
export interface ProductInfo {
  id: string
  manufacturer: string
  model: string
  watt_min: number
  watt_max: number
  technology: string
  efficiency_percent?: number | null
  price_per_watt_min?: number | null
  price_per_watt_max?: number | null
  price_available: boolean
  almm_listed: boolean
  warranty_years?: number | null
  source_name: string
  source_url: string
  source_date: string
}

export interface ProductEstimateRequest {
  product_id: string
  lat: number
  lon: number
  location_label?: string
  roof_area_sqft: number
  monthly_units_kwh?: number | null
  monthly_bill_inr?: number | null
  baseline_panel_id: string
}

export interface ProductEstimateDeltas {
  panel_count_delta: number
  system_capacity_kw_delta: number
  gross_cost_inr_delta: number
  annual_generation_kwh_delta: number
  annual_savings_inr_delta: number
  payback_years_delta?: number | null
}

export interface ProductEstimateResponse {
  product: ProductInfo
  result?: PanelResult | null
  baseline_panel_id: string
  deltas?: ProductEstimateDeltas | null
  price_used_per_watt?: number | null
  price_is_indicative: boolean
  unavailable_reason?: string | null
  panel_count_if_known?: number | null
  system_capacity_kw_if_known?: number | null
}

// ---------------------------------------------------------------------------
// "Compare My Solar Quote" — optional advanced feature.
// ---------------------------------------------------------------------------
export interface QuoteInfo {
  installer_name?: string | null
  panel_manufacturer?: string | null
  panel_model?: string | null
  panel_watt?: number | null
  panel_count?: number | null
  system_capacity_kw?: number | null
  inverter_brand?: string | null
  total_price_inr?: number | null
  installation_charges_inr?: number | null
  subsidy_assumed_inr?: number | null
  mounting_structure?: string | null
  warranty_info?: string | null
}

export interface QuoteExtractResponse {
  success: boolean
  quote: QuoteInfo
  fields_found: string[]
  fields_missing: string[]
  raw_text?: string | null
  message: string
}

export interface QuoteCompareRequest {
  quote: QuoteInfo
  analysis: AnalyzeResponse
  compare_to_panel_id?: string | null
}

export interface QuoteComparisonItem {
  label: string
  helio_value: string
  quote_value: string
  note: string
}

export interface QuoteComparisonResponse {
  items: QuoteComparisonItem[]
  summary: string
}
