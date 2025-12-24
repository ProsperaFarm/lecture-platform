# Guia Completo: Configuração da Gmail API para Envio de Emails

Este guia explica passo a passo como configurar a Gmail API para envio de emails de convite na plataforma.

## Pré-requisitos

- Conta Google (Gmail)
- Acesso ao Google Cloud Console
- Projeto no Google Cloud (pode reutilizar o projeto do OAuth de login)

## Passo 1: Ativar a Gmail API

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto (ou crie um novo)
3. No menu lateral, vá em **APIs & Services** > **Library**
4. Procure por "Gmail API"
5. Clique em **Gmail API** e depois em **Enable**

## Passo 2: Configurar Credenciais OAuth 2.0

### Se você já tem credenciais OAuth 2.0 (usadas para login):

Você pode reutilizar as mesmas credenciais! Apenas certifique-se de que o redirect URI do OAuth Playground está adicionado:

1. Vá em **APIs & Services** > **Credentials**
2. Clique no seu **OAuth 2.0 Client ID**
3. Em **Authorized redirect URIs**, adicione:
   - `https://developers.google.com/oauthplayground`
4. Clique em **Save**
5. Anote seu **Client ID** e **Client Secret**

### Se você não tem credenciais OAuth 2.0:

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth client ID**
3. Se solicitado, configure a tela de consentimento OAuth:
   - Escolha "External" (se for empresa, pode escolher "Internal")
   - Preencha as informações básicas
   - Clique em **Save and Continue**
   - Adicione seu email como test user
   - Clique em **Save and Continue**
4. Selecione **Application type**: "Web application"
5. Dê um nome para suas credenciais (ex: "Gmail API Email Sender")
6. Em **Authorized redirect URIs**, adicione:
   - `https://developers.google.com/oauthplayground`
7. Clique em **Create**
8. **Copie e guarde** o **Client ID** e **Client Secret** exibidos

## Passo 3: Gerar o Refresh Token

O refresh token é necessário para a aplicação obter access tokens automaticamente. 

⚠️ **IMPORTANTE:** O refresh token DEVE ser gerado usando o mesmo Client ID e Client Secret que você vai configurar nas variáveis de ambiente. Se você usar credenciais diferentes, receberá o erro `unauthorized_client`.

Para gerá-lo:

1. Acesse o [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)

2. **Configure suas credenciais:**
   - No canto superior direito, clique no ícone de **engrenagem** ⚙️
   - Marque a opção **"Use your own OAuth credentials"**
   - Cole seu **Client ID** no campo "OAuth Client ID"
   - Cole seu **Client Secret** no campo "OAuth Client secret"
   - Clique em **Close**

3. **Selecione o escopo necessário:**
   - No painel esquerdo, encontre e expanda **"Gmail API v1"**
   - Procure e selecione: `https://www.googleapis.com/auth/gmail.send`
   - Este escopo permite apenas envio de emails (não leitura ou outras operações)

4. **Autorize a aplicação:**
   - Clique no botão **"Authorize APIs"** no canto inferior direito
   - Faça login com a conta Gmail que você quer usar para enviar emails
   - Revise as permissões solicitadas
   - Clique em **"Allow"** para autorizar

5. **Obtenha os tokens:**
   - Você será redirecionado de volta ao OAuth Playground
   - Você verá um código de autorização no campo "Authorization code"
   - Clique no botão **"Exchange authorization code for tokens"**
   - Você verá os tokens gerados:
     - **Access token** (expira em algumas horas)
     - **Refresh token** (este é o que você precisa!)

6. **Copie o Refresh Token:**
   - Localize o campo **"Refresh token"** na resposta
   - **Copie o valor completo** (começa com `1//` ou `1/`)
   - **Guarde este token com segurança!** Ele não será exibido novamente
   - Se você perder, terá que repetir este processo

⚠️ **CRÍTICO:** Anote também o **Client ID** e **Client Secret** que você usou no OAuth Playground! Você precisará usar **exatamente as mesmas credenciais** nas variáveis de ambiente `EMAIL_GMAIL_CLIENT_ID` e `EMAIL_GMAIL_CLIENT_SECRET`. Se usar credenciais diferentes, o refresh token não funcionará.

## Passo 4: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Escolha Gmail API como provedor
EMAIL_PROVIDER=gmail_api

# Email da conta que enviará os emails
EMAIL_GMAIL_USER=seu-email@gmail.com

# Refresh token gerado no passo anterior
EMAIL_GMAIL_REFRESH_TOKEN=1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opcional: se usar o mesmo projeto do OAuth de login, 
# estas variáveis serão reutilizadas automaticamente
# Caso contrário, defina-as:
EMAIL_GMAIL_CLIENT_ID=seu-client-id.apps.googleusercontent.com
EMAIL_GMAIL_CLIENT_SECRET=seu-client-secret
```

**Dica:** Se você já usa `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` para autenticação de usuários e for o mesmo projeto, você pode omitir `EMAIL_GMAIL_CLIENT_ID` e `EMAIL_GMAIL_CLIENT_SECRET`. O sistema reutilizará automaticamente as variáveis existentes.

## Passo 5: Testar

1. Reinicie o servidor para carregar as novas variáveis de ambiente
2. Tente enviar um convite através da área administrativa (`/admin`)
3. Verifique os logs do servidor para confirmar que o email foi enviado
4. Verifique a caixa de entrada do destinatário

## Solução de Problemas

### Erro: "unauthorized_client" ou "Invalid refresh token"

Este é o erro mais comum e geralmente acontece quando:

- **O refresh token foi gerado com Client ID/Secret diferentes dos configurados**
  - **Solução:** Use EXATAMENTE o mesmo Client ID e Client Secret que você usou no OAuth Playground para gerar o refresh token
  - Se você gerou o token com credenciais A, mas configurou credenciais B no `.env`, isso causará o erro
  
- O refresh token está incompleto (falta o `1//` no início)
  - Certifique-se de copiar o refresh token completo
  
- Há espaços ou quebras de linha extras no token
  - Verifique que não há espaços antes ou depois do valor no `.env`
  
- O refresh token foi revogado
  - Gere um novo refresh token seguindo o Passo 3

**Como verificar:**
1. Confirme qual Client ID você usou no OAuth Playground (passo 2c)
2. Compare com o Client ID configurado em `EMAIL_GMAIL_CLIENT_ID` (ou `GOOGLE_CLIENT_ID`)
3. Eles devem ser IDÊNTICOS

### Erro: "Invalid client credentials"

- Verifique se o Client ID e Client Secret estão corretos
- Certifique-se de que não há espaços extras ou caracteres especiais
- Certifique-se de que o redirect URI `https://developers.google.com/oauthplayground` está adicionado nas credenciais OAuth

### Erro: "Insufficient permissions"

- Verifique se a Gmail API está ativada no projeto
- Certifique-se de que selecionou o escopo correto: `https://www.googleapis.com/auth/gmail.send`

### Refresh token não aparece

- Certifique-se de marcar "Use your own OAuth credentials" no OAuth Playground
- Verifique se o redirect URI está configurado corretamente
- Tente fazer logout e login novamente no OAuth Playground

## Segurança

⚠️ **Importante:**
- Nunca commite o refresh token no código ou repositório Git
- Use variáveis de ambiente ou um gerenciador de secrets
- O refresh token permite acesso à conta Gmail - trate-o como uma senha
- Se o token for comprometido, revogue as credenciais OAuth no Google Cloud Console e gere novas

## Recursos Adicionais

- [Documentação da Gmail API](https://developers.google.com/gmail/api)
- [Guia de Autenticação OAuth 2.0 do Google](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)

