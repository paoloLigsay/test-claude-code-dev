"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Folder as FolderIcon, FileText } from "lucide-react";
import type { Folder, Document } from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectFolder: (folder: Folder) => void;
  onSelectDocument: (doc: Document) => void;
};

type SearchResults = {
  folders: Folder[];
  documents: Document[];
};

export function SearchModal({
  open,
  onClose,
  onSelectFolder,
  onSelectDocument,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    folders: [],
    documents: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const allItems = [
    ...results.folders.map((f) => ({ type: "folder" as const, item: f })),
    ...results.documents.map((d) => ({ type: "document" as const, item: d })),
  ];

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults({ folders: [], documents: [] });
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => clearTimeout(debounceRef.current);
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ folders: [], documents: [] });
      return;
    }
    setLoading(true);
    try {
      const { searchItems } = await import("@/app/dashboard/actions");
      const data = await searchItems(q.trim());
      setResults(data);
      setActiveIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 200);
  }

  function handleSelect(entry: (typeof allItems)[number]) {
    if (entry.type === "folder") {
      onSelectFolder(entry.item as Folder);
    } else {
      onSelectDocument(entry.item as Document);
    }
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[activeIndex]) {
      e.preventDefault();
      handleSelect(allItems[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-neutral-700 px-3">
          <Search className="h-4 w-4 shrink-0 text-neutral-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search folders and files..."
            className="w-full bg-transparent py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none"
          />
          <kbd className="hidden items-center rounded border border-neutral-600 bg-neutral-700/50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 sm:inline-flex">
            ESC
          </kbd>
        </div>

        <div className="max-h-[300px] overflow-auto">
          {loading && (
            <p className="px-3 py-4 text-sm text-neutral-500">Searching...</p>
          )}

          {!loading && query.trim() && allItems.length === 0 && (
            <p className="px-3 py-4 text-sm text-neutral-500">
              No results found
            </p>
          )}

          {!loading && allItems.length > 0 && (
            <div className="py-1">
              {results.folders.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                    Folders
                  </p>
                  {results.folders.map((folder, i) => (
                    <button
                      key={folder.id}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                        activeIndex === i
                          ? "bg-white/[0.08]"
                          : "hover:bg-white/[0.04]"
                      }`}
                      onClick={() =>
                        handleSelect({ type: "folder", item: folder })
                      }
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <FolderIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                      <span className="truncate text-sm text-neutral-300">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </>
              )}

              {results.documents.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                    Files
                  </p>
                  {results.documents.map((doc, i) => {
                    const idx = results.folders.length + i;
                    return (
                      <button
                        key={doc.id}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                          activeIndex === idx
                            ? "bg-white/[0.08]"
                            : "hover:bg-white/[0.04]"
                        }`}
                        onClick={() =>
                          handleSelect({ type: "document", item: doc })
                        }
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
                        <span className="truncate text-sm text-neutral-300">
                          {doc.name}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {!loading && !query.trim() && (
            <p className="px-3 py-4 text-sm text-neutral-500">
              Type to search folders and files...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
