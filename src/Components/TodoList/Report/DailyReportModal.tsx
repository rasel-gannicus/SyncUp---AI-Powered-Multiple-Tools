"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Download,
  RotateCcw,
  X,
  Sparkles,
  Calendar,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  todos: any[];
  selectedDate: Date;
  filterMode: "date" | "all";
}

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

  // Formatted date: "6th september"
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

export const DailyReportModal = ({
  isOpen,
  onClose,
  todos,
  selectedDate,
  filterMode,
}: DailyReportModalProps) => {
  const [reportText, setReportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [reportMode, setReportMode] = useState<"date" | "all">(filterMode);
  const [includeOngoingTag, setIncludeOngoingTag] = useState(true);
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  // Synchronize reportText whenever inputs change
  useEffect(() => {
    if (isOpen) {
      setReportMode(filterMode);
      const text = generateDailyReportText({
        todos,
        date: selectedDate,
        mode: filterMode,
        includeOngoingTag,
        onlyCompleted,
      });
      setReportText(text);
      setCopied(false);
    }
  }, [isOpen, todos, selectedDate, filterMode, includeOngoingTag, onlyCompleted]);

  // Handle regenerating fresh text
  const handleRegenerate = () => {
    const text = generateDailyReportText({
      todos,
      date: selectedDate,
      mode: reportMode,
      includeOngoingTag,
      onlyCompleted,
    });
    setReportText(text);
    toast.success("Report regenerated from latest tasks!");
  };

  // Handle Copy to clipboard
  const handleCopy = () => {
    if (!reportText) return;
    try {
      navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast.success("Report copied to clipboard! 📋");
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
    link.download = `daily-report-${format(selectedDate, "dd-MM-yyyy")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded report text file!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 dark:bg-orange-500/15 text-teal-600 dark:text-orange-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  Daily Task Report
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-teal-500/10 dark:bg-orange-500/15 text-teal-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Ready to share
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Formatted project-wise update. You can edit and copy the text below.
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

        {/* Customization Bar */}
        <div className="px-6 py-3 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700/40 flex flex-wrap items-center justify-between gap-2.5">
          {/* Scope Selector: Selected Date vs All Tasks */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setReportMode("date");
                const text = generateDailyReportText({
                  todos,
                  date: selectedDate,
                  mode: "date",
                  includeOngoingTag,
                  onlyCompleted,
                });
                setReportText(text);
              }}
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
              onClick={() => {
                setReportMode("all");
                const text = generateDailyReportText({
                  todos,
                  date: selectedDate,
                  mode: "all",
                  includeOngoingTag,
                  onlyCompleted,
                });
                setReportText(text);
              }}
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

          {/* Tag and Filter toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIncludeOngoingTag((prev) => !prev);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border transition-all ${
                includeOngoingTag
                  ? "bg-teal-500/15 dark:bg-orange-500/15 border-teal-500/40 text-teal-700 dark:text-orange-400 font-semibold"
                  : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
              }`}
            >
              (status: ongoing) {includeOngoingTag ? "✓" : ""}
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyCompleted((prev) => !prev);
              }}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border transition-all ${
                onlyCompleted
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-semibold"
                  : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
              }`}
            >
              Completed Only {onlyCompleted ? "✓" : ""}
            </button>

            <button
              type="button"
              onClick={handleRegenerate}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Reset to generated text"
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
              {reportText.split("\n").length} lines • {reportText.length} characters
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
                  <span>Copy Report</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
