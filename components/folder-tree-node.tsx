"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  FolderOpen,
  FileText,
  MoreHorizontal,
  FolderPlus,
  Trash2,
  PenLine,
  Move,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFolderContents } from "@/hooks/use-folder-contents";
import { useDragContext } from "./folder-tree";
import { IconButton } from "./ui/icon-button";
import { Input } from "./ui/input";
import { DropdownMenu, MenuItem } from "./ui/dropdown-menu";
import type { Folder, Document, FolderContents } from "@/types";

const DRAG_MIME = "application/x-dms-item";

type DragPayload = {
  type: "folder" | "document";
  id: string;
  parentFolderId: string | null;
};

type Props = {
  folder: Folder;
  depth: number;
  ancestorIds: string[];
  selectedDocumentId: string | null;
  selectedFolderId: string | null;
  onSelectDocument: (doc: Document) => void;
  onFolderMutated: () => void;
  onRequestMove: (
    type: "folder" | "document",
    id: string,
    name: string
  ) => void;
  revealPath: string[];
};

export function FolderTreeNode({
  folder,
  depth,
  ancestorIds,
  selectedDocumentId,
  selectedFolderId,
  onSelectDocument,
  onFolderMutated,
  onRequestMove,
  revealPath,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const queryClient = useQueryClient();
  const { drag, setDrag } = useDragContext();

  const { data: contents, isLoading: loading } = useFolderContents(
    folder.id,
    isExpanded
  );

  const isInRevealPath = revealPath.includes(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const nodeRef = useRef<HTMLDivElement>(null);
  const prevRevealPathRef = useRef<string[]>([]);

  useEffect(() => {
    if (
      isInRevealPath &&
      !isExpanded &&
      revealPath !== prevRevealPathRef.current
    ) {
      setIsExpanded(true);
    }
    prevRevealPathRef.current = revealPath;
  }, [revealPath, isInRevealPath]);

  useEffect(() => {
    if (
      isSelected &&
      revealPath.length > 0 &&
      revealPath[revealPath.length - 1] === folder.id
    ) {
      nodeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected, revealPath]);

  function toggleExpand() {
    setIsExpanded(!isExpanded);
  }

  function handleFolderDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      DRAG_MIME,
      JSON.stringify({
        type: "folder",
        id: folder.id,
        parentFolderId: folder.parent_id,
      })
    );
    setDrag({ draggedId: folder.id, draggedType: "folder" });
  }

  function handleDragEnd() {
    setDrag({ draggedId: null, draggedType: null });
    setIsDragOver(false);
  }

  function wouldBeCircular(): boolean {
    if (drag.draggedType !== "folder" || !drag.draggedId) return false;
    if (drag.draggedId === folder.id) return true;
    return ancestorIds.includes(drag.draggedId);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    if (wouldBeCircular()) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node))
      return;
    setIsDragOver(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (!raw) return;

    const { type, id, parentFolderId } = JSON.parse(raw) as DragPayload;

    if (type === "folder" && id === folder.id) return;
    if (parentFolderId === folder.id) return;

    if (type === "folder") {
      const { moveFolder } = await import("@/app/dashboard/actions");
      const result = await moveFolder(id, folder.id);
      if (!result.error) {
        if (parentFolderId) {
          queryClient.invalidateQueries({
            queryKey: ["folder-contents", parentFolderId],
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ["root-folders"] });
        }
        queryClient.invalidateQueries({
          queryKey: ["folder-contents", folder.id],
        });
        queryClient.invalidateQueries({ queryKey: ["root-folders"] });
        onFolderMutated();
      }
    } else {
      const { moveDocument } = await import("@/app/dashboard/actions");
      const result = await moveDocument(id, folder.id);
      if (!result.error) {
        if (parentFolderId) {
          queryClient.invalidateQueries({
            queryKey: ["folder-contents", parentFolderId],
          });
        }
        queryClient.invalidateQueries({
          queryKey: ["folder-contents", folder.id],
        });
      }
    }
  }

  async function handleRename() {
    if (!renameValue.trim() || renameValue === folder.name) {
      setIsRenaming(false);
      return;
    }
    const { renameFolder } = await import("@/app/dashboard/actions");
    const result = await renameFolder(folder.id, renameValue.trim());
    if (!result.error) {
      onFolderMutated();
    }
    setIsRenaming(false);
  }

  async function handleDelete() {
    const parentQueryKey = folder.parent_id
      ? ["folder-contents", folder.parent_id]
      : ["root-folders"];

    const previousData = queryClient.getQueryData(parentQueryKey);

    if (folder.parent_id) {
      queryClient.setQueryData<FolderContents>(parentQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          subfolders: old.subfolders.filter((f) => f.id !== folder.id),
        };
      });
    } else {
      queryClient.setQueryData<Folder[]>(parentQueryKey, (old) =>
        old?.filter((f) => f.id !== folder.id)
      );
    }

    const { deleteFolder } = await import("@/app/dashboard/actions");
    const result = await deleteFolder(folder.id);

    if (result.error) {
      queryClient.setQueryData(parentQueryKey, previousData);
    } else {
      onFolderMutated();
    }
  }

  async function handleCreateSubfolder() {
    if (!newFolderName.trim()) {
      setIsCreatingSubfolder(false);
      return;
    }
    const { createFolder } = await import("@/app/dashboard/actions");
    const result = await createFolder(newFolderName.trim(), folder.id);
    if (!result.error) {
      setNewFolderName("");
      setIsCreatingSubfolder(false);
      queryClient.invalidateQueries({
        queryKey: ["folder-contents", folder.id],
      });
      setIsExpanded(true);
    }
  }

  async function handleDeleteDocument(doc: Document) {
    const queryKey = ["folder-contents", folder.id];
    const previousData = queryClient.getQueryData<FolderContents>(queryKey);

    queryClient.setQueryData<FolderContents>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        documents: old.documents.filter((d) => d.id !== doc.id),
      };
    });

    const { deleteDocument } = await import("@/app/dashboard/actions");
    const result = await deleteDocument(doc.id, doc.storage_path);

    if (result.error) {
      queryClient.setQueryData(queryKey, previousData);
    }
  }

  return (
    <div>
      <div
        ref={nodeRef}
        draggable
        onDragStart={handleFolderDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
          isDragOver
            ? "bg-brand-muted"
            : isSelected
              ? "bg-white/[0.08]"
              : "hover:bg-white/[0.04]"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          onClick={toggleExpand}
          className="flex h-4 w-4 shrink-0 items-center justify-center"
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
          )}
        </button>

        <button
          onClick={toggleExpand}
          className="flex min-w-0 flex-1 items-center gap-1.5"
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-neutral-400" />
          ) : (
            <FolderIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          )}
          {isRenaming ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              autoFocus
              inputSize="sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate text-sm text-neutral-300">
              {folder.name}
            </span>
          )}
        </button>

        <div className="relative">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </IconButton>
          {showMenu && (
            <DropdownMenu onMouseLeave={() => setShowMenu(false)}>
              <MenuItem
                icon={<FolderPlus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setShowMenu(false);
                  setIsCreatingSubfolder(true);
                  setIsExpanded(true);
                }}
              >
                New subfolder
              </MenuItem>
              <MenuItem
                icon={<PenLine className="h-3.5 w-3.5" />}
                onClick={() => {
                  setShowMenu(false);
                  setIsRenaming(true);
                  setRenameValue(folder.name);
                }}
              >
                Rename
              </MenuItem>
              <MenuItem
                icon={<Move className="h-3.5 w-3.5" />}
                onClick={() => {
                  setShowMenu(false);
                  onRequestMove("folder", folder.id, folder.name);
                }}
              >
                Move
              </MenuItem>
              <MenuItem
                icon={<Trash2 className="h-3.5 w-3.5" />}
                variant="destructive"
                onClick={() => {
                  setShowMenu(false);
                  handleDelete();
                }}
              >
                Delete
              </MenuItem>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isExpanded && (
        <div>
          {loading && (
            <p
              className="py-1 text-xs text-neutral-500"
              style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
            >
              Loading...
            </p>
          )}

          {isCreatingSubfolder && (
            <div
              className="flex items-center gap-1.5 py-1"
              style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
            >
              <FolderIcon className="h-4 w-4 shrink-0 text-neutral-500" />
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={handleCreateSubfolder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSubfolder();
                  if (e.key === "Escape") setIsCreatingSubfolder(false);
                }}
                placeholder="Folder name"
                autoFocus
                inputSize="sm"
                className="max-w-[160px]"
              />
            </div>
          )}

          {contents?.subfolders.map((sub) => (
            <FolderTreeNode
              key={sub.id}
              folder={sub}
              depth={depth + 1}
              ancestorIds={[...ancestorIds, folder.id]}
              selectedDocumentId={selectedDocumentId}
              selectedFolderId={selectedFolderId}
              onSelectDocument={onSelectDocument}
              onFolderMutated={() => {
                queryClient.invalidateQueries({
                  queryKey: ["folder-contents", folder.id],
                });
                onFolderMutated();
              }}
              onRequestMove={onRequestMove}
              revealPath={revealPath}
            />
          ))}

          {contents?.documents.map((doc) => (
            <div
              key={doc.id}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData(
                  DRAG_MIME,
                  JSON.stringify({
                    type: "document",
                    id: doc.id,
                    parentFolderId: folder.id,
                  })
                );
                setDrag({ draggedId: doc.id, draggedType: "document" });
              }}
              onDragEnd={() => {
                setDrag({ draggedId: null, draggedType: null });
              }}
              className={`group flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 transition-colors ${
                selectedDocumentId === doc.id
                  ? "bg-white/[0.06]"
                  : "hover:bg-white/[0.04]"
              }`}
              style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
              onClick={() => onSelectDocument(doc)}
            >
              <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
              <span className="flex-1 truncate text-sm text-neutral-400">
                {doc.name}
              </span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestMove("document", doc.id, doc.name);
                  }}
                >
                  <Move className="h-3 w-3" />
                </IconButton>
                <IconButton
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(doc);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </IconButton>
              </div>
            </div>
          ))}

          {contents &&
            contents.subfolders.length === 0 &&
            contents.documents.length === 0 &&
            !isCreatingSubfolder && (
              <p
                className="py-1 text-xs text-neutral-600"
                style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
              >
                Empty folder
              </p>
            )}
        </div>
      )}
    </div>
  );
}
