import fs from 'node:fs'

const schedule=JSON.parse(fs.readFileSync(new URL('../public/data/schedule.json',import.meta.url),'utf8'))

const source=(file,scope,updatedAt=null)=>({file,scope,...(updatedAt?{updatedAt}:{})})
const emailImport=JSON.parse(fs.readFileSync(new URL('../../plan/source-extracts/email-import-2026-10-08.json',import.meta.url),'utf8'))
const emailEvidence=JSON.parse(fs.readFileSync(new URL(`../${emailImport.sourceFile}`,import.meta.url),'utf8'))
const mailSources=uids=>uids.map(uid=>{
 const message=emailEvidence.messages.find(message=>message.uid===uid)
 if(!message)throw new Error(`Missing email source for UID ${uid}`)
 return source(emailImport.sourceFile,`INBOX UIDVALIDITY ${message.uidValidity}, UID ${uid}; ${message.date}; ${message.subject}`,emailImport.reviewDate)
})

const enrichment={
 'Software Engineering II':{
  1:{
   scope:'A15 assignment shown in the existing track-1 Moodle source; WiSe 2026/27',
   deadlines:[{date:'2026-10-23',label:'A15 setup — due at 23:59 (Europe/Berlin)',mandatory:true}],
   keyFacts:[
    'A15 opened on 2026-10-07. A1–A5 cover laptop, terminal, Java, Git and VS Code setup; 3 points each, 15 total.',
    'Skip Python parts for this course.',
    'Show each validation in the exercise class and record acceptance in the completion list. Moodle or email submissions are not accepted.',
   ],
   sources:[
    source('../software-engineering-2/track-1/02-seminars/a15-setup.png','Moodle Aufgabe A15: opening, deadline, points, Java-only scope and acceptance rules'),
    source('../software-engineering-2/track-1/02-seminars/a15-setup/README.md','Assignment overview A1–A5; repository revision 6804b02f2626c39ab0e87514219bb6c4b77a299a','2026-10-07'),
   ],
  },
 },
 'Grundlagen der Theoretischen Informatik':{
  shared:{
   scope:'Course and assessment rules from Prof. Dr. Sören Werth shared by both tracks',
   actualAssessment:{
    components:[{label:'Written exam',percent:90},{label:'Practice',percent:10}],
    passConditions:['At least 5 practice points are required to take the exam.'],
    exam:{durationMinutes:90,format:'Written exam in the first exam period',materialsAllowed:false},
    secondExamPeriod:{durationMinutes:'20–25',format:'Oral exam',materialsAllowed:false,requirement:'At least 5 practice points'},
   },
   workloadRules:[
    'Complete required practice tasks and submit them in Moodle.',
    'The usual deadline is one week. One extra week covers illness or disability accommodations: two weeks at most.',
    'Deadlines cannot be extended. Results from earlier terms do not count.',
    'Spend at least 15 minutes on each task before practice. Use the sheets as practice exams.',
   ],
   keyFacts:[
    'Topics: finite automata, regular expressions and languages, pushdown automata, grammars, context-free languages, Turing machines and undecidability.',
    'Practice starts at 08:15.',
    'Groups may merge if attendance repeatedly falls to 5 people or fewer.',
    'Know at least the definitions for the second exam period. Register through the Moodle poll.',
   ],
   sources:[source('../theoretical-cs/shared/source-extracts/organization-pages/organization.txt','Organization and assessment rules for GTI track 2','2026-10-01')],
  },
 },
 'Mediendesign Grundlagen':{
  2:{
   scope:'Track 2 lecture; practice rules are part of the overall assessment',
   actualAssessment:{
    components:[
     {label:'Talk and PDF',percent:30},
     {label:'Attendance + participation',percent:20},
     {label:'Project + presentation',percent:50},
    ],
    passConditions:[
     'Submit and pass every exercise on time.',
     'Tasks cannot be skipped or submitted later.',
     'Pass every exercise to qualify for the final presentation.',
    ],
   },
   deadlines:[
    {date:'2027-02-01',label:'Final presentation',mandatory:true},
    {date:null,label:'Upload the talk PDF by 19:00 on the Sunday before your presentation',mandatory:true},
   ],
   coursePlan:[
    ['2026-10-05','Introduction and overview'],['2026-10-12','Analysis and ideas'],['2026-10-19','Information architecture'],
    ['2026-10-26','Digital mockup'],['2026-11-02','Presentations'],['2026-11-09','Brand design'],
    ['2026-11-16','Typography'],['2026-11-23','Presentations'],['2026-11-30','Icons and buttons'],
    ['2026-12-07','Color'],['2026-12-14','Presentations'],['2026-12-21','Design Patterns'],
    ['2026-12-28','No class'],['2027-01-04','No class'],['2027-01-11','Prototyping'],
    ['2027-01-18','Presentations'],['2027-01-25','Presentation skills'],['2027-02-01','Required final presentation'],
   ].map(([date,topic])=>({date,topic})),
   keyFacts:[
    'Lecture teacher: Dipl.-Des. Cornelia Schiffers.',
    'The course covers UX/UI, digital interfaces and prototyping. Practice work mainly uses Figma.',
    'The grade includes the final project, talk, attendance and participation.',
   ],
   sources:[source('../media-design/track-2/source-extracts/course-plan.txt','Moodle course plan and assessment rules for track 2','2026-04-03')],
  },
 },
 'Web Engineering II':{
  1:{
   scope:'Rules from Prof. Dr. Jens von Pilgrim for track 1',
   actualAssessment:{
    components:[{label:'Exam',percent:80},{label:'Practice',percent:20}],
    passConditions:[
     'Pass the exam and practice separately with a grade of 4.0 or better.',
     'Submit and pass at least 9 of the 11 graded sheets.',
     'The practice grade is the average of the best 10 solutions.',
    ],
    exam:{durationMinutes:60,format:'In person, using Moodle on exam laptops',materialsAllowed:false,periods:2},
    attemptStartsWhen:'The attempt starts with the first submission of a graded sheet (01–11).',
   },
   workloadRules:[
    'Sheets usually appear on Wednesday, are discussed the next week and are due Thursday at 23:59.',
    'Submit your own solution. Group solutions are not allowed.',
    'Use VS Code, a private GitLab fork, regular meaningful commits, TypeScript, builds and tests.',
    'Statement coverage usually must exceed 80%. Check the exact threshold in the task.',
    'Late work is usually not accepted. Discuss exceptions with the teacher if you have a valid reason.',
   ],
   oralChecks:[
    'The teacher may ask you to explain any submission in an oral review.',
    'Explain your solution and reproduce simple parts of the code.',
    'Two missed or failed oral reviews result in a final grade of 5.0.',
   ],
   aiPolicy:[
    'Only GitHub Copilot Chat in VS Code is allowed.',
    'Automatic AI code completion is not allowed.',
    'Export the chat history and include it with your submission.',
    'Understand, explain and reproduce all generated code.',
   ],
   submission:['npm run abgabe creates the ZIP for Moodle.','npm run build must finish without errors.','npm test must pass with the required coverage.'],
   sources:[source('../web-engineering-2/track-1/source-extracts/assessment-rules/assessment-rules.txt','Assessment and submission rules for Web Engineering II track 1','2026-09-16')],
  },
  2:{
   scope:'Practice rules from Prof. Dr. Sebastian von Klinski for track 2; the document does not specify the exam weight in the module grade',
   exerciseAssessment:{
    assignments:2,
    milestonesPerAssignment:3,
    learningChecksPerAssignment:'1–2',
    points:'Up to 60 points for a passed assignment and 20 points for each of two learning checks; 100 points maximum.',
    finalMilestone:'Up to 80 points for functional requirements and 20 for other requirements, before bonus points and penalties.',
    passConditions:[
     'Pass all three milestones for each assignment.',
     'Pass at least one learning check per assignment.',
     'If the app does not start or meets almost none of the requirements, the milestone or practice course is not passed.',
    ],
   },
   workloadRules:[
    'Assignment 1: REST server. Assignment 2: React frontend.',
    'Submit each milestone in Moodle as a runnable ZIP. The project must work after npm install.',
    'Late work is accepted for up to 7 days, with a penalty of 1 point per day. After that it does not count.',
    'All work is individual. Copying code or being unable to explain your code counts as plagiarism.',
   ],
   scheduleNote:'The plan comes from the supplied screenshot. Years 2026/27 follow the project term. Submission dates are in brackets; row dates mark teaching weeks. Submission and exam times are missing. Confirm final deadlines in Moodle.',
   deadlines:[
    {date:'2026-10-05',label:'Assignment 1 starts: milestone 1, REST server, Public User'},
    {date:'2026-10-28',label:'Assignment 1, milestone 1 due (week of 26 Oct)'},
    {date:'2026-11-02',label:'Assignment 1 learning checks start; individual dates are set separately'},
    {date:'2026-11-11',label:'Assignment 1, milestone 2 due: authentication (week of 9 Nov)'},
    {date:'2026-11-25',label:'Assignment 1, milestone 3 due: all features (week of 23 Nov)'},
    {date:'2026-11-30',label:'Midterm exam: planned date, time unknown; no lecture'},
    {date:'2026-12-16',label:'Assignment 2, milestone 1 due: React and authentication (week of 14 Dec)'},
    {date:'2026-12-21',label:'Assignment 2 learning checks start; individual dates are set separately'},
    {date:'2027-01-06',label:'Assignment 2, milestone 2 due: user management (week of 4 Jan)'},
    {date:'2027-01-20',label:'Assignment 2, milestone 3 due: all features (week of 18 Jan)'},
    {date:'2027-01-25',label:'Final exam: planned date, time unknown'},
    {date:'2027-02-01',label:'End of term in the course plan'},
   ],
   techStack:['React SPA','Redux','Node.js REST server','MongoDB','Mongoose','TypeScript','ESLint'],
   submission:[
    'Submit a ZIP of source code without node_modules.',
    'List all dependencies in package.json.',
    'The project must run with npm install and npm start. Do not use nodemon in the start script.',
    'Include a PDF describing any extra features with the final submission.',
   ],
   oralChecks:[
    'If automatic checks fail, the teacher may arrange an in-person review within 1–2 weeks.',
    'Demonstrate the program and explain all code. Later fixes are usually not accepted.',
    'The learning check takes place during practice, lasts about 60 minutes and requires changes to your own project.',
    'Missing or failing the second learning check means failing the practice course and module.',
   ],
   aiPolicy:[
    'Mark code from the internet or an LLM with a comment and its source.',
    'Code you cannot fully explain counts as plagiarism.',
    'AI tools and search engines are not allowed during learning checks. Disable built-in AI extensions.',
    'Only Moodle materials are allowed during learning checks.',
   ],
   keyFacts:[
    'Use the MERN stack. Angular and Vue are not allowed.',
    'TypeScript is required. At least 50% of variables and functions must have explicit types.',
    'At the final milestone, ESLint must report 0 errors and no more than 15 warnings.',
   ],
   sources:[source('../web-engineering-2/track-2/source-extracts/assessment-rules-v17/assessment-rules-v17.txt','Project assessment rules for Web Engineering II track 2','2026-09-08'),source('../web-engineering-2/track-2/01-lectures/course-schedule.png','Teaching weeks, milestones, learning checks and exams for Web Engineering II track 2')],
  },
 },
}

