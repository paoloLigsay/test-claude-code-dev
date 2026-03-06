"use server";

import { createClient } from "@/utils/supabase/server";

export async function createFolder(name: string, parentId: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("folders")
    .insert({ name, parent_id: parentId, user_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function renameFolder(folderId: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("folders")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", folderId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteFolder(folderId: string) {
  const supabase = await createClient();

  // Collect all document storage paths in the subtree before cascade delete
  const storagePaths = await collectSubtreeStoragePaths(folderId);

  if (storagePaths.length > 0) {
    await supabase.storage.from("documents").remove(storagePaths);
  }

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function moveFolder(
  folderId: string,
  newParentId: string | null
) {
  const supabase = await createClient();

  // Prevent moving a folder into itself or its own descendants
  if (newParentId) {
    const isDescendant = await checkIsDescendant(folderId, newParentId);
    if (isDescendant) {
      return { error: "Cannot move a folder into its own subfolder" };
    }
  }

  const { error } = await supabase
    .from("folders")
    .update({ parent_id: newParentId, updated_at: new Date().toISOString() })
    .eq("id", folderId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  const folderId = formData.get("folderId") as string;

  const ext = file.name.split(".").pop();
  const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file);

  if (uploadError) return { error: uploadError.message };

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      folder_id: folderId,
      name: file.name,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteDocument(
  documentId: string,
  storagePath: string
) {
  const supabase = await createClient();

  await supabase.storage.from("documents").remove([storagePath]);

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function moveDocument(
  documentId: string,
  newFolderId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("documents")
    .update({ folder_id: newFolderId, updated_at: new Date().toISOString() })
    .eq("id", documentId);

  if (error) return { error: error.message };
  return { success: true };
}

// Walk up from targetId to check if folderId is an ancestor
async function checkIsDescendant(
  folderId: string,
  targetId: string
): Promise<boolean> {
  const supabase = await createClient();
  let currentId: string | null = targetId;

  while (currentId) {
    if (currentId === folderId) return true;

    const { data } = await supabase
      .from("folders")
      .select("parent_id")
      .eq("id", currentId)
      .single() as { data: { parent_id: string | null } | null };

    currentId = data?.parent_id ?? null;
  }

  return false;
}

// Recursively collect all document storage paths under a folder
async function collectSubtreeStoragePaths(
  folderId: string
): Promise<string[]> {
  const supabase = await createClient();
  const paths: string[] = [];

  const { data: docs } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("folder_id", folderId);

  if (docs) {
    paths.push(...docs.map((d) => d.storage_path));
  }

  const { data: subfolders } = await supabase
    .from("folders")
    .select("id")
    .eq("parent_id", folderId);

  if (subfolders) {
    for (const sub of subfolders) {
      const subPaths = await collectSubtreeStoragePaths(sub.id);
      paths.push(...subPaths);
    }
  }

  return paths;
}
