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

  const { error } = await supabase.from("folders").delete().eq("id", folderId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function moveFolder(folderId: string, newParentId: string | null) {
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

  // Fire-and-forget: embed text files for RAG search
  if (data.mime_type.startsWith("text/")) {
    import("@/app/dashboard/ai-actions").then(({ embedDocument }) => {
      embedDocument(data.id, data.storage_path, data.mime_type);
    });
  }

  return { data };
}

export async function deleteDocument(documentId: string, storagePath: string) {
  const supabase = await createClient();

  await supabase.storage.from("documents").remove([storagePath]);

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function moveDocument(documentId: string, newFolderId: string) {
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

    const { data } = (await supabase
      .from("folders")
      .select("parent_id")
      .eq("id", currentId)
      .single()) as { data: { parent_id: string | null } | null };

    currentId = data?.parent_id ?? null;
  }

  return false;
}

export async function searchItems(query: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { folders: [], documents: [] };

  const pattern = `%${query}%`;

  const [foldersResult, docsResult] = await Promise.all([
    supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .ilike("name", pattern)
      .order("name")
      .limit(10),
    supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .ilike("name", pattern)
      .order("name")
      .limit(10),
  ]);

  return {
    folders: foldersResult.data ?? [],
    documents: docsResult.data ?? [],
  };
}

export async function getFolderPath(folderId: string): Promise<string[]> {
  const supabase = await createClient();
  const path: string[] = [];
  let currentId: string | null = folderId;
  const MAX_DEPTH = 50;
  let depth = 0;

  while (currentId && depth++ < MAX_DEPTH) {
    path.unshift(currentId);
    const row = (await supabase
      .from("folders")
      .select("parent_id")
      .eq("id", currentId)
      .single()) as {
      data: { parent_id: string | null } | null;
      error: unknown;
    };

    if (row.error || !row.data) break;

    currentId = row.data.parent_id;
  }

  return path;
}

export async function createEmptyFile(name: string, folderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const ext = name.includes(".") ? name.split(".").pop() : "txt";
  const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const emptyBlob = new Blob([""], { type: "text/plain" });
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, emptyBlob);

  if (uploadError) return { error: uploadError.message };

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      folder_id: folderId,
      name,
      storage_path: storagePath,
      mime_type: "text/plain",
      size_bytes: 0,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function saveFileContent(
  documentId: string,
  storagePath: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const blob = new Blob([content], { type: "text/plain" });

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, blob, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase
    .from("documents")
    .update({
      size_bytes: new TextEncoder().encode(content).length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Fire-and-forget: re-embed for RAG search
  import("@/app/dashboard/ai-actions").then(({ embedDocument }) => {
    embedDocument(documentId, storagePath, "text/plain");
  });

  return { success: true };
}

export async function toggleDocumentPublic(
  documentId: string,
  isPublic: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("documents")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { data: { isPublic } };
}

export async function duplicateFolder(folderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: original } = await supabase
    .from("folders")
    .select("*")
    .eq("id", folderId)
    .single();

  if (!original) return { error: "Folder not found" };

  const { data: newRoot, error: rootError } = await supabase
    .from("folders")
    .insert({
      name: `${original.name} (copy)`,
      parent_id: original.parent_id,
      user_id: user.id,
    })
    .select()
    .single();

  if (rootError) return { error: rootError.message };

  await copyFolderContents(folderId, newRoot.id, user.id);

  return { data: newRoot };
}

async function copyFolderContents(
  sourceFolderId: string,
  targetFolderId: string,
  userId: string
) {
  const supabase = await createClient();

  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("folder_id", sourceFolderId);

  if (docs) {
    for (const doc of docs) {
      const ext = doc.name.split(".").pop() || "bin";
      const newStoragePath = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { data: fileData } = await supabase.storage
        .from("documents")
        .download(doc.storage_path);

      if (fileData) {
        await supabase.storage
          .from("documents")
          .upload(newStoragePath, fileData);

        await supabase.from("documents").insert({
          user_id: userId,
          folder_id: targetFolderId,
          name: doc.name,
          storage_path: newStoragePath,
          mime_type: doc.mime_type,
          size_bytes: doc.size_bytes,
        });
      }
    }
  }

  const { data: subfolders } = await supabase
    .from("folders")
    .select("*")
    .eq("parent_id", sourceFolderId);

  if (subfolders) {
    for (const sub of subfolders) {
      const { data: newSub } = await supabase
        .from("folders")
        .insert({
          name: sub.name,
          parent_id: targetFolderId,
          user_id: userId,
        })
        .select()
        .single();

      if (newSub) {
        await copyFolderContents(sub.id, newSub.id, userId);
      }
    }
  }
}

// Recursively collect all document storage paths under a folder
async function collectSubtreeStoragePaths(folderId: string): Promise<string[]> {
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
