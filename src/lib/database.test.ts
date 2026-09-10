import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatSupabaseError, subscribeToSignals } from "./database";

const supabaseMocks = vi.hoisted(() => ({
  mode: "mock" as "live" | "mock",
  client: null as any
}));

vi.mock("./supabase", () => ({
  get databaseMode() { return supabaseMocks.mode; },
  get supabase() { return supabaseMocks.client; }
}));

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

describe("subscribeToSignals", () => {
  let mockChannel: any;

  beforeEach(() => {
    supabaseMocks.mode = "mock";
    supabaseMocks.client = null;

    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    };

    supabaseMocks.client = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return a no-op function when in mock mode", () => {
    supabaseMocks.mode = "mock";
    const unsubscribe = subscribeToSignals(vi.fn());

    expect(supabaseMocks.client.channel).not.toHaveBeenCalled();

    // Calling unsubscribe should not throw or do anything
    unsubscribe();
    expect(supabaseMocks.client.removeChannel).not.toHaveBeenCalled();
  });

  it("should return a no-op function when supabase is null", () => {
    supabaseMocks.mode = "live";
    supabaseMocks.client = null;
    const unsubscribe = subscribeToSignals(vi.fn());

    // Calling unsubscribe should not throw
    unsubscribe();
  });

  it("should subscribe to channels and return unsubscribe function in live mode", () => {
    supabaseMocks.mode = "live";
    const onChange = vi.fn();

    const unsubscribe = subscribeToSignals(onChange);

    expect(supabaseMocks.client.channel).toHaveBeenCalledWith("signals-changes");
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "*", schema: "public", table: "signals" },
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function));

    // Test the unsubscribe callback
    unsubscribe();
    expect(supabaseMocks.client.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it("should call onChange when a postgres change event occurs", () => {
    supabaseMocks.mode = "live";
    const onChange = vi.fn();

    subscribeToSignals(onChange);

    // Get the registered callback
    const onCallArgs = mockChannel.on.mock.calls[0];
    const callback = onCallArgs[2];

    callback(); // Simulate database change
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("should log a warning if subscription fails with CHANNEL_ERROR", () => {
    supabaseMocks.mode = "live";
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    subscribeToSignals(vi.fn());

    const subscribeCallArgs = mockChannel.subscribe.mock.calls[0];
    const callback = subscribeCallArgs[0];

    callback("CHANNEL_ERROR");
    expect(consoleWarnSpy).toHaveBeenCalledWith("[signals] realtime subscription failed:", "CHANNEL_ERROR");
  });

  it("should log a warning if subscription fails with TIMED_OUT", () => {
    supabaseMocks.mode = "live";
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    subscribeToSignals(vi.fn());

    const subscribeCallArgs = mockChannel.subscribe.mock.calls[0];
    const callback = subscribeCallArgs[0];

    callback("TIMED_OUT");
    expect(consoleWarnSpy).toHaveBeenCalledWith("[signals] realtime subscription failed:", "TIMED_OUT");
  });
});
