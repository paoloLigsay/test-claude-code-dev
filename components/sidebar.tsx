"use client";

import { useState } from "react";
import { FolderPlus, LogOut } from "lucide-react";
import { FolderTree } from "./folder-tree";
import { signOut } from "@/app/auth/actions";
import { IconButton } from "./ui/icon-button";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Folder, Document } from "@/types";

type Props = {
  folders: Folder[];
  selectedDocumentId: string | null;
  uploadFolderId: string | null;
  onSelectDocument: (doc: Document) => void;
  onFolderMutated: () => void;
  onRequestMove: (type: "folder" | "document", id: string, name: string) => void;
  onSelectFolder: (folderId: string) => void;
};

export function Sidebar({
  folders,
  selectedDocumentId,
  onSelectDocument,
  onFolderMutated,
  onRequestMove,
  onSelectFolder,
}: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  async function handleCreateRootFolder() {
    if (!newFolderName.trim()) {
      setIsCreating(false);
      return;
    }
    const { createFolder } = await import("@/app/dashboard/actions");
    const result = await createFolder(newFolderName.trim(), null);
    if (!result.error && result.data) {
      setNewFolderName("");
      setIsCreating(false);
      onFolderMutated();
      onSelectFolder(result.data.id);
    }
  }

  return (
    <aside className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700/50">
        <h1 className="text-sm font-semibold text-neutral-300">Documents</h1>
        <IconButton onClick={() => setIsCreating(true)} title="New folder">
          <FolderPlus className="w-4 h-4" />
        </IconButton>
      </div>

      <div className="flex-1 overflow-auto">
        {isCreating && (
          <div className="flex items-center gap-1.5 px-4 py-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={handleCreateRootFolder}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateRootFolder();
                if (e.key === "Escape") setIsCreating(false);
              }}
              placeholder="Folder name"
              autoFocus
              inputSize="sm"
            />
          </div>
        )}
        <FolderTree
          folders={folders}
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={onSelectDocument}
          onFolderMutated={onFolderMutated}
          onRequestMove={onRequestMove}
        />
      </div>

      <div className="border-t border-neutral-700/50 px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          icon={<LogOut className="w-4 h-4" />}
          onClick={() => signOut()}
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}
