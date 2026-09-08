"use client";

import {
  useAddTodoMutation,
  useDeleteTodoMutation,
  useBulkDeleteTodosMutation,
  useEditTodoMutation,
  useBulkUpdateTodosMutation,
} from "@/Redux/features/Todo List/todoApi";
import { useAppSelector } from "@/Redux/hooks";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { HabitTrackerLoading } from "@/utils/Loading Spinner/Loading Skeleton/Skeleton";
import {
  CheckCircle2,
  Circle,
  Edit3,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Check,
  X,
  ListTodo,
  Clock,
  Sparkles,
  CalendarDays,
  Copy,
  Flag,
  FolderKanban,
  Tag,
  Settings2,
  FileText,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { PriorityLevel, useAddTodolist } from "./hooks/useAddTodolist";
import { TodoCalendar } from "./Calendar/TodoCalendar";
import { ProjectAutocomplete } from "./Projects/ProjectAutocomplete";
import { ProjectManagerModal } from "./Projects/ProjectManagerModal";
import { DailyReportModal } from "./Report/DailyReportModal";
import { BulkActionBar } from "./BulkActions/BulkActionBar";

export const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: PriorityLevel; bg: string; text: string; border: string; dot: string }
> = {
  Low: {
    label: "Low",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
  },
  Medium: {
    label: "Medium",
    bg: "bg-teal-500/10 dark:bg-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/30",
    dot: "bg-teal-500",
  },
  High: {
    label: "High",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
  },
  Urgent: {
    label: "Urgent",
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
  },
};

export const normalizePriority = (priority: any): PriorityLevel => {
  if (!priority) return "Medium";
  const p = String(priority).toLowerCase();
  if (p === "urgent") return "Urgent";
  if (p === "high") return "High";
  if (p === "low") return "Low";
  return "Medium";
};

export type ActiveEntityFilter =
  | "total"
  | "pending"
  | "done"
  | "Urgent"
  | "High"
  | "Medium"
  | "Low";

