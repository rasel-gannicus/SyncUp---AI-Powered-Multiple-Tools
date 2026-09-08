import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  DailyReportModal,
  generateDailyReportText,
  generateMonthlyReportText,
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
      expect(screen.getByRole("button", { name: /^Daily$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Monthly$/i })).toBeInTheDocument();
    });

    it("should switch tabs between Daily and Monthly", () => {
      render(<DailyReportModal {...defaultProps} />);
      const monthlyTabBtn = screen.getByRole("button", {
        name: /^Monthly$/i,
      });
      fireEvent.click(monthlyTabBtn);

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toContain("Monthly Report");
    });

    it("should trigger onClose when close button is clicked", () => {
      render(<DailyReportModal {...defaultProps} />);
      const closeButtons = screen.getAllByRole("button", { name: /close/i });
      fireEvent.click(closeButtons[0]);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
