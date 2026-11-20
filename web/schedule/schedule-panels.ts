import { t } from '../i18n';
import type { Activity, StableDetail, ScheduleCatalog, ScheduleTemplate } from '../api';
import { escapeHtml as esc } from './schedule-copy';
import { zonedOffsets } from '../../shared/schedule-calendar';

export const tr = (key: string, values?: Record<string, string | number>) => t('schedule.' + key, values);
export interface ActivityDraft {
    record?: Activity; requestId: string; typeId: string; horseId: string; title: string; date: string; time: string;
    offsetMinutes: number | null; instruction: string; resultNote: string; assigneeIds: string[]; performerIds: string[];
    trainingStudentId: string; programIds: string[]; exerciseIds: string[]; contentDirty: boolean;
    completed: boolean; performedWall: string; performedOffset: number | null;
}

export function wallTime(value: string, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).formatToParts(new Date(value));
    const read = (type: string) => parts.find(p => p.type === type)!.value;
    return `${read('year')}-${read('month')}-${read('day')}T${read('hour')}:${read('minute')}`;
}
export function wallOffset(value: string, timeZone: string): number { const ms = Date.parse(value); return Math.round((Date.parse(wallTime(value, timeZone) + ':00Z') - Math.floor(ms / 60000) * 60000) / 60000); }

