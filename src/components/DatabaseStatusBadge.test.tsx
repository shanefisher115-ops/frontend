import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge", () => {
  it("renders with status role and polite live region", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge.getAttribute("aria-label")).toContain("Database status:");
  });
});
