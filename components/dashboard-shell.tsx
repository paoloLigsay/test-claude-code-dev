"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Sidebar } from "./sidebar";
import { FileViewer, FileViewerHandle } from "./file-viewer";
import { FileUpload } from "./file-upload";
import { NewFileButton } from "./new-file-button";
import { MoveDialog } from "./move-dialog";
import { SearchModal } from "./search-modal";
import { ChatPanel } from "./chat-panel";
import { createClient } from "@/utils/supabase/client";
import { MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import type { Folder, Document } from "@/types";

type MoveTarget = {
  type: "folder" | "document";
  id: string;
  name: string;
};

type Props = {
  initialFolders: Folder[];
};

export function DashboardShell({ initialFolders }: Props) {
  const queryClient = useQueryClient();
  const { data: rootFolders = [] } = useQuery<Folder[]>({
    queryKey: ["root-folders"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("folders")
        .select("*")
        .is("parent_id", null)
        .order("name");
      return data ?? [];
    },
    initialData: initialFolders,
  });

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [revealPath, setRevealPath] = useState<string[]>([]);
  const fileViewerRef = useRef<FileViewerHandle>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSelectFolder = useCallback(async (folder: Folder) => {
    const { getFolderPath } = await import("@/app/dashboard/actions");
    const path = await getFolderPath(folder.id);
    setRevealPath(path);
    setSelectedFolderId(folder.id);
  }, []);

  const handleSearchSelectDocument = useCallback(async (doc: Document) => {
    await fileViewerRef.current?.save();
    const { getFolderPath } = await import("@/app/dashboard/actions");
    const path = await getFolderPath(doc.folder_id);
    setRevealPath(path);
    setSelectedDocument(doc);
    setSelectedFolderId(doc.folder_id);
  }, []);

  function refreshRootFolders() {
    queryClient.invalidateQueries({ queryKey: ["root-folders"] });
  }

  async function handleSelectDocument(doc: Document) {
    await fileViewerRef.current?.save();
    setSelectedDocument(doc);
    setSelectedFolderId(doc.folder_id);
  }

  function handleRequestMove(
    type: "folder" | "document",
    id: string,
    name: string
  ) {
    setMoveTarget({ type, id, name });
  }

  return (
    <div className="h-screen bg-neutral-900">
      <Group orientation="horizontal">
        <Panel defaultSize="20%" minSize="15%" maxSize="40%">
          <Sidebar
            folders={rootFolders}
            selectedDocumentId={selectedDocument?.id ?? null}
            selectedFolderId={selectedFolderId}
            uploadFolderId={selectedFolderId}
            onSelectDocument={handleSelectDocument}
            onFolderMutated={refreshRootFolders}
            onRequestMove={handleRequestMove}
            onSelectFolder={setSelectedFolderId}
            revealPath={revealPath}
          />
        </Panel>
        <Separator className="hover:bg-brand/50 data-[resize-handle-active]:bg-brand/50 w-[1px] cursor-col-resize bg-neutral-700/50 transition-colors focus:outline-none" />
        <Panel defaultSize={chatOpen ? "55%" : "80%"}>
          <div className="flex h-full flex-col bg-[#202020]">
            <div className="flex items-center justify-between border-b border-neutral-700/50 px-4 py-2">
              <div className="flex gap-2">
                {selectedFolderId && (
                  <>
                    <FileUpload
                      folderId={selectedFolderId}
                      onUploadComplete={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["folder-contents", selectedFolderId],
                        });
                      }}
                    />
                    <NewFileButton
                      folderId={selectedFolderId}
                      onCreated={(doc) => {
                        queryClient.invalidateQueries({
                          queryKey: ["folder-contents", selectedFolderId],
                        });
                        setSelectedDocument(doc);
                      }}
                    />
                  </>
                )}
              </div>
              <Button
                variant={chatOpen ? "default" : "ghost"}
                size="sm"
                icon={<MessageSquare size={14} />}
                onClick={() => setChatOpen((prev) => !prev)}
              >
                Ask AI
              </Button>
            </div>
            <div className="flex-1">
              <FileViewer ref={fileViewerRef} document={selectedDocument} />
            </div>
          </div>
        </Panel>
        {chatOpen && (
          <>
            <Separator className="hover:bg-brand/50 data-[resize-handle-active]:bg-brand/50 w-[1px] cursor-col-resize bg-neutral-700/50 transition-colors focus:outline-none" />
            <Panel defaultSize="25%" minSize="15%" maxSize="40%">
              <ChatPanel />
            </Panel>
          </>
        )}
      </Group>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectFolder={handleSearchSelectFolder}
        onSelectDocument={handleSearchSelectDocument}
      />

      {moveTarget && (
        <MoveDialog
          itemType={moveTarget.type}
          itemId={moveTarget.id}
          itemName={moveTarget.name}
          onClose={() => setMoveTarget(null)}
          onMoved={() => {
            queryClient.invalidateQueries({ queryKey: ["root-folders"] });
            queryClient.invalidateQueries({ queryKey: ["folder-contents"] });
          }}
        />
      )}
    </div>
  );
}
