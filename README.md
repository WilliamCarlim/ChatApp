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

1. Clone o repositório usando terminal de sua preferência:

```bash
git clone https://github.com/dimitriteixeira/ChatApp.git
```

2. Acesse a pasta do projeto clonado e instale as dependências:

```bash
npm install
```

## 🔧 Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)

   - Para isso você precisará criar uma conta ou fazer login
   - Crie uma nova organização e um projeto novo

2. Configure o banco de dados:

   - Acesse "SQL Editor" no menu lateral
   - Copie o conteúdo do arquivo `tabelas.sql` e cole no SQL Editor
   - Clique em "Run" para criar as tabelas e políticas de segurança

3. Configure os buckets de storage:

   - Acesse "Storage" no menu lateral
   - Crie os seguintes buckets manualmente clicando no botão "New Bucket". Serão os seguintes buckets (todos públicos):

     - `avatars`
     - `mensagens-imagens`
     - `mensagens-videos`
     - `mensagens-audio`
     - `mensagens-documentos`

   - Depois de criado os buckets vá novamente em "SQL Editor", copie e cole o conteúdo do arquivo `buckets.sql` para configurar as politicas do storage e clique em "Run".

> Nota: O arquivo `buckets.sql` já configura automaticamente:
>
> - Controle de acesso aos arquivos
> - Permissões de upload para usuários autenticados
> - Permissões de deleção apenas para o remetente original
> - Políticas específicas para cada tipo de mídia

4. Configure as credenciais:

   - No topo do projeto, clique em "Connect"
   - Na seção "App Frameworks", selecione em framework "React" e em "using" selecione Vite.
   - Copie a URL e a anon key

   ```bash
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

   - Cole no arquivo `.env.example` e renomeie para `.env`:

## ✉️ Configuração do Email de Confirmação de Cadastro

Opcional: Você pode configurar o formato do email para português. Este email é enviado no momento do cadastro do chat. Para isso faça o seguinte caminho :

- Authentication > Emails
- Troque o titulo e o conteudo do email de confirmação de cadastro para o desejado.

## 🚀 Hora de testar o projeto!!

Dentro do projeto rode no terminal o seguinte comando:

```bash
npm run dev
```

O projeto estará disponível no seu navegador na porta indicada no terminal.

Para testar o projeto cadastre duas contas diferentes. Depois abra cada conta em um navegador diferente. Se fizer no mesmo navegador vai bugar a aplicação por causa da autenticação.

Brinque com o projeto. Envie mensagens. Envie imagens. Envie vídeos. Envie áudios. Envie documentos. Veja se está tudo funcionando.

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
