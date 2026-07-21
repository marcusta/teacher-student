import { Component, Computed, Router, template } from '@basics/core/client/core';
import { ProgramCreateComponent } from './program-create.component';
import { ProgramDetailComponent } from './program-detail.component';
import { PROGRAM_LIST_REDIRECT } from '../library/library-copy';

const tpl = template(`<div bind="host"></div>`);
const emptyTpl = template(`<div></div>`);

/**
 * The bare `/program` list address, forwarded to the Bibliotek tab that replaced
 * it (IA §3.6: Programs are the second tab of Bibliotek).
 *
 * A component rather than an effect in the shell, because $swap picks a branch
 * before any redirect could run: routing `/program` at the builder and letting a
 * redirect catch up would mount `ProgramDetailComponent` with an empty id, fire
 * `GET /programs/` and flash a not-found state on the way out. This branch
 * renders nothing and navigates instead.
 *
 * That reasoning is right but was not sufficient on its own. The navigate here
 * runs re-entrantly, inside the app-level `$swap` effect that just mounted this
 * component — so the shell's own key is recomputed for `/library` before the
 * app-level swap disposes the shell. While the detail branch was an `else`
 * fall-through, that recomputation landed on `detail` and built the empty-id
 * builder anyway, one step later than the design anticipated. Asserted by
 * construction count in `tests/program-forward.dom.test.ts`; see
 * `NoRouteComponent` for the other half of the fix.
 *
 * `replace`, not push: a bookmark to the old address must not leave a history
 * entry that bounces the Back button straight back here.
 */
class ProgramListRedirectComponent extends Component {
    private router = this.inject(Router);

    onMount(): void {
        this.router.navigate(PROGRAM_LIST_REDIRECT, { replace: true });
    }

    render(): DocumentFragment {
        return this.wire(emptyTpl, {});
    }
}

/**
 * The branch for a route this shell does not own.
 *
 * Needed because the shell's key is recomputed from the SAME `route` signal
 * that tears the shell down, and the two are not ordered: navigating away runs
 * this key one more time before the disposal lands. Without an explicit branch,
 * an `else → detail` fall-through builds `ProgramDetailComponent` with
 * `route.split('/')[2] === undefined` on the way out — which is precisely the
 * empty-id builder and the `GET /programs/` flash the forward exists to avoid.
 * It renders nothing and asks for nothing.
 */
class NoRouteComponent extends Component {
    render(): DocumentFragment {
        return this.wire(emptyTpl, {});
    }
}

/**
 * Wraps `/program` (forward to Bibliotek), `/program/nytt` (creation) and
 * `/program/:id` (the builder) behind a single $swap entry.
 *
 * **Both `/library` and `/program` keep resolving.** §3.6 calls merging Programs
 * under Bibliotek "frontend navigation" that "does not require route migration",
 * so nothing about the Program routes changed except where the *list* now lives.
 * `/program/nytt` and `/program/:id` are untouched — every link and bookmark to
 * a specific Program still lands exactly where it did.
 *
 * `nytt` is checked before the id branch, which is also why it is not a legal
 * Program id — the creation route and the builder route share one path segment,
 * and the literal has to win.
 */
export class ProgramsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => {
        const route = this.router.route.get();
        if (route === '/program') return 'forward';
        if (route === '/program/nytt') return 'create';
        // Positively matched, never a fall-through: this key is recomputed on
        // the way OUT of the shell too, and `detail` must not be the answer for
        // `/library` — see `NoRouteComponent`.
        if (route.startsWith('/program/')) return 'detail';
        return 'none';
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            forward: ProgramListRedirectComponent,
            create: ProgramCreateComponent,
            detail: ProgramDetailComponent,
            none: NoRouteComponent,
        });
        return frag;
    }
}
