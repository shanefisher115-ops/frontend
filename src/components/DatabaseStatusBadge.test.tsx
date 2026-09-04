import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge", () => {
  it("renders status badge with accessibility attributes", () => {
    render(<DatabaseStatusBadge />);

    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-label");
    expect(badge.getAttribute("aria-label")).toMatch(/Database status:/i);
  });
});
