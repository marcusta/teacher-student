// i18n key-parity check. Run with `bun run check:i18n`.
//
// Swedish is the source of truth: every key in sv.json must exist in en.json with
// the same `{placeholder}` set, and en.json must not carry keys sv.json lacks.
// Exits non-zero and prints every problem when the catalogs diverge.

import { checkMessageParity } from '@basics/core/client/i18n';
import sv from '../web/i18n/sv.json';
import en from '../web/i18n/en.json';

/**
 * Duplicate keys are invisible to every check that runs on parsed objects:
 * `JSON.parse('{"a":"first","a":"second"}')` silently yields `{a:"second"}`,
 * so one of the two translations is dropped with no error anywhere — and key
 * parity still passes, because both catalogs do have the key. The only place
 * the duplicate is still visible is the raw file text, so scan that.
 */
function duplicateKeys(source: string, name: string): string[] {
    const seen = new Set<string>();
    const problems: string[] = [];
    for (const match of source.matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*:/gm)) {
        const key = match[1]!;
        if (seen.has(key)) problems.push(`duplicate key in ${name}: ${key}`);
        seen.add(key);
    }
    return problems;
}

const sources = await Promise.all([
    Bun.file(new URL('../web/i18n/sv.json', import.meta.url)).text(),
    Bun.file(new URL('../web/i18n/en.json', import.meta.url)).text(),
]);

const problems = [
    ...duplicateKeys(sources[0]!, 'sv'),
    ...duplicateKeys(sources[1]!, 'en'),
    ...checkMessageParity(sv, en, { reference: 'sv', target: 'en' }),
];

if (problems.length > 0) {
    console.error(`i18n parity FAILED — ${problems.length} problem(s) between sv and en:`);
    for (const problem of problems) console.error(`  • ${problem}`);
    process.exit(1);
}

console.log(`i18n parity OK — ${Object.keys(sv).length} keys, sv ↔ en in sync`);
