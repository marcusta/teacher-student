import { Component, Computed, Router, template } from '@basics/core/client/core';
import { LibraryComponent } from './library.component';
import { ExerciseEditComponent } from './exercise-edit.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/library` (list + create) and `/library/:id` (edit) behind a
 * single $swap entry. Derives a short key ('list' | 'edit') from the
 * current route so $swap's exact-match map works without router param
 * support.
 */
export class LibraryShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => this.router.route.get() === '/library' ? 'list' : 'edit');

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: LibraryComponent,
            edit: ExerciseEditComponent,
        });
        return frag;
    }
}
