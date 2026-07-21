import { Component, Computed, Router, template } from '@basics/core/client/core';
import { LibraryComponent } from './library.component';
import { ExerciseCreateComponent } from './exercise-create.component';
import { ExerciseDetailComponent } from './exercise-detail.component';

const tpl = template(`<div bind="host"></div>`);
const emptyTpl = template(`<div></div>`);

/**
 * The branch for a route this shell does not own.
 *
 * The shell's key is recomputed from the same `route` signal that tears the
 * shell down, and the two are not ordered — navigating away runs the key once
 * more before disposal lands. An `else → detail` fall-through would therefore
 * build `ExerciseDetailComponent` with `route.split('/')[2] === undefined` on
 * the way out and fire `GET /exercises/` for an empty id. This renders nothing
 * and asks for nothing.
 */
class NoRouteComponent extends Component {
    render(): DocumentFragment {
        return this.wire(emptyTpl, {});
    }
}

/**
 * Wraps `/library` (the tabbed Bibliotek destination), `/library/nytt`
 * (creation) and `/library/:id` (Exercise detail) behind a single $swap entry.
 * Derives a short key from the current route so $swap's exact-match map works
 * without router param support. Mirrors `GoalsShellComponent`.
 *
 * `nytt` is checked before the id branch, which is also why it is not a legal
 * Exercise id — the creation route and the detail route share one path segment,
 * and the literal has to win.
 */
export class LibraryShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => {
        const route = this.router.route.get();
        if (route === '/library') return 'bibliotek';
        if (route === '/library/nytt') return 'create';
        // Positively matched, never a fall-through — see `NoRouteComponent`.
        if (route.startsWith('/library/')) return 'detail';
        return 'none';
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            bibliotek: LibraryComponent,
            create: ExerciseCreateComponent,
            detail: ExerciseDetailComponent,
            none: NoRouteComponent,
        });
        return frag;
    }
}
