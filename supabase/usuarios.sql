-- ============================================================
-- USUÁRIOS - perfis (nome e cargo) para o login do AutoStock
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run
-- (pode rodar mais de uma vez sem problema)
--
-- As SENHAS não ficam aqui: quem guarda é o próprio Supabase (Authentication > Users).
-- Esta tabela guarda só o nome e o cargo de cada pessoa.
-- ============================================================

-- 1) Tabela de perfis (1 linha para cada usuário do Authentication)
create table if not exists public.perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text,
  cargo       text not null default 'funcionario' check (cargo in ('admin', 'funcionario')),
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 2) Permissões: cada pessoa logada só enxerga o próprio perfil.
--    Ninguém muda o próprio cargo pelo sistema (só o dono do banco, pelo SQL).
alter table public.perfis enable row level security;

drop policy if exists "perfis: ver o proprio" on public.perfis;
create policy "perfis: ver o proprio" on public.perfis
  for select to authenticated using (auth.uid() = id);

-- 3) Gatilho: quando alguém cria conta, o perfil é criado sozinho
--    (o nome vem do formulário de cadastro; o cargo começa como 'funcionario')
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- 4) Usuários que já existiam antes deste arquivo também ganham perfil
insert into public.perfis (id, nome, email)
select id,
       coalesce(nullif(trim(raw_user_meta_data ->> 'nome'), ''), split_part(email, '@', 1)),
       email
from auth.users
on conflict (id) do nothing;

-- 5) Para virar ADMINISTRADOR, rode (trocando o e-mail):
-- update public.perfis set cargo = 'admin' where email = 'seu-email@exemplo.com';

-- Conferência
select nome, email, cargo, ativo from public.perfis order by created_at;
