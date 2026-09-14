# Helio — Rooftop Solar Feasibility & Sustainability Advisor

Helio helps Indian homeowners answer a practical question: **does rooftop
solar make sense for my home?** It walks through location, roof size, and
electricity usage to produce a transparent, planning-level estimate of
system size, generation, cost, PM Surya Ghar subsidy, savings, payback
period, and CO₂ impact — with every number traced back to either a formula
or a clearly labelled assumption.

## Features

- Location search (city / pincode / locality) via Nominatim, with a map view and a manual
  lat/lon fallback if search is unavailable
- Roof area input via presets, custom value, or an optional GPS-assisted polygon estimate
- Electricity bill entry with optional best-effort OCR from an uploaded photo
- Solar resource lookup via NASA POWER (`ALLSKY_SFC_SW_DWN`), with a labelled fallback
- Side-by-side comparison of Polycrystalline, Mono PERC, and Bifacial panels
- PM Surya Ghar central subsidy estimate
- Full financial analysis: gross cost, net cost, monthly/annual savings, payback period
- CO₂ avoided per year (configurable emissions factor)
- Transparent, rule-based suitability recommendation with stated reasons
- Downloadable PDF feasibility report 
- No accounts, no database, no stored bills
