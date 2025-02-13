-- Configurações iniciais
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Schemas
COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Tipos
DROP TYPE IF EXISTS "public"."user_status";
CREATE TYPE "public"."user_status" AS ENUM ('online', 'offline');
ALTER TYPE "public"."user_status" OWNER TO "postgres";

-- Funções
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

-- Drop tables if they exist (para evitar conflitos)
DROP TABLE IF EXISTS "public"."usuarios_bloqueados";
DROP TABLE IF EXISTS "public"."msg_chat";
DROP TABLE IF EXISTS "public"."usuarios";

-- Criar tabelas na ordem correta
CREATE TABLE "public"."usuarios" (
    "id" uuid NOT NULL,
    "email" text NOT NULL UNIQUE,
    "nome" text NOT NULL,
    "avatar_url" text,
    "status" text DEFAULT 'offline',
    "ultimo_acesso" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "username" text,
    "bio" text,
    "telefone" text,
    "configuracoes" jsonb DEFAULT '{"tema": "light", "idioma": "pt-BR", "notificacoes": true}',
    "online" boolean DEFAULT false,
    "last_seen" timestamptz DEFAULT now(),
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "usuarios_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id")
);

CREATE TABLE "public"."msg_chat" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "remetente_id" uuid,
    "destinatario_id" uuid,
    "texto" text,
    "tipo" text DEFAULT 'texto',
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "lida_remetente" boolean DEFAULT true,
    "lida_destinatario" boolean DEFAULT false,
    "editada" boolean DEFAULT false,
    "deletada" boolean DEFAULT false,
    "audio_url" text,
    "imagem_url" text,
    "video_url" text,
    "documento_url" text,
    CONSTRAINT "msg_chat_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "msg_chat_remetente_id_fkey" FOREIGN KEY ("remetente_id") REFERENCES "public"."usuarios"("id"),
    CONSTRAINT "msg_chat_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "public"."usuarios"("id"),
    CONSTRAINT "msg_chat_tipo_check" CHECK (tipo IN ('texto', 'imagem', 'audio', 'video', 'documento'))
);

CREATE TABLE "public"."usuarios_bloqueados" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "usuario_id" uuid,
    "bloqueado_id" uuid,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "usuarios_bloqueados_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "usuarios_bloqueados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id"),
    CONSTRAINT "usuarios_bloqueados_bloqueado_id_fkey" FOREIGN KEY ("bloqueado_id") REFERENCES "public"."usuarios"("id"),
    CONSTRAINT "usuarios_bloqueados_usuario_id_bloqueado_id_key" UNIQUE ("usuario_id", "bloqueado_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_usuarios_bloqueados_usuario_id" ON "public"."usuarios_bloqueados"("usuario_id");
CREATE INDEX IF NOT EXISTS "idx_usuarios_bloqueados_bloqueado_id" ON "public"."usuarios_bloqueados"("bloqueado_id");

-- Triggers
CREATE TRIGGER "set_updated_at"
    BEFORE UPDATE ON "public"."usuarios"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_updated_at"();

-- RLS
ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."msg_chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."usuarios_bloqueados" ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Permitir leitura pública" ON "public"."usuarios"
    FOR SELECT TO authenticated, anon
    USING (true);

CREATE POLICY "Permitir atualização própria" ON "public"."usuarios"
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Permitir inserção durante registro" ON "public"."usuarios"
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Usuários podem deletar suas próprias contas" ON "public"."usuarios"
    FOR DELETE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem ver mensagens das suas conversas" ON "public"."msg_chat"
    FOR SELECT TO authenticated
    USING (auth.uid() IN (remetente_id, destinatario_id));

CREATE POLICY "Usuários podem enviar mensagens" ON "public"."msg_chat"
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = remetente_id);

CREATE POLICY "Usuários podem editar suas próprias mensagens" ON "public"."msg_chat"
    FOR UPDATE TO authenticated
    USING (auth.uid() = remetente_id);

CREATE POLICY "Usuários podem deletar suas próprias mensagens" ON "public"."msg_chat"
    FOR DELETE TO authenticated
    USING (auth.uid() = remetente_id);

CREATE POLICY "Permitir leitura de bloqueios" ON "public"."usuarios_bloqueados"
    FOR SELECT TO authenticated
    USING ((auth.uid() = usuario_id) OR (auth.uid() = bloqueado_id));

CREATE POLICY "Permitir inserção de bloqueios" ON "public"."usuarios_bloqueados"
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Permitir deleção de bloqueios" ON "public"."usuarios_bloqueados"
    FOR DELETE TO authenticated
    USING (auth.uid() = usuario_id);

-- Permissões
GRANT USAGE ON SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."usuarios" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."msg_chat" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."usuarios_bloqueados" TO "postgres", "anon", "authenticated", "service_role";

-- Realtime
DROP PUBLICATION IF EXISTS "supabase_realtime";
CREATE PUBLICATION "supabase_realtime";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."msg_chat";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."usuarios";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."usuarios_bloqueados";
