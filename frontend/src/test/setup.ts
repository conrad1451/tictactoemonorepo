import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// CHQ: Claude AI (Sonnet) generated file

// Tell React we're in a test environment so act() works without warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Vitest has no globals by default, so RTL's auto-cleanup isn't registered.
afterEach(() => cleanup());