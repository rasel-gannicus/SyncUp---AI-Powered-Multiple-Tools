import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectManagerModal } from "../ProjectManagerModal";

const mockRenameProjectApi = jest.fn();
const mockDeleteProjectApi = jest.fn();

jest.mock("@/Redux/features/Todo List/todoApi", () => ({
  useRenameProjectMutation: () => [
    mockRenameProjectApi.mockReturnValue({ unwrap: () => Promise.resolve() }),
  ],
  useDeleteProjectMutation: () => [
    mockDeleteProjectApi.mockReturnValue({ unwrap: () => Promise.resolve() }),
  ],
}));

describe("ProjectManagerModal Component", () => {
  const sampleTodos = [
    {
      createdAt: 1,
      text: "Task A",
      completed: true,
      project: "Alpha Project",
    },
    {
      createdAt: 2,
      text: "Task B",
      completed: false,
      project: "Alpha Project",
    },
    {
      createdAt: 3,
      text: "Task C",
      completed: false,
      project: "Beta Project",
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    availableProjects: ["Alpha Project", "Beta Project"],
    todos: sampleTodos,
    user: { email: "test@example.com" },
    setTodos: jest.fn(),
    selectedProjectFilter: "All",
    setSelectedProjectFilter: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when isOpen is false", () => {
    const { container } = render(
      <ProjectManagerModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render list of available projects with task counts", () => {
    render(<ProjectManagerModal {...defaultProps} />);
    expect(screen.getByText("Manage Projects")).toBeInTheDocument();
    expect(screen.getByText("Alpha Project")).toBeInTheDocument();
    expect(screen.getByText("Beta Project")).toBeInTheDocument();
    expect(screen.getByText(/2 tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/1 task/i)).toBeInTheDocument();
  });

  it("should allow editing a project name", async () => {
    render(<ProjectManagerModal {...defaultProps} />);

    // Click edit on Alpha Project
    const editButtons = screen.getAllByTitle(/rename project/i);
    fireEvent.click(editButtons[0]);

    // Input field should appear with current name
    const input = screen.getByDisplayValue("Alpha Project");
    fireEvent.change(input, { target: { value: "Alpha Redux" } });

    // Save rename
    const saveBtn = screen.getByTitle(/save changes/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockRenameProjectApi).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          oldProjectName: "Alpha Project",
          newProjectName: "Alpha Redux",
        })
      );
    });
  });

  it("should allow opening delete confirmation for a project", async () => {
    render(<ProjectManagerModal {...defaultProps} />);

    // Click delete on Beta Project
    const deleteButtons = screen.getAllByTitle(/delete project/i);
    fireEvent.click(deleteButtons[1]);

    // Confirmation banner should be visible
    expect(screen.getByText(/Remove “Beta Project” tag/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmBtn = screen.getByRole("button", { name: /^confirm$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteProjectApi).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          projectName: "Beta Project",
        })
      );
    });
  });

  it("should call onClose when close button is clicked", () => {
    render(<ProjectManagerModal {...defaultProps} />);
    const closeBtn = screen.getByRole("button", { name: /^done$/i });
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
