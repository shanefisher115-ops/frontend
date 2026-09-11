import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge", () => {
  it("renders status badge with appropriate accessibility attributes", () => {
    render(<DatabaseStatusBadge />);

    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("role")).toBe("status");
    expect(badge.getAttribute("aria-live")).toBe("polite");
    expect(badge.getAttribute("aria-label")).toContain("Database status:");
  });
});
