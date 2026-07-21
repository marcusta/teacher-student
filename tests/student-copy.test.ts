import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import {
    ACTIVITY_LIMIT,
    DEFAULT_STUDENT_TAB,
    STUDENT_TABS,
    activeHorses,
    activePlans,
    activityKindLabel,
    activityLineState,
    activityRowKey,
    bookLessonHref,
    canRevoke,
    duplicateInviteMessage,
    goalCountLabel,
    historyHref,
    invitationRowKey,
    invitationSentLabel,
    invitationStatusPill,
    inviteEmailError,
    isConflict,
    isNotFound,
    latestSharedSession,
    lessonsWithStudent,
    nextLessonSummary,
    nextLessonWith,
    planCountLabel,
    recentActivity,
    relationContext,
    resolveTab,
    rosterState,
    sharedGoalCount,
    sharedGoals,
    sharedSessions,
    sortInvitations,
    sortStudents,
    studentRowKey,
    tabHref,
    tabLabel,
    type InvitationStatus,
    type StudentTab,
} from '../web/students/student-copy';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';

// Importing the app's i18n module is what registers the catalogs; the component
// modules cannot be imported here because `web/theme.ts` writes a <style> at
// import time and there is no DOM in this process. That is why the rules under
// test live in `student-copy.ts` rather than inside the components.
await import('../web/i18n');

// Swedish is the source of truth (UI_DECISIONS §4) and is what these assertions
// are written against. Registering the catalogs does not select a locale — that
// would otherwise come from the host environment, so the same assertions would
// pass or fail depending on whose machine ran them.
setLocale('sv');

// ─── Tabs (IA §3.4, design system §4.11) ────────────────────────

test('there are exactly seven tabs, in the IA order', () => {
    // §4.11 "Undvik: fler än sju flikar". This tuple is at the limit, so the
    // assertion is a budget as much as a spec: an eighth destination is a
    // design decision, not an addition.
    expect(STUDENT_TABS.length).toBe(7);
    expect([...STUDENT_TABS]).toEqual([
        'oversikt', 'lektioner', 'pass', 'planer', 'mal', 'hastar', 'historik',
    ]);
});

test('every tab has Swedish copy and no tab label is a raw key', () => {
    for (const tab of STUDENT_TABS) {
        const label = tabLabel(tab);
        expect(label.length).toBeGreaterThan(0);
        expect(label).not.toContain('student.tab.');
    }
    expect(tabLabel('oversikt')).toBe('Översikt');
    expect(tabLabel('pass')).toBe('Pass');
});

test('an unknown or absent ?flik= lands on Översikt rather than nowhere', () => {
    expect(resolveTab(undefined)).toBe(DEFAULT_STUDENT_TAB);
    expect(resolveTab('')).toBe('oversikt');
    expect(resolveTab('nonsense')).toBe('oversikt');
    expect(resolveTab('mal')).toBe('mal');
});

test('the default tab has the bare address; the others carry ?flik=', () => {
    expect(tabHref('s1', 'oversikt')).toBe('/students/s1');
    expect(tabHref('s1', 'historik')).toBe('/students/s1?flik=historik');
});

test('tab keys are URL vocabulary, so they never change with the locale', () => {
    setLocale('en');
    expect(resolveTab('mal')).toBe('mal');
    expect(tabHref('s1', 'mal')).toBe('/students/s1?flik=mal');
    setLocale('sv');
});

// ─── Roster ordering (IA §3.3) ──────────────────────────────────

test('the roster sorts by display name using Swedish collation', () => {
    // Å, Ä, Ö sort AFTER Z in Swedish. A code-point sort puts them there too by
    // accident, but it also puts 'ö' before 'Z' when case is mixed — which is
    // why this goes through localeCompare rather than a byte comparison. The
    // server orders by SQLite's binary collation, so the client is the only
    // place this can be got right at all.
    const sorted = sortStudents([
        { displayName: 'Örjan' },
        { displayName: 'Anna' },
        { displayName: 'Åsa' },
        { displayName: 'Zara' },
    ]);
    expect(sorted.map((s) => s.displayName)).toEqual(['Anna', 'Zara', 'Åsa', 'Örjan']);
});

