"""
Central configuration for Helio's calculation engine.

Every tunable assumption used across the calculation modules lives here so it
can be changed in one place without hunting through business logic. Nothing
in services/ should hard-code a number that appears in this file.

Sourcing note: values below marked "Source:" were checked against public
data on 2026-09-14 (see DEVELOPMENT_NOTES.md for the full research trail).
Everything else remains an explicitly labelled planning assumption.
"""
import os

from pydantic import BaseModel


class PanelSpec(BaseModel):
    id: str
    name: str
    watt: int          # panel wattage (W)
    cost_per_watt: float  # planning-level installed cost per watt (INR/W): module + inverter/BOS + installation


# ---------------------------------------------------------------------------
# Solar panel catalogue (Section 7) — three PANEL TECHNOLOGIES, not brands.
#
# cost_per_watt is a blended installed-cost planning figure, anchored to
# MNRE's own PM Surya Ghar benchmark cost (Rs 50,000/kW for the first 2kW,
# Rs 45,000/kW beyond — "Guidelines for PM-Surya Ghar: Muft Bijli Yojana,
# Central Financial Assistance to Residential Consumers", MNRE, effective
# 13 Feb 2024) as the Mono PERC reference point, adjusted for Polycrystalline
# (lower) and Bifacial (higher) using relative module-price premiums observed
# across multiple Indian manufacturers (Waaree, Adani Solar, Vikram Solar —
# solarcalculators.in dealer price guide, accessed 2026-09-14). These are
# still planning-level estimates, not a specific installer's quotation — see
# PRODUCT_CATALOG below for real, sourced manufacturer/model data used in the
# "Compare Actual Products" feature.
# ---------------------------------------------------------------------------
PANEL_OPTIONS: list[PanelSpec] = [
    PanelSpec(id="poly", name="Polycrystalline", watt=330, cost_per_watt=40),
    PanelSpec(id="mono_perc", name="Mono PERC", watt=400, cost_per_watt=48),
    PanelSpec(id="bifacial", name="Bifacial", watt=480, cost_per_watt=56),
]

# Planning-level split of the installed cost above into components (Section
# 9). An industry-typical rule-of-thumb for Indian residential rooftop
# systems, not a certified cost audit — shown to make clear that panel price
# alone is not the full installed-system cost.
COST_BREAKDOWN_FRACTIONS = {
    "module": 0.58,
    "inverter_bos": 0.24,
    "installation_epc": 0.18,
}

# ---------------------------------------------------------------------------
# Roof / panel geometry assumptions (Section 8)
# ---------------------------------------------------------------------------
USABLE_ROOF_FRACTION = 0.65        # fraction of gross roof area usable for panels
PANEL_AREA_SQM = 1.6                # approximate area occupied by one panel, m^2
SQFT_TO_SQM = 0.09290304            # 1 sq ft in sq metres

# ---------------------------------------------------------------------------
# Generation estimate assumptions (Section 9)
# ---------------------------------------------------------------------------
SYSTEM_PERFORMANCE_FACTOR = 0.75    # overall performance ratio / system-loss assumption
DAYS_PER_MONTH = 30
MONTHS_PER_YEAR = 12
FALLBACK_IRRADIANCE_KWH_PER_M2_DAY = 5.5  # used only if NASA POWER is unavailable

# ---------------------------------------------------------------------------
# Electricity tariff assumptions (Section 5)
# ---------------------------------------------------------------------------
DEFAULT_TARIFF_INR_PER_KWH = 7.0    # used when bill amount + units are unavailable

