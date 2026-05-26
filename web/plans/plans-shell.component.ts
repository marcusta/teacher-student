import { Component, template } from '@basics/core/client/core';
import { PlansComponent } from './plans.component';

const tpl = template(`<div bind="host"></div>`);

/** Wraps `/planer` list + create. Detail route added in slice 038. */
export class PlansShellComponent extends Component {
    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.spawn(PlansComponent, this.ref(frag, 'host'));
        return frag;
    }
}
