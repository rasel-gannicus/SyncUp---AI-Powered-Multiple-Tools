"use client";
import { useEffect, useState } from "react";
import { Button } from "@/Components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  useAddNoteMutation,
  useDeleteNoteMutation,
  useEditNoteMutation,
} from "@/Redux/features/notes/noteApi";
import { toast } from "react-hot-toast";
import { useAppSelector } from "@/Redux/hooks";
import AddNoteModal from "./Modal/AddNoteModal";
import { NotepadLoading } from "@/utils/Loading Spinner/Loading Skeleton/Skeleton";

const initialNotes = [
  {
    id: 1,
    title: "Shopping List",
    content: "<p>Milk, Eggs, Bread</p>",
    color: "bg-pink-100",
  },
  {
    id: 2,
    title: "Meeting Notes",
    content: "<p>Discuss Q4 goals</p>",
    color: "bg-blue-100",
  },
  {
    id: 3,
    title: "Ideas",
    content: "<p>New app features</p>",
    color: "bg-green-100",
  },
];

const colorOptions = [
  "bg-pink-100",
  "bg-blue-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-purple-100",
  "bg-red-100",
  "bg-indigo-100",
  "bg-teal-100",
  "bg-orange-100",
  "bg-cyan-100",
];

// --- reduce the length of paragraph showing in  the card / ui
const truncateText = (text: string, maxWords: number) => {
  const words = text.split(" ");
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(" ") + "...";
  }
  return text;
};

export default function NotePad({ user }: { user: any }) {
  const [notes, setNotes] = useState(initialNotes);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- edit note state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDataTime, setEditDataTime] = useState("");
  const [noteToEdit, setNoteToEdit] = useState({});

  const userState = useAppSelector((state) => state.user);
  let userData = userState.user;
  let userLoading = userState.userLoading;

  const [addNoteToDb, { data, isLoading, error }]: any = useAddNoteMutation();
  const [
    editNoteToDb,
    { data: editNoteData, isLoading: editNoteLoading, error: editNoteError },
  ] = useEditNoteMutation();

  // --- adding note
  const handleAddNote = async (title: string, content: string) => {
    if (!user) {
      toast.error("You need to login first to save notes");
      return;
    }

    const newNote = {
      id: Date.now(),
      title,
      content,
      color: getRandomColor(),
      uid: user.uid,
      email: user.providerData[0].email || user?.email,
    };
    const toastId = toast.loading("Saving note...", {
      position: "bottom-center",
    });

    try {
      const response: any = isEditModalOpen
        ? await editNoteToDb({ note: newNote, createdAt: editDataTime })
        : await addNoteToDb({ note: newNote });

      if ("error" in response) {
        toast.error(
          response.error.data.message || isEditModalOpen
            ? "Failed to update note."
            : "Failed to add note."
        );
        console.error(response.error);
      } else {
        toast.success(
          isEditModalOpen
            ? "Note updated successfully"
            : "Note added successfully"
        );
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      console.error(error);
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleEditNote = (createdAt: any) => {
    setIsEditModalOpen(true);
    setEditDataTime(createdAt);
    // This would typically navigate to EditNote page or open an edit modal
  };

  // --- clearing the 'edit data time' state when modal is closed
  useEffect(() => {
    if (!isEditModalOpen) {
      setEditDataTime("");
    }
    setNoteToEdit(
      userData?.notes?.find((note: any) => note.createdAt === editDataTime)
    );
  }, [isEditModalOpen]);

  // --- deleting a note
  const [
    deleteNoteFromDb,
    {
      data: deleteNoteData,
      isLoading: deleteNoteLoading,
      error: deleteNoteError,
    },
  ] = useDeleteNoteMutation();

  const handleDeleteNote = async (createdAt: string) => {
    if (!user) {
      toast.error("You need to login first to delete notes");
      return;
    }

    const toastId = toast.loading("Deleting note...");

    try {
      const response: any = await deleteNoteFromDb({
        uid: user?.uid,
        createdAt,
        email: user.providerData[0].email || user?.email,
      });

      if ("error" in response) {
        toast.error(response.error.data.message || "Failed to delete note.");
        console.error(response.error);
      } else {
        toast.success("Note deleted successfully");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      console.error(error);
    } finally {
      toast.dismiss(toastId);
    }
  };

  const getRandomColor = () => {
    return colorOptions[Math.floor(Math.random() * colorOptions.length)];
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">My Notes</h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card
          className="flex flex-col justify-center items-center cursor-pointer hover:bg-muted transition-colors duration-300"
          onClick={() => setIsAddModalOpen(true)}
        >
          <CardContent className="flex flex-col items-center py-8">
            <PlusCircle className="h-12 w-12 mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">
              Add a new note
            </p>
          </CardContent>
        </Card>

        {user &&
          userData?.notes
            ?.filter((note: any) => !note?.isDeleted)
            .map((note: any) => (
              <Card
                key={note.createdAt}
                className={`flex flex-col ${note.color} transition-all duration-300 hover:shadow-lg  dark:text-white dark:bg-gray-600 `}
              >
                <CardHeader
                  className="cursor-pointer"
                  draggable
                  onClick={() => handleEditNote(note.createdAt)}
                >
                  <CardTitle>{truncateText(note.title, 3)}</CardTitle>
                </CardHeader>
                <CardContent
                  className="flex-grow cursor-pointer"
                  draggable
                  onClick={() => handleEditNote(note.createdAt)}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: truncateText(note.description, 20),
                    }}
                  />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditNote(note.createdAt)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNote(note.createdAt)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {userLoading && <><NotepadLoading /><NotepadLoading /><NotepadLoading /></> }
      </div>

      {userData?.notes?.length === 0 && (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">
            {`No notes yet. Click on 'Add a new note' to get started!`}
          </p>
        </div>
      )}

      {/* --- this modal will open either user want to add new notes  or edit existing notes --- */}
      <AddNoteModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        onAddNote={handleAddNote}
        isEditModalOpen={isEditModalOpen}
        noteToEdit={noteToEdit}
      />
    </div>
  );
}
