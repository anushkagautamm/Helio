/**
 * Centralized plain-language definitions for technical terms used throughout
 * Helio. Keeping these in one place means every "What does this mean?"
 * tooltip stays consistent, and copy only needs updating once.
 */
export const GLOSSARY: Record<string, string> = {
  kW: 'Kilowatt — a measure of how much power a solar system can produce at any instant. A bigger kW number means a bigger system.',
  kWh: 'Kilowatt-hour — a unit used to measure how much electricity you use or generate over time. Your electricity bill is priced per kWh.',
  payback: 'Payback period is how long it takes for your electricity savings to add up to what you paid for the system (after subsidy). After that, the savings are pure benefit.',
  tariff: 'Tariff is the price you pay per unit (kWh) of electricity. Helio calculates yours from your bill amount divided by your usage, when both are available.',
  irradiance: 'Solar irradiance is how much sunlight energy reaches a square metre of your roof each day. More irradiance generally means more electricity generated.',
  performanceRatio: "Performance ratio (or system-loss factor) accounts for real-world losses — inverter efficiency, wiring, dust, and heat — between a panel's rated output and what actually reaches your home.",
  monoPerc: 'Mono PERC panels use single-crystal silicon with a reflective back layer, giving higher efficiency — more electricity from the same roof area — at a moderate cost premium over polycrystalline.',
  bifacial: 'Bifacial panels can capture sunlight on both their front and back sides, generating a little extra electricity from light reflected off the roof or ground, usually at a higher cost.',
  polycrystalline: 'Polycrystalline panels are made from multiple silicon crystals fused together. They are the most affordable option, at a slightly lower efficiency than Mono PERC or Bifacial.',
  subsidy: 'A subsidy is financial support from the government that reduces what you pay upfront. Helio estimates the central PM Surya Ghar subsidy — actual eligibility must be verified officially.',
  usableRoofArea: "Usable roof area is the portion of your total roof that can realistically hold panels, after leaving room for shading, vents, walkways, and structural elements. Helio assumes 65% of your roof is usable.",
  systemCapacity: 'System capacity is the total power your solar setup can produce, measured in kW — calculated from how many panels fit your roof multiplied by each panel’s wattage.',
  co2Avoided: 'CO₂ avoided is an estimate of the greenhouse gas emissions your clean electricity generation offsets, compared to drawing that electricity from the grid.',
}

export type GlossaryTermKey = keyof typeof GLOSSARY
