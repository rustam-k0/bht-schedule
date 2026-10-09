#!/usr/bin/env python3
"""Offline importer for the supplied HISinOne MHTML exports and Modulhandbuch."""
from __future__ import annotations
import json, re, hashlib
from pathlib import Path
from email import policy
from email.parser import BytesParser
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT.parent / "plan" / "source-exports"
MODULE_PDF = ROOT.parent / "plan" / "module-handbook.pdf"
EMAIL_IMPORT = ROOT.parent / "plan/source-extracts/email-import-2026-10-08.json"

def import_email_group(modules):
  if not EMAIL_IMPORT.exists(): return
  facts = json.loads(EMAIL_IMPORT.read_text())
  module = next(m for m in modules if m["name"] == "Web Engineering II")
  course = next(c for c in module["courses"] if c["type"] == "exercise")
  template = next(g for g in course["groups"] if g["zugs"] == [1])
  group_id = sid("grp", course["courseId"], "email-INBOX-1784956070-81")
  provenance = source(facts["sourceFile"], "INBOX UIDVALIDITY 1784956070, UID 81, 2026-10-06: Jens von Pilgrim announces an additional Zug 1 exercise Wednesday 12:15–13:45, B240. Official group number and validity dates not stated.")
  meeting = dict(meetingId=sid("meet", group_id, "WE", "12:15", "13:45", "B240"),
                 groupId=group_id, moduleId=module["moduleId"], courseId=course["courseId"],
                 teacherId=template["teacherId"], teacher=template["teacher"], room="B240",
                 weekday="WE", dateStart=None, dateEnd=None, start="12:15", end="13:45", source=provenance)
  if not any(g["groupId"] == group_id for g in course["groups"]):
    course["groups"].append(dict(groupId=group_id, courseId=course["courseId"], moduleId=module["moduleId"],
                                parallelGroup=None, titleOriginal="Web Engineering II Übg. (Zug 1) — additional Wednesday group",
                                zugs=[1], teacherId=template["teacherId"], teacher=template["teacher"],
                                registrationPeriod=None, meetings=[meeting], source=provenance))

def import_email_exam_sources(modules):
  if not EMAIL_IMPORT.exists(): return None
  facts = json.loads(EMAIL_IMPORT.read_text())
  confirmed = 0
  for record in facts["exams"]:
    module = next(m for m in modules if m["name"] == record["subject"])
    matches = [e for e in module["examSlots"] if e.get("date") == record["date"]
               and e.get("gvParallelGroup") in record["zugs"]
               and e.get("start") in (record["start"], record["start"][:5])
               and e.get("end") in (record["end"], record["end"][:5])]
    if len(matches) != 1:
      raise ValueError(f"Email exam confirmation does not match one existing slot: UID {record['uid']}")
    slot = matches[0]
    # Keep dates, rooms and stable IDs from the existing exam import.
    slot["source"] = source(record.get("calendarFile", facts["sourceFile"]), f"INBOX UIDVALIDITY 1784956070, UID {record['uid']}; {record['attachment']}; {record['subject']}, track(s) {record['zugs']}; email body and ICS independently verified on {facts['reviewDate']}; timezone not stated.")
    confirmed += 1
  return dict(reviewedInboxMessages=facts["reviewedInboxMessages"], examConfirmations=confirmed,
              courseUpdates=len(facts["updates"]), homeworkTasks=len(facts["tasks"]),
              recognizedModuleSnapshots=len(facts["personalPlanning"]["recognition"]["modules"]))

def import_exam_notifications(modules):
  path = ROOT.parent / "plan/source-extracts/exam-notifications-2026-10-07.json"
  if not path.exists(): return
  records = json.loads(path.read_text())
  records += json.loads((ROOT.parent / "plan/source-extracts/exam-notifications-2026-10-09.json").read_text())
  for record in records:
    module = next(m for m in modules if m["name"] == record["subject"])
    candidates = [e for e in module["examSlots"] if e["gvParallelGroup"] in record["zugs"]]
    exact = [e for e in candidates if e["date"] == record["date"]]
    # Update one existing placeholder when no dated slot exists; preserve stable IDs.
    slot = exact[0] if exact else next(e for e in candidates if e["date"] is None)
    slot.update(date=record["date"], start=record["start"], end=record["end"],
                weekday=["MO","TU","WE","TH","FR","SA","SU"][__import__("datetime").date.fromisoformat(record["date"]).weekday()],
                room=record["room"], nachVereinbarung=False, zugs=record["zugs"],
                source=source(record.get("sourceFile", source_path(path)), record.get("fragment") or f"Notification {record['notificationId']}.ics; screenshot 2026-10-07 {record['screenshotTime']}; track(s) {record['zugs']}; timezone not stated"))

