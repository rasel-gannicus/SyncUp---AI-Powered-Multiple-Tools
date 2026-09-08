import { normalizePriority } from "../TodoList";

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
});
