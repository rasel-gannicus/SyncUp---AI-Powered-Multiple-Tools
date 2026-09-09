"use client";

import React, { useState } from "react";
import {
  Trash2,
  CheckCircle2,
  Circle,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/Components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkToggleComplete: (completed: boolean) => Promise<void>;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalFilteredCount,
  allSelected,
  onToggleSelectAll,
  onBulkDelete,
  onBulkToggleComplete,
  onClearSelection,
  isLoading = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (selectedCount === 0) return null;

  const handleDeleteConfirmed = async () => {
    try {
      setIsDeleting(true);
      await onBulkDelete();
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCompleteAction = async (completed: boolean) => {
    try {
      setIsUpdating(true);
      await onBulkToggleComplete(completed);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Floating Docked Bulk Action Bar */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[96%] sm:w-[92%] max-w-2xl animate-in slide-in-from-bottom-5 fade-in-0 duration-300">
        <div className="bg-gray-900/95 dark:bg-gray-800/95 text-white backdrop-blur-md rounded-2xl p-2 sm:p-3 px-3 sm:px-5 shadow-2xl border border-gray-700/80 flex items-center justify-between gap-1.5 sm:gap-4 ring-1 ring-white/10">
          {/* Left: Selected count and Select All toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleSelectAll}
              className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-teal-400 dark:text-orange-400 hover:text-teal-300 dark:hover:text-orange-300 transition-colors flex-shrink-0"
              title={allSelected ? "Deselect all visible tasks" : "Select all visible tasks"}
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-teal-400 dark:text-orange-400" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span className="hidden xs:inline">
                {allSelected ? "Unselect All" : "Select All"}
              </span>
            </button>

            <div className="h-4 w-px bg-gray-700 hidden xs:block" />

            <span className="text-xs sm:text-sm font-bold text-gray-200 truncate">
              <span className="text-teal-400 dark:text-orange-400 font-extrabold">{selectedCount}</span>{" "}
              task{selectedCount > 1 ? "s" : ""} selected
            </span>
          </div>

          {/* Right: Actions (Mark Done, Mark Pending, Bulk Delete, Clear) */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mark as Completed */}
            <button
              type="button"
              onClick={() => handleCompleteAction(true)}
              disabled={isUpdating || isDeleting || isLoading}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Mark selected tasks as completed"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Mark Done</span>
            </button>

            {/* Mark as Incomplete / Active */}
            <button
              type="button"
              onClick={() => handleCompleteAction(false)}
              disabled={isUpdating || isDeleting || isLoading}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Mark selected tasks as pending"
            >
              <Circle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span className="hidden md:inline">Mark Active</span>
            </button>

            {/* Bulk Delete Trigger */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating || isDeleting || isLoading}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Delete selected tasks"
            >
              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={onClearSelection}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-0.5 sm:ml-1"
              title="Clear selection (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700/80 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Delete {selectedCount} Task{selectedCount > 1 ? "s" : ""}?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This action will delete all selected tasks from your list.
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60">
              Are you sure you want to permanently remove these{" "}
              <strong className="text-rose-600 dark:text-rose-400">{selectedCount}</strong> task
              {selectedCount > 1 ? "s" : ""}?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold px-4 gap-1.5 shadow-sm active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete {selectedCount} Tasks</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
