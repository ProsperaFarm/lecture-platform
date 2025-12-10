# YouTube Uploader - Guia Rápido

Script para fazer upload automático de vídeos do curso para o YouTube como **unlisted**, atualizando o `course-metadata.json` com os links gerados.

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar bibliotecas
pip install -r requirements-uploader.txt
```

### 2. Obter Credenciais do Google

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie projeto e ative **YouTube Data API v3**
3. Crie credenciais **OAuth 2.0** (Desktop app)
4. Baixe o JSON e salve como `client_secret.json`

**Veja o guia completo**: [YOUTUBE_UPLOAD_GUIDE.md](YOUTUBE_UPLOAD_GUIDE.md)

### 3. Executar Upload

#### Opção A: Script Bash (Recomendado)

```bash
./upload_daily.sh 10 /caminho/para/videos
```

#### Opção B: Python Diretamente

```bash
source venv/bin/activate
python youtube_uploader.py --videos-dir /caminho/para/videos --max-uploads 10
```

## 📋 Parâmetros

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `--videos-dir` | Diretório dos vídeos (obrigatório) | - |
| `--max-uploads` | Máximo de vídeos por execução | Todos |
| `--delay` | Segundos entre uploads | 5 |
| `--credentials` | Arquivo de credenciais OAuth | `client_secret.json` |

## 💡 Exemplos

```bash
# Upload de 5 vídeos (teste inicial)
python youtube_uploader.py --videos-dir /home/user/videos --max-uploads 5

# Upload de 20 vídeos com delay de 10s
python youtube_uploader.py --videos-dir /home/user/videos --max-uploads 20 --delay 10

# Upload de todos os vídeos pendentes
python youtube_uploader.py --videos-dir /home/user/videos
```

## ⏰ Automação com Cron

Para upload diário automático às 2h da manhã:

```bash
crontab -e
```

Adicione:

```cron
0 2 * * * cd /home/user/lecture-platform && ./upload_daily.sh 10 /home/user/videos >> /home/user/upload.log 2>&1
```

**Mais exemplos**: [cron_example.txt](cron_example.txt)

## 📊 Arquivos Gerados

- **`youtube_token.json`**: Token de autenticação (gerado automaticamente)
- **`upload_progress.json`**: Registro de vídeos enviados e falhas
- **`course-metadata.json`**: Atualizado com campo `youtubeUrl` para cada vídeo
- **`upload_*.log`**: Logs de execução

## 🔒 Segurança

**Nunca comite no Git**:
- `client_secret.json`
- `youtube_token.json`
- `upload_progress.json`

Estes arquivos já estão no `.gitignore`.

## 🔄 Como Funciona

1. **Autenticação**: Login OAuth na primeira execução (token salvo para reuso)
2. **Leitura**: Carrega `course-metadata.json` e identifica vídeos sem `youtubeUrl`
3. **Upload**: Envia vídeos como **unlisted** com metadados completos
4. **Atualização**: Adiciona `youtubeUrl` no JSON para cada vídeo enviado
5. **Progresso**: Salva estado em `upload_progress.json` para retomar se interrompido

## 📈 Monitoramento

```bash
# Ver progresso
cat upload_progress.json

# Ver vídeos pendentes
python youtube_uploader.py --videos-dir /path/to/videos --max-uploads 0

# Ver logs
tail -f upload.log
```

## 🐛 Solução de Problemas

### "Arquivo de credenciais não encontrado"
→ Certifique-se de que `client_secret.json` está no diretório

### "Quota exceeded"
→ Limite diário da API atingido. Use `--max-uploads` menor (6-10 vídeos/dia)

### "Arquivo não encontrado" para vídeos
→ Verifique se os nomes no JSON correspondem aos arquivos reais

**Guia completo de troubleshooting**: [YOUTUBE_UPLOAD_GUIDE.md](YOUTUBE_UPLOAD_GUIDE.md)

## 📚 Documentação Completa

Para instruções detalhadas, veja:
- **[YOUTUBE_UPLOAD_GUIDE.md](YOUTUBE_UPLOAD_GUIDE.md)** - Guia completo com passo a passo
- **[cron_example.txt](cron_example.txt)** - Exemplos de automação

## 🎯 Limites da API do YouTube

- **Cota diária padrão**: 10.000 unidades
- **Custo por upload**: ~1.600 unidades
- **Máximo seguro**: 6 vídeos/dia (pode variar)

Para aumentar a cota, solicite no Google Cloud Console.

## 📄 Estrutura do Projeto

```
lecture-platform/
├── youtube_uploader.py          # Script principal
├── upload_daily.sh              # Script bash auxiliar
├── course-metadata.json         # Metadados (atualizado com URLs)
├── client_secret.json           # Credenciais OAuth (você cria)
├── youtube_token.json           # Token (gerado automaticamente)
├── upload_progress.json         # Progresso (gerado automaticamente)
├── requirements-uploader.txt    # Dependências Python
├── YOUTUBE_UPLOAD_GUIDE.md      # Guia completo
├── README_UPLOADER.md           # Este arquivo
└── cron_example.txt             # Exemplos de cron
```

## 🆘 Suporte

- [YouTube Data API v3 Docs](https://developers.google.com/youtube/v3)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
