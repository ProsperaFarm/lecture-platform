# Deploy Automático com GitHub Actions + Vercel + Supabase

Este guia detalha como configurar CI/CD com GitHub Actions para deploy automático no Vercel com banco de dados Supabase.

## 📋 Pré-requisitos

- ✅ Repositório GitHub configurado
- ✅ Conta no [Vercel](https://vercel.com) (gratuita)
- ✅ Conta no [Supabase](https://supabase.com) (gratuita)
- ✅ Credenciais do Google OAuth configuradas

## 🚀 Configuração Inicial

### 1. Configurar Vercel

#### 1.1. Conectar Repositório ao Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **Add New** → **Project**
3. Conecte sua conta GitHub
4. Selecione o repositório `ProsperaFarm/lecture-platform`
5. Configure o **Root Directory** para `web`
6. Configure as seguintes opções:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `pnpm install`

#### 1.2. Obter Credenciais do Vercel

Após conectar o repositório, você precisa obter:

1. **VERCEL_TOKEN**: 
   - Vá em **Settings** → **Tokens**
   - Clique em **Create Token**
   - Nome: `github-actions-deploy`
   - Copie o token gerado

2. **VERCEL_ORG_ID** e **VERCEL_PROJECT_ID**:
   - Execute no terminal local:
   ```bash
   cd web
   npx vercel link
   ```
   - Isso criará um arquivo `.vercel/project.json` com os IDs
   - Ou encontre no URL do projeto Vercel: `https://vercel.com/[org-id]/[project-id]`

### 2. Configurar Secrets no GitHub

1. No repositório GitHub, vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret** e adicione:

| Secret Name | Valor | Descrição |
|-------------|-------|-----------|
| `VERCEL_TOKEN` | Token do Vercel | Token criado no passo 1.2 |
| `VERCEL_ORG_ID` | ID da organização | Obtido via `vercel link` ou URL |
| `VERCEL_PROJECT_ID` | ID do projeto | Obtido via `vercel link` ou URL |

### 3. Configurar Variáveis de Ambiente no Vercel

No dashboard do Vercel, vá em **Settings** → **Environment Variables** e adicione:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-seu-secret
GOOGLE_REDIRECT_URI=https://academy.prospera.farm/api/auth/google/callback

# Session
JWT_SECRET=gere-uma-string-aleatoria-de-64-chars

# URLs
FRONTEND_URL=https://academy.prospera.farm
NODE_ENV=production

# Owner/Admin
OWNER_OPEN_ID=seu-google-open-id

# Email Configuration
EMAIL_PROVIDER=gmail_api
EMAIL_FROM=noreply@prospera.farm
EMAIL_GMAIL_USER=seu-email@gmail.com
EMAIL_GMAIL_CLIENT_ID=seu-client-id.apps.googleusercontent.com
EMAIL_GMAIL_CLIENT_SECRET=GOCSPX-seu-secret
EMAIL_GMAIL_REFRESH_TOKEN=1//seu-refresh-token
```

**Importante**: Configure essas variáveis para todos os ambientes (Production, Preview, Development).

### 4. Configurar Supabase

#### 4.1. Criar Projeto no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Crie um novo projeto: **prospera-academy**
3. Escolha a região mais próxima (São Paulo para Brasil)
4. Aguarde o provisionamento

#### 4.2. Obter Connection String

1. Vá em **Settings** → **Database**
2. Role até **Connection string**
3. Selecione a aba **URI**
4. Copie a connection string
5. Substitua `[YOUR-PASSWORD]` pela senha do projeto

#### 4.3. Aplicar Schema do Banco

No terminal local:

```bash
cd web
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
pnpm db:push
```

### 5. Configurar Domínio Customizado

#### 5.1. No Vercel

1. Vá em **Settings** → **Domains**
2. Clique em **Add Domain**
3. Digite: `academy.prospera.farm`
4. Siga as instruções de configuração DNS

#### 5.2. Configurar DNS

Adicione um registro CNAME no seu provedor DNS:

```
Tipo: CNAME
Nome: academy
Valor: cname.vercel-dns.com
TTL: 3600
```

#### 5.3. Atualizar Google OAuth

No Google Cloud Console:

1. Vá em **APIs e Serviços** → **Credenciais**
2. Edite seu OAuth 2.0 Client ID
3. Adicione em **Authorized redirect URIs**:
   - `https://academy.prospera.farm/api/auth/google/callback`
4. Adicione em **Authorized JavaScript origins**:
   - `https://academy.prospera.farm`
5. Salve

## 🔄 Como Funciona o CI/CD

O workflow GitHub Actions está configurado em `.github/workflows/deploy.yml` e executa:

### Em Pull Requests:

1. **Test Job**: Executa type check (`pnpm check`)
2. **Deploy Preview**: Cria um deployment de preview no Vercel
3. **Comment PR**: Comenta na PR com a URL do preview

### Em Push para main/master:

1. **Test Job**: Executa type check
2. **Deploy Production**: Faz deploy para produção no Vercel

### Workflow de Deploy

```yaml
test → deploy-preview (PRs) / deploy-production (main)
```

## 📝 Estrutura dos Arquivos

```
.github/
  workflows/
    deploy.yml          # Workflow principal de deploy
    test.yml            # Workflow de testes (opcional)
web/
  vercel.json           # Configuração do Vercel
  package.json          # Scripts de build
```

## 🎯 Fluxo de Trabalho Recomendado

### Desenvolvimento

1. Crie uma branch de feature:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. Faça suas alterações e commit:
   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade"
   ```

3. Push e crie Pull Request:
   ```bash
   git push origin feature/nova-funcionalidade
   ```

4. GitHub Actions irá:
   - Executar testes
   - Criar preview deployment
   - Comentar na PR com a URL do preview

### Deploy para Produção

1. Faça merge da PR para `main`
2. GitHub Actions irá automaticamente:
   - Executar testes
   - Fazer deploy para produção
   - Atualizar `academy.prospera.farm`

## 🔍 Monitoramento

### Verificar Status dos Deployments

- **GitHub**: Vá em **Actions** no repositório para ver o status dos workflows
- **Vercel**: Dashboard do projeto → **Deployments** para ver histórico

### Logs

- **GitHub Actions**: Clique no workflow → Veja os logs de cada job
- **Vercel**: Dashboard → Deployments → Clique em um deployment → **Functions** → Veja logs

## 🛠️ Troubleshooting

### Erro: "VERCEL_TOKEN not found"

**Solução**: Verifique se o secret `VERCEL_TOKEN` está configurado em **Settings** → **Secrets and variables** → **Actions**

### Erro: "Vercel project not found"

**Solução**: 
1. Execute `npx vercel link` localmente na pasta `web`
2. Isso criará `.vercel/project.json`
3. Commit esse arquivo ou configure `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` como secrets

### Erro: "Build failed"

**Solução**:
1. Verifique os logs no GitHub Actions
2. Teste localmente: `pnpm build`
3. Verifique se todas as variáveis de ambiente estão configuradas no Vercel

### Preview não aparece na PR

**Solução**: 
- Verifique se o workflow está sendo executado (vá em **Actions**)
- Verifique se o step "Comment PR" não teve erros
- O comentário pode levar alguns minutos para aparecer

## 📚 Recursos Adicionais

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Supabase Documentation](https://supabase.com/docs)
- [Workflow do Vercel com GitHub Actions](https://vercel.com/docs/concepts/git/github#github-actions)

## ✅ Checklist Final

Antes de considerar o CI/CD completo:

- [ ] Repositório conectado ao Vercel
- [ ] Secrets configurados no GitHub (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Supabase configurado e schema aplicado
- [ ] Domínio customizado configurado (academy.prospera.farm)
- [ ] Google OAuth atualizado com URLs de produção
- [ ] Workflow testado com uma PR
- [ ] Deploy de produção testado

---

**Nota**: O Vercel também oferece integração nativa com GitHub que faz deploy automático sem GitHub Actions. Se preferir usar apenas a integração nativa do Vercel, você pode desabilitar o workflow GitHub Actions. O workflow oferece mais controle (testes antes do deploy, preview deployments, etc.).

