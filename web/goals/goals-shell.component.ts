import { Component, Computed, Router, template } from '@basics/core/client/core';
import { GoalsComponent } from './goals.component';
import { GoalDetailComponent } from './goal-detail.component';

const tpl = template(`<div bind="host"></div>`);

/** Wraps `/mal` list + create and `/mal/:id` detail. */
export class GoalsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() =>
        this.router.route.get() === '/mal' ? 'list' : 'detail',
    );

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: GoalsComponent,
            detail: GoalDetailComponent,
        });
        return frag;
    }
}
