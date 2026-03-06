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
      <div className="flex flex-col items-center justify-center h-full text-neutral-500">
        <FileText className="w-12 h-12 mb-2" />
        <p className="text-sm">Select a file to view</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  const signedUrl = data?.signedUrl ?? null;
  const textContent = data?.textContent ?? null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700/50">
        <div>
          <h2 className="text-sm font-medium text-neutral-200">{document.name}</h2>
          <p className="text-xs text-neutral-500">
            {formatFileSize(document.size_bytes)}
          </p>
        </div>
        {signedUrl && (
          <a href={signedUrl} download={document.name}>
            <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
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
        className="max-w-full max-h-full object-contain mx-auto"
      />
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <iframe src={url} className="w-full h-full border-0" title="PDF viewer" />
    );
  }

  if (mimeType.startsWith("text/") && textContent !== null) {
    return (
      <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono bg-neutral-800 border border-neutral-700 p-4 rounded-lg">
        {textContent}
      </pre>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500">
      <FileText className="w-12 h-12 mb-2" />
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
