import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge accessibility", () => {
  it("renders with proper status role and aria-label", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByRole("status");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("aria-label")).toBeTruthy();
  });
});
