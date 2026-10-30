#!/usr/bin/env python3
"""Build the Inspector Hub's first-party Scottish bus-stop catalogue from NaPTAN.

Data: Department for Transport NaPTAN, Open Government Licence v3.0.
https://naptan.api.dft.gov.uk/swagger/index.html
"""
import csv
import datetime as dt
import io
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

# Stagecoach East Scotland operating area plus neighbouring interchange corridors.
AREAS = [
    "650", "648", "649", "640", "620", "629", "627", "628",
    "660", "668", "669", "609", "614", "615", "616",
    "617", "618", "619", "690", "611", "612", "613",
]
API = "https://naptan.api.dft.gov.uk/v1/access-nodes"
OUT = pathlib.Path("scotland-bus-stops.json")
VALID_TYPES = {"BCT", "BCS", "BCQ", "BCP"}
MIN_STOPS = 1000


def download(codes):
    url = API + "?" + urllib.parse.urlencode({
        "atcoAreaCodes": ",".join(codes), "dataFormat": "csv"
    })
    errors = []
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                url, headers={
                    "User-Agent": "InspectorHub-BusStops/1.0 (+https://github.com/michaelskinner75-cyber/inspector-toolkit)",
                    "Accept": "application/zip,text/csv,application/octet-stream,*/*"
                })
            with urllib.request.urlopen(req, timeout=65) as response:
                raw = response.read()
            if len(raw) < 100: raise RuntimeError("Suspiciously small NaPTAN response")
            return raw
        except Exception as exc:
            errors.append(str(exc))
            if attempt < 2: time.sleep(4 * (attempt + 1))
    raise RuntimeError(f"NaPTAN download failed for {codes}: {errors}")


def rows_from_download(data):
    files = []
    if zipfile.is_zipfile(io.BytesIO(data)):
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            names = [s for s in zf.namelist()
                     if s.lower().endswith("stops.csv")]
            if not names:
                raise RuntimeError(f"Zip contains no Stops.csv: {zf.namelist()[:12]}")
            files = [(name, zf.read(name)) for name in names]
    else:
        files = [("Stops.csv", data)]
    for name, raw in files:
        content = raw.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(content))
        if not reader.fieldnames or "ATCOCode" not in reader.fieldnames:
            raise RuntimeError(f"Invalid Stops.csv header in {name}: {reader.fieldnames}")
        yield from reader


def build():
    all_rows = {}
    # Smaller batches avoid enormous API responses and permit regional fallback.
    for start in range(0, len(AREAS), 5):
        codes = AREAS[start:start + 5]
        for row in rows_from_download(download(codes)):
            code = (row.get("ATCOCode") or "").strip()
            if not code or code[:3] not in AREAS: continue
            if (row.get("StopType") or "").upper() not in VALID_TYPES: continue
            if (row.get("Status") or "active").lower() not in ("active", ""): continue
            try:
                lat, lon = float(row["Latitude"]), float(row["Longitude"])
            except (ValueError, TypeError, KeyError):
                continue
            if not (54 <= lat <= 59 and -8 <= lon <= 0): continue
            name = (row.get("CommonName") or row.get("Street") or "Bus stop").strip()
            locality = (row.get("LocalityName") or row.get("Town") or "").strip()
            indicator = (row.get("Indicator") or "").strip()
            # Compact data: lat, lon, ATCO code, common name, locality, indicator.
            all_rows[code] = [round(lat, 6), round(lon, 6), code, name, locality, indicator]
        print(f"Read {len(codes)} NaPTAN area codes; {len(all_rows)} active bus stops", flush=True)
    if len(all_rows) < MIN_STOPS:
        raise RuntimeError(f"Only {len(all_rows)} usable bus stops; refusing to publish")
    data = {
        "source": "Department for Transport NaPTAN (Open Government Licence v3.0)",
        "updated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d"),
        "areas": AREAS,
        "stops": sorted(all_rows.values(), key=lambda s: s[2]),
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Built {OUT}: {len(all_rows)} stops, {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    build()
