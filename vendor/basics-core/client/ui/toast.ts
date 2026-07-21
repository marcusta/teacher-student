import { Component, Signal } from '../core';

// ─── Types ──────────────────────────────────────────────────────

export type ToastVariant = 'info' | 'success' | 'error';

/** An optional single action, e.g. the design system's "Ångra" (undo). */
export type ToastAction = {
    label: string;
    onclick: () => void;
};

export type ToastOptions = {
    message: string;
    variant?: ToastVariant;
    /**
     * Milliseconds before auto-dismiss; 0 or less keeps the toast until it is
     * dismissed by hand. Defaults to 3000, or 8000 when an `action` is present
     * — an undoable toast has to stay long enough to actually be undone
     * (design system §4.12 shows an 8 s countdown).
     */
    duration?: number;
    action?: ToastAction;
};

export type ToastItem = {
    id: string;
    message: string;
    variant: ToastVariant;
    duration: number;
    action?: ToastAction;
};

// ─── ToastService ───────────────────────────────────────────────

let nextId = 1;

const DEFAULT_DURATION = 3000;
const DEFAULT_ACTION_DURATION = 8000;

export class ToastService {
    readonly items = new Signal<ToastItem[]>([]);
    private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

    show(opts: ToastOptions): void {
        const id = String(nextId++);
        const variant = opts.variant ?? 'info';
        const duration = opts.duration
            ?? (opts.action ? DEFAULT_ACTION_DURATION : DEFAULT_DURATION);

        const item: ToastItem = {
            id,
            message: opts.message,
            variant,
            duration,
            action: opts.action,
        };
        this.items.update(list => [...list, item]);

        if (duration > 0) {
            const timer = setTimeout(() => this.dismiss(id), duration);
            this.timers.set(id, timer);
        }
    }

    dismiss(id: string): void {
        const timer = this.timers.get(id);
        if (timer != null) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
        this.items.update(list => list.filter(t => t.id !== id));
    }
}

// ─── ToastContainer ─────────────────────────────────────────────

/** See tabs.ts for why this is a plain reference and not a fallback chain. */
const t = (name: string) => `var(--${name})`;

/**
 * The toast is the one surface that does NOT follow the theme.
 *
 * Design system §4.12: "Toasten är alltid charcoal — här bor det mörka
 * varumärket i ljust tema." It is charcoal in light theme and charcoal in
 * dark theme, so its colours cannot come from theme-dependent tokens — a
 * `var(--surface)` here renders white in light theme, which is the bug this
 * replaces. These are the design system's fixed charcoal values, stated as
 * literals precisely so nothing can invert them.
 */
const CHARCOAL = '#1C1F21';
const ON_CHARCOAL = '#F1ECE3';
const ON_CHARCOAL_MUTED = '#AFA698';
/**
 * Variant accents, also fixed: these are the design system's dark-theme
 * semantic hues, which are the ones legible against charcoal.
 */
const ACCENT_ON_CHARCOAL = '#CFAA81';
const SUCCESS_ON_CHARCOAL = '#8CC5A4';
const DANGER_ON_CHARCOAL = '#E39396';

