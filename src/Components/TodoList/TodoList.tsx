"use client";

import {
  useAddTodoMutation,
  useDeleteTodoMutation,
  useEditTodoMutation,
} from "@/Redux/features/Todo List/todoApi";
import { useAppSelector } from "@/Redux/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { PriorityLevel, useAddTodolist } from "./hooks/useAddTodolist";
import { TodoCalendar } from "./Calendar/TodoCalendar";

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
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [entityFilter, setEntityFilter] = useState<ActiveEntityFilter>("total");
  const [filterMode, setFilterMode] = useState<"date" | "all">("date");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<any>(null);
  const [editingText, setEditingText] = useState("");
  const [editingPriority, setEditingPriority] = useState<PriorityLevel>("Medium");
  const [copiedId, setCopiedId] = useState<any>(null);

  const [deleteTodo] = useDeleteTodoMutation();
  const [editTodo] = useEditTodoMutation();

  const userState = useAppSelector((state) => state.user);
  const userData = userState.user;
  const userLoading = userState.userLoading;
  const [todos, setTodos] = useState(userData?.todos || []);

  useEffect(() => {
    setTodos(userData?.todos || []);
  }, [userData]);

  const handleAddTodo = useAddTodolist({
    user,
    inputValue,
    setTodos,
    setInputValue,
    selectedDate,
    priority: inputPriority,
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
  };

  // Cancel editing
  const handleCancelEditing = () => {
    setEditingId(null);
    setEditingText("");
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

    if (oldText === editingText.trim() && oldPriority === editingPriority) {
      setEditingId(null);
      return;
    }

    const updatedTodo = {
      ...todos[todoIndex],
      text: editingText.trim(),
      priority: editingPriority,
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
          email: user.providerData[0]?.email || user?.email,
        },
      });

      if ("error" in response) {
        toast.error(response.error.data?.message || "Failed to edit todo.");
        const revertedTodos = [...todos];
        revertedTodos[todoIndex].text = oldText;
        revertedTodos[todoIndex].priority = oldPriority;
        setTodos(revertedTodos);
      } else {
        toast.success("Todo updated successfully.");
      }
    } catch {
      toast.error("An unexpected error occurred while editing the todo.");
      const revertedTodos = [...todos];
      revertedTodos[todoIndex].text = oldText;
      revertedTodos[todoIndex].priority = oldPriority;
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

    // Filter by entity selection or status filter
    const entityFiltered = dateFiltered.filter((todo: any) => {
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
  }, [todos, filterMode, selectedDateKey, filter, entityFilter, getTodoDateKey, getTodoTimestamp]);

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

          {/* Add Task Input Form with Priority Selector */}
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

            {/* Priority Selector & Scheduled Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
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
          </div>

          {/* Filter Status Tabs & Active Entity Chip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
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
                    title="Click to clear filter"
                  >
                    <span>Priority: {entityFilter}</span>
                    <X className="w-3 h-3 hover:scale-125 transition-transform" />
                  </button>
                )}
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Showing {filteredTodos.length} {filteredTodos.length === 1 ? "task" : "tasks"}
            </span>
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
                    ? `There are no ${filter !== "all" ? filter : ""} tasks scheduled for ${format(selectedDate, "dd-MM-yyyy")}.`
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

                return (
                  <div
                    key={todo.createdAt}
                    className={`group flex items-start sm:items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
                      todo.completed
                        ? "bg-gray-50/80 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 opacity-80"
                        : "bg-white dark:bg-gray-900/70 border-gray-200/80 dark:border-gray-700/80 hover:border-teal-500/50 dark:hover:border-orange-400/50 shadow-sm"
                    }`}
                  >
                    {/* Checkbox Toggle Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleTodo(todo.createdAt, todo.completed)
                      }
                      className="p-1 mt-0.5 sm:mt-0 rounded-lg text-gray-400 hover:text-teal-500 dark:hover:text-orange-400 transition-colors focus:outline-none flex-shrink-0"
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
                        {/* Priority Selector while editing */}
                        <div className="flex items-center gap-1.5 pt-1">
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

                        {/* Badges: Priority + Date */}
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
    </div>
  );
};



