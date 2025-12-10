# Guia de Upload de Vídeos para YouTube

Este guia explica como configurar e usar o script `youtube_uploader.py` para fazer upload automático dos vídeos do curso para o YouTube.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [Como Usar](#como-usar)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Solução de Problemas](#solução-de-problemas)
6. [Automação com Cron](#automação-com-cron)

---

## 🔧 Pré-requisitos

### 1. Python 3.7+

Verifique sua versão do Python:

```bash
python3 --version
```

### 2. Dependências Python

Instale as bibliotecas necessárias:

```bash
pip3 install -r requirements-uploader.txt
```

Ou manualmente:

```bash
pip3 install google-api-python-client google-auth-oauthlib google-auth-httplib2
```

### 3. Vídeos Locais

Certifique-se de que os arquivos de vídeo estão acessíveis localmente. O script pode buscar:
- No diretório raiz especificado
- Em subpastas organizadas por módulo
- Recursivamente em toda a estrutura

---

## 🔐 Configuração Inicial

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto (ou selecione um existente)
3. Dê um nome ao projeto (ex: "Lecture Platform Uploader")

### Passo 2: Ativar YouTube Data API v3

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Busque por "YouTube Data API v3"
3. Clique em **Enable** (Ativar)

### Passo 3: Criar Credenciais OAuth 2.0

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Se solicitado, configure a **OAuth consent screen**:
   - User Type: **External**
   - App name: "Lecture Platform Uploader"
   - User support email: seu email
   - Developer contact: seu email
   - Clique em **Save and Continue**
   - Em **Scopes**, clique em **Add or Remove Scopes** e adicione:
     - `https://www.googleapis.com/auth/youtube.upload`
   - Em **Test users**, adicione seu email do Google/YouTube
   - Clique em **Save and Continue**

4. Volte para **Credentials** e crie o OAuth client ID:
   - Application type: **Desktop app**
   - Name: "YouTube Uploader CLI"
   - Clique em **Create**

5. **Baixe o arquivo JSON** de credenciais
6. Renomeie o arquivo para `client_secret.json`
7. Coloque o arquivo na pasta do projeto (mesma pasta do script)

### Passo 4: Estrutura de Arquivos

Certifique-se de que você tem:

```
lecture-platform/
├── youtube_uploader.py          # Script principal
├── course-metadata.json         # Metadados dos vídeos
├── client_secret.json           # Credenciais OAuth (você cria)
├── requirements-uploader.txt    # Dependências Python
└── YOUTUBE_UPLOAD_GUIDE.md      # Este guia
```

---

## 🚀 Como Usar

### Sintaxe Básica

```bash
python3 youtube_uploader.py --videos-dir /caminho/para/videos [opções]
```

### Parâmetros

| Parâmetro | Obrigatório | Descrição | Padrão |
|-----------|-------------|-----------|--------|
| `--videos-dir` | ✅ Sim | Diretório contendo os arquivos de vídeo | - |
| `--max-uploads` | ❌ Não | Número máximo de vídeos para enviar | Todos |
| `--delay` | ❌ Não | Segundos de espera entre uploads | 5 |
| `--credentials` | ❌ Não | Arquivo de credenciais OAuth 2.0 | `client_secret.json` |

### Primeira Execução

Na primeira vez que você executar o script, ele abrirá uma janela do navegador para autenticação:

1. Faça login com sua conta do Google/YouTube
2. Autorize o aplicativo a fazer upload de vídeos
3. O token será salvo em `youtube_token.json` para uso futuro

**Importante**: O token é salvo localmente e reutilizado. Você só precisa fazer login uma vez.

---

## 💡 Exemplos Práticos

### Exemplo 1: Upload de 5 vídeos (teste inicial)

```bash
python3 youtube_uploader.py --videos-dir /home/user/videos --max-uploads 5
```

**Use este comando para testar o script pela primeira vez.**

### Exemplo 2: Upload de 20 vídeos por dia

```bash
python3 youtube_uploader.py --videos-dir /home/user/videos --max-uploads 20
```

**Ideal para processar gradualmente sem atingir limites da API.**

### Exemplo 3: Upload de todos os vídeos pendentes

```bash
python3 youtube_uploader.py --videos-dir /home/user/videos
```

**Cuidado**: Pode levar muito tempo e atingir limites de quota da API.

### Exemplo 4: Com delay maior entre uploads

```bash
python3 youtube_uploader.py --videos-dir /home/user/videos --max-uploads 10 --delay 15
```

**Útil para evitar rate limiting em contas novas.**

### Exemplo 5: Vídeos em subpastas organizadas

```bash
python3 youtube_uploader.py --videos-dir /home/user/videos/curso-rehagro --max-uploads 10
```

O script busca recursivamente em todas as subpastas.

---

## 🔄 Como Funciona

### 1. Autenticação

- Na primeira execução, abre navegador para login
- Token salvo em `youtube_token.json`
- Renovação automática quando expira

### 2. Leitura de Metadados

- Lê `course-metadata.json`
- Identifica vídeos sem `youtubeUrl`
- Respeita limite de `--max-uploads`

### 3. Upload

Para cada vídeo:
- Localiza arquivo (busca recursiva)
- Prepara metadados (título, descrição, tags)
- Faz upload como **unlisted**
- Atualiza JSON com URL do YouTube
- Salva progresso em `upload_progress.json`

### 4. Progresso Persistente

O script mantém dois arquivos de controle:

- **`upload_progress.json`**: Lista de vídeos enviados e falhas
- **`course-metadata.json`**: Atualizado com `youtubeUrl` para cada vídeo

**Vantagem**: Se o script for interrompido, ele retoma de onde parou na próxima execução.

### 5. Metadados do Vídeo

Cada vídeo é enviado com:

- **Título**: Nome da aula (máx. 100 caracteres)
- **Descrição**: Curso, módulo, seção e aula
- **Tags**: gestão rural, pecuária leiteira, gado de leite, etc.
- **Categoria**: Education (ID 27)
- **Privacidade**: **Unlisted** (não listado)
- **Made for Kids**: Não

---

## 🐛 Solução de Problemas

### Erro: "Arquivo de credenciais não encontrado"

**Solução**: Certifique-se de que `client_secret.json` está na mesma pasta do script.

```bash
ls -la client_secret.json
```

### Erro: "Bibliotecas do Google API não encontradas"

**Solução**: Instale as dependências:

```bash
pip3 install google-api-python-client google-auth-oauthlib
```

### Erro: "Arquivo não encontrado" para vídeos

**Possíveis causas**:
1. Nome do arquivo no JSON não corresponde ao arquivo real
2. Vídeos não estão no diretório especificado

**Solução**: Verifique os nomes dos arquivos:

```bash
# Liste arquivos no diretório
ls -lh /caminho/para/videos/*.mp4

# Compare com o JSON
grep "fileName" course-metadata.json | head -10
```

### Erro: "Quota exceeded" (Cota excedida)

A API do YouTube tem limites diários:
- **Cota padrão**: 10.000 unidades/dia
- **Upload de vídeo**: ~1.600 unidades cada

**Solução**: Limite uploads diários:

```bash
# Máximo de 6 vídeos por dia (seguro)
python3 youtube_uploader.py --videos-dir /path/to/videos --max-uploads 6
```

Para aumentar a cota, solicite ao Google Cloud Console.

### Erro: "Token inválido" ou "Credenciais expiradas"

**Solução**: Delete o token e refaça autenticação:

```bash
rm youtube_token.json
python3 youtube_uploader.py --videos-dir /path/to/videos --max-uploads 1
```

### Vídeo enviado mas não aparece no YouTube

**Possível causa**: Processamento do YouTube pode levar alguns minutos.

**Solução**: Aguarde 5-10 minutos e verifique novamente.

---

## ⏰ Automação com Cron

Para automatizar uploads diários, use **cron** (Linux/Mac) ou **Task Scheduler** (Windows).

### Exemplo: Upload diário de 10 vídeos às 2h da manhã

1. Edite o crontab:

```bash
crontab -e
```

2. Adicione a linha:

```cron
0 2 * * * cd /home/user/lecture-platform && /usr/bin/python3 youtube_uploader.py --videos-dir /home/user/videos --max-uploads 10 >> /home/user/upload.log 2>&1
```

**Explicação**:
- `0 2 * * *`: Executa às 2h da manhã todos os dias
- `cd /home/user/lecture-platform`: Entra no diretório do projeto
- `python3 youtube_uploader.py ...`: Executa o script
- `>> /home/user/upload.log 2>&1`: Salva logs em arquivo

3. Verifique o cron:

```bash
crontab -l
```

### Exemplo: Upload a cada 6 horas

```cron
0 */6 * * * cd /home/user/lecture-platform && /usr/bin/python3 youtube_uploader.py --videos-dir /home/user/videos --max-uploads 5 >> /home/user/upload.log 2>&1
```

### Monitorar Logs

```bash
tail -f /home/user/upload.log
```

---

## 📊 Monitoramento de Progresso

### Ver quantos vídeos já foram enviados

```bash
cat upload_progress.json | grep -c '"uploaded"'
```

### Ver vídeos com falha

```bash
cat upload_progress.json | grep -A 3 '"failed"'
```

### Ver vídeos pendentes

```bash
python3 youtube_uploader.py --videos-dir /path/to/videos --max-uploads 0
```

(Isso só carrega metadados e mostra o resumo sem fazer upload)

---

## 🔒 Segurança

### Arquivos Sensíveis

**Nunca compartilhe ou comite no Git**:
- `client_secret.json` (credenciais OAuth)
- `youtube_token.json` (token de acesso)

Adicione ao `.gitignore`:

```gitignore
client_secret.json
youtube_token.json
upload_progress.json
```

### Permissões

Restrinja acesso aos arquivos sensíveis:

```bash
chmod 600 client_secret.json
chmod 600 youtube_token.json
```

---

## 📝 Estrutura do JSON Atualizado

Após o upload, cada aula no `course-metadata.json` terá o campo `youtubeUrl`:

```json
{
  "id": "lesson-01-01-01",
  "order": 1,
  "title": "Boas-vindas e orientações",
  "fileName": "Videoaula 01 Boas-vindas e orientações.mp4",
  "type": "video",
  "youtubeUrl": "https://www.youtube.com/watch?v=ABC123XYZ"
}
```

Este campo é usado pela aplicação web para embedar os vídeos.

---

## 🎯 Recomendações

### Para Teste Inicial

1. Comece com **1-2 vídeos** para validar o processo:
   ```bash
   python3 youtube_uploader.py --videos-dir /path/to/videos --max-uploads 2
   ```

2. Verifique no YouTube se os vídeos foram enviados corretamente

3. Verifique se o `course-metadata.json` foi atualizado com as URLs

### Para Produção

1. Use **limite diário de 10-15 vídeos** para evitar problemas de quota:
   ```bash
   python3 youtube_uploader.py --videos-dir /path/to/videos --max-uploads 10
   ```

2. Configure **cron** para execução automática diária

3. Monitore os logs regularmente

4. Faça backup do `course-metadata.json` antes de grandes uploads

---

## 🆘 Suporte

### Documentação Oficial

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Python Client Library](https://github.com/googleapis/google-api-python-client)

### Limites da API

- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [Quota Limits](https://developers.google.com/youtube/v3/getting-started#quota)

---

## 📄 Licença

Este script é parte do projeto Lecture Platform e é fornecido "como está" para uso pessoal.