def source_path(path):
  return "../" + path.relative_to(ROOT.parent).as_posix()
OUT = ROOT / "public" / "data"
TARGETS = {
  "Grundlagen der Theoretischen Informatik": ("B02", "exam", [{"label":"Exam","percent":100}], 90, None),
  "Mediendesign Grundlagen": ("B03", "hybrid", [{"label":"Design exercises","percent":75},{"label":"Project","percent":25}], None, "20 hours of project work; exercise sheets every two weeks"),
  "Programmierung II": ("B09", "exam", [{"label":"Exam","percent":100}], 90, None),
  "Betriebssysteme": ("B10", "exam", [{"label":"Exam","percent":100}], 90, None),
  "Computergrafik Grundlagen": ("B14", "hybrid", [{"label":"Exam","percent":50},{"label":"Written exercises","percent":50}], 90, "Exercise sheets every two weeks"),
  "Medientechnologien": ("B15", "hybrid", [{"label":"Exam","percent":65},{"label":"Written exercises","percent":35}], 90, "Exercise sheets every two weeks"),
  "Software Engineering II": ("B18", "hybrid", [{"label":"Exam","percent":50},{"label":"Project","percent":50}], 90, "40 hours of project work"),
  "Web Engineering II": ("B19", "hybrid", [{"label":"Exam","percent":30},{"label":"Project","percent":70}], 90, "40 hours of project work"),
  "Projekt": ("B23", "project", [{"label":"Project","percent":100}], None, "348 hours of project work"),
}
def plain_workload(value):
  value = value.replace("Stunden Präsenz", "class hours").replace("Stunden Selbststudium", "hours of self-study")
  return value.replace("SWS SU", "lecture hours/week").replace("SWS Ü", "practice hours/week")

DAYS = {"Montag":"MO","Dienstag":"TU","Mittwoch":"WE","Donnerstag":"TH","Freitag":"FR","Samstag":"SA"}

def sid(prefix, *parts):
  raw = "|".join(str(x) for x in parts)
  return f"{prefix}-{hashlib.sha1(raw.encode()).hexdigest()[:10]}"

def mhtml_lines(path):
  msg = BytesParser(policy=policy.default).parse(path.open("rb"))
  part = next(p for p in msg.walk() if p.get_content_type() == "text/html")
  html = part.get_payload(decode=True).decode("utf-8", "replace")
  return [s.strip() for s in BeautifulSoup(html, "html.parser").stripped_strings if s.strip()]

def iso_date(s):
  d,m,y = map(int, s.split('.')); return f"20{y:02d}-{m:02d}-{d:02d}"

def parse_schedule(line):
  r = re.search(r"(?:wöchentlich, )?(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag),\s+(?:(\d{2}\.\d{2}\.\d{2})(?:\s*-\s*(\d{2}\.\d{2}\.\d{2}))?\s+)?von\s+(\d{2}:\d{2})\s+bis\s+(\d{2}:\d{2})", line)
  return None if not r else {"weekday":DAYS[r.group(1)],"dateStart":iso_date(r.group(2)) if r.group(2) else None,"dateEnd":iso_date(r.group(3) or r.group(2)) if r.group(2) else None,"start":r.group(4),"end":r.group(5)}

def source(file, fragment): return {"sourceFile":file,"fragment":fragment[:500]}

def parse_group(chunk, module_id, course_id, number, title, file):
  zugs = sorted(set(int(x) for x in re.findall(r"Zug\s*(\d+)", title)))
  teacher = next((chunk[i+1] for i,x in enumerate(chunk[:-1]) if x == "Dozent/-in"), "Unbekannt")
  registration = next((x for x in chunk if x.startswith("Anmeldung möglich")), None)
  gid = sid("grp", course_id, number, ','.join(map(str,zugs)))
  meetings=[]
  for i,line in enumerate(chunk):
    parsed=parse_schedule(line)
    if not parsed: continue
    room = chunk[i+1] if i+1<len(chunk) and chunk[i+1] not in ("Dozent/-in","Prüfer/-in") and not parse_schedule(chunk[i+1]) else "—"
    frag=" | ".join(chunk[max(0,i-1):min(len(chunk),i+4)])
    meetings.append({"meetingId":sid("meet",gid,line,room,teacher),"groupId":gid,"moduleId":module_id,"courseId":course_id,"teacherId":sid("teacher",teacher),"teacher":teacher,"room":room,**parsed,"source":source(file,frag)})
  return {"groupId":gid,"courseId":course_id,"moduleId":module_id,"parallelGroup":number,"titleOriginal":title,"zugs":zugs,"teacherId":sid("teacher",teacher),"teacher":teacher,"registrationPeriod":registration,"meetings":meetings,"source":source(file," | ".join(chunk[:8]))}

