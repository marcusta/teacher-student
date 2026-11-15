import { test, expect } from 'bun:test';
import { addDays, mondayOf, isoWeek, zonedInstant } from '../shared/schedule-calendar';

test('calendar weeks cross years and daylight saving without changing the local activity date', () => {
    expect(mondayOf('2027-01-01')).toBe('2026-12-28');
    expect(isoWeek('2027-01-01')).toEqual({ year: 2026, week: 53 });
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(zonedInstant('2026-03-29', '08:00', 'Europe/Stockholm')).toBe('2026-03-29T06:00:00.000Z');
    expect(() => zonedInstant('2026-03-29', '02:30', 'Europe/Stockholm')).toThrow('nonexistent_time');
    expect(() => zonedInstant('2026-10-25', '02:30', 'Europe/Stockholm')).toThrow('ambiguous_time');
    expect(zonedInstant('2026-10-25', '02:30', 'Europe/Stockholm', 60)).toBe('2026-10-25T01:30:00.000Z');
    expect(() => addDays('2026-02-30', 1)).toThrow('invalid_date');
});
