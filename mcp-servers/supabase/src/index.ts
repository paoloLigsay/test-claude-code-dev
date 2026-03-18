import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const server = new McpServer({
  name: "supabase-custom",
  version: "0.1.0",
});

server.tool(
  "list_folders",
  "List root folders or children of a specific folder",
  { parent_id: z.string().uuid().optional() },
  async ({ parent_id }) => {
    const query = supabase.from("folders").select("*").order("name");

    const { data, error } = parent_id
      ? await query.eq("parent_id", parent_id)
      : await query.is("parent_id", null);

    if (error) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "list_documents",
  "List documents in a folder",
  { folder_id: z.string().uuid() },
  async ({ folder_id }) => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("folder_id", folder_id)
      .order("name");

    if (error) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "search_items",
  "Search folders and documents by name",
  { query: z.string().min(1) },
  async ({ query }) => {
    const pattern = `%${query}%`;

    const [foldersResult, docsResult] = await Promise.all([
      supabase
        .from("folders")
        .select("*")
        .ilike("name", pattern)
        .order("name")
        .limit(10),
      supabase
        .from("documents")
        .select("*")
        .ilike("name", pattern)
        .order("name")
        .limit(10),
    ]);

    const result = {
      folders: foldersResult.data ?? [],
      documents: docsResult.data ?? [],
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  }
);

server.tool(
  "get_document_content",
  "Download and return text content of a document from Storage",
  { storage_path: z.string().min(1) },
  async ({ storage_path }) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(storage_path);

    if (error) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
      };
    }

    const text = await data.text();
    return { content: [{ type: "text" as const, text }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Supabase MCP server running on stdio");
}

main();
