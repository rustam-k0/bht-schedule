// @vitest-environment jsdom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import {Mensa} from './mensa'
import {menuEnglish} from './lib/menu-english'
it('shows prices and notes, distinguishes closure, unpublished dates and errors',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 const fetcher=vi.fn<(url:string)=>Promise<any>>(async(url:string)=>({ok:true,status:200,json:async()=>url.endsWith('/meals')?[{id:1,name:'Linsensuppe',category:'Suppen',prices:{students:0.75,employees:null,others:1.5},notes:['Allergens: 28 Soja']}]:{closed:false}}))
 vi.stubGlobal('fetch',fetcher)
 const host=document.createElement('div'),root=createRoot(host)
 const flush=async(fn:()=>void)=>act(async()=>{fn();await new Promise(r=>setTimeout(r,0))})
 try{
 await flush(()=>root.render(<Mensa week="2030-01-07" setWeek={()=>{}}/>))
 expect(host.textContent).toContain('Lentil soup');expect(host.textContent).toContain('€0.75');expect(host.textContent).toContain('Allergens: 28 Soy')
 expect(host.textContent).toContain('Guests€1.50');expect(host.textContent).toContain('Retrieved')
 const next=()=>host.querySelector<HTMLButtonElement>('[aria-label="Next menu day"]')!.click()
 fetcher.mockImplementation(async()=>({ok:true,status:200,json:async()=>({closed:true})}))
 await flush(next);expect(host.textContent).toContain('The canteen is closed')
 fetcher.mockImplementation(async()=>({ok:false,status:404,json:async()=>({})}))
 await flush(next);expect(host.textContent).toContain('No menu published')
 fetcher.mockRejectedValue(new Error('Network'))
 await flush(next);expect(host.querySelector('[role="alert"]')!.textContent).toContain('Could not load')
 }finally{act(()=>root.unmount());vi.unstubAllGlobals()}
})

it('translates unfamiliar notes while preserving codes and rejects translation failures',async()=>{
 const fetcher=vi.fn(async()=>({ok:true,json:async()=>({responseStatus:200,responseData:{translatedText:'Fish &amp; shellfish'}})}))
 vi.stubGlobal('fetch',fetcher)
 try{
 expect(await menuEnglish('Allergens: 24 Testfisch',new AbortController().signal)).toBe('Allergens: 24 Fish & shellfish')
 expect(fetcher.mock.calls).toHaveLength(1)
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({responseStatus:429,quotaFinished:true})})))
 await expect(menuEnglish('Unbekanntes Gericht',new AbortController().signal)).rejects.toThrow('English translation unavailable')
 }finally{vi.unstubAllGlobals()}
})
it('shows loading and ignores obsolete requests when the timetable week changes',async()=>{
 let finish:(value:any)=>void=()=>{}
 vi.stubGlobal('fetch',vi.fn((url:string)=>url.includes('2032-02-02')?new Promise(resolve=>{finish=resolve}):Promise.resolve({ok:true,json:async()=>({closed:true})})))
 const host=document.createElement('div'),root=createRoot(host),setWeek=vi.fn()
 try{
 await act(async()=>root.render(<Mensa week="2032-02-02" setWeek={setWeek}/>))
 expect(host.querySelector('[role="status"]')!.textContent).toBe('Loading menu…')
 await act(async()=>{root.render(<Mensa week="2032-02-09" setWeek={setWeek}/>);await new Promise(r=>setTimeout(r,0))})
 await act(async()=>{finish({ok:false});await new Promise(r=>setTimeout(r,0))})
 expect(host.textContent).toContain('The canteen is closed');expect(host.querySelector('[role="alert"]')).toBeNull()
 expect(host.querySelector<HTMLInputElement>('[aria-label="Menu date"]')!.value).toBe('2032-02-09')
 await act(async()=>{host.querySelector<HTMLButtonElement>('[aria-label="Next week"]')!.click();await new Promise(r=>setTimeout(r,0))})
 expect(setWeek).toHaveBeenLastCalledWith('2032-02-16')
 }finally{act(()=>root.unmount());vi.unstubAllGlobals()}
})
