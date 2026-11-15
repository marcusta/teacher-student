import { Component, Router, effect, template, untrack } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { api, type Activity, type StableDetail, type StableHorse, type ActivityType, type Horse, type ScheduleCatalog, type ScheduleTemplate, type ScheduleCopyResult, type TrainingSession } from '../api';
import { getLocale } from '../i18n';
import { addDays, mondayOf, isoWeek, localToday, zonedInstant } from '../../shared/schedule-calendar';
import { ScheduleService, scheduleErrorKey } from './schedule.service';
import { DEFAULT_FILTERS, activityOrder, escapeHtml as esc, filterActivities, horseLanes, initials, readPreferences, savePreferences, type ScheduleFilters } from './schedule-copy';
import { activityPanel, field, area, select, checks, offsetField, wallTime, wallOffset, tr, type ActivityDraft } from './schedule-panels';
import { scheduleStyles } from './schedule-styles';

type CopyPanel = { kind:'copy'; requestId:string; sourceDate:string; targetDates:string[]; week:boolean; keepAssignees:boolean; preview:ScheduleCopyResult|null };
type Panel = { kind:'activity'; draft:ActivityDraft } | CopyPanel | { kind:'settings'; horses:Horse[] } | { kind:'create-stable' }
    | { kind:'templates'; templates:ScheduleTemplate[]; requests:{save:string;apply:string;routines:string} }
    | { kind:'training'; activity:Activity; sessions:TrainingSession[]; performedWall:string; performedOffset:number|null; summary:string; duration:string; resultNote:string; sessionId:string; performerIds:string[] };

const tpl = template(`<section class="schedule" bind="main"></section><div bind="dialogs"></div>`);
const colgroup = '<colgroup><col class="schedule-label-col"><col span="7"></colgroup>';
const button = (label:string, action:string, className='schedule-button', extra='') => `<button type="button" class="${className}" data-action="${action}" ${extra}>${esc(label)}</button>`;

export class ScheduleComponent extends Component {
    static styles = scheduleStyles;
    private router = this.inject(Router);
    private auth = this.inject(AuthService);
    private svc = this.inject(ScheduleService);
    private main!: HTMLElement;
    private dialogs!: HTMLElement;
    private dialog: HTMLDialogElement | null = null;
    private panel: Panel | null = null;
    private catalog: ScheduleCatalog | null = null;
    private latestActivity: Activity | null = null;
    private accountId = '';
    private stableId = '';
    private horseId = '';
    private logMode = false;
    private startDate = mondayOf(localToday());
    private dayIndex = 0;
    private filters: ScheduleFilters = { ...DEFAULT_FILTERS };
    private logFrom = '';
    private logTo = '';
    private routeGeneration = 0;
    private disposed = false;
    private notice = '';

    render(): DocumentFragment {
        this.svc.bindAccount(this.auth.currentUser.get()?.id??'');
        const frag = this.wire(tpl, {});
        this.main = this.ref(frag,'main'); this.dialogs = this.ref(frag,'dialogs');
        this.main.addEventListener('click', e => { void this.click(e); });
        this.main.addEventListener('change', e => this.changeMain(e));
        this.dialogs.addEventListener('click', e => { void this.click(e); });
        this.dialogs.addEventListener('input', e => this.inputPanel(e));
        this.dialogs.addEventListener('change', e => this.changePanel(e));
        this.dialogs.addEventListener('submit', e => { e.preventDefault(); void this.submit(e.target as HTMLFormElement); });
        this.track(effect(() => {
            this.svc.stables.get(); this.svc.week.get(); this.svc.detail.get(); this.svc.log.get(); this.svc.loading.get(); this.svc.loaded.get(); this.svc.error.get();
            this.svc.saving.get(); this.svc.writeError.get(); getLocale();
            untrack(() => { this.paint(); this.panelState(); });
        }));
        return frag;
    }

    onMount(): void {
        this.track(effect(() => {
            const path = this.router.route.get(), user = this.auth.currentUser.get();
            if (user) untrack(() => { void this.routeChanged(path,user.id); });
        }));
        this.track(() => { this.disposed = true; this.routeGeneration++; this.dialog?.close(); this.dialog?.remove(); });
    }

    private stable(): StableDetail | null { const detail=this.svc.detail.get(); return detail?.id===this.stableId?detail:null; }
    private route(path:string): string { return (import.meta.env?.BASE_URL??'/').replace(/\/$/,'')+path; }
    private link(label:string,path:string,className=''): string { return `<a href="${esc(this.route(path))}" data-route="${esc(path)}" class="${className}">${esc(label)}</a>`; }
    private date(value:string,options:Intl.DateTimeFormatOptions={day:'numeric',month:'long'}): string { return new Intl.DateTimeFormat(getLocale(),{...options,timeZone:'UTC'}).format(new Date(value+'T12:00Z')); }
    private dayName(value:string,short=false): string { return this.date(value,{weekday:short?'short':'long'}); }
    private persist(): void { if(this.accountId&&this.stableId)savePreferences(this.accountId,this.stableId,{filters:this.filters,startDate:this.startDate,dayIndex:this.dayIndex}); }

    private async routeChanged(path:string,userId:string): Promise<void> {
        const generation=++this.routeGeneration;
        // Let the shell finish mounting before a cached stable causes a redirect.
        // A synchronous redirect re-enters $swap before it owns this component,
        // leaving a live schedule behind that can redirect later navigation.
        await Promise.resolve();
        if(this.disposed||generation!==this.routeGeneration)return;
        this.closePanel(); this.notice=''; this.accountId=userId; this.svc.bindAccount(userId);
        this.logMode=path.startsWith('/hastlogg');
        const parts=path.split('/').filter(Boolean);
        this.stableId=parts[1]??''; this.horseId=this.logMode?(parts[2]??''):'';
        if(!this.svc.loaded.get())await this.svc.loadStables();
        if(this.disposed||generation!==this.routeGeneration)return;
        if(!this.stableId){
            const first=this.svc.stables.get()[0];
            if(first){this.router.navigate((this.logMode?'/hastlogg/':'/veckoschema/')+first.id,true);return;}
            this.paint();return;
        }
        const fallback=mondayOf(localToday(this.svc.stables.get().find(s=>s.id===this.stableId)?.timeZone));
        const saved=readPreferences(userId,this.stableId,[],fallback);
        this.startDate=saved.startDate; this.dayIndex=saved.dayIndex;
        if(this.logMode&&this.horseId)await this.svc.loadLog(this.stableId,this.horseId,this.logFrom,this.logTo);
        else await this.svc.loadWeek(this.stableId,this.startDate);
        if(this.disposed||generation!==this.routeGeneration)return;
        const stable=this.stable();
        if(stable){
            const prefs=readPreferences(userId,this.stableId,stable.horses.map(h=>h.id),mondayOf(localToday(stable.timeZone)));
            this.filters=prefs.filters;this.dayIndex=prefs.dayIndex;
            if(this.logMode&&!this.horseId){
                const horse=stable.horses.find(h=>h.active)??stable.horses[0];
                if(horse){this.router.navigate(`/hastlogg/${stable.id}/${horse.id}`,true);return;}
            }
        }
        this.paint();
        if(parts[2]==='installningar')void this.openSettings();
    }

