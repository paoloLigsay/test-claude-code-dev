import { notFound } from "next/navigation";
import { createServiceClient } from "@/utils/supabase/service";
import { FileText } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!doc) notFound();

  const isTextFile = doc.mime_type.startsWith("text/");
  const isImage = doc.mime_type.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";
  const fileUrl = `/api/share/${id}`;

  let textContent: string | null = null;
  if (isTextFile) {
    const { data: file } = await supabase.storage
      .from("documents")
      .download(doc.storage_path);

    if (file) {
      textContent = await file.text();
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-900 text-neutral-200">
      <header className="border-b border-neutral-700/50 px-6 py-4">
        <h1 className="text-lg font-medium">{doc.name}</h1>
        <p className="text-xs text-neutral-500">
          {formatFileSize(doc.size_bytes)}
        </p>
      </header>

      <main className="flex flex-1 items-start justify-center p-6">
        {isTextFile && textContent !== null ? (
          <pre className="w-full max-w-3xl whitespace-pre-wrap rounded-lg border border-neutral-700 bg-neutral-800 p-6 font-mono text-sm text-neutral-300">
            {textContent}
          </pre>
        ) : isImage ? (
          <img
            src={fileUrl}
            alt={doc.name}
            className="max-h-[80vh] max-w-full rounded-lg object-contain"
          />
        ) : isPdf ? (
          <iframe
            src={fileUrl}
            className="h-[80vh] w-full max-w-4xl rounded-lg border border-neutral-700"
            title={doc.name}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-neutral-500">
            <FileText className="h-12 w-12" />
            <p className="text-sm">Preview not available for this file type</p>
            <a
              href={fileUrl}
              download={doc.name}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Download file
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
