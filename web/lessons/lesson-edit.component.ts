import { Component, Router, Signal, effect, template } from '@basics/core/client/core';
import { t } from '../theme';
import { s, btn, input } from '../css';
import { api, type Horse, type LessonForUser } from '../api';
import { LessonsService } from './lessons.service';

const tpl = template(`
    <div class="lesson-edit" bind="root">
        <a bind="back" href="/lektioner" class="lesson-edit__back">← Tillbaka</a>
        <h2>Redigera lektion</h2>
        <div bind="missing" class="lesson-edit__missing">Lektionen kunde inte hittas.</div>
        <form bind="form" class="lesson-edit__form">
            <label>
                <span>Häst</span>
                <select bind="horseSelect"></select>
            </label>
            <label>
                <span>Tidpunkt</span>
                <input bind="whenInput" type="datetime-local" required>
            </label>
            <div class="lesson-edit__row">
                <button bind="submit" type="submit">Spara</button>
                <div class="error" bind="error"></div>
            </div>
        </form>
    </div>
`);

function toLocalInput(iso: string): string {
    // Convert ISO UTC to "YYYY-MM-DDTHH:mm" in the user's local zone for
    // <input type="datetime-local">.
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
    return new Date(value).toISOString();
}

export class LessonEditComponent extends Component {
    static styles = `
        .lesson-edit {
            max-width: 720px;

            & .lesson-edit__back {
                display: inline-block;
                margin-bottom: ${s('md')};
                color: ${t('text')};
                opacity: 0.7;
                text-decoration: none;
                font-size: 0.875rem;
                &:hover { opacity: 1; }
            }

            & h2 { margin: 0 0 ${s('lg')}; }

            & .lesson-edit__form {
                display: flex;
                flex-direction: column;
                gap: ${s('md')};

                & label {
                    display: flex;
                    flex-direction: column;
                    gap: ${s('xs')};
                    font-size: 0.875rem;
                }

                & select, & input {
                    ${input()}
                    width: 100%;
                    box-sizing: border-box;
                }
            }

            & .lesson-edit__row {
                display: flex;
                align-items: center;
                gap: ${s('md')};
                & button { ${btn()} }
            }

            & .error {
                color: ${t('error')};
                font-size: 0.875rem;
                min-height: 1em;
            }

            & .lesson-edit__missing {
                display: none;
                padding: ${s('md')};
                color: ${t('error')};
            }
            &.missing .lesson-edit__missing { display: block; }
            &.missing .lesson-edit__form { display: none; }
        }
    `;

    private router = this.inject(Router);
    private svc = this.inject(LessonsService);
    private horseVal = new Signal('');
    private whenVal = new Signal('');
    private horses = new Signal<Horse[]>([]);
    private resolved = new Signal(false);
    private found = new Signal(true);

    onMount(): void {
        const id = this.router.route.get().split('/')[2] ?? '';
        // Ensure list is loaded so .get() can resolve.
        const ready = this.svc.items.get().length > 0
            ? Promise.resolve()
            : this.svc.load();
        void ready.then(async () => {
            const lesson = this.svc.get(id);
            if (!lesson) {
                this.found.set(false);
                this.resolved.set(true);
                return;
            }
            if (lesson.role !== 'teacher') {
                // Students get the read-only timeline; deny edit access.
                this.found.set(false);
                this.resolved.set(true);
                return;
            }
            this.horseVal.set(lesson.horseId ?? '');
            this.whenVal.set(toLocalInput(lesson.scheduledAt));
            const horses = await api.students.listHorses({ id: lesson.studentId });
            this.horses.set(horses);
            this.found.set(true);
            this.resolved.set(true);
        });
    }

    render(): DocumentFragment {
        const frag = this.wire(tpl, {
            root: {
                className: () => this.resolved.get() && !this.found.get()
                    ? 'lesson-edit missing' : 'lesson-edit',
            },
            back: this.router.link('/lektioner'),
            horseSelect: {
                value: () => this.horseVal.get(),
                onchange: (e: Event) => this.horseVal.set((e.target as HTMLSelectElement).value),
            },
            whenInput: {
                value: () => this.whenVal.get(),
                oninput: (e: Event) => this.whenVal.set((e.target as HTMLInputElement).value),
            },
            form: {
                onsubmit: async (e: Event) => {
                    e.preventDefault();
                    const id = this.router.route.get().split('/')[2] ?? '';
                    const lesson = this.svc.get(id);
                    if (!lesson) return;
                    const horseId = this.horseVal.get();
                    const when = this.whenVal.get();
                    const patch: { horseId?: string | null; scheduledAt?: string } = {};
                    if (horseId !== (lesson.horseId ?? '')) {
                        patch.horseId = horseId === '' ? null : horseId;
                    }
                    if (when) {
                        const iso = fromLocalInput(when);
                        if (iso !== lesson.scheduledAt) patch.scheduledAt = iso;
                    }
                    if (Object.keys(patch).length === 0) {
                        this.router.navigate('/lektioner');
                        return;
                    }
                    const updated = await this.svc.update(id, patch);
                    if (updated) this.router.navigate('/lektioner');
                },
            },
            error: { textContent: () => this.svc.error.get()?.message ?? '' },
        });

        // Populate horse <select> from the loaded list with a clear option.
        const select = this.ref(frag, 'horseSelect') as HTMLSelectElement;
        const renderOptions = () => {
            select.replaceChildren();
            const none = document.createElement('option');
            none.value = '';
            none.textContent = '(ingen häst)';
            select.appendChild(none);
            for (const h of this.horses.get()) {
                const opt = document.createElement('option');
                opt.value = h.id;
                opt.textContent = h.name;
                select.appendChild(opt);
            }
            select.value = this.horseVal.get();
        };
        // The framework's $each is keyed against a Signal; for a one-shot
        // resolve we just re-render whenever horses change.
        this.track(effect(() => {
            this.horses.get();
            this.horseVal.get();
            renderOptions();
        }));

        return frag;
    }
}
