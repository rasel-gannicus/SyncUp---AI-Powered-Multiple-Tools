"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  CalendarDays,
  Copy,
  Check,
  Download,
  RotateCcw,
  X,
  Sparkles,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  subDays,
} from "date-fns";
import { toast } from "react-hot-toast";

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  todos: any[];
  selectedDate: Date;
  filterMode: "date" | "all";
  initialTab?: "daily" | "monthly" | "custom";
}

/**
 * Generates Daily Report Text matching the user's format:
 * Update {day-ordinal} {month}
 * Project : {project}
 * • {task} (status: ongoing)
 */
export const generateDailyReportText = ({
  todos,
  date,
  mode = "date",
  includeOngoingTag = true,
  onlyCompleted = false,
}: {
  todos: any[];
  date: Date;
  mode?: "date" | "all";
  includeOngoingTag?: boolean;
  onlyCompleted?: boolean;
}): string => {
  const dateKey = format(date, "yyyy-MM-dd");
  const nonDeleted = todos?.filter((t: any) => !t?.isDeleted) || [];

  const getTodoDateKey = (todo: any): string => {
    if (todo?.date) {
      return typeof todo.date === "string"
        ? todo.date.substring(0, 10)
        : format(new Date(todo.date), "yyyy-MM-dd");
    }
    if (todo?.createdAt) {
      try {
        const d = new Date(Number(todo.createdAt) || todo.createdAt);
        if (!isNaN(d.getTime())) return format(d, "yyyy-MM-dd");
      } catch {
        return format(new Date(), "yyyy-MM-dd");
      }
    }
    return format(new Date(), "yyyy-MM-dd");
  };

  const relevantTodos =
    mode === "date"
      ? nonDeleted.filter((t: any) => getTodoDateKey(t) === dateKey)
      : nonDeleted;

  const filtered = onlyCompleted
    ? relevantTodos.filter((t: any) => t.completed)
    : relevantTodos;

  // Formatted date: e.g. "6th september"
  const formattedDateStr = format(date, "do MMMM").toLowerCase();
  const header =
    mode === "date"
      ? `Update ${formattedDateStr}`
      : `Update All Tasks - ${format(new Date(), "do MMMM").toLowerCase()}`;

  // Group by project
  const projectGroups: Record<string, any[]> = {};
  const noProjectTasks: any[] = [];

  filtered.forEach((t: any) => {
    const proj =
      t.project && typeof t.project === "string" && t.project.trim();
    if (proj) {
      if (!projectGroups[proj]) {
        projectGroups[proj] = [];
      }
      projectGroups[proj].push(t);
    } else {
      noProjectTasks.push(t);
    }
  });

  const lines: string[] = [header];

  // Tasks grouped under projects
  Object.keys(projectGroups).forEach((proj) => {
    lines.push(`Project : ${proj}`);
    projectGroups[proj].forEach((t: any) => {
      let line = `• ${t.text}`;
      if (includeOngoingTag && !t.completed) {
        line += ` (status: ongoing)`;
      }
      lines.push(line);
    });
  });

  // Unassigned / General tasks
  if (noProjectTasks.length > 0) {
    if (Object.keys(projectGroups).length > 0) {
      lines.push(`Project : General`);
    }
    noProjectTasks.forEach((t: any) => {
      let line = `• ${t.text}`;
      if (includeOngoingTag && !t.completed) {
        line += ` (status: ongoing)`;
      }
      lines.push(line);
    });
  }

  if (filtered.length === 0) {
    lines.push(`• No tasks scheduled for this date.`);
  }

  return lines.join("\n");
};

/**
 * Generates Monthly Report Text matching project-wise structure:
 * Monthly Report - {Month} {Year}
 * Project : {project}
 * • [optional date] {task} (status: ongoing)
 */
