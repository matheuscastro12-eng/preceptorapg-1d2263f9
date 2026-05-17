-- Histórico de conversas do PreceptorMED Chat (estilo ChatGPT)
-- chat_conversations: 1 linha por conversa do usuário
-- chat_messages: mensagens individuais (user + assistant) vinculadas à conversa

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_conversations_user_updated_idx
  on public.chat_conversations(user_id, updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages(conversation_id, created_at);

-- RLS
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "users see own conversations" on public.chat_conversations;
create policy "users see own conversations"
  on public.chat_conversations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users see messages of own conversations" on public.chat_messages;
create policy "users see messages of own conversations"
  on public.chat_messages
  for all
  using (
    exists (
      select 1 from public.chat_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chat_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Trigger pra atualizar updated_at na conversa quando uma mensagem nova chega
create or replace function public.bump_conversation_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_bump_conversation on public.chat_messages;
create trigger chat_messages_bump_conversation
  after insert on public.chat_messages
  for each row
  execute function public.bump_conversation_updated_at();
