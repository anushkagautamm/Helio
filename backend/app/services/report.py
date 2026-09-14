"""
PDF report generation (Section 17/18), built with ReportLab (pure-Python,
no external binary dependency).

Structure mirrors the in-app results dashboard so the PDF reads as a
professional feasibility report rather than a data dump:

  1. Cover            — recommendation headline, location, date
  2. Your Home         — location, roof, electricity, solar resource
  3. Solar System       — panel comparison, recommended system, generation
  4. Financials         — cost, subsidy breakdown, savings, payback
  5. Sustainability      — CO2 impact + why/assumptions/disclaimers
"""
import io
from datetime import datetime

from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Circle, Drawing, Group, Line, Polygon, String
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.models.schemas import AnalyzeResponse, PanelResult

_GREEN = colors.HexColor("#1F7A4D")
_GREEN_DARK = colors.HexColor("#123D27")
_SUN = colors.HexColor("#D98C1F")
_DARK = colors.HexColor("#1A1A14")
_MUTED = colors.HexColor("#5A5A52")
_LIGHT_BG = colors.HexColor("#F2F7F4")
_LINE = colors.HexColor("#DDE3DE")
_CARD_BORDER = colors.HexColor("#E3E8E1")

_MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

_FONT = "Helvetica"
_FONT_BOLD = "Helvetica-Bold"


def _styles():
    """
    Every custom style sets `leading` explicitly (≈1.25x font size for
    headings, ~1.4x for body copy). ReportLab's ParagraphStyle otherwise
    defaults leading to a fixed 12pt regardless of font size — harmless at
    9-10pt body text, but at heading sizes (15-30pt) it makes each line's
    reserved vertical space smaller than the glyphs actually rendered,
    so the next flowable (a rule, a subtitle) overlaps the heading itself.
    """
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CoverSubtitle", fontSize=13, leading=17, textColor=_MUTED, spaceAfter=22))
    styles.add(ParagraphStyle(name="CoverRating", fontSize=22, leading=26, textColor=colors.white, fontName=_FONT_BOLD, alignment=1))
    styles.add(ParagraphStyle(name="CoverRatingSub", fontSize=11, leading=15, textColor=colors.white, alignment=1, spaceBefore=5))
    styles.add(ParagraphStyle(name="CoverHeadline", fontSize=16, leading=20, textColor=_DARK, fontName=_FONT_BOLD, alignment=1, spaceAfter=10))
    styles.add(ParagraphStyle(name="PageTitle", fontSize=20, leading=25, textColor=_GREEN_DARK, fontName=_FONT_BOLD, spaceAfter=10))
    styles.add(ParagraphStyle(name="PageKicker", fontSize=9.5, leading=13, textColor=_SUN, fontName=_FONT_BOLD, spaceAfter=3))
    styles.add(ParagraphStyle(name="Section", fontSize=13, leading=17, textColor=_GREEN_DARK, spaceBefore=16, spaceAfter=8, fontName=_FONT_BOLD))
    styles.add(ParagraphStyle(name="Body", fontSize=9.5, leading=14, textColor=_DARK))
    styles.add(ParagraphStyle(name="Muted", fontSize=8.5, leading=13, textColor=_MUTED))
    return styles


def _section(text: str, styles) -> list:
    """
    A section heading with a small accent bar, as a ready-to-extend list:
    [gap-above, heading, gap-below]. A Paragraph's spaceBefore/spaceAfter
    is silently ignored once it's nested in a Table cell (needed here for
    the accent bar), so the surrounding gaps are plain Spacers instead —
    returned together so every call site gets them automatically rather
    than repeating three lines each time.
    """
    bar = Table([[""]], colWidths=[3.2 * mm], rowHeights=[5 * mm])
    bar.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), _SUN)]))
    heading = Table([[bar, Paragraph(text, styles["Section"])]], colWidths=[3.2 * mm, None])
    heading.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (1, 0), (1, 0), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return [Spacer(1, 12), heading, Spacer(1, 4)]


