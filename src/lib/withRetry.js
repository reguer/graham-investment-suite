// withRetry wraps an async function with bounded retries, exponential backoff and
// a per-attempt timeout, so a transient network failure (Yahoo/SEC 429/503, a
// dropped socket) doesn't abort a whole ingestion run. It does NOT change the call
// rate — the caller's own queue/concurrency limits still apply.
//
// Usage: await withRetry(() => client.quoteSummary(symbol, ...), { retries: 3 })

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, timeoutMs) {
  if (!timeoutMs) return promise;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout tras ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function withRetry(fn, options = {}) {
  const { retries = 3, backoffMs = 400, timeoutMs = 15_000, shouldRetry = () => true, sleep = delay } = options;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await withTimeout(Promise.resolve().then(fn), timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt === retries || !shouldRetry(error, attempt)) break;
      // Exponential backoff: backoffMs * 2^attempt (400, 800, 1600, ...).
      await sleep(backoffMs * 2 ** attempt);
    }
  }
  throw lastError;
}
