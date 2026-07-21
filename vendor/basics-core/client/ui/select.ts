import { Component, Signal, effect, batch, untrack, type Readable } from '../core';

export type SelectOption = {
    value: string;
    label: string;
    icon?: string;
    /**
     * Render as a non-selectable group header (e.g. a club name above its
     * courses, or the owning teacher above their exercises). Not clickable,
     * skipped by keyboard navigation, and never matched against the current
     * value.
     */
    disabled?: boolean;
};

type SelectCommonProps = {
    options: SelectOption[] | Readable<SelectOption[]>;
    /**
     * Empty-state text on the trigger. Pass `() => t('…')` for copy that must
     * follow the active locale — a plain string is read once, at the call site,
     * and cannot re-read itself afterwards.
     */
    placeholder?: string | (() => string);
    disabled?: Readable<boolean> | boolean;
    zIndex?: number;
};

/** Single-value select. The original shape — unchanged. */
export type SelectSingleProps = SelectCommonProps & {
    multiple?: false;
    value: Signal<string>;
};

/**
 * Multi-value select. Selected rows carry a checkbox plus an accent-tinted
 * fill, and the number selected is always rendered visibly in the dropdown
 * footer — a hidden count is what makes a multi-select untrustworthy.
 */
export type SelectMultiProps = SelectCommonProps & {
    multiple: true;
    values: Signal<string[]>;
    /**
     * Renders the visible selected count, e.g. `(n) => \`${n} valda\``. The
     * component has no language of its own; without this it shows the bare
     * numeral rather than inventing English copy.
     */
    countLabel?: (count: number) => string;
};

export type SelectProps = SelectSingleProps | SelectMultiProps;

function isReadable<T>(v: unknown): v is Readable<T> {
    return typeof v === 'object' && v !== null && typeof (v as { get?: unknown }).get === 'function';
}

const t = (name: string) => `var(--${name})`;

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * The §4.9 chevron: 12x8, 1.5px stroke, round caps and joins, `currentColor`
 * so it inherits whatever the chevron span sets (`--text-muted`).
 */
function buildChevronSvg(): SVGElement {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '8');
    svg.setAttribute('viewBox', '0 0 12 8');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M1 1.5 6 6.5 11 1.5');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);

    return svg;
}

