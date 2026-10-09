// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { App } from "./App";
import { STORAGE_KEY } from "./services/auth";
import { getComputerMove } from "./game/computerPlayer";
import { sdk } from "./test/descopeSdkMock";

vi.mock("@descope/react-sdk", () => import("./test/descopeSdkMock"));
vi.mock("./game/computerPlayer", () => ({ getComputerMove: vi.fn() }));

const ann = { userId: "u1", email: "a@b.c", name: "Ann", sessionJwt: "jwt-ann" };

const boards: Record<string, unknown[]> = {
  "3": [{ userId: "1", username: "Ann", bestTime: 4, totalGames: 3 }],
  "5": [{ userId: "2", username: "Zed", bestTime: 21, totalGames: 1 }],
};

// State of the stubbed backend's profile for the signed-in player ("u1").
const profile = { username: "ann_t" as string | null };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method ?? "GET";

  if (url.includes("/leaderboard")) {
    return json(boards[new URL(url).searchParams.get("boardSize") ?? ""] ?? []);
  }
  if (url.endsWith("/api/me") && method === "GET") {
    return json({ userId: "u1", username: profile.username });
  }
  if (url.endsWith("/api/me/username") && method === "PUT") {
    const { username } = JSON.parse(init!.body as string);
    if (String(username).toLowerCase() === "taken") return json({ error: "That username is taken." }, 409);
    profile.username = username;
    return json({ userId: "u1", username });
  }
  if (url.endsWith("/api/scores") && method === "POST") return json({ ok: true });
  return new Response("not found", { status: 404 });
});

const calls = (pred: (url: string, init?: RequestInit) => boolean) =>
  fetchMock.mock.calls.filter(([u, init]) => pred(String(u), init));
const leaderboardCalls = () => calls((u) => u.includes("/leaderboard"));
const meCalls = () => calls((u) => u.endsWith("/api/me"));
const usernamePuts = () => calls((u, init) => u.endsWith("/api/me/username") && init?.method === "PUT");
const scorePosts = () => calls((u, init) => u.endsWith("/api/scores") && init?.method === "POST");

const renderApp = async () => {
  await act(async () => {
    render(<App />);
  });
};

const signInAsAnn = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(ann));
const usernameInput = () => screen.getByLabelText("Username") as HTMLInputElement;
const typeUsername = (value: string) => fireEvent.change(usernameInput(), { target: { value } });
const saveUsername = () => act(async () => void fireEvent.click(screen.getByRole("button", { name: "Save username" })));

beforeEach(() => {
  localStorage.clear();
  sdk.reset();
  profile.username = "ann_t";
  fetchMock.mockClear();
  vi.mocked(getComputerMove).mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("App: home and leaderboard (stubbed network)", () => {
  it("loads the 3x3 leaderboard from the API on the home screen", async () => {
    await renderApp();
    expect(screen.getByText("#1 Ann — 4s (3 games)")).toBeTruthy();
    expect(String(leaderboardCalls()[0][0])).toBe("http://localhost:5000/api/leaderboard?boardSize=3");
  });

  it("fetches and shows another board's scores when its tab is clicked", async () => {
    await renderApp();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "5x5" }));
    });
    expect(screen.getByText("#1 Zed — 21s (1 games)")).toBeTruthy();
    expect(screen.queryByText(/Ann/)).toBeNull();
  });
});

