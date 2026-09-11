import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge", () => {
  it("renders status badge with appropriate accessibility attributes", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-label");
  });
});
