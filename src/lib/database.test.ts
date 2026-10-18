import { vi, describe, it, expect, beforeEach } from "vitest";
import { formatSupabaseError, fetchSignals } from "./database";
import { mockSignals } from "./mockData";

// Hoist mock state so it can be dynamically modified within tests
const supabaseState = vi.hoisted(() => ({
  databaseMode: "mock" as "mock" | "live",
  supabase: null as any,
}));

vi.mock("./supabase", () => {
  return {
    get databaseMode() { return supabaseState.databaseMode; },
    get supabase() { return supabaseState.supabase; }
  };
});


describe("formatSupabaseError", () => {
  it("should return friendly message for missing relation (42P01)", () => {
    const error = { code: "42P01", message: "relation \"public.signals\" does not exist" };
    expect(formatSupabaseError(error)).toBe(
      "The `signals` table does not exist in your Supabase project yet. Run the migration SQL (see src/types/signal.ts) to create it."
    );
  });

  it("should return friendly message for missing relation matching regex", () => {
    const error = { message: "relation \"public.signals\" does not exist" };
    expect(formatSupabaseError(error)).toBe(
      "The `signals` table does not exist in your Supabase project yet. Run the migration SQL (see src/types/signal.ts) to create it."
    );
  });

  it("should prepend error code if present", () => {
    const error = { code: "23505", message: "duplicate key value violates unique constraint" };
    expect(formatSupabaseError(error)).toBe("[23505] duplicate key value violates unique constraint");
  });

  it("should return just the message if no code is present", () => {
    const error = { message: "Network error" };
    expect(formatSupabaseError(error)).toBe("Network error");
  });

  it("should return friendly message for regex ignoring case", () => {
    const error = { message: "RELATION \"public.signals\" DOES NOT EXIST" };
    expect(formatSupabaseError(error)).toBe(
      "The `signals` table does not exist in your Supabase project yet. Run the migration SQL (see src/types/signal.ts) to create it."
    );
  });
});


describe("fetchSignals", () => {
  beforeEach(() => {
    // Reset to mock mode by default
    supabaseState.databaseMode = "mock";
    supabaseState.supabase = null;
    vi.clearAllMocks();
  });

  it("should return mock data when databaseMode is 'mock'", async () => {
    supabaseState.databaseMode = "mock";

    const result = await fetchSignals();
    expect(result).toEqual({
      signals: mockSignals,
      mode: "mock",
      error: null,
      isMock: true,
    });
  });

  it("should return mock data when supabase client is null", async () => {
    supabaseState.databaseMode = "live";
    supabaseState.supabase = null;

    const result = await fetchSignals();
    expect(result).toEqual({
      signals: mockSignals,
      mode: "mock",
      error: null,
      isMock: true,
    });
  });

  it("should fetch live data from supabase when in 'live' mode", async () => {
    supabaseState.databaseMode = "live";

    const mockData = [{ id: 1, name: "Signal 1" }];
    const limitMock = vi.fn().mockResolvedValue({ data: mockData, error: null });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });

    supabaseState.supabase = {
      from: fromMock
    };

    const result = await fetchSignals();

    expect(fromMock).toHaveBeenCalledWith("signals");
    expect(selectMock).toHaveBeenCalledWith("id, name, origin, status, intensity, recorded_at");
    expect(orderMock).toHaveBeenCalledWith("recorded_at", { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(50);

    expect(result).toEqual({
      signals: mockData,
      mode: "live",
      error: null,
      isMock: false,
    });
  });

  it("should handle null data from supabase gracefully", async () => {
    supabaseState.databaseMode = "live";

    const limitMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });

    supabaseState.supabase = {
      from: fromMock
    };

    const result = await fetchSignals();

    expect(result).toEqual({
      signals: [],
      mode: "live",
      error: null,
      isMock: false,
    });
  });

  it("should fallback to mock data on supabase error", async () => {
    supabaseState.databaseMode = "live";

    const mockError = { message: "Network error" };
    const limitMock = vi.fn().mockResolvedValue({ data: null, error: mockError });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });

    supabaseState.supabase = {
      from: fromMock
    };

    const result = await fetchSignals();

    expect(result).toEqual({
      signals: mockSignals,
      mode: "live", // It stays in "live" mode
      error: "Network error",
      isMock: true,
    });
  });
});
