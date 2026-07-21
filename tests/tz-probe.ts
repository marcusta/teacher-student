/**
 * Renders one lesson time and prints it, so a test can observe what a reader in
 * a NON-UTC zone actually sees.
 *
 * Deliberately not a `.test.ts` file: it is the payload of
 * `lesson-when-timezone.test.ts`, run as a child process under
 * `TZ=Europe/Stockholm`. It has to be a separate process because `bun test`
 * pins `TZ=UTC` for the whole run, and because `@basics/core/client/i18n`
 * caches its `Intl.DateTimeFormat` instances by locale+options — a zone
 * swapped mid-process would be honoured by formatters built after the swap and
 * ignored by every one already in the cache, which is a worse test than none.
 *
 * No DOM: `lesson-copy.ts` is DOM-free on purpose, and this runs without the
 * happy-dom preload.
 */
import { setLocale } from '@basics/core/client/i18n';
import '../web/i18n';
import { lessonWhen } from '../web/lessons/lesson-copy';

setLocale('sv');

const iso = process.argv[2];
if (!iso) throw new Error('usage: bun tests/tz-probe.ts <iso-instant>');

process.stdout.write(JSON.stringify({
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lessonWhen: lessonWhen(iso),
}));
