// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { UsernameModal } from "./UsernameModal";
import { SaveUsernameResult } from "../hooks/useProfile";

const setup = (props: Partial<React.ComponentProps<typeof UsernameModal>> = {}) => {
  const onSubmit = vi.fn<(u: string) => Promise<SaveUsernameResult>>().mockResolvedValue({ ok: true });
  const onClose = vi.fn();
  const view = render(<UsernameModal isOpen onSubmit={onSubmit} onClose={onClose} {...props} />);
  return { onSubmit, onClose, ...view };
};

const input = () => screen.getByLabelText("Username") as HTMLInputElement;
const type = (value: string) => fireEvent.change(input(), { target: { value } });
const submit = () => act(async () => void fireEvent.click(screen.getByRole("button", { name: "Save username" })));

describe("UsernameModal", () => {
  it("renders nothing when closed", () => {
    const { container } = setup({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it("asks a new player to choose a username and offers to skip", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Choose a username" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeTruthy();
    expect(input().value).toBe("");
  });

  it("switches to 'change' wording and prefills when there is already a username", () => {
    setup({ currentUsername: "Ann_T" });
    expect(screen.getByRole("heading", { name: "Change your username" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(input().value).toBe("Ann_T");
  });

  it("limits the input to 20 characters", () => {
    setup();
    expect(input().maxLength).toBe(20);
  });

  it("submits what was typed", async () => {
    const { onSubmit } = setup();
    type("Ann_T");
    await submit();
    expect(onSubmit).toHaveBeenCalledWith("Ann_T");
  });

  it("submits on Enter (it is a real form)", async () => {
    const { onSubmit } = setup();
    type("Ann_T");
    await act(async () => void fireEvent.submit(input().closest("form")!));
    expect(onSubmit).toHaveBeenCalledWith("Ann_T");
  });

  it("shows the error from a failed save and keeps the input", async () => {
    const { onSubmit } = setup();
    onSubmit.mockResolvedValue({ ok: false, error: "That username is taken." });
    type("Ann_T");
    await submit();
    expect(screen.getByRole("alert").textContent).toBe("That username is taken.");
    expect(input().value).toBe("Ann_T");
  });

  it("clears the previous error on the next attempt", async () => {
    const { onSubmit } = setup();
    onSubmit.mockResolvedValueOnce({ ok: false, error: "That username is taken." });
    type("Ann_T");
    await submit();
    await submit();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("disables the buttons while saving, so it can't be double-submitted", async () => {
    let finish!: (r: SaveUsernameResult) => void;
    const { onSubmit } = setup();
    onSubmit.mockReturnValue(new Promise((r) => (finish = r)));
    type("Ann_T");
    await submit();
    expect((screen.getByRole("button", { name: "Save username" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Skip for now" }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => finish({ ok: true }));
    expect((screen.getByRole("button", { name: "Save username" }) as HTMLButtonElement).disabled).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("calls onClose from Skip and from ×", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("resets the input and error when reopened", async () => {
    const { onSubmit, rerender, onClose } = setup();
    onSubmit.mockResolvedValue({ ok: false, error: "nope" });
    type("Ann_T");
    await submit();
    rerender(<UsernameModal isOpen={false} onSubmit={onSubmit} onClose={onClose} />);
    rerender(<UsernameModal isOpen onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(input().value).toBe("");
  });
});
