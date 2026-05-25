import { Component, Computed, Router, template } from '@basics/core/client/core';
import { TrainingSessionsComponent } from './training-sessions.component';
import { TrainingSessionDetailComponent } from './training-session-detail.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/traningspass` (list + create) and `/traningspass/:id` (detail +
 * Notes) behind a single $swap entry. Mirrors LessonsShellComponent.
 */
export class TrainingSessionsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => this.router.route.get() === '/traningspass' ? 'list' : 'detail');

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: TrainingSessionsComponent,
            detail: TrainingSessionDetailComponent,
        });
        return frag;
    }
}
