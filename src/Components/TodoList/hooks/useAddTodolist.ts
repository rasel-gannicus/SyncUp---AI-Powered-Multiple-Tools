import { useCallback } from "react";
import { validateUser } from "../functionalities";
import { toast } from "react-hot-toast";
import { useAddTodoMutation } from "@/Redux/features/Todo List/todoApi";
import { Dispatch, SetStateAction } from "react";
import { format } from "date-fns";
import { TaskAttachment } from "../Attachments/imageUtils";

export type PriorityLevel = "Low" | "Medium" | "High" | "Urgent";
export type TaskStatus = "Completed" | "Pending";

type Props = {
  user: any;
  inputValue: string;
  setTodos: Dispatch<SetStateAction<any[]>>;
  setInputValue: Dispatch<SetStateAction<string>>;
  selectedDate?: Date;
  priority?: PriorityLevel;
  project?: string;
  setProject?: Dispatch<SetStateAction<string>>;
  completed?: boolean;
  attachments?: TaskAttachment[];
  setAttachments?: Dispatch<SetStateAction<TaskAttachment[]>>;
};

/**
 * Adds a new todo item to the list and saves it to the database.
 * Optimistically adds the new todo item to the list, then sends a request to the
 * server to add the new todo item. If the request succeeds, the new todo item is
 * kept in the list. If the request fails, the new todo item is removed from the
 * list.
 */
export const useAddTodolist = ({
  user,
  inputValue,
  setTodos,
  setInputValue,
  selectedDate,
  priority = "Medium",
  project = "",
  setProject,
  completed = true,
  attachments = [],
  setAttachments,
}: Props) => {
  const [addTodo] = useAddTodoMutation();

  const handleAddTodo = useCallback(async () => {
    if (!validateUser(user)) return;
    if (!inputValue.trim()) return;

    const dateStr = selectedDate
      ? format(selectedDate, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

    const projectTrimmed = project?.trim() || "";
    const isCompleted = typeof completed === "boolean" ? completed : true;
    const taskAttachments = Array.isArray(attachments) ? [...attachments] : [];

    const newTodo = {
      text: inputValue.trim(),
      completed: isCompleted,
      priority: priority || "Medium",
      project: projectTrimmed,
      attachments: taskAttachments,
      createdAt: Date.now(),
      date: dateStr,
      email: user.providerData[0]?.email || user?.email,
    };

    const toastId = toast.loading("Adding todo...");

    // Optimistically add the new todo item to the list
    setTodos((prevTodos: any) => [...prevTodos, newTodo]);
    setInputValue("");
    if (setProject) {
      setProject("");
    }
    if (setAttachments) {
      setAttachments([]);
    }

    try {
      const response: any = await addTodo({ todo: newTodo });
      if ("error" in response) {
        // If the request fails, remove the new todo item from the list
        setTodos((prevTodos: any) =>
          prevTodos.filter((todo: any) => todo.createdAt !== newTodo.createdAt)
        );
        toast.error(response.error.data?.message || "Failed to add todo.");
      } else {
        toast.success("Todo added successfully.");
      }
    } catch (error) {
      // If the request fails, remove the new todo item from the list
      setTodos((prevTodos: any) =>
        prevTodos.filter((todo: any) => todo.createdAt !== newTodo.createdAt)
      );
      toast.error("An unexpected error occurred while adding the todo.");
    } finally {
      toast.dismiss(toastId);
    }
  }, [
    inputValue,
    user,
    addTodo,
    selectedDate,
    priority,
    project,
    completed,
    attachments,
    setInputValue,
    setProject,
    setAttachments,
    setTodos,
  ]);

  return handleAddTodo;
};
