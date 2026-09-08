"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FolderKanban, Plus, X, Settings2, Check } from "lucide-react";
import { Input } from "@/Components/ui/input";

interface ProjectAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  availableProjects: string[];
  projectCounts?: Record<string, number>;
  onOpenManager?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

export const ProjectAutocomplete = ({
  value,
  onChange,
  availableProjects,
  projectCounts = {},
  onOpenManager,
  placeholder = "Project (optional)",
  className = "",
  inputClassName = "",
  autoFocus = false,
}: ProjectAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter projects matching current value (case-insensitive)
  const filteredProjects = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      return availableProjects;
    }
    return availableProjects.filter((p) =>
      p.toLowerCase().includes(trimmed)
    );
  }, [value, availableProjects]);

  // Check if typed value is an exact match with an existing project
  const isExactMatch = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return true;
    return availableProjects.some((p) => p.toLowerCase() === trimmed);
  }, [value, availableProjects]);

  // Total items in suggestions list including the "create new" item if not exact match
  const showCreateOption = Boolean(value.trim() && !isExactMatch);
  const totalOptionsCount = filteredProjects.length + (showCreateOption ? 1 : 0);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (project: string) => {
    onChange(project);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < totalOptionsCount - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : totalOptionsCount - 1
      );
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        if (highlightedIndex < filteredProjects.length) {
          handleSelect(filteredProjects[highlightedIndex]);
        } else if (showCreateOption) {
          handleSelect(value.trim());
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Project Input Field */}
      <div className="relative flex items-center">
        <FolderKanban className="w-3.5 h-3.5 absolute left-2.5 text-purple-600 dark:text-purple-400 pointer-events-none transition-colors" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`h-8 pl-8 pr-7 text-xs rounded-lg border-gray-200 dark:border-gray-700 w-36 sm:w-44 focus:w-56 transition-all dark:bg-gray-900/60 focus:ring-2 focus:ring-purple-500/40 ${inputClassName}`}
        />
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Clear project"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 max-h-64 overflow-y-auto z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-purple-100 dark:border-gray-700 p-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-semibold text-gray-400 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/60 mb-1">
            <span>PROJECT SUGGESTIONS</span>
            {onOpenManager && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  onOpenManager();
                }}
                className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Manage projects"
              >
                <Settings2 className="w-3 h-3" />
                <span>Manage</span>
              </button>
            )}
          </div>

          {/* List of matching projects */}
          <div className="space-y-0.5">
            {filteredProjects.map((proj, idx) => {
              const isSelected = value.trim().toLowerCase() === proj.toLowerCase();
              const isHighlighted = highlightedIndex === idx;
              const count = projectCounts[proj] ?? 0;

              return (
                <button
                  key={proj}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(proj);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isHighlighted || isSelected
                      ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderKanban className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="truncate">{proj}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                        {count} {count === 1 ? "task" : "tasks"}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                  </div>
                </button>
              );
            })}

            {/* Create New Option if typed value is not in the list */}
            {showCreateOption && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(value.trim());
                }}
                onMouseEnter={() => setHighlightedIndex(filteredProjects.length)}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors border border-dashed border-purple-300 dark:border-purple-600/50 ${
                  highlightedIndex === filteredProjects.length
                    ? "bg-purple-500/20 text-purple-800 dark:text-purple-200 font-semibold"
                    : "text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                }`}
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  Create project &ldquo;<strong>{value.trim()}</strong>&rdquo;
                </span>
              </button>
            )}

            {filteredProjects.length === 0 && !showCreateOption && (
              <div className="py-3 text-center text-xs text-gray-400">
                No projects yet. Type a name to create one!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
