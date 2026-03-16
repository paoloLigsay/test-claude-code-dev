"use client";

import {
  useState,
  useEffect,
  useTransition,
  useImperativeHandle,
  useCallback,
  forwardRef,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import {
  FileText,
  Download,
  Sparkles,
  Save,
  AlignLeft,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { IconButton } from "./ui/icon-button";
import { Modal } from "./ui/modal";
import type { Document } from "@/types";

type Props = {
  document: Document | null;
};

export type FileViewerHandle = {
  save: () => Promise<void>;
};

type SignedUrlData = {
  signedUrl: string;
  textContent: string | null;
};

export const FileViewer = forwardRef<FileViewerHandle, Props>(
  function FileViewer({ document }, ref) {
    const queryClient = useQueryClient();
    const [polishing, startPolishTransition] = useTransition();
    const [summarizing, startSummarizeTransition] = useTransition();
    const [editedContent, setEditedContent] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [saving, startSaveTransition] = useTransition();

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

    const originalContent = data?.textContent ?? null;
    const isTextFile = document?.mime_type.startsWith("text/") ?? false;
    const isDirty =
      isTextFile && editedContent !== null && editedContent !== originalContent;

    useEffect(() => {
      setEditedContent(null);
      setSummary(null);
      setCopied(false);
    }, [document?.id]);

    const save = useCallback(async () => {
      if (!document || !isDirty || editedContent === null) return;

      const { saveFileContent } = await import("@/app/dashboard/actions");
      const result = await saveFileContent(
        document.id,
        document.storage_path,
        editedContent
      );

      if (result.error) {
        console.error("Save failed:", result.error);
        return;
      }

      queryClient.setQueryData<SignedUrlData | null>(
        ["signed-url", document.storage_path],
        (old) => (old ? { ...old, textContent: editedContent } : old)
      );
      setEditedContent(null);
    }, [document, isDirty, editedContent, queryClient]);

    useImperativeHandle(ref, () => ({ save }), [save]);

    function handleSave() {
      startSaveTransition(() => save());
    }

    function handleSummarize() {
      if (!document) return;

      startSummarizeTransition(async () => {
        const { summarizeDocument } =
          await import("@/app/dashboard/ai-actions");
        const result = await summarizeDocument(
          document.storage_path,
          document.mime_type
        );

        if (result.error) {
          console.error("Summarize failed:", result.error);
          return;
        }

        setSummary(result.data ?? null);
      });
    }

    function handlePolish() {
      if (!document) return;

      startPolishTransition(async () => {
        const { polishDocument } = await import("@/app/dashboard/ai-actions");
        const result = await polishDocument(
          document.id,
          document.storage_path,
          document.mime_type
        );

        if (result.error) {
          console.error("Polish failed:", result.error);
          return;
        }

        queryClient.setQueryData<SignedUrlData | null>(
          ["signed-url", document.storage_path],
          (old) => (old ? { ...old, textContent: result.data ?? null } : old)
        );
        setEditedContent(null);
      });
    }

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
    const displayContent = editedContent ?? originalContent;

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-neutral-700/50 px-4 py-3">
          <div>
            <h2 className="text-sm font-medium text-neutral-200">
              {document.name}
            </h2>
            <p className="text-xs text-neutral-500">
              {formatFileSize(document.size_bytes)}
              {isDirty && " (unsaved)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isTextFile && isDirty && (
              <Button
                variant="primary"
                size="sm"
                icon={<Save size={14} />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
            {isTextFile && (
              <Button
                variant="ghost"
                size="sm"
                icon={<AlignLeft size={14} />}
                onClick={handleSummarize}
                disabled={summarizing || isDirty}
              >
                {summarizing ? "Summarizing..." : "Summarize"}
              </Button>
            )}
            {isTextFile && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Sparkles size={14} />}
                onClick={handlePolish}
                disabled={polishing || isDirty}
              >
                {polishing ? "Polishing..." : "Polish"}
              </Button>
            )}
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
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isTextFile ? (
            <textarea
              className="h-full w-full resize-none rounded-lg border border-neutral-700 bg-neutral-800 p-4 font-mono text-sm text-neutral-300 outline-none focus:border-neutral-600"
              value={displayContent ?? ""}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          ) : (
            renderContent(document.mime_type, signedUrl)
          )}
        </div>

        {summary && (
          <Modal
            title="Summary"
            onClose={() => {
              setSummary(null);
              setCopied(false);
            }}
            className="max-w-lg"
            footer={
              <IconButton
                onClick={async () => {
                  await navigator.clipboard.writeText(summary);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </IconButton>
            }
          >
            <div className="max-h-96 overflow-auto whitespace-pre-wrap text-sm text-neutral-300">
              {summary}
            </div>
          </Modal>
        )}
      </div>
    );
  }
);

function renderContent(mimeType: string, url: string | null) {
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
