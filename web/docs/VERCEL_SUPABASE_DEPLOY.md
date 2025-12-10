# Deploy no Vercel + Supabase PostgreSQL

Este guia detalha o processo completo para fazer deploy da **Prospera Academy** no Vercel com banco de dados PostgreSQL no Supabase.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- Conta no [Vercel](https://vercel.com) (gratuita)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Repositório Git com o código da plataforma
- Credenciais do Google OAuth configuradas (ver [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md))

---

## Parte 1: Configurar Banco de Dados no Supabase

### Passo 1: Criar Projeto no Supabase

Acesse o [dashboard do Supabase](https://app.supabase.com) e crie um novo projeto.

**Configurações recomendadas:**
- **Nome do Projeto**: `prospera-academy`
- **Database Password**: Gere uma senha forte e **salve em local seguro**
- **Região**: Escolha a mais próxima do Brasil (ex: `South America (São Paulo)`)
- **Pricing Plan**: Free (suficiente para começar)

Aguarde alguns minutos enquanto o Supabase provisiona o banco de dados.

### Passo 2: Obter Connection String

Após a criação do projeto:

1. No menu lateral, clique em **Settings** → **Database**
2. Role até a seção **Connection string**
3. Selecione a aba **URI**
4. Copie a connection string no formato:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. **Substitua `[YOUR-PASSWORD]`** pela senha que você definiu no Passo 1

**Exemplo:**
```
postgresql://postgres:minha_senha_forte@db.abcdefghijk.supabase.co:5432/postgres
```

### Passo 3: Aplicar Schema ao Banco de Dados

No terminal local, configure a variável de ambiente temporariamente:

```bash
export DATABASE_URL="postgresql://postgres:sua_senha@db.xxxxx.supabase.co:5432/postgres"
```

Execute o comando para criar as tabelas:

```bash
pnpm db:push
```

**Saída esperada:**
```
✓ Applying changes to database...
✓ Schema pushed successfully!
```

Verifique no Supabase:
1. Vá em **Table Editor** no menu lateral
2. Você deve ver as tabelas criadas: `users`, `courses`, `lessons`, `user_progress`, etc.

---

## Parte 2: Deploy no Vercel

### Passo 1: Conectar Repositório ao Vercel

Acesse o [dashboard do Vercel](https://vercel.com/dashboard) e clique em **Add New** → **Project**.

**Importar Repositório:**
1. Conecte sua conta GitHub/GitLab/Bitbucket
2. Selecione o repositório `ProsperaFarm/lecture-platform`
3. Configure o **Root Directory** para `web` (se o projeto estiver em subpasta)

### Passo 2: Configurar Build Settings

Na tela de configuração do projeto:

**Framework Preset:** Vite  
**Build Command:** `pnpm build`  
**Output Directory:** `dist/public`  
**Install Command:** `pnpm install`

### Passo 3: Configurar Variáveis de Ambiente

Clique em **Environment Variables** e adicione as seguintes variáveis:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `DATABASE_URL` | `postgresql://postgres:...` | Connection string do Supabase (Passo 1.2) |
| `JWT_SECRET` | (gerar aleatório) | Segredo para assinar tokens JWT |
| `OAUTH_SERVER_URL` | `https://api.manus.im` | URL do servidor OAuth (ou custom) |
| `OWNER_OPEN_ID` | (seu Google ID) | OpenID do administrador principal |
| `VITE_APP_TITLE` | `Prospera Academy` | Título da aplicação |
| `VITE_APP_LOGO` | (URL do logo) | URL do logo da Prospera Farm |

**Como gerar `JWT_SECRET`:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Como obter `OWNER_OPEN_ID`:**
1. Faça login na plataforma localmente
2. Verifique o console do navegador ou banco de dados para ver o `openId` gerado
3. Ou configure temporariamente como `"google-oauth2|123456"` e ajuste depois

### Passo 4: Deploy

Clique em **Deploy** e aguarde o processo de build.

**Tempo estimado:** 2-5 minutos

Após conclusão, você receberá uma URL de produção:
```
https://prospera-academy.vercel.app
```

---

## Parte 3: Configurar Domínio Customizado

### Passo 1: Adicionar Domínio no Vercel

No dashboard do projeto no Vercel:

1. Vá em **Settings** → **Domains**
2. Clique em **Add Domain**
3. Digite: `academy.prospera.farm`
4. Clique em **Add**

### Passo 2: Configurar DNS

O Vercel fornecerá instruções de configuração DNS. Você precisará adicionar um registro CNAME no seu provedor de DNS (ex: Cloudflare, Registro.br):

**Tipo:** CNAME  
**Nome:** `academy`  
**Destino:** `cname.vercel-dns.com`

**Tempo de propagação:** 5 minutos a 48 horas (geralmente < 1 hora)

### Passo 3: Verificar SSL

O Vercel gera automaticamente certificados SSL via Let's Encrypt. Aguarde alguns minutos e acesse:

```
https://academy.prospera.farm
```

---

## Parte 4: Atualizar Google OAuth

### Atualizar Redirect URIs

No [Google Cloud Console](https://console.cloud.google.com):

1. Vá em **APIs & Services** → **Credentials**
2. Selecione o OAuth 2.0 Client ID criado anteriormente
3. Em **Authorized redirect URIs**, adicione:
   ```
   https://academy.prospera.farm/api/auth/callback
   https://prospera-academy.vercel.app/api/auth/callback
   ```
4. Clique em **Save**

---

## Parte 5: Testar a Aplicação

### Checklist de Testes

- [ ] Acesse `https://academy.prospera.farm`
- [ ] Faça login com Google
- [ ] Verifique se o nome do usuário aparece no header
- [ ] Navegue até um curso e tente abrir uma aula
- [ ] Verifique se o vídeo carrega (se houver URL no JSON)
- [ ] Teste em dispositivos móveis

### Verificar Logs

Se houver erros:

1. No Vercel, vá em **Deployments** → Clique no deploy mais recente
2. Vá em **Functions** → Clique em uma função
3. Veja os logs em tempo real

---

## Parte 6: Manutenção e Atualizações

### Atualizar Código

Sempre que você fizer push para a branch principal do repositório, o Vercel fará deploy automático.

**Para testar antes de produção:**
1. Crie uma branch de feature (ex: `feature/nova-funcionalidade`)
2. Faça push para o GitHub
3. O Vercel criará um **Preview Deployment** com URL única
4. Teste a preview
5. Faça merge para `main` quando aprovado

### Atualizar Schema do Banco

Quando adicionar novas tabelas ou colunas:

```bash
export DATABASE_URL="postgresql://postgres:..."
pnpm db:push
```

**Importante:** O Drizzle `db:push` é ideal para desenvolvimento. Para produção com dados reais, considere usar migrações (`drizzle-kit generate` + `drizzle-kit migrate`).

### Monitoramento

**Supabase:**
- Dashboard → **Database** → **Logs**: Veja queries executadas
- **API** → **Logs**: Monitore uso da API

**Vercel:**
- **Analytics**: Veja tráfego e performance
- **Logs**: Depure erros em tempo real

---

## Solução de Problemas

### Erro: "Database connection failed"

**Causa:** Connection string incorreta ou banco de dados pausado (Supabase Free Tier pausa após 7 dias de inatividade).

**Solução:**
1. Verifique se a senha na `DATABASE_URL` está correta
2. No Supabase, vá em **Settings** → **General** e clique em **Resume Project** se estiver pausado

### Erro: "OAuth redirect mismatch"

**Causa:** Redirect URI não configurada no Google Cloud Console.

**Solução:**
1. Adicione a URL de produção nas **Authorized redirect URIs** (Parte 4)
2. Aguarde 1-2 minutos para propagação

### Erro 500 no login

**Causa:** `JWT_SECRET` ou `OWNER_OPEN_ID` não configurados.

**Solução:**
1. Verifique as variáveis de ambiente no Vercel (**Settings** → **Environment Variables**)
2. Redeploye o projeto após adicionar variáveis faltantes

---

## Custos Estimados

| Serviço | Plano | Custo Mensal |
|---------|-------|--------------|
| Vercel | Hobby (Free) | $0 |
| Supabase | Free Tier | $0 |
| **Total** | | **$0** |

**Limites do Free Tier:**
- **Vercel:** 100 GB de bandwidth, builds ilimitados
- **Supabase:** 500 MB de storage, 2 GB de transferência, pausa após 7 dias de inatividade

**Quando escalar:**
- **Vercel Pro** ($20/mês): Mais bandwidth, analytics avançados
- **Supabase Pro** ($25/mês): Sem pausa automática, backups diários, 8 GB de storage

---

## Próximos Passos

Após deploy bem-sucedido:

1. **Configurar Backups Automáticos**: No Supabase Pro, ative backups diários
2. **Monitorar Performance**: Use Vercel Analytics para identificar páginas lentas
3. **Adicionar Domínio de Email**: Configure `noreply@prospera.farm` para notificações
4. **Implementar CI/CD**: Adicione testes automatizados com GitHub Actions antes do deploy

---

## Recursos Adicionais

- [Documentação do Vercel](https://vercel.com/docs)
- [Documentação do Supabase](https://supabase.com/docs)
- [Drizzle ORM - PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

**Autor:** Manus AI  
**Data:** Dezembro 2025  
**Versão:** 1.0
