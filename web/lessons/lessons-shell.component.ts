import { Component, Computed, Router, template } from '@basics/core/client/core';
import { LessonsComponent } from './lessons.component';
import { LessonEditComponent } from './lesson-edit.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/lektioner` (list + create) and `/lektioner/:id` (edit) behind a
 * single $swap entry. Derives a short key ('list' | 'edit') from the
 * current route so $swap's exact-match map works without router param
 * support.
 */
export class LessonsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => this.router.route.get() === '/lektioner' ? 'list' : 'edit');

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: LessonsComponent,
            edit: LessonEditComponent,
        });
        return frag;
    }
}
