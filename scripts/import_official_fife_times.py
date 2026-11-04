#!/usr/bin/env python3
"""Conservative one-time import of official Stagecoach East Scotland TXC timetables.

Dry-run first. Imports only currently blank Fife Service Times records, and only
when exact-date, exact-service stop times pass quality validation. Writes notes
in the Inspector Hub app's TIMES / TIMES_PART / TIMES_COMMIT revision format.
"""
import argparse
import collections
import datetime as dt
import hashlib
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

SOURCE = "https://opendata.stagecoachbus.com/stagecoach-scfi-route-schedule-data-transxchange_2_4.zip"
SHEETS_API = "https://script.google.com/macros/s/AKfycbz3LPrQ7Y1b7Suq7OvYSyoqoW4iYrAzNjBq6Li7t4SbtrfriBjH16e5iGG2ZRTKyjzk0A/exec"
SHEET = "Fife Service Times"
NS = {"t": "http://www.transxchange.org.uk/"}
REF_DATE = dt.date(2026, 11, 4)
DAYS = {
    "Monday": dt.date(2026, 11, 9),
    "Tuesday": dt.date(2026, 11, 10),
    "Wednesday": dt.date(2026, 11, 4),
    "Thursday": dt.date(2026, 11, 5),
    "Friday": dt.date(2026, 11, 6),
    "Saturday": dt.date(2026, 11, 7),
    "Sunday": dt.date(2026, 11, 8),
}
WEEKDAYS = list(DAYS)
DAY_MAP = {
    "Monday": {"Monday"}, "Tuesday": {"Tuesday"}, "Wednesday": {"Wednesday"},
    "Thursday": {"Thursday"}, "Friday": {"Friday"}, "Saturday": {"Saturday"}, "Sunday": {"Sunday"},
    "MondayToFriday": set(WEEKDAYS[:5]),
    "MondayToSaturday": set(WEEKDAYS[:6]),
    "MondayToSunday": set(WEEKDAYS),
    "MondayToThursday": set(WEEKDAYS[:4]),
    "FridayToSunday": set(WEEKDAYS[4:]),
    "SaturdayAndSunday": {"Saturday", "Sunday"},
    "Weekend": {"Saturday", "Sunday"},
    "Weekday": set(WEEKDAYS[:5]),
    "Weekdays": set(WEEKDAYS[:5]),
    "Everyday": set(WEEKDAYS), "Daily": set(WEEKDAYS),
    "NotSunday": set(WEEKDAYS[:6]),
}
TIME_RE = re.compile(r"^(\d{1,2}):(\d{2})(?::(\d{2}))?$")
ISO_DUR = re.compile(r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$")
MAX_NOTE = 260000

def txt(el, path, default=""):
    e = el.find(path, NS) if el is not None else None
    return ((e.text or "").strip() if e is not None else default)

def local(tag):
    return tag.rsplit("}", 1)[-1]

def duration(raw):
    raw = (raw or "PT0S").strip()
    m = ISO_DUR.match(raw)
    if not m:
        raise ValueError("Unsupported duration: " + raw)
    return (int(m[1] or 0) * 3600 + int(m[2] or 0) * 60 + float(m[3] or 0))

def seconds(raw):
    m = TIME_RE.match((raw or "").strip())
    if not m or int(m[2]) >= 60 or int(m[3] or 0) >= 60:
        raise ValueError("Invalid scheduled departure: " + repr(raw))
    return int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3] or 0)

