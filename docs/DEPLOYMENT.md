# Guia de Deploy - Prospera Academy

Este documento detalha o processo de deploy da plataforma Prospera Academy em infraestrutura própria.

## Opções de Hospedagem

A Prospera Academy é uma aplicação Full-Stack que pode ser hospedada em diferentes ambientes:

| Opção | Custo | Complexidade | Escalabilidade | Recomendado para |
|-------|-------|--------------|----------------|------------------|
| **VPS (DigitalOcean, Linode)** | $5-20/mês | Média | Média | Produção pequena/média |
| **Cloud (AWS, GCP, Azure)** | Variável | Alta | Alta | Produção enterprise |
| **PaaS (Heroku, Railway)** | $7-25/mês | Baixa | Média | Protótipo/MVP |
| **Vercel + PlanetScale** | $0-20/mês | Baixa | Alta | Jamstack/Serverless |

## Pré-requisitos

Independente da opção escolhida, você precisará de:

- **Node.js 22+** instalado no servidor
- **MySQL 8.0+** (ou PostgreSQL 14+ com adaptações)
- **pnpm** instalado globalmente
- **Domínio próprio** (ex: `academy.prospera.farm`)
- **Certificado SSL** (Let's Encrypt via Certbot ou Cloudflare)

## Opção 1: Deploy em VPS (Ubuntu 22.04)

Este é o método mais comum e oferece controle total sobre a infraestrutura.

### Passo 1: Preparar o Servidor

```bash
# Conectar via SSH
ssh root@seu-servidor-ip

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Instalar Nginx (reverse proxy)
apt install -y nginx

# Instalar Certbot (SSL)
apt install -y certbot python3-certbot-nginx

# Instalar MySQL
apt install -y mysql-server
mysql_secure_installation
```

### Passo 2: Configurar MySQL

```bash
# Entrar no MySQL
mysql -u root -p

# Criar banco de dados
CREATE DATABASE prospera_academy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário
CREATE USER 'prospera'@'localhost' IDENTIFIED BY 'senha-segura-aqui';

# Conceder permissões
GRANT ALL PRIVILEGES ON prospera_academy.* TO 'prospera'@'localhost';
FLUSH PRIVILEGES;

# Sair
EXIT;
```

### Passo 3: Clonar e Configurar o Projeto

```bash
# Criar diretório para aplicação
mkdir -p /var/www
cd /var/www

# Clonar repositório
git clone https://github.com/ProsperaFarm/lecture-platform.git
cd lecture-platform/web

# Instalar dependências
pnpm install

# Criar arquivo .env
nano .env
```

**Conteúdo do `.env`:**

```env
# Database
DATABASE_URL=mysql://prospera:senha-segura-aqui@localhost:3306/prospera_academy

# Google OAuth (se usar direto)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=https://academy.prospera.farm/api/auth/callback/google

# Session
SESSION_SECRET=gere-uma-string-aleatoria-de-32-chars

# URLs
FRONTEND_URL=https://academy.prospera.farm
NODE_ENV=production
PORT=3000
```

### Passo 4: Build e Migração do Banco

```bash
# Executar migrações
pnpm db:push

# Build da aplicação
pnpm build

# Testar localmente
pnpm start
# Ctrl+C para parar
```

### Passo 5: Configurar PM2

```bash
# Iniciar aplicação com PM2
pm2 start dist/index.js --name prospera-academy

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Ver logs
pm2 logs prospera-academy

# Monitorar
pm2 monit
```

### Passo 6: Configurar Nginx

```bash
# Criar configuração do site
nano /etc/nginx/sites-available/prospera-academy
```

**Conteúdo:**

```nginx
server {
    listen 80;
    server_name academy.prospera.farm;

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
}
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/prospera-academy /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### Passo 7: Configurar SSL com Let's Encrypt

```bash
# Obter certificado
certbot --nginx -d academy.prospera.farm

# Certbot irá modificar automaticamente o arquivo do Nginx para HTTPS
# Selecione "2" para redirecionar HTTP para HTTPS

# Testar renovação automática
certbot renew --dry-run
```

### Passo 8: Configurar Firewall

```bash
# Permitir SSH, HTTP e HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Verificar status
ufw status
```

### Passo 9: Testar Produção

Acesse `https://academy.prospera.farm` no navegador e verifique:

- ✅ Site carrega corretamente
- ✅ HTTPS está ativo (cadeado verde)
- ✅ Login com Google funciona
- ✅ Vídeos reproduzem
- ✅ Navegação entre páginas funciona

## Opção 2: Deploy no Vercel + PlanetScale

Para uma solução serverless sem gerenciar servidores.

### Passo 1: Preparar Banco de Dados (PlanetScale)

1. Crie uma conta em [planetscale.com](https://planetscale.com/)
2. Crie um novo banco de dados: `prospera-academy`
3. Copie a connection string:
   ```
   mysql://user:pass@host.us-east-3.psdb.cloud/prospera-academy?sslaccept=strict
   ```

### Passo 2: Deploy no Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
cd /path/to/lecture-platform/web
vercel --prod
```

Siga as instruções no terminal:

- **Project name**: `prospera-academy`
- **Framework**: `Vite`
- **Build command**: `pnpm build`
- **Output directory**: `dist/public`

### Passo 3: Configurar Variáveis de Ambiente

No dashboard do Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Adicione:
   - `DATABASE_URL`: (connection string do PlanetScale)
   - `GOOGLE_CLIENT_ID`: (do Google Cloud Console)
   - `GOOGLE_CLIENT_SECRET`: (do Google Cloud Console)
   - `SESSION_SECRET`: (string aleatória)
   - `GOOGLE_CALLBACK_URL`: `https://prospera-academy.vercel.app/api/auth/callback/google`

3. Clique em **Redeploy** para aplicar

### Passo 4: Configurar Domínio Customizado

1. No Vercel, vá em **Settings** → **Domains**
2. Adicione `academy.prospera.farm`
3. Configure o DNS no seu provedor:
   - Tipo: `CNAME`
   - Nome: `academy`
   - Valor: `cname.vercel-dns.com`
4. Aguarde propagação (5-30 minutos)

## Opção 3: Deploy no Railway

Railway oferece deploy automático via Git com banco de dados incluso.

### Passo 1: Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app/)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Conecte o repositório `ProsperaFarm/lecture-platform`
5. Selecione a pasta `web` como root directory

### Passo 2: Adicionar MySQL

1. No projeto, clique em **"+ New"**
2. Selecione **"Database"** → **"MySQL"**
3. Aguarde provisionamento
4. Copie a `DATABASE_URL` gerada

### Passo 3: Configurar Variáveis

1. Clique no serviço `web`
2. Vá em **"Variables"**
3. Adicione:
   - `DATABASE_URL`: (auto-preenchido)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `NODE_ENV`: `production`

### Passo 4: Deploy

Railway faz deploy automático a cada push no GitHub. Para forçar redeploy:

1. Vá em **"Deployments"**
2. Clique em **"Redeploy"**

## Manutenção e Monitoramento

### Logs

**VPS (PM2):**
```bash
pm2 logs prospera-academy
pm2 logs prospera-academy --lines 100
```

**Vercel:**
- Dashboard → **Deployments** → Clique no deployment → **Logs**

**Railway:**
- Dashboard → **Deployments** → Clique no deployment → **View Logs**

### Backup do Banco de Dados

**MySQL (VPS):**
```bash
# Backup
mysqldump -u prospera -p prospera_academy > backup-$(date +%Y%m%d).sql

# Restaurar
mysql -u prospera -p prospera_academy < backup-20240110.sql
```

**PlanetScale:**
- Dashboard → **Backups** → **Create backup**

### Atualização da Aplicação

**VPS:**
```bash
cd /var/www/lecture-platform/web
git pull origin main
pnpm install
pnpm build
pm2 restart prospera-academy
```

**Vercel/Railway:**
- Push para GitHub → Deploy automático

### Monitoramento de Uptime

Recomendações:

- **UptimeRobot** (gratuito): Ping HTTP a cada 5 minutos
- **Better Uptime**: Monitoramento avançado com alertas
- **Grafana + Prometheus**: Para métricas detalhadas (avançado)

## Troubleshooting

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se MySQL está rodando: `systemctl status mysql`
2. Teste conexão: `mysql -u prospera -p prospera_academy`
3. Verifique `DATABASE_URL` no `.env`

### Erro: "Port 3000 already in use"

**Solução:**
```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 PID
```

### Site lento ou travando

**Solução:**
1. Verifique recursos: `htop`
2. Verifique logs: `pm2 logs`
3. Considere upgrade do servidor (mais RAM/CPU)
4. Implemente cache (Redis)

### SSL não funciona

**Solução:**
```bash
# Renovar certificado manualmente
certbot renew

# Verificar configuração Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

## Segurança

### Checklist de Segurança

- [ ] Firewall configurado (UFW ou similar)
- [ ] SSH com chave pública (desabilitar senha)
- [ ] Fail2ban instalado (proteção contra brute force)
- [ ] Backups automáticos diários
- [ ] SSL/TLS ativo (HTTPS)
- [ ] Variáveis de ambiente seguras (não commitadas)
- [ ] Dependências atualizadas (`pnpm audit`)
- [ ] Rate limiting nas APIs
- [ ] CORS configurado corretamente

### Hardening do Servidor

```bash
# Desabilitar login root via SSH
nano /etc/ssh/sshd_config
# PermitRootLogin no

# Instalar Fail2ban
apt install -y fail2ban
systemctl enable fail2ban

# Configurar firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## Custos Estimados

### VPS (DigitalOcean Droplet)

| Recurso | Especificação | Custo/mês |
|---------|---------------|-----------|
| Servidor | 2 vCPU, 4GB RAM, 80GB SSD | $24 |
| Domínio | .farm | $30/ano ($2.50/mês) |
| SSL | Let's Encrypt | Grátis |
| **Total** | | **~$27/mês** |

### Vercel + PlanetScale

| Recurso | Especificação | Custo/mês |
|---------|---------------|-----------|
| Vercel Pro | Serverless | $20 |
| PlanetScale | 10GB storage | $29 |
| Domínio | .farm | $2.50 |
| **Total** | | **~$52/mês** |

### Railway

| Recurso | Especificação | Custo/mês |
|---------|---------------|-----------|
| Web Service | 1GB RAM | $5 |
| MySQL | 1GB storage | $5 |
| **Total** | | **~$10/mês** |

## Próximos Passos

1. Escolha a opção de hospedagem
2. Siga o guia correspondente
3. Configure domínio e SSL
4. Teste em produção
5. Configure backups automáticos
6. Implemente monitoramento

## Referências

- [DigitalOcean Deployment Guide](https://www.digitalocean.com/community/tutorials)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)
