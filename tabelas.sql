create table public.usuarios (
  id uuid not null,
  email text not null,
  nome text not null,
  avatar_url text null,
  status text null default 'offline'::text,
  ultimo_acesso timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  username text null,
  bio text null,
  telefone text null,
  configuracoes jsonb null default '{"tema": "light", "idioma": "pt-BR", "notificacoes": true}'::jsonb,
  online boolean null default false,
  last_seen timestamp with time zone null default now(),
  constraint usuarios_pkey primary key (id),
  constraint usuarios_email_key unique (email),
  constraint usuarios_id_fkey foreign KEY (id) references auth.users (id)
) TABLESPACE pg_default;

create table public.usuarios_bloqueados (
  id uuid not null default extensions.uuid_generate_v4 (),
  usuario_id uuid not null,
  bloqueado_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint usuarios_bloqueados_pkey primary key (id),
  constraint usuarios_bloqueados_usuario_id_bloqueado_id_key unique (usuario_id, bloqueado_id),
  constraint usuarios_bloqueados_bloqueado_id_fkey foreign KEY (bloqueado_id) references usuarios (id),
  constraint usuarios_bloqueados_usuario_id_fkey foreign KEY (usuario_id) references usuarios (id)
) TABLESPACE pg_default;

create index IF not exists idx_usuarios_bloqueados_usuario_id on public.usuarios_bloqueados using btree (usuario_id) TABLESPACE pg_default;
create index IF not exists idx_usuarios_bloqueados_bloqueado_id on public.usuarios_bloqueados using btree (bloqueado_id) TABLESPACE pg_default;

create table public.msg_chat (
  id uuid not null default extensions.uuid_generate_v4 (),
  remetente_id uuid null,
  destinatario_id uuid null,
  texto text null,
  tipo text null default 'texto'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  lida_remetente boolean null default true,
  lida_destinatario boolean null default false,
  editada boolean null default false,
  deletada boolean null default false,
  audio_url text null,
  imagem_url text null,
  video_url text null,
  documento_url text null,
  constraint msg_chat_pkey primary key (id),
  constraint msg_chat_destinatario_id_fkey foreign KEY (destinatario_id) references usuarios (id),
  constraint msg_chat_remetente_id_fkey foreign KEY (remetente_id) references usuarios (id),
  constraint msg_chat_tipo_check check (
    (
      tipo = any (
        array[
          'texto'::text,
          'imagem'::text,
          'audio'::text,
          'video'::text,
          'documento'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Política para permitir inserção durante o registro
CREATE POLICY "Permitir inserção durante registro"
ON public.usuarios
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Política para permitir usuários verem outros usuários
CREATE POLICY "Usuários podem ver outros usuários"
ON public.usuarios
FOR SELECT
TO authenticated, anon
USING (true);

-- Política para permitir usuários atualizarem seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para permitir usuários deletarem suas próprias contas
CREATE POLICY "Usuários podem deletar suas próprias contas"
ON public.usuarios
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura de bloqueios" ON public.usuarios_bloqueados
FOR SELECT TO authenticated
USING (
  auth.uid() = usuario_id OR auth.uid() = bloqueado_id
);

-- Permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção de bloqueios" ON public.usuarios_bloqueados
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = usuario_id
);

-- Permitir deleção para usuários autenticados
CREATE POLICY "Permitir deleção de bloqueios" ON public.usuarios_bloqueados
FOR DELETE TO authenticated
USING (
  auth.uid() = usuario_id
);

-- Atualiza o trigger para manter o last_seen atualizado
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_seen = CASE 
    WHEN NEW.online <> OLD.online THEN now()
    ELSE OLD.last_seen
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualiza o trigger para manter o last_seen atualizado
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tipos
DROP TYPE IF EXISTS "public"."user_status";
CREATE TYPE "public"."user_status" AS ENUM ('online', 'offline');
ALTER TYPE "public"."user_status" OWNER TO "postgres";

-- Cria um trigger para atualizar last_seen quando o status online muda
CREATE TRIGGER usuarios_last_seen
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

create trigger set_updated_at BEFORE
update on usuarios for EACH row
execute FUNCTION set_updated_at ();