    private paint(): void {
        if(!this.main)return;
        const stable=this.stable(), week=this.svc.week.get();
        const heading=tr(this.logMode?'horse_log':'heading');
        const tabs=this.stableId?`<nav class="schedule-tabs" aria-label="${esc(tr('views'))}"><a href="${esc(this.route('/veckoschema/'+this.stableId))}" data-route="/veckoschema/${esc(this.stableId)}" ${!this.logMode?'aria-current="page"':''}>${esc(tr('heading'))}</a><a href="${esc(this.route('/hastlogg/'+this.stableId+(this.horseId?'/'+this.horseId:'')))}" data-route="/hastlogg/${esc(this.stableId)}${this.horseId?'/'+esc(this.horseId):''}" ${this.logMode?'aria-current="page"':''}>${esc(tr('horse_log'))}</a></nav>`:'';
        const stables=this.svc.stables.get();
        const picker=stables.length>1?`<label class="schedule-field"><span>${esc(tr('choose_stable'))}</span><select class="schedule-select" name="stable-picker">${stables.map(s=>`<option value="${esc(s.id)}" ${s.id===this.stableId?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>`:'';
        const top=`<header class="schedule-head"><div><p class="schedule-kicker">${esc(stable?.name??tr('stable'))}</p><h1>${esc(heading)}</h1><p class="schedule-description">${esc(tr(this.logMode?'log_description':'description'))}</p></div><div class="schedule-actions">${stable?`${button(tr('settings'),'settings','schedule-ghost schedule-small')}${stable.role==='admin'&&!this.logMode?button(tr('weekly_template'),'templates','schedule-ghost'):''}${button(tr(this.logMode?'log_event':'activity'),'new','schedule-primary')}`:''}</div></header>${picker}${tabs}`;
        const error=this.svc.error.get();
        if(!this.svc.loaded.get()||(!stable&&this.svc.loading.get())){this.main.innerHTML=top+`<p class="schedule-loading" role="status">${esc(tr('loading'))}</p>`;return;}
        if(!this.stableId){this.main.innerHTML=top+(error?this.errorHTML(error):`<div class="schedule-panel schedule-empty"><h2>${esc(tr('start_heading'))}</h2><p>${esc(tr('start_description'))}</p>${button(tr('create_stable'),'create-stable','schedule-primary')}</div>`);return;}
        let content='';
        if(error)content+=this.errorHTML(error);
        if(!this.panel&&this.svc.writeError.get())content+=this.errorHTML(this.svc.writeError.get()!);
        if(stable){
            if(this.logMode)content+=this.renderLog(stable);
            else if(week?.stable.id===this.stableId&&week.startDate===this.startDate)content+=this.renderWeek(stable,week.activities);
        }
        if(this.svc.loading.get())content+=`<p class="schedule-loading" role="status">${esc(tr('loading'))}</p>`;
        this.main.innerHTML=top+(this.notice?`<p role="status" class="schedule-dialog-info">${esc(this.notice)}</p>`:'')+content;
    }

    private errorHTML(key:string): string { return `<div class="schedule-alert" role="alert">${esc(tr(key.replace('schedule.','')))} ${button(tr('retry'),'refresh','schedule-button schedule-small')}</div>`; }
    private memberName(stable:StableDetail,id:string): string {return stable.members.find(m=>m.userId===id)?.displayName??tr('inactive_member');}
    private people(stable:StableDetail,ids:string[],tiny=false): string {
        if(!ids.length)return `<span class="schedule-warning">${esc(tr('unassigned'))}</span>`;
        const names=ids.map(id=>this.memberName(stable,id));
        return `<span class="schedule-avatar-stack">${ids.map((id,index)=>`<span class="schedule-avatar ${stable.members.find(m=>m.userId===id)?.active?'':'inactive'}" aria-hidden="true">${esc(initials(names[index]!))}</span>`).join('')}</span><span>${esc(tiny&&names.length>1?names[0]!.split(' ')[0]+' +'+(names.length-1):names.map(n=>n.split(' ')[0]).join(' & '))}</span>`;
    }
    private state(activity:Activity): string { return `<span class="schedule-state ${activity.status}" aria-label="${esc(tr('status.'+activity.status))}">${activity.status==='completed'?'✓':''}</span>`; }
    private card(stable:StableDetail,activity:Activity): string { return `<button type="button" class="schedule-card ${activity.category} ${activity.status}" data-activity="${esc(activity.id)}" aria-label="${esc(activity.title+', '+(activity.time??tr('no_time'))+', '+tr('status.'+activity.status))}"><span class="schedule-card-time">${this.state(activity)}${esc(activity.time??tr('no_time'))}</span><strong>${esc(activity.title)}</strong><span class="schedule-card-people">${this.people(stable,activity.assigneeIds,true)}</span>${activity.horseInactive?`<span class="schedule-warning">${esc(tr('needs_attention'))}</span>`:''}</button>`; }
    private dayHead(day:number,copy=false): string {const date=addDays(this.startDate,day);return `<th scope="col" class="${day===this.dayIndex?'schedule-selected':''}"><div class="schedule-day-head"><button type="button" data-day="${day}" aria-label="${esc(this.date(date,{weekday:'long',day:'numeric',month:'long'}))}">${esc(this.dayName(date,true))}<strong>${Number(date.slice(8))}</strong></button>${copy?`<button type="button" class="schedule-icon schedule-copy-day" data-copy-day="${day}" aria-label="${esc(tr('copy_day_named',{day:this.dayName(date)}))}">⧉</button>`:''}</div></th>`;}
    private addCell(horse:StableHorse,day:number):string {return horse.active?`<button type="button" class="schedule-lane-add" data-new-horse="${esc(horse.id)}" data-new-day="${day}" aria-label="${esc(tr('add_for_horse',{name:horse.name,day:this.dayName(addDays(this.startDate,day))}))}">+</button>`:'';}

    private renderWeek(stable:StableDetail,activities:Activity[]): string {
        const week=this.svc.week.get()!, visible=filterActivities(activities,this.filters,this.accountId), iso=isoWeek(this.startDate);
        const activeHorses=stable.horses.filter(h=>h.active||activities.some(a=>a.horseId===h.id)||this.filters.scope==='horse:'+h.id);
        const tools=`<div class="schedule-tools"><h2>${esc(tr('week_number',{week:iso.week}))}<small>${esc(this.date(this.startDate))}–${esc(this.date(addDays(this.startDate,6),{day:'numeric',month:'long',year:'numeric'}))}</small></h2><div class="schedule-arrows">${button('‹','previous','schedule-icon',`aria-label="${esc(tr('previous_week'))}"`)}${button('›','next','schedule-icon',`aria-label="${esc(tr('next_week'))}"`)}</div>${button(tr('this_week'),'today','schedule-ghost schedule-small')}<div class="schedule-stats"><span>${esc(tr('completed_week',{done:week.completed,total:week.total}))}</span>${button(tr('unassigned_week',{count:week.unassigned}),'unassigned','schedule-unassigned',`aria-pressed="${this.filters.unassigned}"`)}</div></div>`;
        const filters=`<div class="schedule-filters" aria-label="${esc(tr('filters'))}">${[{id:'all',name:tr('all')},{id:'stable',name:tr('stable')},{id:'horses',name:tr('horses')},...activeHorses.map(h=>({id:'horse:'+h.id,name:h.name}))].map(f=>`<button type="button" class="schedule-filter" data-scope="${esc(f.id)}" aria-pressed="${this.filters.scope===f.id}">${esc(f.name)}</button>`).join('')}<span class="schedule-filter-gap"></span>${button(tr('mine'),'mine','schedule-filter',`aria-pressed="${this.filters.mine}"`)}<select class="schedule-status-select" name="status-filter" aria-label="${esc(tr('status_filter'))}">${['all','remaining','completed'].map(status=>`<option value="${status}" ${status===this.filters.status?'selected':''}>${esc(tr('filter_status.'+status))}</option>`).join('')}</select></div>`;
        const narrowed=this.filters.mine||this.filters.unassigned||this.filters.status!=='all';
        const showStable=this.filters.scope==='all'||this.filters.scope==='stable';
        const stableTypes=stable.types.filter(type=>visible.some(a=>!a.horseId&&a.typeId===type.id)||(!narrowed&&!type.archived&&type.scope==='stable'));
        const stall=showStable?`<section class="schedule-panel"><div class="schedule-band"><strong>${esc(tr('who_does_what'))}</strong><span>${esc(tr('assignment_hint'))}</span></div><table class="schedule-table schedule-stable-table" aria-label="${esc(tr('stable_week'))}">${colgroup}<thead><tr><th scope="col">${esc(tr('stable_routines'))}</th>${Array.from({length:7},(_,d)=>this.dayHead(d,stable.role==='admin')).join('')}</tr></thead><tbody>${stableTypes.map(type=>`<tr><th scope="row">${esc(type.name)}${type.defaultTime?'<small>'+esc(type.defaultTime)+'</small>':''}</th>${Array.from({length:7},(_,d)=>{const items=visible.filter(a=>!a.horseId&&a.typeId===type.id&&a.date===addDays(this.startDate,d)).sort(activityOrder);return `<td class="${d===this.dayIndex?'schedule-selected':''}">${items.length?items.map(a=>`<button type="button" class="schedule-assignment ${a.status}" data-activity="${esc(a.id)}" aria-label="${esc(a.title+', '+this.dayName(a.date)+', '+tr('status.'+a.status))}">${this.people(stable,a.assigneeIds)}${a.status==='completed'?'<span aria-hidden="true">✓</span>':a.status==='cancelled'?'<small>'+esc(tr('status.cancelled'))+'</small>':''}${a.time!==type.defaultTime?'<small>'+esc(a.time??tr('no_time'))+'</small>':''}</button>`).join(''):stable.role==='admin'?`<button type="button" class="schedule-assignment empty" data-new-type="${esc(type.id)}" data-new-day="${d}" aria-label="${esc(tr('add_named',{name:type.name,day:this.dayName(addDays(this.startDate,d))}))}">+</button>`:'<span aria-label="'+esc(tr('nothing_planned'))+'">·</span>'}</td>`;}).join('')}</tr>`).join('')}</tbody></table>${stableTypes.length?'':`<p class="schedule-empty">${esc(tr('no_matches'))}</p>`}</section>`:'';
        const horses=horseLanes(stable.horses,visible,this.filters);
        const horseTable=this.filters.scope!=='stable'?`<section><div class="schedule-horse-heading"><div><h2>${esc(tr('horses_week'))}</h2><p>${esc(tr('horses_description'))}</p></div><span>${esc(tr('horse_counts',{horses:horses.length,activities:visible.filter(a=>a.horseId).length}))}</span></div><div class="schedule-panel"><div class="schedule-band"><strong>${esc(tr('planned_per_horse'))}</strong><span>${esc(tr('multiple_hint'))}</span></div><table class="schedule-table schedule-horse-table" aria-label="${esc(tr('horse_week'))}">${colgroup}<thead><tr><th scope="col">${esc(tr('horse'))}</th>${Array.from({length:7},(_,d)=>this.dayHead(d)).join('')}</tr></thead><tbody>${horses.map(horse=>{const items=visible.filter(a=>a.horseId===horse.id);return `<tr data-horse-lane="${esc(horse.id)}"><th scope="row"><span class="schedule-horse-name">${esc(horse.name)}</span><small>${esc(tr('done_count',{done:items.filter(a=>a.status==='completed').length,total:items.length}))}</small>${!horse.active?'<small class="schedule-warning">'+esc(tr('inactive_horse_short'))+'</small>':''}${this.link(tr('horse_log')+' ↗',`/hastlogg/${stable.id}/${horse.id}`,'schedule-log-link')}</th>${Array.from({length:7},(_,d)=>`<td class="${d===this.dayIndex?'schedule-selected':''}"><div class="schedule-cell">${items.filter(a=>a.date===addDays(this.startDate,d)).sort(activityOrder).map(a=>this.card(stable,a)).join('')}</div>${this.addCell(horse,d)}</td>`).join('')}</tr>`;}).join('')}</tbody></table>${horses.length?'':`<p class="schedule-empty">${esc(tr('no_horses_match'))}</p>`}</div></section>`:'';
        const empty=!visible.length?`<div class="schedule-empty"><p>${esc(tr(activities.length?'no_matches':'empty_week'))}</p>${activities.length?button(tr('reset_filters'),'reset-filters','schedule-ghost'):stable.role==='admin'?button(tr('add_routines'),'templates','schedule-button'):''}</div>`:'';
        return tools+filters+empty+`<div class="schedule-desktop">${stall}${horseTable}</div><div class="schedule-mobile">${this.mobileWeek(stable,visible,horses,showStable)}</div>`+this.legend();
    }

    private mobileWeek(stable:StableDetail,visible:Activity[],horses:StableHorse[],showStable:boolean): string {
        const date=addDays(this.startDate,this.dayIndex), today=visible.filter(a=>a.date===date).sort(activityOrder);
        return `<div class="schedule-day-strip" aria-label="${esc(tr('choose_day'))}">${Array.from({length:7},(_,d)=>{const value=addDays(this.startDate,d);return `<button type="button" data-day="${d}" aria-pressed="${d===this.dayIndex}">${esc(this.dayName(value,true))}<strong>${Number(value.slice(8))}</strong></button>`;}).join('')}</div><div class="schedule-mobile-head"><h2>${esc(this.date(date,{weekday:'long',day:'numeric'}))}</h2>${stable.role==='admin'?`<button type="button" class="schedule-icon" data-copy-day="${this.dayIndex}" aria-label="${esc(tr('copy_day'))}">⧉</button>`:''}</div>${showStable?`<section><div class="schedule-band"><strong>${esc(tr('stable_routines'))}</strong></div>${today.filter(a=>!a.horseId).map(a=>`<div class="schedule-mobile-routine"><span>${esc(a.time??tr('no_time'))}</span>${this.card(stable,a)}</div>`).join('')||`<p class="schedule-empty">${esc(tr('nothing_planned'))}</p>`}</section>`:''}${this.filters.scope!=='stable'?`<div class="schedule-horse-heading"><h2>${esc(tr('horses'))}</h2></div>${horses.map(horse=>`<section class="schedule-panel schedule-mobile-horse"><header><span class="schedule-horse-name">${esc(horse.name)}</span>${this.link(tr('horse_log')+' ↗',`/hastlogg/${stable.id}/${horse.id}`,'schedule-log-link')}${horse.active?`<button type="button" class="schedule-icon" data-new-horse="${esc(horse.id)}" data-new-day="${this.dayIndex}" aria-label="${esc(tr('add_for_horse',{name:horse.name,day:this.dayName(date)}))}">+</button>`:''}</header><div>${today.filter(a=>a.horseId===horse.id).map(a=>this.card(stable,a)).join('')||`<p>${esc(tr('nothing_planned'))}</p>`}</div></section>`).join('')}`:''}`;
    }
    private legend():string{return `<div class="schedule-legend">${['planned','completed','cancelled'].map(status=>`<span><span class="schedule-state ${status}" aria-hidden="true">${status==='completed'?'✓':''}</span>${esc(tr('status.'+status))}</span>`).join('')}<span>${esc(tr('details_hint'))}</span></div>`;}

    private renderLog(stable:StableDetail):string {
        const log=this.svc.log.get(),horse=stable.horses.find(h=>h.id===this.horseId);
        const horses=stable.horses.map(h=>this.link(h.name,`/hastlogg/${stable.id}/${h.id}`,'schedule-button schedule-small')).join('');
        if(!horse)return `<div class="schedule-filters">${horses}</div><div class="schedule-empty"><h2>${esc(tr('no_horses'))}</h2><p>${esc(tr('attach_horse_hint'))}</p>${button(tr('settings'),'settings')}</div>`;
        return `<div class="schedule-filters">${horses}</div><div class="schedule-horse-heading"><div><h2>${esc(horse.name)}</h2><p>${esc(tr('log_description'))}</p></div>${button(tr('log_event'),'new','schedule-button')}</div><form class="schedule-log-controls">${field('log-from',tr('from_date'),this.logFrom,'date')}${field('log-to',tr('to_date'),this.logTo,'date')}${button(tr('refresh'),'refresh','schedule-button')}</form>${log?.horse.id===horse.id?log.items.map(a=>`<article class="schedule-log-entry"><time>${esc(new Intl.DateTimeFormat(getLocale(),{dateStyle:'long',timeStyle:'short',timeZone:stable.timeZone}).format(new Date(a.performedAt!)))}</time><button type="button" class="schedule-card ${a.category}" data-activity="${esc(a.id)}"><strong>${esc(a.title)}</strong><p>${esc(a.resultNote||tr('completed_without_note'))}</p><span class="schedule-card-people">${this.people(stable,a.performerIds,true)}</span><span class="schedule-dialog-hint">${esc(tr('recorded_by',{name:this.memberName(stable,a.completedBy??'')}))}</span></button></article>`).join('')+(log.items.length?'':`<div class="schedule-empty">${esc(tr('empty_log'))}</div>`)+(log.nextCursor?button(tr('load_more'),'load-more','schedule-button'):''):''}`;
    }

    private async refresh():Promise<void>{if(!this.stableId){await this.svc.loadStables();this.paint();return;}if(this.logMode&&this.horseId)await this.svc.loadLog(this.stableId,this.horseId,this.logFrom,this.logTo);else await this.svc.loadWeek(this.stableId,this.startDate);}
    private async changeWeek(days:number):Promise<void>{this.startDate=addDays(this.startDate,days);this.persist();this.notice='';await this.refresh();}
    private changeMain(event:Event):void {
        const target=event.target as HTMLInputElement;
        if(target.name==='stable-picker'){this.router.navigate((this.logMode?'/hastlogg/':'/veckoschema/')+target.value);return;}
        if(target.name==='status-filter'){this.filters={...this.filters,status:target.value as ScheduleFilters['status']};this.persist();this.paint();}
        if(target.name==='log-from')this.logFrom=target.value;
        if(target.name==='log-to')this.logTo=target.value;
    }

    private async click(event:Event):Promise<void>{
        const target=(event.target as Element).closest<HTMLElement>('button,a');if(!target)return;
        if(target.dataset.route){if(event instanceof MouseEvent&&(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey))return;event.preventDefault();this.router.navigate(target.dataset.route);return;}
        if(target.dataset.trainingLink){event.preventDefault();this.closePanel();this.router.navigate('/traningspass/'+target.dataset.trainingLink);return;}
        if(target.dataset.scope){this.filters={...this.filters,scope:target.dataset.scope};this.persist();this.paint();return;}
        if(target.dataset.day!==undefined){this.dayIndex=Number(target.dataset.day);this.persist();this.paint();return;}
        if(target.dataset.activity){const a=this.svc.week.get()?.activities.find(a=>a.id===target.dataset.activity)??this.svc.log.get()?.items.find(a=>a.id===target.dataset.activity);if(a)this.openActivity(a);return;}
        if(target.dataset.newHorse!==undefined||target.dataset.newType){this.openActivity(undefined,Number(target.dataset.newDay??this.dayIndex),target.dataset.newHorse,target.dataset.newType);return;}
        if(target.dataset.copyDay!==undefined){this.showPanel({kind:'copy',requestId:crypto.randomUUID(),sourceDate:addDays(this.startDate,Number(target.dataset.copyDay)),targetDates:[],week:false,keepAssignees:true,preview:null});return;}
        const action=target.dataset.action;
        if(action==='close'){this.closePanel();return;}
        if(action==='new'){this.openActivity();return;}
        if(action==='create-stable'){this.showPanel({kind:'create-stable'});return;}
        if(action==='settings'){await this.openSettings();return;}
        if(action==='templates'){await this.openTemplates();return;}
        if(action==='refresh'){event.preventDefault();await this.refresh();return;}
        if(action==='previous'){await this.changeWeek(-7);return;}
        if(action==='next'){await this.changeWeek(7);return;}
        if(action==='today'){this.startDate=mondayOf(localToday(this.stable()?.timeZone));this.persist();await this.refresh();return;}
        if(action==='mine'||action==='unassigned'){this.filters={...this.filters,[action]:!this.filters[action]};this.persist();this.paint();return;}
        if(action==='reset-filters'){this.filters={...DEFAULT_FILTERS};this.persist();this.paint();return;}
        if(action==='load-more'){await this.svc.loadLog(this.stableId,this.horseId,this.logFrom,this.logTo,true);return;}
        if(action==='complete'){await this.saveActivity(true);return;}
        if(action==='claim'||action==='reopen'||action==='cancel'){await this.stateAction(action);return;}
        if(action==='training'){await this.openTraining();return;}
        if(action==='copy-preview'||action==='copy-confirm'){await this.copy(action==='copy-preview');return;}
        if(action==='copy-week'){this.showPanel({kind:'copy',requestId:crypto.randomUUID(),sourceDate:addDays(this.startDate,-7),targetDates:[this.startDate],week:true,keepAssignees:true,preview:null});return;}
        if(action==='member-role'||action==='member-remove'){const stable=this.stable()!;const userId=target.dataset.user!;const role=action==='member-role'?((this.dialog?.querySelector(`[name="role-${CSS.escape(userId)}"]`) as HTMLSelectElement).value as 'admin'|'member'):'member';await this.settingsWrite(()=>api.stables.member({stableId:stable.id,userId,role,remove:action==='member-remove'}));return;}
        if(action==='detach-horse'){await this.settingsWrite(()=>api.stables.detachHorse({stableId:this.stableId,horseId:target.dataset.horse!}));return;}
        if(action==='revoke-invitation'){await this.settingsWrite(()=>api.stables.revoke({stableId:this.stableId,invitationId:target.dataset.invitation!}));return;}
        if(action==='edit-type'){this.renderTypeForm(target.dataset.type??'');return;}
        if(action==='conflict-load'){if(this.latestActivity)this.openActivity(this.latestActivity);return;}
        if(action==='conflict-keep'&&this.panel?.kind==='activity'&&this.latestActivity){this.panel.draft.record=this.latestActivity;this.latestActivity=null;this.svc.writeError.set(null);this.paintDialog(true);return;}
    }

    private openActivity(record?:Activity,day=this.dayIndex,horseId?:string,typeId?:string):void {
        const stable=this.stable();if(!stable)return;
        const horse=horseId??record?.horseId??(this.logMode?this.horseId:this.filters.scope.startsWith('horse:')?this.filters.scope.slice(6):stable.role==='member'?stable.horses.find(h=>h.active)?.id??'':'');
        if(!record&&!horse&&(this.logMode||stable.role==='member')){this.notice=tr('attach_horse_hint');this.paint();return;}
        const type=stable.types.find(t=>t.id===(typeId??record?.typeId))??stable.types.find(t=>!t.archived&&t.code===(horse?'care':'morning_feed'))??stable.types.find(t=>!t.archived);
        if(!type){this.notice=tr('error.type_inactive');this.paint();return;}
        const now=new Date().toISOString(), performed=record?.performedAt??now;
        const d:ActivityDraft={record,requestId:crypto.randomUUID(),typeId:type.id,horseId:horse||(stable.role==='member'?stable.horses.find(h=>h.active)?.id??'':''),title:record?.title??type.name,date:record?.date??(this.logMode?localToday(stable.timeZone):addDays(this.startDate,day)),time:record?.time??type.defaultTime??'',offsetMinutes:record?.offsetMinutes??null,instruction:record?.instruction??'',resultNote:record?.resultNote??'',assigneeIds:record?[...record.assigneeIds]:[this.accountId],performerIds:record?.performerIds.length?[...record.performerIds]:[this.accountId],trainingStudentId:record?.trainingStudentId??'',programIds:record?.programs.map(p=>p.id)??[],exerciseIds:record?.exercises.filter(e=>!e.sourceProgramId).map(e=>e.exerciseId)??[],contentDirty:false,completed:!record&&this.logMode,performedWall:wallTime(performed,stable.timeZone),performedOffset:wallOffset(performed,stable.timeZone)};
        if(type.category==='training'&&!d.trainingStudentId&&d.assigneeIds.length===1)d.trainingStudentId=d.assigneeIds[0]!;
        this.catalog=null;this.latestActivity=null;this.showPanel({kind:'activity',draft:d});
        if(type.category==='training'&&(!record||record.canEdit))void this.loadCatalog();
    }

    private showPanel(panel:Panel):void {this.panel=panel;this.svc.writeError.set(null);this.paintDialog(true);}
    private closePanel():void {this.panel=null;this.latestActivity=null;if(this.dialog){this.dialog.close();this.dialog.remove();this.dialog=null;}this.svc.writeError.set(null);}
    private paintDialog(force=false):void {
        if(!this.panel||this.disposed)return;
        const stable=this.stable();
        if(!this.dialog){this.dialog=document.createElement('dialog');this.dialog.className='schedule-dialog';this.dialog.addEventListener('cancel',e=>{e.preventDefault();if(!this.svc.saving.get())this.closePanel();});this.dialog.addEventListener('click',e=>{const box=this.dialog!.getBoundingClientRect();if(e.target===this.dialog&&(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)&&!this.svc.saving.get())this.closePanel();});this.dialogs.appendChild(this.dialog);force=true;}
        if(force){
            const active=document.activeElement as HTMLInputElement|null,focused=active?.name,selection=active?.selectionStart;
            const title=this.panel.kind==='activity'?(this.panel.draft.record?.title??tr(this.panel.draft.completed?'log_event':'new_activity')):tr(this.panel.kind==='create-stable'?'create_stable':this.panel.kind==='templates'?'weekly_template':this.panel.kind==='copy'?'copy_day':this.panel.kind==='training'?'register_training':'settings');
            this.dialog.innerHTML=`<div class="schedule-dialog-head"><p class="schedule-kicker">${esc(stable?.name??tr('stable'))}</p>${button('×','close','schedule-icon',`aria-label="${esc(tr('close'))}"`)}</div><h2 id="schedule-dialog-title">${esc(title)}</h2><div class="schedule-alert" role="alert" data-write-error></div><div data-conflict></div><div data-panel-body>${this.panel.kind==='activity'&&stable?activityPanel(this.panel.draft,stable,this.accountId,this.catalog):this.otherPanelHTML()}</div>`;
            this.dialog.setAttribute('aria-labelledby','schedule-dialog-title');
            if(!this.dialog.open){try{this.dialog.showModal();}catch{this.dialog.setAttribute('open','');}}
            if(focused){const next=this.dialog.querySelector<HTMLInputElement>(`[name="${CSS.escape(focused)}"]`);next?.focus();if(selection!=null&&next?.type==='text')next.setSelectionRange(selection,selection);}
        }
        this.panelState();
    }
    private panelState():void {
        if(!this.dialog)return;
        const error=this.dialog.querySelector<HTMLElement>('[data-write-error]')!;const key=this.svc.writeError.get();error.textContent=key?tr(key.replace('schedule.','')):'';
        this.dialog.querySelector<HTMLElement>('[data-panel-body]')!.inert=this.svc.saving.get();
        const close=this.dialog.querySelector<HTMLButtonElement>('[data-action="close"]');if(close)close.disabled=this.svc.saving.get();
        const conflict=this.dialog.querySelector<HTMLElement>('[data-conflict]')!;
        if(this.latestActivity)conflict.innerHTML=`<div class="schedule-dialog-info"><p>${esc(tr('latest_saved'))}</p><strong>${esc(this.latestActivity.title)}</strong><p>${esc(this.latestActivity.instruction)}</p><p>${esc(this.latestActivity.resultNote)}</p>${button(tr('load_saved'),'conflict-load','schedule-button schedule-small')}${button(tr('keep_draft'),'conflict-keep','schedule-button schedule-small')}</div>`;
        else conflict.innerHTML='';
    }

    private inputPanel(event:Event):void {
        const input=event.target as HTMLInputElement;
        if(this.panel?.kind==='activity'){
            const d=this.panel.draft, name=input.name;
            if(['title','date','time','instruction','resultNote','performedWall'].includes(name))(d as unknown as Record<string,unknown>)[name]=input.value;
            if(['assigneeIds','performerIds','programIds','exerciseIds'].includes(name)){
                (d as unknown as Record<string,unknown>)[name]=[...this.dialog!.querySelectorAll<HTMLInputElement>(`[name="${name}"]:checked`)].map(el=>el.value);
                if(name==='programIds'||name==='exerciseIds')d.contentDirty=true;
            }
            if(!d.record)d.requestId=crypto.randomUUID();
        }
        if(this.panel?.kind==='templates')this.panel.requests={save:crypto.randomUUID(),apply:crypto.randomUUID(),routines:crypto.randomUUID()};
        if(this.panel?.kind==='training'){
            const p=this.panel;if(['summary','duration','resultNote','performedWall','sessionId'].includes(input.name))(p as unknown as Record<string,unknown>)[input.name]=input.value;
            if(input.name==='performerIds')p.performerIds=[...this.dialog!.querySelectorAll<HTMLInputElement>('[name="performerIds"]:checked')].map(e=>e.value);
        }
    }
    private changePanel(event:Event):void {
        this.inputPanel(event);const input=event.target as HTMLInputElement;
        if(this.panel?.kind==='activity'){
            const d=this.panel.draft,stable=this.stable()!;
            if(input.name==='typeId'){const old=stable.types.find(t=>t.id===d.typeId),next=stable.types.find(t=>t.id===input.value)!;d.typeId=next.id;if(d.title===old?.name)d.title=next.name;if(next.scope==='stable')d.horseId='';if(next.scope==='horse'&&!d.horseId)d.horseId=stable.horses.find(h=>h.active)?.id??'';if(next.category==='training'&&!d.trainingStudentId&&d.assigneeIds.length===1)d.trainingStudentId=d.assigneeIds[0]!;if(next.category!=='training'){d.trainingStudentId='';d.programIds=[];d.exerciseIds=[];d.contentDirty=true;}this.catalog=null;this.paintDialog(true);if(next.category==='training')void this.loadCatalog();}
            else if(input.name==='horseId')d.horseId=input.value;
            else if(input.name==='trainingStudentId'){d.trainingStudentId=input.value;this.catalog=null;void this.loadCatalog();}
            else if(input.name==='assigneeIds'){if(!d.assigneeIds.includes(d.trainingStudentId))d.trainingStudentId=d.assigneeIds.length===1?d.assigneeIds[0]!:'';this.paintDialog(true);if(stable.types.find(t=>t.id===d.typeId)?.category==='training')void this.loadCatalog();}
            else if(input.name==='offsetMinutes')d.offsetMinutes=input.value===''?null:Number(input.value);
            else if(input.name==='performedOffset')d.performedOffset=input.value===''?null:Number(input.value);
            else if(input.name==='date'||input.name==='time'){d.offsetMinutes=null;this.paintDialog(true);}
            else if(input.name==='performedWall'){d.performedOffset=null;this.paintDialog(true);}
        }else if(this.panel?.kind==='copy'){
            const p=this.panel;
            if(input.name==='sourceDate')p.sourceDate=input.value;
            if(input.name==='keepAssignees')p.keepAssignees=input.checked;
            if(input.name==='copyTarget')p.targetDates=[...this.dialog!.querySelectorAll<HTMLInputElement>('[name="copyTarget"]:checked')].map(e=>e.value);
            if(input.name==='targetDate')p.targetDates=input.value?[input.value]:[];
            if(input.name==='extraTarget'&&input.value&&!p.targetDates.includes(input.value))p.targetDates.push(input.value);
            p.preview=null;p.requestId=crypto.randomUUID();this.paintDialog(true);
        }else if(this.panel?.kind==='training'){
            if(input.name==='performedWall'){this.panel.performedOffset=null;this.paintDialog(true);}
            if(input.name==='performedOffset')this.panel.performedOffset=input.value===''?null:Number(input.value);
        }
    }

    private async loadCatalog():Promise<void>{const panel=this.panel;if(panel?.kind!=='activity')return;const studentId=panel.draft.trainingStudentId;try{const catalog=await api.stableActivities.catalog({stableId:this.stableId,studentId:studentId||undefined});if(this.panel===panel&&studentId===panel.draft.trainingStudentId){this.catalog=catalog;this.paintDialog(true);}}catch(error){if(this.panel===panel)this.svc.writeError.set(scheduleErrorKey(error));}}

    private async saveActivity(complete=false):Promise<void>{
        if(this.panel?.kind!=='activity')return;const panel=this.panel,d=panel.draft,stable=this.stable()!,record=d.record;
        const form=this.dialog?.querySelector<HTMLFormElement>('form');if(!form?.reportValidity())return;
        const values={typeId:d.typeId,horseId:d.horseId||null,title:d.title,date:d.date,time:d.time||null,offsetMinutes:d.offsetMinutes,instruction:d.instruction,assigneeIds:d.assigneeIds,trainingStudentId:stable.types.find(t=>t.id===d.typeId)?.category==='training'?d.trainingStudentId||null:null};
        const content=!record||d.contentDirty?{programIds:d.programIds,exerciseIds:d.exerciseIds}:{};
        let performedAt:string|undefined;
        try{if(complete||d.completed||record?.status==='completed')performedAt=zonedInstant(d.performedWall.slice(0,10),d.performedWall.slice(11,16),stable.timeZone,d.performedOffset);}catch(error){this.svc.writeError.set('schedule.error.'+(error instanceof Error?error.message:'invalid_time'));return;}
        const outcome={resultNote:d.resultNote,performerIds:d.performerIds,performedAt};
        const result=await this.svc.write(()=>{
            if(!record)return api.stableActivities.create({stableId:stable.id,requestId:d.requestId,...values,...content,...outcome,status:d.completed?'completed':'planned'});
            if(complete)return api.stableActivities.complete({stableId:stable.id,activityId:record.id,version:record.version,...outcome,patch:record.canEdit?{...values,...content}:undefined});
            return api.stableActivities.update({stableId:stable.id,activityId:record.id,version:record.version,...(record.canEdit?{...values,...content}:{}),resultNote:d.resultNote,...(record.status==='completed'&&record.canComplete?{...(record.performedAt&&(d.performedWall!==wallTime(record.performedAt,stable.timeZone)||d.performedOffset!==wallOffset(record.performedAt,stable.timeZone))?{performedAt}:{}),...(d.performerIds.length!==record.performerIds.length||d.performerIds.some(id=>!record.performerIds.includes(id))?{performerIds:d.performerIds}:{})}:{})});
        });
        if(result){this.svc.merge(result);this.closePanel();this.notice=tr(complete?'completed_saved':'saved');await this.refresh();}
        else if(this.svc.writeError.get()==='schedule.error.version_conflict'&&record){try{this.latestActivity=await api.stableActivities.get({stableId:stable.id,activityId:record.id});this.panelState();}catch{/* Keep the draft visible even if refreshing the conflict also fails. */}}
    }
    private async stateAction(action:'claim'|'reopen'|'cancel'):Promise<void>{if(this.panel?.kind!=='activity'||!this.panel.draft.record)return;const a=this.panel.draft.record;const result=await this.svc.write(()=>api.stableActivities[action]({stableId:this.stableId,activityId:a.id,version:a.version}));if(result){this.svc.merge(result);this.closePanel();await this.refresh();}}

    private async openSettings():Promise<void>{const horses=await this.svc.write(()=>api.horses.list());if(horses)this.showPanel({kind:'settings',horses});}
    private async openTemplates():Promise<void>{const templates=await this.svc.write(()=>api.scheduleTemplates.list({stableId:this.stableId}));if(templates)this.showPanel({kind:'templates',templates,requests:{save:crypto.randomUUID(),apply:crypto.randomUUID(),routines:crypto.randomUUID()}});}
    private async settingsWrite(operation:()=>Promise<unknown>):Promise<void>{const result=await this.svc.write(operation);if(result!==undefined){await this.svc.loadStables();if(!this.svc.stables.get().some(s=>s.id===this.stableId)){this.closePanel();this.router.navigate('/veckoschema');return;}await this.refresh();if(this.panel?.kind==='settings')this.paintDialog(true);}}

    private async openTraining():Promise<void>{if(this.panel?.kind!=='activity'||!this.panel.draft.record)return;const activity=this.panel.draft.record;const sessions=await this.svc.write(()=>api.trainingSessions.list());if(!sessions)return;const value=activity.performedAt??new Date().toISOString();this.showPanel({kind:'training',activity,sessions:sessions.filter(s=>s.horseId===activity.horseId),performedWall:wallTime(value,this.stable()!.timeZone),performedOffset:wallOffset(value,this.stable()!.timeZone),summary:'',duration:'',resultNote:this.panel.draft.resultNote,sessionId:'',performerIds:[this.accountId]});}

    private otherPanelHTML():string {
        const p=this.panel,stable=this.stable();if(!p)return'';
        if(p.kind==='create-stable')return `<p>${esc(tr('create_description'))}</p><form data-form="create-stable">${field('name',tr('stable_name'),'','text','required maxlength="200"')}${select('timeZone',tr('time_zone'),'Europe/Stockholm',[{value:'Europe/Stockholm',label:'Europe/Stockholm'},{value:'UTC',label:'UTC'}])}<div class="schedule-dialog-footer"><button type="submit" class="schedule-primary">${esc(tr('create_stable'))}</button></div></form>`;
        if(!stable)return'';
        if(p.kind==='settings')return this.settingsHTML(stable,p.horses);
        if(p.kind==='templates')return `<p>${esc(tr('template_description'))}</p><form data-form="routines">${checks('routine',tr('daily_routines'),stable.types.filter(t=>t.scope==='stable'&&!t.archived).map(t=>t.id),stable.types.filter(t=>t.scope==='stable'&&!t.archived).map(t=>({value:t.id,label:t.name+(t.defaultTime?' · '+t.defaultTime:'')})))}<button type="submit" class="schedule-primary">${esc(tr('add_routines'))}</button></form><h3>${esc(tr('reuse_week'))}</h3>${button(tr('copy_previous_week'),'copy-week')}<form data-form="save-template">${field('name',tr('template_name'),'','text','required maxlength="200"')}<button type="submit" class="schedule-button">${esc(tr('save_template'))}</button></form>${p.templates.length?`<form data-form="apply-template">${select('templateId',tr('choose_template'),p.templates[0]!.id,p.templates.map(t=>({value:t.id,label:t.name+' · '+t.count+' '+tr('activities')})))}<label class="schedule-check"><input type="checkbox" name="keepAssignees" checked>${esc(tr('keep_assignees'))}</label><div class="schedule-dialog-footer"><button type="submit" class="schedule-primary">${esc(tr('apply_template'))}</button></div></form>`:''}<p class="schedule-dialog-hint">${esc(tr('copy_excludes_outcome'))}</p>`;
        if(p.kind==='copy')return `<p>${esc(tr(p.week?'copy_week_description':'copy_day_description'))}</p>${field('sourceDate',tr('copy_from'),p.sourceDate,'date','required')}${p.week?field('targetDate',tr('copy_to'),p.targetDates[0]??'','date','required'):checks('copyTarget',tr('copy_to'),p.targetDates,Array.from({length:7},(_,d)=>addDays(this.startDate,d)).filter(date=>date!==p.sourceDate).map(date=>({value:date,label:this.date(date,{weekday:'long',day:'numeric',month:'short'})})))+field('extraTarget',tr('another_date'),'','date')}${!p.week&&p.targetDates.some(d=>d<this.startDate||d>addDays(this.startDate,6))?'<p>'+esc(p.targetDates.map(d=>this.date(d)).join(', '))+'</p>':''}<label class="schedule-check"><input type="checkbox" name="keepAssignees" ${p.keepAssignees?'checked':''}>${esc(tr('keep_assignees'))}</label><div class="schedule-dialog-info">${esc(tr('copy_scope'))}<br>${esc(tr('copy_excludes_outcome'))}</div>${p.preview?'<p role="status">'+esc(tr('copy_preview_count',{count:p.preview.count,source:p.preview.sourceCount}))+'</p>':''}<div class="schedule-dialog-footer">${button(tr('preview'),'copy-preview','schedule-button')}${button(tr('copy_activities'),'copy-confirm','schedule-primary',p.preview?.count?'':'disabled')}</div>`;
        if(p.kind==='training')return `<p>${esc(tr('training_description'))}</p><form data-form="training">${select('sessionId',tr('existing_training'),p.sessionId,[{value:'',label:tr('new_training')},...p.sessions.map(s=>({value:s.id,label:this.date(s.performedAt.slice(0,10))+' · '+(s.summary?.slice(0,45)??tr('training'))}))])}${field('performedWall',tr('performed_at'),p.performedWall,'datetime-local','required')}${offsetField('performedOffset',p.performedWall.slice(0,10),p.performedWall.slice(11,16),stable.timeZone,p.performedOffset)}${field('duration',tr('duration'),p.duration,'number','min="0" max="1440"')}${area('summary',tr('private_summary'),p.summary)}${area('resultNote',tr('result_note'),p.resultNote)}${checks('performerIds',tr('actual_performers'),p.performerIds,stable.members.filter(m=>m.active).map(m=>({value:m.userId,label:m.displayName})))}<div class="schedule-dialog-footer"><button type="submit" class="schedule-primary">${esc(tr('save_training'))}</button></div></form>`;
        return'';
    }

    private settingsHTML(stable:StableDetail,horses:Horse[]):string {
        const admin=stable.role==='admin',active=stable.members.filter(m=>m.active);
        return `<h3>${esc(tr('members'))}</h3>${active.map(m=>`<div class="schedule-settings-row"><span>${esc(m.displayName)}<small> · ${esc(tr('role.'+m.role))}</small></span>${admin?`<select name="role-${esc(m.userId)}" aria-label="${esc(tr('member_role',{name:m.displayName}))}"><option value="member" ${m.role==='member'?'selected':''}>${esc(tr('role.member'))}</option><option value="admin" ${m.role==='admin'?'selected':''}>${esc(tr('role.admin'))}</option></select>${button(tr('save'),'member-role','schedule-button schedule-small',`data-user="${esc(m.userId)}"`)}`:''}${admin||m.userId===this.accountId?button(tr(m.userId===this.accountId?'leave_stable':'remove'),'member-remove','schedule-ghost schedule-small',`data-user="${esc(m.userId)}"`):''}</div>`).join('')}${admin?`<form data-form="invite">${field('email',tr('invite_email'),'','email','required maxlength="254"')}<button type="submit" class="schedule-button">${esc(tr('invite'))}</button></form>${stable.invitations.filter(i=>i.status==='pending').map(i=>`<div class="schedule-settings-row"><span>${esc(i.inviteeEmail)}</span>${button(tr('revoke'),'revoke-invitation','schedule-ghost schedule-small',`data-invitation="${esc(i.id)}"`)}</div>`).join('')}`:''}
        <h3>${esc(tr('stable_horses'))}</h3><p class="schedule-dialog-hint">${esc(tr('horse_consent'))}</p>${stable.horses.filter(h=>h.active).map(h=>`<div class="schedule-settings-row"><span>${esc(h.name)}</span>${admin||h.ownerId===this.accountId?button(tr('detach_horse'),'detach-horse','schedule-ghost schedule-small',`data-horse="${esc(h.id)}"`):''}</div>`).join('')}${horses.some(h=>!stable.horses.some(s=>s.id===h.id&&s.active))?`<form data-form="attach-horse">${select('horseId',tr('choose_own_horse'),'',horses.filter(h=>!stable.horses.some(s=>s.id===h.id&&s.active)).map(h=>({value:h.id,label:h.name})))}<label class="schedule-check"><input type="checkbox" name="consent" required>${esc(tr('consent_label'))}</label><div class="schedule-dialog-footer"><button type="submit" class="schedule-button">${esc(tr('attach_horse'))}</button></div></form>`:`<p>${esc(tr('no_own_horses'))} ${this.link(tr('manage_horses'),'/hastar','schedule-log-link')}</p>`}
        ${admin?`<h3>${esc(tr('activity_types'))}</h3>${stable.types.map(type=>button(type.name+(type.archived?' · '+tr('archived'):''),'edit-type','schedule-ghost schedule-small',`data-type="${esc(type.id)}"`)).join('')}${button(tr('new_type'),'edit-type','schedule-button schedule-small','data-type=""')}<div data-type-form></div>`:''}`;
    }
    private renderTypeForm(id:string):void{const type=this.stable()!.types.find(t=>t.id===id);const host=this.dialog?.querySelector('[data-type-form]');if(!host)return;host.innerHTML=`<form data-form="save-type"><input type="hidden" name="typeId" value="${esc(id)}">${field('name',tr('name'),type?.name??'','text','required maxlength="200"')}${select('category',tr('category'),type?.category??'other',['routine','care','training','visit','other'].map(c=>({value:c,label:tr('category.'+c)})))}${select('scope',tr('applies_to'),type?.scope??'any',['stable','horse','any'].map(scope=>({value:scope,label:tr('scope.'+scope)})))}${field('defaultTime',tr('default_time'),type?.defaultTime??'','time')}<label class="schedule-check"><input type="checkbox" name="archived" ${type?.archived?'checked':''}>${esc(tr('archived'))}</label><div class="schedule-dialog-footer"><button type="submit" class="schedule-primary">${esc(tr('save_type'))}</button></div></form>`;}

    private async copy(preview:boolean):Promise<void>{if(this.panel?.kind!=='copy')return;const p=this.panel;const result=await this.svc.write(()=>api.scheduleTemplates.copy({stableId:this.stableId,requestId:p.requestId,sourceDate:p.sourceDate,targetDates:p.targetDates,week:p.week,keepAssignees:p.keepAssignees,preview,sourceVersion:preview?undefined:p.preview?.sourceVersion}));if(result){if(preview){p.preview=result;this.paintDialog(true);}else{this.closePanel();this.notice=tr('copied',{count:result.count});await this.refresh();}}}

    private async submit(form:HTMLFormElement):Promise<void>{
        if(!form.reportValidity()||this.svc.saving.get())return;const data=new FormData(form),name=form.dataset.form;
        if(name==='activity'){await this.saveActivity();return;}
        if(name==='create-stable'){const stable=await this.svc.write(()=>api.stables.create({name:String(data.get('name')),timeZone:String(data.get('timeZone'))}));if(stable){await this.svc.loadStables();this.closePanel();this.router.navigate('/veckoschema/'+stable.id);}return;}
        if(name==='invite'){await this.settingsWrite(()=>api.stables.invite({stableId:this.stableId,inviteeEmail:String(data.get('email'))}));return;}
        if(name==='attach-horse'){await this.settingsWrite(()=>api.stables.attachHorse({stableId:this.stableId,horseId:String(data.get('horseId'))}));return;}
        if(name==='save-type'){await this.settingsWrite(()=>api.stables.saveType({stableId:this.stableId,typeId:String(data.get('typeId'))||undefined,name:String(data.get('name')),category:String(data.get('category')) as ActivityType['category'],scope:String(data.get('scope')) as ActivityType['scope'],defaultTime:String(data.get('defaultTime'))||null,archived:data.has('archived')}));return;}
        if(this.panel?.kind==='templates'){
            const p=this.panel;
            const result=await this.svc.write<ScheduleCopyResult|ScheduleTemplate>(()=>name==='routines'?api.scheduleTemplates.routines({stableId:this.stableId,requestId:p.requests.routines,startDate:this.startDate,typeIds:data.getAll('routine').map(String)}):name==='save-template'?api.scheduleTemplates.save({stableId:this.stableId,requestId:p.requests.save,startDate:this.startDate,name:String(data.get('name'))}):api.scheduleTemplates.apply({stableId:this.stableId,requestId:p.requests.apply,startDate:this.startDate,templateId:String(data.get('templateId')),keepAssignees:data.has('keepAssignees')}));
            if(result){this.closePanel();this.notice=tr('saved');await this.refresh();}return;
        }
        if(name==='training'&&this.panel?.kind==='training'){
            const p=this.panel;let performedAt:string;
            try{performedAt=zonedInstant(p.performedWall.slice(0,10),p.performedWall.slice(11,16),this.stable()!.timeZone,p.performedOffset);}catch(error){this.svc.writeError.set('schedule.error.'+(error instanceof Error?error.message:'invalid_time'));return;}
            const result=await this.svc.write(()=>api.stableActivities.training({stableId:this.stableId,activityId:p.activity.id,version:p.activity.version,sessionId:p.sessionId||undefined,performedAt,durationMin:p.duration?Number(p.duration):null,summary:p.summary,resultNote:p.resultNote,performerIds:p.performerIds}));
            if(result){this.svc.merge(result);this.closePanel();this.notice=tr('saved');await this.refresh();}
        }
    }
}
