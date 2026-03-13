"use server";

import { createClient } from "@/utils/supabase/server";

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

  const { getModel } = await import("@/utils/gemini/client");
  const { POLISH_DOCUMENT } = await import("@/utils/gemini/prompts");
  const model = getModel();
  const result = await model.generateContent(
    `${POLISH_DOCUMENT}\n\n---\n\n${originalContent}`
  );
  const polishedContent = result.response.text();

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
