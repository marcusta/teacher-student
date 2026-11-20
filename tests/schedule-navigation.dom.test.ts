import { test, expect } from 'bun:test';
import { di, Router } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { Hono } from 'hono';
import { SessionStore, createAuth } from '@basics/core/server/auth';
import { mount } from '@basics/core/server/mount';
import { scheduleFixture } from '../server/testing/schedule';
import { createStablesApi } from '../server/api/stables.api';
import { createStableActivitiesApi } from '../server/api/stable-activities.api';
import { createHorsesApi } from '../server/api/horses.api';
import { AppComponent } from '../web/app/app.component';
import { AppService } from '../web/app/app.service';
import { ScheduleService } from '../web/schedule/schedule.service';
import { DEFAULT_FILTERS, savePreferences } from '../web/schedule/schedule-copy';
import { addDays, localToday, mondayOf } from '../shared/schedule-calendar';
import { EMPTY_DASHBOARD_JSON, isDashboardUrl } from './dashboard-stub';

async function waitFor(condition: () => boolean): Promise<void> {
    for (let i = 0; i < 100 && !condition(); i++) await new Promise(resolve => setTimeout(resolve, 5));
    expect(condition()).toBe(true);
}

async function fixture() {
    const c = await scheduleFixture(), sessions = new SessionStore(':memory:');
    await sessions.init();
    const realFetch = globalThis.fetch;
    const realFormData = globalThis.FormData;
    globalThis.FormData = window.FormData;
    const api = new Hono();
    api.use(createAuth(sessions, id => c.userService.findById(id)));
    mount(api, '/api', createStablesApi(c.stableService));
    mount(api, '/api', createStableActivitiesApi(c.scheduleService, c.scheduleTrainingService));
    mount(api, '/api', createHorsesApi(c.horseService));
    api.get('/api/*', context => context.json(isDashboardUrl(context.req.url) ? JSON.parse(EMPTY_DASHBOARD_JSON) : []));
    const cookie = `session=${await sessions.create(c.admin.id)}`;
    const requests = new Set<Promise<Response>>();
    globalThis.fetch = ((url, init) => {
        const response = Promise.resolve(api.fetch(new Request(new URL(String(url), 'http://localhost'), {
            ...init, headers: { ...Object.fromEntries(new Headers(init?.headers)), cookie },
        })));
        requests.add(response);
        void response.finally(() => requests.delete(response));
        return response;
    }) as typeof fetch;
    di.reset();
    sessionStorage.clear();
    di.get(AuthService).currentUser.set({ id: c.admin.id, username: c.admin.email });
    const router = di.get(Router);
    router.navigate('/home', true);
    document.body.innerHTML = '<div id="schedule-navigation-test"></div>';
    let app = new AppComponent();
    app.mount(document.getElementById('schedule-navigation-test')!);
    const navigate = (path: string) => {
        di.get(AppService).navOpen.set(true);
        document.querySelector<HTMLAnchorElement>(`#app-nav-drawer a[href="${path}"]`)!.click();
    };
    const reload = async (path = di.get(Router).route.get()) => {
        app.destroy();
        while (requests.size) await Promise.all(requests);
        di.reset();
        di.get(AuthService).currentUser.set({ id: c.admin.id, username: c.admin.email });
        di.get(Router).navigate(path, true);
        document.getElementById('schedule-navigation-test')!.replaceChildren();
        app = new AppComponent();
        app.mount(document.getElementById('schedule-navigation-test')!);
    };
    const close = async () => {
        app.destroy();
        while (requests.size) await Promise.all(requests);
        globalThis.fetch = realFetch; globalThis.FormData = realFormData; document.body.innerHTML = ''; sessionStorage.clear();
        await sessions.close(); await c.db.destroy();
    };
    return { ...c, router, navigate, reload, close };
}

test('a dated schedule link overrides saved dates and opens the selected day on reload', async () => {
    const c = await fixture();
    const dom = (window as unknown as { happyDOM: { setURL(url: string): void } }).happyDOM;
    const oldUrl = location.href;
    dom.setURL('http://localhost/home');
    try {
        savePreferences(c.admin.id, c.stable.id, { filters: DEFAULT_FILTERS, startDate: '2026-11-30', dayIndex: 5 });
        const path = `/veckoschema/${c.stable.id}/2026-11-18`;
        await c.reload(path);
        await waitFor(() => !!document.querySelector('.schedule-table') && !di.get(ScheduleService).loading.get());
        expect(di.get(ScheduleService).week.get()?.startDate).toBe('2026-11-16');
        expect(document.querySelector('.schedule-day-strip [aria-pressed="true"]')?.getAttribute('data-day')).toBe('2');
        document.querySelector<HTMLButtonElement>('[data-action="share-day"]')!.click();
        expect(new URL(document.querySelector<HTMLInputElement>('dialog [name="shareUrl"]')!.value).pathname).toBe(path);
        document.querySelector<HTMLButtonElement>('dialog [data-action="close"]')!.click();
        document.querySelector<HTMLButtonElement>('[data-action="next"]')!.click();
        await waitFor(() => di.get(ScheduleService).week.get()?.startDate === '2026-11-23');
        expect(di.get(Router).route.get()).toBe(`/veckoschema/${c.stable.id}/2026-11-25`);
    } finally {
        await c.close();
        dom.setURL(oldUrl);
    }
});

