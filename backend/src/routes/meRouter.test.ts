import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express, { RequestHandler } from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createMeRouter, UserProfileStore } from "./meRouter.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

// Fake auth: the "token" is just headers saying who the caller is.
const fakeVerify: RequestHandler = (req, res, next) => {
  const userId = req.header("x-test-user");
  if (!userId) return void res.status(401).json({ error: "No token provided" });
  (req as AuthenticatedRequest).user = {
    userId,
    email: req.header("x-test-email") ?? "",
    name: req.header("x-test-name") ?? "",
  };
  next();
};

// In-memory store with the same rules the unique index enforces (case-insensitive, per player).
const memoryStore = () => {
  const byUser = new Map<string, string>();
  const store: UserProfileStore = {
    getUsername: vi.fn(async (id: string) => byUser.get(id) ?? null),
    setUsername: vi.fn(async (id: string, username: string) => {
      for (const [owner, existing] of byUser) {
        if (owner !== id && existing.toLowerCase() === username.toLowerCase()) return "taken" as const;
      }
      byUser.set(id, username);
      return "ok" as const;
    }),
  };
  return { store, byUser };
};

let server: Server;
let baseUrl: string;
let ctx: ReturnType<typeof memoryStore>;

beforeEach(async () => {
  ctx = memoryStore();
  const app = express();
  app.use(express.json());
  app.use("/", createMeRouter({ store: ctx.store, verify: fakeVerify }));
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(() => new Promise<void>((resolve) => server.close(() => resolve())));

const call = (method: string, path: string, user?: string, body?: unknown, extra: Record<string, string> = {}) =>
  fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(user ? { "x-test-user": user } : {}),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe("GET /me", () => {
  it("requires auth", async () => {
    expect((await call("GET", "/me")).status).toBe(401);
  });

  it("returns a null username for a player who hasn't chosen one", async () => {
    const res = await call("GET", "/me", "u1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: "u1", username: null });
  });

  it("returns the saved username", async () => {
    ctx.byUser.set("u1", "Ann_T");
    expect(await (await call("GET", "/me", "u1")).json()).toEqual({ userId: "u1", username: "Ann_T" });
  });

  it("doesn't leak another player's username", async () => {
    ctx.byUser.set("u1", "Ann_T");
    expect(await (await call("GET", "/me", "u2")).json()).toEqual({ userId: "u2", username: null });
  });

  it("returns 500 with a generic message when the store fails", async () => {
    vi.mocked(ctx.store.getUsername).mockRejectedValueOnce(new Error("mongo exploded: secret details"));
    const res = await call("GET", "/me", "u1");
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});

describe("PUT /me/username", () => {
  it("requires auth", async () => {
    expect((await call("PUT", "/me/username", undefined, { username: "Ann_T" })).status).toBe(401);
    expect(ctx.store.setUsername).not.toHaveBeenCalled();
  });

  it("saves a valid username (trimmed) and returns it", async () => {
    const res = await call("PUT", "/me/username", "u1", { username: "  Ann_T " });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: "u1", username: "Ann_T" });
    expect(ctx.byUser.get("u1")).toBe("Ann_T");
  });

  it.each([
    [{}, "Username is required."],
    [{ username: 42 }, "Username is required."],
    [{ username: "ab" }, "Username must be at least 3 characters."],
    [{ username: "a@b.com" }, "Use only letters, numbers, underscores and hyphens."],
    [{ username: "admin" }, "That username isn't available."],
  ])("rejects invalid input %j with 400 and never touches the store", async (body, error) => {
    const res = await call("PUT", "/me/username", "u1", body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error });
    expect(ctx.store.setUsername).not.toHaveBeenCalled();
  });

  it("returns 409 when another player already has the username, case-insensitively", async () => {
    await call("PUT", "/me/username", "u1", { username: "Ann_T" });
    const res = await call("PUT", "/me/username", "u2", { username: "ann_t" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "That username is taken." });
    expect(ctx.byUser.has("u2")).toBe(false);
  });

  it("lets a player re-save or re-case their own username", async () => {
    await call("PUT", "/me/username", "u1", { username: "Ann_T" });
    const res = await call("PUT", "/me/username", "u1", { username: "ANN_T" });
    expect(res.status).toBe(200);
    expect(ctx.byUser.get("u1")).toBe("ANN_T");
  });

  it("lets a player change to a different username", async () => {
    await call("PUT", "/me/username", "u1", { username: "Ann_T" });
    await call("PUT", "/me/username", "u1", { username: "Ann_New" });
    expect(ctx.byUser.get("u1")).toBe("Ann_New");
  });

  it("passes only non-empty name/email from the token to the store", async () => {
    await call("PUT", "/me/username", "u1", { username: "Ann_T" }, { "x-test-name": "Ann", "x-test-email": "" });
    expect(ctx.store.setUsername).toHaveBeenCalledWith("u1", "Ann_T", { name: "Ann" });
  });

  it("takes the user id from the token, never from the request body", async () => {
    await call("PUT", "/me/username", "u1", { username: "Ann_T", userId: "someone-else" });
    expect(ctx.store.setUsername).toHaveBeenCalledWith("u1", "Ann_T", {});
    expect(ctx.byUser.has("someone-else")).toBe(false);
  });

  it("returns 500 with a generic message when the store fails", async () => {
    vi.mocked(ctx.store.setUsername).mockRejectedValueOnce(new Error("mongo exploded: secret details"));
    const res = await call("PUT", "/me/username", "u1", { username: "Ann_T" });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});
