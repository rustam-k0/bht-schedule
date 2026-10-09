import {expect,it} from 'vitest'
import schedule from '../../public/data/schedule.json'
import {examTracks,filterModules,meetingInWeek,sanitizeSettings,shiftDate,weekStart} from './filters'
import {generateVariants} from './schedule'
import type {Module,ScheduleData} from '../types'
const data=schedule as unknown as ScheduleData
const enabled=data.modules.map(m=>m.moduleId),types=['lecture','exercise','project']
it('filters each module independently and preserves shared sessions',()=>{
 const tracks=Object.fromEntries(data.modules.map((m,i)=>[m.moduleId,i%2?2:1]))
 const filtered=filterModules(data.modules,enabled,tracks,types,'all','all','highlight')
 filtered.forEach(m=>m.courses.forEach(c=>c.groups.forEach(g=>expect(!g.zugs.length||g.zugs.includes(tracks[m.moduleId])).toBe(true))))
 const shared=data.modules.find(m=>m.courses.some(c=>c.groups.some(g=>g.zugs.length>1)))!
 expect(filtered.find(m=>m.moduleId===shared.moduleId)!.courses.some(c=>c.groups.some(g=>g.zugs.length>1))).toBe(true)
 expect(filterModules(data.modules,[],{},types,'all','all','highlight')).toEqual([])
})
it('honours types and group scope without removing other modules',()=>{
 const group=data.modules[0].courses[1].groups[0]
 const filtered=filterModules(data.modules,enabled,{},['exercise'],group.groupId,'all','highlight')
 expect(filtered[0].courses.flatMap(c=>c.groups).map(g=>g.groupId)).toEqual([group.groupId])
 expect(filtered[1].courses[0].groups.length).toBeGreaterThan(1)
 expect(filterModules(data.modules,enabled,{},[], 'all','all','highlight').every(m=>!m.courses.length)).toBe(true)
})
it('navigates weeks and checks the actual weekday against inclusive ranges',()=>{
 expect(weekStart('2026-10-11')).toBe('2026-10-05')
 expect(shiftDate('2026-12-28',7)).toBe('2027-01-04')
 const meeting={...data.meetings[0],weekday:'FR',dateStart:'2026-10-08',dateEnd:'2026-10-09'}
 expect(meetingInWeek(meeting,'2026-10-05')).toBe(true)
 expect(meetingInWeek({...meeting,weekday:'MO'},'2026-10-05')).toBe(false)
 expect(meetingInWeek(meeting,'2026-10-12')).toBe(false)
 expect(meetingInWeek({...meeting,dateStart:null,dateEnd:null},'2026-10-05')).toBe(true)
})
it('migrates old settings, removes obsolete values and preserves deliberate empty selections',()=>{
 const state=sanitizeSettings({enabled:[],zug:2,teacher:'removed',parallelGroup:'removed',types:['bogus','exercise'],assessments:[],teacherMode:'invalid'},data.modules,[])
 expect(state.enabled).toEqual([]);expect(state.assessments).toEqual([]);expect(state.types).toEqual(['exercise'])
 expect(state.teacher).toBe('all');expect(state.parallelGroup).toBe('all');expect(state.teacherMode).toBe('highlight')
 expect(state.tracks[data.modules[0].moduleId]).toBe(2)
 expect(sanitizeSettings({enabled:['removed'],tracks:{[data.modules[0].moduleId]:99}},data.modules,[]).tracks[data.modules[0].moduleId]).toBe('all')
})
it('derives exam cohorts from explicit data or lecture links, never from group numbers',()=>{
 const module=data.modules[0],exam=module.examSlots[0]
 expect(examTracks(module,{...exam,zugs:[2]})).toEqual([2])
 expect(examTracks(module,exam)).toEqual([1])
 expect(examTracks({...module,courses:[]},exam)).toEqual([])
 const media=data.modules.find(m=>m.courses.some(c=>c.groups.some(g=>g.zugs.length===2)))!
 expect(examTracks(media,media.examSlots[0])).toEqual([1,2])
})
it('builds options from filtered groups and permits unscheduled modules',()=>{
 const m=data.modules[0],p=data.modules.find(m=>m.unscheduled)!
 const filtered=filterModules([m], [m.moduleId],{[m.moduleId]:2},types,'all','all','highlight')
 const variants=generateVariants([...filtered,p])
 expect(variants.length).toBeGreaterThan(0)
 expect(variants.every(v=>v.groups.every(g=>g.zugs.includes(2)))).toBe(true)
 expect(generateVariants(filterModules([m],[m.moduleId],{[m.moduleId]:2},types,m.courses[0].groups[0].groupId,'all','highlight'))).toEqual([])
})
