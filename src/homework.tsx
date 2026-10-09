import {useEffect,useState} from 'react'
import type {FormEvent} from 'react'
import type {Module} from './types'
import {formatDate} from './lib/text'
import {matchesTrack} from './lib/filters'
import type {Tracks} from './lib/filters'
const labels:Record<string,string>={'задачи':'Tasks','практика':'Practice','тест':'Test','проект':'Project','чтение':'Reading','низкий':'Low','средний':'Medium','высокий':'High'}
const taskLabel=(value:string)=>labels[value]||value
const KEY='bht-homework'
const HIDDEN_KEY='bht-homework-hidden'
const types=['задачи','практика','тест','проект','чтение']
const priorities=['низкий','средний','высокий']
export type Task={id:string;subject:string;track:string;title:string;type:string;date:string;time:string;priority:string;submitted:boolean;notes?:string;url?:string|null;sources?:{file:string;scope:string;updatedAt?:string}[]}
const EMPTY:Task[]=[]
const hiddenIds=():string[]=>{try{const value=JSON.parse(localStorage.getItem(HIDDEN_KEY)||'[]');return Array.isArray(value)?value.filter(id=>typeof id==='string'):[]}catch{return []}}
export function mergeImportedTasks(items:Task[],imported:Task[],hidden:string[]):Task[]{const hiddenSet=new Set(hidden),byId=new Map(imported.filter(item=>!hiddenSet.has(item.id)).map(item=>[item.id,item]));for(const item of items)if(!hiddenSet.has(item.id))byId.set(item.id,item);return [...byId.values()]}
const blank=():Task=>({id:'',subject:'',track:'',title:'',type:'задачи',date:'',time:'',priority:'средний',submitted:false})
function load():Task[]{try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.filter(h=>h&&['id','subject','track','title','type','date','time','priority'].every(k=>typeof h[k]==='string')&&typeof h.submitted==='boolean'):[]}catch{return []}}
const due=(h:Task)=>h.date?new Date(`${h.date}T${h.time||'23:59:59.999'}`).getTime():Infinity
export function HomeworkList({modules,imported=EMPTY,enabled,tracks={}}:{modules:Module[];imported?:Task[];enabled?:string[];tracks?:Tracks}){
 const [items,setItems]=useState(load),[show,setShow]=useState(false),[draft,setDraft]=useState<Task|null>(null),[error,setError]=useState(''),[now,setNow]=useState(Date.now)
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),30000);return ()=>window.clearInterval(timer)},[])
 useEffect(()=>{setItems(mergeImportedTasks(load(),imported,hiddenIds()))},[imported])
 function update(next:Task[]){try{localStorage.setItem(KEY,JSON.stringify(next.filter(item=>!imported.some(original=>JSON.stringify(original)===JSON.stringify(item)))));setItems(next);setError('');return true}catch{setError('Could not save tasks. Try again.');return false}}
 function save(e:FormEvent){e.preventDefault();if(!draft?.title.trim())return;const task={...draft,title:draft.title.trim(),time:draft.date?draft.time:'',id:draft.id||crypto.randomUUID()};if(update(draft.id?items.map(h=>h.id===draft.id?task:h):[...items,task]))setDraft(null)}
 function remove(id:string){try{localStorage.setItem(HIDDEN_KEY,JSON.stringify([...new Set([...hiddenIds(),id])]))}catch{setError('Could not save tasks. Try again.');return}if(update(items.filter(item=>item.id!==id))&&draft?.id===id)setDraft(null)}
 const visible=items.filter(h=>(show||!h.submitted)&&(!enabled||enabled.includes(h.subject))&&matchesTrack(h.track&&h.track!=='all'?[Number(h.track)]:[],tracks[h.subject])).sort((a,b)=>(due(a)-due(b)||0)||Number(a.submitted)-Number(b.submitted))
 let month='',date=''
 return <section className="homework" aria-labelledby="homework-title">
 <div className="homework-heading"><h2 id="homework-title">Assignments</h2><button onClick={()=>setDraft({...blank(),subject:modules[0]?.moduleId||''})}>Add task</button></div>
 <label className="check"><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/>Show submitted</label>
 {error&&<p role="alert" className="homework-overdue">{error}</p>}
 {draft&&<form className="homework-form" onSubmit={save}>
 <label>Module<select required value={draft.subject} onChange={e=>setDraft({...draft,subject:e.target.value})}>{modules.map(m=><option value={m.moduleId} key={m.moduleId}>{m.name}</option>)}</select></label>
 <label>Cohort<select value={draft.track} onChange={e=>setDraft({...draft,track:e.target.value})}><option value="">Cohort not specified</option><option value="all">Shared · All cohorts</option><option value="1">Cohort 1</option><option value="2">Cohort 2</option></select></label>
 <label className="homework-title-field">Title<input required maxLength={120} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
 <label>Assignment type<select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value})}>{types.map(t=><option key={t} value={t}>{taskLabel(t)}</option>)}</select></label>
 <label>Priority<select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value})}>{priorities.map(p=><option key={p} value={p}>{taskLabel(p)}</option>)}</select></label>
 <label>Due date<input type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value,time:e.target.value?draft.time:''})}/></label>
 <label>Due time<input type="time" disabled={!draft.date} value={draft.time} onChange={e=>setDraft({...draft,time:e.target.value})}/></label>
 <label className="check"><input type="checkbox" checked={draft.submitted} onChange={e=>setDraft({...draft,submitted:e.target.checked})}/>Submitted</label>
 <div className="homework-actions"><button type="submit">{draft.id?'Save':'Save'}</button><button type="button" onClick={()=>setDraft(null)}>Cancel</button></div>
 </form>}
 {!visible.length?<p className="homework-empty">No tasks to show.</p>:<ul className="homework-list">{visible.map(h=>{const bucket=h.date.slice(0,7)||'No due date',newMonth=bucket!==month,newDate=h.date!==date;month=bucket;date=h.date;return <li key={h.id} className={h.submitted?'homework-submitted':''}>
 <div className="homework-details">{newMonth&&<h3>{h.date?new Date(h.date+'T12:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'}):bucket}</h3>}{newDate&&h.date&&<h4>{formatDate(h.date)}</h4>}<b>{h.title}</b><small>{modules.find(m=>m.moduleId===h.subject)?.name||h.subject} · {h.track==='all'?'Shared · All cohorts':h.track?`Cohort ${h.track}`:'Cohort not specified'}</small><small>{taskLabel(h.type)} · Priority: {taskLabel(h.priority)}</small><span className={!h.submitted&&due(h)<now?'homework-overdue':''}>{h.date?`${formatDate(h.date)}${h.time?` · ${h.time}`:''}`:'No due date'}{!h.submitted&&due(h)<now?' · Overdue':''}</span>{h.notes&&<small>{h.notes}</small>}{h.url&&<small><a href={h.url} target="_blank" rel="noreferrer">Open assignment</a></small>}</div>
 <div className="homework-actions"><label className="check"><input type="checkbox" checked={h.submitted} onChange={e=>update(items.map(item=>item.id===h.id?{...item,submitted:e.target.checked}:item))}/>Submitted</label><button aria-label={`Edit ${h.title}`} onClick={()=>setDraft({...h})}>Edit</button><button aria-label={`Delete ${h.title}`} onClick={()=>remove(h.id)}>Delete</button></div>
 </li>})}</ul>}
 </section>
}
