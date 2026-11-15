export function calendarDate(value: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + 'T12:00:00Z')) || new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) !== value) throw new Error('invalid_date');
    return value;
}

export function addDays(value: string, days: number): string {
    const date = new Date(calendarDate(value) + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

export function mondayOf(value: string): string {
    const day = new Date(calendarDate(value) + 'T12:00:00Z').getUTCDay();
    return addDays(value, -((day + 6) % 7));
}

export function isoWeek(value: string): { year: number; week: number } {
    const thursday = new Date(addDays(mondayOf(value), 3) + 'T12:00:00Z');
    const year = thursday.getUTCFullYear();
    const first = new Date(Date.UTC(year, 0, 1, 12));
    return { year, week: Math.floor((thursday.getTime() - first.getTime()) / 86400000 / 7) + 1 };
}

export function localToday(timeZone = 'Europe/Stockholm', now = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const value = (type: string) => parts.find(p => p.type === type)!.value;
    return `${value('year')}-${value('month')}-${value('day')}`;
}

/** Resolve a wall-clock time, rejecting DST gaps and asking for an offset in overlaps. */
export function zonedOffsets(date: string, time: string, timeZone: string): number[] {
    calendarDate(date);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('invalid_time');
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const parts = (instant: number) => {
        const values = formatter.formatToParts(instant);
        const read = (type: string) => values.find(p => p.type === type)!.value;
        return `${read('year')}-${read('month')}-${read('day')}T${read('hour')}:${read('minute')}`;
    };
    const wall = `${date}T${time}`, reference = Date.parse(wall + ':00Z');
    const offsets = new Set<number>();
    for (let hour = -36; hour <= 36; hour += 6) {
        const instant = reference + hour * 3600000;
        offsets.add((Date.parse(parts(instant) + ':00Z') - instant) / 60000);
    }
    const candidates = [...offsets].filter(offset => parts(reference - offset * 60000) === wall);
    if (!candidates.length) throw new Error('nonexistent_time');
    return candidates.sort((a, b) => b - a);
}

export function zonedInstant(date: string, time: string, timeZone: string, offsetMinutes?: number | null): string {
    const candidates = zonedOffsets(date, time, timeZone);
    if (offsetMinutes != null && !candidates.includes(offsetMinutes)) throw new Error('invalid_offset');
    if (candidates.length > 1 && offsetMinutes == null) throw new Error('ambiguous_time');
    return new Date(Date.parse(`${date}T${time}:00Z`) - (offsetMinutes ?? candidates[0]!) * 60000).toISOString();
}
