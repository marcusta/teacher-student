import { test, expect, beforeEach } from 'bun:test';
import { Signal } from '../core';
import { TableComponent } from './table';
import type { TableColumn, TableProps } from './table';

beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
});

type Row = { date: string; kind: string; exercise: string; note: string | null };

const rows: Row[] = [
    { date: '2026-07-14', kind: 'Lektion', exercise: 'Övergångar galopp–trav', note: 'Fem reps per varv.' },
    { date: '2026-07-10', kind: 'Pass', exercise: 'Serpentiner 3 bågar', note: 'Stel i vänster varv.' },
    { date: '2026-07-08', kind: 'Pass', exercise: 'Cavaletti på volt', note: null },
];

const columns: TableColumn<Row>[] = [
    { key: 'date', header: 'Datum', type: 'date', cell: (r) => r.date },
    { key: 'kind', header: 'Tillfälle', cell: (r) => r.kind },
    { key: 'exercise', header: 'Övning', cell: (r) => r.exercise, stackedLabel: false },
    { key: 'note', header: 'Anteckning', cell: (r) => r.note },
];

const mount = (props: TableProps<Row>) => {
    const host = document.getElementById('host')!;
    const comp = new TableComponent<Row>(props);
    comp.mount(host);
    return { host, comp, table: host.querySelector('table') as HTMLTableElement };
};

test('TableComponent: uses real table semantics', () => {
    const { comp, table, host } = mount({ columns, rows });

    expect(table.tagName).toBe('TABLE');
    expect(table.getAttribute('role')).toBe('table');
    expect(host.querySelector('thead')).not.toBeNull();
    expect(host.querySelector('tbody')).not.toBeNull();
    expect(host.querySelectorAll('tbody tr').length).toBe(3);
    expect(host.querySelectorAll('thead th').length).toBe(4);

    comp.destroy();
});

test('TableComponent: roles are asserted explicitly so stacking keeps semantics', () => {
    // Under the <640px media query these become display:block, which drops the
    // implicit table roles in several engines.
    const { comp, host } = mount({ columns, rows });

    expect((host.querySelector('thead') as HTMLElement).getAttribute('role')).toBe('rowgroup');
    expect((host.querySelector('tbody') as HTMLElement).getAttribute('role')).toBe('rowgroup');
    expect((host.querySelector('tbody tr') as HTMLElement).getAttribute('role')).toBe('row');
    expect((host.querySelector('tbody td') as HTMLElement).getAttribute('role')).toBe('cell');

    const th = host.querySelector('thead th') as HTMLElement;
    expect(th.getAttribute('role')).toBe('columnheader');
    expect(th.getAttribute('scope')).toBe('col');

    comp.destroy();
});

test('TableComponent: headers render in order', () => {
    const { comp, host } = mount({ columns, rows });
    const headers = [...host.querySelectorAll('thead th')].map((th) => th.textContent);
    expect(headers).toEqual(['Datum', 'Tillfälle', 'Övning', 'Anteckning']);
    comp.destroy();
});

test('TableComponent: numeric and date cells get a tabular-nums class', () => {
    const { comp, host } = mount({ columns, rows });

    const firstRow = host.querySelectorAll('tbody tr')[0];
    const dateCell = firstRow.querySelector('[data-key="date"]') as HTMLElement;
    const kindCell = firstRow.querySelector('[data-key="kind"]') as HTMLElement;

    expect(dateCell.classList.contains('ui-table__td--date')).toBe(true);
    expect(kindCell.classList.contains('ui-table__td--text')).toBe(true);

    expect(TableComponent.styles).toContain('font-variant-numeric: tabular-nums');

    comp.destroy();
});

test('TableComponent: empty cells render as an em dash', () => {
    const { comp, host } = mount({ columns, rows });

    const thirdRow = host.querySelectorAll('tbody tr')[2];
    const noteCell = thirdRow.querySelector('[data-key="note"]') as HTMLElement;

    expect(noteCell.querySelector('.ui-table__empty-cell')).not.toBeNull();
    expect(noteCell.textContent).toContain('—');

    comp.destroy();
});

test('TableComponent: empty string and undefined also render the dash', () => {
    const cols: TableColumn<{ a: string }>[] = [
        { key: 'a', header: 'A', cell: (r) => r.a },
        { key: 'b', header: 'B', cell: () => undefined },
    ];
    const host = document.getElementById('host')!;
    const comp = new TableComponent<{ a: string }>({ columns: cols, rows: [{ a: '' }] });
    comp.mount(host);

    const cells = host.querySelectorAll('tbody td');
    expect((cells[0] as HTMLElement).textContent).toContain('—');
    expect((cells[1] as HTMLElement).textContent).toContain('—');

    comp.destroy();
});

test('TableComponent: emptyCell placeholder is overridable', () => {
    const { comp, host } = mount({ columns, rows, emptyCell: 'saknas' });
    const thirdRow = host.querySelectorAll('tbody tr')[2];
    const noteCell = thirdRow.querySelector('[data-key="note"]') as HTMLElement;
    expect(noteCell.textContent).toContain('saknas');
    comp.destroy();
});

test('TableComponent: cells accept elements for rich content', () => {
    const chip = () => {
        const el = document.createElement('span');
        el.className = 'my-chip';
        el.textContent = 'Lektion';
        return el;
    };
    const cols: TableColumn<Row>[] = [{ key: 'kind', header: 'Tillfälle', cell: chip }];
    const { comp, host } = mount({ columns: cols, rows });

    expect(host.querySelectorAll('.my-chip').length).toBe(3);

    comp.destroy();
});

