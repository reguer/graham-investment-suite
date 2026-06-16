// Vitest reads this file (vitest.config.js) in preference to vite.config.js.
// The yahoo-finance2 stub alias must live here so the data-layer suites resolve
// the stub instead of hitting the real network client. Keep this in sync with
// the `test` block in vite.config.js.
export default {
  test: {
    environment: "node",
    alias: {
      "yahoo-finance2": new URL("./src/__stubs__/yahoo-finance2.js", import.meta.url).pathname,
    },
  },
};
