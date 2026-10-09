import { describe, it, expect, vi, afterEach } from "vitest";
import { isOriginAllowed } from "./cors.js";

afterEach(() => vi.unstubAllEnvs());

describe("isOriginAllowed", () => {
  it("allows requests with no Origin header (curl, server-to-server)", () => {
    expect(isOriginAllowed(undefined)).toBe(true);
  });

  it.each([5173, 5174, 5178])("allows http://localhost:%i", (port) => {
    expect(isOriginAllowed(`http://localhost:${port}`)).toBe(true);
  });

  it("rejects other localhost ports", () => {
    expect(isOriginAllowed("http://localhost:3000")).toBe(false);
  });

  it("allows FRONTEND_URL and FRONTEND_URL_2, ignoring a trailing slash in the env value", () => {
    vi.stubEnv("FRONTEND_URL", "https://game.example.com/");
    vi.stubEnv("FRONTEND_URL_2", "https://staging.example.com");
    expect(isOriginAllowed("https://game.example.com")).toBe(true);
    expect(isOriginAllowed("https://staging.example.com")).toBe(true);
  });

  it("rejects a configured URL when the request origin has a trailing slash (browsers never send one)", () => {
    vi.stubEnv("FRONTEND_URL", "https://game.example.com");
    expect(isOriginAllowed("https://game.example.com/")).toBe(false);
  });

  it("rejects unknown origins", () => {
    vi.stubEnv("FRONTEND_URL", "https://game.example.com");
    expect(isOriginAllowed("https://evil.example.com")).toBe(false);
  });

  it("reads env vars at call time, so changes take effect without re-importing", () => {
    expect(isOriginAllowed("https://late.example.com")).toBe(false);
    vi.stubEnv("FRONTEND_URL", "https://late.example.com");
    expect(isOriginAllowed("https://late.example.com")).toBe(true);
  });

  describe("GitHub Codespaces", () => {
    it("allows Codespaces origins", () => {
      expect(isOriginAllowed("https://stunning-robot-x5q4q6qv7j2p4rp-5173.app.github.dev")).toBe(true);
    });

    it.each([
      ["plain http", "http://x-5173.app.github.dev"],
      ["suffix trick", "https://x.app.github.dev.evil.com"],
      ["prefix trick", "https://evil.com/.app.github.dev"],
      ["subdomain of evil host", "https://x.app.github.dev@evil.com"],
      ["bare domain", "https://app.github.dev"],
      ["with a path", "https://x-5173.app.github.dev/path"],
    ])("rejects look-alikes: %s", (_label, origin) => {
      expect(isOriginAllowed(origin)).toBe(false);
    });
  });
});
