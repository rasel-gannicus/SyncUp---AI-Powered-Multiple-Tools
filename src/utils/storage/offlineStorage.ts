/**
 * Offline & Local Storage Service for SyncUp
 * Handles local-first task persistence, cloud auto-caching, and backup export/import.
 */

export type StorageMode = "cloud" | "local";

const STORAGE_MODE_KEY_PREFIX = "syncup_storage_mode_";
const LOCAL_TODOS_KEY_PREFIX = "syncup_local_todos_";
const CLOUD_CACHE_KEY_PREFIX = "syncup_cloud_cache_";

/**
 * Get the current storage mode for a user (defaults to "cloud")
 */
export const getStorageMode = (email?: string): StorageMode => {
  if (typeof window === "undefined") return "cloud";
  try {
    const key = `${STORAGE_MODE_KEY_PREFIX}${email || "guest"}`;
    const saved = localStorage.getItem(key);
    if (saved === "local" || saved === "cloud") {
      return saved;
    }
  } catch (error) {
    console.error("Error reading storage mode:", error);
  }
  return "cloud";
};

/**
 * Set the current storage mode for a user
 */
export const setStorageMode = (email: string | undefined, mode: StorageMode): void => {
  if (typeof window === "undefined") return;
  try {
    const key = `${STORAGE_MODE_KEY_PREFIX}${email || "guest"}`;
    localStorage.setItem(key, mode);
  } catch (error) {
    console.error("Error setting storage mode:", error);
  }
};

/**
 * Get local offline todos from localStorage
 */
export const getLocalTodos = (email?: string): any[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = `${LOCAL_TODOS_KEY_PREFIX}${email || "guest"}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Error reading local todos:", error);
  }
  return [];
};

/**
 * Save local offline todos to localStorage
 */
export const saveLocalTodos = (email: string | undefined, todos: any[]): void => {
  if (typeof window === "undefined") return;
  try {
    const key = `${LOCAL_TODOS_KEY_PREFIX}${email || "guest"}`;
    localStorage.setItem(key, JSON.stringify(todos));
  } catch (error) {
    console.error("Error saving local todos:", error);
  }
};

/**
 * Get cloud cached todos from localStorage (for 0ms instant loading during cold starts)
 */
export const getCloudCachedTodos = (email?: string): any[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = `${CLOUD_CACHE_KEY_PREFIX}${email || "guest"}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Error reading cloud cached todos:", error);
  }
  return [];
};

/**
 * Save cloud cached todos to localStorage
 */
export const saveCloudCachedTodos = (email: string | undefined, todos: any[]): void => {
  if (typeof window === "undefined") return;
  try {
    const key = `${CLOUD_CACHE_KEY_PREFIX}${email || "guest"}`;
    localStorage.setItem(key, JSON.stringify(todos));
  } catch (error) {
    console.error("Error saving cloud cache todos:", error);
  }
};

/**
 * Export all tasks and data as a downloadable JSON backup
 */
export const exportBackupJSON = (email: string | undefined, data: { todos: any[]; user?: any }): void => {
  if (typeof window === "undefined") return;
  try {
    const backupData = {
      app: "SyncUp",
      version: "1.0",
      exportDate: new Date().toISOString(),
      userEmail: email || "guest",
      totalTasks: data.todos?.length || 0,
      todos: data.todos || [],
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `syncup-backup-${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting JSON backup:", error);
    throw error;
  }
};

/**
 * Parse an imported JSON backup file and validate its structure
 */
export const parseBackupJSON = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Support both full SyncUp backup objects and raw arrays
        let importedTodos: any[] = [];
        if (Array.isArray(parsed)) {
          importedTodos = parsed;
        } else if (parsed && Array.isArray(parsed.todos)) {
          importedTodos = parsed.todos;
        } else if (parsed && Array.isArray(parsed.todoList)) {
          importedTodos = parsed.todoList;
        } else {
          throw new Error("Invalid backup format: No tasks array found.");
        }

        resolve(importedTodos);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
