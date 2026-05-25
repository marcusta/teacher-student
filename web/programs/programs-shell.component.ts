import { Component, Computed, Router, template } from '@basics/core/client/core';
import { ProgramsComponent } from './programs.component';
import { ProgramEditComponent } from './program-edit.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/program` (list + create) and `/program/:id` (edit) behind a
 * single $swap entry. Derives a short key ('list' | 'edit') from the
 * current route so $swap's exact-match map works without router param
 * support. Mirrors LibraryShellComponent.
 */
export class ProgramsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => this.router.route.get() === '/program' ? 'list' : 'edit');

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: ProgramsComponent,
            edit: ProgramEditComponent,
        });
        return frag;
    }
}