export const generateMonthlyReportText = ({
  todos,
  monthDate,
  includeOngoingTag = true,
  onlyCompleted = false,
  includeDates = false,
  includeSummary = false,
}: {
  todos: any[];
  monthDate: Date;
  includeOngoingTag?: boolean;
  onlyCompleted?: boolean;
  includeDates?: boolean;
  includeSummary?: boolean;
}): string => {
  const monthKey = format(monthDate, "yyyy-MM");
  const nonDeleted = todos?.filter((t: any) => !t?.isDeleted) || [];

  const getTodoDate = (todo: any): Date => {
    if (todo?.date) {
      const d = new Date(todo.date);
      if (!isNaN(d.getTime())) return d;
    }
    if (todo?.createdAt) {
      const d = new Date(Number(todo.createdAt) || todo.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const relevantTodos = nonDeleted.filter((t: any) => {
    const d = getTodoDate(t);
    return format(d, "yyyy-MM") === monthKey;
  });

  const filtered = onlyCompleted
    ? relevantTodos.filter((t: any) => t.completed)
    : relevantTodos;

  const monthName = format(monthDate, "MMMM yyyy");
  const header = `Monthly Report - ${monthName}`;

  // Group by project
  const projectGroups: Record<string, any[]> = {};
  const noProjectTasks: any[] = [];

  let completedCount = 0;
  let ongoingCount = 0;

  filtered.forEach((t: any) => {
    if (t.completed) completedCount++;
    else ongoingCount++;

    const proj =
      t.project && typeof t.project === "string" && t.project.trim();
    if (proj) {
      if (!projectGroups[proj]) {
        projectGroups[proj] = [];
      }
      projectGroups[proj].push(t);
    } else {
      noProjectTasks.push(t);
    }
  });

  const lines: string[] = [header];

  if (includeSummary && filtered.length > 0) {
    const projectCount =
      Object.keys(projectGroups).length + (noProjectTasks.length > 0 ? 1 : 0);
    lines.push(
      `📊 Summary: ${filtered.length} Tasks (${completedCount} Completed, ${ongoingCount} Ongoing) across ${projectCount} Projects\n`
    );
  }

  // Tasks grouped under projects
  Object.keys(projectGroups).forEach((proj) => {
    lines.push(`Project : ${proj}`);
    projectGroups[proj].forEach((t: any) => {
      let line = "• ";
      if (includeDates) {
        const d = getTodoDate(t);
        line += `[${format(d, "dd-MM-yyyy")}] `;
      }
      line += t.text;
      if (includeOngoingTag && !t.completed) {
        line += ` (status: ongoing)`;
      }
      lines.push(line);
    });
  });

  // Unassigned / General tasks
  if (noProjectTasks.length > 0) {
    if (Object.keys(projectGroups).length > 0) {
      lines.push(`Project : General`);
    }
    noProjectTasks.forEach((t: any) => {
      let line = "• ";
      if (includeDates) {
        const d = getTodoDate(t);
        line += `[${format(d, "dd-MM-yyyy")}] `;
      }
      line += t.text;
      if (includeOngoingTag && !t.completed) {
        line += ` (status: ongoing)`;
      }
      lines.push(line);
    });
  }

  if (filtered.length === 0) {
    lines.push(`• No tasks scheduled for ${monthName}.`);
  }

  return lines.join("\n");
};

/**
 * Formats combined date header:
 * If same month: "Update 10, 11, 12 September"
 * If different months: "Update 30 September, 1, 2 October"
 */
export const formatCombinedDatesHeader = (sortedDateKeys: string[]): string => {
  if (!sortedDateKeys || sortedDateKeys.length === 0) return "Update";

  // Group day numbers by month & year
  const monthGroups: { monthName: string; year: number; days: number[] }[] = [];

  sortedDateKeys.forEach((dateKey) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const monthName = format(dateObj, "MMMM");

    let lastGroup = monthGroups[monthGroups.length - 1];
    if (
      !lastGroup ||
      lastGroup.monthName !== monthName ||
      lastGroup.year !== y
    ) {
      lastGroup = { monthName, year: y, days: [] };
      monthGroups.push(lastGroup);
    }
    if (!lastGroup.days.includes(d)) {
      lastGroup.days.push(d);
    }
  });

  const parts = monthGroups.map((group) => {
    return `${group.days.join(", ")} ${group.monthName}`;
  });

  return `Update ${parts.join(", ")}`;
};

/**
 * Generates Custom Multi-Date Report Text matching user's project-wise format:
 * When combineTasks is false:
 * Update 10th september
 * Project : {project}
 * • {task} (status: ongoing)
 *
 * Update 11th september
 * ...
 *
 * When combineTasks is true:
 * Update 10, 11 September
 * Project : {project}
 * • {task} (status: ongoing)
 * ...
 */
export const generateCustomDateReportText = ({
  todos,
  dates,
  includeOngoingTag = true,
  onlyCompleted = false,
  combineTasks = false,
}: {
  todos: any[];
  dates: string[];
  includeOngoingTag?: boolean;
  onlyCompleted?: boolean;
  combineTasks?: boolean;
}): string => {
  if (!dates || dates.length === 0) {
    return "• No dates selected. Please pick one or more dates from the calendar.";
  }

  const nonDeleted = todos?.filter((t: any) => !t?.isDeleted) || [];

  const getTodoDateKey = (todo: any): string => {
    if (todo?.date) {
      return typeof todo.date === "string"
        ? todo.date.substring(0, 10)
        : format(new Date(todo.date), "yyyy-MM-dd");
    }
    if (todo?.createdAt) {
      try {
        const d = new Date(Number(todo.createdAt) || todo.createdAt);
        if (!isNaN(d.getTime())) return format(d, "yyyy-MM-dd");
      } catch {
        return format(new Date(), "yyyy-MM-dd");
      }
    }
    return format(new Date(), "yyyy-MM-dd");
  };

  const sortedDates = [...dates].sort();

  // If combineTasks is true: unified header and merged project groups
  if (combineTasks) {
    const header = formatCombinedDatesHeader(sortedDates);

    const relevantTodos = nonDeleted.filter((t: any) =>
      sortedDates.includes(getTodoDateKey(t))
    );

    const filtered = onlyCompleted
      ? relevantTodos.filter((t: any) => t.completed)
      : relevantTodos;

    // Deduplicate by ID if present
    const seenIds = new Set();
    const uniqueTodos = filtered.filter((t: any) => {
      const id = t.id || t._id;
      if (id) {
        if (seenIds.has(id)) return false;
        seenIds.add(id);
      }
      return true;
    });

    const projectGroups: Record<string, any[]> = {};
    const noProjectTasks: any[] = [];

    uniqueTodos.forEach((t: any) => {
      const proj =
        t.project && typeof t.project === "string" && t.project.trim();
      if (proj) {
        if (!projectGroups[proj]) {
          projectGroups[proj] = [];
        }
        projectGroups[proj].push(t);
      } else {
        noProjectTasks.push(t);
      }
    });

    const lines: string[] = [header];

    Object.keys(projectGroups).forEach((proj) => {
      lines.push(`Project : ${proj}`);
      projectGroups[proj].forEach((t: any) => {
        let line = `• ${t.text}`;
        if (includeOngoingTag && !t.completed) {
          line += ` (status: ongoing)`;
        }
        lines.push(line);
      });
    });

    if (noProjectTasks.length > 0) {
      if (Object.keys(projectGroups).length > 0) {
        lines.push(`Project : General`);
      }
      noProjectTasks.forEach((t: any) => {
        let line = `• ${t.text}`;
        if (includeOngoingTag && !t.completed) {
          line += ` (status: ongoing)`;
        }
        lines.push(line);
      });
    }

    if (uniqueTodos.length === 0) {
      lines.push(`• No tasks scheduled for these dates.`);
    }

    return lines.join("\n");
  }

  // If combineTasks is false: separate sections by date
  const sections: string[] = [];

  sortedDates.forEach((dateKey) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const formattedDateStr = format(dateObj, "do MMMM").toLowerCase();
    const header = `Update ${formattedDateStr}`;

    const relevantTodos = nonDeleted.filter(
      (t: any) => getTodoDateKey(t) === dateKey
    );

    const filtered = onlyCompleted
      ? relevantTodos.filter((t: any) => t.completed)
      : relevantTodos;

    // Group by project
    const projectGroups: Record<string, any[]> = {};
    const noProjectTasks: any[] = [];

    filtered.forEach((t: any) => {
      const proj =
        t.project && typeof t.project === "string" && t.project.trim();
      if (proj) {
        if (!projectGroups[proj]) {
          projectGroups[proj] = [];
        }
        projectGroups[proj].push(t);
      } else {
        noProjectTasks.push(t);
      }
    });

    const lines: string[] = [header];

    Object.keys(projectGroups).forEach((proj) => {
      lines.push(`Project : ${proj}`);
      projectGroups[proj].forEach((t: any) => {
        let line = `• ${t.text}`;
        if (includeOngoingTag && !t.completed) {
          line += ` (status: ongoing)`;
        }
        lines.push(line);
      });
    });

    if (noProjectTasks.length > 0) {
      if (Object.keys(projectGroups).length > 0) {
        lines.push(`Project : General`);
      }
      noProjectTasks.forEach((t: any) => {
        let line = `• ${t.text}`;
        if (includeOngoingTag && !t.completed) {
          line += ` (status: ongoing)`;
        }
        lines.push(line);
      });
    }

    if (filtered.length === 0) {
      lines.push(`• No tasks scheduled for this date.`);
    }

    sections.push(lines.join("\n"));
  });

  return sections.join("\n\n");
};

export const DailyReportModal = ({
  isOpen,
  onClose,
  todos,
  selectedDate,
  filterMode,
  initialTab = "daily",
}: DailyReportModalProps) => {
  const [activeTab, setActiveTab] = useState<"daily" | "monthly" | "custom">(
    initialTab
  );
  const [reportText, setReportText] = useState("");
  const [copied, setCopied] = useState(false);

  // Daily report states
  const [reportMode, setReportMode] = useState<"date" | "all">(filterMode);

  // Monthly report states
  const [selectedMonth, setSelectedMonth] = useState<Date>(selectedDate);
  const [includeDates, setIncludeDates] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(false);

  // Custom multi-date report states
  const [selectedCustomDates, setSelectedCustomDates] = useState<string[]>([
    format(selectedDate, "yyyy-MM-dd"),
  ]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState<Date>(selectedDate);
  const [combineTasks, setCombineTasks] = useState(false);

  // Shared toggles
  const [includeOngoingTag, setIncludeOngoingTag] = useState(true);
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  // Synchronize when opening or when props change
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setReportMode(filterMode);
      setSelectedMonth(selectedDate);
      setCalendarMonth(selectedDate);
      setSelectedCustomDates([format(selectedDate, "yyyy-MM-dd")]);
      setIsCalendarOpen(true);
      setCombineTasks(false);
      setCopied(false);
    }
  }, [isOpen, initialTab, filterMode, selectedDate]);

  // Recalculate report text when activeTab or options change
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === "daily") {
      const text = generateDailyReportText({
        todos,
        date: selectedDate,
        mode: reportMode,
        includeOngoingTag,
        onlyCompleted,
      });
      setReportText(text);
    } else if (activeTab === "monthly") {
      const text = generateMonthlyReportText({
        todos,
        monthDate: selectedMonth,
        includeOngoingTag,
        onlyCompleted,
        includeDates,
        includeSummary,
      });
      setReportText(text);
    } else {
      const text = generateCustomDateReportText({
        todos,
        dates: selectedCustomDates,
        includeOngoingTag,
        onlyCompleted,
        combineTasks,
      });
      setReportText(text);
    }
  }, [
    isOpen,
    activeTab,
    todos,
    selectedDate,
    reportMode,
    selectedMonth,
    selectedCustomDates,
    includeOngoingTag,
    onlyCompleted,
    combineTasks,
    includeDates,
    includeSummary,
  ]);

  // Handle regenerating fresh text
  const handleRegenerate = () => {
    if (activeTab === "daily") {
      const text = generateDailyReportText({
        todos,
        date: selectedDate,
        mode: reportMode,
        includeOngoingTag,
        onlyCompleted,
      });
      setReportText(text);
    } else if (activeTab === "monthly") {
      const text = generateMonthlyReportText({
        todos,
        monthDate: selectedMonth,
        includeOngoingTag,
        onlyCompleted,
        includeDates,
        includeSummary,
      });
      setReportText(text);
    } else {
      const text = generateCustomDateReportText({
        todos,
        dates: selectedCustomDates,
        includeOngoingTag,
        onlyCompleted,
        combineTasks,
      });
      setReportText(text);
    }
    toast.success("Report regenerated from latest tasks!");
  };

  // Month navigation helpers for Monthly Tab
  const handlePrevMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => addMonths(prev, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // Task map by date for custom calendar indicator dots
  const taskCountByDate = useMemo(() => {
    const counts: Record<
      string,
      { total: number; completed: number; pending: number }
    > = {};
    const nonDeleted = todos?.filter((t: any) => !t?.isDeleted) || [];
    nonDeleted.forEach((todo: any) => {
      let dateKey = "";
      if (todo?.date) {
        dateKey =
          typeof todo.date === "string"
            ? todo.date.substring(0, 10)
            : format(new Date(todo.date), "yyyy-MM-dd");
      } else if (todo?.createdAt) {
        try {
          dateKey = format(
            new Date(Number(todo.createdAt) || todo.createdAt),
            "yyyy-MM-dd"
          );
        } catch {
          dateKey = "";
        }
      }
      if (dateKey) {
        if (!counts[dateKey])
          counts[dateKey] = { total: 0, completed: 0, pending: 0 };
        counts[dateKey].total += 1;
        if (todo.completed) counts[dateKey].completed += 1;
        else counts[dateKey].pending += 1;
      }
    });
    return counts;
  }, [todos]);

  // Multi-date selection helpers
  const toggleDateSelection = (dateKey: string) => {
    setSelectedCustomDates((prev) => {
      if (prev.includes(dateKey)) {
        return prev.filter((d) => d !== dateKey);
      } else {
        return [...prev, dateKey].sort();
      }
    });
  };

  const handleSelectToday = () => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    setCalendarMonth(new Date());
    setSelectedCustomDates((prev) =>
      prev.includes(todayKey) ? prev : [...prev, todayKey].sort()
    );
  };

  const handleSelectYesterdayAndToday = () => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const todayKey = format(today, "yyyy-MM-dd");
    const yestKey = format(yesterday, "yyyy-MM-dd");
    setCalendarMonth(today);
    setSelectedCustomDates((prev) =>
      Array.from(new Set([...prev, yestKey, todayKey])).sort()
    );
  };

  const handleSelectLast7Days = () => {
    const today = new Date();
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(format(subDays(today, i), "yyyy-MM-dd"));
    }
    setCalendarMonth(today);
    setSelectedCustomDates((prev) =>
      Array.from(new Set([...prev, ...days])).sort()
    );
  };

  const handleClearDates = () => {
    setSelectedCustomDates([]);
  };

  // Calendar days for multi-date picker
  const calMonthStart = startOfMonth(calendarMonth);
  const calMonthEnd = endOfMonth(calMonthStart);
  const calStartDate = startOfWeek(calMonthStart, { weekStartsOn: 0 });
  const calEndDate = endOfWeek(calMonthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStartDate, end: calEndDate });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Handle Copy to clipboard
  const handleCopy = () => {
    if (!reportText) return;
    try {
      navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast.success(
        `${
          activeTab === "daily"
            ? "Daily"
            : activeTab === "monthly"
            ? "Monthly"
            : "Custom"
        } report copied! 📋`
      );
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy report.");
    }
  };

  // Handle Download as Text file
  const handleDownload = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    let filename = `daily-report-${format(selectedDate, "dd-MM-yyyy")}.txt`;
    if (activeTab === "monthly") {
      filename = `monthly-report-${format(
        selectedMonth,
        "MMMM-yyyy"
      ).toLowerCase()}.txt`;
    } else if (activeTab === "custom") {
      const sorted = [...selectedCustomDates].sort();
      if (sorted.length === 1) {
        filename = `custom-report-${sorted[0]}.txt`;
      } else if (sorted.length > 1) {
        filename = `custom-report-${sorted[0]}_to_${
          sorted[sorted.length - 1]
        }.txt`;
      } else {
        filename = `custom-report.txt`;
      }
    }

    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded report text file!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 sm:pb-3.5 border-b border-gray-100 dark:border-gray-700/60 flex flex-col gap-3">
          {/* Top Row: Title, Subtitle, and Close Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-teal-500/10 dark:bg-orange-500/15 text-teal-600 dark:text-orange-400 flex-shrink-0">
                {activeTab === "daily" ? (
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : activeTab === "monthly" ? (
                  <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                    {activeTab === "daily"
                      ? "Daily Task Report"
                      : activeTab === "monthly"
                      ? "Monthly Task Report"
                      : "Custom Date Task Report"}
                  </h3>
                  <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-md bg-teal-500/10 dark:bg-orange-500/15 text-teal-600 dark:text-orange-400 font-semibold flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="w-3 h-3" /> Ready to share
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                  {activeTab === "custom"
                    ? `Multi-date report (${selectedCustomDates.length} date${
                        selectedCustomDates.length === 1 ? "" : "s"
                      } selected${combineTasks ? " • Combined" : ""}). Pick dates below.`
                    : "Formatted project-wise report. Edit & copy below."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab switch row: moved one step bottom for ample room */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl w-full">
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "daily"
                  ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Daily</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "monthly"
                  ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Monthly</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("custom");
                setIsCalendarOpen(true);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === "custom"
                  ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Custom Date</span>
            </button>
          </div>
        </div>

        {/* Customization Bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700/40 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Date / Month / Custom Selectors */}
          {activeTab === "daily" ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setReportMode("date")}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  reportMode === "date"
                    ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm border border-gray-200/80 dark:border-gray-700"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(selectedDate, "dd-MM-yyyy")}</span>
              </button>
              <button
                type="button"
                onClick={() => setReportMode("all")}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  reportMode === "all"
                    ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm border border-gray-200/80 dark:border-gray-700"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Tasks</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("custom");
                  setIsCalendarOpen(true);
                }}
                className="text-xs px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 text-teal-600 dark:text-orange-400 hover:bg-teal-50 dark:hover:bg-gray-700"
                title="Pick multiple dates"
              >
                <span>+ Custom Dates</span>
              </button>
            </div>
          ) : activeTab === "monthly" ? (
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCurrentMonth}
                className="px-2 py-0.5 text-xs font-bold text-teal-600 dark:text-orange-400 tracking-tight"
                title="Reset to current month"
              >
                {format(selectedMonth, "MMMM yyyy")}
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsCalendarOpen((prev) => !prev)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  isCalendarOpen
                    ? "bg-teal-600 dark:bg-orange-500 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm border border-gray-200/80 dark:border-gray-700"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {isCalendarOpen
                    ? "Hide Calendar"
                    : `Calendar (${selectedCustomDates.length})`}
                </span>
              </button>

              {selectedCustomDates.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="text-[11px] px-2 py-1 rounded-lg text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Clear all selected dates"
                >
                  Clear All
                </button>
              )}
            </div>
          )}

          {/* Right: Tag and Filter toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            {activeTab === "custom" && (
              <button
                type="button"
                onClick={() => setCombineTasks((prev) => !prev)}
                className={`text-[11px] px-2 py-1 rounded-lg font-medium border transition-all ${
                  combineTasks
                    ? "bg-teal-500/15 dark:bg-orange-500/15 border-teal-500/40 text-teal-700 dark:text-orange-400 font-semibold"
                    : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
                }`}
                title="Combine all dates into a single project list (e.g. Update 10, 11, 12 September)"
              >
                Combine tasks {combineTasks ? "✓" : ""}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIncludeOngoingTag((prev) => !prev)}
              className={`text-[11px] px-2 py-1 rounded-lg font-medium border transition-all ${
                includeOngoingTag
                  ? "bg-teal-500/15 dark:bg-orange-500/15 border-teal-500/40 text-teal-700 dark:text-orange-400 font-semibold"
                  : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
              }`}
              title="Toggle (status: ongoing) suffix on incomplete tasks"
            >
              (status: ongoing) {includeOngoingTag ? "✓" : ""}
            </button>

            <button
              type="button"
              onClick={() => setOnlyCompleted((prev) => !prev)}
              className={`text-[11px] px-2 py-1 rounded-lg font-medium border transition-all ${
                onlyCompleted
                  ? "bg-teal-500/15 dark:bg-orange-500/15 border-teal-500/40 text-teal-700 dark:text-orange-400 font-semibold"
                  : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
              }`}
              title="Include only completed tasks"
            >
              Only Completed {onlyCompleted ? "✓" : ""}
            </button>

            {activeTab === "monthly" && (
              <>
                <button
                  type="button"
                  onClick={() => setIncludeDates((prev) => !prev)}
                  className={`text-[11px] px-2 py-1 rounded-lg font-medium border transition-all ${
                    includeDates
                      ? "bg-teal-500/15 dark:bg-orange-500/15 border-teal-500/40 text-teal-700 dark:text-orange-400 font-semibold"
                      : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
                  }`}
                  title="Include dates next to tasks"
                >
                  Dates {includeDates ? "✓" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeSummary((prev) => !prev)}
                  className={`text-[11px] px-2 py-1 rounded-lg font-medium border transition-all ${
                    includeSummary
                      ? "bg-teal-500/15 dark:bg-orange-500/15 border-teal-500/40 text-teal-700 dark:text-orange-400 font-semibold"
                      : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
                  }`}
                  title="Include monthly completion statistics header"
                >
                  Summary {includeSummary ? "✓" : ""}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleRegenerate}
              className="p-1 rounded-lg text-gray-500 hover:text-teal-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Regenerate Report"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Content Area (Scrollable container) */}
        <div className="p-4 sm:p-6 flex-grow flex flex-col min-h-0 overflow-y-auto space-y-3">
          {/* Custom Date Section: Calendar & Chips */}
          {activeTab === "custom" && (
            <div className="space-y-2.5">
              {/* Selected Dates Badges Bar */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700/50">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mr-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-orange-400" />
                  <span>Selected ({selectedCustomDates.length}):</span>
                </span>

                {selectedCustomDates.length === 0 ? (
                  <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                    No dates picked. Click dates in the calendar below to add
                    them.
                  </span>
                ) : (
                  selectedCustomDates.map((dateKey) => {
                    const [y, m, d] = dateKey.split("-").map(Number);
                    const dateObj = new Date(y, m - 1, d);
                    return (
                      <span
                        key={dateKey}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-teal-500/10 dark:bg-orange-500/15 text-teal-700 dark:text-orange-300 border border-teal-500/30 dark:border-orange-500/30 shadow-xs"
                      >
                        <span>{format(dateObj, "dd MMM yyyy")}</span>
                        <button
                          type="button"
                          onClick={() => toggleDateSelection(dateKey)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
                          title={`Remove ${dateKey}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })
                )}

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen((prev) => !prev)}
                    className="text-xs px-2 py-1 rounded-lg font-medium text-teal-600 dark:text-orange-400 hover:bg-teal-500/10 dark:hover:bg-orange-500/10 transition-colors"
                  >
                    {isCalendarOpen ? "Hide Calendar ▴" : "Pick More Dates ▾"}
                  </button>
                </div>
              </div>

              {/* Collapsible Multi-Date Calendar Card */}
              {isCalendarOpen && (
                <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800/95 border border-teal-500/20 dark:border-orange-500/20 shadow-md space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  {/* Calendar Month Navigation & Presets */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth((prev) => subMonths(prev, 1))
                        }
                        className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 min-w-[120px] text-center">
                        {format(calendarMonth, "MMMM yyyy")}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth((prev) => addMonths(prev, 1))
                        }
                        className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={handleSelectToday}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectYesterdayAndToday}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Yesterday & Today
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectLast7Days}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Last 7 Days
                      </button>
                      {selectedCustomDates.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearDates}
                          className="text-[11px] px-2 py-0.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Day Names Header */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-[10px] sm:text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-0.5"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calDays.map((day) => {
                      const dayKey = format(day, "yyyy-MM-dd");
                      const isSelected = selectedCustomDates.includes(dayKey);
                      const inMonth = isSameMonth(day, calendarMonth);
                      const isCurrentDay = isToday(day);
                      const stats = taskCountByDate[dayKey];

                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => toggleDateSelection(dayKey)}
                          className={`h-8 sm:h-9 w-full rounded-xl flex flex-col items-center justify-center relative transition-all duration-150 ${
                            isSelected
                              ? "bg-teal-600 dark:bg-orange-500 text-white font-bold shadow-sm shadow-teal-500/25 dark:shadow-orange-500/25 scale-[1.03]"
                              : inMonth
                              ? "text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-gray-700/60 font-medium"
                              : "text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
                          } ${
                            isCurrentDay && !isSelected
                              ? "border border-teal-500/50 dark:border-orange-500/50 font-bold"
                              : ""
                          }`}
                          title={`${format(day, "do MMMM yyyy")}${
                            stats ? ` • ${stats.total} tasks` : ""
                          }`}
                        >
                          <span className="text-xs sm:text-sm leading-none">
                            {format(day, "d")}
                          </span>

                          {/* Task Indicator Dot */}
                          {stats && stats.total > 0 && (
                            <span
                              className={`w-1 h-1 rounded-full mt-0.5 ${
                                isSelected
                                  ? "bg-white"
                                  : "bg-teal-500 dark:bg-orange-400"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Footer / Done button */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      💡 Click any date to select / deselect
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsCalendarOpen(false)}
                      className="h-7 px-3 text-xs bg-teal-500/10 hover:bg-teal-500/20 dark:bg-orange-500/15 dark:hover:bg-orange-500/25 text-teal-700 dark:text-orange-300 rounded-lg font-semibold"
                    >
                      Done Selecting ({selectedCustomDates.length})
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Editable Text Area Box */}
          <div className="flex-grow flex flex-col min-h-0 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>Edit report directly:</span>
              <span>
                {reportText.split("\n").length} lines • {reportText.length}{" "}
                chars
              </span>
            </div>

            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={isCalendarOpen && activeTab === "custom" ? 6 : 10}
              className="w-full flex-grow p-3 sm:p-4 text-xs sm:text-sm font-mono leading-relaxed rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:focus:ring-orange-400/40 text-gray-800 dark:text-gray-100 resize-none transition-all shadow-inner"
              placeholder="Report content..."
            />
          </div>
        </div>

        {/* Modal Footer with Copy Button */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 bg-gray-50/80 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="rounded-xl text-xs gap-1.5 border-gray-200 dark:border-gray-700 justify-center"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs flex-1 sm:flex-initial"
            >
              Close
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className={`rounded-xl text-xs font-semibold gap-2 px-4 sm:px-5 py-2 transition-all shadow-md active:scale-95 flex-1 sm:flex-initial justify-center ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-teal-500 hover:bg-teal-600 dark:bg-orange-400 dark:hover:bg-orange-500 text-white dark:text-gray-950"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>
                    Copy{" "}
                    {activeTab === "daily"
                      ? "Daily"
                      : activeTab === "monthly"
                      ? "Monthly"
                      : "Custom"}{" "}
                    Report
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
