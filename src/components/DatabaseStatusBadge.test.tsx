import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge", () => {
  it("renders with role status and aria-live polite", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-atomic", "true");
    expect(badge).toHaveAttribute("aria-label");
  });
});
