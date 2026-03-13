"use client";

import { useState } from "react";
import { FilePlus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Document } from "@/types";

type Props = {
  folderId: string;
  onCreated: (doc: Document) => void;
};

export function NewFileButton({ folderId, onCreated }: Props) {
  const [isNaming, setIsNaming] = useState(false);
  const [fileName, setFileName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const name = fileName.trim();
    if (!name) {
      setIsNaming(false);
      return;
    }

    setCreating(true);
    const { createEmptyFile } = await import("@/app/dashboard/actions");
    const result = await createEmptyFile(name, folderId);

    if (result.data) {
      onCreated(result.data);
      setFileName("");
      setIsNaming(false);
    }

    setCreating(false);
  }

  if (isNaming) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          onBlur={handleCreate}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") {
              setIsNaming(false);
              setFileName("");
            }
          }}
          placeholder="filename.txt"
          autoFocus
          inputSize="sm"
          disabled={creating}
          className="max-w-[180px]"
        />
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={<FilePlus className="h-4 w-4" />}
      onClick={() => setIsNaming(true)}
    >
      New file
    </Button>
  );
}
