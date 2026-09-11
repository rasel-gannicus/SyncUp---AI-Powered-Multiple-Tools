import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  DailyReportModal,
  generateDailyReportText,
  generateMonthlyReportText,
  generateCustomDateReportText,
  formatCombinedDatesHeader,
} from "../DailyReportModal";

describe("DailyReportModal & Report Generator", () => {
  const sampleTodos = [
    {
      createdAt: new Date("2026-09-08T10:00:00Z").getTime(),
      date: "2026-09-08",
      text: "Design dashboard wireframe",
      completed: true,
      priority: "High",
      project: "SyncUp Redesign",
    },
    {
      createdAt: new Date("2026-09-08T11:00:00Z").getTime(),
      date: "2026-09-08",
      text: "Write Jest tests",
      completed: false,
      priority: "Medium",
      project: "SyncUp Redesign",
    },
    {
      createdAt: new Date("2026-09-08T12:00:00Z").getTime(),
      date: "2026-09-08",
      text: "Review pull requests",
      completed: false,
      priority: "Low",
      project: "",
    },
    {
      createdAt: new Date("2026-09-07T12:00:00Z").getTime(),
      date: "2026-09-07",
      text: "Old task from yesterday",
      completed: true,
      priority: "High",
      project: "Old Project",
    },
  ];

  describe("generateDailyReportText helper", () => {
    it("generates correct report grouped by project for a specific date", () => {
      const report = generateDailyReportText({
        todos: sampleTodos,
        date: new Date("2026-09-08T00:00:00Z"),
        mode: "date",
        includeOngoingTag: true,
      });

      expect(report).toContain("Project : SyncUp Redesign");
      expect(report).toContain("Design dashboard wireframe");
      expect(report).toContain("Write Jest tests (status: ongoing)");
      expect(report).toContain("Project : General");
      expect(report).toContain("Review pull requests (status: ongoing)");
      expect(report).not.toContain("Old task from yesterday");
    });

    it("filters only completed tasks when onlyCompleted is true", () => {
      const report = generateDailyReportText({
        todos: sampleTodos,
        date: new Date("2026-09-08T00:00:00Z"),
        mode: "date",
        onlyCompleted: true,
      });

      expect(report).toContain("Design dashboard wireframe");
      expect(report).not.toContain("Write Jest tests");
    });
  });

  describe("generateMonthlyReportText helper", () => {
    it("generates monthly aggregation across projects", () => {
      const report = generateMonthlyReportText({
        todos: sampleTodos,
        monthDate: new Date("2026-09-08T00:00:00Z"),
        includeSummary: true,
        includeDates: true,
      });

      expect(report).toContain("Monthly Report - September 2026");
      expect(report).toContain("Summary: 4 Tasks");
      expect(report).toContain("Project : SyncUp Redesign");
      expect(report).toContain("Project : Old Project");
    });
  });

  describe("generateCustomDateReportText helper", () => {
    it("generates report for multiple custom dates in chronological order", () => {
      const report = generateCustomDateReportText({
        todos: sampleTodos,
        dates: ["2026-09-08", "2026-09-07"],
        includeOngoingTag: true,
      });

      expect(report).toContain("Update 7th september");
      expect(report).toContain("Old task from yesterday");
      expect(report).toContain("Update 8th september");
      expect(report).toContain("Design dashboard wireframe");
      expect(report).toContain("Write Jest tests (status: ongoing)");
    });

    it("handles dates with no tasks scheduled", () => {
      const report = generateCustomDateReportText({
        todos: sampleTodos,
        dates: ["2026-09-15"],
      });

      expect(report).toContain("Update 15th september");
      expect(report).toContain("No tasks scheduled for this date.");
    });

    it("returns prompt when no dates are passed", () => {
      const report = generateCustomDateReportText({
        todos: sampleTodos,
        dates: [],
      });

      expect(report).toContain("No dates selected");
    });

    it("formats combined date header accurately for single and multiple months", () => {
      expect(
        formatCombinedDatesHeader(["2026-09-10", "2026-09-11", "2026-09-12"])
      ).toBe("Update 10, 11, 12 September");

      expect(
        formatCombinedDatesHeader(["2026-09-30", "2026-10-01"])
      ).toBe("Update 30 September, 1 October");
    });

    it("combines tasks across multiple dates under single project headers when combineTasks is true", () => {
      const report = generateCustomDateReportText({
        todos: sampleTodos,
        dates: ["2026-09-07", "2026-09-08"],
        includeOngoingTag: true,
        combineTasks: true,
      });

      expect(report).toContain("Update 7, 8 September");
      expect(report).toContain("Project : SyncUp Redesign");
      expect(report).toContain("Design dashboard wireframe");
      expect(report).toContain("Write Jest tests (status: ongoing)");
      expect(report).toContain("Project : Old Project");
      expect(report).toContain("Old task from yesterday");
      // Header shouldn't repeat
      expect(report).not.toContain("Update 7th september");
      expect(report).not.toContain("Update 8th september");
    });
  });

  describe("DailyReportModal UI", () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      todos: sampleTodos,
      selectedDate: new Date("2026-09-08T00:00:00Z"),
      filterMode: "date" as const,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return null when isOpen is false", () => {
      const { container } = render(
        <DailyReportModal {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render daily report modal when isOpen is true", () => {
      render(<DailyReportModal {...defaultProps} />);
      expect(screen.getByText("Daily Task Report")).toBeInTheDocument();
      expect(screen.getByText(/Ready to share/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Daily$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Monthly$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Custom Date$/i })
      ).toBeInTheDocument();
    });

    it("should switch tabs between Daily, Monthly, and Custom Date", () => {
      render(<DailyReportModal {...defaultProps} />);

      // Switch to Monthly
      const monthlyTabBtn = screen.getByRole("button", {
        name: /^Monthly$/i,
      });
      fireEvent.click(monthlyTabBtn);

      let textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toContain("Monthly Report");

      // Switch to Custom Date
      const customTabBtn = screen.getByRole("button", {
        name: /^Custom Date$/i,
      });
      fireEvent.click(customTabBtn);

      expect(screen.getByText("Custom Date Task Report")).toBeInTheDocument();
      textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toContain("Update 8th september");
    });

    it("should trigger onClose when close button is clicked", () => {
      render(<DailyReportModal {...defaultProps} />);
      const closeButtons = screen.getAllByRole("button", { name: /close/i });
      fireEvent.click(closeButtons[0]);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("should allow toggling calendar visibility in custom date mode", () => {
      render(<DailyReportModal {...defaultProps} initialTab="custom" />);
      expect(screen.getByText("Custom Date Task Report")).toBeInTheDocument();

      // Done Selecting collapses the calendar
      const doneBtn = screen.getByRole("button", { name: /Done Selecting/i });
      fireEvent.click(doneBtn);

      // Now "Pick More Dates" button is visible
      expect(screen.getByText(/Pick More Dates/i)).toBeInTheDocument();
    });

    it("should toggle combine tasks format when clicking Combine tasks button", () => {
      render(<DailyReportModal {...defaultProps} initialTab="custom" />);

      // Initially shows separate date header
      let textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toContain("Update 8th september");

      // Click Combine tasks
      const combineBtn = screen.getByRole("button", { name: /Combine tasks/i });
      fireEvent.click(combineBtn);

      // Textarea now shows combined header format
      textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toContain("Update 8 September");
    });
  });
});