export function field(name: string, label: string, value: string, type = 'text', attributes = ''): string {
    return `<label class="schedule-field"><span>${esc(label)}</span><input name="${name}" aria-label="${esc(label)}" type="${type}" value="${esc(value)}" ${attributes}></label>`;
}
export function area(name: string, label: string, value: string, disabled = false): string {
    return `<label class="schedule-field"><span>${esc(label)}</span><textarea name="${name}" aria-label="${esc(label)}" maxlength="5000" ${disabled ? 'disabled' : ''}>${esc(value)}</textarea></label>`;
}
export function select(name: string, label: string, value: string, options: { value: string; label: string }[], attributes = ''): string {
    return `<label class="schedule-field"><span>${esc(label)}</span><select name="${name}" aria-label="${esc(label)}" ${attributes}>${options.map(o => `<option value="${esc(o.value)}" ${value === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>`;
}
export function checks(name: string, label: string, selected: string[], options: { value: string; label: string }[], disabled = false): string {
    return `<fieldset class="schedule-checks" ${disabled ? 'disabled' : ''}><legend>${esc(label)}</legend><div>${options.map(o => `<label class="schedule-check"><input type="checkbox" name="${name}" value="${esc(o.value)}" ${selected.includes(o.value) ? 'checked' : ''}>${esc(o.label)}</label>`).join('')}</div></fieldset>`;
}
export function offsetField(name: string, date: string, time: string, zone: string, value: number | null): string {
    let offsets: number[] = [];
    try { if (date && time) offsets = zonedOffsets(date, time, zone); } catch { return ''; }
    if (offsets.length < 2) return '';
    return select(name, tr('overlap'), value === null ? '' : String(value), [{ value: '', label: tr('choose') }, ...offsets.map((o, i) => ({ value: String(o), label: `${tr(i === 0 ? 'first_time' : 'second_time')} (UTC${o >= 0 ? '+' : '-'}${String(Math.floor(Math.abs(o) / 60)).padStart(2, '0')}:${String(Math.abs(o) % 60).padStart(2, '0')})` }))], 'required');
}

export function dayTemplatesPanel(templates: ScheduleTemplate[], date: string, dateLabel: string): string {
    const options = templates.map(t => ({ value: t.id, label: t.name }));
    return `
        <h3>${esc(tr('create_day_template'))}</h3>
        <form data-form="save-day-template">
            <div class="schedule-fieldrow">
                ${field('sourceDate', tr('template_source_date'), date, 'date', 'required')}
                ${field('name', tr('template_name'), '', 'text', 'required maxlength="200"')}
            </div>
            <p class="schedule-dialog-hint">${esc(tr('day_template_description'))}</p>
            <button type="submit" class="schedule-button">${esc(tr('save_day_template'))}</button>
        </form>
        ${templates.length ? `
            <h3>${esc(tr('use_day_template', { date: dateLabel }))}</h3>
            <form data-form="apply-day-template">
                ${select('templateId', tr('choose_day_template'), templates[0]!.id,
                    templates.map(t => ({ value: t.id, label: t.name + ' · ' + t.count + ' ' + tr('activities') })))}
                <label class="schedule-check"><input type="checkbox" name="keepAssignees" checked>${esc(tr('keep_assignees'))}</label>
                <div class="schedule-dialog-footer"><button type="submit" class="schedule-button">${esc(tr('apply_day_template'))}</button></div>
            </form>
            <h3>${esc(tr('default_day_template'))}</h3>
            <form data-form="default-day-template">
                ${select('defaultTemplateId', tr('default_template_label'), templates.find(t => t.isDefault)?.id ?? '',
                    [{ value: '', label: tr('no_default_template') }, ...options])}
                <p class="schedule-dialog-hint">${esc(tr('default_template_description'))}</p>
                <button type="submit" class="schedule-button">${esc(tr('save_default_template'))}</button>
            </form>
        ` : ''}
    `;
}

export function activityPanel(d: ActivityDraft, stable: StableDetail, userId: string, catalog: ScheduleCatalog | null): string {
    const editing = !d.record || d.record.canEdit, disabled = editing ? '' : 'disabled';
    const type = stable.types.find(t => t.id === d.typeId), training = type?.category === 'training';
    const members = stable.members.filter(m => m.active || d.assigneeIds.includes(m.userId) || d.performerIds.includes(m.userId));
    const assignable = stable.role === 'admin' || !editing ? members : members.filter(m => m.userId === userId);
    const horseOptions = type?.scope === 'stable' ? [{ value:'',label:tr('whole_stable') }] : [
        ...(type?.scope !== 'horse' && (stable.role === 'admin' || !editing) ? [{ value:'',label:tr('whole_stable') }] : []),
        ...stable.horses.filter(h => h.active || h.id === d.horseId).map(h => ({ value:h.id,label:h.name })),
    ];
    const status = d.record?.status ?? (d.completed ? 'completed' : 'planned');
    return `<p class="schedule-dialog-hint">${esc(tr('shared_with_stable', { name: stable.name }))}</p>${d.record ? `<p><span class="schedule-state ${status}">${status === 'completed' ? '✓' : ''}</span> ${esc(tr('status.' + status))}</p>` : ''}${d.record?.horseInactive ? `<div class="schedule-dialog-info">${esc(tr('inactive_horse'))}</div>` : ''}
    <form data-form="activity"><div class="schedule-fieldrow">${select('typeId', tr('activity_type'), d.typeId, stable.types.filter(t => (!t.archived || t.id === d.typeId) && (stable.role === 'admin' || !editing || t.scope !== 'stable')).map(t => ({ value:t.id,label:t.name })), disabled)}${select('horseId', tr('applies_to'), d.horseId, horseOptions, disabled)}</div>
    ${field('title',tr('name'),d.title,'text',`required maxlength="200" ${disabled}`)}
    <div class="schedule-fieldrow">${field('date',tr('date'),d.date,'date',`required ${disabled}`)}${field('time',tr('time_optional'),d.time,'time',disabled)}</div>
    ${editing ? offsetField('offsetMinutes',d.date,d.time,stable.timeZone,d.offsetMinutes) : ''}
    <p class="schedule-dialog-hint">${esc(stable.timeZone)}</p>
    ${checks('assigneeIds',tr('assignees'),d.assigneeIds,assignable.map(m => ({value:m.userId,label:m.displayName + (m.active ? '' : ' · '+tr('inactive_member'))})),!editing)}
    ${training ? select('trainingStudentId',tr('main_performer'),d.trainingStudentId,[{value:'',label:tr('unassigned')},...members.filter(m => d.assigneeIds.includes(m.userId)).map(m => ({value:m.userId,label:m.displayName}))],disabled) : ''}
    ${training && editing ? `<details class="schedule-program" ${d.record ? '' : 'open'}><summary>${esc(tr('catalog'))}</summary><p>${esc(tr('catalog_visibility'))}</p>${catalog ? checks('programIds',tr('programs'),d.programIds,catalog.programs.map(p => ({value:p.id,label:p.title+' · '+p.author})))+checks('exerciseIds',tr('exercises'),d.exerciseIds,catalog.exercises.map(e => ({value:e.id,label:e.name+' · '+e.author}))) : `<p>${esc(tr('loading_catalog'))}</p>`}${d.record?.hasProgram && !d.record.programs.length ? `<p>${esc(tr('program_restricted'))}</p>` : ''}</details>` : ''}
    ${d.record?.exercises.length ? `<details class="schedule-program"><summary>${esc(tr('planned_content'))}</summary><ol>${d.record.exercises.map(e => `<li>${esc(e.name)}${e.description ? '<p>'+esc(e.description)+'</p>' : ''}${e.notes ? '<p>'+esc(e.notes)+'</p>' : ''}</li>`).join('')}</ol></details>` : ''}
    ${area('instruction',tr('instruction'),d.instruction,!editing)}
    ${area('resultNote',tr('result_note'),d.resultNote,!!d.record && !d.record.canComplete && !editing)}
    ${(d.completed || d.record?.canComplete) ? `<div class="schedule-fieldrow">${field('performedWall',tr('performed_at'),d.performedWall,'datetime-local','required')}${offsetField('performedOffset',d.performedWall.slice(0,10),d.performedWall.slice(11,16),stable.timeZone,d.performedOffset)}</div>${checks('performerIds',tr('actual_performers'),d.performerIds,members.filter(m=>m.active).map(m=>({value:m.userId,label:m.displayName})))}` : ''}
    ${d.record?.completedBy ? `<p class="schedule-dialog-hint">${esc(tr('recorded_by',{name:stable.members.find(m=>m.userId===d.record!.completedBy)?.displayName??tr('inactive_member')}))}</p>` : ''}
    <div class="schedule-dialog-footer"><button type="button" class="schedule-ghost" data-action="close">${esc(tr('close'))}</button>${editing || d.record?.canComplete ? `<button type="submit" class="${!d.record ? 'schedule-primary' : 'schedule-button'}">${esc(tr(d.record ? 'save' : d.completed ? 'save_log' : 'add_activity'))}</button>` : ''}${d.record?.canComplete && d.record.status !== 'completed' && !d.record.horseInactive ? `<button type="button" class="schedule-primary" data-action="complete">✓ ${esc(tr('complete'))}</button>` : ''}${d.record?.canClaim ? `<button type="button" class="schedule-primary" data-action="claim">${esc(tr('claim'))}</button>` : ''}</div>
    ${d.record?.canComplete && d.record.status === 'completed' ? `<button type="button" class="schedule-ghost" data-action="reopen">${esc(tr('reopen'))}</button>` : ''}
    ${d.record?.canComplete && d.record.status !== 'cancelled' ? `<button type="button" class="schedule-danger schedule-small" data-action="cancel">${esc(tr('cancel_activity'))}</button>` : ''}
    ${d.record?.canRegisterTraining && !d.record.hasTrainingSession ? `<button type="button" class="schedule-button" data-action="training">${esc(tr('register_training'))}</button>` : ''}
    ${d.record?.trainingSessionId ? `<a class="schedule-log-link" href="#" data-training-link="${esc(d.record.trainingSessionId)}">${esc(tr('open_training'))} ↗</a>` : d.record?.hasTrainingSession ? `<p class="schedule-dialog-hint">${esc(tr('training_private'))}</p>` : ''}
    ${d.record?.canEdit ? `<details class="schedule-delete"><summary>${esc(tr('delete_activity'))}</summary>
        <p>${esc(tr(d.record.hasTrainingSession ? 'delete_activity_linked' : 'delete_activity_confirm'))}</p>
        <button type="button" class="schedule-danger schedule-small" data-action="delete-activity">${esc(tr('confirm_delete_activity'))}</button>
    </details>` : ''}
    </form>`;
}
