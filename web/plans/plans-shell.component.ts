import { Component, Computed, Router, template } from '@basics/core/client/core';
import { PlansComponent } from './plans.component';
import { PlanCreateComponent } from './plan-create.component';
import { PlanDetailComponent } from './plan-detail.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/planer` (list), `/planer/ny` (creation) and `/planer/:id` (detail)
 * behind a single $swap entry. Derives a short key from the current route so
 * $swap's exact-match map works without router param support. Mirrors
 * LessonsShellComponent and TrainingSessionsShellComponent.
 *
 * `ny` is checked before the id branch, which is also why it is not a legal
 * Plan id — the creation route and the detail route share one path segment, and
 * the literal has to win.
 */
export class PlansShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => {
        const route = this.router.route.get();
        if (route === '/planer') return 'list';
        if (route === '/planer/ny') return 'create';
        return 'detail';
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: PlansComponent,
            create: PlanCreateComponent,
            detail: PlanDetailComponent,
        });
        return frag;
    }
}
