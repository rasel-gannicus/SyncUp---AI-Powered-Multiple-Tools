import {
  getStorageMode,
  setStorageMode,
  getLocalTodos,
  saveLocalTodos,
  getCloudCachedTodos,
  saveCloudCachedTodos,
  exportBackupJSON,
  parseBackupJSON,
} from "@/utils/storage/offlineStorage";

describe("Data Mode & Offline Storage Services", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("Storage Mode persistence", () => {
    it("should default to cloud mode when nothing is stored", () => {
      expect(getStorageMode("test@example.com")).toBe("cloud");
      expect(getStorageMode(undefined)).toBe("cloud");
    });

    it("should correctly save and retrieve local storage mode", () => {
      setStorageMode("test@example.com", "local");
      expect(getStorageMode("test@example.com")).toBe("local");

      setStorageMode("test@example.com", "cloud");
      expect(getStorageMode("test@example.com")).toBe("cloud");
    });

    it("should isolate storage modes per user email", () => {
      setStorageMode("user1@example.com", "local");
      setStorageMode("user2@example.com", "cloud");

      expect(getStorageMode("user1@example.com")).toBe("local");
      expect(getStorageMode("user2@example.com")).toBe("cloud");
    });
  });

  describe("Local Todos Storage", () => {
    it("should return empty array when no local todos exist", () => {
      expect(getLocalTodos("test@example.com")).toEqual([]);
    });

    it("should save and retrieve local todos correctly", () => {
      const mockTodos = [
        {
          createdAt: 1001,
          text: "Local task 1",
          completed: false,
          priority: "High",
          project: "Design",
        },
        {
          createdAt: 1002,
          text: "Local task 2",
          completed: true,
          priority: "Medium",
          project: "Backend",
        },
      ];

      saveLocalTodos("test@example.com", mockTodos);
      const retrieved = getLocalTodos("test@example.com");

      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].text).toBe("Local task 1");
      expect(retrieved[1].completed).toBe(true);
    });

    it("should gracefully handle corrupted localStorage JSON", () => {
      localStorage.setItem("syncup_local_todos_corrupted@example.com", "{invalid json");
      expect(getLocalTodos("corrupted@example.com")).toEqual([]);
    });
  });

  describe("Cloud Cache Storage", () => {
    it("should return empty array when no cloud cache exists", () => {
      expect(getCloudCachedTodos("test@example.com")).toEqual([]);
    });

    it("should save and retrieve cloud cached todos for 0ms cold-start loading", () => {
      const mockTodos = [
        {
          createdAt: 2001,
          text: "Cloud task 1",
          completed: false,
          priority: "Urgent",
        },
      ];

      saveCloudCachedTodos("test@example.com", mockTodos);
      const retrieved = getCloudCachedTodos("test@example.com");

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].text).toBe("Cloud task 1");
      expect(retrieved[0].priority).toBe("Urgent");
    });
  });

  describe("Backup Export & Import (JSON)", () => {
    it("should parse valid SyncUp JSON backup object", async () => {
      const sampleBackup = {
        app: "SyncUp",
        version: "1.0",
        exportDate: "2026-09-15T12:00:00.000Z",
        userEmail: "test@example.com",
        totalTasks: 2,
        todos: [
          { createdAt: 3001, text: "Imported Task 1", completed: false },
          { createdAt: 3002, text: "Imported Task 2", completed: true },
        ],
      };

      const file = new File([JSON.stringify(sampleBackup)], "backup.json", {
        type: "application/json",
      });

      const parsed = await parseBackupJSON(file);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].text).toBe("Imported Task 1");
      expect(parsed[1].text).toBe("Imported Task 2");
    });

    it("should parse raw JSON array backup format", async () => {
      const rawArray = [
        { createdAt: 4001, text: "Raw Array Task", completed: false },
      ];

      const file = new File([JSON.stringify(rawArray)], "backup-raw.json", {
        type: "application/json",
      });

      const parsed = await parseBackupJSON(file);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].text).toBe("Raw Array Task");
    });

    it("should reject invalid file format without todos array", async () => {
      const invalidData = { name: "Not a valid backup" };
      const file = new File([JSON.stringify(invalidData)], "invalid.json", {
        type: "application/json",
      });

      await expect(parseBackupJSON(file)).rejects.toThrow(
        "Invalid backup format: No tasks array found."
      );
    });
  });
});