# ---------------------------------------------------------------------------
# PM Surya Ghar subsidy rules (Section 11)
#
# Source: "Guidelines for PM-Surya Ghar: Muft Bijli Yojana, Central
# Financial Assistance to Residential Consumers", Ministry of New and
# Renewable Energy (MNRE), effective 13 February 2024. Accessed 2026-09-14
# via mnre.gov.in / cdnbbsr.s3waas.gov.in. Verified this remains the current
# operative rate as of the access date via multiple secondary sources citing
# the same figures.
#
# The scheme sets a HIGHER rate for "special category" States/UTs
# (Uttarakhand, Himachal Pradesh, J&K, Ladakh, North-East states incl.
# Sikkim, A&N Islands, Lakshadweep). Helio applies this automatically when
# the geocoded location resolves to one of those states — see
# services/subsidy.py.
# ---------------------------------------------------------------------------
SUBSIDY_TIER1_KW = 2.0              # first slab upper bound (kW)
SUBSIDY_TIER1_RATE = 30000          # INR per kW for capacity within tier 1 (general category)
SUBSIDY_TIER2_KW = 3.0              # second slab upper bound (kW)
SUBSIDY_TIER2_RATE = 18000          # INR per kW for capacity within tier 2 (general category)
SUBSIDY_MAX_INR = 78000             # absolute cap on central subsidy (general category)

SUBSIDY_TIER1_RATE_SPECIAL = 33000   # special-category States/UTs
SUBSIDY_TIER2_RATE_SPECIAL = 19800   # special-category States/UTs
SUBSIDY_MAX_INR_SPECIAL = 78000 + 2 * 3000 + 1 * 1800  # = 85800 (2kW*Rs3000 + 1kW*Rs1800 above general cap)

SPECIAL_CATEGORY_STATES = [
    "uttarakhand", "himachal pradesh", "jammu and kashmir", "jammu & kashmir",
    "ladakh", "sikkim", "assam", "arunachal pradesh", "manipur", "meghalaya",
    "mizoram", "nagaland", "tripura", "andaman and nicobar", "andaman & nicobar",
    "lakshadweep",
]

SUBSIDY_SOURCE = {
    "name": "MNRE — Guidelines for PM-Surya Ghar: Muft Bijli Yojana (Central Financial Assistance to Residential Consumers)",
    "url": "https://mnre.gov.in/en/grid-connected-solar-rooftop-programme/",
    "effective_date": "2024-02-13",
    "accessed_date": "2026-09-14",
    "note": (
        "Estimate only. Eligibility, disbursement, and the applicable rate depend on your "
        "state, DISCOM process, and the official rules in force when you apply. Domestic "
        "Content Requirement (DCR) modules from an MNRE ALMM-listed manufacturer are "
        "mandatory for CFA eligibility. Verify current rules at pmsuryaghar.gov.in."
    ),
}

# MNRE's own benchmark installed-system cost (distinct from Helio's PANEL_OPTIONS
# cost_per_watt, which blends technology tiers) — shown for reference/transparency.
MNRE_BENCHMARK_COST_TIER1_INR_PER_KW = 50000  # first 2 kW, general category
MNRE_BENCHMARK_COST_TIER2_INR_PER_KW = 45000  # additional kW, general category

# ---------------------------------------------------------------------------
# Environmental impact assumptions (Section 13)
# ---------------------------------------------------------------------------
CO2_EMISSION_FACTOR_KG_PER_KWH = 0.82
SYSTEM_LIFETIME_YEARS = 25  # used only for an illustrative lifetime CO2 estimate

# ---------------------------------------------------------------------------
# External API configuration (Section 3 & 6)
# ---------------------------------------------------------------------------
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
# Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
# requires a real, identifying User-Agent with a working contact — a generic
# or placeholder value can get requests rate-limited or blocked outright.
# PRODUCTION DEPLOYERS: set the NOMINATIM_USER_AGENT env var to your actual
# app name and a real contact email or project URL before going live. The
# string below is a local-dev-only fallback and is not suitable for
# production traffic.
NOMINATIM_USER_AGENT = os.environ.get(
    "NOMINATIM_USER_AGENT", "Helio-Solar-Advisor/1.0 (contact: helio-app@example.com)"
)
NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"

