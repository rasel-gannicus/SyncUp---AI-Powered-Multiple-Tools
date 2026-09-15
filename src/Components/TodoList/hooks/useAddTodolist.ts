import { useCallback } from "react";
import { validateUser } from "../functionalities";
import { toast } from "react-hot-toast";
import { useAddTodoMutation } from "@/Redux/features/Todo List/todoApi";
import { Dispatch, SetStateAction } from "react";
import { format } from "date-fns";
import { TaskAttachment } from "../Attachments/imageUtils";
import {
  StorageMode,
  saveLocalTodos,
  saveCloudCachedTodos,
} from "@/utils/storage/offlineStorage";

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
  storageMode?: StorageMode;
};

/**
 * Adds a new todo item to the list and saves it to local storage or cloud database.
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
  storageMode = "cloud",
}: Props) => {
  const [addTodo] = useAddTodoMutation();

  const handleAddTodo = useCallback(async () => {
    // If in cloud mode, validate login
    if (storageMode === "cloud" && !validateUser(user)) return;
    if (!inputValue.trim()) return;

    const dateStr = selectedDate
      ? format(selectedDate, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

    const projectTrimmed = project?.trim() || "";
    const isCompleted = typeof completed === "boolean" ? completed : true;
    const taskAttachments = Array.isArray(attachments) ? [...attachments] : [];
    const email = user?.providerData?.[0]?.email || user?.email || "offline_user";

    const newTodo = {
      text: inputValue.trim(),
      completed: isCompleted,
      priority: priority || "Medium",
      project: projectTrimmed,
      attachments: taskAttachments,
      createdAt: Date.now(),
      date: dateStr,
      email: email,
    };

    // LOCAL MODE: Save directly to localStorage without network call
    if (storageMode === "local") {
      setTodos((prevTodos: any[]) => {
        const updated = [...prevTodos, newTodo];
        saveLocalTodos(email, updated);
        return updated;
      });
      setInputValue("");
      if (setAttachments) {
        setAttachments([]);
      }
      toast.success("Todo added locally! 💾");
      return;
    }

    // CLOUD MODE: Optimistically add + network request + cache update
    const toastId = toast.loading("Adding todo...");

    setTodos((prevTodos: any) => {
      const updated = [...prevTodos, newTodo];
      saveCloudCachedTodos(email, updated);
      return updated;
    });
    setInputValue("");
    if (setAttachments) {
      setAttachments([]);
    }

    try {
      const response: any = await addTodo({ todo: newTodo });
      if ("error" in response) {
        // Revert on error
        setTodos((prevTodos: any) => {
          const reverted = prevTodos.filter(
            (todo: any) => todo.createdAt !== newTodo.createdAt
          );
          saveCloudCachedTodos(email, reverted);
          return reverted;
        });
        toast.error(response.error.data?.message || "Failed to add todo.");
      } else {
        toast.success("Todo added successfully.");
      }
    } catch (error) {
      setTodos((prevTodos: any) => {
        const reverted = prevTodos.filter(
          (todo: any) => todo.createdAt !== newTodo.createdAt
        );
        saveCloudCachedTodos(email, reverted);
        return reverted;
      });
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
    setAttachments,
    setTodos,
    storageMode,
  ]);

  return handleAddTodo;
};
