import { formatDate, getLocale, plural, t } from '../i18n';

/**
 * Copy and derivation rules for the domain UI components in this folder.
 *
 * Kept apart from the components on purpose: every function here is pure, and
 * this module imports nothing that touches `document`. The component modules
 * pull in `../theme`, whose `createTokens()` writes a `<style>` at import time,
 * so they cannot be loaded in a DOM-less test process. These rules are the part
 * worth asserting — what the trust surface actually SAYS — so they live where
 * `bun test` can reach them.
 */

export interface ShareRecipient {
    /** Stable id where the caller has one. Used only for de-duplication. */
    id?: string;
    /** Display name. Rendered verbatim — sharing is never anonymous. */
    name: string;
}

/** Contextual role in one relation, not a global account type (IA §1). */
export type PersonRole = 'teacher' | 'student';

/** De-duplicate by id where present, by name otherwise. */
export function dedupeRecipients(recipients: ShareRecipient[]): ShareRecipient[] {
    const seen = new Set<string>();
    return recipients.filter((r) => {
        const key = r.id ?? `name:${r.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * The recipients this UI can actually NAME.
 *
 * A recipient whose display name is blank cannot be named, and §4.5's whole
 * point is that a shared state is never anonymous — rendering `Delad: ` with a
 * dangling colon is the bare "Delad" the spec forbids, just punctuated. So a
 * blank name is treated as no name at all: the label degrades to the explicit
 * `Delad: okänd mottagare`, and the composer refuses to offer sharing rather
 * than offering it to someone it cannot identify.
 */
export function namedRecipients(recipients: ShareRecipient[]): ShareRecipient[] {
    return dedupeRecipients(recipients).filter((r) => r.name.trim().length > 0);
}

/**
 * 'Alva, Björn och Cecilia'. Intl.ListFormat rather than a catalogued
 * separator: joining a list is a grammar rule, and grammar rules do not belong
 * in a string table.
 */
export function joinNames(recipients: ShareRecipient[]): string {
    return new Intl.ListFormat(getLocale(), { style: 'long', type: 'conjunction' })
        .format(namedRecipients(recipients).map((r) => r.name));
}

/**
 * The sharing chip's copy — design system §4.5.
 *
 * `Privat` · `Delad: Alva` · `Delad: Alva +1`. Note that no branch can return a
 * bare "Delad": a shared state either names someone or says outright that the
 * recipient is unknown. That is the §4.5 rule, expressed as code rather than as
 * a review comment.
 *
 * The +N form goes through `plural()` because "+1" and "+2" happen to be one
 * grammatical choice in Swedish and English, but that is a fact about these two
 * locales, not about the string.
 */
export function shareLabel(recipients: ShareRecipient[], shared = recipients.length > 0): string {
    if (!shared) return t('share.private');
    const all = dedupeRecipients(recipients);
    // Name the first recipient we CAN name; the +N count still covers the whole
    // audience, so an unnameable member is hidden behind the count, never
    // rendered as an empty name.
    const first = all.find((r) => r.name.trim().length > 0);
    if (!first) return t('share.sharedUnknown');
    const others = all.length - 1;
    return others === 0
        ? t('share.sharedWith', { name: first.name })
        : plural('share.sharedWithMore', others, { name: first.name });
}

/**
 * Full recipient list for `title` / `aria-label`, so a name hidden behind "+1"
 * is still reachable. Undefined when the visible label already says everything.
 */
export function shareDescription(
    recipients: ShareRecipient[],
    shared = recipients.length > 0,
): string | undefined {
    if (!shared) return undefined;
    const named = namedRecipients(recipients);
    if (named.length < 2) return undefined;
    return t('share.sharedWithAll', { names: joinNames(named) });
}

/** Role tag copy — design system §4.6. */
export function roleLabel(role: PersonRole): string {
    return role === 'teacher' ? t('role.teacher') : t('role.student');
}

/** Thread title, e.g. `Anteckningar · 2`. */
export function threadTitle(count: number): string {
    return plural('notes.heading', count);
}

/**
 * The composer's footer hint — design system §4.5, IA §1.
 *
 * States the consequence of the current visibility choice in terms of a named
 * person. This sentence is what makes the control a trust surface rather than a
 * toggle: the writer learns who will read them BEFORE they write, not after.
 */
export function visibilityHint(recipients: ShareRecipient[], shared: boolean): string {
    // Nobody nameable is the same situation as nobody at all: there is no
    // audience this sentence could honestly state.
    if (namedRecipients(recipients).length === 0) return t('notes.hintNoRecipients');
    if (!shared) return t('notes.hintPrivate');
    return t('notes.hintShared', { names: joinNames(recipients) });
}

/** '14 juli 19:04' — the §4.7 entry timestamp, via the i18n date helpers. */
export function noteTimestamp(iso: string): string {
    return formatDate(iso, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

/** UI_DECISIONS §6: `sm` is everything below 640px. */
export const NARROW_QUERY = '(max-width: 639px)';

/**
 * What the detail header's ⋯ menu holds at a given width (UI_DECISIONS §6):
 * below 640px the secondary actions fold in beside the always-overflowed ones;
 * above it, only the always-overflowed ones. The single primary action is never
 * in this list — it stays visible at every width.
 */
export function overflowItems<T>(secondary: T[], overflow: T[], narrow: boolean): T[] {
    return narrow ? [...secondary, ...overflow] : [...overflow];
}
