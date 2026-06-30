-- Migration: 001_initial_schema
-- Aplicada em: 2026-06-30

create extension if not exists "uuid-ossp";

-- profiles
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  role       text not null check (role in ('coprodutora', 'cliente')),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'cliente')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- categorias
create table public.categorias (
  id         uuid primary key default uuid_generate_v4(),
  nome       text not null,
  cor        text,
  arquivada  boolean not null default false,
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- acoes
create table public.acoes (
  id                   uuid primary key default uuid_generate_v4(),
  titulo               text not null,
  descricao            text,
  categoria_id         uuid references public.categorias(id),
  status               text not null default 'planejada'
                         check (status in ('planejada', 'em_andamento', 'concluida')),
  data_prevista        date,
  visivel_para_cliente boolean not null default true,
  notas_internas       text,
  criado_por           uuid not null references public.profiles(id),
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger acoes_updated_at
  before update on public.acoes
  for each row execute procedure public.set_updated_at();

-- acoes_log
create table public.acoes_log (
  id           uuid primary key default uuid_generate_v4(),
  acao_id      uuid not null references public.acoes(id) on delete cascade,
  usuario_id   uuid not null references public.profiles(id),
  tipo_mudanca text not null check (tipo_mudanca in ('criacao', 'status', 'edicao')),
  descricao    text not null,
  created_at   timestamptz default now()
);

-- acoes_comentarios
create table public.acoes_comentarios (
  id         uuid primary key default uuid_generate_v4(),
  acao_id    uuid not null references public.acoes(id) on delete cascade,
  usuario_id uuid not null references public.profiles(id),
  texto      text not null,
  created_at timestamptz default now()
);

-- eventos
create table public.eventos (
  id         uuid primary key default uuid_generate_v4(),
  titulo     text not null,
  tipo       text not null check (tipo in
               ('lancamento','evento_ao_vivo','subir_criativo','aula_ao_vivo')),
  data       date not null,
  descricao  text,
  criado_por uuid not null references public.profiles(id),
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles          enable row level security;
alter table public.categorias        enable row level security;
alter table public.acoes             enable row level security;
alter table public.acoes_log         enable row level security;
alter table public.acoes_comentarios enable row level security;
alter table public.eventos           enable row level security;

create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "perfil: leitura" on public.profiles for select
  using (id = auth.uid() or public.get_my_role() = 'coprodutora');
create policy "perfil: edição própria" on public.profiles for update
  using (id = auth.uid());

create policy "categorias: leitura" on public.categorias for select
  using (auth.uid() is not null);
create policy "categorias: escrita (coprodutora)" on public.categorias for all
  using (public.get_my_role() = 'coprodutora');

create policy "acoes: select" on public.acoes for select
  using (public.get_my_role() = 'coprodutora' or visivel_para_cliente = true);
create policy "acoes: insert" on public.acoes for insert
  with check (
    auth.uid() is not null and
    (public.get_my_role() = 'coprodutora' or
     (visivel_para_cliente = true and notas_internas is null))
  );
create policy "acoes: update" on public.acoes for update
  using (public.get_my_role() = 'coprodutora' or visivel_para_cliente = true)
  with check (
    public.get_my_role() = 'coprodutora' or
    (visivel_para_cliente = true and notas_internas is null)
  );

create policy "log: select" on public.acoes_log for select
  using (exists (
    select 1 from public.acoes a where a.id = acao_id
    and (public.get_my_role() = 'coprodutora' or a.visivel_para_cliente = true)
  ));
create policy "log: insert" on public.acoes_log for insert
  with check (auth.uid() is not null);

create policy "comentarios: select" on public.acoes_comentarios for select
  using (exists (
    select 1 from public.acoes a where a.id = acao_id
    and (public.get_my_role() = 'coprodutora' or a.visivel_para_cliente = true)
  ));
create policy "comentarios: insert" on public.acoes_comentarios for insert
  with check (auth.uid() is not null and usuario_id = auth.uid());

create policy "eventos: select" on public.eventos for select
  using (auth.uid() is not null);
create policy "eventos: insert" on public.eventos for insert
  with check (auth.uid() is not null);
create policy "eventos: update" on public.eventos for update
  using (criado_por = auth.uid() or public.get_my_role() = 'coprodutora');

-- Categorias iniciais
insert into public.categorias (nome, cor) values
  ('Copy',                    '#C4622D'),
  ('Tráfego',                 '#8B6B35'),
  ('Conteúdo Insta',          '#6B7C4E'),
  ('Criativos',               '#A05C3B'),
  ('CS/Atendimento',          '#5A7A8A'),
  ('Lançamento',              '#B5472A'),
  ('E-mail Marketing',        '#7A6A54'),
  ('Automação/Técnico',       '#4A6B5A'),
  ('Estratégia/Diagnóstico',  '#9A6B3A'),
  ('Comunidade',              '#6B8C5A'),
  ('Parcerias/Influencers',   '#8A7A6A'),
  ('Design/Branding',         '#C48B5A');
