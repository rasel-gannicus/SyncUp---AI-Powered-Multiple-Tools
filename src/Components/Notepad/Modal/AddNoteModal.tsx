"use client";
import { useState, useEffect } from "react";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/Components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import QuillEditor from "@/Components/Notepad/QuillEditor/QuillEditor";

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
];

interface AddNoteModalProps {
  isOpen: boolean;
  isEditModalOpen: boolean;
  noteToEdit: any;
  onClose: () => void;
  onAddNote: (title: string, content: string) => void;
}

const AddNoteModal = ({
  isOpen,
  onClose,
  onAddNote,
  isEditModalOpen,
  noteToEdit,
}: AddNoteModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (isEditModalOpen && noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.description);
    }
  }, [isEditModalOpen, noteToEdit]);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setContent("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNote(title, content);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] h-[80vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditModalOpen ? "Edit Note" : "Add Note"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="mb-4">
            <Input
              placeholder="Note Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={64}
            />
          </div>
          <div className="flex-grow overflow-hidden">
            <QuillEditor
              content={content}
              setContent={setContent}
              modules={modules}
              formats={formats}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button className="bg-purple-700" type="submit">
              {isEditModalOpen ? "Update Note" : "Add Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteModal;
