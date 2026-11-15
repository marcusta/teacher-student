import type { createServices } from '../server/services';
import type { User } from '../server/services/user.service';
import type { CreateActivityInput } from '../server/services/schedule.types';
import { addDays, localToday, mondayOf, zonedInstant } from '../shared/schedule-calendar';

type Services = ReturnType<typeof createServices>;

/** Called only after dev-seed's production/path guard. Existing fixture activities are left untouched. */
export async function seedDevSchedule(svc: Services, anna: User, lisa: User, maja: User, sagaId: string, exerciseIds: string[], created: string[]): Promise<string> {
    let stable = (await svc.stableService.list(anna.id)).find(s => s.name === 'Stall Lindängen');
    if (!stable) { stable = await svc.stableService.create(anna.id, { name:'Stall Lindängen' }); created.push('shared stable Stall Lindängen'); }
    for (const user of [lisa,maja]) {
        if (!(await svc.stableService.list(user.id)).some(s => s.id === stable!.id)) {
            const pending = (await svc.stableService.invitations(anna.id,stable.id)).find(i => i.inviteeEmail === user.email && i.status === 'pending' && i.expiresAt > new Date().toISOString());
            const invitation = pending ?? await svc.stableService.invite(anna.id,stable.id,user.email);
            await svc.stableService.respond(user.id,invitation.id,true);
        }
    }
    let atlas = (await svc.horseService.listForStudent(lisa.id)).find(h => h.name === 'Atlas');
    if (!atlas) { atlas = await svc.horseService.create(lisa.id,{name:'Atlas'}); created.push('horse Atlas'); }
    await svc.stableService.attachHorse(anna.id,stable.id,sagaId);
    await svc.stableService.attachHorse(lisa.id,stable.id,atlas.id);
    let program = (await svc.programService.listForTeacher(lisa.id)).find(p => p.title === 'Lösgjordhet & övergångar');
    if (!program) {
        program = await svc.programService.create(lisa.id,{title:'Lösgjordhet & övergångar',description:'Övergångar och bibehållen rytm.'});
        for (const id of exerciseIds) await svc.programService.addExercise(lisa.id,program.id,id,{notes:'Bibehåll rytmen.'});
        created.push('schedule training program');
    }
    const detail = await svc.stableService.detail(anna.id,stable.id), today = localToday(detail.timeZone), start = mondayOf(today);
    const type = (code:string) => detail.types.find(t=>t.code===code)!;
    async function ensure(key:string,input:Omit<CreateActivityInput,'requestId'>,cancel=false) {
        const requestId=`dev-schedule:${start}:${key}`;
        if(await svc.db.selectFrom('schedule_operations').select('request_id').where('stable_id','=',stable!.id).where('request_id','=',requestId).executeTakeFirst())return;
        const completed=input.date<today;
        const activity=await svc.scheduleService.create(anna.id,stable!.id,{...input,requestId,status:completed&&!cancel?'completed':'planned',
            ...(completed&&!cancel?{performedAt:zonedInstant(input.date,input.time||'12:00',detail.timeZone),performerIds:input.assigneeIds?.length?input.assigneeIds:[anna.id],resultNote:'Utfört enligt plan.'}:{})});
        if(cancel)await svc.scheduleService.transition(anna.id,stable!.id,activity.id,'cancelled',{version:activity.version});
    }
    const routineCodes=['morning_feed','turnout','lunch_feed','bring_in','evening_feed'];
    for(let day=0;day<7;day++)for(const [index,code] of routineCodes.entries()) {
        const routine=type(code),people=[anna.id,lisa.id,maja.id];
        const assignees=(day===2&&index===2)||(day===4&&index===3)?[]:index===1?[people[day%3]!,people[(day+1)%3]!]:[people[(day+index)%3]!];
        await ensure(`${day}:${code}`,{typeId:routine.id,title:routine.name,date:addDays(start,day),time:routine.defaultTime,assigneeIds:assignees,instruction:code==='morning_feed'?'Följ foderstaten i foderkammaren och kontrollera vattnet.':''});
    }
    const horses=[
        {key:'saga-mon',day:0,horseId:sagaId,title:'Lösgörande arbete',code:'training',time:'17:00',assigneeIds:[anna.id],trainingStudentId:anna.id,programIds:[program.id]},
        {key:'atlas-tue',day:1,horseId:atlas.id,title:'Hovslagare',code:'farrier',time:'10:00',assigneeIds:[lisa.id]},
        {key:'saga-wed-care',day:2,horseId:sagaId,title:'Markservice',code:'care',time:'13:00',assigneeIds:[maja.id]},
        {key:'saga-wed-training',day:2,horseId:sagaId,title:'Dressyrpass',code:'training',time:'17:30',assigneeIds:[anna.id,lisa.id],trainingStudentId:anna.id,programIds:[program.id]},
        {key:'atlas-wed',day:2,horseId:atlas.id,title:'Markservice',code:'care',time:'14:00',assigneeIds:[maja.id]},
        {key:'saga-thu',day:3,horseId:sagaId,title:'Hovslagare',code:'farrier',time:'09:30',assigneeIds:[anna.id,lisa.id]},
        {key:'atlas-fri',day:4,horseId:atlas.id,title:'Veterinär',code:'vet',time:'11:00',assigneeIds:[]},
        {key:'saga-sat',day:5,horseId:sagaId,title:'Uteritt',code:'training',time:'10:00',assigneeIds:[anna.id,maja.id],trainingStudentId:anna.id},
        {key:'saga-sun',day:6,horseId:sagaId,title:'Markservice',code:'care',time:'13:00',assigneeIds:[lisa.id]},
        {key:'cancelled',day:6,horseId:sagaId,title:'Skrittpass',code:'training',time:'16:00',assigneeIds:[anna.id],trainingStudentId:anna.id},
    ];
    for(const item of horses)await ensure(item.key,{...item,typeId:type(item.code).id,date:addDays(start,item.day)},item.key==='cancelled');
    return stable.id;
}
