import { Component, Computed, Router, template } from '@basics/core/client/core';
import { PlansComponent } from './plans.component';
import { PlanDetailComponent } from './plan-detail.component';

const tpl = template(`<div bind="host"></div>`);

/** Wraps `/planer` list + create and `/planer/:id` detail. */
export class PlansShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() =>
        this.router.route.get() === '/planer' ? 'list' : 'detail',
    );

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: PlansComponent,
            detail: PlanDetailComponent,
        });
        return frag;
    }
}
