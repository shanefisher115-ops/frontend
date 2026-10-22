import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Adapter-level tests for src/lib/facts.ts. The component tests mock this
 * module, so these tests exercise the real adapter against a mocked
 * Supabase client — including error paths the component relies on.
 */

const signOut = vi.fn();
const getSession = vi.fn();
const signInWithPassword = vi.fn();
const from = vi.fn();
const onAuthStateChange = vi.fn();

vi.mock("./supabase", () => ({
  supabase: {
    auth: { signOut, getSession, signInWithPassword, onAuthStateChange },
    from,
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      // channel builder is chained; keep it self-contained
    }),
  },
  databaseMode: "live",
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("signOutFromFacts", () => {
  it("throws when supabase.auth.signOut resolves with an error", async () => {
    signOut.mockResolvedValueOnce({
      error: { code: "500", message: "session server unavailable" },
    });

    const { signOutFromFacts } = await import("./facts");
    await expect(signOutFromFacts()).rejects.toThrowError(
      "session server unavailable",
    );
  });

  it("resolves cleanly when signOut reports no error", async () => {
    signOut.mockResolvedValueOnce({ error: null });

    const { signOutFromFacts } = await import("./facts");
    await expect(signOutFromFacts()).resolves.toBeUndefined();
  });
});

describe("getFactSession", () => {
  it("returns the session from the Supabase client", async () => {
    getSession.mockResolvedValueOnce({
      data: { session: { access_token: "t", user: { id: "u" } } },
    });

    const { getFactSession } = await import("./facts");
    const session = await getFactSession();
    expect(session).toEqual({ access_token: "t", user: { id: "u" } });
  });

  it("returns null when there is no session", async () => {
    getSession.mockResolvedValueOnce({ data: { session: null } });

    const { getFactSession } = await import("./facts");
    expect(await getFactSession()).toBeNull();
  });
});

describe("insertFact", () => {
  it("surfaces RLS rejection as a formatted error", async () => {
    from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValueOnce({
        error: {
          code: "42501",
          message: "permission denied for table pko_facts",
        },
      }),
    });

    const { insertFact } = await import("./facts");
    const { error } = await insertFact({
      topic: "t",
      summary: "s",
      key_points: [],
      sources: [],
    });
    expect(error).toMatch(/Permission denied/i);
    expect(error).toMatch(/Sign in above/i);
  });
});
