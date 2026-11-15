import { ConflictError } from '@basics/core/server/auth';

export class ScheduleError extends ConflictError {
    readonly detail: { reason: string };
    constructor(reason: string) {
        super(reason);
        this.detail = { reason };
    }
}

export function text(value: string, maximum = 200): string {
    const result = value.trim();
    if (!result || result.length > maximum) throw new ScheduleError('invalid_text');
    return result;
}