test('mobile drawer reaches Horses after reopening a previously loaded weekly schedule', async () => {
    const c = await fixture();
    try {
        c.navigate('/veckoschema');
        await waitFor(() => !!document.querySelector('.schedule-table') && !di.get(ScheduleService).loading.get());
        c.navigate('/hastar');
        await waitFor(() => !!document.querySelector('.stable__title'));
        expect(c.router.route.get()).toBe('/hastar');
        c.navigate('/veckoschema');
        await waitFor(() => !!document.querySelector('.schedule-table') && !di.get(ScheduleService).loading.get());
        c.navigate('/hastar');
        await waitFor(() => !!document.querySelector('.stable__title'));
        expect(c.router.route.get()).toBe('/hastar');
        expect(di.get(AppService).navOpen.get()).toBe(false);
        expect(document.querySelector('.schedule')).toBeNull();
    } finally { await c.close(); }
});

test('attaching a horse preserves the selected week and its activities after revisiting the schedule', async () => {
    const c = await fixture();
    try {
        const horse = await c.horseService.create(c.admin.id, { name: 'Atlas' });
        const start = addDays(mondayOf(localToday(c.stable.timeZone)), 7);
        const activity = await c.scheduleService.create(c.admin.id, c.stable.id, {
            requestId: 'preserve-week', typeId: c.type('morning_feed'), title: 'Morgonfodring', date: start,
            assigneeIds: [c.admin.id],
        });
        c.navigate('/veckoschema');
        await waitFor(() => !!document.querySelector('.schedule-table') && !di.get(ScheduleService).loading.get());
        c.navigate('/home');
        c.navigate('/veckoschema');
        await waitFor(() => !!document.querySelector('.schedule-table') && !di.get(ScheduleService).loading.get());
        document.querySelector<HTMLButtonElement>('[data-action="next"]')!.click();
        await waitFor(() => !!document.querySelector(`[data-activity="${activity.id}"]`));
        document.querySelector<HTMLButtonElement>('[data-action="settings"]')!.click();
        await waitFor(() => !!document.querySelector('form[data-form="attach-horse"]'));
        const form = document.querySelector<HTMLFormElement>('form[data-form="attach-horse"]')!;
        form.querySelector<HTMLSelectElement>('[name="horseId"]')!.value = horse.id;
        form.querySelector<HTMLInputElement>('[name="consent"]')!.checked = true;
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await waitFor(() => !!document.querySelector(`[data-horse-lane="${horse.id}"]`) && !di.get(ScheduleService).loading.get());
        document.querySelector<HTMLButtonElement>('dialog [data-action="close"]')!.click();
        expect(di.get(ScheduleService).week.get()?.startDate).toBe(start);
        expect(document.querySelector(`[data-activity="${activity.id}"]`)).not.toBeNull();
        expect((await c.scheduleService.week(c.admin.id, c.stable.id, start)).activities.map(a => a.id)).toContain(activity.id);
    } finally { await c.close(); }
});

test('connecting the first horse preserves all weekly routines through a full app reload', async () => {
    const c = await fixture();
    try {
        await c.stableService.detachHorse(c.admin.id, c.stable.id, c.horse.id);
        const start = mondayOf(localToday(c.stable.timeZone));
        await c.scheduleTemplateService.routines(c.admin.id, c.stable.id, {
            requestId: 'routines-before-first-horse', startDate: start,
            typeIds: ['morning_feed', 'turnout', 'lunch_feed', 'bring_in', 'evening_feed'].map(c.type),
        });
        const before = await c.db.selectFrom('stable_activities').selectAll().orderBy('id').execute();
        expect(before).toHaveLength(35);
        c.navigate('/veckoschema');
        await waitFor(() => !!document.querySelector('.schedule-table') && !di.get(ScheduleService).loading.get());
        document.querySelector<HTMLButtonElement>('[data-action="settings"]')!.click();
        await waitFor(() => !!document.querySelector('form[data-form="attach-horse"]'));
        const form = document.querySelector<HTMLFormElement>('form[data-form="attach-horse"]')!;
        form.querySelector<HTMLSelectElement>('[name="horseId"]')!.value = c.horse.id;
        form.querySelector<HTMLInputElement>('[name="consent"]')!.checked = true;
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await waitFor(() => !!document.querySelector(`[data-horse-lane="${c.horse.id}"]`) && !di.get(ScheduleService).loading.get());
        expect(await c.db.selectFrom('stable_activities').selectAll().orderBy('id').execute()).toEqual(before);
        await c.reload();
        await waitFor(() => !!document.querySelector('.schedule-table') && !di.get(ScheduleService).loading.get());
        expect(di.get(ScheduleService).week.get()?.activities).toHaveLength(35);
        for (const activity of before) expect(document.querySelector(`[data-activity="${activity.id}"]`)).not.toBeNull();
    } finally { await c.close(); }
});
