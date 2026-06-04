import net from "node:net";
import { describe, expect, it } from "vitest";
import { findAvailablePort, parseArgs } from "../scripts/start-dashboard.js";

function listenOn(port, host = "127.0.0.1") {
  const server = net.createServer();
  return new Promise((resolve) => {
    server.listen(port, host, () => resolve(server));
  });
}

describe("start-dashboard", () => {
  it("parses dry-run and base port", () => {
    expect(parseArgs(["node", "script", "--dry-run", "--base-port", "5200"])).toEqual({
      host: "127.0.0.1",
      basePort: 5200,
      dryRun: true,
    });
  });

  it("uses the next free port when the base port is occupied", async () => {
    const server = await listenOn(55321);
    try {
      await expect(findAvailablePort(55321, "127.0.0.1", 3)).resolves.toBe(55322);
    } finally {
      server.close();
    }
  });
});
