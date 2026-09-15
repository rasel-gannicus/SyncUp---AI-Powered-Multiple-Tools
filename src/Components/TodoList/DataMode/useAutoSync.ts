"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  StorageMode,
  getUnsyncedStatus,
  setUnsyncedStatus,
  getAutoSyncEnabled,
  setAutoSyncEnabled as persistAutoSyncEnabled,
  saveCloudCachedTodos,
  UnsyncedStatus,
} from "@/utils/storage/offlineStorage";

export type SyncState = "idle" | "syncing" | "synced" | "error" | "offline";

interface UseAutoSyncProps {
  storageMode: StorageMode;
  user: any;
  todos: any[];
  onSyncPush?: () => Promise<void>;
  intervalMs?: number; // default 120,000ms (2 minutes)
  debounceMs?: number; // default 30,000ms (30 seconds)
}

export const useAutoSync = ({
  storageMode,
  user,
  todos,
  onSyncPush,
  intervalMs = 120000,
  debounceMs = 30000,
}: UseAutoSyncProps) => {
  const email = user?.providerData?.[0]?.email || user?.email;
  const [isAutoSyncEnabled, setIsAutoSyncEnabledState] = useState<boolean>(() =>
    getAutoSyncEnabled(email)
  );
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [unsyncedStatus, setUnsyncedStatusState] = useState<UnsyncedStatus>(() =>
    getUnsyncedStatus(email)
  );

  const debounceTimerRef = useRef<any>(null);
  const isSyncingRef = useRef(false);
  const isInitialMount = useRef(true);
  const prevTodosRef = useRef<any[]>(todos);
  const todosRef = useRef<any[]>(todos);
  const onSyncPushRef = useRef(onSyncPush);

  // Keep refs up-to-date
  useEffect(() => {
    todosRef.current = todos;
    onSyncPushRef.current = onSyncPush;
  }, [todos, onSyncPush]);

  // Toggle Auto-Sync setting
  const setAutoSyncEnabled = useCallback(
    (enabled: boolean) => {
      setIsAutoSyncEnabledState(enabled);
      persistAutoSyncEnabled(email, enabled);
    },
    [email]
  );

  // Mark that local changes exist
  const markUnsynced = useCallback(() => {
    if (!email) return;
    setUnsyncedStatus(email, true);
    setUnsyncedStatusState((prev) =>
      prev.hasUnsyncedChanges ? prev : { ...prev, hasUnsyncedChanges: true }
    );
  }, [email]);

  // Execute the background synchronization
  const triggerSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (!email) return;

    // Check network status
    if (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      setSyncState("offline");
      return;
    }

    const currentStatus = getUnsyncedStatus(email);
    if (!currentStatus.hasUnsyncedChanges) {
      // Nothing new to sync
      return;
    }

    isSyncingRef.current = true;
    setSyncState("syncing");

    try {
      if (onSyncPushRef.current) {
        await onSyncPushRef.current();
      } else {
        // Cache current todos into cloud cache
        saveCloudCachedTodos(email, todosRef.current);
      }

      const now = Date.now();
      setUnsyncedStatus(email, false, now);
      setUnsyncedStatusState({
        hasUnsyncedChanges: false,
        lastSyncedAt: now,
      });
      setSyncState("synced");

      // Return to idle after 4 seconds of displaying 'synced'
      setTimeout(() => {
        setSyncState((curr) => (curr === "synced" ? "idle" : curr));
      }, 4000);
    } catch (err) {
      console.error("Background auto-sync failed:", err);
      setSyncState("error");
    } finally {
      isSyncingRef.current = false;
    }
  }, [email]);

  // Listen to local todo changes and trigger debounced sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevTodosRef.current = todos;
      return;
    }

    // Check if todos reference actually changed
    if (prevTodosRef.current !== todos) {
      prevTodosRef.current = todos;

      if (storageMode === "local" && isAutoSyncEnabled && email) {
        markUnsynced();

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          triggerSync();
        }, debounceMs);
      }
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [todos, storageMode, isAutoSyncEnabled, email, debounceMs, markUnsynced, triggerSync]);

  // Periodic Background Interval Sync (every 2 minutes)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (storageMode !== "local" || !isAutoSyncEnabled || !email) {
      return;
    }

    const intervalId = setInterval(() => {
      triggerSync();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [storageMode, isAutoSyncEnabled, email, intervalMs, triggerSync]);

  // Online & Offline Event Listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      if (storageMode === "local" && isAutoSyncEnabled) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setSyncState("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [storageMode, isAutoSyncEnabled, triggerSync]);

  return {
    isAutoSyncEnabled,
    setAutoSyncEnabled,
    syncState,
    unsyncedStatus,
    triggerSyncNow: triggerSync,
    markUnsynced,
  };
};
