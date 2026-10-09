// @vitest-environment jsdom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it} from 'vitest'
import {HomeworkList} from './homework'
import type {Task} from './homework'
import type {Module} from './types'

it('persists CRUD and submission across reloads, sorts deadlines and marks overdue tasks',()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 localStorage.clear()
 const host=document.createElement('div');document.body.append(host)
 let root=createRoot(host)
 const modules=[{moduleId:'se',name:'Software Engineering 2'}] as Module[]
 const render=()=>act(()=>root.render(<HomeworkList modules={modules}/>))
 const click=(text:string)=>{const button=Array.from(host.querySelectorAll('button')).find(b=>b.textContent===text)!;act(()=>button.click())}
 const input=(label:string,value:string)=>{const element=Array.from(host.querySelectorAll('form label')).find(l=>l.firstChild?.textContent===label)!.querySelector('input')!;act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}))})}
 const add=(title:string,date='')=>{click('Add task');input('Title',title);if(date)input('Due date',date);act(()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))}
 const reload=()=>{act(()=>root.unmount());root=createRoot(host);render()}
 render();add('Без даты');add('Позже','2099-01-01');add('Overdue','2020-01-01')
 expect(Array.from(host.querySelectorAll('li b')).map(b=>b.textContent)).toEqual(['Overdue','Позже','Без даты'])
 expect(host.querySelector('.homework-overdue')?.textContent).toContain('Overdue')
 reload();expect(host.querySelectorAll('li')).toHaveLength(3)
 expect(host.textContent).toContain('Tasks · Priority: Medium')
 expect(JSON.parse(localStorage.getItem('bht-homework')!)[0]).toMatchObject({type:'задачи',priority:'средний'})
 act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Edit Позже"]')!.click());input('Title','Изменено');click('Save');reload();expect(host.textContent).toContain('Изменено')
 act(()=>host.querySelector<HTMLInputElement>('li input')!.click());expect(host.querySelectorAll('li')).toHaveLength(2)
 reload();expect(host.querySelectorAll('li')).toHaveLength(2)
 act(()=>host.querySelector<HTMLInputElement>('.homework > .check input')!.click());expect(host.querySelectorAll('li')).toHaveLength(3)
 act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Delete Изменено"]')!.click());reload();expect(host.textContent).not.toContain('Изменено');expect(JSON.parse(localStorage.getItem('bht-homework')!)).toHaveLength(2)
 act(()=>root.unmount());host.remove();localStorage.clear()
})

it('loads imported tasks, preserves local edits and submission, and keeps deletions after reload',()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 localStorage.clear()
 const host=document.createElement('div');document.body.append(host)
 let root=createRoot(host)
 const modules=[{moduleId:'bs',name:'Betriebssysteme'}] as Module[]
 const imported:Task[]=[{id:'mail-task',subject:'bs',track:'',title:'Shell sheet',type:'практика',date:'',time:'',priority:'средний',submitted:false,notes:'Track and deadline unknown'}]
 const render=()=>act(()=>root.render(<HomeworkList modules={modules} imported={imported}/>))
 const reload=()=>{act(()=>root.unmount());root=createRoot(host);render()}
 render()
 expect(host.textContent).toContain('Shell sheet')
 expect(host.textContent).toContain('Cohort not specified')
 expect(host.textContent).toContain('No due date')
 act(()=>host.querySelector<HTMLInputElement>('li input')!.click())
 reload();expect(host.querySelectorAll('li')).toHaveLength(0)
 act(()=>host.querySelector<HTMLInputElement>('.homework > .check input')!.click())
 expect(host.querySelector<HTMLInputElement>('li input')!.checked).toBe(true)
 act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Edit Shell sheet"]')!.click())
 const title=host.querySelector<HTMLInputElement>('form input[maxlength]')!
 act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(title,'My edited task');title.dispatchEvent(new Event('input',{bubbles:true}))})
 act(()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))
 reload();act(()=>host.querySelector<HTMLInputElement>('.homework > .check input')!.click())
 expect(host.textContent).toContain('My edited task')
 act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Delete My edited task"]')!.click())
 reload();expect(host.querySelectorAll('li')).toHaveLength(0)
 act(()=>root.unmount());host.remove();localStorage.clear()
})

it('shows per-module cohorts and refreshes untouched imports without losing edited tasks',()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear()
 const host=document.createElement('div');const root=createRoot(host)
 const modules=[{moduleId:'a',name:'A'},{moduleId:'b',name:'B'}] as Module[]
 const make=(id:string,subject:string,track:string,title=id):Task=>({id,subject,track,title,type:'задачи',date:'',time:'',priority:'средний',submitted:false})
 const imported=[make('a1','a','1'),make('a2','a','2'),make('shared','a','all'),make('unknown','a',''),make('b2','b','2')]
 const render=(tasks=imported)=>act(()=>root.render(<HomeworkList modules={modules} imported={tasks} enabled={['a','b']} tracks={{a:1,b:2}}/>))
 render();expect(Array.from(host.querySelectorAll('li b')).map(b=>b.textContent)).toEqual(['a1','shared','unknown','b2'])
 act(()=>host.querySelector<HTMLInputElement>('li input')!.click())
 expect(JSON.parse(localStorage.getItem('bht-homework')!)).toHaveLength(1)
 render(imported.map(t=>t.id==='b2'?{...t,title:'Updated import'}:t))
 expect(host.textContent).toContain('Updated import');expect(host.textContent).not.toContain('a1')
 act(()=>root.unmount());localStorage.clear()
})
