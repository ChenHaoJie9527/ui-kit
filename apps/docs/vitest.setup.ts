import { afterEach } from "vitest";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  value: () => {},
});

// jsdom and Node provide different AbortSignal constructors. Data routers do
// not need a fetch signal in these synchronous route tests, so omit it from
// the test-only Request implementation instead of crossing realms.
const RuntimeRequest = globalThis.Request;
if (RuntimeRequest) {
  class TestRequest extends RuntimeRequest {
    constructor(input: RequestInfo | URL, init: RequestInit = {}) {
      const { signal: _signal, ...rest } = init;
      super(input, rest);
    }
  }

  Object.defineProperty(globalThis, "Request", {
    configurable: true,
    value: TestRequest,
  });
}

afterEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
});