// Course materials and baseline teacher rules are shared across GTI groups.
const theoreticalDetails=enrichment['Grundlagen der Theoretischen Informatik']
for(const zug of [1,2])theoreticalDetails[zug]=structuredClone(theoreticalDetails.shared)

for(const update of emailImport.updates.filter(update=>update.zug!==null)){
 const tracks=enrichment[update.subject]??={}
 const detail=tracks[update.zug]??={scope:`Email course details for track ${update.zug}; ${emailImport.term}`}
 for(const field of ['deadlines','keyFacts','workloadRules']){
  if(update[field])detail[field]=[...(detail[field]||[]),...update[field]]
 }
 detail.sources=[...(detail.sources||[]),...mailSources(update.uids)]
}

function streamCourses(module,zug){
 return module.courses.flatMap(course=>course.groups.filter(group=>group.zugs.includes(zug)).map(group=>({
  courseId:course.courseId,
  type:course.type,
  parallelGroup:group.parallelGroup,
  teacher:group.teacher,
  registrationPeriod:group.registrationPeriod,
  meetings:group.meetings.map(({weekday,start,end,room,dateStart,dateEnd})=>({weekday,start,end,room,dateStart,dateEnd})),
 })))
}

const subjects=schedule.modules.map(module=>{
 const zugs=[...new Set(module.courses.flatMap(course=>course.groups.flatMap(group=>group.zugs)))].sort()
 const streams=zugs.map(zug=>{
  const courses=streamCourses(module,zug)
  return {
   zug,
   teachers:[...new Set(courses.map(course=>course.teacher))],
   courses,
   detailStatus:enrichment[module.name]?.[zug]?'enriched':'schedule_and_module_handbook_only',
   details:enrichment[module.name]?.[zug]??null,
  }
 })
 const base={
  moduleId:module.moduleId,
  modulNumber:module.modulNumber,
  name:module.name,
  semester:module.semester,
  credits:module.credits,
  status:module.status,
  workload:module.workload,
  teachingForm:module.teachingForm,
  assessmentBaseline:module.assessment,
  streams,
  sources:[module.source],
 }
 if(module.name==='Programmierung II'){
  base.unassignedDetails={
   scope:'p2-wise26 Moodle group planning; WiSe 2026/27. Track not identified in the source; these rules are not assigned to either stream.',
   deadlines:[{date:'2026-10-09',label:'Register the two-person group by 23:55; timezone not stated in the source',mandatory:true}],
   keyFacts:[
    'Groups must contain two people; individual work is not accepted.',
    'Only students listed by name in the group planning activity may attend the defense.',
    'Students without a teammate may enter their name so another person can join.',
    'The activity shows opening on 2026-10-07 at 15:24 and closing on 2026-10-10 at 15:24. The written registration deadline is earlier: 2026-10-09 at 23:55.',
    'Original screenshot and organization PDF were unavailable at the supplied filesystem paths. Screenshot facts were transcribed from the visible conversation attachment; the PDF has not been imported.',
   ],
   sources:[source('../programming-2/unassigned/source-extracts/group-planning-2026-10-07.txt','Manual transcription of visible screenshot: p2-wise26 / Organisatorisches / Planung der Gruppen; track unknown','2026-10-07')],
  }
 }
 if(module.name==='Projekt'){
  base.projectGroups={
   offered:['Dialekt','DienstWeb','Lernplattform','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13'],
   signupSnapshot:{studentsTotal:75,assigned:8,unassigned:67,countsByProject:{Dialekt:2,DienstWeb:6}},
   examiners:[...new Set(module.examSlots.map(slot=>slot.examiner))],
   privacyNote:'Student names, emails and IDs are excluded.',
   sources:[source('../project/groups.xlsx','Project choices and group totals as of 4 Oct 2026')],
  }
 }
 return base
})

