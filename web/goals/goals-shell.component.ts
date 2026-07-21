import { Component, Computed, Router, template } from '@basics/core/client/core';
import { GoalsComponent } from './goals.component';
import { GoalCreateComponent } from './goal-create.component';
import { GoalDetailComponent } from './goal-detail.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps `/mal` (list), `/mal/nytt` (creation) and `/mal/:id` (detail + Notes)
 * behind a single $swap entry. Derives a short key from the current route so
 * $swap's exact-match map works without router param support. Mirrors
 * LessonsShellComponent and TrainingSessionsShellComponent.
 *
 * `nytt` is checked before the id branch, which is also why it is not a legal
 * Goal id — the creation route and the detail route share one path segment, and
 * the literal has to win.
 */
export class GoalsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => {
        const route = this.router.route.get();
        if (route === '/mal') return 'list';
        if (route === '/mal/nytt') return 'create';
        return 'detail';
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: GoalsComponent,
            create: GoalCreateComponent,
            detail: GoalDetailComponent,
        });
        return frag;
    }
}
