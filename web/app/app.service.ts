import { Signal } from '@basics/core/client/core';

export class AppService {
    /**
     * i18n KEY for the page name in the top bar, or null where the page has no
     * name to show. Written by the shell's title effect, read by the top bar.
     *
     * A key and not a resolved string — see `page-title.ts` for the full
     * reasoning. In short: this signal carries locale-independent data, so the
     * shell that writes it does not need to know what language anyone reads,
     * and resolution stays where every other string in the top bar is resolved.
     *
     * NOT because a resolved string would go stale. It would not: `effect()`
     * auto-tracks, so an upstream `t()` would subscribe the writing effect to
     * the locale signal and re-run on `setLocale`. That claim used to be here
     * and was wrong; it is called out rather than deleted because it is the
     * kind of plausible reasoning that gets re-invented.
     */
    readonly titleKey = new Signal<string | null>(null);
    /**
     * Whether the navigation drawer is open. Below 1024px the sidebar collapses
     * into a drawer whose trigger lives in the top bar, so the open state has to
     * be owned above both — see UI_DECISIONS.md 6.
     */
    readonly navOpen = new Signal(false);
}
