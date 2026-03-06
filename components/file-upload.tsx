"use client";

import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { uploadDocument } from "@/app/dashboard/actions";
import { Button } from "./ui/button";

type Props = {
  folderId: string;
  onUploadComplete: () => void;
};

export function FileUpload({ folderId, onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("folderId", folderId);

    const result = await uploadDocument(formData);

    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      onUploadComplete();
    }

    setUploading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        icon={<Upload className="w-4 h-4" />}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload file"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-xs text-red-400 px-3 mt-1">{error}</p>}
    </div>
  );
}
