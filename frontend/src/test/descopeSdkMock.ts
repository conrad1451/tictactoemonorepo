// Stand-in for "@descope/react-sdk" in tests.
// Usage in a test file:
//   vi.mock("@descope/react-sdk", () => import("../test/descopeSdkMock"));
//   import { sdk } from "../test/descopeSdkMock";
import React from "react";

export interface DescopeProps {
  onSuccess: (e: CustomEvent) => void;
  onError: (e: Event) => void;
}

export const sdk = {
  props: null as DescopeProps | null,
  user: undefined as unknown,
  token: null as string | null,
  reset() {
    this.props = null;
    this.user = undefined;
    this.token = null;
  },
};

export const Descope = (props: DescopeProps) => {
  sdk.props = props;
  return React.createElement("div", { "data-testid": "descope" });
};

export const useUser = () => ({ user: sdk.user });
export const getSessionToken = () => sdk.token;