test('sorting does not mutate the caller\'s array', () => {
    const input = [{ displayName: 'B' }, { displayName: 'A' }];
    sortStudents(input);
    expect(input.map((s) => s.displayName)).toEqual(['B', 'A']);
});

test('the row key changes when the next-lesson summary does', () => {
    const student = { id: 's1', email: 'a@b.se', displayName: 'Anna' };
    expect(studentRowKey(student, null)).not.toBe(studentRowKey(student, '2026-08-01T10:00:00.000Z'));
});

// ─── Lesson filtering is a privacy boundary ─────────────────────

function lesson(over: Partial<{
    id: string;
    studentId: string;
    role: 'teacher' | 'student';
    status: 'planned' | 'completed' | 'cancelled';
    scheduledAt: string;
}> = {}) {
    return {
        id: 'l1',
        studentId: 's1',
        role: 'teacher' as const,
        status: 'planned' as const,
        scheduledAt: '2026-08-01T10:00:00.000Z',
        ...over,
    };
}

test('a Lesson the reader ATTENDS is never shown inside a student workspace', () => {
    // `GET /lessons` returns everything the reader teaches OR attends. The same
    // person can be a Teacher in one Relation and a Student in another (IA §1),
    // so filtering on the student id alone would surface the reader's own
    // riding lessons in someone else's Elevvy.
    const mine = lesson({ id: 'teaching', role: 'teacher' });
    const theirs = lesson({ id: 'riding', role: 'student' });
    expect(lessonsWithStudent([mine, theirs], 's1').map((l) => l.id)).toEqual(['teaching']);
});

test('lessons for other students are excluded', () => {
    const a = lesson({ id: 'a', studentId: 's1' });
    const b = lesson({ id: 'b', studentId: 's2' });
    expect(lessonsWithStudent([a, b], 's1').map((l) => l.id)).toEqual(['a']);
});

test('the next lesson is the earliest planned one still ahead', () => {
    const now = '2026-07-19T00:00:00.000Z';
    const soon = lesson({ id: 'soon', scheduledAt: '2026-07-20T09:00:00.000Z' });
    const later = lesson({ id: 'later', scheduledAt: '2026-08-01T09:00:00.000Z' });
    const past = lesson({ id: 'past', scheduledAt: '2026-07-01T09:00:00.000Z' });
    expect(nextLessonWith([later, past, soon], 's1', now)?.id).toBe('soon');
});

test('a cancelled lesson is never "nästa lektion"', () => {
    const now = '2026-07-19T00:00:00.000Z';
    const cancelled = lesson({ id: 'x', status: 'cancelled', scheduledAt: '2026-07-20T09:00:00.000Z' });
    const planned = lesson({ id: 'y', scheduledAt: '2026-07-25T09:00:00.000Z' });
    expect(nextLessonWith([cancelled, planned], 's1', now)?.id).toBe('y');
    expect(nextLessonWith([cancelled], 's1', now)).toBeNull();
});

test('the row summary is omitted rather than negated when there is none', () => {
    // A roster of twelve students each announcing an absence is noise; §3.3
    // makes the summary optional for exactly that reason.
    expect(nextLessonSummary(null)).toBeNull();
    const summary = nextLessonSummary({ scheduledAt: '2026-07-22T17:00:00.000Z' });
    expect(summary).toContain('Nästa lektion');
    expect(summary).toContain('juli');
});

// ─── Invitations (IA §3.3) ──────────────────────────────────────

const ALL_STATUSES: InvitationStatus[] = ['pending', 'accepted', 'declined', 'revoked', 'expired'];

test('only a pending invitation may be revoked; the rest are read-only', () => {
    // Every non-pending status is terminal — `InvitationService.revoke` throws
    // `InvitationNotPendingError` for all four. LESSONS #4: withhold rather
    // than disable, so this predicate gates whether the button exists.
    expect(canRevoke('pending')).toBe(true);
    for (const status of ALL_STATUSES.filter((s) => s !== 'pending')) {
        expect(canRevoke(status)).toBe(false);
    }
});

