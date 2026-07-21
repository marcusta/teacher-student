/**
 * The one assertion in this suite that observes the clock a **Swedish reader**
 * actually has.
 *
 * `bun test` pins `TZ=UTC` for the whole run, so every other time assertion in
 * `tests/` is written against UTC rendering — and an app whose users are all in
 * Europe/Stockholm therefore has no test that can see a timezone regression at
 * all. Proven, not theorised: adding `timeZone: 'UTC'` to `lesson-copy.lessonWhen`
 * — which would render every lesson in the app two hours early for its readers —
 * left the suite green. `lessonWhen` is the right function to pin this on because
 * it is the app's single lesson-time phrase: `lessons.component.ts`, the Lesson
 * detail view, `home-copy.nextLessonWhen` and `home-copy.awaitingWhen` all route
 * through it.
 *
 * `lesson-copy.ts` itself is correct and is NOT touched by this slice: it calls
 * `formatDate` with no `timeZone`, which is what makes the output follow the
 * reader's own zone. This file exists so that stays true.
 *
 * Run as a child process rather than by swapping `process.env.TZ` inline — see
 * `tz-probe.ts` for why the in-process version would be unsound.
 */
import { test, expect } from 'bun:test';

const PROBE = new URL('./tz-probe.ts', import.meta.url).pathname;

/** 17:00 UTC on a Wednesday in July — 19:00 in Stockholm's summer time. */
const INSTANT = '2026-07-22T17:00:00.000Z';

function renderIn(timeZone: string): { timeZone: string; lessonWhen: string } {
    const run = Bun.spawnSync({
        cmd: [process.execPath, 'run', PROBE, INSTANT],
        env: { ...process.env, TZ: timeZone },
        stdout: 'pipe',
        stderr: 'pipe',
    });
    if (run.exitCode !== 0) throw new Error(run.stderr.toString() || 'tz-probe failed');
    return JSON.parse(run.stdout.toString());
}

test('lessonWhen renders in the READER\'s zone, not the runner\'s UTC', () => {
    const stockholm = renderIn('Europe/Stockholm');
    // Guard the guard: if the child did not actually get the zone, the
    // assertion below would be comparing UTC against UTC and prove nothing.
    expect(stockholm.timeZone, 'the child process must really be in Stockholm')
        .toBe('Europe/Stockholm');

    // A lesson at 17:00Z is a 19:00 lesson to everyone who will read this app.
    // A hardcoded `timeZone: 'UTC'` anywhere under `lessonWhen` makes this
    // '17:00' — two hours early, every lesson, all summer.
    expect(stockholm.lessonWhen).toBe('Onsdag 22 juli · 19:00');

    // And the same instant genuinely reads differently elsewhere, which is what
    // makes the line above an observation of the zone rather than of the clock.
    expect(renderIn('UTC').lessonWhen).toBe('Onsdag 22 juli · 17:00');
});