def parse_exam_groups(chunk, module_id, course_id, file):
  slots=[]
  starts=[i for i,x in enumerate(chunk) if re.fullmatch(r"\d+\. Parallelgruppe \(GV: \d+\. Parallelgruppe\)",x)]
  for pos,i in enumerate(starts):
    seg=chunk[i:(starts[pos+1] if pos+1<len(starts) else len(chunk))]
    m=re.match(r"(\d+)\. Parallelgruppe \(GV: (\d+)\. Parallelgruppe\)",seg[0]); assert m
    examiner=next((seg[j+1] for j,x in enumerate(seg[:-1]) if x=="Prüfer/-in"),"Unbekannt")
    sched=next((parse_schedule(x) for x in seg if parse_schedule(x)),None)
    nva="nach Vereinbarung" in seg
    slots.append({"examSlotId":sid("exam",module_id,m.group(1),seg[1] if len(seg)>1 else ''),"moduleId":module_id,"courseId":course_id,"parallelGroup":int(m.group(1)),"gvParallelGroup":int(m.group(2)),"teacherId":sid("teacher",examiner),"examiner":examiner,"nachVereinbarung":nva,"date":sched["dateStart"] if sched else None,"weekday":sched["weekday"] if sched else None,"start":sched["start"] if sched else None,"end":sched["end"] if sched else None,"source":source(file," | ".join(seg[:6]))})
  return slots

def pdf_sections(text):
  sections={}
  for name,(code,*_) in TARGETS.items():
    start=text.find(f"Modulnummer                {code}")
    end=text.find("Modulnummer",start+20)
    sec=text[start:end if end>0 else len(text)]
    def field(label,next_labels):
      p=sec.find(label)
      if p<0:return ""
      e=min([x for lab in next_labels if (x:=sec.find(lab,p+len(label)))>=0] or [len(sec)])
      return re.sub(r"\s+"," ",sec[p+len(label):e]).strip()
    sections[name]={"modulNumber":code,"workload":field("Workload",["Lerngebiet"]),"teachingForm":field("Lehrform",["Status"]),"assessmentRaw":field("Prüfungsform",["Ermittlung der Modulnote"])}
  return sections

