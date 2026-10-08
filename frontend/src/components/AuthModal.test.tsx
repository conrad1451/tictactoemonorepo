// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AuthModal } from "./AuthModal";
import { sdk } from "../test/descopeSdkMock";

vi.mock("@descope/react-sdk", () => import("../test/descopeSdkMock"));

beforeEach(() => sdk.reset());

const setup = (overrides: Partial<React.ComponentProps<typeof AuthModal>> = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onAuthSuccess: vi.fn(() => true),
    ...overrides,
  };
  const view = render(<AuthModal {...props} />);
  return { props, ...view };
};

const succeed = (detail: object) =>
  act(() => sdk.props!.onSuccess(new CustomEvent("success", { detail })));

describe("AuthModal", () => {
  it("renders nothing when closed", () => {
    const { container } = setup({ isOpen: false });
    expect(container.firstChild).toBeNull();
    expect(sdk.props).toBeNull();
  });

  it("shows the winning time when there is one", () => {
    setup({ elapsedTime: 12 });
    expect(screen.getByRole("heading", { name: "Save Your Score" })).toBeTruthy();
    expect(screen.getByText("12s")).toBeTruthy();
  });

  it("shows a generic sign-in message without a time", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeTruthy();
    expect(screen.queryByText(/winning time/)).toBeNull();
  });

  it("maps a successful sign-in, hands it to onAuthSuccess and closes", () => {
    const { props } = setup();
    succeed({ user: { userId: "u1", email: "a@b.c", name: "Ann" }, sessionJwt: "jwt" });
    expect(props.onAuthSuccess).toHaveBeenCalledWith({
      userId: "u1",
      email: "a@b.c",
      name: "Ann",
      sessionJwt: "jwt",
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("falls back to the SDK user and session token", () => {
    sdk.user = { userId: "sdk1", name: "Sam" };
    sdk.token = "sdk-token";
    const { props } = setup();
    succeed({});
    expect(props.onAuthSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "sdk1", name: "Sam", sessionJwt: "sdk-token" })
    );
  });

  it("shows an error and stays open when there is no session token", () => {
    const { props } = setup();
    succeed({ user: { userId: "u1" } });
    expect(screen.getByText("Authentication failed. Please try again.")).toBeTruthy();
    expect(props.onAuthSuccess).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("shows a storage error and stays open when the session can't be saved", () => {
    const { props } = setup({ onAuthSuccess: vi.fn(() => false) });
    succeed({ user: { userId: "u1" }, sessionJwt: "jwt" });
    expect(screen.getByText(/couldn't be saved/)).toBeTruthy();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("shows an error when Descope reports one", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setup();
    act(() => sdk.props!.onError(new CustomEvent("error", { detail: "bad" })));
    expect(screen.getByText("Authentication failed. Please try again.")).toBeTruthy();
    spy.mockRestore();
  });

  it("closes from the × button", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("clears a previous error when reopened", () => {
    const { props, rerender } = setup();
    succeed({ user: { userId: "u1" } });
    expect(screen.queryByText("Authentication failed. Please try again.")).toBeTruthy();

    rerender(<AuthModal {...props} isOpen={false} />);
    rerender(<AuthModal {...props} isOpen={true} />);
    expect(screen.queryByText("Authentication failed. Please try again.")).toBeNull();
  });
});
