import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge component", () => {
  test("renders status badge with correct role and aria label", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("role")).toBe("status");
    expect(badge.getAttribute("aria-live")).toBe("polite");
    expect(badge.getAttribute("aria-label")).toContain("Database Status");
  });
});
