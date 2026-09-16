import { normalizePriority, getTodoDateKey, formatDisplayDate } from "../TodoList";

describe("TodoList Unit Tests & Logic", () => {
  describe("normalizePriority", () => {
    it("should correctly normalize priority strings", () => {
      expect(normalizePriority("urgent")).toBe("Urgent");
      expect(normalizePriority("URGENT")).toBe("Urgent");
      expect(normalizePriority("High")).toBe("High");
      expect(normalizePriority("high")).toBe("High");
      expect(normalizePriority("Low")).toBe("Low");
      expect(normalizePriority("low")).toBe("Low");
      expect(normalizePriority("Medium")).toBe("Medium");
      expect(normalizePriority("medium")).toBe("Medium");
    });

    it("should default to Medium when null, undefined or unknown string is provided", () => {
      expect(normalizePriority(null)).toBe("Medium");
      expect(normalizePriority(undefined)).toBe("Medium");
      expect(normalizePriority("")).toBe("Medium");
      expect(normalizePriority("unknown_priority")).toBe("Medium");
    });
  });

  describe("getTodoDateKey", () => {
    it("should extract yyyy-MM-dd date key directly from todo.date string", () => {
      expect(getTodoDateKey({ date: "2026-09-16" })).toBe("2026-09-16");
      expect(getTodoDateKey({ date: "2026-10-25T12:00:00.000Z" })).toBe("2026-10-25");
    });

    it("should fallback to createdAt date when date property is not present", () => {
      // 1789543996815 is 2026-09-16
      const timestamp = new Date("2026-09-16T10:00:00Z").getTime();
      expect(getTodoDateKey({ createdAt: timestamp })).toBe(
        new Date(timestamp).toISOString().substring(0, 10)
      );
    });

    it("should return today's yyyy-MM-dd if both date and createdAt are missing", () => {
      const today = new Date().toISOString().substring(0, 10);
      expect(getTodoDateKey({})).toBe(today);
      expect(getTodoDateKey(null)).toBe(today);
    });
  });

  describe("formatDisplayDate", () => {
    it("should format yyyy-MM-dd to dd-MM-yyyy format", () => {
      expect(formatDisplayDate("2026-09-16")).toBe("16-09-2026");
      expect(formatDisplayDate("2026-01-05")).toBe("05-01-2026");
      expect(formatDisplayDate("2026-12-31")).toBe("31-12-2026");
    });

    it("should handle empty or null values gracefully", () => {
      expect(formatDisplayDate("")).toBe("");
      expect(formatDisplayDate(null)).toBe("");
      expect(formatDisplayDate(undefined)).toBe("");
    });
  });
});
