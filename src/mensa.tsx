import {useEffect,useState} from 'react'
import {shiftDate,weekStart} from './lib/filters'
import {formatDate} from './lib/text'
import {menuEnglish} from './lib/menu-english'
const API='https://openmensa.org/api/v2/canteens/2027'
const OFFICIAL='https://www.stw.berlin/mensen/einrichtungen/berliner-hochschule-f%C3%BCr-technik/mensa-bht.html'
type Meal={id:number;name:string;category:string;prices:Record<string,number|null>;notes:string[]}
type Menu={meals:Meal[];closed:boolean;fetchedAt:number}
const cache=new Map<string,Menu>()
const categoryPriority:Record<string,number>={'Main dishes':0,'Specials':1,'Soups':2,'Salads':3,'Starters':4,'Side dishes':6,'Desserts':7}
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
const initialDate=(week:string)=>weekStart(today())===week?today():week
export function Mensa({week,setWeek}:{week:string;setWeek:(value:string)=>void}){
 const [date,setDate]=useState(()=>initialDate(week)),[menu,setMenu]=useState<Menu|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0)
 useEffect(()=>{setDate(d=>weekStart(d)===week?d:initialDate(week))},[week])
 useEffect(()=>{
  const controller=new AbortController();let active=true
  setError('');setMenu(null);setLoading(true)
  const timeout=setTimeout(()=>controller.abort(),15000)
  async function load(){
   const stored=cache.get(date)
   if(stored&&Date.now()-stored.fetchedAt<5*60*1000)return stored
   const response=await fetch(`${API}/days/${date}`,{signal:controller.signal})
   if(response.status===404)return {meals:[],closed:false,fetchedAt:Date.now()}
   if(!response.ok)throw new Error('Menu unavailable')
   const day=await response.json();if(typeof day.closed!=='boolean')throw new Error('Invalid day')
   let meals:Meal[]=[]
   if(!day.closed){const result=await fetch(`${API}/days/${date}/meals`,{signal:controller.signal});if(!result.ok)throw new Error('Menu unavailable');meals=await result.json();if(!Array.isArray(meals)||meals.some(m=>typeof m.name!=='string'||typeof m.category!=='string'||!Array.isArray(m.notes)||m.notes.some(n=>typeof n!=='string')||!m.prices))throw new Error('Invalid menu');meals=await Promise.all(meals.map(async meal=>({...meal,name:await menuEnglish(meal.name,controller.signal),category:await menuEnglish(meal.category,controller.signal),notes:await Promise.all(meal.notes.map(note=>menuEnglish(note,controller.signal)))})))}
   const value={meals,closed:day.closed===true,fetchedAt:Date.now()};cache.set(date,value);return value
  }
  load().then(value=>{if(active)setMenu(value)}).catch(()=>{if(active)setError('Could not load the English menu. Try again or open the official menu.')}).finally(()=>{clearTimeout(timeout);if(active)setLoading(false)})
  return ()=>{active=false;clearTimeout(timeout);controller.abort()}
 },[date,retry])
 const choose=(value:string)=>{if(!value)return;setDate(value);setWeek(weekStart(value))}
 const categories=[...new Set(menu?.meals.map(m=>m.category)||[])].sort((a,b)=>(categoryPriority[a]??5)-(categoryPriority[b]??5))
 return <div className="page mensa-page"><div className="headline"><div><h1>Canteen</h1><p>Mensa BHT Luxemburger Straße · Luxemburger Straße 9, 13353 Berlin</p></div><a href={OFFICIAL} target="_blank" rel="noreferrer">Official menu ↗</a></div>
 <p className="mensa-source">Timetable week: {formatDate(week)} – {formatDate(shiftDate(week,6))}</p><div className="week-controls"><button aria-label="Previous week" onClick={()=>choose(shiftDate(date,-7))}>Previous week</button><button aria-label="Next week" onClick={()=>choose(shiftDate(date,7))}>Next week</button><button aria-label="Previous menu day" onClick={()=>choose(shiftDate(date,-1))}>←</button><button onClick={()=>choose(today())}>Today</button><button aria-label="Next menu day" onClick={()=>choose(shiftDate(date,1))}>→</button><label>Menu date <input aria-label="Menu date" type="date" value={date} onChange={e=>choose(e.target.value)}/></label></div>
 <p className="mensa-source">{formatDate(date)} · Source: <a href="https://openmensa.org/c/2027" target="_blank" rel="noreferrer">OpenMensa</a>{menu&&` · Retrieved ${new Date(menu.fetchedAt).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'})} (Berlin)`}. Menus may change. English translations use a curated glossary and MyMemory; translation errors are possible.</p>
 {loading&&<p role="status">Loading menu…</p>}{error&&<div role="alert"><p>{error}</p><button onClick={()=>{cache.delete(date);setRetry(v=>v+1)}}>Try again</button></div>}
 {menu?.closed&&<p>The canteen is closed on this date.</p>}{menu&&!menu.closed&&!menu.meals.length&&<p>No menu published for this date. Check the official menu for current information.</p>}
 {categories.map(category=><section className="mensa-category" key={category}><h2>{category}</h2><div className="mensa-meals">{menu!.meals.filter(m=>m.category===category).map(meal=><article key={meal.id}><div className="mensa-meal-heading"><h3>{meal.name}</h3></div><dl className="mensa-prices">{[['students','Students'],['employees','Employees'],['others','Guests']].map(([role,label])=><div key={role}><dt>{label}</dt><dd>{typeof meal.prices[role]==='number'&&Number.isFinite(meal.prices[role])?new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR'}).format(meal.prices[role]!):'Price unavailable'}</dd></div>)}</dl>{meal.notes.length>0&&<details><summary>Allergens and dietary information</summary><ul>{meal.notes.map((note,i)=><li key={i}>{note}</li>)}</ul></details>}</article>)}</div></section>)}
 </div>
}
