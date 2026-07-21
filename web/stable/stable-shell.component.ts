import { Component, Computed, Router, template } from '@basics/core/client/core';
import { StableComponent } from './stable.component';
import { HorseCreateComponent } from './horse-create.component';
import { HorseEditComponent } from './horse-edit.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/hastar` (list), `/hastar/nytt` (creation) and `/hastar/:id` (detail)
 * behind a single $swap entry. Derives a short key from the current route so
 * $swap's exact-match map works without router param support. Mirrors
 * `GoalsShellComponent`.
 *
 * `nytt` is checked before the id branch, which is also why it is not a legal
 * Horse id — the creation route and the detail route share one path segment, and
 * the literal has to win.
 */
export class StableShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => {
        const route = this.router.route.get();
        if (route === '/hastar') return 'list';
        if (route === '/hastar/nytt') return 'create';
        return 'detail';
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: StableComponent,
            create: HorseCreateComponent,
            detail: HorseEditComponent,
        });
        return frag;
    }
}