export class ToastContainer extends Component {
    static styles = `
        .ui-toast-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        }
        .ui-toast {
            max-width: 360px;
            min-width: 240px;
            padding: 12px 16px;
            background: ${CHARCOAL};
            /*
             * The FILL stays charcoal in both themes (§4.12) — that rule is not
             * negotiable and is why it is a literal. Separation from the page is
             * a different problem, and in dark theme it was unsolved: charcoal
             * on a near-black page is 1.10:1, and the fixed hairline this
             * replaces only reached 1.48:1 against that page, so the toast read
             * as a smudge rather than a surface.
             *
             * The border and the elevation are therefore the two parts that DO
             * follow the theme: --border-strong is a mid-tone in every theme, so
             * it separates without ever inverting the toast, and --shadow-3
             * lifts it off the page at modal depth.
             *
             * The exact ratios are per-theme, since --border-strong is. Measured
             * against the dark page, where separation actually matters, the
             * worst case across the themes shipped here and in the apps is
             * 3.59:1 (teacher-student, #7A7059 on #131A20); the others run 4.9
             * to 5.5. On charcoal itself the border sits at 3.4–5.2:1. In light
             * theme the fill does the separating on its own at ~15:1, so the
             * border's ratio against the page is not load-bearing there.
             */
            border: 1px solid ${t('border-strong')};
            border-radius: ${t('radius-md')};
            box-shadow: ${t('shadow-3')};
            font-family: ${t('font-ui')};
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition:
                opacity ${t('dur-slow')} ${t('ease-standard')},
                transform ${t('dur-slow')} ${t('ease-standard')};
        }
        .ui-toast.ui-toast--visible {
            opacity: 1;
            transform: translateX(0);
        }
        /*
         * The surface stays charcoal for every variant — the spec describes one
         * toast treatment, not three. The variant survives only as a hairline
         * rule, so severity is still readable without splitting the surface.
         */
        .ui-toast--info {
            border-left: 3px solid ${ACCENT_ON_CHARCOAL};
        }
        .ui-toast--success {
            border-left: 3px solid ${SUCCESS_ON_CHARCOAL};
        }
        .ui-toast--error {
            border-left: 3px solid ${DANGER_ON_CHARCOAL};
        }
        .ui-toast__message {
            flex: 1;
            color: ${ON_CHARCOAL};
            font-size: 0.875rem;
            line-height: 1.4;
        }
        .ui-toast__action {
            background: none;
            border: none;
            padding: 0;
            flex-shrink: 0;
            font-family: inherit;
            font-size: 0.875rem;
            font-weight: 700;
            color: ${ACCENT_ON_CHARCOAL};
            cursor: pointer;
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        .ui-toast__action:focus-visible {
            outline: 2px solid ${ACCENT_ON_CHARCOAL};
            outline-offset: 2px;
        }
        .ui-toast__countdown {
            flex-shrink: 0;
            color: ${ON_CHARCOAL_MUTED};
            font-size: 0.75rem;
            font-variant-numeric: tabular-nums;
        }
        .ui-toast__close {
            background: none;
            border: none;
            color: ${ON_CHARCOAL_MUTED};
            cursor: pointer;
            padding: 0;
            font-size: 1rem;
            line-height: 1;
            flex-shrink: 0;
        }
        .ui-toast__close:hover {
            color: ${ON_CHARCOAL};
        }
    `;

    private svc!: ToastService;

    render(): HTMLElement {
        this.svc = this.inject(ToastService);

        const container = document.createElement('div');
        container.className = 'ui-toast-container';

        this.$each(
            container,
            this.svc.items,
            (item, _index, track) => {
                const el = document.createElement('div');
                el.className = `ui-toast ui-toast--${item.variant}`;

                const msg = document.createElement('span');
                msg.className = 'ui-toast__message';
                msg.textContent = item.message;
                el.appendChild(msg);

                if (item.action) {
                    const action = item.action;
                    const actionBtn = document.createElement('button');
                    actionBtn.className = 'ui-toast__action';
                    actionBtn.textContent = action.label;
                    actionBtn.addEventListener('click', () => {
                        action.onclick();
                        this.svc.dismiss(item.id);
                    });
                    el.appendChild(actionBtn);

                    // The countdown only earns its place next to an action: it
                    // says how long there is left to act. Without one it is
                    // just a ticking number.
                    if (item.duration > 0) {
                        const countdown = document.createElement('span');
                        countdown.className = 'ui-toast__countdown';
                        countdown.setAttribute('aria-hidden', 'true');

                        let remaining = Math.ceil(item.duration / 1000);
                        countdown.textContent = `${remaining} s`;

                        const tick = setInterval(() => {
                            remaining -= 1;
                            if (remaining <= 0) {
                                clearInterval(tick);
                                return;
                            }
                            countdown.textContent = `${remaining} s`;
                        }, 1000);
                        // $each disposes item scopes when the toast leaves.
                        track(() => clearInterval(tick));

                        el.appendChild(countdown);
                    }
                }

                const closeBtn = document.createElement('button');
                closeBtn.className = 'ui-toast__close';
                closeBtn.textContent = '\u00d7';
                closeBtn.setAttribute('aria-label', 'Dismiss');
                closeBtn.addEventListener('click', () => this.svc.dismiss(item.id));
                el.appendChild(closeBtn);

                // Trigger enter animation after the element is in the DOM
                requestAnimationFrame(() => {
                    el.classList.add('ui-toast--visible');
                });

                return el;
            },
            (item) => item.id,
        );

        return container;
    }
}
