import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders with role status and accessible aria-label", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("data-testid", "status-database-mode");
    expect(badge.getAttribute("aria-label")).toMatch(/Database status:/);
  });
});
