import { test, expect } from 'bun:test';
import { setLocale } from '@basics/core/client/i18n';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';
import {
    dedupeRecipients,
    noteTimestamp,
    overflowItems,
    roleLabel,
    shareDescription,
    shareLabel,
    threadTitle,
    visibilityHint,
    type ShareRecipient,
} from '../web/ui/copy';

// Importing the app's i18n module is what registers the catalogs; the component
// modules themselves cannot be imported here because `web/theme.ts` writes a
// <style> at import time and there is no DOM in this process.
await import('../web/i18n');

const alva: ShareRecipient = { id: 't1', name: 'Alva' };
const bjorn: ShareRecipient = { id: 't2', name: 'Björn' };
const cecilia: ShareRecipient = { id: 't3', name: 'Cecilia' };

function withLocale<T>(locale: string, fn: () => T): T {
    setLocale(locale);
    try {
        return fn();
    } finally {
        setLocale('sv');
    }
}

test('share chip: private is the only unnamed state', () => {
    expect(withLocale('sv', () => shareLabel([]))).toBe('Privat');
    expect(withLocale('en', () => shareLabel([]))).toBe('Private');
});

test('share chip: a shared state always names its recipient', () => {
    // Design system 4.5 — "Delad = accenttonad med namngiven mottagare, aldrig
    // bara 'Delad'". This is the regression guard for the four sites that used
    // to render a bare 'Delad', 'Delad (2 lärare)' or 'Delad med läraren'.
    expect(withLocale('sv', () => shareLabel([alva]))).toBe('Delad: Alva');
    expect(withLocale('sv', () => shareLabel([alva, bjorn]))).toBe('Delad: Alva +1');
    expect(withLocale('sv', () => shareLabel([alva, bjorn, cecilia]))).toBe('Delad: Alva +2');
    expect(withLocale('en', () => shareLabel([alva, bjorn]))).toBe('Shared: Alva +1');
});

