-- =====================================================================
-- Roteirização de Visitas · estrutura do banco (Supabase / PostgreSQL)
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run.
-- Pode rodar de novo sem perder dados (é idempotente).
-- =====================================================================

-- ---------- Tabelas ----------
create table if not exists public.vendedores (
  area        text primary key,               -- código da área (ex.: 1510101)
  nome        text not null,
  equipe      text,
  supervisor  text,
  tipo        text,                            -- Auto, Auto total, Moto...
  email       text unique,                     -- e-mail de login (corporativo)
  papel       text not null default 'vendedor' check (papel in ('vendedor','supervisor','admin')),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

create table if not exists public.clientes (
  cod             text primary key,
  nome            text not null,
  cidade          text,
  endereco        text,
  telefone        text,
  segmento        text,
  status          text,
  ult_compra      date,
  dias_sem_compra int,
  area            text references public.vendedores(area) on update cascade,
  equipe          text,
  tipo            text,
  -- roteiro
  freq            text not null default 'M' check (freq in ('S','Q','M')),
  semana          int  not null default 1 check (semana between 0 and 5),
  dia             int  check (dia between 1 and 6),      -- 1=Seg ... 6=Sáb; nulo = não alocado
  ordem           int,
  atualizado_em   timestamptz not null default now()
);
create index if not exists clientes_area_idx on public.clientes(area);
create index if not exists clientes_equipe_idx on public.clientes(equipe);

create table if not exists public.visitas (
  id            uuid primary key default gen_random_uuid(),
  data          date not null,
  cod           text not null references public.clientes(cod) on delete cascade,
  area          text,
  equipe        text,
  visitou       boolean not null default false,
  resultado     text check (resultado in ('vendeu','nao') or resultado is null),
  valor         numeric(14,2) default 0,
  motivo        text,
  conversa      text,
  hora          text,
  extra         boolean not null default false,
  criado_por    uuid default auth.uid(),
  atualizado_em timestamptz not null default now(),
  unique (data, cod)
);
create index if not exists visitas_data_idx on public.visitas(data);
create index if not exists visitas_area_data_idx on public.visitas(area, data);

create table if not exists public.config (
  id                     int primary key default 1 check (id = 1),
  paridade               text not null default 'iso' check (paridade in ('iso','mes')),
  cap                    int  not null default 12,
  motivos                text[] not null default array['Estoque abastecido','Preço / condição comercial','Sem limite de crédito','Comprador ausente','Loja fechada','Comprou da concorrência','Outro'],
  vendedor_edita_roteiro boolean not null default false
);
insert into public.config (id) values (1) on conflict do nothing;

-- ---------- Quem é o usuário logado ----------
create or replace function public.meu_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from vendedores where lower(email) = lower(auth.jwt() ->> 'email') and ativo limit 1
$$;
create or replace function public.minha_area() returns text
language sql stable security definer set search_path = public as $$
  select area from vendedores where lower(email) = lower(auth.jwt() ->> 'email') and ativo limit 1
$$;
create or replace function public.minha_equipe() returns text
language sql stable security definer set search_path = public as $$
  select equipe from vendedores where lower(email) = lower(auth.jwt() ->> 'email') and ativo limit 1
$$;
create or replace function public.vendedor_edita() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select vendedor_edita_roteiro from config where id = 1), false)
$$;

-- ---------- Segurança por linha ----------
alter table public.vendedores enable row level security;
alter table public.clientes   enable row level security;
alter table public.visitas    enable row level security;
alter table public.config     enable row level security;

drop policy if exists vend_sel on public.vendedores;
drop policy if exists vend_adm on public.vendedores;
create policy vend_sel on public.vendedores for select to authenticated using (
  meu_papel() = 'admin'
  or (meu_papel() = 'supervisor' and equipe = minha_equipe())
  or lower(email) = lower(auth.jwt() ->> 'email'));
create policy vend_adm on public.vendedores for all to authenticated
  using (meu_papel() = 'admin') with check (meu_papel() = 'admin');

drop policy if exists cli_sel on public.clientes;
drop policy if exists cli_upd on public.clientes;
drop policy if exists cli_ins on public.clientes;
drop policy if exists cli_del on public.clientes;
create policy cli_sel on public.clientes for select to authenticated using (
  meu_papel() = 'admin'
  or (meu_papel() = 'supervisor' and equipe = minha_equipe())
  or area = minha_area());
create policy cli_upd on public.clientes for update to authenticated using (
  meu_papel() = 'admin'
  or (meu_papel() = 'supervisor' and equipe = minha_equipe())
  or (area = minha_area() and vendedor_edita()));
create policy cli_ins on public.clientes for insert to authenticated with check (meu_papel() = 'admin');
create policy cli_del on public.clientes for delete to authenticated using (meu_papel() = 'admin');

drop policy if exists vis_sel on public.visitas;
drop policy if exists vis_ins on public.visitas;
drop policy if exists vis_upd on public.visitas;
drop policy if exists vis_del on public.visitas;
create policy vis_sel on public.visitas for select to authenticated using (
  meu_papel() = 'admin'
  or (meu_papel() = 'supervisor' and equipe = minha_equipe())
  or area = minha_area());
create policy vis_ins on public.visitas for insert to authenticated with check (
  meu_papel() = 'admin'
  or (meu_papel() = 'supervisor' and equipe = minha_equipe())
  or area = minha_area());
create policy vis_upd on public.visitas for update to authenticated using (
  meu_papel() = 'admin'
  or (meu_papel() = 'supervisor' and equipe = minha_equipe())
  or area = minha_area());
create policy vis_del on public.visitas for delete to authenticated using (
  meu_papel() = 'admin'
  or (meu_papel() = 'supervisor' and equipe = minha_equipe())
  or area = minha_area());

drop policy if exists cfg_sel on public.config;
drop policy if exists cfg_upd on public.config;
create policy cfg_sel on public.config for select to authenticated using (true);
create policy cfg_upd on public.config for update to authenticated using (meu_papel() = 'admin');

-- ---------- Salvar vários roteiros de uma vez (respeita as permissões acima) ----------
create or replace function public.salvar_rotas(p jsonb) returns void
language sql security invoker set search_path = public as $$
  update clientes c
     set freq = x.freq, semana = x.semana, dia = x.dia, ordem = x.ordem, atualizado_em = now()
    from jsonb_to_recordset(p) as x(cod text, freq text, semana int, dia int, ordem int)
   where c.cod = x.cod
$$;
grant execute on function public.salvar_rotas(jsonb) to authenticated;
