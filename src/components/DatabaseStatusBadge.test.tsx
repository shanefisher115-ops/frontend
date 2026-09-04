import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders status badge with role status and aria-label", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/Database connection status:/)
    );
  });
});