test('share chip: no shared label is ever the bare word', () => {
    const shared = [[alva], [alva, bjorn], [alva, bjorn, cecilia], []];
    for (const locale of ['sv', 'en']) {
        for (const recipients of shared) {
            const label = withLocale(locale, () => shareLabel(recipients, true));
            expect(label).not.toBe('Delad');
            expect(label).not.toBe('Shared');
            // A count is not a recipient (the old 'Delad (2 lärare)').
            expect(label).not.toMatch(/\(\d+\s/);
        }
    }
});

test('share chip: a shared object with no known name degrades loudly, not silently', () => {
    expect(withLocale('sv', () => shareLabel([], true))).toBe('Delad: okänd mottagare');
});

test('share chip: the +N form keeps every name reachable in the description', () => {
    expect(shareDescription([alva])).toBeUndefined();
    expect(shareDescription([], false)).toBeUndefined();
    expect(withLocale('sv', () => shareDescription([alva, bjorn, cecilia])))
        .toBe('Delad med Alva, Björn och Cecilia');
    expect(withLocale('en', () => shareDescription([alva, bjorn])))
        .toBe('Shared with Alva and Björn');
});

test('share chip: a blank name degrades loudly instead of rendering "Delad:"', () => {
    // A recipient with no usable display name used to slip past the
    // named-recipient rule and render a bare 'Delad:' with a dangling colon —
    // the forbidden unlabelled shared state, merely punctuated.
    const blank: ShareRecipient = { id: 'x', name: '' };
    const spaces: ShareRecipient = { id: 'y', name: '   ' };
    expect(withLocale('sv', () => shareLabel([blank]))).toBe('Delad: okänd mottagare');
    expect(withLocale('sv', () => shareLabel([spaces]))).toBe('Delad: okänd mottagare');
    expect(withLocale('en', () => shareLabel([blank]))).toBe('Shared: recipient unknown');
    // A nameable recipient is still named, and the count still covers the
    // whole audience including the one that cannot be named.
    expect(withLocale('sv', () => shareLabel([blank, alva]))).toBe('Delad: Alva +1');
});

test('share chip: blank names never leak into the description or the hint', () => {
    const blank: ShareRecipient = { id: 'x', name: '' };
    expect(withLocale('sv', () => shareDescription([blank, alva]))).toBeUndefined();
    expect(withLocale('sv', () => shareDescription([blank, alva, bjorn])))
        .toBe('Delad med Alva och Björn');
    // Nobody nameable is the same situation as nobody at all.
    expect(withLocale('sv', () => visibilityHint([blank], true)))
        .toBe('Du har ingen att dela med än — anteckningen blir privat.');
});

test('share chip: recipients de-duplicate by id, then by name', () => {
    expect(dedupeRecipients([alva, { id: 't1', name: 'Alva Lindgren' }])).toEqual([alva]);
    expect(dedupeRecipients([{ name: 'Alva' }, { name: 'Alva' }])).toEqual([{ name: 'Alva' }]);
    expect(dedupeRecipients([alva, bjorn]).length).toBe(2);
});

test('person marker: teacher and student both carry a role word', () => {
    expect(withLocale('sv', () => roleLabel('teacher'))).toBe('Lärare');
    expect(withLocale('sv', () => roleLabel('student'))).toBe('Elev');
    expect(withLocale('en', () => roleLabel('teacher'))).toBe('Teacher');
    expect(withLocale('en', () => roleLabel('student'))).toBe('Student');
});

test('note thread: the title carries the count once there is one', () => {
    expect(withLocale('sv', () => threadTitle(0))).toBe('Anteckningar');
    expect(withLocale('sv', () => threadTitle(1))).toBe('Anteckningar · 1');
    expect(withLocale('sv', () => threadTitle(2))).toBe('Anteckningar · 2');
    expect(withLocale('en', () => threadTitle(2))).toBe('Notes · 2');
});

test('note thread: the composer hint names who would read the note', () => {
    // Design system 4.5 / IA 1: visibility is stated at the point of writing,
    // and the shared branch is the one that must carry a name.
    expect(withLocale('sv', () => visibilityHint([alva], false)))
        .toBe('Bara du ser den här anteckningen.');
    expect(withLocale('sv', () => visibilityHint([alva], true)))
        .toBe('Alva ser anteckningen och kan svara.');
    expect(withLocale('sv', () => visibilityHint([alva, bjorn], true)))
        .toBe('Alva och Björn ser anteckningen och kan svara.');
    expect(withLocale('sv', () => visibilityHint([], true)))
        .toBe('Du har ingen att dela med än — anteckningen blir privat.');
});

test('note thread: timestamps go through the i18n date helpers', () => {
    const iso = new Date(2026, 6, 14, 19, 4).toISOString();
    expect(withLocale('sv', () => noteTimestamp(iso))).toBe('14 juli 19:04');
    expect(withLocale('en', () => noteTimestamp(iso))).toBe('July 14 at 07:04 PM');
});

test('detail header: secondary actions fold into the overflow below 640px', () => {
    // UI_DECISIONS 6. The primary action is deliberately absent from both
    // lists — it stays visible at every width.
    const secondary = ['Redigera'];
    const overflow = ['Ta bort'];
    expect(overflowItems(secondary, overflow, false)).toEqual(['Ta bort']);
    expect(overflowItems(secondary, overflow, true)).toEqual(['Redigera', 'Ta bort']);
});

test('i18n: every key these components read exists in both catalogs', () => {
    const keys = [
        'share.private', 'share.sharedWith', 'share.sharedWithMore.one',
        'share.sharedWithMore.other', 'share.sharedWithAll', 'share.sharedUnknown',
        'role.teacher', 'role.student',
        'notes.heading.zero', 'notes.heading.one', 'notes.heading.other',
        'notes.empty', 'notes.placeholder', 'notes.submit', 'notes.visibility',
        'notes.shareUnavailable', 'notes.hintPrivate', 'notes.hintShared',
        'notes.hintNoRecipients', 'notes.edit', 'notes.delete', 'notes.save',
        'notes.cancel', 'notes.deleteTitle', 'notes.deleteConsequence',
        'detail.moreActions',
        'objectKind.goal', 'objectKind.plan', 'objectKind.lesson',
        'objectKind.trainingSession', 'objectKind.exercise',
    ];
    // Object.hasOwn, not toHaveProperty: the catalogs are FLAT maps whose keys
    // contain dots, and toHaveProperty would read those dots as a path.
    for (const key of keys) {
        expect(Object.hasOwn(sv, key), `sv is missing ${key}`).toBe(true);
        expect(Object.hasOwn(en, key), `en is missing ${key}`).toBe(true);
    }
});