test('every invitation status has a label, and the shape grammar is legible without colour', () => {
    for (const status of ALL_STATUSES) {
        const pill = invitationStatusPill(status);
        expect(pill.label().length).toBeGreaterThan(0);
        expect(pill.label()).not.toContain('invitations.status.');
    }
    // §4.4: outline = ongoing, filled = completed, dashed = ended otherwise.
    expect(invitationStatusPill('pending').variant).toBe('outline');
    expect(invitationStatusPill('accepted').variant).toBe('filled');
    for (const status of ['declined', 'revoked', 'expired'] as InvitationStatus[]) {
        expect(invitationStatusPill(status).variant).toBe('dashed');
        expect(invitationStatusPill(status).glyph).toBe('✕');
    }
});

// `expired` exists in `InvitationStatus` and the row carries `expires_at`, and
// the wire payload of `GET /invitations` really does ship `expiresAt` — but
// NOTHING in server/services ever writes the status: no sweeper, no cron, no
// comparison against the clock. IA §3.3 forbids promising it, so no catalog may
// contain a deadline, a countdown or a validity window in the invitation
// vocabulary.
//
// The term list is the whole test, so it is worth saying what it must survive.
// An earlier, shorter list caught `går ut om 30 dagar` but let through every
// one of `Utgången`, `Löper ut om en vecka`, `Slutar gälla snart`, `Gäller i 30
// dagar`, `Sista svarsdag` and `Svara innan 2026-08-01` — including, worst,
// `invitations.status.expired: "Utgången"`, which is the single likeliest way
// this rule gets broken, since it is the label for the status itself. Anything
// added here must be checked against BOTH catalogs before it lands.
const EXPIRY_PROMISES = [
    // Swedish
    'går ut', 'gäller till', 'gäller i', 'gäller t.o.m', 'giltig', 'upphör',
    'dagar kvar', 'förfaller', 'utgången', 'utgår', 'löper ut', 'slutar gälla',
    'sista svarsdag', 'svara innan', 'svara senast', 'automatiskt avslutad',
    'tidsgräns', 'deadline',
    // English — `en.json` is a translation, and a translator reaching for
    // "expired" is exactly how this rule would come back in the other catalog
    // while the Swedish one stayed clean.
    'expires', 'expiry', 'expiring', 'valid until', 'valid for', 'days left',
    'time left', 'lapses', 'no longer valid', 'respond by', 'reply by',
];

test('no invitation copy promises expiry behaviour, in either catalog', () => {
    for (const [locale, catalog] of [['sv', sv], ['en', en]] as const) {
        for (const [key, value] of Object.entries(catalog as Record<string, string>)) {
            if (!key.startsWith('invitations.') && !key.startsWith('invite.')) continue;
            for (const promise of EXPIRY_PROMISES) {
                expect(`${locale}/${key}: ${value.toLowerCase()}`).not.toContain(promise);
            }
        }
    }
    // The one place the status can surface says only that it ended.
    expect(sv['invitations.status.expired']).toBe('Avslutad');
    expect(en['invitations.status.expired']).toBe('Ended');
});

test('the expiry guard actually catches a violation', () => {
    // A guard nobody has seen fail is a guard nobody knows works. Each of these
    // is a phrasing that shipped past the original term list.
    const violations = [
        'Utgången',
        'Inbjudan löper ut om en vecka',
        'Gäller i 30 dagar',
        'Sista svarsdag 1 augusti',
        'Inbjudan slutar gälla snart',
        'Svara innan 2026-08-01',
        'Skickad i går · går ut om 30 dagar',
        'This invitation expires in 30 days',
        'Valid until 1 August',
    ];
    for (const violation of violations) {
        const caught = EXPIRY_PROMISES.some((p) => violation.toLowerCase().includes(p));
        expect(`${violation} -> caught: ${caught}`).toBe(`${violation} -> caught: true`);
    }
});

test('pending invitations lead, newest first inside each group', () => {
    const rows = [
        { id: 'old-pending', status: 'pending' as const, createdAt: '2026-07-01T00:00:00.000Z' },
        { id: 'new-revoked', status: 'revoked' as const, createdAt: '2026-07-18T00:00:00.000Z' },
        { id: 'new-pending', status: 'pending' as const, createdAt: '2026-07-17T00:00:00.000Z' },
        { id: 'old-accepted', status: 'accepted' as const, createdAt: '2026-06-01T00:00:00.000Z' },
    ];
    expect(sortInvitations(rows).map((r) => r.id)).toEqual([
        'new-pending', 'old-pending', 'new-revoked', 'old-accepted',
    ]);
});

