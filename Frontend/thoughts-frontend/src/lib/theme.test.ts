import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyTheme, getInitialTheme } from "./theme";

describe("theme initialization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("uses the saved theme instead of the system preference", () => {
    localStorage.setItem("theme", "dark");
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);

    expect(getInitialTheme()).toBe("dark");
  });

  it("respects a saved light theme when the system prefers dark", () => {
    localStorage.setItem("theme", "light");
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);

    expect(getInitialTheme()).toBe("light");
  });

  it("uses the system preference when no theme has been saved", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);

    expect(getInitialTheme()).toBe("dark");
  });

  it("applies both dark and light themes to the document", () => {
    applyTheme("dark");
    expect(document.documentElement).toHaveClass("dark");

    applyTheme("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
