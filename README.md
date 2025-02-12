# ChatApp

Um aplicativo de chat em tempo real desenvolvido com React e Supabase, oferecendo uma experiência de comunicação moderna e intuitiva.

## 🚀 Features

- **Autenticação Completa**

  - Login e registro de usuários
  - Proteção de rotas
  - Gerenciamento de sessão

- **Chat em Tempo Real**

  - Mensagens instantâneas
  - Indicador de status online/offline
  - Indicador de "última vez visto"
  - Contador de mensagens não lidas
  - Busca em mensagens

- **Tipos de Mensagens**

  - Texto
  - Áudio (com gravação)
  - Imagens
  - Vídeos
  - Documentos (PDF, DOC, XLS, etc.)

- **Gerenciamento de Mensagens**

  - Edição de mensagens
  - Exclusão de mensagens
  - Indicador de mensagens editadas/deletadas

- **Recursos de Usuário**

  - Perfil com avatar
  - Status personalizado
  - Bloqueio/desbloqueio de usuários

- **Interface**
  - Design responsivo
  - Modo claro/escuro
  - Preview de mídia
  - Emojis
  - Indicadores de digitação

## 🛠️ Tecnologias Principais

- **Frontend**

  - React
  - TypeScript
  - TailwindCSS
  - Vite

- **Backend/Infraestrutura**
  - Supabase (Banco de dados PostgreSQL)
  - Realtime subscriptions
  - Storage para arquivos
  - Autenticação

## 📦 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/chatapp.git
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

   - Renomeie o arquivo `.env.example` para `.env`
   - Preencha com suas credenciais do Supabase:

   ```bash
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

4. Configure o banco de dados:

   - Acesse seu projeto no Supabase
   - Vá para SQL Editor
   - Cole e execute o conteúdo do arquivo `schema.sql`

5. Inicie o projeto:

```bash
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

O projeto utiliza as seguintes tabelas principais:

- `usuarios`: Armazena informações dos usuários
- `msg_chat`: Mensagens do chat
- `usuarios_bloqueados`: Registro de usuários bloqueados

Para configurar o banco de dados, utilize o arquivo `schema.sql` fornecido.

## 🔧 Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o `schema.sql` no SQL Editor
3. Configure as políticas de segurança conforme necessário
4. Copie as credenciais (URL e Anon Key) para o arquivo `.env`

## 📝 Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as seguintes variáveis:

```bash
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 👤 Autor

- Nome: Dimitri Teixeira
- YouTube: [Link para canal](https://youtube.com/@programacaoweb)
- Aprenda Mais: [Curso Programador com IA](https://curso-ia.programacaoweb.com.br)
- Aprenda Mais: [Curso Programador Web Completo](https://curso.programacaoweb.com.br)

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob a Licença MIT - uma licença permissiva que permite:

- ✅ Uso comercial
- ✅ Modificação
- ✅ Distribuição
- ✅ Uso privado

Principais características:

- Permite que outros desenvolvedores usem, copiem, modifiquem, mesclem, publiquem, distribuam, sublicenciem e/ou vendam cópias do software
- A única exigência é que o aviso de copyright e a permissão sejam incluídos em todas as cópias ou partes substanciais do software
- O software é fornecido "como está", sem garantias de qualquer tipo

Para mais informações, veja o arquivo [LICENSE](LICENSE) para mais detalhes.
