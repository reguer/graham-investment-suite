import { describe, it, expect, vi } from "vitest";
import { withRetry } from "../src/lib/withRetry.js";

const noSleep = () => Promise.resolve();

describe("withRetry", () => {
  it("returns immediately on first success (no retries)", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    expect(await withRetry(fn, { sleep: noSleep })).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("503"))
      .mockRejectedValueOnce(new Error("503"))
      .mockResolvedValue("ok");
    expect(await withRetry(fn, { retries: 3, sleep: noSleep })).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws the last error after exhausting retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("429"));
    await expect(withRetry(fn, { retries: 2, sleep: noSleep })).rejects.toThrow("429");
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("stops early when shouldRetry returns false", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("400 bad request"));
    await expect(
      withRetry(fn, { retries: 5, sleep: noSleep, shouldRetry: (e) => !e.message.includes("400") }),
    ).rejects.toThrow("400");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("applies exponential backoff between attempts", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("x")).mockRejectedValueOnce(new Error("x")).mockResolvedValue("ok");
    const sleeps = [];
    await withRetry(fn, { backoffMs: 100, sleep: (ms) => (sleeps.push(ms), Promise.resolve()) });
    expect(sleeps).toEqual([100, 200]);
  });

  it("times out a hung attempt", async () => {
    const fn = () => new Promise(() => {}); // never resolves
    await expect(withRetry(fn, { retries: 0, timeoutMs: 20, sleep: noSleep })).rejects.toThrow(/Timeout/);
  });
});
