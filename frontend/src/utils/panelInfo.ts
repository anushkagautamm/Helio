export interface PanelEducationInfo {
  /** One-line positioning shown on the comparison column. */
  summary: string
  whatIsIt: string
  typicalEfficiency: string
  whenItMakesSense: string
  limitations: string
}

// These three options are solar panel TECHNOLOGIES, not brands or specific
// products — every Indian manufacturer (Tata Power Solar, Waaree, Adani
// Solar, Vikram Solar, and others) makes panels in one or more of these
// categories, each at a range of price points. Helio's main comparison
// stays at this technology level; the "Compare Actual Products" section
// below lets you look at specific manufacturer models if you want to go
// further.
export const PANEL_INFO: Record<string, PanelEducationInfo> = {
  poly: {
    summary: 'The lowest cost per watt, in exchange for needing more roof area for the same output.',
    whatIsIt:
      'Polycrystalline (multi-crystalline) is the oldest mainstream panel technology — made from multiple silicon crystal fragments melted together, giving panels their characteristic speckled blue appearance. Many manufacturers offer polycrystalline models.',
    typicalEfficiency: 'Typically around 15–17% panel efficiency.',
    whenItMakesSense:
      "Makes sense when minimising upfront cost matters more than squeezing the most generation out of limited roof space — e.g. homes with generous, unshaded roof area to spare.",
    limitations:
      'Lower efficiency than Mono PERC or Bifacial means more roof area is needed for the same system size, and slightly more temperature-related output loss in peak Indian summer heat.',
  },
  mono_perc: {
    summary: 'The most widely installed residential panel in India — a balance of cost and output per square foot.',
    whatIsIt:
      'Mono PERC (Passivated Emitter and Rear Cell) uses a single, pure silicon crystal with a reflective rear layer that captures extra light. It is currently the most widely installed residential technology in India, offered by nearly every major manufacturer.',
    typicalEfficiency: 'Typically around 19–21% panel efficiency.',
    whenItMakesSense:
      'A strong all-round choice for most Indian homes — a good balance of cost, generation per square foot, and long-term reliability, especially where roof space is moderate.',
    limitations:
      'Costs more per watt than polycrystalline; the efficiency gain matters most when roof area is a limiting factor rather than abundant.',
  },
  bifacial: {
    summary: 'Collects reflected light on the rear side too; the extra gain depends on mounting and roof surface.',
    whatIsIt:
      'Bifacial panels capture sunlight on both their front and rear sides — the rear side picks up light reflected off the roof or mounting surface. Several manufacturers now offer bifacial versions of their Mono PERC or newer TOPCon product lines.',
    typicalEfficiency:
      'Typically around 21–22% front-side efficiency, plus a rear-side gain (commonly 5–15% more energy) that depends heavily on installation.',
    whenItMakesSense:
      'Makes the most sense with elevated mounting over a light-coloured or reflective roof surface (e.g. white terrace, gravel, or light-coloured metal sheet), where the rear-side gain is actually realised.',
    limitations:
      'Highest upfront cost per watt of the three; the rear-side benefit is site-dependent and may add little on a dark, flush-mounted, or heavily shaded roof.',
  },
}
