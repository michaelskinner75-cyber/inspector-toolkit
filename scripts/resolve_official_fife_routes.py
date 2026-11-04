#!/usr/bin/env python3
"""Match duplicate Stagecoach route numbers using Fife route termini.

Dry-run by default; never joins unrelated registrations or guesses school-day
journeys. First-level importer is import_official_fife_times.py.
"""
import argparse
import json
import re
import collections
import import_official_fife_times as base

TWO_WORD = ("st andrews", "north queensferry", "south queensferry", "dalgety bay",
            "high valleyfield", "east wemyss", "west wemyss", "st davids", "firth of forth")

def anchors(route):
    items = []
    for segment in re.split(r"\s+-\s+",route.lower()):
        segment = re.sub(r"\s+", " ",segment).strip()
        anchor = next((x for x in TWO_WORD if segment.startswith(x)),segment.split(" ")[0] if segment else "")
        if anchor and anchor not in items and anchor not in ("circular","bus","park","fife"):
            items.append(anchor)
    return items

def details(options,code,day,route):
    refs=anchors(route)
    unique={}
    for candidate in options:
        registration=candidate["servicecode"]
        previous=unique.get(registration)
        if previous is None or (candidate["start"],candidate["last_edit"],candidate["revision"])>(
              previous["start"],previous["last_edit"],previous["revision"]):
            unique[registration]=candidate
    scored=[]
    for reg,source in unique.items():
        trips=source["trips"].get((code,day),[])
        # Match the route's localities against actual running stop calls, not
        # unrelated route numbers that happen to share an operator or file.
        names=[]
        for t in trips:
            names.append(t["dest"])
            names.extend(t["stops"].get(stop,"") for stop,_ in t["calls"])
        haystack=" ".join(names).lower()
        hits=[x for x in refs if x in haystack]
        scored.append((len(hits),reg,source,hits))
    scored.sort(key=lambda x:x[0],reverse=True)
    if len(scored)<2:
        return (scored[0][2],None) if scored else (None,"No current registration")
    best,other=scored[0],scored[1]
    # Accept only a registration that covers all named Fife end places and
    # is strictly better than every alternative. Otherwise require review.
    if best[0]==len(refs) and best[0]>other[0] and best[0]>0:
        return best[2],None
    return None,"Insufficient endpoint distinction: "+repr([(s[1],s[0],s[3]) for s in scored])

def choose_by_terminus(candidate_map,services):
    result=collections.defaultdict(dict)
    problems={}
    for svc in services:
        code=svc["code"]
        for day in base.DAYS:
            options=candidate_map.get(code,{}).get(day,[])
            if not options:
                problems[(code,day)]="No current official timetable"
                continue
            registrations={x["servicecode"] for x in options}
            if len(registrations)==1:
                # Already processed by the first importer: do not duplicate.
                continue
            chosen,error=details(options,code,day,svc["route"])
            if not chosen:
                problems[(code,day)]=error
                continue
            issues=[(k,n) for k,n in chosen["warnings"].items() if k.startswith(code+":") and n]
            if issues:
                problems[(code,day)]=str(issues)
                continue
            result[code][day]={"source":chosen["sourcefile"],"start":chosen["start"],
                               "end":chosen["end"],"trips":chosen["trips"].get((code,day),[])}
    return result,problems

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--mode",choices=("dry-run","apply"),default="dry-run")
    parser.add_argument("--limit",type=int,default=0)
    args=parser.parse_args()
    with open("data/fife-active-services.json") as f:
        services=json.load(f)["services"]
    # Don't import obvious school-service variants, despite old master entries.
    services=[s for s in services if s["code"] not in {"99S","395"}]
    live=base.fetch_sheet()
    pending=[s for s in services if not base.has_user_note(live,s["id"])]
    with base.download() as z:
        candidates=base.ingest_archive(z,{s["code"] for s in pending})
    schedule,problems=choose_by_terminus(candidates,pending)
    eligible=[]
    for service in pending:
        code=service["code"]
        daily=schedule.get(code,{})
        if len(daily)!=7:
            if any((code,day) in problems for day in base.DAYS):
                why=next((problems[(code,d)] for d in base.DAYS if (code,d) in problems),"No data")
                print("UNRESOLVED",code,service["route"],str(why)[:170],flush=True)
            continue
        if sum(len(x["trips"]) for x in daily.values())<3:
            continue
        note=base.source_note(service,daily)
        if not (150<len(note)<base.MAX_NOTE):
            continue
        eligible.append((service,note))
        print("MATCHED REGISTRATION",code,"note bytes",len(note),"first source",daily["Wednesday"]["source"],flush=True)
    print("EXTRA SUMMARY matched",len(eligible),"remaining",len(pending)-len(eligible),"no writes",args.mode=="dry-run",flush=True)
    if args.mode=="apply":
        imported=failed=skipped=0
        for service,note in eligible[:args.limit or len(eligible)]:
            res=base.apply(service,note)
            if res=="imported":imported+=1
            elif res=="failed":failed+=1
            else:skipped+=1
        print("EXTRA APPLY imported",imported,"failed",failed,"skipped",skipped,flush=True)
        if failed:raise RuntimeError("Some imported records failed confirmation")

if __name__=="__main__":
    main()