# Simple in-process TTL cache durations (seconds)
GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 24   # 24 hours
NASA_CACHE_TTL_SECONDS = 60 * 60 * 24      # 24 hours


# ---------------------------------------------------------------------------
# Real product catalogue for the optional "Compare Actual Products" feature
# (advanced/secondary flow — never required for the main recommendation).
#
# Every entry below is a real, publicly documented manufacturer + model, not
# an invented SKU. Where a specific per-model price could not be verified
# from a public source, price fields are left blank rather than guessed —
# the frontend must show "price not publicly available" in that case, never
# a fabricated number.
#
# Sources (accessed 2026-09-14):
# - Waaree, Adani Solar, Vikram Solar models + price ranges: solarcalculators.in
#   dealer price guide, dated 2026-06-05 (dealer/market rates, explicitly
#   marked indicative by that source, not manufacturer list prices).
# - Tata Power Solar: kpowers.co.in buying guide, dated 2026-07-13 — only a
#   brand-level Mono PERC range was publicly available, no specific model.
# - RenewSys DESERV Extreme: manufacturer technology description found via
#   aggregated market search; no public per-model price found, so price is
#   omitted.
# - Premier Energies, EMMVEE: confirmed as MNRE ALMM List-I manufacturers via
#   aggregated market search, but neither publishes public per-model retail
#   pricing (both direct buyers to "contact for quote") — included for ALMM
#   status only, with no price field.
# ---------------------------------------------------------------------------
class ProductSpec(BaseModel):
    id: str
    manufacturer: str
    model: str
    watt_min: int
    watt_max: int
    technology: str  # human-readable, e.g. "Mono PERC", "N-type TOPCon", "Bifacial PERC"
    efficiency_percent: float | None = None
    price_per_watt_min: float | None = None  # None => not publicly available, do not fabricate
    price_per_watt_max: float | None = None
    almm_listed: bool = True
    warranty_years: int | None = None
    source_name: str
    source_url: str
    source_date: str  # accessed date, ISO format


