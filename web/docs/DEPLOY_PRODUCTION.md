# Guia de Deploy em Produção - academy.prospera.farm

Este guia detalha o processo completo para publicar a Prospera Academy em produção no domínio `academy.prospera.farm`.

## 📋 Pré-requisitos

Antes de começar, você precisa de:

- ✅ Acesso ao servidor/provedor de hospedagem (VPS, Railway, Vercel, etc.)
- ✅ Conta no Google Cloud Console com OAuth configurado
- ✅ Banco de dados (PostgreSQL) configurado e acessível
- ✅ Domínio `prospera.farm` configurado
- ✅ Acesso ao painel DNS para criar o subdomínio `academy`

## 🔐 Passo 1: Atualizar Google Cloud Console

### 1.1. Adicionar URIs de Produção

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs e Serviços** → **Credenciais**
3. Clique no seu **OAuth 2.0 Client ID**
4. Em **"Origens JavaScript autorizadas"**, adicione:
   - `https://academy.prospera.farm`

5. Em **"URIs de redirecionamento autorizados"**, adicione:
   - `https://academy.prospera.farm/api/auth/google/callback`

6. Clique em **Salvar**

### 1.2. Publicar o App (Opcional)

Se o app ainda estiver em modo de teste:

1. Vá em **APIs e Serviços** → **Tela de consentimento OAuth**
2. Clique em **Publicar app**
3. Confirme a publicação

> ⚠️ **Importante**: Se você está usando escopos sensíveis (como Gmail API), pode ser necessário passar por uma revisão de segurança. Para escopos básicos (`openid`, `email`, `profile`), a publicação é imediata.

## 🌐 Passo 2: Configurar DNS

Configure o subdomínio `academy` apontando para seu servidor:

### Opção A: Se usar VPS/Cloud (IP estático)

Crie um registro **A** no seu DNS:

```
Tipo: A
Nome: academy
Valor: [IP do seu servidor]
TTL: 3600 (ou padrão)
```

### Opção B: Se usar Railway/Vercel/Cloudflare

Siga as instruções de DNS do provedor:

- **Railway**: Use o domínio customizado do painel
- **Vercel**: Configure via Settings → Domains
- **Cloudflare**: Use o proxy CNAME do Cloudflare

Exemplo para CNAME:

```
Tipo: CNAME
Nome: academy
Valor: [subdomínio do provedor]
TTL: 3600
```

## ⚙️ Passo 3: Escolher Provedor de Hospedagem

Escolha uma das opções abaixo conforme seu orçamento e necessidades:

### Opção A: VPS (DigitalOcean, Linode, Hetzner)

**Vantagens**: Controle total, custo fixo baixo (~$5-20/mês)

📖 **Guia completo**: Veja `docs/DEPLOYMENT.md` - Opção 1

**Resumo rápido:**

```bash
# 1. Instalar Node.js, PostgreSQL, Nginx, PM2
# 2. Clonar repositório
git clone https://github.com/ProsperaFarm/lecture-platform.git
cd lecture-platform/web

# 3. Configurar .env (veja abaixo)
# 4. Instalar e buildar
pnpm install
pnpm build

# 5. Iniciar com PM2
pm2 start dist/index.js --name prospera-academy
pm2 startup
pm2 save

# 6. Configurar Nginx (veja abaixo)
# 7. Configurar SSL com Certbot
certbot --nginx -d academy.prospera.farm
```

### Opção B: Railway

**Vantagens**: Deploy automático via Git, fácil configuração (~$5-20/mês)

📖 **Guia completo**: Veja `docs/DEPLOYMENT.md` - Opção 3

**Resumo rápido:**

1. Conecte seu repositório GitHub no Railway
2. Configure variáveis de ambiente (veja abaixo)
3. Railway faz deploy automático
4. Configure domínio customizado no painel

### Opção C: Vercel + Banco Separado

**Vantagens**: Serverless, escalável (~$20-50/mês com banco)

📖 **Guia completo**: Veja `docs/VERCEL_SUPABASE_DEPLOY.md`

**Resumo rápido:**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
cd web
vercel --prod
```

## 🔑 Passo 4: Configurar Variáveis de Ambiente

Crie um arquivo `.env` no servidor (ou configure no painel do provedor) com:

```env
# Ambiente
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://usuario:senha@host:5432/prospera_academy

# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-seu-secret
GOOGLE_REDIRECT_URI=https://academy.prospera.farm/api/auth/google/callback

# Session
JWT_SECRET=gere-uma-string-aleatoria-de-64-chars

# URLs
FRONTEND_URL=https://academy.prospera.farm

# Owner/Admin (OpenID do primeiro administrador)
OWNER_OPEN_ID=seu-google-open-id-aqui

# Email Configuration
EMAIL_PROVIDER=gmail_api
EMAIL_FROM=noreply@prospera.farm
EMAIL_GMAIL_USER=seu-email@gmail.com
EMAIL_GMAIL_CLIENT_ID=seu-client-id.apps.googleusercontent.com
EMAIL_GMAIL_CLIENT_SECRET=GOCSPX-seu-secret
EMAIL_GMAIL_REFRESH_TOKEN=1//seu-refresh-token-aqui
```

### Gerar JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🔒 Passo 5: Configurar SSL/HTTPS

### Se usar VPS com Nginx

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d academy.prospera.farm

# Certbot configurará automaticamente o Nginx para HTTPS
# Teste renovação automática
sudo certbot renew --dry-run
```

