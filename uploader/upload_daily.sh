#!/bin/bash
#
# Script auxiliar para upload diário de vídeos no YouTube
# Uso: ./upload_daily.sh [número_de_vídeos] [caminho_dos_videos]
#

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Parâmetros
MAX_UPLOADS=${1:-10}  # Padrão: 10 vídeos
VIDEOS_DIR=${2:-""}   # Caminho dos vídeos

# Banner
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   YouTube Daily Uploader - Lecture Platform${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Verifica se o diretório de vídeos foi fornecido
if [ -z "$VIDEOS_DIR" ]; then
    echo -e "${RED}❌ Erro: Diretório de vídeos não especificado${NC}"
    echo ""
    echo "Uso: $0 [número_de_vídeos] [caminho_dos_videos]"
    echo ""
    echo "Exemplos:"
    echo "  $0 10 /home/user/videos          # Upload de 10 vídeos"
    echo "  $0 5 /mnt/storage/curso-rehagro  # Upload de 5 vídeos"
    echo ""
    exit 1
fi

# Verifica se o diretório existe
if [ ! -d "$VIDEOS_DIR" ]; then
    echo -e "${RED}❌ Erro: Diretório não encontrado: $VIDEOS_DIR${NC}"
    exit 1
fi

# Verifica se o ambiente virtual existe
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚙️  Criando ambiente virtual...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ Ambiente virtual criado${NC}"
fi

# Ativa ambiente virtual
echo -e "${BLUE}🔧 Ativando ambiente virtual...${NC}"
source venv/bin/activate

# Verifica dependências
if ! python -c "import googleapiclient" 2>/dev/null; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    pip install -q google-api-python-client google-auth-oauthlib google-auth-httplib2
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
fi

# Verifica se o arquivo de credenciais existe
if [ ! -f "client_secret.json" ]; then
    echo -e "${RED}❌ Erro: Arquivo client_secret.json não encontrado${NC}"
    echo ""
    echo "Por favor, obtenha as credenciais OAuth 2.0 do Google Cloud Console"
    echo "e salve como 'client_secret.json' neste diretório."
    echo ""
    echo "Veja o guia: YOUTUBE_UPLOAD_GUIDE.md"
    exit 1
fi

# Verifica se o metadata existe
if [ ! -f "course-metadata.json" ]; then
    echo -e "${RED}❌ Erro: Arquivo course-metadata.json não encontrado${NC}"
    exit 1
fi

# Mostra informações
echo ""
echo -e "${BLUE}📋 Configuração:${NC}"
echo -e "   Vídeos: ${GREEN}$VIDEOS_DIR${NC}"
echo -e "   Limite: ${GREEN}$MAX_UPLOADS vídeos${NC}"
echo ""

# # Pergunta confirmação
# read -p "Deseja continuar? (s/N) " -n 1 -r
# echo
# if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
#     echo -e "${YELLOW}⚠️  Upload cancelado${NC}"
#     exit 0
# fi
# 

# Executa upload
echo ""
echo -e "${GREEN}🚀 Iniciando upload...${NC}"
echo ""

LOG_FILE="upload_$(date +%Y%m%d_%H%M%S).log"

python youtube_uploader.py \
    --videos-dir "$VIDEOS_DIR" \
    --max-uploads "$MAX_UPLOADS" \
    2>&1 | tee "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Upload concluído com sucesso!${NC}"
    echo -e "${BLUE}📄 Log salvo em: $LOG_FILE${NC}"
else
    echo -e "${RED}❌ Upload finalizado com erros (código: $EXIT_CODE)${NC}"
    echo -e "${BLUE}📄 Verifique o log: $LOG_FILE${NC}"
fi

echo ""
echo -e "${BLUE}================================================${NC}"

exit $EXIT_CODE
