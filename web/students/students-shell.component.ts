import { Component, Computed, Router, template } from '@basics/core/client/core';
import { StudentsComponent } from './students.component';
import { StudentDetailComponent } from './student-detail.component';
import { ExerciseHistoryComponent } from './exercise-history.component';

const tpl = template(`<div bind="host"></div>`);

/**
 * Wraps the `/students` (list) and `/students/:id` (detail) routes behind
 * a single $swap entry. Derives a short key ('list' | 'detail') from the
 * current route so $swap's exact-match map works without any path-param
 * support in the framework router.
 */
export class StudentsShellComponent extends Component {
    private router = this.inject(Router);
    private key = new Computed(() => {
        const route = this.router.route.get();
        if (route === '/students') return 'list';
        if (/^\/students\/[^/]+\/exercises\/[^/]+\/history$/.test(route)) return 'history';
        return 'detail';
    });

    render(): DocumentFragment {
        const frag = this.wire(tpl, {});
        this.$swap(this.ref(frag, 'host'), this.key, {
            list: StudentsComponent,
            detail: StudentDetailComponent,
            history: ExerciseHistoryComponent,
        });
        return frag;
    }
}
