import { Component, Computed, Router, template } from '@basics/core/client/core';
import { TrainingSessionsComponent } from './training-sessions.component';
import { TrainingSessionCreateComponent } from './training-session-create.component';
import { TrainingSessionDetailComponent } from './training-session-detail.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/traningspass` (list), `/traningspass/ny` (logging) and
 * `/traningspass/:id` (detail + Notes) behind a single $swap entry. Derives a
 * short key from the current route so $swap's exact-match map works without
 * router param support. Mirrors LessonsShellComponent.
 *
 * `ny` is checked before the id branch, which is also why it is not a legal
 * Training Session id — the logging route and the detail route share one path
 * segment, and the literal has to win.
 */
export class TrainingSessionsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => {
        const route = this.router.route.get();
        if (route === '/traningspass') return 'list';
        if (route === '/traningspass/ny') return 'create';
        return 'detail';
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: TrainingSessionsComponent,
            create: TrainingSessionCreateComponent,
            detail: TrainingSessionDetailComponent,
        });
        return frag;
    }
}
