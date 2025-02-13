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
  - Preview de imagem
  - Emojis

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
git clone https://github.com/dimitriteixeira/ChatApp.git
```

2. Instale as dependências:

```bash
npm install
```

## 🔧 Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)

2. Configure o banco de dados:

   - Acesse "SQL Editor" no menu lateral
   - Execute primeiro o arquivo `tabelas.sql` para criar as tabelas e políticas de segurança

3. Configure os buckets de storage:

   - Acesse "Storage" no menu lateral
   - Crie os seguintes buckets:
     - `avatars`
     - `mensagens-imagens`
     - `mensagens-videos`
     - `mensagens-audio`
     - `mensagens-documentos`

   > Nota: O arquivo `buckets.sql` já configurou automaticamente:
   >
   > - Controle de acesso aos arquivos
   > - Permissões de upload para usuários autenticados
   > - Permissões de deleção apenas para o remetente original
   > - Políticas específicas para cada tipo de mídia

- Vá novamente em SQL Editor copie e cole o conteúdo do arquivo `buckets.sql` para configurar as politicas do storage.

4. Configure as credenciais:

   - No topo do projeto, clique em "Connect"
   - Na seção "App Frameworks", selecione em framework "React" e em "using" selecione Vite.
   - Copie a URL e a anon key
   - Cole no arquivo `.env.example` e renomeie para `.env`:

   ```bash
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

   > Opcional: Você pode configurar o formato de configuração de email de confirmação da hora do cadastro. Para isso faça o seguinte caminho :
   >
   > - Authentication > Emails
   > - Troque o conteúdo de "Confirm signup" para o desejado

5. Inicie o projeto:

```bash
npm run dev
```

## 🗄️ Estrutura do Back-end

O projeto utiliza as seguintes tabelas principais:

- `usuarios`: Armazena informações dos usuários
- `msg_chat`: Mensagens do chat
- `usuarios_bloqueados`: Registro de usuários bloqueados

Armazenamos mídias (imagens, vídeos, áudios, documentos) em buckets do Supabase Storage (limite de 1GB no plano gratuito):

- `avatars`
- `mensagens-imagens`
- `mensagens-videos`
- `mensagens-audio`
- `mensagens-documentos`

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
