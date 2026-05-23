import { Component, template } from '@basics/core/client/core';
import { s } from '../css';

const tpl = template(`
    <div class="home">
        <h1>Teacher-Student</h1>
        <p>Scaffolden ligger på plats. Funktionalitet läggs till feature-för-feature.</p>
    </div>
`);

export class HomeComponent extends Component {
    static styles = `
        .home {
            max-width: 640px;
            & h1 { margin: 0 0 ${s('md')}; }
            & p { margin: 0; opacity: 0.7; }
        }
    `;

    render(): DocumentFragment {
        return this.wire(tpl, {});
    }
}
