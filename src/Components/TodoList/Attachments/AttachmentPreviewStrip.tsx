"use client";

import React from "react";
import { X, Image as ImageIcon, ZoomIn } from "lucide-react";
import { TaskAttachment, formatFileSize } from "./imageUtils";

interface AttachmentPreviewStripProps {
  attachments: TaskAttachment[];
  onRemove?: (id: string) => void;
  onPreview?: (attachment: TaskAttachment) => void;
  readOnly?: boolean;
}

export const AttachmentPreviewStrip: React.FC<AttachmentPreviewStripProps> = ({
  attachments = [],
  onRemove,
  onPreview,
  readOnly = false,
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in-0 duration-200">
      {attachments.map((att) => (
        <div
          key={att.id || att.url}
          className="group relative flex items-center gap-2 p-1.5 pr-2.5 bg-gray-100 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-xl shadow-xs transition-all hover:border-teal-500/40 dark:hover:border-orange-400/40"
        >
          {/* Thumbnail preview */}
          <div
            onClick={() => onPreview && onPreview(att)}
            className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 cursor-pointer group/thumb"
            title="Click to view image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={att.url}
              alt={att.name || "Attachment"}
              className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
              <ZoomIn className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Name & Size Info */}
          <div
            onClick={() => onPreview && onPreview(att)}
            className="min-w-0 max-w-[130px] cursor-pointer"
          >
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">
              {att.name || "Image"}
            </p>
            {att.size ? (
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {formatFileSize(att.size)}
              </p>
            ) : null}
          </div>

          {/* Remove Button */}
          {!readOnly && onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(att.id || att.url);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-0.5"
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