test('the invitation row key changes when the status does', () => {
    const base = { id: 'i1', inviteeEmail: 'a@b.se', status: 'pending' as const, createdAt: 'x' };
    expect(invitationRowKey(base)).not.toBe(invitationRowKey({ ...base, status: 'revoked' }));
});

test('sent time is stated relatively and never as a deadline', () => {
    const now = new Date('2026-07-19T12:00:00.000Z');
    const label = invitationSentLabel('2026-07-18T19:32:00.000Z', now);
    expect(label.startsWith('Skickad ')).toBe(true);
    // UI_DECISIONS §4: the authored voice spells this with a space.
    expect(label).toContain('i går');
});

// ─── The invite form (IA §3.3) ──────────────────────────────────

test('invite validation names the fix, not the fault', () => {
    expect(inviteEmailError('')).toBe('Fyll i elevens e-postadress.');
    expect(inviteEmailError('   ')).toBe('Fyll i elevens e-postadress.');
    expect(inviteEmailError('anna')).toContain('@');
    expect(inviteEmailError('anna@example')).not.toBeNull();
    expect(inviteEmailError('anna@example.se')).toBeNull();
    expect(inviteEmailError('  anna@example.se  ')).toBeNull();
});

test('duplicate-pending is detected by code, never by message text', () => {
    // The server's ConflictError message is an English sentence written in
    // `InvitationService`; matching on it would break on rephrasing and would
    // never have worked in Swedish.
    expect(isConflict({ code: 'conflict' })).toBe(true);
    expect(isConflict({ code: 'validation' })).toBe(false);
    expect(isConflict({ code: 'server' })).toBe(false);
    expect(isConflict(null)).toBe(false);
    expect(isConflict(undefined)).toBe(false);
});

test('the duplicate message names the address it is about', () => {
    expect(duplicateInviteMessage('  anna@example.se ')).toContain('anna@example.se');
});

// ─── Page state: the two lists are independent (IA §3.3) ────────

test('a page with students is a roster, whatever the invitations did', () => {
    expect(rosterState({
        students: 2, invitations: 0, studentsResolved: true, invitationsResolved: false,
    })).toBe('roster');
});

test('nothing may be called empty until BOTH lists have answered', () => {
    // This is the guarantee that keeps one failure from erasing the other. A
    // failed invitations request reports `invitationsResolved: false`, so the
    // page cannot fall into the branded "you have nobody yet" state on the
    // strength of a request that never came back.
    expect(rosterState({
        students: 0, invitations: 0, studentsResolved: true, invitationsResolved: false,
    })).toBe('unknown');
    expect(rosterState({
        students: 0, invitations: 0, studentsResolved: false, invitationsResolved: true,
    })).toBe('unknown');
    expect(rosterState({
        students: 0, invitations: 0, studentsResolved: true, invitationsResolved: true,
    })).toBe('empty');
});

test('invitations without an accepted relation keep the list and explain the step', () => {
    expect(rosterState({
        students: 0, invitations: 3, studentsResolved: true, invitationsResolved: true,
    })).toBe('invitedOnly');
    expect(sv['students.invitedOnly.body'].length).toBeGreaterThan(0);
});

test('the branded empty state has exactly one action', () => {
    // §4.14 allows one. The catalog is where a second would show up first.
    expect(sv['students.empty.heading']).toBe('Ingen elev än');
    expect(sv['students.invite']).toBe('Bjud in elev');
});

// ─── Links out of Elevvy ────────────────────────────────────────

test('Boka lektion carries the student as context on the booking route', () => {
    expect(bookLessonHref('abc')).toBe('/lektioner/ny?elev=abc');
    expect(bookLessonHref('a b/c')).toBe('/lektioner/ny?elev=a%20b%2Fc');
});

test('Övningshistorik carries the way back to the tab it was opened from', () => {
    expect(historyHref('s1', 'e1', '/students/s1?flik=historik'))
        .toBe('/students/s1/exercises/e1/history?from=%2Fstudents%2Fs1%3Fflik%3Dhistorik');
});

