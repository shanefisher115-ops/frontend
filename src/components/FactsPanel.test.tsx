import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Session } from "@supabase/supabase-js";

/**
 * FactsPanel tests. The panel depends on two modules that are re-mocked per
 * test group (mock vs live mode, signed out vs signed in), so each test
 * resets modules, applies `vi.doMock`, and dynamically imports the component.
 */

const mockSession = {
  access_token: "test-token",
  user: { id: "user-1", email: "shane@example.com" },
} as unknown as Session;

const sampleFacts = [
  {
    id: "fact-1",
    topic: "PrimordiaOS Task Claiming",
    summary: "Realms claim tasks through a governed claiming protocol.",
    key_points: ["Claims are recorded before execution", "Failures trace to claims"],
    sources: ["https://github.com/shanefisher115-ops/PrimordiaOS-Origin"],
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "fact-2",
    topic: "PrimordiaFlow Signal Pipeline",
    summary: "The dashboard reads signals from Supabase with realtime updates.",
    key_points: ["Public reads, privileged server writes"],
    sources: ["not-a-url"],
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

function mockFactsModule(overrides: Partial<Record<string, unknown>> = {}) {
  vi.doMock("../lib/facts", () => ({
    fetchFacts: vi.fn().mockResolvedValue({ facts: sampleFacts, mode: "live", error: null }),
    insertFact: vi.fn().mockResolvedValue({ error: null }),
    subscribeToFacts: vi.fn().mockReturnValue(() => {}),
    getFactSession: vi.fn().mockResolvedValue(mockSession),
    signInForFacts: vi.fn().mockResolvedValue({ error: null }),
    signOutFromFacts: vi.fn().mockResolvedValue(undefined),
    onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  }));
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("FactsPanel — mock mode", () => {
  it("shows labelled demo data with no auth gate and no write controls", async () => {
    vi.doMock("../lib/supabase", () => ({ databaseMode: "mock" }));
    vi.doMock("../lib/facts", () => ({
      fetchFacts: vi
        .fn()
        .mockResolvedValue({ facts: sampleFacts, mode: "mock", error: null }),
      insertFact: vi.fn(),
      subscribeToFacts: vi.fn().mockReturnValue(() => {}),
      getFactSession: vi.fn().mockResolvedValue(null),
      signInForFacts: vi.fn(),
      signOutFromFacts: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    }));

    const { FactsPanel } = await import("./FactsPanel");
    await act(async () => {
      render(<FactsPanel />);
    });

    await waitFor(() => {
      expect(screen.getByText("PrimordiaOS Task Claiming")).toBeDefined();
    });
    expect(screen.getByText(/source: demo data/i)).toBeDefined();
    expect(screen.getByText(/add Supabase credentials/i)).toBeDefined(); // demo notice
    // Signed-out UI must not appear in mock mode.
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    expect(screen.queryByText("Sign out")).toBeNull();
    expect(screen.queryByText("Add fact")).toBeNull();
  });
});

describe("FactsPanel — live mode, signed out", () => {
  it("shows a sign-in form and does not query facts", async () => {
    vi.doMock("../lib/supabase", () => ({ databaseMode: "live" }));
    const fetchFacts = vi.fn();
    vi.doMock("../lib/facts", () => ({
      fetchFacts,
      insertFact: vi.fn(),
      subscribeToFacts: vi.fn().mockReturnValue(() => {}),
      getFactSession: vi.fn().mockResolvedValue(null),
      signInForFacts: vi.fn().mockResolvedValue({ error: null }),
      signOutFromFacts: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    }));

    const { FactsPanel } = await import("./FactsPanel");
    await act(async () => {
      render(<FactsPanel />);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
    });
    expect(fetchFacts).not.toHaveBeenCalled();
    expect(screen.queryByText("PrimordiaOS Task Claiming")).toBeNull();
  });

  it("surfaces sign-in errors", async () => {
    vi.doMock("../lib/supabase", () => ({ databaseMode: "live" }));
    vi.doMock("../lib/facts", () => ({
      fetchFacts: vi.fn(),
      insertFact: vi.fn(),
      subscribeToFacts: vi.fn().mockReturnValue(() => {}),
      getFactSession: vi.fn().mockResolvedValue(null),
      signInForFacts: vi
        .fn()
        .mockResolvedValue({ error: "Invalid email or password." }),
      signOutFromFacts: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue(() => {}),
    }));

    const { FactsPanel } = await import("./FactsPanel");
    await act(async () => {
      render(<FactsPanel />);
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "shane@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeDefined();
    });
  });
});

describe("FactsPanel — live mode, signed in", () => {
  it("loads and renders facts with sources as links only for URLs", async () => {
    vi.doMock("../lib/supabase", () => ({ databaseMode: "live" }));
    mockFactsModule();

    const { FactsPanel } = await import("./FactsPanel");
    await act(async () => {
      render(<FactsPanel />);
    });

    await waitFor(() => {
      expect(screen.getByText("PrimordiaOS Task Claiming")).toBeDefined();
    });
    // URL source rendered as a link; non-URL source rendered as plain text.
    expect(
      screen.getByRole("link", { name: "https://github.com/shanefisher115-ops/PrimordiaOS-Origin" }),
    ).toBeDefined();
    expect(screen.getByText("not-a-url")).toBeDefined();
    expect(screen.queryByRole("link", { name: "not-a-url" })).toBeNull();
  });

  it("filters facts by topic, summary, and key point", async () => {
    vi.doMock("../lib/supabase", () => ({ databaseMode: "live" }));
    mockFactsModule();

    const { FactsPanel } = await import("./FactsPanel");
    await act(async () => {
      render(<FactsPanel />);
    });
    await waitFor(() => {
      expect(screen.getByText("PrimordiaOS Task Claiming")).toBeDefined();
    });

    const filter = screen.getByLabelText("Filter facts");
    await act(async () => {
      fireEvent.change(filter, { target: { value: "Signal Pipeline" } });
    });
    expect(screen.getByText("PrimordiaFlow Signal Pipeline")).toBeDefined();
    expect(screen.queryByText("PrimordiaOS Task Claiming")).toBeNull();

    await act(async () => {
      fireEvent.change(filter, { target: { value: "Claims are recorded" } });
    });
    expect(screen.getByText("PrimordiaOS Task Claiming")).toBeDefined();
    expect(screen.queryByText("PrimordiaFlow Signal Pipeline")).toBeNull();
  });

  it("adds a fact through the form and refetches", async () => {
    vi.doMock("../lib/supabase", () => ({ databaseMode: "live" }));
    mockFactsModule();

    const { FactsPanel } = await import("./FactsPanel");
    await act(async () => {
      render(<FactsPanel />);
    });
    await waitFor(() => {
      expect(screen.getByText("Add fact")).toBeDefined();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Add fact"));
    });

    // Validation: submit the empty form directly (bypasses jsdom's native
    // required-field validation so React's onSubmit validation runs).
    const form = document.querySelector("form.facts__form") as HTMLFormElement;
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(screen.getByText("Topic and summary are required.")).toBeDefined();
    });

    // Fill and submit.
    fireEvent.change(screen.getByLabelText("Topic *"), {
      target: { value: "New Topic" },
    });
    fireEvent.change(screen.getByLabelText("Summary *"), {
      target: { value: "A fresh fact." },
    });
    fireEvent.change(screen.getByLabelText("Key points (one per line)"), {
      target: { value: "Point one\nPoint two" },
    });
    fireEvent.change(screen.getByLabelText("Sources (one per line)"), {
      target: { value: "https://example.com" },
    });

    const { insertFact } = await import("../lib/facts");
    await act(async () => {
      fireEvent.submit(
        document.querySelector("form.facts__form") as HTMLFormElement,
      );
    });

    await waitFor(() => {
      expect(insertFact).toHaveBeenCalledWith({
        topic: "New Topic",
        summary: "A fresh fact.",
        key_points: ["Point one", "Point two"],
        sources: ["https://example.com"],
      });
    });
  });

  it("shows an error state when the live query fails (no mock fallback)", async () => {
    vi.doMock("../lib/supabase", () => ({ databaseMode: "live" }));
    mockFactsModule({
      fetchFacts: vi
        .fn()
        .mockResolvedValue({ facts: [], mode: "live", error: "Permission denied — sign in above." }),
    });

    const { FactsPanel } = await import("./FactsPanel");
    await act(async () => {
      render(<FactsPanel />);
    });

    await waitFor(() => {
      expect(screen.getByText("Permission denied — sign in above.")).toBeDefined();
    });
    expect(screen.queryByText("PrimordiaOS Task Claiming")).toBeNull();
  });

  it("offers sign-out and calls it", async () => {
    vi.doMock("../lib/supabase", () => ({ databaseMode: "live" }));
    mockFactsModule();

    const { FactsPanel } = await import("./FactsPanel");
    await act(async () => {
      render(<FactsPanel />);
    });
    await waitFor(() => {
      expect(screen.getByText("Sign out")).toBeDefined();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Sign out"));
    });

    const { signOutFromFacts } = await import("../lib/facts");
    expect(signOutFromFacts).toHaveBeenCalled();
  });
});
