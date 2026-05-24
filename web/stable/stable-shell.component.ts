import { Component, Computed, Router, template } from '@basics/core/client/core';
import { StableComponent } from './stable.component';
import { HorseEditComponent } from './horse-edit.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/hastar` (list + create) and `/hastar/:id` (edit) behind a
 * single $swap entry. Derives a short key ('list' | 'edit') from the
 * current route so $swap's exact-match map works without router param
 * support.
 */
export class StableShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => this.router.route.get() === '/hastar' ? 'list' : 'edit');

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: StableComponent,
            edit: HorseEditComponent,
        });
        return frag;
    }
}