def _card(content_rows: list, pad: float = 10) -> Table:
    """Wraps flowables in a bordered, light-background card — matches the web app's card look."""
    table = Table([[c] for c in content_rows], colWidths=[174 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.75, _CARD_BORDER),
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("TOPPADDING", (0, 0), (-1, -1), pad),
                ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
                ("LEFTPADDING", (0, 0), (-1, -1), pad),
                ("RIGHTPADDING", (0, 0), (-1, -1), pad),
            ]
        )
    )
    return table


def _kv_table(rows: list[tuple[str, str]], col_widths=(78 * mm, 96 * mm)) -> Table:
    table = Table(rows, colWidths=list(col_widths))
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), _FONT),
                ("FONTNAME", (1, 0), (1, -1), _FONT_BOLD),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("LEADING", (0, 0), (-1, -1), 13),
                ("TEXTCOLOR", (0, 0), (0, -1), _MUTED),
                ("TEXTCOLOR", (1, 0), (1, -1), _DARK),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, _LIGHT_BG]),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return table


def _stat_row(items: list[tuple[str, str]]) -> Table:
    """A row of big-number stat blocks, e.g. generation / savings / payback."""
    blocks = []
    for label, value in items:
        inner = Table(
            [[Paragraph(value, ParagraphStyle(name="v", fontSize=17, leading=21, textColor=_GREEN_DARK, fontName=_FONT_BOLD))],
             [Paragraph(label, ParagraphStyle(name="l", fontSize=8.5, leading=12, textColor=_MUTED))]],
            colWidths=[54 * mm],
        )
        inner.setStyle(TableStyle([("BOTTOMPADDING", (0, 0), (-1, -1), 2), ("TOPPADDING", (0, 0), (-1, -1), 2)]))
        blocks.append(inner)
    row = Table([blocks], colWidths=[58 * mm] * len(blocks))
    row.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), _LIGHT_BG),
                ("BOX", (0, 0), (-1, -1), 0.75, _CARD_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    return row


# SVG viewBox (x0, y0, width, height) of the brand mark, matching
# frontend/src/components/Logo.tsx exactly — see _logo_drawing().
_LOGO_VIEWBOX = (-30, 70, 415, 115)
_LOGO_RAY_COLOR = colors.HexColor("#FF8A2B")
_LOGO_SUN_COLOR = colors.HexColor("#FFA733")
_LOGO_PANEL_COLOR = colors.HexColor("#2A333B")
_LOGO_PANEL_STROKE = colors.HexColor("#8A94A0")
_LOGO_GRID_COLOR = colors.HexColor("#5A6572")
_LOGO_E_COLOR = colors.HexColor("#FF7A1A")


def _logo_drawing(scale: float = 0.6) -> Drawing:
    """
    Ports the app's vector logo (frontend/src/components/Logo.tsx) directly
    into ReportLab shapes, rather than rasterizing the SVG — no new
    dependency needed, and it stays crisp at any size.

    The icon's shapes use the exact same local coordinates as the SVG
    (same nested-translate structure), transformed by one outer Group
    that handles the SVG-to-PDF axis flip and scale. The wordmark is
    placed with plain (x, y) anchors computed the same way, but *outside*
    that flipped group — flipping a Group mirrors any text inside it,
    since it flips the glyph outlines too, not just their position.
    """
    x0, y0, vb_w, vb_h = _LOGO_VIEWBOX
    width, height = vb_w * scale, vb_h * scale
    drawing = Drawing(width, height)

    icon = Group(
        Circle(30, 20, 26, fillColor=_LOGO_SUN_COLOR, strokeColor=None),
        Line(30, -8, 30, -24, strokeColor=_LOGO_RAY_COLOR, strokeWidth=4, strokeLineCap=1),
        Line(51.89, 2.54, 64.40, -7.43, strokeColor=_LOGO_RAY_COLOR, strokeWidth=4, strokeLineCap=1),
        Line(57.31, 26.23, 72.92, 29.79, strokeColor=_LOGO_RAY_COLOR, strokeWidth=4, strokeLineCap=1),
        Line(42.15, 45.23, 49.09, 59.64, strokeColor=_LOGO_RAY_COLOR, strokeWidth=4, strokeLineCap=1),
        Line(17.85, 45.23, 10.91, 59.64, strokeColor=_LOGO_RAY_COLOR, strokeWidth=4, strokeLineCap=1),
        Line(2.69, 26.23, -12.92, 29.79, strokeColor=_LOGO_RAY_COLOR, strokeWidth=4, strokeLineCap=1),
        Line(8.11, 2.54, -4.40, -7.43, strokeColor=_LOGO_RAY_COLOR, strokeWidth=4, strokeLineCap=1),
        Polygon([-70, 20, 30, 20, 55, 55, -45, 55], fillColor=_LOGO_PANEL_COLOR, strokeColor=_LOGO_PANEL_STROKE, strokeWidth=2),
        Line(-57.5, 20, -32.5, 55, strokeColor=_LOGO_GRID_COLOR, strokeWidth=1.2),
        Line(-45, 20, -20, 55, strokeColor=_LOGO_GRID_COLOR, strokeWidth=1.2),
        Line(-32.5, 20, -7.5, 55, strokeColor=_LOGO_GRID_COLOR, strokeWidth=1.2),
        Line(-20, 20, 5, 55, strokeColor=_LOGO_GRID_COLOR, strokeWidth=1.2),
        Line(-7.5, 20, 17.5, 55, strokeColor=_LOGO_GRID_COLOR, strokeWidth=1.2),
        Line(5, 20, 30, 55, strokeColor=_LOGO_GRID_COLOR, strokeWidth=1.2),
        Line(17.5, 20, 42.5, 55, strokeColor=_LOGO_GRID_COLOR, strokeWidth=1.2),
        Line(-61.67, 31.67, 38.33, 31.67, strokeColor=_LOGO_GRID_COLOR, strokeWidth=1.2),
        Line(-53.33, 43.33, 46.67, 43.33, strokeColor=_LOGO_GRID_COLOR, strokeWidth=1.2),
        transform=(1, 0, 0, 1, 60, 110),  # matches the SVG icon group's translate(60,110)
    )
    drawing.add(Group(icon, transform=(scale, 0, 0, -scale, -x0 * scale, height + y0 * scale)))

    def to_drawing_xy(svg_x, svg_y):
        return (svg_x - x0) * scale, height - (svg_y - y0) * scale

    font_size = 72 * scale
    hx, hy = to_drawing_xy(147, 150)
    ex, ey = to_drawing_xy(199, 150)
    lx, ly = to_drawing_xy(247, 150)
    drawing.add(String(hx, hy, "H", fontName=_FONT_BOLD, fontSize=font_size, fillColor=_GREEN_DARK))
    drawing.add(String(ex, ey, "E", fontName=_FONT_BOLD, fontSize=font_size, fillColor=_LOGO_E_COLOR))
    drawing.add(String(lx, ly, "LIO", fontName=_FONT_BOLD, fontSize=font_size, fillColor=_GREEN_DARK))

    return drawing


def _bar_chart(series: list[float], labels: list[str], width_mm: float, height_mm: float, bar_color) -> Drawing:
    drawing = Drawing(width_mm * mm, height_mm * mm)
    chart = VerticalBarChart()
    chart.x = 8 * mm
    chart.y = 6 * mm
    chart.width = (width_mm - 12) * mm
    chart.height = (height_mm - 14) * mm
    chart.data = [series]
    chart.categoryAxis.categoryNames = labels
    chart.categoryAxis.labels.fontName = _FONT
    chart.categoryAxis.labels.fontSize = 7
    chart.valueAxis.labels.fontName = _FONT
    chart.valueAxis.labels.fontSize = 7
    chart.valueAxis.valueMin = 0
    chart.valueAxis.gridStrokeColor = _LINE
    chart.valueAxis.visibleGrid = True
    chart.valueAxis.gridStrokeWidth = 0.4
    chart.categoryAxis.strokeColor = _LINE
    chart.valueAxis.strokeColor = _LINE
    chart.bars[0].fillColor = bar_color
    chart.barWidth = 7
    chart.groupSpacing = 4
    drawing.add(chart)
    return drawing


def _monthly_chart(panel: PanelResult) -> tuple[Drawing, list]:
    series = panel.monthly_generation_series_kwh or [panel.monthly_generation_kwh] * 12
    drawing = _bar_chart(series, _MONTH_LABELS, 174, 58, _GREEN)
    avg = sum(series) / len(series) if series else 0
    caption = Table(
        [[Paragraph(f"Average: {avg:,.0f} kWh/month", ParagraphStyle(name="cap", fontSize=8, leading=11, textColor=_MUTED, fontName=_FONT))]],
        colWidths=[174 * mm],
    )
    caption.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return drawing, [caption]


def _panel_generation_comparison_chart(panels: list[PanelResult]) -> Drawing:
    series = [round(p.annual_generation_kwh) for p in panels]
    labels = [p.panel_name for p in panels]
    return _bar_chart(series, labels, 174, 50, _SUN)


def _rating_color(rating: str):
    return {
        "Highly Suitable": _GREEN,
        "Suitable": colors.HexColor("#3A9E68"),
        "Potentially Suitable": _SUN,
        "Needs Further Assessment": colors.HexColor("#8A8A80"),
    }.get(rating, _GREEN)


def _draw_footer(canvas, doc):
    """Consistent branded footer + page number, drawn on every page."""
    canvas.saveState()
    canvas.setStrokeColor(_LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 12 * mm, doc.pagesize[0] - 18 * mm, 12 * mm)
    canvas.setFont(_FONT, 8)
    canvas.setFillColor(_MUTED)
    canvas.drawString(18 * mm, 8 * mm, "HELIO — Rooftop Solar Feasibility Report")
    canvas.drawRightString(doc.pagesize[0] - 18 * mm, 8 * mm, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()


def _page_header(kicker: str, title: str, styles) -> list:
    return [
        Paragraph(kicker, styles["PageKicker"]),
        Paragraph(title, styles["PageTitle"]),
        HRFlowable(width="100%", thickness=1, color=_LINE, spaceAfter=6),
    ]


def build_pdf_report(data: AnalyzeResponse) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        title="Helio Rooftop Solar Feasibility Report",
    )
    styles = _styles()
    story = []

    recommended = next(
        (p for p in data.panel_results if p.panel_id == data.recommended_panel_id),
        data.panel_results[0],
    )
    rating_color = _rating_color(data.recommendation.rating)
    loc = data.location

    # ---------------------------------------------------------------- Page 1: Cover
    story.append(Spacer(1, 14 * mm))
    story.append(_logo_drawing())
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("Rooftop Solar Feasibility &amp; Sustainability Report", styles["CoverSubtitle"]))

    rating_box = Table(
        [[Paragraph(data.recommendation.rating.upper(), styles["CoverRating"])],
         [Paragraph(data.recommendation.headline, styles["CoverRatingSub"])]],
        colWidths=[174 * mm],
    )
    rating_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), rating_color),
        ("TOPPADDING", (0, 0), (-1, 0), 18),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 18),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
    ]))
    story.append(rating_box)
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(f"{recommended.system_capacity_kw:.1f} kW recommended solar system", styles["CoverHeadline"]))
    story.append(_stat_row([
        ("Annual Generation", f"{recommended.annual_generation_kwh:,.0f} kWh"),
        ("Annual Savings", f"Rs {recommended.annual_savings_inr:,.0f}"),
        ("Payback Period", f"{recommended.payback_years:.1f} yrs" if recommended.payback_years else "N/A"),
    ]))
    story.append(Spacer(1, 10 * mm))

    meta_card = _card([
        Paragraph(f"<b>Location:</b> {loc.display_name if loc else 'Not specified'}", styles["Body"]),
        Paragraph(f"<b>Panel type:</b> {recommended.panel_name} ({recommended.panel_count} panels)", styles["Body"]),
        Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%d %B %Y, %H:%M')}", styles["Body"]),
    ], pad=10)
    story.append(meta_card)
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="100%", thickness=0.75, color=_LINE))
    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            "This report contains preliminary, planning-level estimates only. It is not an "
            "engineering-grade design or an official government subsidy determination. See "
            "Assumptions &amp; Disclaimers on the final page before making any decisions.",
            styles["Muted"],
        )
    )
    story.append(PageBreak())

    # ---------------------------------------------------------------- Page 2: Your Home
    story.extend(_page_header("YOUR HOME", "Location, Roof &amp; Electricity", styles))

    story.extend(_section("Location", styles))
    story.append(
        _kv_table(
            [
                ("Selected location (user input)", loc.display_name if loc else "Not specified"),
                ("Latitude / Longitude", f"{loc.lat:.5f}, {loc.lon:.5f}" if loc else "-"),
                ("Source", "OpenStreetMap / Nominatim"),
            ]
        )
    )

    story.extend(_section("Roof", styles))
    story.append(
        _kv_table(
            [
                ("Gross roof area (user input)", f"{data.roof.gross_area_sqft:.0f} sq ft ({data.roof.gross_area_sqm:.1f} m²)"),
                ("Usable fraction (assumption)", f"{data.roof.usable_fraction * 100:.0f}%"),
                ("Usable roof area (calculated)", f"{data.roof.usable_area_sqm:.1f} m²"),
            ]
        )
    )

    story.extend(_section("Electricity", styles))
    elec = data.electricity
    story.append(
        _kv_table(
            [
                ("Monthly consumption (user input)", f"{elec.monthly_units_kwh:.0f} kWh" if elec.monthly_units_kwh else "Not provided"),
                ("Monthly bill (user input)", f"Rs {elec.monthly_bill_inr:,.0f}" if elec.monthly_bill_inr else "Not provided"),
                ("Effective tariff (calculated)", f"Rs {elec.tariff_inr_per_kwh:.2f} / kWh"),
                ("Tariff basis", elec.tariff_source),
            ]
        )
    )

    story.extend(_section("Solar Resource", styles))
    sr = data.solar_resource
    story.append(
        _kv_table(
            [
                ("Average daily irradiance (API/fallback)", f"{sr.irradiance_kwh_per_m2_day:.2f} kWh/m²/day"),
                ("Data source", sr.source),
            ]
        )
    )
    story.append(Spacer(1, 5))
    story.append(Paragraph(sr.note, styles["Muted"]))
    story.append(PageBreak())

    # ---------------------------------------------------------------- Page 3: Solar System
    story.extend(_page_header("YOUR SOLAR SYSTEM", "Panel Comparison &amp; Generation", styles))

    story.extend(_section("Panel Comparison — Poly vs Mono PERC vs Bifacial", styles))
    header = ["Panel", "Watt", "Panels", "System", "Gross Cost", "Annual Gen.", "Payback"]
    rows = [header]
    for p in data.panel_results:
        payback_str = f"{p.payback_years:.1f} yrs" if p.payback_years else "N/A"
        marker = " *" if p.panel_id == data.recommended_panel_id else ""
        rows.append(
            [
                p.panel_name + marker,
                f"{p.panel_watt} W",
                str(p.panel_count),
                f"{p.system_capacity_kw:.2f} kW",
                f"Rs {p.gross_cost_inr:,.0f}",
                f"{p.annual_generation_kwh:,.0f} kWh",
                payback_str,
            ]
        )
    comp_table = Table(rows, colWidths=[30 * mm, 15 * mm, 15 * mm, 20 * mm, 28 * mm, 28 * mm, 18 * mm])
    comp_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), _GREEN_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), _FONT_BOLD),
                ("FONTNAME", (0, 1), (-1, -1), _FONT),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("LEADING", (0, 0), (-1, -1), 11),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _LIGHT_BG]),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOX", (0, 0), (-1, -1), 0.75, _CARD_BORDER),
            ]
        )
    )
    story.append(comp_table)
    story.append(Spacer(1, 3))
    story.append(Paragraph("* Recommended option", styles["Muted"]))
    story.append(Spacer(1, 4))
    story.append(_panel_generation_comparison_chart(data.panel_results))

    story.extend(_section(f"Recommended System — {recommended.panel_name}", styles))
    story.append(
        _kv_table(
            [
                ("Number of panels (calculated)", str(recommended.panel_count)),
                ("System capacity (calculated)", f"{recommended.system_capacity_kw:.2f} kW"),
                ("Monthly generation (estimated)", f"{recommended.monthly_generation_kwh:,.0f} kWh"),
                ("Annual generation (estimated)", f"{recommended.annual_generation_kwh:,.0f} kWh"),
            ]
        )
    )
    if recommended.consumption_offset_percent is not None:
        story.append(Spacer(1, 5))
        story.append(
            Paragraph(
                f"This could offset roughly <b>{recommended.consumption_offset_percent:.0f}%</b> of your "
                "estimated annual electricity consumption.",
                styles["Body"],
            )
        )

    if any(recommended.monthly_generation_series_kwh):
        story.append(Spacer(1, 8))
        chart, caption = _monthly_chart(recommended)
        story.append(chart)
        story.extend(caption)

    story.append(PageBreak())

    # ---------------------------------------------------------------- Page 4: Financials
    story.extend(_page_header("THE NUMBERS", "Cost, Subsidy &amp; Savings", styles))

    story.extend(_section("Installation Cost", styles))
    story.append(
        _kv_table(
            [
                ("Cost per watt (assumption)", f"Rs {recommended.cost_per_watt_inr:.0f} / W"),
                ("Gross estimated cost (calculated)", f"Rs {recommended.gross_cost_inr:,.0f}"),
            ]
        )
    )
    if recommended.cost_breakdown:
        story.append(Spacer(1, 5))
        story.append(
            Paragraph(
                "The panel/module price alone is not the full installed cost. Indicative "
                "planning-level split of the gross cost above:",
                styles["Muted"],
            )
        )
        story.append(Spacer(1, 3))
        story.append(
            _kv_table(
                [
                    ("Panels / modules", f"Rs {recommended.cost_breakdown.module_cost_inr:,.0f}"),
                    ("Inverter & other components (BOS)", f"Rs {recommended.cost_breakdown.inverter_bos_cost_inr:,.0f}"),
                    ("Installation & labour (EPC)", f"Rs {recommended.cost_breakdown.installation_epc_cost_inr:,.0f}"),
                ]
            )
        )

    story.extend(_section("PM Surya Ghar Subsidy — Estimated Breakdown", styles))
    if recommended.subsidy_breakdown:
        sub_rows = [["Slab", "Capacity", "Rate", "Amount"]]
        for tier in recommended.subsidy_breakdown:
            sub_rows.append(
                [tier.label, f"{tier.kw_in_tier:.2g} kW", f"Rs {tier.rate_per_kw_inr:,.0f}/kW", f"Rs {tier.amount_inr:,.0f}"]
            )
        sub_rows.append(["", "", "Total (estimated)", f"Rs {recommended.subsidy_inr:,.0f}"])
        sub_table = Table(sub_rows, colWidths=[54 * mm, 30 * mm, 45 * mm, 45 * mm])
        sub_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), _GREEN_DARK),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), _FONT_BOLD),
                    ("FONTNAME", (0, 1), (-1, -2), _FONT),
                    ("FONTNAME", (0, -1), (-1, -1), _FONT_BOLD),
                    ("LINEABOVE", (0, -1), (-1, -1), 0.75, _LINE),
                    ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                    ("LEADING", (0, 0), (-1, -1), 13),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, _LIGHT_BG]),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOX", (0, 0), (-1, -1), 0.75, _CARD_BORDER),
                ]
            )
        )
        story.append(sub_table)
    else:
        story.append(_kv_table([("Estimated Central Subsidy (calculated)", f"Rs {recommended.subsidy_inr:,.0f}")]))
    story.append(Spacer(1, 5))
    subsidy_disclaimer = (
        "This is an estimate only. Eligibility must be verified officially, and actual subsidy "
        "depends on applicable government rules and DISCOM process. Helio is not an official "
        "government portal — verify current rules on the official PM Surya Ghar portal before "
        "making a purchase."
    )
    if data.subsidy_meta:
        category_note = (
            "your location's special-category State/UT rate"
            if data.subsidy_meta.is_special_category_state
            else "the standard-category rate"
        )
        subsidy_disclaimer += (
            f" This estimate uses {category_note}. Source: {data.subsidy_meta.source_name}, "
            f"effective {data.subsidy_meta.effective_date}, checked {data.subsidy_meta.accessed_date}."
        )
    story.append(Paragraph(subsidy_disclaimer, styles["Muted"]))

    story.extend(_section("Net Cost &amp; Savings", styles))
    story.append(
        _kv_table(
            [
                ("Net system cost (calculated)", f"Rs {recommended.net_cost_inr:,.0f}"),
                ("Monthly savings (calculated)", f"Rs {recommended.monthly_savings_inr:,.0f}"),
                ("Annual savings (calculated)", f"Rs {recommended.annual_savings_inr:,.0f}"),
            ]
        )
    )

    story.extend(_section("Payback Period", styles))
    payback_display = "Not applicable (no positive savings)"
    if recommended.payback_years is not None:
        payback_display = f"{recommended.payback_years_int} years, {recommended.payback_months_remainder} months"
    story.append(_kv_table([("Estimated payback (calculated)", payback_display)]))
    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            "Savings are not guaranteed — they depend on actual generation, tariff changes, and "
            "usage patterns over time.",
            styles["Muted"],
        )
    )
    story.append(PageBreak())

    # ---------------------------------------------------------------- Page 5: Sustainability + Why + Assumptions
    story.extend(_page_header("YOUR IMPACT", "Sustainability, Assumptions &amp; Disclaimers", styles))

    story.extend(_section("Environmental Impact", styles))
    story.append(
        _kv_table(
            [
                ("CO2 avoided per year (calculated)", f"{recommended.co2_avoided_kg_per_year:,.0f} kg ({recommended.co2_avoided_kg_per_year / 1000:.2f} t)"),
                ("CO2 avoided per month (calculated)", f"{recommended.co2_avoided_kg_per_year / 12:,.0f} kg"),
                ("Estimated lifetime CO2 avoided (calculated)", f"{recommended.lifetime_co2_avoided_kg / 1000:,.1f} tonnes"),
            ]
        )
    )
    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            "Lifetime figure assumes flat annual generation over the system lifetime shown in "
            "Assumptions below — real panel output degrades gradually over time.",
            styles["Muted"],
        )
    )

    story.extend(_section("Why Helio Says This", styles))
    why_rows = [Paragraph(f"<b>{data.recommendation.rating}</b> — {data.recommendation.headline}", styles["Body"])]
    for reason in data.recommendation.reasons:
        why_rows.append(Paragraph(f"&#8226; {reason}", styles["Body"]))
    story.append(_card(why_rows, pad=10))
    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            "Final suitability depends on roof shading, structural condition, panel orientation, "
            "DISCOM rules, and a physical site inspection — this report does not replace one.",
            styles["Muted"],
        )
    )

    story.extend(_section("Assumptions", styles))
    assumption_paras = [
        Paragraph(f"<b>{label}:</b> {value}", styles["Muted"]) for label, value in data.assumptions.items()
    ]
    story.append(_card(assumption_paras, pad=10))

    story.extend(_section("Disclaimers", styles))
    story.append(
        Paragraph(
            "Helio produces preliminary, planning-level estimates only, using publicly available "
            "data (OpenStreetMap/Nominatim, NASA POWER) and configurable assumptions about costs, "
            "performance, and government schemes. It is not an engineering-grade design, structural "
            "assessment, or official government subsidy determination. Actual roof suitability, "
            "generation, installation cost, subsidy amount, and savings can vary significantly. "
            "Please consult a certified solar installer and verify subsidy eligibility through "
            "official government channels (PM Surya Ghar: Muft Bijli Yojana) before making any "
            "financial decisions.",
            styles["Muted"],
        )
    )
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="100%", thickness=0.75, color=_LINE))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Generated by Helio — for planning purposes only.", styles["Muted"]))

    doc.build(story, onFirstPage=_draw_footer, onLaterPages=_draw_footer)
    return buffer.getvalue()
