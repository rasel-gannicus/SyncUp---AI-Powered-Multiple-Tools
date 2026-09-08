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
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { useAddTodolist } from "./hooks/useAddTodolist";
import { TodoCalendar } from "./Calendar/TodoCalendar";

export const TodoList = ({ user }: { user: any }) => {
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [filterMode, setFilterMode] = useState<"date" | "all">("date");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<any>(null);
  const [editingText, setEditingText] = useState("");

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
  });

  // Helper to extract yyyy-MM-dd date key for a todo
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

    if (todos[todoIndex].text === editingText.trim()) {
      setEditingId(null);
      return;
    }

    const updatedTodo = { ...todos[todoIndex], text: editingText.trim() };
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
          email: user.providerData[0]?.email || user?.email,
        },
      });

      if ("error" in response) {
        toast.error(response.error.data?.message || "Failed to edit todo.");
        const revertedTodos = [...todos];
        revertedTodos[todoIndex].text = todos[todoIndex].text;
        setTodos(revertedTodos);
      } else {
        toast.success("Todo updated successfully.");
      }
    } catch {
      toast.error("An unexpected error occurred while editing the todo.");
      const revertedTodos = [...todos];
      revertedTodos[todoIndex].text = todos[todoIndex].text;
      setTodos(revertedTodos);
    } finally {
      toast.dismiss(toastId);
    }
  };

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

    // Status filtering
    const statusFiltered = dateFiltered.filter((todo: any) => {
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
    return statusFiltered.sort((a: any, b: any) => {
      if (a.completed === b.completed) {
        return getTodoTimestamp(b) - getTodoTimestamp(a);
      }
      return a.completed ? 1 : -1;
    });
  }, [todos, filterMode, selectedDateKey, filter, getTodoDateKey, getTodoTimestamp]);

  // Formatted date relative badge
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE");
  };

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
            Organize, schedule, and track your daily tasks by date with ease.
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
              {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar & Date Overview (5 Columns on Desktop) */}
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

          {/* Date Summary Card */}
          <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-500 dark:text-orange-400" />
                Progress for {format(selectedDate, "MMM d")}
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-orange-500/10 text-teal-700 dark:text-orange-400">
                {selectedDateStats.percentage}% Done
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 dark:from-orange-400 dark:to-amber-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${selectedDateStats.percentage}%` }}
              />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-100 dark:border-gray-700/50">
              <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">
                  {selectedDateStats.total}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-orange-400">
                <p className="text-[11px] text-amber-700/80 dark:text-orange-300/80">
                  Pending
                </p>
                <p className="text-lg font-bold">{selectedDateStats.pending}</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                  Done
                </p>
                <p className="text-lg font-bold">{selectedDateStats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Task Management & List (7 Columns on Desktop) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-5 sm:p-7 shadow-lg border border-gray-100 dark:border-gray-700/60 space-y-6">
          {/* Header of Task Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {filterMode === "date"
                    ? `Tasks for ${format(selectedDate, "MMMM d, yyyy")}`
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

          {/* Add Task Input Form */}
          <div className="space-y-2">
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
                  placeholder={`Add task for ${format(selectedDate, "MMM d")}...`}
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
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 pl-1">
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-orange-400" />
              <span>
                Task will be scheduled for{" "}
                <strong className="text-gray-700 dark:text-gray-200">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </strong>
              </span>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => setFilter("all")}
                className={`rounded-xl text-xs font-semibold px-3 py-1.5 h-8 transition-all ${
                  filter === "all"
                    ? "bg-teal-500 hover:bg-teal-600 text-white dark:bg-orange-400 dark:hover:bg-orange-500 dark:text-gray-950 shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700/60 dark:hover:bg-gray-700 dark:text-gray-300"
                }`}
              >
                All
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setFilter("active")}
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
                onClick={() => setFilter("completed")}
                className={`rounded-xl text-xs font-semibold px-3 py-1.5 h-8 transition-all ${
                  filter === "completed"
                    ? "bg-teal-500 hover:bg-teal-600 text-white dark:bg-orange-400 dark:hover:bg-orange-500 dark:text-gray-950 shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700/60 dark:hover:bg-gray-700 dark:text-gray-300"
                }`}
              >
                Completed
              </Button>
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
                    ? `There are no ${filter !== "all" ? filter : ""} tasks scheduled for ${format(selectedDate, "MMMM d, yyyy")}.`
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

                return (
                  <div
                    key={todo.createdAt}
                    className={`group flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
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
                      className="p-1 rounded-lg text-gray-400 hover:text-teal-500 dark:hover:text-orange-400 transition-colors focus:outline-none flex-shrink-0"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Todo Text or Edit Input */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-grow">
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
                          className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditing}
                          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
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

                        {/* Date badge when viewing all tasks or if different from selected date */}
                        {(filterMode === "all" || todoDateStr !== selectedDateKey) && (
                          <span className="text-[11px] text-teal-600 dark:text-orange-400 font-medium mt-1 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {todoDateStr}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons (Edit & Delete) */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleStartEditing(todo)}
                          aria-label="Edit task"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:text-orange-400 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTodo(todo.createdAt)}
                          aria-label="Delete task"
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


