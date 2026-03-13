"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { FileText, Download } from "lucide-react";
import { Button } from "./ui/button";
import type { Document } from "@/types";

type Props = {
  document: Document | null;
};

type SignedUrlData = {
  signedUrl: string;
  textContent: string | null;
};

export function FileViewer({ document }: Props) {
  const { data, isLoading } = useQuery<SignedUrlData | null>({
    queryKey: ["signed-url", document?.storage_path],
    queryFn: async () => {
      if (!document) return null;

      const supabase = createClient();
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.storage_path, 3600);

      if (!data?.signedUrl) return null;

      let textContent: string | null = null;
      if (document.mime_type.startsWith("text/")) {
        const response = await fetch(data.signedUrl);
        textContent = await response.text();
      }

      return { signedUrl: data.signedUrl, textContent };
    },
    enabled: !!document,
    staleTime: 30 * 60 * 1000,
  });

  if (!document) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-neutral-500">
        <FileText className="mb-2 h-12 w-12" />
        <p className="text-sm">Select a file to view</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  const signedUrl = data?.signedUrl ?? null;
  const textContent = data?.textContent ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-700/50 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-neutral-200">
            {document.name}
          </h2>
          <p className="text-xs text-neutral-500">
            {formatFileSize(document.size_bytes)}
          </p>
        </div>
        {signedUrl && (
          <a href={signedUrl} download={document.name}>
            <Button
              variant="ghost"
              size="sm"
              icon={<Download className="h-4 w-4" />}
            >
              Download
            </Button>
          </a>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {renderContent(document.mime_type, signedUrl, textContent)}
      </div>
    </div>
  );
}

function renderContent(
  mimeType: string,
  url: string | null,
  textContent: string | null
) {
  if (!url) return null;

  if (mimeType.startsWith("image/")) {
    return (
      <img
        src={url}
        alt="Document preview"
        className="mx-auto max-h-full max-w-full object-contain"
      />
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <iframe src={url} className="h-full w-full border-0" title="PDF viewer" />
    );
  }

  if (mimeType.startsWith("text/") && textContent !== null) {
    return (
      <pre className="whitespace-pre-wrap rounded-lg border border-neutral-700 bg-neutral-800 p-4 font-mono text-sm text-neutral-300">
        {textContent}
      </pre>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-neutral-500">
      <FileText className="mb-2 h-12 w-12" />
      <p className="text-sm">Preview not available for this file type</p>
      <a
        href={url}
        download
        className="mt-2 text-sm text-brand hover:text-brand-hover"
      >
        Download file
      </a>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
