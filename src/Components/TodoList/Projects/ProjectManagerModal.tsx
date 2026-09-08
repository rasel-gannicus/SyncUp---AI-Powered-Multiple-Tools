"use client";

import { useState } from "react";
import {
  FolderKanban,
  Edit3,
  Trash2,
  Check,
  X,
  Plus,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  useRenameProjectMutation,
  useDeleteProjectMutation,
} from "@/Redux/features/Todo List/todoApi";

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProjects: string[];
  todos: any[];
  user: any;
  setTodos: React.Dispatch<React.SetStateAction<any[]>>;
  selectedProjectFilter: string;
  setSelectedProjectFilter: React.Dispatch<React.SetStateAction<string>>;
}

export const ProjectManagerModal = ({
  isOpen,
  onClose,
  availableProjects,
  todos,
  user,
  setTodos,
  selectedProjectFilter,
  setSelectedProjectFilter,
}: ProjectManagerModalProps) => {
  const [editingProj, setEditingProj] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [newProjInput, setNewProjInput] = useState("");
  const [deletingProj, setDeletingProj] = useState<string | null>(null);

  const [renameProjectApi] = useRenameProjectMutation();
  const [deleteProjectApi] = useDeleteProjectMutation();

  if (!isOpen) return null;

  const email = user?.providerData?.[0]?.email || user?.email;

  // Handle renaming a project
  const handleRename = async (oldName: string) => {
    if (!renameInput.trim()) {
      toast.error("Project name cannot be empty.");
      return;
    }

    const newName = renameInput.trim();
    if (newName.toLowerCase() === oldName.toLowerCase()) {
      setEditingProj(null);
      return;
    }

    const previousTodos = [...todos];
    // Optimistic update
    const updated = todos.map((t: any) => {
      if (t.project && t.project.trim().toLowerCase() === oldName.toLowerCase()) {
        return { ...t, project: newName };
      }
      return t;
    });
    setTodos(updated);

    if (selectedProjectFilter.toLowerCase() === oldName.toLowerCase()) {
      setSelectedProjectFilter(newName);
    }

    setEditingProj(null);
    const toastId = toast.loading(`Renaming "${oldName}" to "${newName}"...`);

    try {
      if (email) {
        await renameProjectApi({
          email,
          oldProjectName: oldName,
          newProjectName: newName,
        }).unwrap();
      }
      toast.success(`Project renamed to "${newName}" 🎉`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to rename project.");
      setTodos(previousTodos);
      if (selectedProjectFilter.toLowerCase() === newName.toLowerCase()) {
        setSelectedProjectFilter(oldName);
      }
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Handle deleting/unassigning a project from all tasks
  const handleDelete = async (projectName: string) => {
    const previousTodos = [...todos];

    // Optimistic update: clear project tag from tasks
    const updated = todos.map((t: any) => {
      if (
        t.project &&
        t.project.trim().toLowerCase() === projectName.toLowerCase()
      ) {
        return { ...t, project: "" };
      }
      return t;
    });
    setTodos(updated);

    if (selectedProjectFilter.toLowerCase() === projectName.toLowerCase()) {
      setSelectedProjectFilter("all");
    }

    setDeletingProj(null);
    const toastId = toast.loading(`Removing project "${projectName}"...`);

    try {
      if (email) {
        await deleteProjectApi({
          email,
          projectName,
        }).unwrap();
      }
      toast.success(`Project "${projectName}" removed from tasks.`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete project.");
      setTodos(previousTodos);
      if (selectedProjectFilter === "all") {
        setSelectedProjectFilter(projectName);
      }
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Manage Projects
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rename or delete project tags across all your tasks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Projects List & Actions */}
        <div className="p-6 overflow-y-auto space-y-3 flex-grow">
          {availableProjects.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Layers className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium">No projects created yet.</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Add a project name when creating or editing a task!
              </p>
            </div>
          ) : (
            availableProjects.map((proj) => {
              const projTasks = todos.filter(
                (t: any) =>
                  !t?.isDeleted &&
                  t.project &&
                  t.project.trim().toLowerCase() === proj.toLowerCase()
              );
              const completedCount = projTasks.filter((t: any) => t.completed).length;
              const pendingCount = projTasks.length - completedCount;
              const isEditingThis = editingProj === proj;
              const isDeletingThis = deletingProj === proj;

              return (
                <div
                  key={proj}
                  className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40 flex items-center justify-between gap-3 transition-all hover:border-purple-200 dark:hover:border-purple-800"
                >
                  {isEditingThis ? (
                    <div className="flex items-center gap-2 flex-grow">
                      <Input
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(proj);
                          if (e.key === "Escape") setEditingProj(null);
                        }}
                        autoFocus
                        className="h-8 text-xs rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => handleRename(proj)}
                        className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProj(null)}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : isDeletingThis ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Remove &ldquo;{proj}&rdquo; tag from {projTasks.length} {projTasks.length === 1 ? "task" : "tasks"}?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleDelete(proj)}
                          className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-2.5"
                        >
                          Confirm
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingProj(null)}
                          className="h-7 text-xs rounded-lg px-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FolderKanban className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {proj}
                          </h4>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {projTasks.length} {projTasks.length === 1 ? "task" : "tasks"} • {pendingCount} pending, {completedCount} done
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProj(proj);
                            setRenameInput(proj);
                            setDeletingProj(null);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors"
                          title="Rename project"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingProj(proj);
                            setEditingProj(null);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-700 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50/80 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
