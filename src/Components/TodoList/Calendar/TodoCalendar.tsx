"use client";

import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TodoCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  todos: any[];
}

export const TodoCalendar: React.FC<TodoCalendarProps> = ({
  selectedDate,
  onSelectDate,
  todos = [],
}) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(selectedDate);

  // Sync current month when selectedDate changes from outside
  React.useEffect(() => {
    if (!isSameMonth(currentMonth, selectedDate)) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Calculate task summary map by date (yyyy-MM-dd)
  const taskStatsByDate = React.useMemo(() => {
    const stats: Record<string, { total: number; pending: number; completed: number }> = {};

    todos?.forEach((todo: any) => {
      if (todo?.isDeleted) return;

      let dateKey = "";
      if (todo?.date) {
        dateKey = typeof todo.date === "string" ? todo.date.substring(0, 10) : format(new Date(todo.date), "yyyy-MM-dd");
      } else if (todo?.createdAt) {
        try {
          dateKey = format(new Date(Number(todo.createdAt) || todo.createdAt), "yyyy-MM-dd");
        } catch {
          dateKey = "";
        }
      }

      if (dateKey) {
        if (!stats[dateKey]) {
          stats[dateKey] = { total: 0, pending: 0, completed: 0 };
        }
        stats[dateKey].total += 1;
        if (todo.completed) {
          stats[dateKey].completed += 1;
        } else {
          stats[dateKey].pending += 1;
        }
      }
    });

    return stats;
  }, [todos]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelectDate(today);
  };

  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700/60 transition-all duration-300">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/10 dark:bg-orange-500/10 text-teal-600 dark:text-orange-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Select date to filter tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTodayClick}
            className="text-xs px-2.5 py-1 h-8 rounded-lg font-medium border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Today
          </Button>
          <div className="flex items-center">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {weekDayNames.map((name, index) => (
          <div
            key={name}
            className={`text-xs font-semibold py-1 uppercase tracking-wider ${
              index === 0 || index === 6
                ? "text-rose-500/80 dark:text-rose-400/80"
                : "text-gray-400 dark:text-gray-400"
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarDays.map((day) => {
          const formattedKey = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          const dayStats = taskStatsByDate[formattedKey];

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`group relative flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl transition-all duration-200 min-h-[44px] sm:min-h-[48px] text-xs sm:text-sm font-medium focus:outline-none ${
                isSelected
                  ? "bg-teal-500 text-white shadow-md shadow-teal-500/30 dark:bg-orange-400 dark:text-gray-950 dark:shadow-orange-500/20 scale-[1.03] font-bold z-10"
                  : isCurrentDay
                  ? "bg-teal-500/10 text-teal-600 dark:bg-orange-500/10 dark:text-orange-300 ring-1 ring-teal-500/40 dark:ring-orange-400/40 hover:bg-teal-500/20"
                  : isCurrentMonth
                  ? "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70"
                  : "text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/40"
              }`}
            >
              <span>{format(day, "d")}</span>

              {/* Task Indicator Dot / Badge */}
              <div className="flex items-center justify-center gap-0.5 mt-0.5 h-1.5">
                {dayStats && dayStats.total > 0 && (
                  <>
                    {dayStats.pending > 0 ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-125 ${
                          isSelected
                            ? "bg-white dark:bg-gray-950"
                            : "bg-amber-500 dark:bg-orange-400"
                        }`}
                        title={`${dayStats.pending} pending task${dayStats.pending > 1 ? "s" : ""}`}
                      />
                    ) : (
                      <span
                        className={`w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-125 ${
                          isSelected
                            ? "bg-white dark:bg-gray-950"
                            : "bg-emerald-500 dark:bg-emerald-400"
                        }`}
                        title="All tasks completed"
                      />
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Legend / Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/40 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-orange-400" />
            Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Completed
          </span>
        </div>
        <span className="font-medium text-teal-600 dark:text-orange-400">
          {format(selectedDate, "EEE, MMM d")}
        </span>
      </div>
    </div>
  );
};