test('the relation context names the reader\'s own side of the relation', () => {
    // IA §1: role is a fact about a Relation, not an account type.
    expect(relationContext('anna@example.se')).toBe('Du är lärare · anna@example.se');
});

// ─── Tab content filters ────────────────────────────────────────

test('an archived horse is not in the stable Elevvy shows', () => {
    const horses = [
        { id: 'h1', name: 'Caspian', archivedAt: null },
        { id: 'h2', name: 'Luna', archivedAt: '2026-01-01T00:00:00.000Z' },
    ];
    expect(activeHorses(horses).map((h) => h.name)).toEqual(['Caspian']);
});

test('an archived plan is not in the Planer tab', () => {
    const plans = [
        { id: 'p1', status: 'active' as const },
        { id: 'p2', status: 'archived' as const },
    ];
    expect(activePlans(plans).map((p) => p.id)).toEqual(['p1']);
});

// ─── PRIVACY: goals (IA §3.4) ───────────────────────────────────

function goal(over: Partial<{ id: string; title: string; status: 'active' | 'achieved' | 'abandoned'; targetDate: string | null }> = {}) {
    return {
        id: 'g1',
        title: 'Fungerande galoppombyten',
        status: 'active' as const,
        targetDate: null as string | null,
        ...over,
    };
}

test('the Mål tab shows exactly what the share-scoped endpoint returned', () => {
    // `GET /students/:id/goals` inner-joins `goal_share` on the calling
    // Teacher, so an unshared Goal is not in the payload at all — there is no
    // sharing field on `GoalTeacherView` to filter by, and that is the point.
    // This asserts the boundary is identity: nothing is added, and no other
    // source (a Plan's linkedGoals, in particular) may be mixed in.
    const shared = [goal({ id: 'a' }), goal({ id: 'b' })];
    expect(sharedGoals(shared).map((g) => g.id)).toEqual(['a', 'b']);
    expect(sharedGoals([])).toEqual([]);
});

test('the shared-goal count is the shared list\'s length and nothing else', () => {
    // A count is a disclosure. "2 av 7" would tell the Teacher that five Goals
    // exist which the Student chose not to share — IA §3.4 forbids exposing a
    // Goal's existence as firmly as it forbids exposing its title.
    const shared = [goal({ id: 'a' }), goal({ id: 'b' })];
    expect(sharedGoalCount(shared)).toBe(2);
    expect(sharedGoalCount(shared)).toBe(sharedGoals(shared).length);
    expect(sharedGoalCount([])).toBe(0);
});

test('the goal count copy states a plain number, with no total to compare against', () => {
    expect(goalCountLabel(0)).toBe('0 mål');
    expect(goalCountLabel(1)).toBe('1 mål');
    expect(goalCountLabel(3)).toBe('3 mål');
    expect(goalCountLabel(3)).not.toContain('av');
    expect(planCountLabel(1)).toBe('1 plan');
    expect(planCountLabel(2)).toBe('2 planer');
});

// ─── PRIVACY: training sessions (IA §3.4) ───────────────────────

test('shared sessions are ordered newest first and nothing is added', () => {
    const sessions = [
        { id: 'old', performedAt: '2026-07-01T10:00:00.000Z' },
        { id: 'new', performedAt: '2026-07-18T10:00:00.000Z' },
    ];
    expect(sharedSessions(sessions).map((s) => s.id)).toEqual(['new', 'old']);
    expect(latestSharedSession(sessions)?.id).toBe('new');
    expect(latestSharedSession([])).toBeNull();
});

// ─── Översikt activity (IA §3.4) ────────────────────────────────

test('recent activity merges both occasion kinds, newest first, and is capped', () => {
    const now = '2026-07-19T00:00:00.000Z';
    const lessons = Array.from({ length: 4 }, (_, i) => ({
        id: `l${i}`, scheduledAt: `2026-07-1${i}T10:00:00.000Z`, title: `Lektion ${i}`,
    }));
    const sessions = Array.from({ length: 4 }, (_, i) => ({
        id: `s${i}`, performedAt: `2026-07-1${i}T12:00:00.000Z`, title: `Pass ${i}`,
    }));
    const items = recentActivity(lessons, sessions, now);
    expect(items.length).toBe(ACTIVITY_LIMIT);
    expect(items[0]!.id).toBe('s3');
    expect(items[1]!.id).toBe('l3');
    const times = items.map((i) => i.at);
    expect([...times].sort().reverse()).toEqual(times);
});

