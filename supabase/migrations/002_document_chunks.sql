-- ============================================
-- Document Chunks (pgvector) for RAG
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Chunks table: stores embedded text fragments for vector search
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now()
);

create index document_chunks_document_id_idx on public.document_chunks(document_id);

-- HNSW index for cosine similarity search
create index document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- RLS enabled, no policies = only service role can access
alter table public.document_chunks enable row level security;

-- Vector similarity search function (called via supabase-py RPC)
create or replace function match_document_chunks(
  query_embedding extensions.vector(768),
  filter_document_ids uuid[],
  match_count integer default 10
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  similarity double precision
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.document_id = any(filter_document_ids)
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
