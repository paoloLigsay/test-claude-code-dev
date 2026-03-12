import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { FolderContents } from "@/types";

export function useFolderContents(folderId: string, enabled: boolean) {
  return useQuery<FolderContents>({
    queryKey: ["folder-contents", folderId],
    queryFn: async () => {
      const supabase = createClient();
      const [foldersResult, docsResult] = await Promise.all([
        supabase
          .from("folders")
          .select("*")
          .eq("parent_id", folderId)
          .order("name"),
        supabase
          .from("documents")
          .select("*")
          .eq("folder_id", folderId)
          .order("name"),
      ]);
      return {
        subfolders: foldersResult.data ?? [],
        documents: docsResult.data ?? [],
      };
    },
    enabled,
  });
}

export function useInvalidateFolderContents() {
  const queryClient = useQueryClient();

  return (folderId: string | null) => {
    if (folderId) {
      queryClient.invalidateQueries({
        queryKey: ["folder-contents", folderId],
      });
    }
    queryClient.invalidateQueries({ queryKey: ["root-folders"] });
  };
}