test('a future lesson is not "recent activity"', () => {
    const now = '2026-07-19T00:00:00.000Z';
    const items = recentActivity(
        [{ id: 'later', scheduledAt: '2026-08-01T10:00:00.000Z', title: 'Framtida' }],
        [],
        now,
    );
    expect(items).toEqual([]);
});

test('activity rows link to the object they describe', () => {
    const now = '2026-07-19T00:00:00.000Z';
    const items = recentActivity(
        [{ id: 'l1', scheduledAt: '2026-07-10T10:00:00.000Z', title: 'A' }],
        [{ id: 's1', performedAt: '2026-07-11T10:00:00.000Z', title: 'B' }],
        now,
    );
    expect(items.find((i) => i.kind === 'lesson')?.href).toBe('/lektioner/l1');
    expect(items.find((i) => i.kind === 'session')?.href).toBe('/traningspass/s1');
    expect(activityKindLabel('lesson')).toBe('Lektion');
    expect(activityKindLabel('session')).toBe('Träningspass');
    expect(activityRowKey(items[0]!)).toContain(items[0]!.id);
});

test('the activity block never says "nothing happened" before its sources answer', () => {
    // REGRESSION. `recentActivity` is fed `lessons.data ?? []` and
    // `sessions.data ?? []`, so it returns [] while the requests are in flight
    // AND when they failed AND when the rider genuinely has no history. The
    // Översikt block rendered "Inget har hänt än." for all three, so a Teacher
    // whose lessons request had 500'd was told this rider had done nothing.
    // Verified in a browser against a fault-injecting proxy: both the hanging
    // and the 500 case printed the empty copy.

    // In flight — say nothing. The four cards already show "…".
    expect(activityLineState({ sourcesFailed: false, sourcesAnswered: false, count: 0 }))
        .toBe('silent');
    // One source failed — say so, even before the other has answered, and even
    // if the one that DID answer brought rows back.
    expect(activityLineState({ sourcesFailed: true, sourcesAnswered: false, count: 0 }))
        .toBe('unavailable');
    expect(activityLineState({ sourcesFailed: true, sourcesAnswered: true, count: 3 }))
        .toBe('unavailable');
    // Both answered, cleanly, with nothing — the only case that may claim it.
    expect(activityLineState({ sourcesFailed: false, sourcesAnswered: true, count: 0 }))
        .toBe('empty');
    // Rows to show — the list speaks, the line stays out of the way.
    expect(activityLineState({ sourcesFailed: false, sourcesAnswered: true, count: 1 }))
        .toBe('silent');
});

// ─── Not found (IA §3.4) ────────────────────────────────────────

test('only a 404 resolves as not-found; a failure is an error with a retry', () => {
    // The server answers 404 for a missing Student, a revoked Relation and
    // another teacher's student alike, so the client cannot distinguish them
    // either — and must not (IA §1). But telling a teacher their student is
    // gone because the network blinked is a different and worse lie.
    expect(isNotFound(404)).toBe(true);
    expect(isNotFound(500)).toBe(false);
    expect(isNotFound(401)).toBe(false);
    expect(isNotFound(undefined)).toBe(false);
});

// ─── Copy hygiene ───────────────────────────────────────────────

test('every key this view reads resolves to real Swedish copy', () => {
    const prefixes = ['students.', 'student.', 'invite.', 'invitations.'];
    const keys = Object.keys(sv).filter((k) => prefixes.some((p) => k.startsWith(p)));
    expect(keys.length).toBeGreaterThan(80);
    for (const key of keys) {
        expect((sv as Record<string, string>)[key]!.trim().length).toBeGreaterThan(0);
    }
});

test('the tab labels used by the component are the ones in the catalog', () => {
    const tabs: StudentTab[] = [...STUDENT_TABS];
    expect(tabs.map(tabLabel)).toEqual([
        'Översikt', 'Lektioner', 'Pass', 'Planer', 'Mål', 'Hästar', 'Historik',
    ]);
});