PRODUCT_CATALOG: list[ProductSpec] = [
    ProductSpec(
        id="waaree_aditya",
        manufacturer="Waaree",
        model="Aditya",
        watt_min=390, watt_max=420,
        technology="Mono PERC",
        price_per_watt_min=22, price_per_watt_max=26,
        warranty_years=5,
        source_name="solarcalculators.in — Waaree, Adani & Vikram Solar Panel Price Guide",
        source_url="https://solarcalculators.in/blog/waaree-adani-vikram-solar-dealer-price.html",
        source_date="2026-06-05",
    ),
    ProductSpec(
        id="waaree_aditya_pro",
        manufacturer="Waaree",
        model="Aditya Pro",
        watt_min=540, watt_max=570,
        technology="N-type TOPCon",
        price_per_watt_min=25, price_per_watt_max=29,
        warranty_years=5,
        source_name="solarcalculators.in — Waaree, Adani & Vikram Solar Panel Price Guide",
        source_url="https://solarcalculators.in/blog/waaree-adani-vikram-solar-dealer-price.html",
        source_date="2026-06-05",
    ),
    ProductSpec(
        id="waaree_bifacial",
        manufacturer="Waaree",
        model="Bifacial",
        watt_min=540, watt_max=570,
        technology="Bifacial PERC",
        price_per_watt_min=23, price_per_watt_max=27,
        warranty_years=5,
        source_name="solarcalculators.in — Waaree, Adani & Vikram Solar Panel Price Guide",
        source_url="https://solarcalculators.in/blog/waaree-adani-vikram-solar-dealer-price.html",
        source_date="2026-06-05",
    ),
    ProductSpec(
        id="adani_bihiku5",
        manufacturer="Adani Solar",
        model="BiHiKu5",
        watt_min=530, watt_max=560,
        technology="Mono PERC Bifacial",
        price_per_watt_min=24, price_per_watt_max=28,
        warranty_years=5,
        source_name="solarcalculators.in — Waaree, Adani & Vikram Solar Panel Price Guide",
        source_url="https://solarcalculators.in/blog/waaree-adani-vikram-solar-dealer-price.html",
        source_date="2026-06-05",
    ),
    ProductSpec(
        id="adani_hiku6",
        manufacturer="Adani Solar",
        model="HiKu6",
        watt_min=540, watt_max=580,
        technology="N-type TOPCon",
        price_per_watt_min=26, price_per_watt_max=31,
        warranty_years=5,
        source_name="solarcalculators.in — Waaree, Adani & Vikram Solar Panel Price Guide",
        source_url="https://solarcalculators.in/blog/waaree-adani-vikram-solar-dealer-price.html",
        source_date="2026-06-05",
    ),
    ProductSpec(
        id="vikram_somera",
        manufacturer="Vikram Solar",
        model="Somera",
        watt_min=555, watt_max=590,
        technology="N-type TOPCon",
        price_per_watt_min=25, price_per_watt_max=30,
        warranty_years=5,
        source_name="solarcalculators.in — Waaree, Adani & Vikram Solar Panel Price Guide",
        source_url="https://solarcalculators.in/blog/waaree-adani-vikram-solar-dealer-price.html",
        source_date="2026-06-05",
    ),
    ProductSpec(
        id="vikram_eldora",
        manufacturer="Vikram Solar",
        model="Eldora",
        watt_min=420, watt_max=450,
        technology="Mono PERC",
        price_per_watt_min=21, price_per_watt_max=25,
        warranty_years=5,
        source_name="solarcalculators.in — Waaree, Adani & Vikram Solar Panel Price Guide",
        source_url="https://solarcalculators.in/blog/waaree-adani-vikram-solar-dealer-price.html",
        source_date="2026-06-05",
    ),
    ProductSpec(
        id="tata_mono_perc_range",
        manufacturer="Tata Power Solar",
        model="Mono PERC series (specific model not publicly listed)",
        watt_min=380, watt_max=440,
        technology="Mono PERC",
        price_per_watt_min=24, price_per_watt_max=30,
        warranty_years=5,
        source_name="kpowers.co.in — Tata Power Solar Panels: Buying Guide",
        source_url="https://kpowers.co.in/tata-power-solar-panels-homeowners-buying-guide-2026/",
        source_date="2026-07-13",
    ),
    ProductSpec(
        id="renewsys_deserv_extreme",
        manufacturer="RenewSys",
        model="DESERV Extreme",
        watt_min=565, watt_max=610,
        technology="Bifacial N-type TOPCon",
        efficiency_percent=24.0,
        price_per_watt_min=None, price_per_watt_max=None,  # not publicly available — not fabricated
        warranty_years=None,
        source_name="Aggregated market search (manufacturer technology description; no public per-model price found)",
        source_url="https://www.mnre.gov.in/en/almm/",
        source_date="2026-09-14",
    ),
    ProductSpec(
        id="premier_energies_almm",
        manufacturer="Premier Energies",
        model="(model-specific pricing not publicly listed)",
        watt_min=400, watt_max=550,
        technology="Mono PERC / TOPCon",
        price_per_watt_min=None, price_per_watt_max=None,
        warranty_years=None,
        source_name="ALMM List-I status confirmed via aggregated market search; manufacturer directs buyers to contact for pricing",
        source_url="https://www.mnre.gov.in/en/almm/",
        source_date="2026-09-14",
    ),
    ProductSpec(
        id="emmvee_almm",
        manufacturer="EMMVEE",
        model="(model-specific pricing not publicly listed)",
        watt_min=400, watt_max=550,
        technology="Mono PERC / TOPCon",
        price_per_watt_min=None, price_per_watt_max=None,
        warranty_years=None,
        source_name="ALMM List-I status confirmed via aggregated market search; manufacturer directs buyers to contact for pricing",
        source_url="https://www.mnre.gov.in/en/almm/",
        source_date="2026-09-14",
    ),
]
