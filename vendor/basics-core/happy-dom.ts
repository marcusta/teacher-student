import { GlobalWindow } from 'happy-dom';

const window = new GlobalWindow();

for (const key of Object.getOwnPropertyNames(window)) {
    if (!(key in globalThis)) {
        Object.defineProperty(globalThis, key, {
            value: (window as any)[key],
            writable: true,
            configurable: true,
        });
    }
}

// Bun exposes some web constructors (notably Event) natively, so the loop above
// skips them — but happy-dom elements reject events built from a different
// realm ("parameter 1 is not of type 'Event'"). Overwrite them unconditionally
// with the constructors from the SAME window that owns `document`.
for (const key of [
    'Event',
    'EventTarget',
    'CustomEvent',
    'MouseEvent',
    'KeyboardEvent',
    'FocusEvent',
    'InputEvent',
]) {
    const value = (window as any)[key];
    if (value !== undefined) {
        Object.defineProperty(globalThis, key, {
            value,
            writable: true,
            configurable: true,
        });
    }
}

Object.defineProperty(globalThis, 'document', {
    value: window.document,
    writable: true,
    configurable: true,
});
