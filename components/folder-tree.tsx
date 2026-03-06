"use client";

import { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderTreeNode } from "./folder-tree-node";
import type { Folder, Document } from "@/types";

type DragState = {
  draggedId: string | null;
  draggedType: "folder" | "document" | null;
};

const DragContext = createContext<{
  drag: DragState;
  setDrag: (s: DragState) => void;
}>({
  drag: { draggedId: null, draggedType: null },
  setDrag: () => {},
});

export function useDragContext() {
  return useContext(DragContext);
}

type Props = {
  folders: Folder[];
  selectedDocumentId: string | null;
  onSelectDocument: (doc: Document) => void;
  onFolderMutated: () => void;
  onRequestMove: (type: "folder" | "document", id: string, name: string) => void;
};

const DRAG_MIME = "application/x-dms-item";

export function FolderTree({
  folders,
  selectedDocumentId,
  onSelectDocument,
  onFolderMutated,
  onRequestMove,
}: Props) {
  const [drag, setDrag] = useState<DragState>({ draggedId: null, draggedType: null });
  const queryClient = useQueryClient();

  async function handleRootDrop(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (!raw) return;

    const { type, id, parentFolderId } = JSON.parse(raw) as {
      type: "folder" | "document";
      id: string;
      parentFolderId: string | null;
    };

    if (type !== "folder") return;
    if (parentFolderId === null) return;

    const { moveFolder } = await import("@/app/dashboard/actions");
    const result = await moveFolder(id, null);
    if (!result.error) {
      queryClient.invalidateQueries({ queryKey: ["folder-contents", parentFolderId] });
      queryClient.invalidateQueries({ queryKey: ["root-folders"] });
      onFolderMutated();
    }
  }

  if (folders.length === 0) {
    return (
      <p className="text-sm text-neutral-500 px-4 py-2">
        No folders yet. Create one to get started.
      </p>
    );
  }

  return (
    <DragContext.Provider value={{ drag, setDrag }}>
      <div
        className="py-1"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes(DRAG_MIME)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={handleRootDrop}
      >
        {folders.map((folder) => (
          <FolderTreeNode
            key={folder.id}
            folder={folder}
            depth={0}
            ancestorIds={[]}
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={onSelectDocument}
            onFolderMutated={onFolderMutated}
            onRequestMove={onRequestMove}
          />
        ))}
      </div>
    </DragContext.Provider>
  );
}
