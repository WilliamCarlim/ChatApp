

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


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_status" AS ENUM (
    'online',
    'offline'
);


ALTER TYPE "public"."user_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_seen = CASE 
    WHEN NEW.online <> OLD.online THEN now()
    ELSE OLD.last_seen
  END;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."msg_chat" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "remetente_id" "uuid",
    "destinatario_id" "uuid",
    "texto" "text",
    "tipo" "text" DEFAULT 'texto'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "lida_remetente" boolean DEFAULT true,
    "lida_destinatario" boolean DEFAULT false,
    "editada" boolean DEFAULT false,
    "deletada" boolean DEFAULT false,
    "audio_url" "text",
    "imagem_url" "text",
    "video_url" "text",
    "documento_url" "text",
    CONSTRAINT "msg_chat_tipo_check" CHECK (("tipo" = ANY (ARRAY['texto'::"text", 'imagem'::"text", 'audio'::"text", 'video'::"text", 'documento'::"text"])))
);


ALTER TABLE "public"."msg_chat" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "avatar_url" "text",
    "status" "text" DEFAULT 'offline'::"text",
    "ultimo_acesso" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "username" "text",
    "bio" "text",
    "telefone" "text",
    "configuracoes" "jsonb" DEFAULT '{"tema": "light", "idioma": "pt-BR", "notificacoes": true}'::"jsonb",
    "online" boolean DEFAULT false,
    "last_seen" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."usuarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios_bloqueados" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "bloqueado_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."usuarios_bloqueados" OWNER TO "postgres";


ALTER TABLE ONLY "public"."msg_chat"
    ADD CONSTRAINT "msg_chat_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios_bloqueados"
    ADD CONSTRAINT "usuarios_bloqueados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios_bloqueados"
    ADD CONSTRAINT "usuarios_bloqueados_usuario_id_bloqueado_id_key" UNIQUE ("usuario_id", "bloqueado_id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_usuarios_bloqueados_bloqueado_id" ON "public"."usuarios_bloqueados" USING "btree" ("bloqueado_id");



CREATE INDEX "idx_usuarios_bloqueados_usuario_id" ON "public"."usuarios_bloqueados" USING "btree" ("usuario_id");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "usuarios_last_seen" BEFORE UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."msg_chat"
    ADD CONSTRAINT "msg_chat_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."msg_chat"
    ADD CONSTRAINT "msg_chat_remetente_id_fkey" FOREIGN KEY ("remetente_id") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."usuarios_bloqueados"
    ADD CONSTRAINT "usuarios_bloqueados_bloqueado_id_fkey" FOREIGN KEY ("bloqueado_id") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."usuarios_bloqueados"
    ADD CONSTRAINT "usuarios_bloqueados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



CREATE POLICY "Permitir deleção de bloqueios" ON "public"."usuarios_bloqueados" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Permitir inserção de bloqueios" ON "public"."usuarios_bloqueados" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Permitir inserção durante registro" ON "public"."usuarios" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Permitir leitura de bloqueios" ON "public"."usuarios_bloqueados" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "usuario_id") OR ("auth"."uid"() = "bloqueado_id")));



CREATE POLICY "Usuários podem atualizar seus próprios dados" ON "public"."usuarios" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Usuários podem deletar suas próprias contas" ON "public"."usuarios" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Usuários podem ver outros usuários" ON "public"."usuarios" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usuarios_bloqueados" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."msg_chat";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."usuarios";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."usuarios_bloqueados";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."msg_chat" TO "anon";
GRANT ALL ON TABLE "public"."msg_chat" TO "authenticated";
GRANT ALL ON TABLE "public"."msg_chat" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios" TO "anon";
GRANT ALL ON TABLE "public"."usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios_bloqueados" TO "anon";
GRANT ALL ON TABLE "public"."usuarios_bloqueados" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios_bloqueados" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
