import { describe, it, expect } from "vitest";
import { looksPlaceholder, maskUrl, maskKey } from "./supabase";

describe("looksPlaceholder", () => {
  it("should return true for strings shorter than 10 characters", () => {
    expect(looksPlaceholder("")).toBe(true);
    expect(looksPlaceholder("short")).toBe(true);
    expect(looksPlaceholder("123456789")).toBe(true);
  });

  it("should return true for strings containing placeholder hints", () => {
    expect(looksPlaceholder("your_supabase_url")).toBe(true);
    expect(looksPlaceholder("insert-key-here")).toBe(true);
    expect(looksPlaceholder("https://<ref>.supabase.co")).toBe(true);
    expect(looksPlaceholder("replace_this_value")).toBe(true);
  });

  it("should handle case insensitivity", () => {
    expect(looksPlaceholder("YOUR_SUPABASE_URL")).toBe(true);
    expect(looksPlaceholder("EXAMPLE_KEY")).toBe(true);
  });

  it("should return false for valid strings without hints and >= 10 characters", () => {
    expect(looksPlaceholder("https://abcdefgh.supabase.co")).toBe(false);
    expect(looksPlaceholder("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg1Njg1MDAsImV4cCI6MTk5MjIyNDUwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")).toBe(false);
    expect(looksPlaceholder("a_valid_string_that_is_long")).toBe(false);
  });
});

describe("maskUrl", () => {
  it("should return '—' for an empty string", () => {
    expect(maskUrl("")).toBe("—");
  });

  it("should mask valid URLs correctly", () => {
    expect(maskUrl("https://abcdefgh.supabase.co")).toBe("abcdef…gh.supabase.co");
    expect(maskUrl("http://localhost:54321")).toBe("localh…ocalhost:54321"); // 'localhost:54321' is 15 chars, slice(-14) is 'ocalhost:54321', slice(0,6) is 'localh'
    expect(maskUrl("https://my-custom-domain.com")).toBe("my-cus…tom-domain.com");
  });

  it("should fallback to naive masking for invalid URLs", () => {
    expect(maskUrl("not-a-valid-url")).toBe("not-…id-url"); // slice(0, 4) + "…" + slice(-6) -> "not-" + "…" + "id-url"
  });
});

describe("maskKey", () => {
  it("should return '—' for an empty string", () => {
    expect(maskKey("")).toBe("—");
  });

  it("should return bullets for strings with length <= 12", () => {
    expect(maskKey("123456")).toBe("••••••");
    expect(maskKey("123456789012")).toBe("••••••••••••");
  });

  it("should mask correctly for strings > 12 characters", () => {
    expect(maskKey("thisisverylongkey1234")).toBe("thisi…1234 (21 chars)"); // slice(0,5) + "…" + slice(-4) -> "thisi" + "…" + "1234"
    expect(maskKey("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")).toBe("eyJhb…VCJ9 (36 chars)"); // slice(-4) of "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" is "VCJ9"
  });
});
