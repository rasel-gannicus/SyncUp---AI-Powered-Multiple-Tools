"use client";

import React, { useState, useRef } from "react";
import {
  Cloud,
  HardDrive,
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Database,
  ChevronDown,
  ArrowRightLeft,
  Wifi,
  WifiOff,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { toast } from "react-hot-toast";
import {
  StorageMode,
  exportBackupJSON,
  parseBackupJSON,
  saveLocalTodos,
  getLocalTodos,
  getCloudCachedTodos,
  saveCloudCachedTodos,
  UnsyncedStatus,
} from "@/utils/storage/offlineStorage";
import { SyncState } from "./useAutoSync";

interface DataModeSelectorProps {
  storageMode: StorageMode;
  onModeChange: (mode: StorageMode) => void;
  user: any;
  todos: any[];
  setTodos: React.Dispatch<React.SetStateAction<any[]>>;
  userLoading?: boolean;
  onPushToCloud?: () => Promise<void>;
  onPullFromCloud?: () => void;
  isAutoSyncEnabled?: boolean;
  onToggleAutoSync?: (enabled: boolean) => void;
  syncState?: SyncState;
  unsyncedStatus?: UnsyncedStatus;
  triggerSyncNow?: () => Promise<void>;
}

export const DataModeSelector: React.FC<DataModeSelectorProps> = ({
  storageMode,
  onModeChange,
  user,
  todos,
  setTodos,
  userLoading = false,
  onPushToCloud,
  onPullFromCloud,
  isAutoSyncEnabled = true,
  onToggleAutoSync,
  syncState = "idle",
  unsyncedStatus = { hasUnsyncedChanges: false, lastSyncedAt: null },
  triggerSyncNow,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const email = user?.providerData?.[0]?.email || user?.email;

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Format relative last synced time
  const formatLastSynced = (timestamp: number | null): string => {
    if (!timestamp) return "Not synced yet";
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 30) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Handle Export Backup
  const handleExport = () => {
    try {
      exportBackupJSON(email, { todos, user });
      toast.success("Tasks exported to JSON successfully! 💾");
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to export backup.");
    }
  };

  // Handle Import Backup Trigger
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Handle Import File Change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Importing tasks from JSON...");
    try {
      const importedTodos = await parseBackupJSON(file);
      if (!importedTodos || importedTodos.length === 0) {
        toast.error("No valid tasks found in backup file.", { id: toastId });
        return;
      }

      // Merge imported tasks with existing ones, avoiding exact createdAt duplicates
      setTodos((prevTodos) => {
        const existingMap = new Set(prevTodos.map((t) => t.createdAt));
        const newTasks = importedTodos.filter((t) => !existingMap.has(t.createdAt));
        const merged = [...prevTodos, ...newTasks];

        // Persist to current storage
        if (storageMode === "local") {
          saveLocalTodos(email, merged);
        } else {
          saveCloudCachedTodos(email, merged);
        }
        return merged;
      });

      toast.success(
        `Imported ${importedTodos.length} task${
          importedTodos.length === 1 ? "" : "s"
        }! 🎉`,
        { id: toastId }
      );
      setIsOpen(false);
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(err?.message || "Failed to parse backup JSON file.", {
        id: toastId,
      });
    }
  };

  // Handle Pull from Cloud
  const handlePull = () => {
    if (onPullFromCloud) {
      onPullFromCloud();
    } else {
      const cloudCached = getCloudCachedTodos(email);
      if (cloudCached && cloudCached.length > 0) {
        saveLocalTodos(email, cloudCached);
        setTodos(cloudCached);
        toast.success(`Pulled ${cloudCached.length} tasks into Local Storage! 📥`);
      } else {
        toast.error("No cloud tasks found to pull.");
      }
    }
    setIsOpen(false);
  };

  // Handle Push to Cloud
  const handlePush = async () => {
    if (!email) {
      toast.error("Please login to push data to MongoDB cloud.");
      return;
    }
    setIsManualSyncing(true);
    const toastId = toast.loading("Pushing tasks to cloud database...");
    try {
      if (onPushToCloud) {
        await onPushToCloud();
      } else if (triggerSyncNow) {
        await triggerSyncNow();
      } else {
        saveCloudCachedTodos(email, todos);
      }
      toast.success("All tasks pushed to cloud successfully! ☁️", { id: toastId });
      setIsOpen(false);
    } catch (err: any) {
      toast.error("Failed to push tasks to cloud.", { id: toastId });
    } finally {
      setIsManualSyncing(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Hidden File Input for JSON Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Mode Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 h-8 rounded-xl text-xs font-semibold border transition-all duration-200 shadow-xs active:scale-95 ${
          storageMode === "cloud"
            ? "bg-teal-500/10 dark:bg-orange-500/10 text-teal-700 dark:text-orange-300 border-teal-500/30 dark:border-orange-500/30 hover:bg-teal-500/20 dark:hover:bg-orange-500/20"
            : "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30 dark:border-purple-500/30 hover:bg-purple-500/20 dark:hover:bg-purple-500/30"
        }`}
        title={`Current Data Mode: ${
          storageMode === "cloud" ? "Cloud Sync (MongoDB)" : "Local Storage (Offline)"
        }`}
      >
        {storageMode === "cloud" ? (
          <>
            <Cloud className="w-3.5 h-3.5 text-teal-600 dark:text-orange-400 flex-shrink-0" />
            <span className="hidden xs:inline">Cloud Sync</span>
            <span className="xs:hidden">Cloud</span>
            {userLoading ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Connecting to MongoDB..." />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Connected to Cloud" />
            )}
          </>
        ) : (
          <>
            <HardDrive className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="hidden xs:inline">Local Mode</span>
            <span className="xs:hidden">Local</span>

            {/* Live Local Sync State Dot */}
            {syncState === "syncing" ? (
              <span title="Auto-syncing to cloud..." className="inline-flex">
                <RefreshCw className="w-3 h-3 text-purple-600 dark:text-purple-400 animate-spin flex-shrink-0" />
              </span>
            ) : syncState === "offline" ? (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Offline (will sync when online)" />
            ) : unsyncedStatus.hasUnsyncedChanges ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Unsynced local changes (auto-sync pending)" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Local data auto-synced to cloud" />
            )}
          </>
        )}
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 opacity-70 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-84 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200/80 dark:border-gray-700/80 p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-teal-600 dark:text-orange-400" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                Data Storage Mode
              </span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {todos.length} {todos.length === 1 ? "task" : "tasks"}
            </span>
          </div>

          {/* Mode Switch Cards */}
          <div className="space-y-1.5 mb-2.5">
            {/* Cloud Sync Option */}
            <button
              type="button"
              onClick={() => {
                onModeChange("cloud");
                setIsOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                storageMode === "cloud"
                  ? "bg-teal-500/10 dark:bg-orange-500/10 border-teal-500/40 dark:border-orange-500/40 ring-1 ring-teal-500/50 dark:ring-orange-500/50"
                  : "bg-gray-50/60 dark:bg-gray-900/40 border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                  storageMode === "cloud"
                    ? "bg-teal-500 text-white dark:bg-orange-400 dark:text-gray-950"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                <Cloud className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Cloud Mode (MongoDB)
                  </span>
                  {storageMode === "cloud" && (
                    <span className="text-[10px] font-extrabold text-teal-600 dark:text-orange-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                  Cloud sync across devices + instant local cache fallback.
                </p>
              </div>
            </button>

            {/* Local Offline Option */}
            <button
              type="button"
              onClick={() => {
                onModeChange("local");
                setIsOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                storageMode === "local"
                  ? "bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/40 dark:border-purple-500/40 ring-1 ring-purple-500/50 dark:ring-purple-500/50"
                  : "bg-gray-50/60 dark:bg-gray-900/40 border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                  storageMode === "local"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Local Offline Mode
                  </span>
                  {storageMode === "local" && (
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                  100% offline in browser storage. Super fast, zero cold starts.
                </p>
              </div>
            </button>
          </div>

          {/* Background Auto-Sync Setting Banner (when in Local Mode) */}
          {storageMode === "local" && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 text-purple-600 dark:text-purple-400 ${syncState === "syncing" ? "animate-spin" : ""}`} />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Background Auto-Sync
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleAutoSync && onToggleAutoSync(!isAutoSyncEnabled)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    isAutoSyncEnabled
                      ? "bg-purple-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  title={isAutoSyncEnabled ? "Disable background auto-sync" : "Enable background auto-sync"}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isAutoSyncEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Status Note */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                <span>
                  {syncState === "syncing"
                    ? "Syncing to cloud..."
                    : syncState === "offline"
                    ? "Offline (paused)"
                    : unsyncedStatus.hasUnsyncedChanges
                    ? "Changes pending (syncing in 30s)"
                    : `Last synced: ${formatLastSynced(unsyncedStatus.lastSyncedAt)}`}
                </span>
                {unsyncedStatus.hasUnsyncedChanges && (
                  <button
                    type="button"
                    onClick={handlePush}
                    className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                  >
                    Sync now
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sync & Backup Actions Section */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 px-1">
              Data Actions & Backup
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              {/* Pull from Cloud */}
              <button
                type="button"
                onClick={handlePull}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/70 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors"
                title="Copy cloud data to local storage"
              >
                <Download className="w-3.5 h-3.5 text-teal-600 dark:text-orange-400 flex-shrink-0" />
                <span className="truncate">Pull Cloud</span>
              </button>

              {/* Push to Cloud */}
              <button
                type="button"
                onClick={handlePush}
                disabled={isManualSyncing || syncState === "syncing"}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/70 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors disabled:opacity-50"
                title="Sync local data to cloud MongoDB"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span className="truncate">
                  {isManualSyncing || syncState === "syncing" ? "Syncing..." : "Push Cloud"}
                </span>
              </button>

              {/* Export JSON */}
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/70 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors"
                title="Export tasks as .json file"
              >
                <FileJson className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="truncate">Export JSON</span>
              </button>

              {/* Import JSON */}
              <button
                type="button"
                onClick={handleImportClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/70 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors"
                title="Import tasks from .json file"
              >
                <Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="truncate">Import JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
