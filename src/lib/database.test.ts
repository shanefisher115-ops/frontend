import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatSupabaseError, fetchSignals } from "./database";
import { mockSignals } from "./mockData";

let mockDatabaseMode = "live";
let mockSupabase: any = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null })
};

vi.mock("./supabase", () => {
  return {
    get databaseMode() { return mockDatabaseMode; },
    get supabase() { return mockSupabase; }
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
    mockDatabaseMode = "live";
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null })
    };
  });

  it("should return mock data when databaseMode is 'mock'", async () => {
    mockDatabaseMode = "mock";
    const result = await fetchSignals();
    expect(result).toEqual({
      signals: mockSignals,
      mode: "mock",
      error: null,
      isMock: true,
    });
  });

  it("should return mock data when supabase client is not available", async () => {
    mockDatabaseMode = "live";
    mockSupabase = null;
    const result = await fetchSignals();
    expect(result).toEqual({
      signals: mockSignals,
      mode: "mock",
      error: null,
      isMock: true,
    });
  });

  it("should fetch live data when in live mode", async () => {
    mockDatabaseMode = "live";
    const mockData = [{ id: "1", name: "Signal 1" }];
    mockSupabase.limit.mockResolvedValue({ data: mockData, error: null });

    const result = await fetchSignals();
    expect(result).toEqual({
      signals: mockData,
      mode: "live",
      error: null,
      isMock: false,
    });
  });

  it("should fall back to mock data but report live failure on query error", async () => {
    mockDatabaseMode = "live";
    const mockError = { code: "123", message: "Some error" };
    mockSupabase.limit.mockResolvedValue({ data: null, error: mockError });

    const result = await fetchSignals();
    expect(result).toEqual({
      signals: mockSignals,
      mode: "live",
      error: "[123] Some error",
      isMock: true,
    });
  });
});