def clock(sec):
    sec = int(round(sec))
    hours, minute = divmod(sec // 60, 60)
    return "%02d:%02d" % (hours % 24, minute)

def active_period(service, date):
    start = txt(service, "t:OperatingPeriod/t:StartDate", "1900-01-01")
    end = txt(service, "t:OperatingPeriod/t:EndDate", "2100-01-01")
    return start <= date.isoformat() <= end

def special_date_match(container, date):
    if container is None:
        return False
    iso = date.isoformat()
    for child in container:
        if local(child.tag) == "DateRange":
            start = txt(child, "t:StartDate")
            end = txt(child, "t:EndDate")
            if start and end and start <= iso <= end:
                return True
        if local(child.tag) == "Date" and (child.text or "").strip() == iso:
            return True
    return False

def runs(profile, date):
    if profile is None:
        return None
    if profile.find(".//t:SchoolDays", NS) is not None or profile.find(".//t:SchoolHolidays", NS) is not None:
        return None
    day_nodes = profile.find("t:RegularDayType/t:DaysOfWeek", NS)
    if day_nodes is None:
        return None
    days = set()
    for child in day_nodes:
        name = local(child.tag)
        if name not in DAY_MAP:
            return None
        days.update(DAY_MAP[name])
    regular = date.strftime("%A") in days
    special = profile.find("t:SpecialDaysOperation", NS)
    if special is not None:
        if special_date_match(special.find("t:DaysOfNonOperation", NS), date):
            return False
        if special_date_match(special.find("t:DaysOfOperation", NS), date):
            return True
    return regular

def stop_names(root):
    names = {}
    for stop in root.findall("./t:StopPoints/t:AnnotatedStopPointRef", NS):
        code = txt(stop, "t:StopPointRef")
        if code:
            locality = txt(stop, "t:LocalityName")
            common = txt(stop, "t:CommonName")
            if common.lower().startswith(locality.lower()) or not locality:
                label = common
            else:
                label = locality + ", " + common
            indicator = txt(stop, "t:Indicator")
            names[code] = label + ((" (" + indicator + ")") if indicator else "")
    return names

def patterns(root):
    sections = {}
    for e in root.findall("./t:JourneyPatternSections/t:JourneyPatternSection", NS):
        sections[e.get("id")] = e.findall("t:JourneyPatternTimingLink", NS)
    patterns_out = {}
    for pat in root.findall(".//t:JourneyPattern", NS):
        refs = txt(pat, "t:JourneyPatternSectionRefs").split()
        links = [link for ref in refs for link in sections.get(ref, [])]
        if not links:
            continue
        patterns_out[pat.get("id")] = {
            "destination": txt(pat, "t:DestinationDisplay"),
            "direction": txt(pat, "t:Direction"),
            "links": links,
        }
    return patterns_out

def trip_stops(vj, pattern, names):
    links = pattern["links"]
    if not links:
        raise ValueError("No timing links")
    t = seconds(txt(vj, "t:DepartureTime"))
    first = txt(links[0], "t:From/t:StopPointRef")
    if not first:
        raise ValueError("Missing first stop")
    override_links = vj.findall("./t:VehicleJourneyTimingLink", NS)
    overrides = {}
    for ov in override_links:
        key = txt(ov, "t:JourneyPatternTimingLinkRef")
        if key:
            overrides[key] = ov
    if override_links and len(overrides) != len(links):
        raise ValueError("Partial per-journey timing overrides")
    calls = [(first, t)]
    for link in links:
        ref = link.get("id")
        ov = overrides.get(ref) if overrides else None
        runtime = txt(ov, "t:RunTime") if ov is not None else txt(link, "t:RunTime")
        to_ref = txt(link, "t:To/t:StopPointRef")
        if not to_ref:
            raise ValueError("Missing destination stop")
        t += duration(runtime)
        wait = txt(ov, "t:To/t:WaitTime") if ov is not None else ""
        if not wait:
            wait = txt(link, "t:To/t:WaitTime")
        t += duration(wait)
        calls.append((to_ref, t))
    if len(calls) < 3:
        raise ValueError("Too few stops on journey")
    if any(t < 0 or t > 48 * 3600 for _, t in calls):
        raise ValueError("Travel outside supported time horizon")
    if any(abs(float(t) % 60) > 0.05 for _, t in calls):
        raise ValueError("Non-minute stop times; cannot represent exactly as HH:MM")
    return calls

def download():
    req = urllib.request.Request(SOURCE, headers={"User-Agent": "InspectorHubStagecoachOfficialScheduleImporter/1.0"})
    with urllib.request.urlopen(req, timeout=120) as response:
        blob = response.read(120 * 1024 * 1024)
    if not (100000 < len(blob) < 120 * 1024 * 1024):
        raise ValueError("Unexpected official timetable archive size")
    return zipfile.ZipFile(io.BytesIO(blob))

def ingest_archive(archive, accepted):
    # Store only files valid in this timetable week and only public route data.
    route_candidates = collections.defaultdict(lambda: collections.defaultdict(list))
    files_used = 0
    dates = list(DAYS.values())
    for member in archive.infolist():
        if not member.filename.lower().endswith(".xml"):
            continue
        try:
            root = ET.fromstring(archive.read(member))
            service = root.find("./t:Services/t:Service", NS)
            if service is None or not any(active_period(service, date) for date in dates):
                continue
            lines = {x.get("id"): txt(x, "t:LineName") for x in root.findall(".//t:Lines/t:Line", NS)}
            matching = {code for code in lines.values() if code in accepted}
            if not matching:
                continue
            servicecode = txt(service, "t:ServiceCode")
            stopmap = stop_names(root)
            pats = patterns(root)
            if not pats:
                continue
            registered = {
                "sourcefile": member.filename,
                "servicecode": servicecode,
                "start": txt(service, "t:OperatingPeriod/t:StartDate"),
                "end": txt(service, "t:OperatingPeriod/t:EndDate"),
                "last_edit": service.get("ModificationDateTime", ""),
                "revision": service.get("RevisionNumber", ""),
                "trips": collections.defaultdict(list),
                "warnings": collections.Counter(),
            }
            journeys = root.findall("./t:VehicleJourneys/t:VehicleJourney", NS)
            for vj in journeys:
                code = lines.get(txt(vj, "t:LineRef"), "")
                if code not in accepted:
                    continue
                pattern = pats.get(txt(vj, "t:JourneyPatternRef"))
                if pattern is None:
                    registered["warnings"][code + ":missingPattern"] += 1
                    continue
                active = []
                prof = vj.find("t:OperatingProfile", NS)
                if prof is None:
                    prof = service.find("t:OperatingProfile", NS)
                for day_name, date in DAYS.items():
                    if not active_period(service, date):
                        continue
                    running = runs(prof, date)
                    if running is None:
                        registered["warnings"][code + ":unknownCalendar"] += 1
                    elif running:
                        active.append(day_name)
                if not active:
                    continue
                try:
                    calls = trip_stops(vj, pattern, stopmap)
                except Exception as exc:
                    registered["warnings"][code + ":timeError"] += 1
                    continue
                dest = txt(vj, "t:DestinationDisplay") or pattern["destination"]
                direction = (dest or names.get(calls[-1][0]) or calls[-1][0]).strip()
                origin = calls[0][0]
                terminal = calls[-1][0]
                trip = {"dest": direction, "origin": origin, "terminal": terminal,
                        "calls": [(code_, int(round(ts))) for code_, ts in calls],
                        "stops": stopmap}
                for day_name in active:
                    registered["trips"][(code, day_name)].append(trip)
            for code in matching:
                for day_name, date in DAYS.items():
                    if active_period(service, date):
                        route_candidates[code][day_name].append(registered)
            files_used += 1
        except ET.ParseError:
            print("UNPARSEABLE XML",member.filename,flush=True)
    print("Eligible official XML files:",files_used,flush=True)
    return route_candidates

def choose(candidate_map, codes):
    schedule = collections.defaultdict(dict)
    ambiguities = {}
    for code in codes:
        for day in DAYS:
            options = candidate_map.get(code, {}).get(day, [])
            # Distinguish multiple registrations with same line number. Never
            # silently combine routes operating elsewhere in Scotland.
            registration_ids = {x["servicecode"] for x in options}
            if len(registration_ids) > 1:
                ambiguities[(code, day)] = sorted(registration_ids)
                continue
            if not options:
                continue
            item = max(options, key=lambda x: (x["start"],x["last_edit"],x["revision"]))
            if item["warnings"][code + ":unknownCalendar"] or item["warnings"][code + ":timeError"] or item["warnings"][code + ":missingPattern"]:
                ambiguities[(code, day)] = ["Uncertain operating calendar or timing in " + item["sourcefile"]]
                continue
            schedule[code][day] = {
                "source": item["sourcefile"], "start": item["start"], "end": item["end"],
                "trips": item["trips"].get((code, day), []),
            }
    return schedule, ambiguities

def label_for(code, names):
    return names.get(code) or "Stop " + code

def render_day(trips, label):
    groups = collections.defaultdict(list)
    for trip in trips:
        # Group identical route endpoints and direction; branches share only
        # their own actual stop passing times, never generated frequency offsets.
        groups[(trip["origin"],trip["terminal"],trip["dest"])].append(trip)
    output = ["[" + label.upper() + "]"]
    for key, journeys in sorted(groups.items(), key=lambda x:(x[0][2].casefold(),x[0][0],x[0][1])):
        names = journeys[0]["stops"]
        origin_name = label_for(key[0],names)
        terminal_name = label_for(key[1],names)
        output.append("")
        output.append("To " + key[2] + " — " + origin_name + " to " + terminal_name)
        stops = {}
        for trip in journeys:
            occurrences = collections.Counter()
            for idx,(stop, secs) in enumerate(trip["calls"]):
                occurrences[stop] += 1
                k = (stop, occurrences[stop])
                if k not in stops:
                    stops[k] = {"times":set(),"positions":[],"name":label_for(stop,trip["stops"])}
                stops[k]["times"].add(clock(secs))
                stops[k]["positions"].append(idx)
        if not stops:
            continue
        order = sorted(stops.values(),key=lambda x:(sum(x["positions"])/len(x["positions"]),x["name"]))
        collisions = collections.Counter(x["name"] for x in order)
        for x in order:
            output.append(x["name"])
            output.append("\t".join(sorted(x["times"])))
    if not groups:
        output.append("No scheduled journeys on this day.")
    return "\n".join(output)

def source_note(service, daily):
    groups = collections.defaultdict(list)
    for day, data in daily.items():
        # The actual timetable is a set of stop names and clock times; exact
        # output identity is sufficient for grouping otherwise equal weekdays.
        trips = data["trips"]
        fingerprint = hashlib.sha256(json.dumps(
            sorted([(x["dest"],x["origin"],x["terminal"],x["calls"]) for x in trips],key=str),
            sort_keys=True).encode()).hexdigest()
        groups[fingerprint].append(day)
    blocks=[]
    for days in groups.values():
        data=daily[days[0]]
        name = " / ".join(days)
        blocks.append(render_day(data["trips"],name))
    periods=sorted(set((x["start"],x["end"]) for x in daily.values()))
    period_str=", ".join("%s to %s" % (start,end) for start,end in periods)
    text = "\n".join([
        "STAGECOACH EAST SCOTLAND — OFFICIAL SCHEDULED TIMES",
        "Service " + service["code"] + " — " + service["route"],
        "Source: Stagecoach official East Scotland TransXChange 2.4 open timetable.",
        "Verified for 4–10 November 2026. Data valid: " + period_str,
        "Times shown are scheduled, not live. Check operator updates for diversions and holidays.",
        "",
        "\n\n".join(blocks),
    ])
    return text

def fetch_sheet():
    url = SHEETS_API + "?sheet=" + urllib.parse.quote(SHEET) + "&_=" + str(int(time.time() * 1000))
    with urllib.request.urlopen(url,timeout=35) as res:
        obj = json.loads(res.read())
    if not isinstance(obj,dict) or not isinstance(obj.get("data"),list):
        raise ValueError("Cannot verify existing Google Sheets Times records")
    return obj["data"]

def has_user_note(allrows, service_id):
    # Any non-seed activity may be a manual edit or a partially transferred
    # revision. Never overwrite it.
    return any(isinstance(r,list) and len(r)>9 and r[1]==service_id and
               str(r[9]).upper() not in ("SEED","") for r in allrows)

def chunks(text, max_chars=13500):
    chars = list(text)
    return ["".join(chars[i:i+max_chars]) for i in range(0,len(chars),max_chars)] or [""]

def prepare_rows(service, note):
    identifier = "STAGECOACH-" + hashlib.sha256((service["id"]+note).encode()).hexdigest()[:20]
    pieces = chunks(note)
    created = dt.datetime.now(dt.timezone.utc).isoformat()
    def make(text,rev,action):
        return [created,service["id"],service["code"],service["route"],
                "Stagecoach official timetable import",len([x for x in note.splitlines() if x.strip()]),
                text,"",rev,action,service["source_url"]]
    if len(pieces)==1:
        return [make(note,identifier,"TIMES")]
    return [make(x,identifier+"#"+str(i+1)+"/"+str(len(pieces)),"TIMES_PART")
            for i,x in enumerate(pieces)] + [make("",identifier,"TIMES_COMMIT")]

def row_present(sheet, row):
    return any(isinstance(r,list) and len(r)>9 and r[1]==row[1] and
               r[8]==row[8] and r[9]==row[9] for r in sheet)

def post_record(row):
    body=json.dumps({"sheet":SHEET,"row":row}).encode("utf-8")
    req=urllib.request.Request(SHEETS_API,data=body,
        headers={"Content-Type":"text/plain;charset=utf-8"},method="POST")
    with urllib.request.urlopen(req,timeout=45) as res:
        res.read(256)
    return True

def apply(service, note):
    # Exact last-minute recheck of live Sheet prevents overwriting an iPad edit.
    rows=fetch_sheet()
    if has_user_note(rows,service["id"]):
        print("SKIP already edited",service["code"],flush=True)
        return "skip"
    uploads=prepare_rows(service,note)
    for row in uploads:
        verified=False
        for attempt in range(4):
            sheet=fetch_sheet()
            if row_present(sheet,row):
                verified=True
                break
            if attempt>0:
                time.sleep(1.5*attempt)
            post_record(row)
            time.sleep(1.2)
        if not verified and row_present(fetch_sheet(),row):
            verified=True
        if not verified:
            print("FAILED confirmation",service["code"],row[9],row[8],flush=True)
            return "failed"
    print("IMPORTED",service["code"],len(uploads),"rows",len(note),"chars",flush=True)
    return "imported"

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--mode",choices=["dry-run","apply"],default="dry-run")
    cli.add_argument("--limit",type=int,default=0,help="Maximum services to import in apply mode")
    args=cli.parse_args()
    with open("data/fife-active-services.json",encoding="utf-8") as f:
        services=json.load(f)["services"]
    target={s["code"] for s in services}
    sheet=fetch_sheet()
    missing=[s for s in services if not has_user_note(sheet,s["id"])]
    print("Services total",len(services),"Already protected",len(services)-len(missing),"Blank",len(missing),flush=True)
    with download() as z:
        print("Official TXC ZIP files",len(z.namelist()),flush=True)
        candidates=ingest_archive(z,target)
    schedules,uncertain=choose(candidates,target)
    print("Ambiguous code/days",len(uncertain),flush=True)
    for (code,day),why in list(sorted(uncertain.items()))[:28]:
        print("UNCERTAIN",code,day,str(why)[:115],flush=True)
    eligible=[]
    for s in missing:
        code=s["code"]
        daily=schedules.get(code,{})
        if len(daily)!=7:
            print("SKIP DAY COVERAGE",code,"found",",".join(daily),"uncertain",sum(k[0]==code for k in uncertain),flush=True)
            continue
        if sum(len(x["trips"]) for x in daily.values())<3:
            print("SKIP INSUFFICIENT JOURNEYS",code,flush=True)
            continue
        note=source_note(s,daily)
        if not (150 < len(note) < MAX_NOTE):
            print("SKIP NOTE SIZE",code,len(note),flush=True)
            continue
        eligible.append((s,note))
        if code in ("1A","7","X24","39"):
            print("VERIFY",code,"day trips",[(d,len(x["trips"])) for d,x in daily.items()],
                  "note beginning",repr(note[:550]),flush=True)
    print("DRY-RUN SUMMARY eligible",len(eligible),"manual",len(services)-len(missing),
          "unfilled",len(missing)-len(eligible),"characters",sum(len(n) for _,n in eligible),flush=True)
    if args.mode!="apply":
        print("NO SPREADSHEET CHANGES MADE",flush=True)
        return
    imported=failed=skipped=0
    for service,note in eligible[:args.limit or len(eligible)]:
        result=apply(service,note)
        if result=="imported":imported+=1
        elif result=="failed":failed+=1
        else:skipped+=1
        time.sleep(0.8)
    print("APPLY SUMMARY imported",imported,"failed",failed,"skipped",skipped,flush=True)
    if failed:sys.exit(1)

if __name__=="__main__":
    main()
