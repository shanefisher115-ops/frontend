/**
 * Vitest setup file. jsdom does not implement browser APIs that the app's
 * components rely on at mount time, so we polyfill the minimum set here.
 */

// The whiteboard canvas and widgets observe element size at mount; jsdom has
// no ResizeObserver, which crashed every Dashboard test before this shim.
class ResizeObserverShim {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverShim;
}
