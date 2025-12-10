# Limites de Upload do YouTube

## 📊 Entendendo os Limites

O YouTube impõe limites no número de vídeos que podem ser enviados em um período de 24 horas para prevenir spam e abuso da plataforma.

### Tipos de Limites

#### 1. Limite de Uploads Diários (uploadLimitExceeded)

**Erro:** `badRequest (400) - uploadLimitExceeded`  
**Mensagem:** "The user has exceeded the number of videos they may upload."

**Limites típicos:**
- **Canais novos:** 10-15 vídeos por dia
- **Canais estabelecidos:** 50-100 vídeos por dia
- **Canais corporativos verificados:** 100+ vídeos por dia

#### 2. Quota da API (quotaExceeded)

**Erro:** `forbidden (403) - quotaExceeded`  
**Limite:** 10,000 unidades por dia (Google Cloud Project)  
**Reset:** Meia-noite Pacific Time (PT)

> **Nota:** Este é um limite diferente e geralmente não é atingido em uploads normais.

## ⏰ Como Funciona o Reset

### Período Rolante de 24 Horas

O limite do YouTube é baseado em um **período rolante de 24 horas**, NÃO em dias de calendário.

**Exemplo:**
```
Dia 1:
  10:00 - Upload do 1º vídeo
  10:30 - Upload do 2º vídeo
  11:00 - Upload do 10º vídeo
  11:15 - ❌ Limite atingido (10 vídeos)

Dia 2:
  10:00 - ✅ Pode enviar novamente (24h após o 1º upload)
  10:30 - ✅ Pode enviar novamente (24h após o 2º upload)
  ...
```

**Importante:**
- ✅ O contador reseta 24 horas após **cada upload individual**
- ❌ NÃO reseta à meia-noite
- ❌ NÃO é possível "esperar algumas horas" no mesmo dia

## 🛡️ Como o Script Trata o Erro

Quando o erro `uploadLimitExceeded` é detectado, o script:

1. ✅ **Para imediatamente** de tentar enviar mais vídeos
2. ✅ **Exibe mensagem informativa** sobre o limite
3. ✅ **Salva o progresso** (vídeos já enviados)
4. ✅ **Registra a falha** no arquivo `upload_progress.json`
5. ✅ **Encerra a execução** com resumo

### Mensagem Exibida

```
======================================================================
⚠️  LIMITE DIÁRIO DE UPLOADS ATINGIDO
======================================================================

O YouTube limita o número de vídeos que podem ser enviados
em um período de 24 horas (rolante).

📋 Informações importantes:
   • O limite é baseado em 24 horas ROLANTES (não dias de calendário)
   • Canais novos: ~10-15 vídeos/dia
   • Canais estabelecidos: ~50-100 vídeos/dia
   • O limite aumenta gradualmente com bom histórico do canal

⏰ Quando você poderá enviar novamente:
   • 24 horas após o PRIMEIRO upload de hoje
   • Exemplo: Primeiro upload às 10h → Próximo upload às 10h de amanhã

💡 Recomendação:
   • Execute o script novamente amanhã no mesmo horário
   • Considere usar --max-uploads 10 para evitar atingir o limite

======================================================================

🛑 Parando execução. Não é possível enviar mais vídeos hoje.
```

## 💡 Boas Práticas

### 1. Use o Parâmetro `--max-uploads`

Limite o número de vídeos por execução para evitar atingir o limite:

```bash
# Envia no máximo 10 vídeos
python youtube_uploader.py --videos-dir /path/to/videos --max-uploads 10
```

### 2. Espaçe os Uploads

Use o parâmetro `--delay` para aguardar entre uploads:

```bash
# Aguarda 10 segundos entre cada upload
python youtube_uploader.py --videos-dir /path/to/videos --max-uploads 10 --delay 10
```

### 3. Execute Diariamente

Configure um cron job para executar automaticamente todos os dias:

```bash
# Executa às 10h todos os dias, enviando 10 vídeos
0 10 * * * cd /path/to/project && ./upload_daily.sh 10 /path/to/videos
```

### 4. Monitore o Progresso

O script salva o progresso em `upload_progress.json`:

```json
{
  "uploaded": ["lesson-id-1", "lesson-id-2", ...],
  "failed": [
    {
      "id": "lesson-id-10",
      "reason": "upload_limit_exceeded",
      "filename": "video10.mp4"
    }
  ]
}
```

## 📈 Aumentando o Limite

O limite de uploads aumenta **automaticamente** com o tempo se você:

1. ✅ **Não violar** as Community Guidelines do YouTube
2. ✅ **Manter histórico positivo** de uploads
3. ✅ **Usar o canal regularmente** por meses
4. ✅ **Ter conteúdo de qualidade** e engajamento

**Processo:**
- **Orgânico:** Pode levar meses
- **Gradual:** Aumenta lentamente (ex: 10 → 15 → 20 → 30...)
- **Automático:** Não é possível solicitar aumento manual

## ❓ FAQ

### P: Posso enviar mais vídeos se esperar algumas horas?
**R:** Não. O limite é de 24 horas rolantes desde o primeiro upload.

### P: Posso usar múltiplas contas para enviar mais vídeos?
**R:** Tecnicamente sim, mas viola os Termos de Serviço do YouTube.

### P: O limite reseta à meia-noite?
**R:** Não. O limite é rolante de 24 horas, não baseado em dias de calendário.

### P: Como sei qual é o meu limite atual?
**R:** Não há forma oficial de consultar. Você descobre ao atingir o limite.

### P: Posso solicitar aumento do limite ao YouTube?
**R:** Não. O aumento é automático e baseado no histórico do canal.

### P: O erro 403 quotaExceeded é o mesmo que uploadLimitExceeded?
**R:** Não. São limites diferentes:
- `uploadLimitExceeded (400)`: Limite de vídeos do canal
- `quotaExceeded (403)`: Limite de quota da API do Google Cloud

## 🔗 Referências

- [YouTube Data API - Errors](https://developers.google.com/youtube/v3/docs/errors)
- [YouTube Community Support](https://support.google.com/youtube)
- [YouTube API Quota Documentation](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits)

---

**Última atualização:** 10 de dezembro de 2025