### Se usar Railway/Vercel

SSL é configurado automaticamente quando você adiciona um domínio customizado.

## 🌐 Passo 6: Configurar Nginx (apenas VPS)

Crie o arquivo `/etc/nginx/sites-available/prospera-academy`:

```nginx
server {
    listen 80;
    server_name academy.prospera.farm;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name academy.prospera.farm;

    # Certificados SSL (gerados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/academy.prospera.farm/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/academy.prospera.farm/privkey.pem;

    # Configurações SSL recomendadas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Timeout para uploads grandes (vídeos)
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
}
```

Ative o site:

```bash
sudo ln -s /etc/nginx/sites-available/prospera-academy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🗄️ Passo 7: Configurar Banco de Dados

### Se usar PostgreSQL local/VPS

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE prospera_academy;

# Criar usuário
CREATE USER prospera WITH ENCRYPTED PASSWORD 'senha-segura-aqui';

# Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE prospera_academy TO prospera;

# Sair
\q
```

### Se usar serviço gerenciado (Supabase, Railway DB, etc.)

Copie a connection string fornecida pelo serviço e use no `DATABASE_URL`.

### Aplicar Schema

```bash
cd web
pnpm db:push
```

## 🚀 Passo 8: Deploy da Aplicação

### Se usar VPS

```bash
cd /var/www/lecture-platform/web

# Atualizar código
git pull origin main

# Instalar dependências
pnpm install

# Build
pnpm build

# Reiniciar aplicação
pm2 restart prospera-academy

# Ver logs
pm2 logs prospera-academy
```

### Se usar Railway/Vercel

O deploy é automático quando você faz push no GitHub. Para forçar redeploy, use o painel do provedor.

## ✅ Passo 9: Verificar Deploy

Acesse `https://academy.prospera.farm` e verifique:

- [ ] Site carrega corretamente
- [ ] HTTPS está ativo (cadeado verde no navegador)
- [ ] Login com Google funciona
- [ ] Redirecionamento após login funciona
- [ ] Vídeos reproduzem corretamente
- [ ] Navegação entre páginas funciona
- [ ] Console do navegador não mostra erros

## 🔧 Passo 10: Configurações Adicionais

### Firewall (VPS)

```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Backup do Banco de Dados

Configure backups automáticos:

```bash
# Criar script de backup
cat > /usr/local/bin/backup-prospera-academy.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/prospera-academy"
mkdir -p $BACKUP_DIR
pg_dump -U prospera prospera_academy > $BACKUP_DIR/backup_$DATE.sql
# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-prospera-academy.sh

# Adicionar ao crontab (backup diário às 2h da manhã)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-prospera-academy.sh") | crontab -
```

### Monitoramento

Considere usar:
- **UptimeRobot** (gratuito): Monitoramento de uptime
- **PM2 Plus** (gratuito): Monitoramento de processos
- **Sentry**: Monitoramento de erros (opcional)

## 📝 Checklist Final

Antes de considerar o deploy completo:

- [ ] Google Cloud Console configurado com URIs de produção
- [ ] DNS configurado e propagado (verifique com `dig academy.prospera.farm`)
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Banco de dados criado e schema aplicado
- [ ] SSL/HTTPS configurado e funcionando
- [ ] Aplicação rodando e acessível
- [ ] Login com Google funcionando
- [ ] Testado em diferentes navegadores
- [ ] Backups configurados
- [ ] Monitoramento configurado (opcional)

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Solução**: Verifique se `GOOGLE_REDIRECT_URI` no `.env` corresponde exatamente ao configurado no Google Cloud Console.

### Erro: "Cannot connect to database"

**Solução**: 
1. Verifique se o PostgreSQL está rodando: `sudo systemctl status postgresql`
2. Teste conexão: `psql -U prospera -d prospera_academy`
3. Verifique `DATABASE_URL` no `.env`

### Site não carrega / 502 Bad Gateway

**Solução**:
1. Verifique se a aplicação está rodando: `pm2 status`
2. Verifique logs: `pm2 logs prospera-academy`
3. Verifique se Nginx está rodando: `sudo systemctl status nginx`
4. Verifique configuração Nginx: `sudo nginx -t`

### SSL não funciona

**Solução**:
1. Verifique se Certbot configurou corretamente: `sudo certbot certificates`
2. Verifique configuração Nginx: `sudo nginx -t`
3. Renove certificado: `sudo certbot renew`

## 📚 Referências

- [Guia completo de Deploy](./DEPLOYMENT.md)
- [Configuração Google OAuth](./GOOGLE_OAUTH_SETUP.md)
- [Configuração Gmail API](./GMAIL_API_SETUP.md)

## 🆘 Suporte

Se encontrar problemas, verifique:
1. Logs da aplicação (`pm2 logs` ou painel do provedor)
2. Logs do Nginx (`sudo tail -f /var/log/nginx/error.log`)
3. Console do navegador (F12 → Console)
4. Documentação do provedor de hospedagem

