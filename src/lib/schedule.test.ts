import {describe,it,expect} from 'vitest'
import {classifyAssessment,dedupeMeetings,groupHasCalendarMeeting,meetingsOverlap,zugsCompatible} from './schedule'
const meeting=(o:any={})=>({meetingId:'m',groupId:'g',moduleId:'x',courseId:'c',teacherId:'t',teacher:'T',room:'B 1',weekday:'MO',dateStart:'2026-10-01',dateEnd:'2027-02-01',start:'10:00',end:'11:30',source:{sourceFile:'x',fragment:'x'},...o})
const group=(zugs:number[],meetings:any[]=[])=>({groupId:'g',courseId:'c',moduleId:'m',parallelGroup:1,titleOriginal:'x',zugs,teacherId:'t',teacher:'T',registrationPeriod:null,meetings,source:{sourceFile:'x',fragment:'x'}})
describe('критическая логика',()=>{
 it('сохраняет несколько блоков одной группы',()=>expect(groupHasCalendarMeeting(group([1],[meeting(),meeting({meetingId:'m2',start:'12:00'})]))).toHaveLength(2))
 it('проверяет Zug и общую лекцию',()=>{expect(zugsCompatible(group([1]),group([2]))).toBe(false);expect(zugsCompatible(group([1,2]),group([2]))).toBe(true)})
 it('учитывает время и диапазон дат',()=>{expect(meetingsOverlap(meeting(),meeting({start:'11:00',end:'12:00'}))).toBe(true);expect(meetingsOverlap(meeting(),meeting({dateStart:'2027-03-01',dateEnd:'2027-04-01'}))).toBe(false)})
 it('не добавляет nach Vereinbarung в календарь',()=>expect(groupHasCalendarMeeting(group([1],[]))).toEqual([]))
 it('классифицирует сдачу',()=>{expect(classifyAssessment('100% Klausur')).toBe('exam');expect(classifyAssessment('50% Klausur, 50% Projektarbeit')).toBe('hybrid');expect(classifyAssessment('100% Projektarbeit')).toBe('project')})
 it('дедуплицирует MHTML-записи',()=>expect(dedupeMeetings([meeting(),meeting({meetingId:'copy'})])).toHaveLength(1))
})