def main():
  OUT.mkdir(parents=True,exist_ok=True)
  modules=[]; all_meetings=[]; all_exams=[]; teachers={}; duplicates=[]; warnings=[]; found=[]
  pdf_text=(ROOT.parent/"plan"/"source-extracts"/"module-handbook.txt").read_text(encoding="utf-8")
  psecs=pdf_sections(pdf_text)
  for path in sorted(DOCS.glob("0[1-5]-schedule.mhtml")):
    lines=mhtml_lines(path); file=source_path(path)
    module_starts=[]
    for i in range(len(lines)-5):
      if lines[i]=="Modul" and re.fullmatch(r"(?:\d+_\d+|WP\s?\d+)",lines[i+1]) and lines[i+2] in ("Pflicht","Wahlpflicht") and "Fachsemester" in lines[i+3] and "Credits" in lines[i+4]: module_starts.append(i)
    for p,i in enumerate(module_starts):
      end=module_starts[p+1] if p+1<len(module_starts) else len(lines)
      code,status,semline,credline,name=lines[i+1:i+6]
      if name not in TARGETS: continue
      block=lines[i:end]; current,target=map(int,re.search(r"(\d+) von (\d+) Credits",credline).groups())
      module_id=sid("mod",code); courses=[]; exams=[]
      boundaries=[j for j,x in enumerate(block) if x in ("Veranstaltung","Prüfung")]
      for bi,j in enumerate(boundaries):
        bend=boundaries[bi+1] if bi+1<len(boundaries) else len(block); kind=block[j]; seg=block[j:bend]
        if len(seg)<7 or not re.fullmatch(r"\d+",seg[1]): continue
        number=seg[1]; course_id=sid("course",module_id,number,"exam" if kind=="Prüfung" else seg[4])
        if kind=="Prüfung": exams.extend(parse_exam_groups(seg,module_id,course_id,file)); continue
        form=seg[4]; ctype="exercise" if "Übung" in form else ("project" if name=="Projekt" else "lecture")
        title=seg[6] if len(seg)>6 else name
        starts=[k for k,x in enumerate(seg) if re.fullmatch(r"\d+\. Parallelgruppe",x)]
        groups=[]
        for gp,k in enumerate(starts):
          gend=starts[gp+1] if gp+1<len(starts) else len(seg); num=int(seg[k].split('.')[0]); gtitle=seg[k+1] if k+1<gend else title
          groups.append(parse_group(seg[k:gend],module_id,course_id,num,gtitle,file))
        courses.append({"courseId":course_id,"moduleId":module_id,"veranstaltungNumber":number,"title":re.sub(r"\s+Übg\.$","",title),"titleOriginal":title,"type":ctype,"groups":groups,"source":source(file," | ".join(seg[:9]))})
      info=TARGETS[name]; ps=psecs[name]
      assessment={"classification":info[1],"components":info[2],"examDurationMinutes":info[3],"courseworkScope":info[4],"assessmentRaw":ps["assessmentRaw"],"note":"Handbook assessment; teachers may change it under §19(2) RSPO.","source":source(source_path(MODULE_PDF),ps["assessmentRaw"])}
      module={"moduleId":module_id,"sourceCode":code,"name":name,"originalName":name,"modulNumber":info[0],"semester":int(re.search(r"(\d+)",semline).group(1)),"credits":target,"status":status,"progressStatus":"open" if current<target else "completed","unscheduled":name=="Projekt" and not any(g["meetings"] for c in courses for g in c["groups"]),"workload":plain_workload(ps["workload"]),"teachingForm":ps["teachingForm"],"assessment":assessment,"courses":courses,"examSlots":exams,"source":source(file," | ".join(block[:10]))}
      modules.append(module); found.append({"module":name,"sourceFile":file,"courses":len(courses),"examSlots":len(exams)})
  import_email_group(modules)
  # Stable dedupe of meetings; duplicates remain visible in the report.
  seen={}
  for m in modules:
    for c in m["courses"]:
      for g in c["groups"]:
        clean=[]
        for x in g["meetings"]:
          key="|".join(map(str,[x["courseId"],g["parallelGroup"],x["dateStart"],x["dateEnd"],x["weekday"],x["start"],x["end"],x["room"],x["teacher"]]))
          if key in seen: duplicates.append({"kept":seen[key],"removed":x["meetingId"],"key":key})
          else: seen[key]=x["meetingId"]; clean.append(x); all_meetings.append(x)
          teachers[x["teacherId"]]={"teacherId":x["teacherId"],"name":x["teacher"]}
        g["meetings"]=clean
    for e in m["examSlots"]: teachers[e["teacherId"]]={"teacherId":e["teacherId"],"name":e["examiner"]}; all_exams.append(e)
  import_exam_notifications(modules)
  email_summary = import_email_exam_sources(modules)
  missing=set(TARGETS)-{m["name"] for m in modules}
  warnings += [{"code":"MISSING_MODULE","message":f"Missing subject: {n}"} for n in sorted(missing)]
  data={"schemaVersion":1,"term":"Wintersemester 2026/27","generatedAt":__import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),"modules":modules,"meetings":all_meetings,"examSlots":all_exams,"teachers":sorted(teachers.values(),key=lambda x:x["name"])}
  report={"generatedAt":__import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),"sourceFiles":[source_path(p) for p in sorted(DOCS.glob("0[1-5]-schedule.mhtml"))]+[source_path(MODULE_PDF),"../plan/source-extracts/exam-notifications-2026-10-07.json","../plan/source-extracts/exam-notifications-2026-10-07.txt","../plan/source-extracts/exam-notifications-2026-10-09.json","../plan/academic-calendar/2026-10-09-computer-graphics-exam-notices.md"],"found":found,"counts":{"modules":len(modules),"courses":sum(len(m["courses"]) for m in modules),"groups":sum(len(c["groups"]) for m in modules for c in m["courses"]),"meetings":len(all_meetings),"examSlots":len(all_exams)},"duplicates":duplicates,"warnings":warnings,"unresolvedFields":[{"field":"room","count":sum(x["room"]=="—" for x in all_meetings),"reason":"No room in the source"}]}
  if email_summary:
    facts = json.loads(EMAIL_IMPORT.read_text())
    report["emailImport"] = email_summary
    report["sourceFiles"] += [source_path(EMAIL_IMPORT), facts["sourceFile"]]
    report["warnings"] += facts["warnings"] + [{"code":"EMAIL_GROUP_FIELDS_UNKNOWN", "message":"WE2 additional Wednesday group: official parallel group number, registration period and date range not stated; stored as null."}]
    report["unresolvedFields"] += [{"field":field, "count":1, "reason":"Additional WE2 exercise announcement does not specify this value"} for field in ("parallelGroup", "dateStart", "dateEnd", "registrationPeriod")]
    report["sourceFiles"] += [source_path(p) for p in sorted((ROOT.parent / "plan/source-exports/recognition").glob("*.pdf"))]
    report["sourceFiles"] += [record["calendarFile"] for record in facts["exams"] if record.get("calendarFile")]
    report["sourceFiles"] += [ref["file"] for event in facts["personalPlanning"]["events"] for ref in event.get("sources", [])]
  (OUT/"schedule.json").write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
  (OUT/"extraction-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
  print(json.dumps(report["counts"],ensure_ascii=False))

if __name__ == "__main__": main()