export class SelectComponent extends Component<SelectProps> {
    static styles = `
        .ui-select {
            position: relative;
            display: inline-block;
        }
        /*
         * Same field base as css.ts input() (§4.9: "same field base", plus a
         * chevron). This is a CUSTOM widget, not a native select, so there is
         * no UA chevron and appearance:none has nothing to suppress — what
         * carries over is the recessed fill, the weighted bottom rule, and the
         * 34px of right padding that the chevron sits in.
         */
        .ui-select__trigger {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${t('space-2')};
            padding: 10px 34px 10px 12px;
            min-width: 160px;
            width: 100%;
            border: 1px solid ${t('border')};
            border-bottom: 2px solid ${t('border-strong')};
            border-radius: ${t('radius-sm')};
            background: ${t('bg')};
            color: ${t('text')};
            font-family: ${t('font-ui')};
            font-size: inherit;
            cursor: pointer;
            text-align: left;
            line-height: 1.5;
            transition:
                border-color ${t('dur-fast')} ${t('ease-standard')},
                box-shadow ${t('dur-fast')} ${t('ease-standard')},
                background ${t('dur-fast')} ${t('ease-standard')};
        }
        .ui-select__trigger:focus-visible {
            outline: none;
            border-color: ${t('accent')};
            background: ${t('surface')};
            box-shadow: 0 0 0 3px ${t('accent-soft')};
        }
        .ui-select__trigger--placeholder {
            color: ${t('text-muted')};
        }
        .ui-select__trigger--disabled {
            opacity: 0.5;
            pointer-events: none;
        }
        .ui-select__trigger-label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
        }
        /*
         * Inline SVG at 1.5px stroke, not a text glyph. The old U+25BE rendered
         * at whatever weight and vertical offset the user's fallback font
         * happened to have; a stroked path matches the hairline weight of the
         * field borders exactly, in every environment.
         *
         * Absolutely positioned and out of the flex flow, so the label can use
         * the full width up to the trigger's 34px right padding. It must not
         * eat pointer events: a click on the chevron is a click on the trigger.
         */
        .ui-select__chevron {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            pointer-events: none;
            color: ${t('text-muted')};
            transition: transform ${t('dur-fast')} ${t('ease-standard')};
        }
        /* Keeps the centring translate — a bare rotate() would drop it. */
        .ui-select__chevron--open {
            transform: translateY(-50%) rotate(180deg);
        }
        .ui-select__dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 4px;
            min-width: 100%;
            background: ${t('surface')};
            border: 1px solid ${t('border')};
            border-radius: ${t('radius-md')};
            box-shadow: ${t('shadow-2')};
            opacity: 0;
            pointer-events: none;
            transform: scale(0.95);
            transition: opacity ${t('dur-base')} ${t('ease-standard')},
                        transform ${t('dur-base')} ${t('ease-standard')};
        }
        .ui-select__dropdown.open {
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
        }
        .ui-select__list {
            padding: 4px 0;
            overflow-y: auto;
            max-height: 240px;
        }
        .ui-select__option {
            display: flex;
            align-items: center;
            gap: ${t('space-2')};
            padding: ${t('space-2')} ${t('space-3')};
            cursor: pointer;
            color: ${t('text')};
            font-family: ${t('font-ui')};
            font-size: 0.875rem;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
        }
        .ui-select__option:focus-visible {
            outline: none;
        }
        .ui-select__option--highlighted {
            background: ${t('surface-2')};
        }
        .ui-select__option--selected {
            color: ${t('accent-strong')};
            font-weight: 600;
        }
        /* Multi-select: selection is a checkbox plus an accent-tinted fill,
           never weight and colour alone. */
        .ui-select__option--multi.ui-select__option--selected {
            background: ${t('accent-soft')};
        }
        .ui-select__option--multi.ui-select__option--selected.ui-select__option--highlighted {
            background: ${t('accent-soft')};
            box-shadow: inset 2px 0 0 ${t('accent')};
        }
        .ui-select__checkbox {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            border: 1px solid ${t('border-strong')};
            border-radius: 3px;
            background: ${t('surface')};
            font-size: 0.625rem;
            line-height: 1;
            color: ${t('on-accent')};
        }
        .ui-select__option--selected .ui-select__checkbox {
            background: ${t('accent')};
            border-color: ${t('accent')};
        }
        .ui-select__option--header {
            cursor: default;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${t('text-muted')};
            padding-top: 10px;
            padding-bottom: 4px;
        }
        .ui-select__option--header:hover {
            background: none;
        }
        .ui-select__option-icon {
            flex-shrink: 0;
        }
        .ui-select__option-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .ui-select__check {
            flex-shrink: 0;
            font-size: 0.75rem;
            color: ${t('accent-strong')};
        }
        .ui-select__count {
            padding: ${t('space-2')} ${t('space-3')};
            border-top: 1px solid ${t('border')};
            font-family: ${t('font-ui')};
            font-size: 0.75rem;
            font-weight: 600;
            color: ${t('text-muted')};
        }
    `;

    /**
     * Option ids must be unique per document, not per instance:
     * `aria-activedescendant` is resolved by `getElementById`, so two selects
     * on the same page both pointing at `ui-select-opt-1` would send every
     * screen reader to whichever one happens to come first in the DOM. Several
     * app views mount three or four selects side by side.
     */
    private static seq = 0;
    private uid = `ui-select-${SelectComponent.seq++}`;

    private open = new Signal(false);
    private highlightIndex = new Signal(-1);
    private wrapperEl!: HTMLElement;
    private triggerEl!: HTMLButtonElement;
    private dropdownEl!: HTMLElement;
    private listEl!: HTMLElement;
    private countEl?: HTMLElement;
    private optionEls: HTMLButtonElement[] = [];

    // Close when a pointer press lands anywhere outside this select. A document
    // capture listener (added only while open) is reliable across stacking
    // contexts and makes opening one select close any other — unlike a
    // per-instance transparent backdrop, whose z-order is fragile when several
    // selects coexist.
    private onOutsidePointer = (e: Event): void => {
        if (!this.wrapperEl.contains(e.target as Node)) {
            this.open.set(false);
        }
    };

    private get isMulti(): boolean {
        return this.props.multiple === true;
    }

