import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataModeSelector } from "../DataModeSelector";

describe("DataModeSelector UI Component", () => {
  const defaultProps = {
    storageMode: "cloud" as const,
    onModeChange: jest.fn(),
    user: { email: "test@example.com", providerData: [{ email: "test@example.com" }] },
    todos: [
      { createdAt: 1, text: "Sample Task 1", completed: false },
      { createdAt: 2, text: "Sample Task 2", completed: true },
    ],
    setTodos: jest.fn(),
    userLoading: false,
    onPushToCloud: jest.fn(),
    onPullFromCloud: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render Cloud Sync badge when in cloud mode", () => {
    render(<DataModeSelector {...defaultProps} storageMode="cloud" />);
    expect(screen.getByText("Cloud Sync")).toBeInTheDocument();
  });

  it("should render Local Mode badge when in local mode", () => {
    render(<DataModeSelector {...defaultProps} storageMode="local" />);
    expect(screen.getByText("Local Mode")).toBeInTheDocument();
  });

  it("should open dropdown menu when trigger button is clicked", () => {
    render(<DataModeSelector {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /Cloud Sync/i });
    fireEvent.click(trigger);

    expect(screen.getByText("Data Storage Mode")).toBeInTheDocument();
    expect(screen.getByText("Cloud Mode (MongoDB)")).toBeInTheDocument();
    expect(screen.getByText("Local Offline Mode")).toBeInTheDocument();
    expect(screen.getByText("Data Actions & Backup")).toBeInTheDocument();
  });

  it("should call onModeChange when switching to Local Offline Mode", () => {
    render(<DataModeSelector {...defaultProps} storageMode="cloud" />);
    const trigger = screen.getByRole("button", { name: /Cloud Sync/i });
    fireEvent.click(trigger);

    const localOption = screen.getByText("Local Offline Mode");
    fireEvent.click(localOption);

    expect(defaultProps.onModeChange).toHaveBeenCalledWith("local");
  });

  it("should call onModeChange when switching to Cloud Mode", () => {
    render(<DataModeSelector {...defaultProps} storageMode="local" />);
    const trigger = screen.getByRole("button", { name: /Local Mode/i });
    fireEvent.click(trigger);

    const cloudOption = screen.getByText("Cloud Mode (MongoDB)");
    fireEvent.click(cloudOption);

    expect(defaultProps.onModeChange).toHaveBeenCalledWith("cloud");
  });

  it("should render action buttons for Pull, Push, Export and Import", () => {
    render(<DataModeSelector {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /Cloud Sync/i });
    fireEvent.click(trigger);

    expect(screen.getByText("Pull Cloud")).toBeInTheDocument();
    expect(screen.getByText("Push Cloud")).toBeInTheDocument();
    expect(screen.getByText("Export JSON")).toBeInTheDocument();
    expect(screen.getByText("Import JSON")).toBeInTheDocument();
  });
});
