import { Component, Computed, Router, template } from '@basics/core/client/core';
import { StudentsComponent } from './students.component';
import { StudentDetailComponent } from './student-detail.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps the `/students` (list) and `/students/:id` (detail) routes behind
 * a single $swap entry. Derives a short key ('list' | 'detail') from the
 * current route so $swap's exact-match map works without any path-param
 * support in the framework router.
 */
export class StudentsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => this.router.route.get() === '/students' ? 'list' : 'detail');

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: StudentsComponent,
            detail: StudentDetailComponent,
        });
        return frag;
    }
}