for(const update of emailImport.updates.filter(update=>update.zug===null)){
 const subject=subjects.find(subject=>subject.name===update.subject)
 if(!subject)throw new Error(`Unknown subject: ${update.subject}`)
 const details=subject.unassignedDetails??={scope:update.scope||'Email facts with track not established',keyFacts:[],deadlines:[],sources:[]}
 for(const field of ['deadlines','keyFacts','workloadRules']){
  if(update[field])details[field]=[...(details[field]||[]),...update[field]]
 }
 details.sources.push(...mailSources(update.uids))
}

const database={
 schemaVersion:1,
 term:schedule.term,
 generatedAt:new Date().toISOString(),
 description:'Subject and track details for Medieninformatik B.Sc., winter term 2026/27. Teacher rules take priority over handbook rules only for the stated track.',
 coverage:{subjects:subjects.length,streams:subjects.reduce((n,s)=>n+s.streams.length,0),enrichedStreams:subjects.flatMap(s=>s.streams).filter(s=>s.detailStatus==='enriched').length},
 subjects,
}

fs.writeFileSync(new URL('../public/data/course-database.json',import.meta.url),JSON.stringify(database,null,2)+'\n')
const tasks=emailImport.tasks.map(({subjectName,uids,...task})=>{
 const subject=subjects.find(subject=>subject.name===subjectName)
 if(!subject)throw new Error(`Unknown homework subject: ${subjectName}`)
 return {...task,subject:subject.moduleId,sources:mailSources(uids)}
})
fs.writeFileSync(new URL('../public/data/homework.json',import.meta.url),JSON.stringify({schemaVersion:1,term:schedule.term,generatedAt:database.generatedAt,tasks},null,2)+'\n')
const planning=structuredClone(emailImport.personalPlanning)
for(const record of [planning.recognition,...planning.events,planning.mobility]){
 record.sources=[...(record.sources||[]),...mailSources(record.uids)]
 delete record.uids
}
fs.writeFileSync(new URL('../public/data/personal-planning.json',import.meta.url),JSON.stringify({schemaVersion:1,term:schedule.term,generatedAt:database.generatedAt,...planning},null,2)+'\n')
console.log(`Created course-database.json: ${database.coverage.subjects} subjects, ${database.coverage.streams} streams, ${database.coverage.enrichedStreams} enriched streams`)