    private get multi(): SelectMultiProps {
        return this.props as SelectMultiProps;
    }

    private get single(): SelectSingleProps {
        return this.props as SelectSingleProps;
    }

    private currentOptions(): SelectOption[] {
        return isReadable<SelectOption[]>(this.props.options)
            ? this.props.options.get()
            : this.props.options as SelectOption[];
    }

    /** Values currently selected, in both modes. */
    private selectedValues(): string[] {
        if (this.isMulti) return this.multi.values.get();
        const v = this.single.value.get();
        return v ? [v] : [];
    }

    /**
     * The placeholder as text. A thunk is CALLED here rather than at the call
     * site, so the signals it touches (the active locale, typically) are read
     * inside whichever effect asks for the text — that is the whole mechanism
     * behind a placeholder that survives a locale switch.
     */
    private placeholderText(): string {
        const value = this.props.placeholder;
        return (typeof value === 'function' ? value() : value) ?? '';
    }

    private formatCount(n: number): string {
        return this.multi.countLabel ? this.multi.countLabel(n) : String(n);
    }

    render(): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'ui-select';
        this.wrapperEl = wrapper;

        const zIndex = this.props.zIndex ?? 50;
        const multi = this.isMulti;

        // Trigger button
        this.triggerEl = document.createElement('button');
        this.triggerEl.className = 'ui-select__trigger';
        this.triggerEl.setAttribute('type', 'button');
        this.triggerEl.setAttribute('role', 'combobox');
        this.triggerEl.setAttribute('aria-haspopup', 'listbox');

        const labelSpan = document.createElement('span');
        labelSpan.className = 'ui-select__trigger-label';
        this.triggerEl.appendChild(labelSpan);

        const chevron = document.createElement('span');
        chevron.className = 'ui-select__chevron';
        // Static, author-controlled markup \u2014 no interpolation, nothing to
        // sanitise. Built with the SVG namespace rather than innerHTML so it
        // works identically under a DOM implementation that does not parse
        // HTML fragments into the SVG namespace.
        chevron.appendChild(buildChevronSvg());
        chevron.setAttribute('aria-hidden', 'true');
        this.triggerEl.appendChild(chevron);

        this.triggerEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.triggerEl.addEventListener('keydown', (e) => {
            this.handleTriggerKeydown(e);
        });

        wrapper.appendChild(this.triggerEl);

        // Dropdown panel — holds the scrolling option list, plus the selected
        // count in multi mode.
        this.dropdownEl = document.createElement('div');
        this.dropdownEl.className = 'ui-select__dropdown';
        this.dropdownEl.style.zIndex = String(zIndex);

        this.dropdownEl.addEventListener('keydown', (e) => {
            this.handleDropdownKeydown(e);
        });

        this.listEl = document.createElement('div');
        this.listEl.className = 'ui-select__list';
        this.listEl.setAttribute('role', 'listbox');
        if (multi) this.listEl.setAttribute('aria-multiselectable', 'true');
        this.dropdownEl.appendChild(this.listEl);

        if (multi) {
            this.countEl = document.createElement('div');
            this.countEl.className = 'ui-select__count';
            // A live region: the count changes without the focus moving, so it
            // has to announce itself.
            this.countEl.setAttribute('role', 'status');
            this.countEl.setAttribute('aria-live', 'polite');
            this.dropdownEl.appendChild(this.countEl);
        }

        wrapper.appendChild(this.dropdownEl);

