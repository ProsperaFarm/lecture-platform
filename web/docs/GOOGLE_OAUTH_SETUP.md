# Configuração do Google OAuth 2.0 - Prospera Academy

Este guia detalha o processo de configuração da autenticação via Google OAuth 2.0 para a plataforma Prospera Academy.

## Pré-requisitos

Antes de iniciar, você precisará de uma conta Google (Gmail) com acesso ao [Google Cloud Console](https://console.cloud.google.com/).

## Passo 1: Criar Projeto no Google Cloud

Acesse o Google Cloud Console e crie um novo projeto para a Prospera Academy.

**Instruções:**

1. Navegue até [console.cloud.google.com](https://console.cloud.google.com/)
2. No menu superior, clique no seletor de projetos
3. Clique em **"Novo Projeto"**
4. Preencha os campos:
   - **Nome do projeto**: `Prospera Academy`
   - **Organização**: (deixe em branco se não tiver)
5. Clique em **"Criar"**
6. Aguarde alguns segundos até o projeto ser criado
7. Selecione o projeto recém-criado no seletor de projetos

## Passo 2: Habilitar a Google+ API

A autenticação OAuth requer a API do Google+ (ou People API) para obter informações do perfil do usuário.

**Instruções:**

1. No menu lateral, vá em **"APIs e Serviços"** → **"Biblioteca"**
2. Na barra de busca, digite `Google+ API`
3. Clique no resultado **"Google+ API"**
4. Clique em **"Ativar"**
5. Aguarde a ativação (pode levar alguns segundos)

**Alternativa moderna:** Você também pode habilitar a **People API** em vez da Google+ API, que é a API recomendada atualmente.

## Passo 3: Configurar a Tela de Consentimento OAuth

Antes de criar as credenciais, você precisa configurar a tela de consentimento que os usuários verão ao fazer login.

**Instruções:**

1. No menu lateral, vá em **"APIs e Serviços"** → **"Tela de consentimento OAuth"**
2. Selecione **"Externo"** (a menos que você tenha um Google Workspace)
3. Clique em **"Criar"**
4. Preencha o formulário:

### Informações do Aplicativo

| Campo | Valor |
|-------|-------|
| **Nome do app** | Prospera Academy |
| **E-mail de suporte do usuário** | seu-email@prospera.farm |
| **Logotipo do app** | (opcional) Upload do logo da Prospera |
| **Domínio do app** | prospera.farm |
| **Link da Política de Privacidade** | https://prospera.farm/privacy |
| **Link dos Termos de Serviço** | https://prospera.farm/terms |

5. Clique em **"Salvar e Continuar"**

### Escopos (Scopes)

6. Na tela de escopos, clique em **"Adicionar ou Remover Escopos"**
7. Selecione os seguintes escopos:
   - `openid`
   - `email`
   - `profile`
8. Clique em **"Atualizar"**
9. Clique em **"Salvar e Continuar"**

### Usuários de Teste (Importante!)

10. Na seção **"Usuários de teste"**, clique em **"+ Adicionar Usuários"**
11. Digite os e-mails dos usuários que poderão fazer login durante o desenvolvimento:
    - `seu-email@gmail.com`
    - `outro-admin@prospera.farm`
12. Clique em **"Adicionar"**
13. Clique em **"Salvar e Continuar"**

**Nota:** Enquanto o app estiver em modo de teste, apenas os e-mails adicionados aqui poderão fazer login. Para liberar para todos os usuários Google, você precisará publicar o app (Passo 7).

14. Revise as informações e clique em **"Voltar ao Painel"**

## Passo 4: Criar Credenciais OAuth 2.0

Agora você criará o Client ID e Client Secret que a aplicação usará para autenticar.

**Instruções:**

1. No menu lateral, vá em **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"+ Criar Credenciais"** (no topo)
3. Selecione **"ID do cliente OAuth"**
4. Preencha o formulário:

| Campo | Valor |
|-------|-------|
| **Tipo de aplicativo** | Aplicativo da Web |
| **Nome** | Prospera Academy Web App |

5. Em **"Origens JavaScript autorizadas"**, clique em **"+ Adicionar URI"** e adicione:
   - `http://localhost:3000` (para desenvolvimento local)
   - `https://academy.prospera.farm` (para produção)

6. Em **"URIs de redirecionamento autorizados"**, clique em **"+ Adicionar URI"** e adicione:
   - `http://localhost:3000/api/auth/callback/google` (desenvolvimento)
   - `https://academy.prospera.farm/api/auth/callback/google` (produção)

7. Clique em **"Criar"**

8. Uma janela popup aparecerá com suas credenciais:
   - **ID do cliente**: `123456789-abc...apps.googleusercontent.com`
   - **Chave secreta do cliente**: `GOCSPX-...`

9. **IMPORTANTE**: Copie e salve essas credenciais em um local seguro (gerenciador de senhas).

10. Clique em **"OK"**

## Passo 5: Configurar Variáveis de Ambiente

Adicione as credenciais obtidas no passo anterior ao arquivo `.env` do projeto.

**Arquivo: `.env`**

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=123456789-abc...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Callback URL (deve corresponder ao configurado no Google Cloud Console)
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/callback/google

# Session Secret (gere uma string aleatória segura)
SESSION_SECRET=your-super-secret-random-string-here

# Database URL (MySQL)
DATABASE_URL=mysql://user:password@localhost:3306/prospera_academy

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:3000
```

**Gerar SESSION_SECRET:**

```bash
# No terminal, execute:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e cole no `.env`.

## Passo 6: Testar o Fluxo de Login

Com as credenciais configuradas, você pode testar o fluxo de autenticação.

**Instruções:**

1. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```

2. Acesse `http://localhost:3000` no navegador

3. Clique em **"Login"** ou **"Entrar com Google"**

4. Você será redirecionado para a tela de consentimento do Google

5. Faça login com um dos e-mails adicionados como **Usuário de Teste** (Passo 3)

6. Você verá um aviso: **"Google hasn't verified this app"**
   - Clique em **"Advanced"** (Avançado)
   - Clique em **"Go to Prospera Academy (unsafe)"**

7. Autorize as permissões solicitadas (email, profile)

8. Você será redirecionado de volta para `http://localhost:3000` autenticado

9. Verifique se o nome do usuário aparece no canto superior direito

## Passo 7: Publicar o App (Produção)

Para permitir que qualquer usuário Google faça login (não apenas os testadores), você precisa publicar o app.

**Instruções:**

1. No Google Cloud Console, vá em **"APIs e Serviços"** → **"Tela de consentimento OAuth"**
2. Clique em **"Publicar App"**
3. Leia o aviso e clique em **"Confirmar"**

**Nota:** Se o seu app solicitar escopos sensíveis (como acesso a Gmail, Drive, etc.), o Google pode exigir uma **revisão de segurança** que pode levar semanas. Para escopos básicos (`openid`, `email`, `profile`), a publicação é imediata.

4. Após a publicação, o status mudará para **"Em produção"**

5. Agora qualquer usuário com conta Google poderá fazer login na Prospera Academy

## Passo 8: Configurar Produção

Ao fazer deploy em produção, atualize as variáveis de ambiente no servidor.

**Exemplo para VPS (Ubuntu/Debian):**

```bash
# Edite o arquivo .env no servidor
nano /var/www/prospera-academy/.env
```

**Atualize as URLs:**

```env
GOOGLE_CALLBACK_URL=https://academy.prospera.farm/api/auth/callback/google
FRONTEND_URL=https://academy.prospera.farm
DATABASE_URL=mysql://user:password@db-server:3306/prospera_academy
```

**Reinicie o servidor:**

```bash
pm2 restart prospera-academy
# ou
systemctl restart prospera-academy
```

## Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa:** A URL de callback configurada no código não corresponde à URL configurada no Google Cloud Console.

**Solução:**
1. Verifique o `.env` → `GOOGLE_CALLBACK_URL`
2. Verifique o Google Cloud Console → **Credenciais** → **URIs de redirecionamento autorizados**
3. Certifique-se de que ambos são **exatamente iguais** (incluindo `http://` vs `https://`)

### Erro: "access_denied" ou "Error 403"

**Causa:** O e-mail do usuário não está na lista de testadores e o app não foi publicado.

**Solução:**
1. Adicione o e-mail em **Tela de consentimento OAuth** → **Usuários de teste**
2. Ou publique o app (Passo 7)

### Erro: "invalid_client"

**Causa:** O `GOOGLE_CLIENT_ID` ou `GOOGLE_CLIENT_SECRET` estão incorretos.

**Solução:**
1. Verifique o `.env` e compare com as credenciais no Google Cloud Console
2. Certifique-se de não ter espaços extras ou caracteres invisíveis

### Usuário faz login mas não aparece autenticado

**Causa:** Problema com a sessão (cookie não está sendo salvo).

**Solução:**
1. Verifique se `SESSION_SECRET` está definido no `.env`
2. Verifique se o navegador aceita cookies de terceiros
3. Em produção, certifique-se de que o domínio do cookie está correto

## Segurança

### Boas Práticas

1. **Nunca commite o `.env`**: Adicione `.env` ao `.gitignore`
2. **Rotacione secrets regularmente**: Gere um novo `SESSION_SECRET` a cada 3-6 meses
3. **Use HTTPS em produção**: O Google OAuth exige HTTPS para callbacks em produção
4. **Limite escopos**: Solicite apenas os escopos necessários (`openid`, `email`, `profile`)
5. **Monitore acessos**: Use Google Cloud Console para monitorar requisições OAuth

### Revogação de Credenciais

Se as credenciais forem comprometidas:

1. No Google Cloud Console, vá em **"Credenciais"**
2. Clique no ícone de **lixeira** ao lado do Client ID comprometido
3. Crie novas credenciais (Passo 4)
4. Atualize o `.env` no servidor
5. Reinicie a aplicação

## Referências

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
