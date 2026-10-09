// @vitest-environment jsdom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import schedule from '../public/data/schedule.json'
import courses from '../public/data/course-database.json'
import homework from '../public/data/homework.json'
import report from '../public/data/extraction-report.json'
const db=(name:string):any=>({'schedule':schedule,'course-database':courses,'homework':homework,'extraction-report':report}[name])
it('uses filters across tabs, clears a chosen option and saves an empty module selection and week',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 localStorage.clear()
 const data=db('schedule'),m=data.modules[0]
 localStorage.setItem('bht-filters',JSON.stringify({enabled:[m.moduleId],tracks:{[m.moduleId]:2}}))
 vi.stubGlobal('fetch',vi.fn((url:string)=>Promise.resolve({ok:true,json:()=>Promise.resolve(url.startsWith('https://openmensa.org/')?{closed:true}:db(url.split('/').pop()!.replace('.json','')))})))
 const {default:App}=await import('./app')
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 await act(async()=>{root.render(<App/>);await new Promise(r=>setTimeout(r,0))})
 const click=(name:string)=>{const button=Array.from(host.querySelectorAll('button')).find(b=>b.textContent===name)!;expect(button).toBeTruthy();act(()=>button.click())}
 expect(host.querySelector('main')!.textContent).toContain('cohort 2')
 click('Find schedule options');expect(host.querySelector('main')!.textContent).not.toContain('Selected variant')
 click('Show timetable');expect(host.querySelector('main')!.textContent).toContain('Selected variant')
 const select=host.querySelector<HTMLSelectElement>(`[aria-label="${m.name} cohort"]`)!
 act(()=>{select.value='1';select.dispatchEvent(new Event('change',{bubbles:true}))})
 expect(host.querySelector('main')!.textContent).not.toContain('Selected variant')
 expect(host.querySelector('main')!.textContent).toContain('cohort 1')
 click('Exams');expect(host.querySelector('main')!.textContent).toContain('Cohort 1');expect(host.querySelector('main')!.textContent).not.toContain('Cohort 2')
 click('Timetable');act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Next week"]')!.click())
 const saved=JSON.parse(localStorage.getItem('bht-filters')!);expect(saved.week).toBe(host.querySelector<HTMLInputElement>('[aria-label="Go to date"]')!.value)
 act(()=>host.querySelector<HTMLInputElement>('aside input[type=checkbox]')!.click())
 expect(JSON.parse(localStorage.getItem('bht-filters')!).enabled).toEqual([])
 expect(host.querySelector('main')!.textContent).toContain('0 sessions')
 click('Assignments');expect(host.querySelectorAll('li')).toHaveLength(0)
 click('Canteen')
 await act(async()=>{await new Promise(r=>setTimeout(r,0))})
 expect(host.querySelector('h1')!.textContent).toBe('Canteen')
 expect(new URLSearchParams(location.search).get('tab')).toBe('mensa')
 expect(host.querySelector<HTMLInputElement>('[aria-label="Menu date"]')!.value).toBe(saved.week)
 await act(async()=>{host.querySelector<HTMLButtonElement>('[aria-label="Next week"]')!.click();await new Promise(r=>setTimeout(r,0))})
 const canteenWeek=JSON.parse(localStorage.getItem('bht-filters')!).week
 click('Timetable')
 expect(host.querySelector<HTMLInputElement>('[aria-label="Go to date"]')!.value).toBe(canteenWeek)
 act(()=>root.unmount());host.remove();vi.unstubAllGlobals();localStorage.clear()
})