test('TableComponent: stacked labels render per cell, hidden from AT', () => {
    const { comp, host } = mount({ columns, rows });

    const firstRow = host.querySelectorAll('tbody tr')[0];
    const dateCell = firstRow.querySelector('[data-key="date"]') as HTMLElement;
    const label = dateCell.querySelector('.ui-table__stacked-label') as HTMLElement;

    expect(label.textContent).toBe('Datum');
    // role=columnheader already announces it — do not double up.
    expect(label.getAttribute('aria-hidden')).toBe('true');

    // The title column opts out.
    const exCell = firstRow.querySelector('[data-key="exercise"]') as HTMLElement;
    expect(exCell.querySelector('.ui-table__stacked-label')).toBeNull();

    comp.destroy();
});

test('TableComponent: stacking is on by default and can be opted out', () => {
    const a = mount({ columns, rows });
    expect(a.table.classList.contains('ui-table--stacked')).toBe(true);
    expect((a.host.querySelector('.ui-table-wrap') as HTMLElement)
        .classList.contains('ui-table-wrap--scroll')).toBe(false);
    a.comp.destroy();

    document.body.innerHTML = '<div id="host"></div>';
    const b = mount({ columns, rows, stacked: false });
    expect(b.table.classList.contains('ui-table--stacked')).toBe(false);
    expect((b.host.querySelector('.ui-table-wrap') as HTMLElement)
        .classList.contains('ui-table-wrap--scroll')).toBe(true);
    b.comp.destroy();
});

test('TableComponent: stacking media query targets the 640px breakpoint', () => {
    expect(TableComponent.styles).toContain('@media (max-width: 639px)');
});

test('TableComponent: no zebra striping and no centred text', () => {
    const css = TableComponent.styles;
    expect(css).not.toContain('nth-child(odd)');
    expect(css).not.toContain('nth-child(even)');
    expect(css).not.toContain('text-align: center');
    // Cells use the UI font, never the display serif.
    expect(css).toContain('font-family: var(--font-ui)');
});

test('TableComponent: caption renders and can be visually hidden', () => {
    const a = mount({ columns, rows, caption: 'Övningshistorik' });
    const cap = a.host.querySelector('caption') as HTMLElement;
    expect(cap.textContent).toBe('Övningshistorik');
    expect(cap.classList.contains('ui-table__caption--hidden')).toBe(false);
    a.comp.destroy();

    document.body.innerHTML = '<div id="host"></div>';
    const b = mount({ columns, rows, caption: 'Övningshistorik', captionHidden: true });
    expect((b.host.querySelector('caption') as HTMLElement)
        .classList.contains('ui-table__caption--hidden')).toBe(true);
    b.comp.destroy();
});

test('TableComponent: rowKey lands on the row element', () => {
    const { comp, host } = mount({ columns, rows, rowKey: (r) => r.date });
    const trs = [...host.querySelectorAll('tbody tr')];
    expect(trs.map((tr) => tr.getAttribute('data-row-key')))
        .toEqual(['2026-07-14', '2026-07-10', '2026-07-08']);
    comp.destroy();
});

/*
 * Zero rows used to render a spanning <td> with padding and no text — dead
 * space that reads as "still loading" rather than "nothing here". The table
 * does not own that message: an empty state needs a heading, an explanation and
 * usually an action, so it is EmptyStateComponent's job, composed above or
 * instead of the table. Hence no placeholder row, and deliberately no
 * `emptyMessage` prop — a string cannot carry an action.
 */
test('TableComponent: zero rows renders no body rows at all', () => {
    const { comp, host } = mount({ columns, rows: [] });
    expect(host.querySelectorAll('tbody tr').length).toBe(0);
    expect(host.querySelectorAll('.ui-table__no-rows').length).toBe(0);
    // The header still renders — the columns are the table's own structure.
    expect(host.querySelectorAll('thead th').length).toBe(4);
    comp.destroy();
});

test('TableComponent: signal-backed rows rebuild on change', () => {
    const sig = new Signal<Row[]>(rows.slice(0, 1));
    const { comp, host } = mount({ columns, rows: sig });

    expect(host.querySelectorAll('tbody tr').length).toBe(1);

    sig.set(rows);
    expect(host.querySelectorAll('tbody tr').length).toBe(3);

    sig.set([]);
    expect(host.querySelectorAll('tbody tr').length).toBe(0);

    comp.destroy();
});

test('TableComponent: destroy stops reactive rebuilds', () => {
    const sig = new Signal<Row[]>(rows.slice(0, 1));
    const { comp, host } = mount({ columns, rows: sig });

    comp.destroy();
    sig.set(rows);
    expect(host.querySelectorAll('tbody tr').length).toBe(1);
});

test('TableComponent: the caption names the table via aria-labelledby', () => {
    // role="table" overrides native table semantics, and the stacked
    // breakpoint drops them regardless — so the caption→name association has
    // to be explicit or the table is unlabelled.
    const { comp, host, table } = mount({ columns, rows, caption: 'Övningshistorik' });
    const cap = host.querySelector('caption') as HTMLElement;

    expect(cap.id).not.toBe('');
    expect(table.getAttribute('aria-labelledby')).toBe(cap.id);

    comp.destroy();
});

test('TableComponent: caption ids are unique across tables on one page', () => {
    const host = document.getElementById('host')!;
    const a = new TableComponent<Row>({ columns, rows, caption: 'A' });
    const b = new TableComponent<Row>({ columns, rows, caption: 'B' });
    a.mount(host);
    b.mount(host);

    const ids = [...host.querySelectorAll('caption')].map((c) => c.id);
    expect(ids.length).toBe(2);
    expect(new Set(ids).size).toBe(2);

    a.destroy();
    b.destroy();
});

test('TableComponent: no caption means no dangling aria-labelledby', () => {
    const { comp, table } = mount({ columns, rows });
    expect(table.getAttribute('aria-labelledby')).toBeNull();
    comp.destroy();
});
