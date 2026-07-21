import { test, expect } from 'bun:test';
import { NAV_GROUPS } from '../web/app/nav.structure';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';

const groups = NAV_GROUPS;
const items = groups.flatMap(g => g.items);
const paths = items.map(i => i.path);

test('nav: four groups, in the order the IA specifies', () => {
    // Design system 4.1 caps the nav at four groups; the first is unlabelled.
    expect(groups.length).toBe(4);
    expect(groups.map(g => g.labelKey)).toEqual([
        undefined,
        'nav.group.training',
        'nav.group.planning',
        'nav.group.teaching',
    ]);
});

test('nav: each group holds exactly the destinations the IA assigns it', () => {
    expect(groups.map(g => g.items.map(i => i.path))).toEqual([
        ['/home', '/inbox'],
        ['/lektioner', '/traningspass'],
        ['/planer', '/mal', '/hastar'],
        ['/students', '/library'],
    ]);
});

test('nav: nine links, none duplicated', () => {
    expect(paths.length).toBe(9);
    expect(new Set(paths).size).toBe(9);
});

test('nav: Program and Inbjudningar are no longer nav destinations', () => {
    // INFORMATION_ARCHITECTURE.md 1: Program becomes a Bibliotek tab and
    // outgoing invitations become a section inside Mina elever — which now
    // carries both an `Inbjudna` list and a `Bjud in elev` action. Both routes
    // still resolve; this asserts only that they have left the navigation.
    expect(paths).not.toContain('/program');
    expect(paths).not.toContain('/invitations');
});

test('nav: Undervisning is present and ungated', () => {
    // UI_DECISIONS.md 1 overrides design system 4.1 here: the group renders for
    // every account. There is deliberately no capability predicate to gate on.
    const teaching = groups.find(g => g.labelKey === 'nav.group.teaching');
    expect(teaching).toBeDefined();
    expect(teaching!.items.map(i => i.key)).toEqual(['nav.students', 'nav.library']);
    for (const group of groups) {
        expect(Object.keys(group)).not.toContain('visible');
    }
});

test('nav: only Inkorg carries a badge', () => {
    expect(items.filter(i => i.badge).map(i => i.path)).toEqual(['/inbox']);
});

test('nav: every label and group label is translated in both catalogs', () => {
    const keys = [
        ...groups.flatMap(g => g.labelKey ? [g.labelKey] : []),
        ...items.map(i => i.key),
        'nav.label',
        'nav.openMenu',
    ];
    for (const key of keys) {
        expect(sv[key as keyof typeof sv], `sv is missing ${key}`).toBeDefined();
        expect(en[key as keyof typeof en], `en is missing ${key}`).toBeDefined();
    }
});

test('nav: Swedish group labels follow the spec wording', () => {
    expect(sv['nav.group.training']).toBe('Träning');
    expect(sv['nav.group.planning']).toBe('Planering & stall');
    expect(sv['nav.group.teaching']).toBe('Undervisning');
});
