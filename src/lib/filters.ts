import type {ExamSlot,Group,Meeting,Module} from '../types'
export type Tracks=Record<string,number|'all'>
export const matchesTrack=(zugs:number[],track:number|'all'|undefined)=>!track||track==='all'||!zugs.length||zugs.includes(track)
export function examTracks(module:Module,exam:ExamSlot):number[]{
 if(exam.zugs?.length)return exam.zugs
 // GV is a lecture parallel group, not a cohort number. Ambiguous links stay unknown.
 const groups=module.courses.filter(c=>c.type==='lecture').flatMap(c=>c.groups).filter(g=>g.parallelGroup===exam.gvParallelGroup)
 return [...new Set(groups.flatMap(g=>g.zugs))]
}
export function filterModules(modules:Module[],enabled:string[],tracks:Tracks,types:string[],groupId:string,teacher:string,mode:string):Module[]{
 return modules.filter(m=>enabled.includes(m.moduleId)).map(m=>({...m,courses:m.courses.filter(c=>types.includes(c.type)).map(c=>({...c,groups:c.groups.filter(g=>matchesTrack(g.zugs,tracks[m.moduleId])&&(groupId==='all'||g.groupId===groupId||!c.groups.some(g=>g.groupId===groupId))&&(teacher==='all'||mode!=='exclude'||g.teacherId!==teacher))}))}))
}
export const localDate=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
export function weekStart(value:string){const date=new Date(`${value}T12:00`);date.setDate(date.getDate()-(date.getDay()+6)%7);return localDate(date)}
export function shiftDate(value:string,days:number){const date=new Date(`${value}T12:00`);date.setDate(date.getDate()+days);return localDate(date)}
export function meetingInWeek(meeting:Meeting,week:string){const offset=['MO','TU','WE','TH','FR','SA','SU'].indexOf(meeting.weekday);if(offset<0)return false;const date=shiftDate(week,offset);return (!meeting.dateStart||date>=meeting.dateStart)&&(!meeting.dateEnd||date<=meeting.dateEnd)}
export function sanitizeSettings(value:any,modules:Module[],teachers:string[]){
 const ids=modules.map(m=>m.moduleId), groups=modules.flatMap(m=>m.courses.flatMap(c=>c.groups.map(g=>g.groupId)))
 const tracks:Tracks={};for(const m of modules){const available=new Set(m.courses.flatMap(c=>c.groups.flatMap(g=>g.zugs)));const v=value.tracks?.[m.moduleId]??value.zug;tracks[m.moduleId]=available.has(v)?v:'all'}
 return {enabled:Array.isArray(value.enabled)?value.enabled.filter((id:string)=>ids.includes(id)):ids,tracks,types:Array.isArray(value.types)?value.types.filter((v:string)=>['lecture','exercise','project'].includes(v)):['lecture','exercise','project'],assessments:Array.isArray(value.assessments)?value.assessments.filter((v:string)=>['exam','hybrid','project','coursework','unknown'].includes(v)):['exam','hybrid','project','coursework','unknown'],parallelGroup:groups.includes(value.parallelGroup)?value.parallelGroup:'all',teacher:teachers.includes(value.teacher)?value.teacher:'all',teacherMode:['highlight','prefer','exclude'].includes(value.teacherMode)?value.teacherMode:'highlight'}
}
export const groupTrackLabel=(group:Group)=>group.zugs.length>1?`Shared · Cohorts ${group.zugs.join(', ')}`:group.zugs.length?`Cohort ${group.zugs[0]}`:'Cohort not specified'
