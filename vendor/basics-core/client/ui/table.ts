import { Component, effect, type Readable } from '../core';

export type TableCellValue = string | number | HTMLElement | null | undefined;

/**
 * `numeric` and `date` cells get `font-variant-numeric: tabular-nums` so digits
 * line up down the column. Everything else is plain text.
 */
export type TableColumnType = 'text' | 'numeric' | 'date';

export type TableColumn<T> = {
    /** Stable identity for the column. Also used as the cell's `data-key`. */
    key: string;
    /** Column heading. Also the label shown per-cell in stacked rendering. */
    header: string;
    /** Defaults to `text`. */
    type?: TableColumnType;
    /**
     * Produce the cell body. Return an element for rich content (a chip, a
     * link), a string or number for text. Return `null`, `undefined` or an
     * empty string for "no value" — the table renders the placeholder dash.
     */
    cell: (row: T) => TableCellValue;
    /**
     * Repeat the header as a label beside this cell when stacked. Defaults to
     * true; turn it off for the column that acts as the row's title.
     */
    stackedLabel?: boolean;
};

export type TableProps<T> = {
    columns: TableColumn<T>[];
    rows: T[] | Readable<T[]>;
    /** Accessible name for the table. Strongly recommended. */
    caption?: string;
    /** Keep the caption for screen readers but remove it visually. */
    captionHidden?: boolean;
    /** Identity for a row, for `data-row-key`. */
    rowKey?: (row: T) => string;
    /** Placeholder for empty cells. Defaults to an em dash. */
    emptyCell?: string;
    /**
     * Below 640px, render each row as a stacked block instead of a horizontal
     * scroller (see UI_DECISIONS §6). Defaults to true. Set false to keep the
     * grid and scroll horizontally instead.
     */
    stacked?: boolean;
};

function isReadable<T>(v: unknown): v is Readable<T> {
    return typeof v === 'object' && v !== null && typeof (v as { get?: unknown }).get === 'function';
}

const t = (name: string) => `var(--${name})`;

export class TableComponent<T> extends Component<TableProps<T>> {
    static styles = `
        .ui-table-wrap {
            width: 100%;
        }
        /* Non-stacking tables keep the grid and scroll inside their own box,
           so the page body never scrolls sideways. */
        .ui-table-wrap--scroll {
            overflow-x: auto;
        }
        .ui-table {
            width: 100%;
            border-collapse: collapse;
            /* Never the display serif in cells. */
            font-family: ${t('font-ui')};
            font-size: 0.875rem;
            line-height: 1.5;
            color: ${t('text')};
        }
        .ui-table__caption {
            font-family: ${t('font-display')};
            font-weight: 500;
            font-size: 1.25rem;
            line-height: 1.4;
            text-align: left;
            color: ${t('text')};
            padding-bottom: ${t('space-3')};
        }
        .ui-table__caption--hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }
        .ui-table__th {
            /* Overline treatment: letterspaced uppercase, UI font. */
            font-family: ${t('font-ui')};
            font-size: 0.6875rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: ${t('text-muted')};
            text-align: left;
            padding: ${t('space-2')} ${t('space-3')};
            border-bottom: 1px solid ${t('border-strong')};
            white-space: nowrap;
        }
        .ui-table__td {
            text-align: left;
            padding: ${t('space-3')};
            border-bottom: 1px solid ${t('border')};
            vertical-align: top;
        }
        /* No zebra striping — surfaces are separated by hairlines, not fills. */
        .ui-table__tr:last-child .ui-table__td {
            border-bottom: none;
        }
        .ui-table__td--numeric,
        .ui-table__td--date {
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        .ui-table__empty-cell {
            color: ${t('text-muted')};
        }
        .ui-table__stacked-label {
            display: none;
        }

        @media (max-width: 639px) {
            /* Stacked rendering. Implicit table roles are lost under
               display:block, so every element re-asserts its role explicitly
               (see render()) and the semantics survive. */
            .ui-table--stacked,
            .ui-table--stacked .ui-table__head,
            .ui-table--stacked .ui-table__body,
            .ui-table--stacked .ui-table__tr,
            .ui-table--stacked .ui-table__td {
                display: block;
                width: 100%;
            }
            /* Column headers are redundant once each cell carries its own. */
            .ui-table--stacked .ui-table__head {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
            }
            .ui-table--stacked .ui-table__tr {
                padding: ${t('space-3')} 0;
                border-bottom: 1px solid ${t('border')};
            }
            .ui-table--stacked .ui-table__tr:last-child {
                border-bottom: none;
            }
            .ui-table--stacked .ui-table__td {
                padding: ${t('space-1')} 0;
                border-bottom: none;
                white-space: normal;
            }
            .ui-table--stacked .ui-table__stacked-label {
                display: block;
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: ${t('text-muted')};
                margin-bottom: 2px;
            }
        }
    `;

