import json
import zipfile
import xml.etree.ElementTree as ET

XLSX_PATH = "Historical NBA Drafts March Madness Team Pool.xlsx"
OUTPUT_PATH = "src/config/teams.json"

REGION_MAP = {
    1: "east",
    2: "south",
    3: "west",
    4: "midwest",
}

SHEET_DISPLAY_NAMES = {
    1: "Draft 78 East",
    2: "Draft 78 South",
    3: "Draft 78 West",
    4: "Draft 78 Midwest",
}


def read_shared_strings(z):
    ss = []
    try:
        tree = ET.parse(z.open("xl/sharedStrings.xml"))
        ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        for si in tree.findall(".//s:si", ns):
            text = "".join(t.text or "" for t in si.findall(".//s:t", ns))
            ss.append(text)
    except KeyError:
        pass
    return ss


def cell_value(cell, shared_strings):
    ns_uri = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    t = cell.get("t")
    v = cell.find(f"{{{ns_uri}}}v")
    if v is None:
        return ""
    val = v.text or ""
    if t == "s" and val:
        idx = int(val)
        return shared_strings[idx] if idx < len(shared_strings) else val
    return val


def col_letter_to_index(letter):
    result = 0
    for ch in letter:
        result = result * 26 + (ord(ch) - ord("A"))
    return result


def parse_cell_ref(ref):
    import re
    m = re.match(r"([A-Z]+)(\d+)", ref)
    if not m:
        return 0, 0
    col = col_letter_to_index(m.group(1))
    row = int(m.group(2))
    return row, col


def slugify(name):
    return name.lower().replace(" ", "-").replace("'", "").replace(".", "")


def extract_teams():
    z = zipfile.ZipFile(XLSX_PATH)
    ss = read_shared_strings(z)
    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

    regions = {}

    for sheet_idx in range(1, 5):
        region_id = REGION_MAP[sheet_idx]
        sheet_tree = ET.parse(z.open(f"xl/worksheets/sheet{sheet_idx}.xml"))
        rows = sheet_tree.findall(f".//{{{ns}}}row")

        grid = {}
        for row_el in rows:
            for cell in row_el.findall(f"{{{ns}}}c"):
                ref = cell.get("r")
                r, c = parse_cell_ref(ref)
                grid.setdefault(r, {})[c] = cell_value(cell, ss)

        teams = []
        block_starts = [1, 12, 23, 34]
        col_offsets = [0, 3, 6, 9]

        for block_start in block_starts:
            for col_offset in col_offsets:
                team_name = str(grid.get(block_start, {}).get(col_offset, "")).strip()
                if not team_name:
                    continue

                budget_val = grid.get(block_start, {}).get(col_offset + 2, "0")
                try:
                    budget = int(float(str(budget_val)))
                except (ValueError, TypeError):
                    budget = 0

                team_id = f"{region_id}-{slugify(team_name)}"

                players = []
                for p_row in range(block_start + 1, block_start + 11):
                    player_name = str(grid.get(p_row, {}).get(col_offset, "")).strip()
                    year = str(grid.get(p_row, {}).get(col_offset + 1, "")).strip()
                    price_val = grid.get(p_row, {}).get(col_offset + 2, "0")
                    try:
                        price = int(float(str(price_val)))
                    except (ValueError, TypeError):
                        price = 0

                    if player_name:
                        players.append({
                            "name": player_name,
                            "year": year,
                            "price": price,
                        })

                teams.append({
                    "id": team_id,
                    "name": team_name,
                    "budget": budget,
                    "players": players,
                })

        regions[region_id] = {
            "id": region_id,
            "name": SHEET_DISPLAY_NAMES[sheet_idx],
            "teams": teams,
        }

    with open(OUTPUT_PATH, "w") as f:
        json.dump({"regions": regions}, f, indent=2)

    total = sum(len(r["teams"]) for r in regions.values())
    print(f"Extracted {total} teams across {len(regions)} regions to {OUTPUT_PATH}")


if __name__ == "__main__":
    extract_teams()
