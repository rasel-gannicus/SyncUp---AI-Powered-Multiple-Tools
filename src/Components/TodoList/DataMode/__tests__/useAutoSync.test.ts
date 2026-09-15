import { renderHook, act } from "@testing-library/react";
import { useAutoSync } from "../useAutoSync";
import {
  setUnsyncedStatus,
  getUnsyncedStatus,
} from "@/utils/storage/offlineStorage";

describe("useAutoSync custom hook", () => {
  const user = { email: "syncuser@example.com", providerData: [{ email: "syncuser@example.com" }] };
  const sampleTodos = [{ createdAt: 100, text: "Task 1", completed: false }];

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("should initialize with default settings", () => {
    const { result } = renderHook(() =>
      useAutoSync({
        storageMode: "local",
        user,
        todos: sampleTodos,
      })
    );

    expect(result.current.isAutoSyncEnabled).toBe(true);
    expect(result.current.syncState).toBe("idle");
    expect(result.current.unsyncedStatus.hasUnsyncedChanges).toBe(false);
  });

  it("should allow toggling auto-sync setting", () => {
    const { result } = renderHook(() =>
      useAutoSync({
        storageMode: "local",
        user,
        todos: sampleTodos,
      })
    );

    act(() => {
      result.current.setAutoSyncEnabled(false);
    });

    expect(result.current.isAutoSyncEnabled).toBe(false);

    act(() => {
      result.current.setAutoSyncEnabled(true);
    });

    expect(result.current.isAutoSyncEnabled).toBe(true);
  });

  it("should mark changes as unsynced when todos change in local mode", () => {
    const { result, rerender } = renderHook(
      ({ todos }) =>
        useAutoSync({
          storageMode: "local",
          user,
          todos,
          debounceMs: 500,
        }),
      { initialProps: { todos: sampleTodos } }
    );

    // Initial state
    expect(result.current.unsyncedStatus.hasUnsyncedChanges).toBe(false);

    // Add a todo
    rerender({
      todos: [...sampleTodos, { createdAt: 101, text: "New Local Task", completed: false }],
    });

    expect(result.current.unsyncedStatus.hasUnsyncedChanges).toBe(true);
  });

  it("should trigger sync manually when triggerSyncNow is called", async () => {
    const mockSyncPush = jest.fn().mockResolvedValue(undefined);
    setUnsyncedStatus(user.email, true);

    const { result } = renderHook(() =>
      useAutoSync({
        storageMode: "local",
        user,
        todos: sampleTodos,
        onSyncPush: mockSyncPush,
      })
    );

    await act(async () => {
      await result.current.triggerSyncNow();
    });

    expect(mockSyncPush).toHaveBeenCalledTimes(1);
    expect(result.current.syncState).toBe("synced");
    expect(result.current.unsyncedStatus.hasUnsyncedChanges).toBe(false);
  });

  it("should trigger sync when browser online event fires", async () => {
    const mockSyncPush = jest.fn().mockResolvedValue(undefined);
    setUnsyncedStatus(user.email, true);

    renderHook(() =>
      useAutoSync({
        storageMode: "local",
        user,
        todos: sampleTodos,
        onSyncPush: mockSyncPush,
      })
    );

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    expect(mockSyncPush).toHaveBeenCalledTimes(1);
  });
});
