"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder as FolderIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { moveDocument, moveFolder } from "@/app/dashboard/actions";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import type { Folder } from "@/types";

type Props = {
  itemType: "folder" | "document";
  itemId: string;
  itemName: string;
  onClose: () => void;
  onMoved: () => void;
};

export function MoveDialog({ itemType, itemId, itemName, onClose, onMoved }: Props) {
  const [rootFolders, setRootFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRootFolders() {
      const supabase = createClient();
      const { data } = await supabase
        .from("folders")
        .select("*")
        .is("parent_id", null)
        .order("name");
      setRootFolders(data ?? []);
    }
    loadRootFolders();
  }, []);

  async function handleMove() {
    setMoving(true);
    setError(null);

    const result =
      itemType === "document"
        ? await moveDocument(itemId, selectedFolderId!)
        : await moveFolder(itemId, selectedFolderId);

    if ("error" in result && result.error) {
      setError(result.error);
      setMoving(false);
      return;
    }

    onMoved();
    onClose();
  }

  return (
    <Modal
      title={`Move \u201c${itemName}\u201d`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleMove}
            disabled={moving || (itemType === "document" && selectedFolderId === null)}
          >
            {moving ? "Moving..." : "Move here"}
          </Button>
        </>
      }
    >
      <div className="max-h-64 overflow-auto">
        {itemType === "folder" && (
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
              selectedFolderId === null
                ? "bg-brand-muted text-brand"
                : "text-neutral-300 hover:bg-white/[0.04]"
            }`}
          >
            <FolderIcon className="w-4 h-4" />
            Root (top level)
          </button>
        )}
        {rootFolders.map((folder) => (
          <FolderPickerNode
            key={folder.id}
            folder={folder}
            depth={0}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            excludeId={itemType === "folder" ? itemId : undefined}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </Modal>
  );
}

function FolderPickerNode({
  folder,
  depth,
  selectedFolderId,
  onSelect,
  excludeId,
}: {
  folder: Folder;
  depth: number;
  selectedFolderId: string | null;
  onSelect: (id: string) => void;
  excludeId?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<Folder[]>([]);

  if (folder.id === excludeId) return null;

  async function toggleExpand() {
    if (!isExpanded && children.length === 0) {
      const supabase = createClient();
      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("parent_id", folder.id)
        .order("name");
      setChildren(data ?? []);
    }
    setIsExpanded(!isExpanded);
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded-lg cursor-pointer transition-colors ${
          selectedFolderId === folder.id
            ? "bg-brand-muted text-brand"
            : "text-neutral-300 hover:bg-white/[0.04]"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button onClick={toggleExpand} className="shrink-0 w-4 h-4 flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-neutral-500" />
          )}
        </button>
        <button
          onClick={() => onSelect(folder.id)}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          <FolderIcon className="w-4 h-4 text-neutral-400 shrink-0" />
          <span className="text-sm truncate">{folder.name}</span>
        </button>
      </div>
      {isExpanded &&
        children.map((child) => (
          <FolderPickerNode
            key={child.id}
            folder={child}
            depth={depth + 1}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            excludeId={excludeId}
          />
        ))}
    </div>
  );
}
