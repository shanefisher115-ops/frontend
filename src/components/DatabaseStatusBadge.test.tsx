import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge Accessibility & ARIA", () => {
  it("renders status badge with correct status role and aria-live attribute", () => {
    render(<DatabaseStatusBadge />);
    const statusBadge = screen.getByTestId("status-database-mode");

    expect(statusBadge).not.toBeNull();
    expect(statusBadge.getAttribute("role")).toBe("status");
    expect(statusBadge.getAttribute("aria-live")).toBe("polite");
    expect(statusBadge.getAttribute("aria-label")).toContain("Database status:");
  });
});
