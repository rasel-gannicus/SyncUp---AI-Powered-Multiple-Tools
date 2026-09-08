"use client";

import { useEffect, useState } from "react";
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
  ListFilter,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";
import { toast } from "react-hot-toast";

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  todos: any[];
  selectedDate: Date;
  filterMode: "date" | "all";
  initialTab?: "daily" | "monthly";
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

export const DailyReportModal = ({
  isOpen,
  onClose,
  todos,
  selectedDate,
  filterMode,
  initialTab = "daily",
}: DailyReportModalProps) => {
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">(initialTab);
  const [reportText, setReportText] = useState("");
  const [copied, setCopied] = useState(false);

  // Daily report states
  const [reportMode, setReportMode] = useState<"date" | "all">(filterMode);

  // Monthly report states
  const [selectedMonth, setSelectedMonth] = useState<Date>(selectedDate);
  const [includeDates, setIncludeDates] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(false);

  // Shared toggles
  const [includeOngoingTag, setIncludeOngoingTag] = useState(true);
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  // Synchronize when opening or when props change
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setReportMode(filterMode);
      setSelectedMonth(selectedDate);
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
    } else {
      const text = generateMonthlyReportText({
        todos,
        monthDate: selectedMonth,
        includeOngoingTag,
        onlyCompleted,
        includeDates,
        includeSummary,
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
    includeOngoingTag,
    onlyCompleted,
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
    } else {
      const text = generateMonthlyReportText({
        todos,
        monthDate: selectedMonth,
        includeOngoingTag,
        onlyCompleted,
        includeDates,
        includeSummary,
      });
      setReportText(text);
    }
    toast.success("Report regenerated from latest tasks!");
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => addMonths(prev, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // Handle Copy to clipboard
  const handleCopy = () => {
    if (!reportText) return;
    try {
      navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast.success(
        `${activeTab === "daily" ? "Daily" : "Monthly"} report copied! 📋`
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
    const filename =
      activeTab === "daily"
        ? `daily-report-${format(selectedDate, "dd-MM-yyyy")}.txt`
        : `monthly-report-${format(selectedMonth, "MMMM-yyyy").toLowerCase()}.txt`;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded report text file!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 dark:bg-orange-500/15 text-teal-600 dark:text-orange-400">
              {activeTab === "daily" ? (
                <FileText className="w-6 h-6" />
              ) : (
                <CalendarDays className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  {activeTab === "daily"
                    ? "Daily Task Report"
                    : "Monthly Task Report"}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-teal-500/10 dark:bg-orange-500/15 text-teal-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Ready to share
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Formatted project-wise report. You can edit and copy the text
                below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch between Daily and Monthly */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("daily")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "daily"
                    ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Daily</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("monthly")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "monthly"
                    ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Monthly</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Bar */}
        <div className="px-6 py-3 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700/40 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Date / Month Selectors */}
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
            </div>
          ) : (
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
                className="px-2.5 py-0.5 text-xs font-bold text-teal-600 dark:text-orange-400 tracking-tight"
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
          )}

          {/* Right: Tag and Filter toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
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
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-semibold"
                  : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
              }`}
              title="Show only completed tasks in report"
            >
              Completed Only {onlyCompleted ? "✓" : ""}
            </button>

            {activeTab === "monthly" && (
              <>
                <button
                  type="button"
                  onClick={() => setIncludeDates((prev) => !prev)}
                  className={`text-[11px] px-2 py-1 rounded-lg font-medium border transition-all ${
                    includeDates
                      ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-400 font-semibold"
                      : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
                  }`}
                  title="Prefix task with date [dd-MM-yyyy]"
                >
                  Show Dates {includeDates ? "✓" : ""}
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeSummary((prev) => !prev)}
                  className={`text-[11px] px-2 py-1 rounded-lg font-medium border transition-all ${
                    includeSummary
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-400 font-semibold"
                      : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
                  }`}
                  title="Include summary statistics"
                >
                  Summary {includeSummary ? "✓" : ""}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleRegenerate}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Reset / Regenerate fresh text"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Editable Text Area Box */}
        <div className="p-6 flex-grow flex flex-col min-h-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>You can directly edit the report below:</span>
            <span>
              {reportText.split("\n").length} lines • {reportText.length}{" "}
              characters
            </span>
          </div>

          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={12}
            className="w-full flex-grow p-4 text-sm font-mono leading-relaxed rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:focus:ring-orange-400/40 text-gray-800 dark:text-gray-100 resize-none transition-all shadow-inner"
            placeholder="Report content..."
          />
        </div>

        {/* Modal Footer with Copy Button */}
        <div className="p-4 px-6 bg-gray-50/80 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="rounded-xl text-xs gap-1.5 border-gray-200 dark:border-gray-700"
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
              className="rounded-xl text-xs"
            >
              Close
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className={`rounded-xl text-xs font-semibold gap-2 px-5 transition-all shadow-md active:scale-95 ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-teal-500 hover:bg-teal-600 dark:bg-orange-400 dark:hover:bg-orange-500 text-white dark:text-gray-950"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>
                    Copy {activeTab === "daily" ? "Daily" : "Monthly"} Report
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
