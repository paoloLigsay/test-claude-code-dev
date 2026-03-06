-- ============================================
-- Document Manager Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Folders: self-referencing tree (adjacency list)
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index folders_user_id_idx on public.folders(user_id);
create index folders_parent_id_idx on public.folders(parent_id);

-- Prevent duplicate folder names within the same parent
create unique index folders_unique_name_idx
  on public.folders(user_id, parent_id, name)
  where parent_id is not null;

create unique index folders_unique_root_name_idx
  on public.folders(user_id, name)
  where parent_id is null;

-- Documents: file metadata (actual files in Supabase Storage)
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_user_id_idx on public.documents(user_id);
create index documents_folder_id_idx on public.documents(folder_id);

-- ============================================
-- RLS Policies
-- ============================================

alter table public.folders enable row level security;
alter table public.documents enable row level security;

-- Folders
create policy "Users can select own folders"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "Users can insert own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own folders"
  on public.folders for update
  using (auth.uid() = user_id);

create policy "Users can delete own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

-- Documents
create policy "Users can select own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- ============================================
-- Storage Bucket
-- ============================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

-- Storage RLS: users can only access their own files
create policy "Users can read own files"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own files"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
