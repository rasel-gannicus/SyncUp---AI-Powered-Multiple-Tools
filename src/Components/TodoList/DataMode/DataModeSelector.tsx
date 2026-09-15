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
} from "@/utils/storage/offlineStorage";

interface DataModeSelectorProps {
  storageMode: StorageMode;
  onModeChange: (mode: StorageMode) => void;
  user: any;
  todos: any[];
  setTodos: React.Dispatch<React.SetStateAction<any[]>>;
  userLoading?: boolean;
  onPushToCloud?: () => Promise<void>;
  onPullFromCloud?: () => void;
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
    setIsSyncing(true);
    const toastId = toast.loading("Pushing tasks to cloud database...");
    try {
      if (onPushToCloud) {
        await onPushToCloud();
      } else {
        // Fallback: save to cloud cache
        saveCloudCachedTodos(email, todos);
      }
      toast.success("All tasks pushed to cloud successfully! ☁️", { id: toastId });
      setIsOpen(false);
    } catch (err: any) {
      toast.error("Failed to push tasks to cloud.", { id: toastId });
    } finally {
      setIsSyncing(false);
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
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="100% Offline Storage Active" />
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
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200/80 dark:border-gray-700/80 p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
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
          <div className="space-y-1.5 mb-3">
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
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/70 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors disabled:opacity-50"
                title="Sync local data to cloud MongoDB"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span className="truncate">{isSyncing ? "Pushing..." : "Push Cloud"}</span>
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