        // Build options — reactive if Signal
        const buildOptions = (options: SelectOption[]) => {
            this.optionEls = [];
            this.listEl.textContent = '';

            for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                const btn = document.createElement('button');
                btn.className = multi ? 'ui-select__option ui-select__option--multi' : 'ui-select__option';
                btn.setAttribute('type', 'button');
                btn.id = `${this.uid}-opt-${i}`;

                // Non-selectable group header (e.g. the owning teacher). Kept
                // in optionEls so index alignment with `options` holds, but
                // inert: disabled, no role="option", no click/hover/check
                // wiring, and no checkbox even in multi mode.
                if (opt.disabled) {
                    btn.classList.add('ui-select__option--header');
                    btn.disabled = true;
                    btn.setAttribute('role', 'presentation');
                    btn.setAttribute('aria-disabled', 'true');

                    const labelEl = document.createElement('span');
                    labelEl.className = 'ui-select__option-label';
                    labelEl.textContent = opt.label;
                    btn.appendChild(labelEl);

                    this.listEl.appendChild(btn);
                    this.optionEls.push(btn);
                    continue;
                }

                btn.setAttribute('role', 'option');

                if (multi) {
                    const box = document.createElement('span');
                    box.className = 'ui-select__checkbox';
                    box.setAttribute('aria-hidden', 'true');
                    btn.appendChild(box);
                }

                if (opt.icon) {
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'ui-select__option-icon';
                    iconSpan.textContent = opt.icon;
                    btn.appendChild(iconSpan);
                }

                const labelEl = document.createElement('span');
                labelEl.className = 'ui-select__option-label';
                labelEl.textContent = opt.label;
                btn.appendChild(labelEl);

                if (!multi) {
                    const checkEl = document.createElement('span');
                    checkEl.className = 'ui-select__check';
                    checkEl.setAttribute('aria-hidden', 'true');
                    btn.appendChild(checkEl);
                }

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.chooseOption(opt.value);
                });

                btn.addEventListener('mouseenter', () => {
                    this.highlightIndex.set(i);
                });

                this.listEl.appendChild(btn);
                this.optionEls.push(btn);
            }
        };

        if (isReadable(this.props.options)) {
            this.track(effect(() => {
                buildOptions(this.currentOptions());
            }));
        } else {
            buildOptions(this.props.options as SelectOption[]);
        }

        // Effect: update trigger label and selected state on selection change
        this.track(effect(() => {
            const options = this.currentOptions();
            const selected = this.selectedValues();

            if (multi) {
                const count = selected.length;
                if (count > 0) {
                    labelSpan.textContent = this.formatCount(count);
                    this.triggerEl.classList.remove('ui-select__trigger--placeholder');
                } else {
                    // Resolved INSIDE this effect, which is what makes a
                    // `() => t('…')` placeholder re-read on a locale switch.
                    const text = this.placeholderText();
                    labelSpan.textContent = text;
                    this.triggerEl.classList.toggle('ui-select__trigger--placeholder', !!text);
                }
                if (this.countEl) this.countEl.textContent = this.formatCount(count);
            } else {
                const val = this.single.value.get();
                const match = options.find(o => o.value === val);
                if (match) {
                    labelSpan.textContent = match.icon
                        ? `${match.icon} ${match.label}`
                        : match.label;
                    this.triggerEl.classList.remove('ui-select__trigger--placeholder');
                } else {
                    // Resolved INSIDE this effect, which is what makes a
                    // `() => t('…')` placeholder re-read on a locale switch.
                    const text = this.placeholderText();
                    labelSpan.textContent = text;
                    this.triggerEl.classList.toggle('ui-select__trigger--placeholder', !!text);
                }
            }

            // Update aria-selected, check marks and checkbox glyphs
            for (let i = 0; i < options.length; i++) {
                const btn = this.optionEls[i];
                if (!btn) continue;
                if (options[i].disabled) continue;
                const isSelected = selected.includes(options[i].value);
                btn.setAttribute('aria-selected', String(isSelected));
                btn.classList.toggle('ui-select__option--selected', isSelected);
                const check = btn.querySelector('.ui-select__check') as HTMLElement | null;
                if (check) check.textContent = isSelected ? '\u2713' : '';
                const box = btn.querySelector('.ui-select__checkbox') as HTMLElement | null;
                if (box) box.textContent = isSelected ? '\u2713' : '';
            }
        }));

        // Effect: toggle open state
        this.track(effect(() => {
            const isOpen = this.open.get();
            this.dropdownEl.classList.toggle('open', isOpen);
            chevron.classList.toggle('ui-select__chevron--open', isOpen);
            this.triggerEl.setAttribute('aria-expanded', String(isOpen));

            // Outside-click-to-close: only listen while open. Capture phase, so
            // it fires before the just-clicked element can swallow the event.
            if (isOpen) {
                document.addEventListener('pointerdown', this.onOutsidePointer, true);
            } else {
                document.removeEventListener('pointerdown', this.onOutsidePointer, true);
            }

            if (isOpen) {
                // Highlight the first selected option, or the first selectable.
                // Untracked: this effect must depend on `open` alone. Reading
                // the selection here would otherwise re-seed the highlight on
                // every multi-select toggle, yanking the cursor back to the top
                // of the list mid-keyboard-run.
                untrack(() => {
                    const options = this.currentOptions();
                    const selected = this.selectedValues();
                    const idx = options.findIndex(o => !o.disabled && selected.includes(o.value));
                    const firstSelectable = options.findIndex(o => !o.disabled);
                    this.highlightIndex.set(idx >= 0 ? idx : firstSelectable);
                });
            }
        }));

        // Effect: highlight management
        this.track(effect(() => {
            const idx = this.highlightIndex.get();
            for (let i = 0; i < this.optionEls.length; i++) {
                this.optionEls[i].classList.toggle(
                    'ui-select__option--highlighted',
                    i === idx,
                );
            }
            if (idx >= 0 && this.optionEls[idx]) {
                this.triggerEl.setAttribute('aria-activedescendant', `${this.uid}-opt-${idx}`);
                this.optionEls[idx].scrollIntoView({ block: 'nearest' });
            }
        }));

        // Effect: disabled state
        if (this.props.disabled != null) {
            if (isReadable(this.props.disabled)) {
                this.track(effect(() => {
                    const dis = (this.props.disabled as Signal<boolean>).get();
                    this.triggerEl.classList.toggle('ui-select__trigger--disabled', dis);
                    this.triggerEl.disabled = dis;
                }));
            } else if (this.props.disabled) {
                this.triggerEl.classList.add('ui-select__trigger--disabled');
                this.triggerEl.disabled = true;
            }
        }

        return wrapper;
    }

    private toggle(): void {
        this.open.update(v => !v);
    }

    /**
     * Single mode commits and closes. Multi mode toggles and stays open —
     * closing after each pick would make selecting three things cost three
     * round trips through the trigger.
     */
    private chooseOption(value: string): void {
        if (this.isMulti) {
            const cur = this.multi.values.get();
            this.multi.values.set(
                cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value],
            );
            return;
        }
        batch(() => {
            this.single.value.set(value);
            this.open.set(false);
        });
        this.triggerEl.focus();
    }

    /**
     * Commit whatever row is highlighted. Shared by the trigger and the
     * dropdown: the dropdown is a *sibling* of the trigger, so a keydown while
     * the trigger holds focus — which is the normal case, since opening the
     * list never moves focus — does not bubble to the dropdown's listener. The
     * trigger therefore has to do the work itself rather than delegate.
     */
    private commitHighlighted(): void {
        const idx = this.highlightIndex.get();
        const options = this.currentOptions();
        if (idx >= 0 && idx < options.length && !options[idx].disabled) {
            this.chooseOption(options[idx].value);
        }
    }

    private handleTriggerKeydown(e: KeyboardEvent): void {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                // Open when closed; otherwise select the highlighted row.
                // Toggling shut here used to discard the highlight, which made
                // it impossible to pick anything by keyboard without first
                // tabbing into the list.
                if (!this.open.get()) this.open.set(true);
                else this.commitHighlighted();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!this.open.get()) {
                    this.open.set(true);
                } else {
                    this.moveHighlight(1);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!this.open.get()) {
                    this.open.set(true);
                } else {
                    this.moveHighlight(-1);
                }
                break;
            case 'Escape':
                if (this.open.get()) {
                    e.preventDefault();
                    this.open.set(false);
                }
                break;
        }
    }

    private handleDropdownKeydown(e: KeyboardEvent): void {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.moveHighlight(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.moveHighlight(-1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.commitHighlighted();
                break;
            case 'Escape':
                e.preventDefault();
                this.open.set(false);
                this.triggerEl.focus();
                break;
            case 'Tab':
                this.open.set(false);
                break;
        }
    }

    private moveHighlight(delta: number): void {
        const options = this.currentOptions();
        if (options.length === 0) return;

        if (!options.some(o => !o.disabled)) return;

        let next = this.highlightIndex.get();
        // Step over non-selectable header rows.
        do {
            next += delta;
            if (next < 0) next = options.length - 1;
            if (next >= options.length) next = 0;
        } while (options[next].disabled);
        this.highlightIndex.set(next);
    }

    onDestroy(): void {
        document.removeEventListener('pointerdown', this.onOutsidePointer, true);
    }
}
