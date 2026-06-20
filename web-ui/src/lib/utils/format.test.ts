import { describe, it, expect } from "vitest";
import { formatDate, truncateId } from "./format";

describe("formatDate", () => {
  it("formats an ISO date string to readable format", () => {
    const result = formatDate("2026-06-20T12:00:00Z");
    expect(result).toBe("Jun 20, 2026");
  });

  it("formats a date at the start of the year", () => {
    const result = formatDate("2026-01-01T00:00:00Z");
    expect(result).toBe("Jan 1, 2026");
  });

  it("formats a date at the end of the year", () => {
    const result = formatDate("2026-12-31T23:59:59Z");
    expect(result).toBe("Dec 31, 2026");
  });
});

describe("truncateId", () => {
  it("truncates a UUID to first 8 characters with ellipsis", () => {
    const result = truncateId("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toBe("550e8400...");
  });

  it("handles short strings by returning full string with ellipsis", () => {
    const result = truncateId("abc");
    expect(result).toBe("abc...");
  });

  it("handles exactly 8 character strings", () => {
    const result = truncateId("12345678");
    expect(result).toBe("12345678...");
  });

  it("handles empty string", () => {
    const result = truncateId("");
    expect(result).toBe("...");
  });
});
