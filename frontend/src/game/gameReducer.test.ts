import { describe, it, expect } from "vitest";
import { GameAction, GameState, createInitialState, gameReducer } from "./gameReducer";

// CHQ: Claude AI (Sonnet) generated file


const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);
const player = (index: number): GameAction => ({ type: "PLAYER_MOVE", index });
const computer = (index: number): GameAction => ({ type: "COMPUTER_MOVE", index });

describe("createInitialState", () => {
  it("starts with an empty board, X to move, no winner, time 0", () => {
    expect(createInitialState(4)).toEqual({
      board: Array(16).fill(null),
      boardSize: 4,
      isXNext: true,
      winner: null,
      winningLine: null,
      timeSeconds: 0,
    });
  });
});

describe("PLAYER_MOVE", () => {
  it("places X and passes the turn", () => {
    const s = run(createInitialState(3), player(4));
    expect(s.board[4]).toBe("X");
    expect(s.isXNext).toBe(false);
  });

  it("does not mutate the previous state", () => {
    const before = createInitialState(3);
    run(before, player(0));
    expect(before.board[0]).toBeNull();
  });

  it("ignores occupied cells", () => {
    const s1 = run(createInitialState(3), player(4), computer(4));
    expect(s1.board[4]).toBe("X");
    expect(s1.isXNext).toBe(false);
  });

  it("ignores moves when it is the computer's turn", () => {
    const s1 = run(createInitialState(3), player(0));
    expect(gameReducer(s1, player(1))).toBe(s1);
  });

  it.each([-1, 9, 1.5, NaN])("ignores out-of-range index %s", (i) => {
    const s = createInitialState(3);
    expect(gameReducer(s, player(i))).toBe(s);
  });

  it("ends the game with the winning line when X completes a row", () => {
    const s = run(createInitialState(3), player(0), computer(3), player(1), computer(4), player(2));
    expect(s.winner).toBe("X");
    expect(s.winningLine).toEqual([0, 1, 2]);
    expect(s.isXNext).toBe(true); // turn does not flip after the game ends
  });

  it("ignores moves after the game is over", () => {
    const won = run(createInitialState(3), player(0), computer(3), player(1), computer(4), player(2));
    expect(gameReducer(won, player(8))).toBe(won);
  });
});

describe("COMPUTER_MOVE", () => {
  it("places O and passes the turn back", () => {
    const s = run(createInitialState(3), player(0), computer(4));
    expect(s.board[4]).toBe("O");
    expect(s.isXNext).toBe(true);
  });

  it("ignores moves when it is the player's turn", () => {
    const s = createInitialState(3);
    expect(gameReducer(s, computer(0))).toBe(s);
  });

  it("can win the game", () => {
    const s = run(
      createInitialState(3),
      player(0), computer(3), player(1), computer(4), player(8), computer(5)
    );
    expect(s.winner).toBe("O");
    expect(s.winningLine).toEqual([3, 4, 5]);
  });

  it("detects a draw", () => {
    // X O X / X O O / O X X
    const s = run(
      createInitialState(3),
      player(0), computer(1), player(2), computer(4), player(3), computer(5),
      player(7), computer(6), player(8)
    );
    expect(s.winner).toBe("draw");
    expect(s.winningLine).toBeNull();
  });
});

describe("TICK", () => {
  it("increments time while the game is running", () => {
    expect(run(createInitialState(3), { type: "TICK" }, { type: "TICK" }).timeSeconds).toBe(2);
  });

  it("does not advance after the game is over", () => {
    const won = run(
      createInitialState(3),
      player(0), computer(3), player(1), computer(4), { type: "TICK" }, player(2)
    );
    expect(won.timeSeconds).toBe(1);
    expect(gameReducer(won, { type: "TICK" })).toBe(won);
  });
});

describe("RESET", () => {
  it("clears everything but keeps the board size by default", () => {
    const s = run(createInitialState(5), player(0), { type: "TICK" }, { type: "RESET" });
    expect(s).toEqual(createInitialState(5));
  });

  it("can switch board size", () => {
    expect(run(createInitialState(3), { type: "RESET", boardSize: 6 }).board).toHaveLength(36);
  });
});