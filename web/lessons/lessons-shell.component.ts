import { Component, Computed, Router, template } from '@basics/core/client/core';
import { LessonsComponent } from './lessons.component';
import { LessonCreateComponent } from './lesson-create.component';
import { LessonDetailComponent } from './lesson-detail.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/lektioner` (list), `/lektioner/ny` (booking) and `/lektioner/:id`
 * (detail) behind a single $swap entry. Derives a short key from the current
 * route so $swap's exact-match map works without router param support.
 *
 * `ny` is checked before the id branch, which is also why it is not a legal
 * Lesson id — the booking route and the detail route share one path segment,
 * and the literal has to win.
 */
export class LessonsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => {
        const route = this.router.route.get();
        if (route === '/lektioner') return 'list';
        if (route === '/lektioner/ny') return 'create';
        return 'detail';
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: LessonsComponent,
            create: LessonCreateComponent,
            detail: LessonDetailComponent,
        });
        return frag;
    }
}
