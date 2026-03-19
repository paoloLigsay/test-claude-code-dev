"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { IconButton } from "./ui/icon-button";
import { Input } from "./ui/input";
import type { ChatMessage, ChatSource } from "@/types";

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [asking, startAskTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || asking) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    startAskTransition(async () => {
      const { askDocuments } = await import("@/app/dashboard/ai-actions");
      const result = await askDocuments(question);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.error ?? result.data?.answer ?? "No response",
        sources: result.data?.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    });
  }

  return (
    <div className="flex h-full flex-col bg-neutral-900">
      <div className="border-b border-neutral-700/50 px-4 py-3">
        <h2 className="text-sm font-medium text-neutral-200">Ask AI</h2>
        <p className="text-xs text-neutral-500">
          Ask questions about your documents
        </p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-neutral-500">
            <FileText className="mb-2 h-8 w-8" />
            <p className="text-sm">Ask a question about your documents</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {asking && (
              <div className="flex gap-1.5 px-3 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-500" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-500 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-500 [animation-delay:300ms]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-neutral-700/50 px-4 py-3"
      >
        <Input
          inputSize="sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={asking}
        />
        <IconButton type="submit" disabled={asking || !input.trim()}>
          <Send className="h-4 w-4" />
        </IconButton>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-brand/20 text-neutral-200"
            : "bg-neutral-800 text-neutral-300"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <SourceList sources={message.sources} />
        )}
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: ChatSource[] }) {
  const [expanded, setExpanded] = useState(false);

  const uniqueDocs = [
    ...new Map(sources.map((s) => [s.document_id, s.document_name])).entries(),
  ];

  return (
    <div className="mt-2 border-t border-neutral-700/50 pt-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-400"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {uniqueDocs.length} source{uniqueDocs.length !== 1 ? "s" : ""}
      </button>
      {expanded && (
        <div className="mt-1 space-y-1">
          {sources.map((source, i) => (
            <div
              key={`${source.document_id}-${source.chunk_index}-${i}`}
              className="rounded bg-neutral-700/50 px-2 py-1 text-xs text-neutral-400"
            >
              <span className="font-medium text-neutral-300">
                {source.document_name}
              </span>
              <p className="mt-0.5 line-clamp-2">{source.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
