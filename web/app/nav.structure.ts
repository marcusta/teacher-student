/**
 * The navigation structure — design system 4.1, INFORMATION_ARCHITECTURE.md 1.
 *
 * Kept in its own module, free of DOM and of framework imports, so the
 * information architecture can be asserted directly in tests: `nav.component.ts`
 * calls `template()` at module scope and therefore only loads in a browser.
 */

export type NavItem = {
    path: string;
    /** i18n key for the visible label. */
    key: string;
    /** Renders the inbox pending-count badge after the label. */
    badge?: 'inbox';
};

export type NavGroup = {
    /** i18n key for the letterspaced uppercase group label. Absent = unlabelled top group. */
    labelKey?: string;
    items: NavItem[];
};

/**
 * Four groups, at most: the spec forbids more.
 *
 * Two destinations of the old flat nav are deliberately absent: `/invitations`
 * becomes a section inside `Mina elever`, and `/program` becomes a tab inside
 * `Bibliotek`. Both routes still resolve; only the nav entries are gone.
 *
 * `Undervisning` is NOT capability-gated. Design system 4.1 says it should be;
 * UI_DECISIONS.md 1 overrides that and explains why — role is contextual, so
 * gating the group hides the feature from exactly the accounts that need to
 * discover it. Empty states teach it instead.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
    {
        items: [
            { path: '/home', key: 'nav.home' },
            { path: '/inbox', key: 'nav.inbox', badge: 'inbox' },
        ],
    },
    {
        labelKey: 'nav.group.training',
        items: [
            { path: '/lektioner', key: 'nav.lessons' },
            { path: '/traningspass', key: 'nav.trainingSessions' },
        ],
    },
    {
        labelKey: 'nav.group.planning',
        items: [
            { path: '/planer', key: 'nav.plans' },
            { path: '/mal', key: 'nav.goals' },
            { path: '/hastar', key: 'nav.stable' },
        ],
    },
    {
        labelKey: 'nav.group.teaching',
        items: [
            { path: '/students', key: 'nav.students' },
            { path: '/library', key: 'nav.library' },
        ],
    },
];
