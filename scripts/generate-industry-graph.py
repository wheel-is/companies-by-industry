#!/usr/bin/env python3
"""Build a Cosmograph JSON file from company–industry edges."""

from __future__ import annotations

import csv
import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "WYSB" / "web-based-scraper" / "industry_data.csv"
OUT_PATH = Path(__file__).resolve().parents[1] / "public" / "industry-graph.json"

INDUSTRIES_PER_COMPANY = 2


def hsl_to_hex(h: float, s: float, l: float) -> str:
    s /= 100.0
    l /= 100.0
    c = (1.0 - abs(2.0 * l - 1.0)) * s
    x = c * (1.0 - abs((h / 60.0) % 2.0 - 1.0))
    m = l - c / 2.0
    if 0 <= h < 60:
        r, g, b = c, x, 0
    elif 60 <= h < 120:
        r, g, b = x, c, 0
    elif 120 <= h < 180:
        r, g, b = 0, c, x
    elif 180 <= h < 240:
        r, g, b = 0, x, c
    elif 240 <= h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    return "#{:02x}{:02x}{:02x}".format(
        int(round((r + m) * 255)),
        int(round((g + m) * 255)),
        int(round((b + m) * 255)),
    )


def company_size(vc: float) -> float:
    if vc <= 0:
        return 2.0
    return round(2.0 + min(14.0, math.log10(vc + 1.0) * 5.0), 2)


def industry_size(count: int) -> float:
    return round(8.0 + min(42.0, math.sqrt(count) * 0.35), 2)


def parse_vc(raw: str) -> float:
    raw = (raw or "").strip()
    if not raw:
        return 0.0
    try:
        return float(raw)
    except ValueError:
        return 0.0


def main() -> None:
    companies: dict[str, dict] = {}
    industry_freq: dict[str, int] = defaultdict(int)

    with CSV_PATH.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            name = (row.get("id") or "").strip()
            industry = (row.get("target") or "").strip()
            if not name or not industry:
                continue
            record = companies.get(name)
            if record is None:
                record = {
                    "name": name,
                    "industries": set(),
                    "vc": 0.0,
                    "date": "",
                }
                companies[name] = record
            record["industries"].add(industry)
            industry_freq[industry] += 1
            vc = parse_vc(row.get("vc_raised") or "")
            if vc > record["vc"]:
                record["vc"] = vc
            date = (row.get("last_financing_date") or "").strip()
            if date and date > record["date"]:
                record["date"] = date

    industry_names = sorted(industry_freq)
    industry_colors = {
        name: hsl_to_hex((index * 137.508) % 360.0, 68.0, 58.0)
        for index, name in enumerate(industry_names)
    }

    selected_counts: dict[str, int] = defaultdict(int)
    company_nodes = []
    links = []

    for record in companies.values():
        ranked = sorted(
            record["industries"],
            key=lambda name: (industry_freq[name], name),
        )[:INDUSTRIES_PER_COMPANY]
        if not ranked:
            continue
        primary = ranked[0]
        color = industry_colors[primary]
        company_id = f"c:{record['name']}"
        company_nodes.append(
            {
                "id": company_id,
                "label": record["name"],
                "type": "company",
                "color": color,
                "size": company_size(record["vc"]),
                "vc": round(record["vc"], 2),
                "date": record["date"],
            }
        )
        for industry in ranked:
            selected_counts[industry] += 1
            links.append(
                {
                    "source": company_id,
                    "target": f"i:{industry}",
                }
            )

    industry_nodes = []
    for name in industry_names:
        count = selected_counts.get(name, 0)
        if count == 0:
            continue
        industry_nodes.append(
            {
                "id": f"i:{name}",
                "label": name,
                "type": "industry",
                "color": industry_colors[name],
                "size": industry_size(count),
                "count": count,
            }
        )

    payload = {
        "stats": {
            "companies": len(company_nodes),
            "industries": len(industry_nodes),
            "links": len(links),
        },
        "nodes": industry_nodes + company_nodes,
        "links": links,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))

    size_mb = OUT_PATH.stat().st_size / 1e6
    print(
        f"Wrote {OUT_PATH} ({size_mb:.1f} MB) — "
        f"{payload['stats']['companies']} companies, "
        f"{payload['stats']['industries']} industries, "
        f"{payload['stats']['links']} links"
    )


if __name__ == "__main__":
    main()