describe("App: session", () => {
  it("restores a stored session, and signing out clears it", async () => {
    signInAsAnn();
    await renderApp();
    expect(screen.getByText("Welcome, ann_t!")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));
    expect(screen.getByRole("button", { name: "Sign In" })).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("ignores corrupted stored data instead of crashing", async () => {
    localStorage.setItem(STORAGE_KEY, "{broken");
    await renderApp();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeTruthy();
  });

  it("signs in through the modal, persists the session and closes the modal", async () => {
    await renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    expect(screen.getByTestId("descope")).toBeTruthy();

    await act(async () => {
      sdk.props!.onSuccess(
        new CustomEvent("success", {
          detail: { user: { userId: "u1", email: "a@b.c", name: "Ann" }, sessionJwt: "jwt-ann" },
        })
      );
    });

    expect(screen.getByText("Welcome, ann_t!")).toBeTruthy();
    expect(screen.queryByTestId("descope")).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(ann);
  });

  it("never asks the server for a profile while signed out", async () => {
    await renderApp();
    expect(meCalls()).toHaveLength(0);
  });
});

describe("App: choosing a username", () => {
  it("shows the player's username in the header instead of their sign-in name", async () => {
    signInAsAnn();
    await renderApp();
    expect(screen.getByText("Welcome, ann_t!")).toBeTruthy();
    expect(screen.queryByText("Welcome, Ann!")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Choose a username" })).toBeNull();
  });

  it("prompts right after the first sign-in, saves the choice and shows it", async () => {
    profile.username = null;
    await renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await act(async () => {
      sdk.props!.onSuccess(
        new CustomEvent("success", {
          detail: { user: { userId: "u1", email: "a@b.c", name: "Ann" }, sessionJwt: "jwt-ann" },
        })
      );
    });
    await act(async () => {});

    expect(screen.getByRole("heading", { name: "Choose a username" })).toBeTruthy();
    expect(screen.getByText("Welcome, Ann!")).toBeTruthy(); // falls back to the sign-in name for now

    typeUsername("Ann_T");
    await saveUsername();

    expect(usernamePuts()).toHaveLength(1);
    const [url, init] = usernamePuts()[0];
    expect(String(url)).toBe("http://localhost:5000/api/me/username");
    expect(new Headers(init!.headers).get("Authorization")).toBe("Bearer jwt-ann");
    expect(JSON.parse(init!.body as string)).toEqual({ username: "Ann_T" });

    expect(screen.queryByRole("heading", { name: "Choose a username" })).toBeNull();
    expect(screen.getByText("Welcome, Ann_T!")).toBeTruthy();
  });

  it("shows validation errors without calling the server", async () => {
    profile.username = null;
    signInAsAnn();
    await renderApp();

    typeUsername("a@b.com");
    await saveUsername();
    expect(screen.getByRole("alert").textContent).toBe("Use only letters, numbers, underscores and hyphens.");

    typeUsername("ab");
    await saveUsername();
    expect(screen.getByRole("alert").textContent).toBe("Username must be at least 3 characters.");

    expect(usernamePuts()).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "Choose a username" })).toBeTruthy();
  });

  it("shows the server's message when the username is taken, and stays open", async () => {
    profile.username = null;
    signInAsAnn();
    await renderApp();

    typeUsername("Taken");
    await saveUsername();

    expect(usernamePuts()).toHaveLength(1);
    expect(screen.getByRole("alert").textContent).toBe("That username is taken.");
    expect(screen.getByRole("heading", { name: "Choose a username" })).toBeTruthy();
    expect(profile.username).toBeNull();
  });

  it("lets a player skip, then come back from the header", async () => {
    profile.username = null;
    signInAsAnn();
    await renderApp();
    expect(screen.getByRole("heading", { name: "Choose a username" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(screen.queryByRole("heading", { name: "Choose a username" })).toBeNull();
    expect(screen.getByText("Welcome, Ann!")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Set username" }));
    expect(screen.getByRole("heading", { name: "Choose a username" })).toBeTruthy();
  });

  it("lets a player change an existing username", async () => {
    signInAsAnn();
    await renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Change username" }));
    expect(screen.getByRole("heading", { name: "Change your username" })).toBeTruthy();
    expect(usernameInput().value).toBe("ann_t");

    typeUsername("ann_new");
    await saveUsername();

    expect(screen.getByText("Welcome, ann_new!")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Change your username" })).toBeNull();
  });

  it("does not block play when the profile can't be loaded", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    signInAsAnn();
    fetchMock.mockImplementationOnce(async () => json({ error: "down" }, 500)); // leaderboard
    fetchMock.mockImplementationOnce(async () => json({ error: "down" }, 500)); // profile
    await renderApp();
    expect(screen.queryByRole("heading", { name: "Choose a username" })).toBeNull();
    expect(screen.getByRole("button", { name: "3x3 Mode" })).toBeTruthy();
    spy.mockRestore();
  });
});

describe("App: playing a game", () => {
  const playTopRowWin = async () => {
    const cells = () => Array.from(document.querySelectorAll<HTMLButtonElement>("button.cell"));
    fireEvent.click(cells()[0]);
    await act(async () => void (await vi.advanceTimersByTimeAsync(400)));
    fireEvent.click(cells()[1]);
    await act(async () => void (await vi.advanceTimersByTimeAsync(400)));
    fireEvent.click(cells()[2]);
    await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
  };

  it("saves a win with the signed-in user's token, then refreshes the leaderboard on return home", async () => {
    vi.useFakeTimers();
    signInAsAnn();
    vi.mocked(getComputerMove).mockReturnValueOnce(3).mockReturnValueOnce(4);

    await renderApp();
    const leaderboardFetchesAtHome = leaderboardCalls().length;

    fireEvent.click(screen.getByRole("button", { name: "3x3 Mode" }));
    expect(document.querySelectorAll("button.cell")).toHaveLength(9);
    await playTopRowWin();

    expect(screen.getByText("Player X Wins!")).toBeTruthy();

    const posts = scorePosts();
    expect(posts).toHaveLength(1);
    const [url, init] = posts[0];
    expect(String(url)).toBe("http://localhost:5000/api/scores");
    expect(new Headers(init!.headers).get("Authorization")).toBe("Bearer jwt-ann");
    expect(JSON.parse(init!.body as string)).toEqual({ result: "win", timeSeconds: 0, boardSize: 3 });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "← Home" }));
    });
    expect(leaderboardCalls().length).toBe(leaderboardFetchesAtHome + 1);
  });

  it("does not call the scores endpoint for a guest who wins", async () => {
    vi.useFakeTimers();
    vi.mocked(getComputerMove).mockReturnValueOnce(3).mockReturnValueOnce(4);

    await renderApp();
    fireEvent.click(screen.getByRole("button", { name: "3x3 Mode" }));
    await playTopRowWin();

    expect(screen.getByText("Player X Wins!")).toBeTruthy();
    expect(scorePosts()).toHaveLength(0);
  });
});
