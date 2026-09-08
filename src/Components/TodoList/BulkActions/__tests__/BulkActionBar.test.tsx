import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BulkActionBar } from "../BulkActionBar";

describe("BulkActionBar Component", () => {
  const defaultProps = {
    selectedCount: 2,
    totalFilteredCount: 5,
    allSelected: false,
    onToggleSelectAll: jest.fn(),
    onBulkDelete: jest.fn().mockResolvedValue(undefined),
    onBulkToggleComplete: jest.fn().mockResolvedValue(undefined),
    onClearSelection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when selectedCount is 0", () => {
    const { container } = render(
      <BulkActionBar {...defaultProps} selectedCount={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render selected count badge when selectedCount > 0", () => {
    render(<BulkActionBar {...defaultProps} selectedCount={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/tasks selected/i)).toBeInTheDocument();
  });

  it("should call onToggleSelectAll when select all button is clicked", () => {
    render(<BulkActionBar {...defaultProps} />);
    const selectAllBtn = screen.getByTitle(/select all visible tasks/i);
    fireEvent.click(selectAllBtn);
    expect(defaultProps.onToggleSelectAll).toHaveBeenCalledTimes(1);
  });

  it("should display 'Unselect All' title when allSelected is true", () => {
    render(<BulkActionBar {...defaultProps} allSelected={true} />);
    const unselectBtn = screen.getByTitle(/deselect all visible tasks/i);
    expect(unselectBtn).toBeInTheDocument();
  });

  it("should call onBulkToggleComplete with true when Mark Done is clicked", async () => {
    render(<BulkActionBar {...defaultProps} />);
    const markDoneBtn = screen.getByTitle(/mark selected tasks as completed/i);
    await waitFor(async () => {
      fireEvent.click(markDoneBtn);
    });
    expect(defaultProps.onBulkToggleComplete).toHaveBeenCalledWith(true);
  });

  it("should call onBulkToggleComplete with false when Mark Active is clicked", async () => {
    render(<BulkActionBar {...defaultProps} />);
    const markActiveBtn = screen.getByTitle(/mark selected tasks as pending/i);
    await waitFor(async () => {
      fireEvent.click(markActiveBtn);
    });
    expect(defaultProps.onBulkToggleComplete).toHaveBeenCalledWith(false);
  });

  it("should open delete confirmation modal and trigger onBulkDelete on confirmation", async () => {
    render(<BulkActionBar {...defaultProps} selectedCount={2} />);
    const deleteBtn = screen.getByTitle(/delete selected tasks/i);
    fireEvent.click(deleteBtn);

    // Confirmation modal should appear
    expect(screen.getByText(/Delete 2 Tasks\?/i)).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole("button", {
      name: /Delete 2 Tasks/i,
    });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(defaultProps.onBulkDelete).toHaveBeenCalledTimes(1);
    });
  });

  it("should close delete modal without calling onBulkDelete when Cancel is clicked", () => {
    render(<BulkActionBar {...defaultProps} />);
    const deleteBtn = screen.getByTitle(/delete selected tasks/i);
    fireEvent.click(deleteBtn);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onBulkDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/Delete 2 Tasks\?/i)).not.toBeInTheDocument();
  });

  it("should call onClearSelection when clear button is clicked", () => {
    render(<BulkActionBar {...defaultProps} />);
    const clearBtn = screen.getByTitle(/clear selection/i);
    fireEvent.click(clearBtn);
    expect(defaultProps.onClearSelection).toHaveBeenCalledTimes(1);
  });
});