    private bodyEl!: HTMLElement;

    /** Unique per document — the caption id is referenced by aria-labelledby. */
    private static seq = 0;
    private uid = `ui-table-${TableComponent.seq++}`;

    render(): HTMLElement {
        const stacked = this.props.stacked !== false;
        const emptyCell = this.props.emptyCell ?? '\u2014';

        const wrap = document.createElement('div');
        wrap.className = stacked ? 'ui-table-wrap' : 'ui-table-wrap ui-table-wrap--scroll';

        const table = document.createElement('table');
        table.className = stacked ? 'ui-table ui-table--stacked' : 'ui-table';
        // Explicit roles: under the stacked media query these elements become
        // display:block, which drops their implicit table semantics in several
        // engines. Naming the roles keeps the screen-reader model intact at
        // every width.
        table.setAttribute('role', 'table');

        if (this.props.caption !== undefined) {
            const caption = document.createElement('caption');
            caption.className = this.props.captionHidden
                ? 'ui-table__caption ui-table__caption--hidden'
                : 'ui-table__caption';
            caption.id = `${this.uid}-caption`;
            caption.textContent = this.props.caption;
            table.appendChild(caption);
            // A <caption> names its table only through native table semantics.
            // Setting role="table" explicitly overrides those semantics, and
            // the stacked breakpoint drops them anyway — which is the whole
            // reason the roles are here. The roles restore the structure but
            // not the name, so the name has to be wired up by hand or the
            // table goes unlabelled exactly where it matters most.
            table.setAttribute('aria-labelledby', caption.id);
        }

        const thead = document.createElement('thead');
        thead.className = 'ui-table__head';
        thead.setAttribute('role', 'rowgroup');
        const headRow = document.createElement('tr');
        headRow.className = 'ui-table__tr';
        headRow.setAttribute('role', 'row');
        for (const col of this.props.columns) {
            const th = document.createElement('th');
            th.className = 'ui-table__th';
            th.setAttribute('role', 'columnheader');
            th.setAttribute('scope', 'col');
            th.setAttribute('data-key', col.key);
            th.textContent = col.header;
            headRow.appendChild(th);
        }
        thead.appendChild(headRow);
        table.appendChild(thead);

        this.bodyEl = document.createElement('tbody');
        this.bodyEl.className = 'ui-table__body';
        this.bodyEl.setAttribute('role', 'rowgroup');
        table.appendChild(this.bodyEl);

        const buildRows = (rows: T[]): void => {
            this.bodyEl.textContent = '';

            /*
             * Zero rows renders NOTHING in the body — header only, no spanning
             * placeholder row.
             *
             * The placeholder used to be rendered with padding and no text,
             * which is the worst of both: it occupies a row's worth of space and
             * says nothing, so an empty table looks like a loading table. The
             * fix is not an `emptyMessage` prop — a good empty state needs a
             * heading, an explanation and usually an action, which is a
             * component, not a string. Compose `EmptyStateComponent` above or
             * instead of the table and let it carry the copy.
             */
            if (rows.length === 0) return;

            for (const row of rows) {
                const tr = document.createElement('tr');
                tr.className = 'ui-table__tr';
                tr.setAttribute('role', 'row');
                if (this.props.rowKey) tr.setAttribute('data-row-key', this.props.rowKey(row));

                for (const col of this.props.columns) {
                    const type = col.type ?? 'text';
                    const td = document.createElement('td');
                    td.className = `ui-table__td ui-table__td--${type}`;
                    td.setAttribute('role', 'cell');
                    td.setAttribute('data-key', col.key);

                    if (col.stackedLabel !== false) {
                        const label = document.createElement('span');
                        label.className = 'ui-table__stacked-label';
                        // The column header is already announced via
                        // role=columnheader at full width; repeating it here
                        // would double up, so it is visual-only.
                        label.setAttribute('aria-hidden', 'true');
                        label.textContent = col.header;
                        td.appendChild(label);
                    }

                    const value = col.cell(row);
                    if (value instanceof HTMLElement) {
                        td.appendChild(value);
                    } else if (value === null || value === undefined || value === '') {
                        const dash = document.createElement('span');
                        dash.className = 'ui-table__empty-cell';
                        dash.textContent = emptyCell;
                        td.appendChild(dash);
                    } else {
                        const text = document.createElement('span');
                        text.textContent = String(value);
                        td.appendChild(text);
                    }

                    tr.appendChild(td);
                }

                this.bodyEl.appendChild(tr);
            }
        };

        if (isReadable<T[]>(this.props.rows)) {
            this.track(effect(() => {
                buildRows((this.props.rows as Readable<T[]>).get());
            }));
        } else {
            buildRows(this.props.rows as T[]);
        }

        wrap.appendChild(table);
        return wrap;
    }
}
