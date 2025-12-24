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

1. **Primeiro Login:**
   - Usuário faz login via Google OAuth
   - Sistema verifica se há um convite válido para o email
   - Se houver convite válido:
     - Usuário é criado com `authorized = true`
     - Convite é marcado como usado
   - Se não houver convite:
     - Usuário é criado com `authorized = false`
     - Usuário não pode acessar a plataforma até ser autorizado

2. **Verificações no Login:**
   - ✅ Usuário está autenticado? (tem sessão válida)
   - ✅ Usuário está bloqueado? (`blocked = true`)
   - ✅ Usuário está autorizado? (`authorized = true` OU `role = 'admin'`)

3. **Acesso Garantido:**
   - Admins (`role = 'admin'`) sempre têm acesso, independente de `authorized`
   - Usuários com `authorized = true` e `blocked = false` têm acesso
   - Usuários com convite válido são automaticamente autorizados no primeiro login

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

3. **Envio de Convites:**
   - Enviar convite por email para novos usuários
   - Convite cria registro na tabela `user_invites`
   - Usuário com email do convite é automaticamente autorizado no primeiro login

### Convites de Usuário

O sistema de convites permite que administradores pré-autorizem usuários antes que eles façam login:

1. **Criar Convite:**
   - Admin acessa `/admin`
   - Clica em "Enviar Convite"
   - Insere o email do usuário
   - Sistema cria registro em `user_invites` com token único

2. **Uso do Convite:**
   - Quando usuário com o email do convite faz login pela primeira vez
   - Sistema verifica se há convite válido (não usado, não expirado)
   - Se válido: usuário é criado com `authorized = true`
   - Convite é marcado como usado (`used = true`, `usedAt = now()`)

**Nota:** O envio de email de convites ainda não está implementado. Os convites são criados e o token é retornado na resposta da API. Você pode implementar o envio de email integrando com serviços como SendGrid, Resend ou AWS SES.

### Variáveis de Ambiente Relacionadas

```bash
# O openId do proprietário/primeiro admin (definido no .env)
OWNER_OPEN_ID=seu-open-id-aqui

# Outras variáveis necessárias para autenticação
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
JWT_SECRET=seu-jwt-secret-aqui
DATABASE_URL=postgresql://...
```

### Troubleshooting

#### Usuário não consegue acessar após login

1. Verificar se `authorized = true` no banco de dados
2. Verificar se `blocked = false` no banco de dados
3. Verificar se há convite válido para o email do usuário
4. Verificar logs do servidor para mensagens de erro

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
