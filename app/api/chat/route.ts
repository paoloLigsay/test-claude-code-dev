import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL!;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY!;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { question } = (await request.json()) as { question: string };
  if (!question?.trim()) {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 }
    );
  }

  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id, name")
    .eq("user_id", user.id);

  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 500 });
  }
  if (!docs || docs.length === 0) {
    return NextResponse.json({ error: "No documents found" }, { status: 404 });
  }

  const documentIds = docs.map((d) => d.id);
  const nameMap = new Map(docs.map((d) => [d.id, d.name]));

  const aiResponse = await fetch(`${AI_SERVICE_URL}/rag/ask/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": INTERNAL_API_KEY,
    },
    body: JSON.stringify({ question, document_ids: documentIds }),
  });

  if (!aiResponse.ok || !aiResponse.body) {
    const body = await aiResponse.json().catch(() => null);
    return NextResponse.json(
      { error: body?.detail ?? `AI service error (${aiResponse.status})` },
      { status: aiResponse.status }
    );
  }

  const reader = aiResponse.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const payload = line.slice(6);
        if (payload === "[DONE]") {
          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          continue;
        }

        const event = JSON.parse(payload) as
          | { type: "text"; content: string }
          | {
              type: "sources";
              sources: {
                document_id: string;
                chunk_index: number;
                content: string;
                similarity: number;
              }[];
            };

        if (event.type === "sources") {
          const enrichedSources = event.sources.map((s) => ({
            ...s,
            document_name: nameMap.get(s.document_id) ?? "Unknown",
          }));
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "sources", sources: enrichedSources })}\n\n`
            )
          );
        } else {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
