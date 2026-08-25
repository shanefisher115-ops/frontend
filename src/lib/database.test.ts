import { describe, it, expect } from "vitest";
import { formatSupabaseError } from "./database";

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
