import type { Group, Meeting, Module, Variant } from '../types'

export const minutes = (time:string) => { const [h,m]=time.split(':').map(Number); return h*60+m }
const rangesOverlap=(a0:string|null,a1:string|null,b0:string|null,b1:string|null)=>!a0||!a1||!b0||!b1||a0<=b1&&b0<=a1
export function meetingsOverlap(a:Meeting,b:Meeting){ return a.weekday===b.weekday && rangesOverlap(a.dateStart,a.dateEnd,b.dateStart,b.dateEnd) && minutes(a.start)<minutes(b.end) && minutes(b.start)<minutes(a.end) }
export function zugsCompatible(a:Group,b:Group){ return a.zugs.length===0||b.zugs.length===0||a.zugs.some(z=>b.zugs.includes(z)) }
export function groupHasCalendarMeeting(g:Group){ return g.meetings.filter(m=>Boolean(m.weekday&&m.start&&m.end)) }
export function dedupeMeetings(items:Meeting[]){ const seen=new Set<string>(); return items.filter(x=>{const k=[x.courseId,x.groupId,x.dateStart,x.dateEnd,x.weekday,x.start,x.end,x.room,x.teacher].join('|');if(seen.has(k))return false;seen.add(k);return true}) }
export function classifyAssessment(raw:string){const s=raw.toLowerCase(), exam=s.includes('klausur'), project=/projekt|präsentation|praktische arbeit/.test(s), exercise=/übung/.test(s);return exam&&(project||exercise)?'hybrid':exam?'exam':project?'project':exercise?'coursework':'unknown'}

function moduleOptions(module:Module,zug:number|'all'='all'){
  const lecture=module.courses.find(c=>c.type==='lecture')?.groups??[]
  const exercise=module.courses.find(c=>c.type==='exercise')?.groups??module.courses.find(c=>c.type==='project')?.groups??[]
  if(!module.courses.length)return [[]]
  if(module.unscheduled)return [[]]
  if(module.courses.some(c=>!c.groups.length))return []
  const lf=lecture.filter(g=>zug==='all'||(!g.zugs.length||g.zugs.includes(zug))); const ef=exercise.filter(g=>zug==='all'||(!g.zugs.length||g.zugs.includes(zug)))
  if(lf.length&&ef.length)return lf.flatMap(l=>ef.filter(e=>zugsCompatible(l,e)).map(e=>[l,e]))
  return (lf.length?lf:ef).map(g=>[g])
}
function metric(meetings:Meeting[]){
  const byDay=new Map<string,Meeting[]>(); meetings.forEach(m=>byDay.set(m.weekday,[...(byDay.get(m.weekday)||[]),m]))
  let duration=0,gaps=0,changes=0; for(const day of byDay.values()){day.sort((a,b)=>minutes(a.start)-minutes(b.start));day.forEach((m,i)=>{duration+=minutes(m.end)-minutes(m.start);if(i){gaps+=Math.max(0,minutes(m.start)-minutes(day[i-1].end));if(m.room[0]!==day[i-1].room[0])changes++}})}
  let conflicts=0; for(let i=0;i<meetings.length;i++)for(let j=i+1;j<meetings.length;j++)if(meetingsOverlap(meetings[i],meetings[j]))conflicts++
  return {days:byDay.size,minutes:duration,gaps,earliest:meetings.reduce((v,m)=>m.start<v?m.start:v,'23:59'),latest:meetings.reduce((v,m)=>m.end>v?m.end:v,'00:00'),buildingChanges:changes,conflicts,teachers:new Set(meetings.map(m=>m.teacherId)).size}
}
export function generateVariants(modules:Module[],zug:number|'all'='all'):Variant[]{
  let variants:Group[][]=[[]]
  for(const m of modules){const opts=moduleOptions(m,zug);const next:Group[][]=[];for(const v of variants){const existing=v.flatMap(groupHasCalendarMeeting);for(const o of opts){const added=o.flatMap(groupHasCalendarMeeting);if(added.some((a,i)=>added.some((b,j)=>i!==j&&meetingsOverlap(a,b)))||added.some(a=>existing.some(b=>meetingsOverlap(a,b))))continue;next.push([...v,...o])}}variants=next.length>5000?next.sort((a,b)=>{const x=metric(a.flatMap(groupHasCalendarMeeting)),y=metric(b.flatMap(groupHasCalendarMeeting));return x.days-y.days||x.gaps-y.gaps}).slice(0,5000):next}
  return variants.map((groups,i)=>{const meetings=groups.flatMap(groupHasCalendarMeeting),metrics=metric(meetings);return{id:`variant-${i+1}`,groups,meetings,metrics,reasons:[`${metrics.days} attendance days`,metrics.gaps?`Gaps: ${metrics.gaps} min`:'No gaps',metrics.conflicts?'Overlapping sessions':'No overlaps']}}).filter(v=>v.metrics.conflicts===0).sort((a,b)=>a.metrics.days-b.metrics.days||a.metrics.gaps-b.metrics.gaps||a.metrics.minutes-b.metrics.minutes)
}
export function pareto(items:Variant[],limit=12){const frontier:Variant[]=[];for(const a of items){const dominates=(x:Variant,y:Variant)=>x.metrics.days<=y.metrics.days&&x.metrics.gaps<=y.metrics.gaps&&x.metrics.buildingChanges<=y.metrics.buildingChanges&&(x.metrics.days<y.metrics.days||x.metrics.gaps<y.metrics.gaps||x.metrics.buildingChanges<y.metrics.buildingChanges);if(frontier.some(b=>dominates(b,a)))continue;for(let i=frontier.length-1;i>=0;i--)if(dominates(a,frontier[i]))frontier.splice(i,1);frontier.push(a)}return frontier.slice(0,limit)}