export const TodoList = ({ user }: { user: any }) => {
  const [inputValue, setInputValue] = useState("");
  const [inputPriority, setInputPriority] = useState<PriorityLevel>("Medium");
  const [inputStatus, setInputStatus] = useState<"Completed" | "Pending">("Completed");
  const [inputProject, setInputProject] = useState("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportInitialTab, setReportInitialTab] = useState<"daily" | "monthly">("daily");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [entityFilter, setEntityFilter] = useState<ActiveEntityFilter>("total");
  const [filterMode, setFilterMode] = useState<"date" | "all">("date");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<any>(null);
  const [editingText, setEditingText] = useState("");
  const [editingPriority, setEditingPriority] = useState<PriorityLevel>("Medium");
  const [editingProject, setEditingProject] = useState("");
  const [copiedId, setCopiedId] = useState<any>(null);
  const [selectedTodoIds, setSelectedTodoIds] = useState<string[]>([]);

  const [deleteTodo] = useDeleteTodoMutation();
  const [bulkDeleteTodos] = useBulkDeleteTodosMutation();
  const [editTodo] = useEditTodoMutation();
  const [bulkUpdateTodos] = useBulkUpdateTodosMutation();

  const userState = useAppSelector((state) => state.user);
  const userData = userState.user;
  const userLoading = userState.userLoading;
  const [todos, setTodos] = useState(userData?.todos || []);

  useEffect(() => {
    setTodos(userData?.todos || []);
  }, [userData]);

  // Extract all unique project names from active todos
  const availableProjects = useMemo(() => {
    const nonDeleted = todos?.filter((t: any) => !t?.isDeleted) || [];
    const projectSet = new Set<string>();
    nonDeleted.forEach((t: any) => {
      if (t?.project && typeof t.project === "string" && t.project.trim()) {
        projectSet.add(t.project.trim());
      }
    });
    return Array.from(projectSet).sort();
  }, [todos]);

  // Map of project name to task count
  const projectCounts = useMemo(() => {
    const nonDeleted = todos?.filter((t: any) => !t?.isDeleted) || [];
    const map: Record<string, number> = {};
    nonDeleted.forEach((t: any) => {
      if (t?.project && typeof t.project === "string" && t.project.trim()) {
        const name = t.project.trim();
        map[name] = (map[name] || 0) + 1;
      }
    });
    return map;
  }, [todos]);

  const handleAddTodo = useAddTodolist({
    user,
    inputValue,
    setTodos,
    setInputValue,
    selectedDate,
    priority: inputPriority,
    project: inputProject,
    setProject: setInputProject,
    completed: inputStatus === "Completed",
  });

  // Helper to extract yyyy-MM-dd date key for internal filtering
  const getTodoDateKey = useCallback((todo: any): string => {
    if (todo?.date) {
      return typeof todo.date === "string"
        ? todo.date.substring(0, 10)
        : format(new Date(todo.date), "yyyy-MM-dd");
    }
    if (todo?.createdAt) {
      try {
        const d = new Date(Number(todo.createdAt) || todo.createdAt);
        if (!isNaN(d.getTime())) {
          return format(d, "yyyy-MM-dd");
        }
      } catch {
        return format(new Date(), "yyyy-MM-dd");
      }
    }
    return format(new Date(), "yyyy-MM-dd");
  }, []);

  // Helper to format date for display in date-month-year format (dd-MM-yyyy)
  const formatDisplayDate = useCallback((dateVal: any): string => {
    if (!dateVal) return "";
    try {
      if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [year, month, day] = dateVal.split("-");
        return `${day}-${month}-${year}`;
      }
      const d = new Date(Number(dateVal) || dateVal);
      if (!isNaN(d.getTime())) {
        return format(d, "dd-MM-yyyy");
      }
    } catch {
      // fallback
    }
    return String(dateVal);
  }, []);

  const selectedDateKey = useMemo(
    () => format(selectedDate, "yyyy-MM-dd"),
    [selectedDate]
  );

  // Statistics for selected date
  const selectedDateStats = useMemo(() => {
    const nonDeleted = todos?.filter((t: any) => !t?.isDeleted) || [];
    const dateTodos = nonDeleted.filter(
      (t: any) => getTodoDateKey(t) === selectedDateKey
    );
    const total = dateTodos.length;
    const completed = dateTodos.filter((t: any) => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, percentage };
  }, [todos, selectedDateKey, getTodoDateKey]);

  // Statistics dynamically synced with active viewMode ("date" vs "all")
  const activeStats = useMemo(() => {
    const nonDeleted = todos?.filter((t: any) => !t?.isDeleted) || [];
    const relevantTodos =
      filterMode === "date"
        ? nonDeleted.filter((t: any) => getTodoDateKey(t) === selectedDateKey)
        : nonDeleted;

    const total = relevantTodos.length;
    const completed = relevantTodos.filter((t: any) => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const title =
      filterMode === "date"
        ? `Progress for ${format(selectedDate, "dd-MM-yyyy")}`
        : "Progress for All Tasks";

    const priorities: Record<PriorityLevel, number> = {
      Urgent: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    relevantTodos.forEach((t: any) => {
      const p = normalizePriority(t.priority);
      priorities[p] += 1;
    });

    return { total, completed, pending, percentage, title, priorities };
  }, [todos, filterMode, selectedDateKey, selectedDate, getTodoDateKey]);

  // Handle clicking on progress bar entities
  const handleSelectEntity = (entity: ActiveEntityFilter) => {
    if (entity === entityFilter && entity !== "total") {
      setEntityFilter("total");
      setFilter("all");
    } else {
      setEntityFilter(entity);
      if (entity === "total") setFilter("all");
      else if (entity === "pending") setFilter("active");
      else if (entity === "done") setFilter("completed");
    }
  };

  // Handle changing status filter from tabs
  const handleChangeFilter = (newFilter: "all" | "active" | "completed") => {
    setFilter(newFilter);
    if (newFilter === "all") setEntityFilter("total");
    else if (newFilter === "active") setEntityFilter("pending");
    else if (newFilter === "completed") setEntityFilter("done");
  };

  // Handle toggling todo completion
  const handleToggleTodo = async (createdAt: string, isCompleted: boolean) => {
    if (!user) {
      toast.error("You need to login first to toggle todos.");
      return;
    }

    const todoIndex = todos.findIndex(
      (todo: any) => todo.createdAt === createdAt
    );
    if (todoIndex === -1) return;

    const updatedTodo = { ...todos[todoIndex], completed: !isCompleted };
    const toastId = toast.loading("Updating todo...");

    // Optimistic update
    const updatedTodos = [...todos];
    updatedTodos[todoIndex] = updatedTodo;
    setTodos(updatedTodos);

    try {
      const response: any = await editTodo({
        todo: {
          createdAt,
          completed: !isCompleted,
          email: user.providerData[0]?.email || user?.email,
        },
      });

      if ("error" in response) {
        toast.error(response.error.data?.message || "Failed to update todo.");
        const revertedTodos = [...todos];
        revertedTodos[todoIndex].completed = isCompleted;
        setTodos(revertedTodos);
      } else {
        toast.success(
          !isCompleted ? "Task completed! 🎉" : "Task marked pending."
        );
      }
    } catch {
      toast.error("An unexpected error occurred while updating the todo.");
      const revertedTodos = [...todos];
      revertedTodos[todoIndex].completed = isCompleted;
      setTodos(revertedTodos);
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Handle changing priority on the fly
  const handleChangePriority = async (createdAt: string, newPriority: PriorityLevel) => {
    if (!user) {
      toast.error("You need to login first to change priority.");
      return;
    }

    const todoIndex = todos.findIndex(
      (todo: any) => todo.createdAt === createdAt
    );
    if (todoIndex === -1) return;

    const oldPriority = todos[todoIndex].priority || "Medium";
    if (oldPriority === newPriority) return;

    const updatedTodo = { ...todos[todoIndex], priority: newPriority };

    // Optimistic update
    const updatedTodos = [...todos];
    updatedTodos[todoIndex] = updatedTodo;
    setTodos(updatedTodos);

    try {
      const response: any = await editTodo({
        todo: {
          createdAt,
          priority: newPriority,
          email: user.providerData[0]?.email || user?.email,
        },
      });

      if ("error" in response) {
        toast.error(response.error.data?.message || "Failed to update priority.");
        const revertedTodos = [...todos];
        revertedTodos[todoIndex].priority = oldPriority;
        setTodos(revertedTodos);
      } else {
        toast.success(`Priority updated to ${newPriority}`);
      }
    } catch {
      toast.error("An unexpected error occurred while updating priority.");
      const revertedTodos = [...todos];
      revertedTodos[todoIndex].priority = oldPriority;
      setTodos(revertedTodos);
    }
  };

  // Handle deleting a todo
  const handleDeleteTodo = async (createdAt: string) => {
    if (!user) {
      toast.error("You need to login first to delete todos.");
      return;
    }

    const todoIndex = todos.findIndex(
      (todo: any) => todo.createdAt === createdAt
    );
    if (todoIndex === -1) return;

    const todoToDelete = todos[todoIndex];
    const toastId = toast.loading("Deleting todo...");

    // Optimistic delete
    setTodos((prevTodos: any) =>
      prevTodos.filter((todo: any) => todo.createdAt !== createdAt)
    );

    try {
      const response: any = await deleteTodo({
        createdAt,
        email: user.providerData[0]?.email || user?.email,
      });

      if ("error" in response) {
        toast.error(response.error.data?.message || "Failed to delete todo.");
        setTodos((prevTodos: any) => [...prevTodos, todoToDelete]);
      } else {
        toast.success("Todo deleted successfully.");
      }
    } catch {
      toast.error("An unexpected error occurred while deleting the todo.");
      setTodos((prevTodos: any) => [...prevTodos, todoToDelete]);
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Start editing mode
  const handleStartEditing = (todo: any) => {
    setEditingId(todo?.createdAt);
    setEditingText(todo?.text || "");
    setEditingPriority(normalizePriority(todo?.priority));
    setEditingProject(todo?.project || "");
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingText("");
    setEditingProject("");
  };

  // Finish editing todo
  const handleFinishEditing = async (createdAt: string) => {
    if (!user) {
      toast.error("You need to login first to edit todos.");
      return;
    }

    if (!editingText.trim()) {
      toast.error("Task text cannot be empty.");
      return;
    }

    const todoIndex = todos.findIndex(
      (todo: any) => todo.createdAt === createdAt
    );
    if (todoIndex === -1) return;

    const oldText = todos[todoIndex].text;
    const oldPriority = todos[todoIndex].priority || "Medium";
    const oldProject = todos[todoIndex].project || "";

    if (
      oldText === editingText.trim() &&
      oldPriority === editingPriority &&
      oldProject === editingProject.trim()
    ) {
      setEditingId(null);
      return;
    }

    const updatedTodo = {
      ...todos[todoIndex],
      text: editingText.trim(),
      priority: editingPriority,
      project: editingProject.trim(),
    };
    const toastId = toast.loading("Saving changes...");

    // Optimistic update
    const updatedTodos = [...todos];
    updatedTodos[todoIndex] = updatedTodo;
    setTodos(updatedTodos);
    setEditingId(null);

    try {
      const response: any = await editTodo({
        todo: {
          createdAt,
          text: editingText.trim(),
          priority: editingPriority,
          project: editingProject.trim(),
          email: user.providerData[0]?.email || user?.email,
        },
      });

      if ("error" in response) {
        toast.error(response.error.data?.message || "Failed to edit todo.");
        const revertedTodos = [...todos];
        revertedTodos[todoIndex].text = oldText;
        revertedTodos[todoIndex].priority = oldPriority;
        revertedTodos[todoIndex].project = oldProject;
        setTodos(revertedTodos);
      } else {
        toast.success("Todo updated successfully.");
      }
    } catch {
      toast.error("An unexpected error occurred while editing the todo.");
      const revertedTodos = [...todos];
      revertedTodos[todoIndex].text = oldText;
      revertedTodos[todoIndex].priority = oldPriority;
      revertedTodos[todoIndex].project = oldProject;
      setTodos(revertedTodos);
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Handle copying task text to clipboard
  const handleCopyTodo = useCallback((todo: any) => {
    if (!todo?.text) return;
    try {
      navigator.clipboard.writeText(todo.text);
      setCopiedId(todo.createdAt);
      toast.success("Task copied to clipboard! 📋");
      setTimeout(() => {
        setCopiedId((curr: any) => (curr === todo.createdAt ? null : curr));
      }, 2000);
    } catch {
      toast.error("Failed to copy task.");
    }
  }, []);

  // Helper to get reliable numeric timestamp for sorting latest first
  const getTodoTimestamp = useCallback((todo: any): number => {
    if (todo?.createdAt) {
      const time = new Date(todo.createdAt).getTime();
      if (!isNaN(time) && time > 0) return time;
      const num = Number(todo.createdAt);
      if (!isNaN(num) && num > 0) return num;
    }
    if (todo?.date) {
      const time = new Date(todo.date).getTime();
      if (!isNaN(time) && time > 0) return time;
    }
    if (todo?.updatedAt) {
      const time = new Date(todo.updatedAt).getTime();
      if (!isNaN(time) && time > 0) return time;
    }
    return 0;
  }, []);

  // Filtered and sorted todos list
  const filteredTodos = useMemo(() => {
    const nonDeletedTodos = todos?.filter((todo: any) => !todo?.isDeleted) || [];

    // Date filtering if in 'date' mode
    const dateFiltered =
      filterMode === "date"
        ? nonDeletedTodos.filter(
            (todo: any) => getTodoDateKey(todo) === selectedDateKey
          )
        : nonDeletedTodos;

    // Filter by Project if selected
    const projectFiltered =
      selectedProjectFilter === "all"
        ? dateFiltered
        : dateFiltered.filter(
            (todo: any) =>
              todo.project &&
              typeof todo.project === "string" &&
              todo.project.trim().toLowerCase() === selectedProjectFilter.toLowerCase()
          );

    // Filter by entity selection or status filter
    const entityFiltered = projectFiltered.filter((todo: any) => {
      if (entityFilter === "pending") return !todo.completed;
      if (entityFilter === "done") return todo.completed;
      if (
        entityFilter === "Urgent" ||
        entityFilter === "High" ||
        entityFilter === "Medium" ||
        entityFilter === "Low"
      ) {
        return normalizePriority(todo.priority) === entityFilter;
      }
      switch (filter) {
        case "active":
          return !todo.completed;
        case "completed":
          return todo.completed;
        default:
          return true;
      }
    });

    // Sort: pending first, then latest first within each status group
    return entityFiltered.sort((a: any, b: any) => {
      if (a.completed === b.completed) {
        return getTodoTimestamp(b) - getTodoTimestamp(a);
      }
      return a.completed ? 1 : -1;
    });
  }, [
    todos,
    filterMode,
    selectedDateKey,
    selectedProjectFilter,
    filter,
    entityFilter,
    getTodoDateKey,
    getTodoTimestamp,
  ]);

  // Selection computed states
  const allFilteredSelected = useMemo(() => {
    return (
      filteredTodos.length > 0 &&
      filteredTodos.every((t: any) => selectedTodoIds.includes(t.createdAt))
    );
  }, [filteredTodos, selectedTodoIds]);

  const someFilteredSelected = useMemo(() => {
    return (
      !allFilteredSelected &&
      filteredTodos.some((t: any) => selectedTodoIds.includes(t.createdAt))
    );
  }, [allFilteredSelected, filteredTodos, selectedTodoIds]);

  // Toggle single task selection
  const handleToggleSelectTodo = (id: string) => {
    setSelectedTodoIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle select all visible/filtered tasks
  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Unselect all currently filtered tasks
      const filteredIds = new Set(filteredTodos.map((t: any) => t.createdAt));
      setSelectedTodoIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Add all currently filtered tasks to selection
      const newSelected = new Set([
        ...selectedTodoIds,
        ...filteredTodos.map((t: any) => t.createdAt),
      ]);
      setSelectedTodoIds(Array.from(newSelected));
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedTodoIds([]);
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    if (selectedTodoIds.length === 0 || !user?.email) return;

    const count = selectedTodoIds.length;
    const idsToDelete = [...selectedTodoIds];
    const userEmail = user.providerData?.[0]?.email || user?.email;

    // Optimistic local state update
    const previousTodos = [...todos];
    setTodos((prev: any[]) =>
      prev.filter((t: any) => !idsToDelete.includes(t.createdAt))
    );
    setSelectedTodoIds([]);

    const toastId = toast.loading(
      `Deleting ${count} task${count > 1 ? "s" : ""}...`
    );

    try {
      const response: any = await bulkDeleteTodos({
        email: userEmail,
        createdAtList: idsToDelete,
      });

      if (response?.error) {
        // Fallback parallel delete
        await Promise.all(
          idsToDelete.map((createdAt) =>
            deleteTodo({ createdAt, email: userEmail })
          )
        );
      }
      toast.success(`Deleted ${count} task${count > 1 ? "s" : ""}! 🗑️`, {
        id: toastId,
      });
    } catch (err) {
      console.error("Error in bulk delete:", err);
      setTodos(previousTodos);
      toast.error("Failed to delete selected tasks.", { id: toastId });
    }
  };

  // Bulk Complete / Incomplete Handler
  const handleBulkToggleComplete = async (completed: boolean) => {
    if (selectedTodoIds.length === 0 || !user?.email) return;

    const count = selectedTodoIds.length;
    const idsToUpdate = [...selectedTodoIds];
    const userEmail = user.providerData?.[0]?.email || user?.email;

    // Optimistic local state update
    const previousTodos = [...todos];
    setTodos((prev: any[]) =>
      prev.map((t: any) =>
        idsToUpdate.includes(t.createdAt) ? { ...t, completed } : t
      )
    );

    const toastId = toast.loading(
      `Marking ${count} task${count > 1 ? "s" : ""} as ${
        completed ? "done" : "active"
      }...`
    );

    try {
      const response: any = await bulkUpdateTodos({
        email: userEmail,
        createdAtList: idsToUpdate,
        updates: { completed },
      });

      if (response?.error) {
        // Fallback parallel edit
        await Promise.all(
          idsToUpdate.map((createdAt) =>
            editTodo({
              createdAt,
              email: userEmail,
              completed,
            })
          )
        );
      }
      toast.success(
        `Marked ${count} task${count > 1 ? "s" : ""} as ${
          completed ? "done" : "active"
        }! ✨`,
        { id: toastId }
      );
    } catch (err) {
      console.error("Error in bulk update:", err);
      setTodos(previousTodos);
      toast.error("Failed to update selected tasks.", { id: toastId });
    }
  };

  // Formatted date relative badge
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE");
  };

  const priorityLevels: PriorityLevel[] = ["Low", "Medium", "High", "Urgent"];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 transition-colors">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent dark:from-orange-500/10 dark:via-amber-500/5 dark:to-transparent p-6 rounded-3xl border border-teal-500/20 dark:border-orange-500/20 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-teal-500 text-white dark:bg-orange-400 dark:text-gray-950 shadow-md">
              <ListTodo className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Todo List & Calendar
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Organize, schedule, and prioritize your daily tasks with ease.
          </p>
        </div>

        {/* Selected Date Quick Status */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800/80 px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
          <CalendarDays className="w-5 h-5 text-teal-600 dark:text-orange-400" />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-orange-400">
                {getDateLabel(selectedDate)}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {selectedDateStats.total} {selectedDateStats.total === 1 ? "task" : "tasks"}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {format(selectedDate, "dd-MM-yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Top Overview & Synced Progress Bar with Clickable Priorities */}
      <div className="mb-8 bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-5 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700/60 transition-all duration-300">
        {/* Header Row: Title & Percentage */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 dark:bg-orange-500/10 text-teal-600 dark:text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                {activeStats.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeStats.completed} of {activeStats.total} {activeStats.total === 1 ? "task" : "tasks"} completed
                {entityFilter !== "total" && (
                  <span className="ml-2 inline-flex items-center text-teal-600 dark:text-orange-400 font-semibold">
                    • Filtered by: {entityFilter}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-orange-500/10 text-teal-700 dark:text-orange-400 border border-teal-500/20 dark:border-orange-500/20 shadow-sm">
              {activeStats.percentage}% Completed
            </span>
          </div>
        </div>

        {/* Full-width Animated Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700/70 rounded-full h-3 overflow-hidden mb-5">
          <div
            className="bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-500 dark:from-orange-400 dark:via-amber-400 dark:to-emerald-400 h-3 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${activeStats.percentage}%` }}
          />
        </div>

        {/* Clickable Entities Row: Status Metrics + Priority Breakdown Entities */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          {/* Total Tasks (Click to show all) */}
          <button
            type="button"
            onClick={() => handleSelectEntity("total")}
            title="Show all tasks"
            className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 ${
              entityFilter === "total"
                ? "bg-teal-500/15 dark:bg-orange-500/15 border-teal-500 dark:border-orange-400 ring-2 ring-teal-500/70 dark:ring-orange-400/70 shadow-sm scale-[1.03]"
                : "bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70"
            }`}
          >
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-base font-extrabold text-gray-800 dark:text-white mt-0.5">
              {activeStats.total}
            </span>
          </button>

          {/* Pending Tasks (Click to filter pending) */}
          <button
            type="button"
            onClick={() => handleSelectEntity("pending")}
            title="Filter pending tasks"
            className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 text-amber-600 dark:text-orange-400 ${
              entityFilter === "pending"
                ? "bg-amber-500/25 border-amber-500 dark:border-orange-400 ring-2 ring-amber-500 dark:ring-orange-400 shadow-sm scale-[1.03] font-bold"
                : "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
            }`}
          >
            <span className="text-[11px] font-semibold">Pending</span>
            <span className="text-base font-extrabold mt-0.5">{activeStats.pending}</span>
          </button>

          {/* Done Tasks (Click to filter completed) */}
          <button
            type="button"
            onClick={() => handleSelectEntity("done")}
            title="Filter completed tasks"
            className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 text-emerald-600 dark:text-emerald-400 ${
              entityFilter === "done"
                ? "bg-emerald-500/25 border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-sm scale-[1.03] font-bold"
                : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
            }`}
          >
            <span className="text-[11px] font-semibold">Done</span>
            <span className="text-base font-extrabold mt-0.5">{activeStats.completed}</span>
          </button>

          {/* Urgent Priority Entity (Click to filter urgent) */}
          <button
            type="button"
            onClick={() => handleSelectEntity("Urgent")}
            title="Filter Urgent priority tasks"
            className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 text-rose-600 dark:text-rose-400 ${
              entityFilter === "Urgent"
                ? "bg-rose-500/25 border-rose-500 ring-2 ring-rose-500 shadow-md shadow-rose-500/20 scale-[1.03] font-bold"
                : "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20"
            }`}
          >
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Urgent
            </span>
            <span className="text-base font-extrabold mt-0.5">{activeStats.priorities.Urgent}</span>
          </button>

          {/* High Priority Entity (Click to filter high) */}
          <button
            type="button"
            onClick={() => handleSelectEntity("High")}
            title="Filter High priority tasks"
            className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 text-amber-600 dark:text-amber-400 ${
              entityFilter === "High"
                ? "bg-amber-500/25 border-amber-500 ring-2 ring-amber-500 shadow-md shadow-amber-500/20 scale-[1.03] font-bold"
                : "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
            }`}
          >
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> High
            </span>
            <span className="text-base font-extrabold mt-0.5">{activeStats.priorities.High}</span>
          </button>

          {/* Medium Priority Entity (Click to filter medium) */}
          <button
            type="button"
            onClick={() => handleSelectEntity("Medium")}
            title="Filter Medium priority tasks"
            className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 text-teal-600 dark:text-teal-400 ${
              entityFilter === "Medium"
                ? "bg-teal-500/25 border-teal-500 ring-2 ring-teal-500 shadow-md shadow-teal-500/20 scale-[1.03] font-bold"
                : "bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20"
            }`}
          >
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Medium
            </span>
            <span className="text-base font-extrabold mt-0.5">{activeStats.priorities.Medium}</span>
          </button>

          {/* Low Priority Entity (Click to filter low) */}
          <button
            type="button"
            onClick={() => handleSelectEntity("Low")}
            title="Filter Low priority tasks"
            className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.03] active:scale-95 text-blue-600 dark:text-blue-400 col-span-2 sm:col-span-1 ${
              entityFilter === "Low"
                ? "bg-blue-500/25 border-blue-500 ring-2 ring-blue-500 shadow-md shadow-blue-500/20 scale-[1.03] font-bold"
                : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20"
            }`}
          >
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Low
            </span>
            <span className="text-base font-extrabold mt-0.5">{activeStats.priorities.Low}</span>
          </button>
        </div>
      </div>

      {/* Main Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar (5 Columns on Desktop) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interactive Calendar */}
          <TodoCalendar
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setFilterMode("date");
            }}
            todos={todos}
          />
        </div>

        {/* Right Column: Task Management & List (7 Columns on Desktop) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-5 sm:p-7 shadow-lg border border-gray-100 dark:border-gray-700/60 space-y-6">
          {/* Header of Task Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {filterMode === "date"
                    ? `Tasks for ${format(selectedDate, "dd-MM-yyyy")}`
                    : "All Scheduled Tasks"}
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {filterMode === "date"
                  ? `${getDateLabel(selectedDate)}'s list`
                  : "Showing tasks across all dates"}
              </p>
            </div>

            {/* Actions: Daily Report + Monthly Report + View Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  onClick={() => {
                    setReportInitialTab("daily");
                    setIsReportModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-orange-400 dark:to-amber-500 hover:opacity-90 text-white dark:text-gray-950 px-3 py-1.5 h-8 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                  title="Create and copy daily report"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Daily Report</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setReportInitialTab("monthly");
                    setIsReportModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-amber-400 dark:to-orange-500 hover:opacity-90 text-white dark:text-gray-950 px-3 py-1.5 h-8 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                  title="Create and copy monthly report"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Monthly Report</span>
                </Button>
              </div>

              {/* View Mode Switcher: Selected Date vs All Tasks */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterMode("date")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === "date"
                      ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Selected Date
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === "all"
                      ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  All Tasks
                </button>
              </div>
            </div>
          </div>

          {/* Add Task Input Form with Priority & Project Selector */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTodo();
                    }
                  }}
                  placeholder={`Add task for ${format(selectedDate, "dd-MM-yyyy")}...`}
                  className="w-full pl-3.5 pr-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900/70 focus:ring-2 focus:ring-teal-500 dark:focus:ring-orange-400"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddTodo}
                className="bg-teal-500 hover:bg-teal-600 dark:bg-orange-400 dark:hover:bg-orange-500 text-white dark:text-gray-950 px-4 rounded-xl shadow-md transition-transform active:scale-95"
              >
                <Plus className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline font-semibold">Add</span>
              </Button>
            </div>

            {/* Priority & Status & Project Selector & Scheduled Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Selection: Pending vs Completed (Default: Completed) */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mr-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Status:
                  </span>
                  <button
                    type="button"
                    onClick={() => setInputStatus("Pending")}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-all duration-200 flex items-center gap-1.5 ${
                      inputStatus === "Pending"
                        ? "bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30 shadow-sm scale-105"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Circle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <span>Pending</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputStatus("Completed")}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-all duration-200 flex items-center gap-1.5 ${
                      inputStatus === "Completed"
                        ? "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-sm scale-105"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                    <span>Completed</span>
                  </button>
                </div>

                {/* Priority Selection Pills */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mr-0.5">
                    <Flag className="w-3.5 h-3.5" /> Priority:
                  </span>
                  {priorityLevels.map((lvl) => {
                    const cfg = PRIORITY_CONFIG[lvl];
                    const isSelected = inputPriority === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setInputPriority(lvl)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-all duration-200 flex items-center gap-1.5 ${
                          isSelected
                            ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-current shadow-sm scale-105`
                            : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {lvl}
                      </button>
                    );
                  })}
                </div>

                {/* Project Autocomplete Input with Live Suggestions */}
                <ProjectAutocomplete
                  value={inputProject}
                  onChange={setInputProject}
                  availableProjects={availableProjects}
                  projectCounts={projectCounts}
                  onOpenManager={() => setIsProjectManagerOpen(true)}
                  placeholder="Project (optional)"
                />
              </div>

              {/* Scheduled Date Note */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-orange-400" />
                <span>
                  For{" "}
                  <strong className="text-gray-700 dark:text-gray-200">
                    {format(selectedDate, "dd-MM-yyyy")}
                  </strong>
                </span>
              </div>
            </div>

            {/* Quick suggested project chips if available */}
            {availableProjects.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto text-[11px] scrollbar-none">
                <span className="text-gray-400 flex items-center gap-1 whitespace-nowrap">
                  <Tag className="w-3 h-3" /> Quick Project:
                </span>
                {availableProjects.slice(0, 5).map((proj) => (
                  <button
                    key={proj}
                    type="button"
                    onClick={() =>
                      setInputProject((curr) =>
                        curr.trim().toLowerCase() === proj.toLowerCase() ? "" : proj
                      )
                    }
                    className={`px-2 py-0.5 rounded-md border transition-all whitespace-nowrap ${
                      inputProject.trim().toLowerCase() === proj.toLowerCase()
                        ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50 font-semibold scale-105"
                        : "bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                    }`}
                  >
                    #{proj}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project Filter Pills & Manage Button */}
          {availableProjects.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-gray-100 dark:border-gray-700/40">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-shrink-0">
                <FolderKanban className="w-3.5 h-3.5 text-purple-500" /> Projects:
              </span>
              <button
                type="button"
                onClick={() => setSelectedProjectFilter("all")}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all flex-shrink-0 ${
                  selectedProjectFilter === "all"
                    ? "bg-purple-600 text-white shadow-sm font-semibold"
                    : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                All
              </button>
              {availableProjects.map((proj) => {
                const count = (
                  filterMode === "date"
                    ? todos.filter(
                        (t: any) =>
                          !t?.isDeleted &&
                          getTodoDateKey(t) === selectedDateKey &&
                          t.project?.trim().toLowerCase() === proj.toLowerCase()
                      )
                    : todos.filter(
                        (t: any) =>
                          !t?.isDeleted &&
                          t.project?.trim().toLowerCase() === proj.toLowerCase()
                      )
                ).length;

                return (
                  <button
                    key={proj}
                    type="button"
                    onClick={() =>
                      setSelectedProjectFilter((curr) =>
                        curr.toLowerCase() === proj.toLowerCase() ? "all" : proj
                      )
                    }
                    className={`text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      selectedProjectFilter.toLowerCase() === proj.toLowerCase()
                        ? "bg-purple-600 text-white shadow-sm font-semibold ring-2 ring-purple-600/30"
                        : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                    }`}
                  >
                    <span>{proj}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedProjectFilter.toLowerCase() === proj.toLowerCase()
                          ? "bg-purple-800 text-white"
                          : "bg-purple-500/20 text-purple-700 dark:text-purple-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

              {/* Manage Projects button */}
              <button
                type="button"
                onClick={() => setIsProjectManagerOpen(true)}
                className="text-xs px-2 py-1 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-dashed border-purple-300 dark:border-purple-700 flex items-center gap-1 transition-all flex-shrink-0 ml-auto"
                title="Manage all projects (rename / delete)"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-medium">Manage</span>
              </button>
            </div>
          )}

          {/* Filter Status Tabs & Active Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => handleChangeFilter("all")}
                className={`rounded-xl text-xs font-semibold px-3 py-1.5 h-8 transition-all ${
                  filter === "all" && (entityFilter === "total" || entityFilter === "pending" || entityFilter === "done")
                    ? "bg-teal-500 hover:bg-teal-600 text-white dark:bg-orange-400 dark:hover:bg-orange-500 dark:text-gray-950 shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700/60 dark:hover:bg-gray-700 dark:text-gray-300"
                }`}
              >
                All
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleChangeFilter("active")}
                className={`rounded-xl text-xs font-semibold px-3 py-1.5 h-8 transition-all ${
                  filter === "active"
                    ? "bg-teal-500 hover:bg-teal-600 text-white dark:bg-orange-400 dark:hover:bg-orange-500 dark:text-gray-950 shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700/60 dark:hover:bg-gray-700 dark:text-gray-300"
                }`}
              >
                Pending
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleChangeFilter("completed")}
                className={`rounded-xl text-xs font-semibold px-3 py-1.5 h-8 transition-all ${
                  filter === "completed"
                    ? "bg-teal-500 hover:bg-teal-600 text-white dark:bg-orange-400 dark:hover:bg-orange-500 dark:text-gray-950 shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700/60 dark:hover:bg-gray-700 dark:text-gray-300"
                }`}
              >
                Completed
              </Button>

              {/* Active Priority Filter Tag */}
              {entityFilter !== "total" &&
                entityFilter !== "pending" &&
                entityFilter !== "done" && (
                  <button
                    type="button"
                    onClick={() => handleSelectEntity("total")}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
                      PRIORITY_CONFIG[entityFilter as PriorityLevel].bg
                    } ${
                      PRIORITY_CONFIG[entityFilter as PriorityLevel].text
                    } ${
                      PRIORITY_CONFIG[entityFilter as PriorityLevel].border
                    }`}
                    title="Click to clear priority filter"
                  >
                    <span>Priority: {entityFilter}</span>
                    <X className="w-3 h-3 hover:scale-125 transition-transform" />
                  </button>
                )}

              {/* Active Project Filter Tag */}
              {selectedProjectFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedProjectFilter("all")}
                  className="text-xs px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1.5 transition-all shadow-sm bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                  title="Click to clear project filter"
                >
                  <FolderKanban className="w-3 h-3" />
                  <span>Project: {selectedProjectFilter}</span>
                  <X className="w-3 h-3 hover:scale-125 transition-transform" />
                </button>
              )}
            </div>

            {/* Mark All / Unmark All toggle + Task counter */}
            <div className="flex items-center gap-3">
              {filteredTodos.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-orange-400 flex items-center gap-1.5 transition-colors p-1 px-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title={
                    allFilteredSelected
                      ? "Unmark all tasks"
                      : "Mark all tasks for bulk action"
                  }
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 text-teal-600 dark:text-orange-400" />
                  ) : someFilteredSelected ? (
                    <MinusSquare className="w-4 h-4 text-teal-600 dark:text-orange-400" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <span>{allFilteredSelected ? "Unmark All" : "Mark All"}</span>
                </button>
              )}

              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Showing {filteredTodos.length}{" "}
                {filteredTodos.length === 1 ? "task" : "tasks"}
              </span>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {userLoading && <HabitTrackerLoading />}

            {!userLoading && filteredTodos.length === 0 && (
              <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-teal-500/10 dark:bg-orange-500/10 flex items-center justify-center text-teal-600 dark:text-orange-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
                  No tasks found
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {filterMode === "date"
                    ? `There are no ${filter !== "all" ? filter : ""} tasks ${selectedProjectFilter !== "all" ? `for project "${selectedProjectFilter}"` : ""} scheduled for ${format(selectedDate, "dd-MM-yyyy")}.`
                    : `No ${filter !== "all" ? filter : ""} tasks found in your list.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.querySelector('input[placeholder*="Add task"]') as HTMLInputElement;
                    if (el) el.focus();
                  }}
                  className="mt-4 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-orange-400 dark:hover:text-orange-300 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add a new task now
                </button>
              </div>
            )}

            {user &&
              filteredTodos.map((todo: any) => {
                const isEditing = editingId === todo.createdAt;
                const todoDateStr = getTodoDateKey(todo);
                const priority = normalizePriority(todo.priority);
                const priorityCfg = PRIORITY_CONFIG[priority];
                const isSelected = selectedTodoIds.includes(todo.createdAt);

                return (
                  <div
                    key={todo.createdAt}
                    className={`group flex items-start sm:items-center gap-2.5 sm:gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-teal-500/10 dark:bg-orange-500/15 border-teal-500/60 dark:border-orange-400/60 ring-1 ring-teal-500/30 dark:ring-orange-400/30 shadow-sm"
                        : todo.completed
                        ? "bg-gray-50/80 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 opacity-80"
                        : "bg-white dark:bg-gray-900/70 border-gray-200/80 dark:border-gray-700/80 hover:border-teal-500/50 dark:hover:border-orange-400/50 shadow-sm"
                    }`}
                  >
                    {/* Mark / Select Checkbox for bulk actions */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelectTodo(todo.createdAt);
                      }}
                      className={`p-1 mt-0.5 sm:mt-0 rounded-lg transition-colors focus:outline-none flex-shrink-0 ${
                        isSelected
                          ? "text-teal-600 dark:text-orange-400"
                          : "text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400"
                      }`}
                      title={
                        isSelected
                          ? "Unmark task"
                          : "Mark task for bulk action"
                      }
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    {/* Status Checkbox Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleTodo(todo.createdAt, todo.completed)
                      }
                      className="p-1 mt-0.5 sm:mt-0 rounded-lg text-gray-400 hover:text-teal-500 dark:hover:text-orange-400 transition-colors focus:outline-none flex-shrink-0"
                      title={
                        todo.completed
                          ? "Mark as incomplete"
                          : "Mark as completed"
                      }
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Todo Text or Edit Input */}
                    {isEditing ? (
                      <div className="flex flex-col gap-2 flex-grow">
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleFinishEditing(todo.createdAt);
                              } else if (e.key === "Escape") {
                                handleCancelEditing();
                              }
                            }}
                            autoFocus
                            className="h-9 py-1 px-2.5 text-sm rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleFinishEditing(todo.createdAt)}
                            className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex-shrink-0"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditing}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Priority & Project Selector while editing */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-gray-500">Priority:</span>
                            {priorityLevels.map((lvl) => {
                              const cfg = PRIORITY_CONFIG[lvl];
                              const isSelected = editingPriority === lvl;
                              return (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => setEditingPriority(lvl)}
                                  className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${
                                    isSelected
                                      ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-current`
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent"
                                  }`}
                                >
                                  {lvl}
                                </button>
                              );
                            })}
                          </div>
                          <ProjectAutocomplete
                            value={editingProject}
                            onChange={setEditingProject}
                            availableProjects={availableProjects}
                            projectCounts={projectCounts}
                            onOpenManager={() => setIsProjectManagerOpen(true)}
                            placeholder="Project (optional)"
                            inputClassName="h-7 w-36 dark:bg-gray-800"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col flex-grow min-w-0">
                        <span
                          className={`text-sm leading-snug break-words transition-all ${
                            todo.completed
                              ? "line-through text-gray-400 dark:text-gray-500"
                              : "text-gray-800 dark:text-gray-100 font-medium"
                          }`}
                        >
                          {todo.text}
                        </span>

                        {/* Badges: Priority + Project + Date */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {/* Interactive Priority Badge */}
                          <div className="relative group/priority">
                            <button
                              type="button"
                              onClick={() => {
                                const currentIndex = priorityLevels.indexOf(priority);
                                const nextIndex = (currentIndex + 1) % priorityLevels.length;
                                handleChangePriority(todo.createdAt, priorityLevels[nextIndex]);
                              }}
                              title="Click to cycle priority"
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-all hover:scale-105 ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                              <span>{priority}</span>
                            </button>
                          </div>

                          {/* Project Badge */}
                          {todo.project && typeof todo.project === "string" && todo.project.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectFilter((curr) =>
                                  curr.toLowerCase() === todo.project.trim().toLowerCase()
                                    ? "all"
                                    : todo.project.trim()
                                );
                              }}
                              title={`Filter by project: ${todo.project.trim()}`}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all hover:scale-105 ${
                                selectedProjectFilter.toLowerCase() === todo.project.trim().toLowerCase()
                                  ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-1 ring-purple-600"
                                  : "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20"
                              }`}
                            >
                              <FolderKanban className="w-3 h-3" />
                              <span>{todo.project.trim()}</span>
                            </button>
                          )}

                          {/* Date badge formatted as date-month-year (dd-MM-yyyy) */}
                          {(filterMode === "all" || todoDateStr !== selectedDateKey) && (
                            <span className="text-[11px] text-teal-600 dark:text-orange-400 font-medium flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {formatDisplayDate(todoDateStr)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons (Copy, Edit & Delete) */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyTodo(todo)}
                          aria-label="Copy task text"
                          title={copiedId === todo.createdAt ? "Copied!" : "Copy task"}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:text-orange-400 dark:hover:bg-gray-800 transition-colors"
                        >
                          {copiedId === todo.createdAt ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditing(todo)}
                          aria-label="Edit task"
                          title="Edit task"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:text-orange-400 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTodo(todo.createdAt)}
                          aria-label="Delete task"
                          title="Delete task"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Project Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        availableProjects={availableProjects}
        todos={todos}
        user={user}
        setTodos={setTodos}
        selectedProjectFilter={selectedProjectFilter}
        setSelectedProjectFilter={setSelectedProjectFilter}
      />

      {/* Daily & Monthly Report Generator Modal */}
      <DailyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        todos={todos}
        selectedDate={selectedDate}
        filterMode={filterMode}
        initialTab={reportInitialTab}
      />

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedTodoIds.length}
        totalFilteredCount={filteredTodos.length}
        allSelected={allFilteredSelected}
        onToggleSelectAll={handleToggleSelectAll}
        onBulkDelete={handleBulkDelete}
        onBulkToggleComplete={handleBulkToggleComplete}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
};



