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

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.includes("/leaderboard")) {
    return json(boards[new URL(url).searchParams.get("boardSize") ?? ""] ?? []);
  }
  if (url.endsWith("/scores") && init?.method === "POST") return json({ ok: true });
  return new Response("not found", { status: 404 });
});

const leaderboardCalls = () => fetchMock.mock.calls.filter(([u]) => String(u).includes("/leaderboard"));
const scorePosts = () => fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");

const renderApp = async () => {
  await act(async () => {
    render(<App />);
  });
};

beforeEach(() => {
  localStorage.clear();
  sdk.reset();
  fetchMock.mockClear();
  vi.mocked(getComputerMove).mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("App (integration: real hooks, API client and auth store; stubbed network)", () => {
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

  it("restores a stored session, and signing out clears it", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ann));
    await renderApp();
    expect(screen.getByText("Welcome, Ann!")).toBeTruthy();

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

    act(() =>
      sdk.props!.onSuccess(
        new CustomEvent("success", {
          detail: { user: { userId: "u1", email: "a@b.c", name: "Ann" }, sessionJwt: "jwt-ann" },
        })
      )
    );

    expect(screen.getByText("Welcome, Ann!")).toBeTruthy();
    expect(screen.queryByTestId("descope")).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(ann);
  });

  it("saves a win with the signed-in user's token, then refreshes the leaderboard on return home", async () => {
    vi.useFakeTimers();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ann));
    // Computer plays 3 then 4; the player takes the top row.
    vi.mocked(getComputerMove).mockReturnValueOnce(3).mockReturnValueOnce(4);

    await renderApp();
    const leaderboardFetchesAtHome = leaderboardCalls().length;

    fireEvent.click(screen.getByRole("button", { name: "3x3 Mode" }));
    const cells = () => Array.from(document.querySelectorAll<HTMLButtonElement>("button.cell"));
    expect(cells()).toHaveLength(9);

    fireEvent.click(cells()[0]);
    await act(async () => void (await vi.advanceTimersByTimeAsync(400)));
    fireEvent.click(cells()[1]);
    await act(async () => void (await vi.advanceTimersByTimeAsync(400)));
    fireEvent.click(cells()[2]);
    await act(async () => void (await vi.advanceTimersByTimeAsync(0)));

    expect(screen.getByText("Player X Wins!")).toBeTruthy();

    const posts = scorePosts();
    expect(posts).toHaveLength(1);
    const [url, init] = posts[0];
    expect(String(url)).toBe("http://localhost:5000/api/scores");
    expect(new Headers(init!.headers).get("Authorization")).toBe("Bearer jwt-ann");
    expect(JSON.parse(init!.body as string)).toEqual({ result: "win", timeSeconds: 0, boardSize: 3 });

    // Back on the home screen the leaderboard is fetched again, so the new score can appear.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "← Home" }));
    });
    expect(leaderboardCalls().length).toBe(leaderboardFetchesAtHome + 1);
  });

  it("does not call the scores endpoint for a guest who wins", async () => {
    vi.useFakeTimers();
    vi.mocked(getComputerMove).mockReturnValueOnce(3).mockReturnValueOnce(4);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await renderApp();
    fireEvent.click(screen.getByRole("button", { name: "3x3 Mode" }));
    const cells = () => Array.from(document.querySelectorAll<HTMLButtonElement>("button.cell"));

    fireEvent.click(cells()[0]);
    await act(async () => void (await vi.advanceTimersByTimeAsync(400)));
    fireEvent.click(cells()[1]);
    await act(async () => void (await vi.advanceTimersByTimeAsync(400)));
    fireEvent.click(cells()[2]);
    await act(async () => void (await vi.advanceTimersByTimeAsync(0)));

    expect(screen.getByText("Player X Wins!")).toBeTruthy();
    expect(scorePosts()).toHaveLength(0);
    log.mockRestore();
  });
});
