# Prospera Academy - Plataforma Web

Plataforma de ensino à distância (LMS) da **Prospera Farm**, desenvolvida para oferecer acesso aos cursos de capacitação técnica (como Gestão de Fazendas de Gado de Leite) de forma intuitiva e profissional.

## 🚀 Stack Tecnológica

O projeto foi construído utilizando uma arquitetura moderna e performática de Single Page Application (SPA):

- **Framework**: [React 19](https://react.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Roteamento**: [Wouter](https://github.com/molefrog/wouter) (leve e minimalista)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind)
- **Player de Vídeo**: [ReactPlayer](https://github.com/cookpete/react-player) (customizado para privacidade)
- **Ícones**: [Lucide React](https://lucide.dev/)

## 🛠️ Como Rodar Localmente

### Pré-requisitos

- **Node.js**: Versão 18 ou superior
- **Gerenciador de Pacotes**: npm

### Passo a Passo

1. **Clone o repositório** (se ainda não o fez):
   ```bash
   git clone https://github.com/ProsperaFarm/lecture-platform.git
   cd lecture-platform/web
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure o banco de dados local (Docker)**:
   ```bash
   # Iniciar PostgreSQL em background
   docker-compose -f ./docker/dev/docker-compose-dev.yaml up -d
   
   # Aguardar inicialização (5-10 segundos)
   sleep 5
   
   # Aplicar schema do banco de dados
   npm run db:push
   ```

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**:
   Abra seu navegador em `http://localhost:3000` (ou a porta indicada no terminal).

## 📦 Estrutura do Projeto

```
web/
├── client/
│   ├── public/          # Assets estáticos (imagens, favicon)
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis (UI, Layout)
│   │   ├── contexts/    # Contextos React (Tema, Estado Global)
│   │   ├── hooks/       # Hooks customizados
│   │   ├── lib/         # Utilitários e dados estáticos (JSON)
│   │   ├── pages/       # Páginas da aplicação (Home, Lesson, etc.)
│   │   ├── types/       # Definições de tipos TypeScript
│   │   ├── App.tsx      # Configuração de rotas e providers
│   │   └── main.tsx     # Ponto de entrada da aplicação
│   └── index.html       # Template HTML principal
├── server/              # Servidor estático simples (opcional para prod)
├── docs/                # Documentação da arquitetura
└── package.json         # Dependências e scripts
```

## Iniciando o banco local
```
docker-compose -f ./docker/dev/docker-compose-dev.yaml up -d
```

## 📝 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento com Hot Module Replacement (HMR).
- `npm run build`: Compila o projeto para produção na pasta `dist`.
- `npm run check`: Executa a verificação de tipos do TypeScript.
- `npm run db:push`: Gera e aplica migrações do banco de dados (Drizzle).
- `npm run db:seed`: Popula o banco pela primeira vez com os dados do course-metadata.json.
- `npm run db:sync`: Sincroniza o banco com o JSON atualizado (após uploads do YouTube).
- `npm test`: Executa os testes unitários com Vitest.

## 🔐 Configuração de Admin e Sistema de Autorização

### Roles Disponíveis

A plataforma suporta duas roles:

- **`user`** (padrão): Usuário comum da plataforma
- **`admin`**: Administrador com acesso completo à área administrativa

### Como tornar um usuário administrador

Existem duas formas de tornar um usuário administrador:

#### 1. Via Variável de Ambiente (Recomendado para o primeiro admin)

O primeiro administrador deve ser configurado através da variável de ambiente `OWNER_OPEN_ID`:

1. Faça login na plataforma com sua conta Google
2. Após o login, verifique o `openId` do seu usuário no banco de dados (tabela `users`)
3. Configure a variável de ambiente `OWNER_OPEN_ID` no arquivo `.env` ou `.env.local`:

```bash
OWNER_OPEN_ID=seu-open-id-aqui
```

4. Quando o usuário com esse `openId` fizer login novamente, ele será automaticamente:
   - Promovido à role `admin`
   - Marcado como `authorized: true`
   - Sempre terá acesso à plataforma (não pode ser bloqueado)

**Nota:** O `openId` é um identificador único retornado pelo provedor OAuth (Google). Você pode encontrá-lo:
- No banco de dados na coluna `openId` da tabela `users`
- No JWT token após fazer login (campo `openId`)

#### 2. Via Banco de Dados (Para administradores adicionais)

Um administrador existente pode promover outros usuários diretamente no banco de dados:

```sql
UPDATE users SET role = 'admin' WHERE id = <user_id>;
```

**Importante:** 
- Apenas usuários com `role = 'admin'` podem acessar a área administrativa em `/admin`
- Admins sempre têm acesso à plataforma, mesmo se `authorized = false`
- Admins não podem ser bloqueados pela interface administrativa

### Sistema de Autorização

#### Fluxo de Autorização

**Importante:** Apenas usuários previamente cadastrados na plataforma podem acessá-la. Usuários não cadastrados receberão a mensagem "Acesso não autorizado".

1. **Pré-cadastro de Usuários (via Admin):**
   - Administrador acessa `/admin` e clica em "Incluir usuário"
   - Insere nome e email do usuário
   - Escolhe uma das opções:
     - **"Enviar convite e adicionar"**: Cadastra o usuário e envia email de convite
     - **"Apenas adicionar"**: Cadastra o usuário sem enviar email
   - Usuário é criado no banco com:
     - `authorized = true` (pode acessar a plataforma)
     - `role = 'user'`
     - `openId = 'pending-{email}'` (temporário, será atualizado no primeiro login)

2. **Primeiro Login:**
   - Usuário faz login via Google OAuth
   - Sistema verifica se o usuário existe no banco por email
   - Se usuário existe:
     - `openId` temporário é atualizado para o real do Google
     - Usuário pode acessar a plataforma normalmente
   - Se usuário não existe:
     - Acesso é negado com mensagem "Acesso não autorizado. Entre em contato com um administrador."

3. **Verificações no Login:**
   - ✅ Usuário está autenticado? (tem sessão válida)
   - ✅ Usuário existe no banco de dados?
   - ✅ Usuário está bloqueado? (`blocked = true`)
   - ✅ Usuário está autorizado? (`authorized = true` OU `role = 'admin'`)

4. **Acesso Garantido:**
   - Admins (`role = 'admin'`) sempre têm acesso, independente de `authorized`
   - Usuários com `authorized = true` e `blocked = false` têm acesso
   - Apenas usuários pré-cadastrados podem acessar a plataforma

### Área Administrativa

A área administrativa está disponível em `/admin` e pode ser acessada apenas por usuários com `role = 'admin'`.

#### Funcionalidades

1. **Lista de Usuários:**
   - Visualizar todos os usuários cadastrados
   - Ver informações: nome, email, status, primeiro acesso, último acesso, data de criação
   - Identificar administradores (ícone de escudo)

2. **Gerenciamento de Autorização:**
   - **Autorizar:** Marca usuário como `authorized = true` e `blocked = false`
   - **Bloquear:** Marca usuário como `blocked = true` e `authorized = false`
   - **Desbloquear:** Remove bloqueio e autoriza o usuário

3. **Incluir Novo Usuário:**
   - Admin acessa `/admin` e clica em "Incluir usuário"
   - Insere nome e email do usuário
   - Escolhe entre três ações:
     - **"Enviar convite e adicionar"**: Cadastra o usuário e envia email de convite (usa template HTML)
     - **"Apenas adicionar"**: Cadastra o usuário sem enviar email
     - **"Cancelar"**: Aborta o processo
   - Usuário é criado com `authorized = true` e pode acessar a plataforma imediatamente

### Template de Email de Convite

O sistema utiliza um template HTML para envio de convites por email:

- **Localização:** `web/server/templates/invite-email.html`
- **Variáveis do template:**
  - `{{USER_NAME}}`: Nome do usuário
  - `{{LOGIN_URL}}`: URL de login da plataforma

O template pode ser personalizado editando o arquivo HTML. O serviço de email está localizado em `web/server/services/email.ts`.

### Configuração de Envio de Emails

O sistema suporta dois provedores de email: **SMTP** e **Gmail API**. Escolha o provedor através da variável `EMAIL_PROVIDER`.

#### Opção 1: SMTP Genérico (Recomendado para início)

Configure um servidor SMTP qualquer (Gmail, Outlook, Mailgun, etc.):

```bash
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@prosperaacademy.com
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=seu-email@gmail.com
EMAIL_SMTP_PASSWORD=sua-senha-de-app
```

**Para Gmail com SMTP:**
1. Ative "Acesso a apps menos seguros" ou use uma "Senha de app" (https://myaccount.google.com/apppasswords)
2. Configure `EMAIL_SMTP_HOST=smtp.gmail.com` e `EMAIL_SMTP_PORT=587`

**Para outros provedores SMTP:**
- **Outlook/Hotmail**: `smtp-mail.outlook.com:587`
- **Mailgun**: Use as credenciais SMTP do seu domínio
- **SendGrid**: Use as credenciais SMTP do SendGrid
- **Amazon SES**: Configure SMTP credentials do SES

#### Opção 2: Gmail API (Recomendado para produção)

A Gmail API oferece maior confiabilidade e não requer senhas de app. Configure OAuth2:

```bash
EMAIL_PROVIDER=gmail_api
EMAIL_FROM=noreply@prosperaacademy.com
EMAIL_GMAIL_USER=seu-email@gmail.com
EMAIL_GMAIL_CLIENT_ID=seu-client-id
EMAIL_GMAIL_CLIENT_SECRET=seu-client-secret
EMAIL_GMAIL_REFRESH_TOKEN=seu-refresh-token
```

**Configuração da Gmail API:**

1. **Ative a Gmail API no Google Cloud Console:**
   - Acesse: https://console.cloud.google.com/
   - Selecione seu projeto (ou crie um novo)
   - Vá em "APIs & Services" > "Library"
   - Procure por "Gmail API" e clique em "Enable"

2. **Configure OAuth 2.0 Credentials:**
   - Vá em "APIs & Services" > "Credentials"
   - Se você já tem credenciais OAuth 2.0 (usadas para login), pode reutilizar as mesmas
   - Se não tiver, clique em "Create Credentials" > "OAuth client ID"
   - Selecione "Web application"
   - Adicione um "Authorized redirect URI":
     - `https://developers.google.com/oauthplayground`
   - Anote o **Client ID** e **Client Secret** gerados

3. **Gere o Refresh Token usando OAuth Playground:**

   **Passo a passo:**
   
   a. Acesse: https://developers.google.com/oauthplayground
   
   b. No canto superior direito, clique no ícone de engrenagem ⚙️
   
   c. Marque a opção "Use your own OAuth credentials"
   
   d. Cole seu **Client ID** e **Client Secret** nos campos correspondentes
   
   e. No painel esquerdo, encontre "Gmail API v1"
   
   f. Expanda e selecione o escopo: `https://www.googleapis.com/auth/gmail.send`
   
   g. Clique em "Authorize APIs"
   
   h. Faça login com a conta Gmail que você quer usar para enviar emails
   
   i. Revise as permissões solicitadas e clique em "Allow"
   
   j. Você será redirecionado de volta ao OAuth Playground
   
   k. Clique no botão "Exchange authorization code for tokens"
   
   l. Você verá tokens gerados. Copie o valor do campo **Refresh token**
   
   **Importante:** Guarde este refresh token com segurança! Ele não será exibido novamente no OAuth Playground.

4. **Configure as variáveis de ambiente:**
   ```bash
   EMAIL_PROVIDER=gmail_api
   EMAIL_GMAIL_USER=seu-email@gmail.com
   EMAIL_GMAIL_REFRESH_TOKEN=1//0xxxxxxxxxxxxx  # Token que você copiou
   # Se usar o mesmo projeto do OAuth de login, pode omitir estas:
   EMAIL_GMAIL_CLIENT_ID=seu-client-id.apps.googleusercontent.com
   EMAIL_GMAIL_CLIENT_SECRET=seu-client-secret
   ```

4. **Configure as variáveis:**
   ```bash
   EMAIL_PROVIDER=gmail_api
   EMAIL_GMAIL_USER=seu-email@gmail.com
   EMAIL_GMAIL_CLIENT_ID=seu-client-id.apps.googleusercontent.com
   EMAIL_GMAIL_CLIENT_SECRET=seu-client-secret
   EMAIL_GMAIL_REFRESH_TOKEN=seu-refresh-token-aqui
   ```

**Nota:** Se você já usa `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` para autenticação de usuários, pode reutilizar os mesmos valores. O sistema tentará usar essas variáveis se `EMAIL_GMAIL_CLIENT_ID` e `EMAIL_GMAIL_CLIENT_SECRET` não estiverem definidas.

#### Opção 3: Desenvolvimento (Logs apenas)

Se nenhuma configuração for fornecida ou se `EMAIL_PROVIDER` não estiver configurado, o sistema apenas registra os emails no console (útil para desenvolvimento).

#### Variáveis de Ambiente Completas

```bash
# Escolha do provider: 'smtp' ou 'gmail_api' (padrão: 'smtp')
EMAIL_PROVIDER=smtp

# Email do remetente
EMAIL_FROM=noreply@prosperaacademy.com

# Configuração SMTP (usado quando EMAIL_PROVIDER=smtp)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false  # true para porta 465, false para outras
EMAIL_SMTP_USER=seu-email@exemplo.com
EMAIL_SMTP_PASSWORD=sua-senha

# Configuração Gmail API (usado quando EMAIL_PROVIDER=gmail_api)
EMAIL_GMAIL_USER=seu-email@gmail.com
EMAIL_GMAIL_CLIENT_ID=seu-client-id  # Opcional: reutiliza GOOGLE_CLIENT_ID se não definido
EMAIL_GMAIL_CLIENT_SECRET=seu-client-secret  # Opcional: reutiliza GOOGLE_CLIENT_SECRET se não definido
EMAIL_GMAIL_REFRESH_TOKEN=seu-refresh-token

# URL do frontend (usado nos links dos emails)
FRONTEND_URL=http://localhost:3000
```

**Nota:** Em produção, use variáveis de ambiente seguras e nunca commite senhas ou tokens no código.

### Variáveis de Ambiente Relacionadas

```bash
# O openId do proprietário/primeiro admin (definido no .env)
OWNER_OPEN_ID=seu-open-id-aqui

# URL do frontend (usado nos emails de convite)
FRONTEND_URL=http://localhost:3000

# Outras variáveis necessárias para autenticação
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
JWT_SECRET=seu-jwt-secret-aqui
DATABASE_URL=postgresql://...
```

### Troubleshooting

#### Usuário não consegue acessar após login

1. Verificar se o usuário existe no banco de dados (por email)
2. Verificar se `authorized = true` no banco de dados
3. Verificar se `blocked = false` no banco de dados
4. Se o usuário não existe, ele precisa ser pré-cadastrado por um administrador em `/admin`
5. Verificar logs do servidor para mensagens de erro

#### Usuário não aparece como admin

1. Verificar se `role = 'admin'` no banco de dados
2. Verificar se `OWNER_OPEN_ID` está configurado corretamente (apenas para primeiro admin)
3. Fazer logout e login novamente após atualizar a role

#### Como encontrar o openId de um usuário

```sql
SELECT id, name, email, "openId", role FROM users WHERE email = 'usuario@exemplo.com';
```

Ou através da interface administrativa (se você já é admin), verificando os dados do usuário na lista.

## 📚 Documentação Adicional

- **[Guia de Arquitetura](./docs/ARCHITECTURE.md)**: Detalhes técnicos da solução Full-Stack.
- **[Opções de Autenticação](./docs/AUTH_OPTIONS.md)**: Manus OAuth vs Google OAuth direto.
- **[Setup do Google OAuth](./docs/GOOGLE_OAUTH_SETUP.md)**: Passo a passo completo para configurar Google Cloud Console.
- **[Guia de Deploy](./docs/DEPLOYMENT.md)**: Deploy em VPS, Vercel, Railway ou Cloud.
- **[Transição para Full-Stack](./docs/TRANSITION_TO_FULLSTACK.md)**: Razões para migrar de estático para Full-Stack.
- **[Privacidade de Vídeos](./VIDEO_PRIVACY_GUIDE.md)**: Limitações e alternativas para proteção de conteúdo.
