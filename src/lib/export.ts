import type { Variant } from '../types'
const save=(name:string,type:string,text:string)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
export const exportJSON=(v:Variant)=>save(`${v.id}.json`,'application/json',JSON.stringify(v,null,2))
const dt=(date:string,time:string)=>date.replaceAll('-','')+'T'+time.replace(':','')+'00'
export const exportICS=(v:Variant)=>{const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Academic Planner//RU'];for(const m of v.meetings){if(!m.dateStart)continue;lines.push('BEGIN:VEVENT',`UID:${m.meetingId}@academic-planner.local`,`DTSTART:${dt(m.dateStart,m.start)}`,`DTEND:${dt(m.dateStart,m.end)}`,`RRULE:FREQ=WEEKLY;UNTIL=${(m.dateEnd||m.dateStart).replaceAll('-','')}T235959`,`SUMMARY:${m.teacher} · ${m.room}`,`LOCATION:${m.room}`,'END:VEVENT')}lines.push('END:VCALENDAR');save(`${v.id}.ics`,'text/calendar',lines.join('\r\n'))}
