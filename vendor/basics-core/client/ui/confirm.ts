import { Component, Signal, effect } from '../core';
import { OverlayComponent } from './overlay';

export type ConfirmProps = {
    open: Signal<boolean>;
    /**
     * The question. Accepts `() => t('…')` so it follows the active locale.
     *
     * Reactive does NOT mean "move the specifics here". The split with
     * `message` below is editorial, not technical: the title asks, the message
     * states what becomes true. Call sites that keep the per-object detail in
     * `message` were right on the merits and stay right — they simply no longer
     * have a second, mechanical reason to.
     */
    title?: string | (() => string);
    /**
     * State the CONSEQUENCE, not "are you sure" — the design system §4.12
     * explicitly rejects a bare confirmation ("Undvik: ... 'Är du säker?' utan
     * konsekvensbeskrivning"). `message` is required and separate from `title`
     * for exactly this reason: the title asks, the message says what becomes
     * true. e.g. title "Markera lektionen som utförd?" with message "Statusen
     * är slutgiltig och går inte att ändra i efterhand."
     *
     * Reserve the dialog for terminal changes. Anything reversible gets an
     * undo toast instead (see `ToastOptions.action`).
     */
    message: string | (() => string);
    /** Confirm button copy. `() => t('…')` to follow the active locale. */
    confirmLabel?: string | (() => string);
    /** Cancel button copy. `() => t('…')` to follow the active locale. */
    cancelLabel?: string | (() => string);
    danger?: boolean;
    onconfirm: () => void;
    oncancel?: () => void;
};

/** See tabs.ts for why this is a plain reference and not a fallback chain. */
const t = (name: string) => `var(--${name})`;

export class ConfirmComponent extends Component<ConfirmProps> {
    static styles = `
        .ui-confirm {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            min-width: 320px;
            max-width: 480px;
            background: ${t('surface')};
            border: 1px solid ${t('border')};
            border-radius: ${t('radius-md')};
            box-shadow: ${t('shadow-3')};
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition:
                opacity ${t('dur-slow')} ${t('ease-standard')},
                transform ${t('dur-slow')} ${t('ease-standard')};
        }
        .ui-confirm.open {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, -50%) scale(1);
        }
        /* A dialog title is one of the places the serif is allowed (§02). */
        .ui-confirm__title {
            padding: 16px 20px 0;
            margin: 0;
            font-family: ${t('font-display')};
            font-size: 1.25rem;
            font-weight: 500;
            line-height: 1.4;
            color: ${t('text')};
        }
        .ui-confirm__message {
            padding: 12px 20px 20px;
            margin: 0;
            font-family: ${t('font-ui')};
            font-size: 0.9375rem;
            line-height: 1.5;
            color: ${t('text')};
        }
        .ui-confirm__actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 0 20px 16px;
        }
        /*
         * Buttons are Open Sans territory — the serif is forbidden here (§02).
         *
         * TIERS, not two matching boxes. The pair used to be a --surface-2
         * bordered cancel beside a filled confirm, which is the OS-dialog
         * shape §4.12 names as the thing being fixed: two equally-weighted
         * boxes make the reader stop and compare labels. Cancel is now the
         * ghost tier — no fill, no visible border — so the dialog has exactly
         * one button that looks like a button, and it is the one that acts.
         *
         * The transparent 1px border on the base is load-bearing: it keeps all
         * three variants the same box size, so nothing shifts between them.
         */
        .ui-confirm__btn {
            padding: 9px 20px;
            font-size: 13px;
            line-height: 20px;
            font-family: ${t('font-ui')};
            font-weight: 600;
            border: 1px solid transparent;
            border-radius: ${t('radius-sm')};
            cursor: pointer;
            transition:
                background ${t('dur-fast')} ${t('ease-standard')},
                border-color ${t('dur-fast')} ${t('ease-standard')},
                color ${t('dur-fast')} ${t('ease-standard')},
                box-shadow ${t('dur-fast')} ${t('ease-standard')};
        }
        .ui-confirm__btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px ${t('accent-soft')};
        }
        .ui-confirm__btn--cancel {
            background: transparent;
            color: ${t('text-muted')};
        }
        .ui-confirm__btn--cancel:hover {
            background: ${t('accent-soft')};
            color: ${t('accent')};
        }
        .ui-confirm__btn--confirm {
            background: ${t('accent')};
            color: ${t('on-accent')};
            border-color: ${t('accent')};
            box-shadow: ${t('shadow-1')};
        }
        .ui-confirm__btn--confirm:hover {
            background: ${t('accent-strong')};
            border-color: ${t('accent-strong')};
        }
        /* Outline, filling only on hover — same reasoning as css.ts danger. */
        .ui-confirm__btn--danger {
            background: transparent;
            color: ${t('danger')};
            border-color: ${t('danger')};
        }
        .ui-confirm__btn--danger:hover {
            background: ${t('danger')};
            color: ${t('on-danger')};
        }
    `;

    private dialogEl!: HTMLElement;

    render(): HTMLElement {
        const wrapper = document.createElement('div');

        /**
         * Paint copy that may be a literal or a thunk. A thunk is called inside
         * an effect, so whatever it reads — the active locale, in practice — is
         * tracked and the text repaints when that changes. A literal is written
         * once and costs no effect, which is why the two arms are kept apart
         * rather than wrapping everything.
         */
        const bind = (el: HTMLElement, value: string | (() => string)): void => {
            if (typeof value === 'function') {
                this.track(effect(() => { el.textContent = value(); }));
            } else {
                el.textContent = value;
            }
        };

        // Overlay
        this.spawn(OverlayComponent, wrapper, {
            open: this.props.open,
            bg: 'rgba(0,0,0,0.4)',
            zIndex: 199,
            scrollLock: true,
            onclose: () => this.handleCancel(),
        });

        // Dialog card
        this.dialogEl = document.createElement('div');
        this.dialogEl.className = 'ui-confirm';
        this.dialogEl.style.zIndex = '200';

        // Title
        const title = document.createElement('h2');
        title.className = 'ui-confirm__title';
        bind(title, this.props.title ?? 'Confirm');
        this.dialogEl.appendChild(title);

        // Message
        const message = document.createElement('p');
        message.className = 'ui-confirm__message';
        bind(message, this.props.message);
        this.dialogEl.appendChild(message);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'ui-confirm__actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'ui-confirm__btn ui-confirm__btn--cancel';
        bind(cancelBtn, this.props.cancelLabel ?? 'Cancel');
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleCancel();
        });
        actions.appendChild(cancelBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.className = this.props.danger
            ? 'ui-confirm__btn ui-confirm__btn--danger'
            : 'ui-confirm__btn ui-confirm__btn--confirm';
        bind(confirmBtn, this.props.confirmLabel ?? 'Confirm');
        confirmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.props.open.set(false);
            this.props.onconfirm();
        });
        actions.appendChild(confirmBtn);

        this.dialogEl.appendChild(actions);

        // Prevent clicks on the dialog from reaching the overlay
        this.dialogEl.addEventListener('click', (e) => e.stopPropagation());

        wrapper.appendChild(this.dialogEl);

        // Toggle open class
        this.track(effect(() => {
            this.dialogEl.classList.toggle('open', this.props.open.get());
        }));

        return wrapper;
    }

    private handleCancel(): void {
        this.props.open.set(false);
        if (this.props.oncancel) this.props.oncancel();
    }
}
