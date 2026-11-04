#!/usr/bin/env python3
"""Import Fife's eight reused-number services from explicitly verified registrations.

Registrations were checked against the current operator XML stop sequences,
route termini, and 4-10 Nov 2026 validity dates, not inferred from route number.
"""
import argparse
import json
import sys
import import_official_fife_times as base
import resolve_official_fife_routes as extras  # safe HolidaysOnly calendar handling

REGISTRATIONS = {
    "4": "PM0000004:398",       # Dunfermline - Blairhall (not Perth)
    "6": "PM0000004:676",       # Crombie - Dunfermline (not Perth)
    "7": "PM0000004:103",       # Dunfermline - Kirkcaldy - Leven (not Perth)
    "7B": "PM0000004:791",      # Kelty - Dalgety Bay (not Perth)
    "7C": "PM0000004:791",      # Kelty - Dalgety Bay (not Perth)
    "8": "PM0000004:372",       # Dunfermline - Valleyfield (not Perth)
    "14A": "PM0000004:768",    # Kirkcaldy circular (not Perth)
    "59": "PM0000004:454",     # Glenrothes - St Andrews (not Dundee/Blairgowrie)
}

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--mode",choices=("dry-run","apply"),default="dry-run")
    cli.add_argument("--limit",type=int,default=0)
    args=cli.parse_args()
    with open("data/fife-active-services.json",encoding="utf8") as fh:
        services=[x for x in json.load(fh)["services"] if x["code"] in REGISTRATIONS]
    assert len(services)==len(REGISTRATIONS),"Fife service master missing a verified route"
    sheet=base.fetch_sheet()
    remaining=[s for s in services if not base.has_user_note(sheet,s["id"])]
    print("Verified route numbers",len(services),"still blank",len(remaining),flush=True)
    if not remaining:return
    with base.download() as z:
        candidates=base.ingest_archive(z,set(REGISTRATIONS))
    ready=[]
    for s in remaining:
        code=s["code"]
        expected=REGISTRATIONS[code]
        schedules={}
        for day in base.DAYS:
            opts=[x for x in candidates.get(code,{}).get(day,[]) if x["servicecode"]==expected]
            if not opts:
                print("MISSING OFFICIAL DAY",code,day,flush=True)
                break
            chosen=max(opts,key=lambda x:(x["start"],x["last_edit"],x["revision"]))
            issues={k:v for k,v in chosen["warnings"].items() if k.startswith(code+":") and v}
            if issues:
                print("CALENDAR/TIMING ISSUE",code,day,issues,flush=True)
                break
            schedules[day]={"source":chosen["sourcefile"],"start":chosen["start"],
                            "end":chosen["end"],"trips":chosen["trips"].get((code,day),[])}
        if len(schedules)!=7:
            print("DO NOT IMPORT",code,flush=True)
            continue
        if sum(len(x["trips"]) for x in schedules.values())<3:
            print("TOO FEW JOURNEYS",code,flush=True)
            continue
        note=base.source_note(s,schedules)
        if not (150<len(note)<base.MAX_NOTE):
            print("UNSUPPORTED NOTE LENGTH",code,len(note),flush=True)
            continue
        print("EXACT REGISTRATION MATCH",code,expected,
              "characters",len(note),"records",len(base.prepare_rows(s,note)),
              "Wednesday trips",len(schedules["Wednesday"]["trips"]),flush=True)
        ready.append((s,note))
    print("LAST EIGHT VERIFY ready",len(ready),"not ready",len(remaining)-len(ready),
          "apply",args.mode=="apply",flush=True)
    if args.mode=="apply":
        imported=failed=skipped=0
        for service,note in ready[:args.limit or len(ready)]:
            res=base.apply(service,note)
            if res=="imported":imported+=1
            elif res=="failed":failed+=1
            else:skipped+=1
        print("LAST EIGHT APPLY imported",imported,"failed",failed,"skipped",skipped,flush=True)
        if failed:sys.exit(1)

if __name__=="__main__":
    main()
