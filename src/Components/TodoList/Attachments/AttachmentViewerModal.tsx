"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileImage,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { TaskAttachment, formatFileSize } from "./imageUtils";

interface AttachmentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: TaskAttachment[];
  initialIndex?: number;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  isOpen,
  onClose,
  attachments = [],
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex >= 0 && initialIndex < attachments.length ? initialIndex : 0);
    }
  }, [isOpen, initialIndex, attachments.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
  }, [attachments.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
  }, [attachments.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || attachments.length === 0) return null;

  const currentAttachment = attachments[currentIndex] || attachments[0];

  const handleDownload = () => {
    if (!currentAttachment?.url) return;
    const link = document.createElement("a");
    link.href = currentAttachment.url;
    link.download = currentAttachment.name || `attachment-${currentIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col items-center justify-between rounded-3xl overflow-hidden bg-gray-950/90 border border-gray-800 shadow-2xl">
        {/* Top Header Controls */}
        <div className="w-full p-4 px-6 flex items-center justify-between border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <FileImage className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {currentAttachment?.name || "Image Attachment"}
              </h3>
              <p className="text-[11px] text-gray-400">
                {attachments.length > 1
                  ? `${currentIndex + 1} of ${attachments.length}`
                  : "Single Attachment"}
                {currentAttachment?.size ? ` • ${formatFileSize(currentAttachment.size)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 rounded-xl text-xs gap-1.5 border-gray-700 bg-gray-800/80 text-gray-200 hover:text-white hover:bg-gray-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Close viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="relative w-full flex-grow flex items-center justify-center p-4 sm:p-6 overflow-hidden min-h-[300px] max-h-[70vh]">
          {/* Navigation Arrows for multi-images */}
          {attachments.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-transform active:scale-95 shadow-lg"
                title="Previous image (Arrow Left)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-transform active:scale-95 shadow-lg"
                title="Next image (Arrow Right)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentAttachment?.url}
            alt={currentAttachment?.name || "Task Attachment"}
            className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl transition-all select-none animate-in zoom-in-95 duration-150"
          />
        </div>

        {/* Bottom Thumbnail Strip (if multiple) */}
        {attachments.length > 1 && (
          <div className="w-full p-3 px-6 border-t border-gray-800 bg-gray-900/60 flex items-center justify-center gap-2 overflow-x-auto">
            {attachments.map((att, idx) => (
              <button
                key={att.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                  idx === currentIndex
                    ? "border-teal-400 scale-105 shadow-md shadow-teal-500/20"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={att.url}
                  alt={att.name || "thumb"}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
