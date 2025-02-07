-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table for storing document embeddings
create table if not exists documents (
  id bigint primary key generated always as identity,
  content text, -- The document text content
  metadata jsonb, -- Additional metadata about the document
  embedding vector(1536) -- OpenAI embeddings are 1536 dimensions
);

-- Create a function to match documents by vector similarity
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default 5,
  filter jsonb default '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create an index for faster similarity searches
create index on documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Add RLS policies
alter table documents enable row level security;

create policy "Enable read access for authenticated users"
  on documents for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users"
  on documents for insert
  to authenticated
  with check (true);

create policy "Enable update access for document owners"
  on documents for update
  to authenticated
  using (
    metadata->>'created_by' = auth.uid()::text
  );

create policy "Enable delete access for document owners"
  on documents for delete
  to authenticated
  using (
    metadata->>'created_by' = auth.uid()::text
  );
