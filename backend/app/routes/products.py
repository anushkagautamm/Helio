from fastapi import APIRouter, HTTPException

from app.config import PanelSpec
from app.models.schemas import ProductEstimateRequest, ProductEstimateResponse, ProductInfo
from app.services import products
from app.services.electricity import effective_tariff_inr_per_kwh
from app.services.nasa_power import get_solar_resource
from app.services.solar import size_system_for_panel
from app.services.subsidy import is_special_category_state

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[ProductInfo])
async def list_all_products():
    return [products.to_product_info(p) for p in products.list_products()]


@router.post("/estimate", response_model=ProductEstimateResponse)
async def estimate_with_product(request: ProductEstimateRequest):
    spec = products.get_product(request.product_id)
    if spec is None:
        raise HTTPException(status_code=404, detail="Unknown product.")

    info = products.to_product_info(spec)
    solar_resource = await get_solar_resource(request.lat, request.lon)
    is_special = is_special_category_state(request.location_label)
    # Tariff must match whatever the baseline estimate used — recomputed the
    # same way analyze.py does, from the same user-provided bill inputs.
    tariff, _ = effective_tariff_inr_per_kwh(request.monthly_bill_inr, request.monthly_units_kwh)

    result = products.estimate_with_product(
        spec,
        roof_area_sqft=request.roof_area_sqft,
        irradiance_kwh_per_m2_day=solar_resource.irradiance_kwh_per_m2_day,
        monthly_irradiance=solar_resource.monthly_irradiance_kwh_per_m2_day,
        tariff_inr_per_kwh=tariff,
        monthly_units_kwh=request.monthly_units_kwh,
        is_special_category=is_special,
    )

    if result is None:
        # No public price for this product — compute sizing only, never a
        # fabricated cost.
        watt = round((spec.watt_min + spec.watt_max) / 2)
        placeholder_spec = PanelSpec(id=spec.id, name=spec.model, watt=watt, cost_per_watt=0)
        count, capacity_kw = size_system_for_panel(request.roof_area_sqft, placeholder_spec)
        return ProductEstimateResponse(
            product=info,
            result=None,
            baseline_panel_id=request.baseline_panel_id,
            deltas=None,
            price_is_indicative=False,
            unavailable_reason=(
                f"{spec.manufacturer} hasn't published a per-model price for this product, so Helio "
                "can't estimate cost or savings for it. Panel sizing is shown below — cost figures "
                "would need a quote directly from the manufacturer or an installer."
            ),
            panel_count_if_known=count,
            system_capacity_kw_if_known=round(capacity_kw, 2),
        )

    return ProductEstimateResponse(
        product=info,
        result=result,
        baseline_panel_id=request.baseline_panel_id,
        deltas=None,  # frontend already holds the baseline PanelResult and can diff locally
        price_used_per_watt=result.cost_per_watt_inr,
        price_is_indicative=True,
    )
