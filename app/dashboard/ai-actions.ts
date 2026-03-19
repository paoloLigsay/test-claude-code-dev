"use server";

import { createClient } from "@/utils/supabase/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL!;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY!;

async function callAIService(
  endpoint: string,
  content: string
): Promise<{ result?: string; error?: string }> {
  const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": INTERNAL_API_KEY,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return { error: body?.detail ?? `AI service error (${response.status})` };
  }

  const data = await response.json();
  return { result: data.result };
}

export async function polishDocument(
  documentId: string,
  storagePath: string,
  mimeType: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  if (!mimeType.startsWith("text/")) {
    return { error: "Only text files can be polished" };
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(storagePath);

  if (downloadError || !fileData) {
    return { error: downloadError?.message ?? "Failed to download file" };
  }

  const originalContent = await fileData.text();

  const { result: polishedContent, error: aiError } = await callAIService(
    "/text/polish",
    originalContent
  );

  if (aiError || !polishedContent) return { error: aiError ?? "Polish failed" };

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, new Blob([polishedContent], { type: mimeType }), {
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase
    .from("documents")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", documentId);

  if (dbError) return { error: dbError.message };

  return { data: polishedContent };
}

export async function summarizeDocument(storagePath: string, mimeType: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  if (!mimeType.startsWith("text/")) {
    return { error: "Only text files can be summarized" };
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(storagePath);

  if (downloadError || !fileData) {
    return { error: downloadError?.message ?? "Failed to download file" };
  }

  const originalContent = await fileData.text();

  const { result: summary, error: aiError } = await callAIService(
    "/text/summarize",
    originalContent
  );

  if (aiError || !summary) return { error: aiError ?? "Summarize failed" };

  return { data: summary };
}

export async function embedDocument(
  documentId: string,
  storagePath: string,
  mimeType: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  if (!mimeType.startsWith("text/")) {
    return { error: "Only text files can be embedded" };
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(storagePath);

  if (downloadError || !fileData) {
    return { error: downloadError?.message ?? "Failed to download file" };
  }

  const content = await fileData.text();

  const response = await fetch(`${AI_SERVICE_URL}/rag/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": INTERNAL_API_KEY,
    },
    body: JSON.stringify({ document_id: documentId, content }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return { error: body?.detail ?? `Embed failed (${response.status})` };
  }

  return { success: true };
}

export async function askDocuments(question: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id, name")
    .eq("user_id", user.id);

  if (docsError) return { error: docsError.message };
  if (!docs || docs.length === 0) return { error: "No documents found" };

  const documentIds = docs.map((d) => d.id);
  const nameMap = new Map(docs.map((d) => [d.id, d.name]));

  const response = await fetch(`${AI_SERVICE_URL}/rag/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": INTERNAL_API_KEY,
    },
    body: JSON.stringify({ question, document_ids: documentIds }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return { error: body?.detail ?? `Ask failed (${response.status})` };
  }

  const data = await response.json();

  const sources = (
    data.sources as {
      document_id: string;
      chunk_index: number;
      content: string;
      similarity: number;
    }[]
  ).map((s) => ({
    ...s,
    document_name: nameMap.get(s.document_id) ?? "Unknown",
  }));

  return { data: { answer: data.answer as string, sources } };
}
