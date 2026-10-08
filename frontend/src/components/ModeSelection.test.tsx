// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModeSelection } from "./ModeSelection";

describe("ModeSelection", () => {
  it("offers 3x3 through 7x7 by default", () => {
    render(<ModeSelection onStart={() => {}} />);
    for (const n of [3, 4, 5, 6, 7]) {
      expect(screen.getByRole("button", { name: `${n}x${n} Mode` })).toBeTruthy();
    }
  });

  it("calls onStart with the chosen size", () => {
    const onStart = vi.fn();
    render(<ModeSelection onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: "5x5 Mode" }));
    expect(onStart).toHaveBeenCalledWith(5);
  });

  it("renders only the sizes it is given", () => {
    render(<ModeSelection onStart={() => {}} sizes={[3, 4]} />);
    expect(screen.queryByRole("button", { name: "7x7 Mode" })).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
