#!/usr/bin/env python3
"""
Fetch Video Durations Script
Busca durações de vídeos já enviados para o YouTube e atualiza o course-metadata.json

Uso:
    python fetch_durations.py
    python fetch_durations.py --metadata-file outro-curso.json
"""

import argparse
import json
import os
import sys
import re
from typing import Optional

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
except ImportError:
    print("❌ Erro: Bibliotecas do Google API não encontradas.")
    print("   Instale com: pip install google-api-python-client google-auth-oauthlib")
    sys.exit(1)


# Configurações
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
TOKEN_FILE = 'youtube_token.json'
CREDENTIALS_FILE = 'client_secret.json'
DEFAULT_METADATA_FILE = 'course-metadata.json'


class DurationFetcher:
    """Busca durações de vídeos do YouTube"""
    
    def __init__(self, metadata_file: str = DEFAULT_METADATA_FILE, credentials_file: str = CREDENTIALS_FILE):
        self.metadata_file = metadata_file
        self.credentials_file = credentials_file
        self.youtube = None
        self.metadata = None
        
    def authenticate(self):
        """Autentica com a API do YouTube"""
        creds = None
        
        # Carrega token salvo se existir
        if os.path.exists(TOKEN_FILE):
            try:
                creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
            except Exception as e:
                print(f"⚠️  Token existente inválido: {e}")
                print(f"💡 Se você mudou de credenciais, delete o arquivo {TOKEN_FILE} e tente novamente")
        
        # Se não há credenciais válidas, faz login
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                print("🔄 Renovando token de acesso...")
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    print(f"❌ Arquivo de credenciais não encontrado: {self.credentials_file}")
                    print("\n📋 Como obter credenciais:")
                    print("   1. Acesse: https://console.cloud.google.com/")
                    print("   2. Crie um projeto (ou selecione existente)")
                    print("   3. Ative a YouTube Data API v3")
                    print("   4. Crie credenciais OAuth 2.0 (Desktop app)")
                    print("   5. Baixe o JSON e salve como 'client_secret.json'")
                    sys.exit(1)
                
                print("🔐 Iniciando autenticação OAuth...")
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=8080)
            
            # Salva token para uso futuro
            with open(TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
            print("✅ Token salvo com sucesso!")
        
        self.youtube = build('youtube', 'v3', credentials=creds)
        print("✅ Autenticado com sucesso!\n")
    
    def load_metadata(self):
        """Carrega metadados do curso"""
        if not os.path.exists(self.metadata_file):
            print(f"❌ Arquivo de metadados não encontrado: {self.metadata_file}")
            sys.exit(1)
        
        with open(self.metadata_file, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
        
        print(f"📚 Curso: {self.metadata['course']['title']}")
        print(f"📹 Total de vídeos: {self.metadata['course']['totalVideos']}\n")
    
    def _parse_duration(self, iso_duration: str) -> int:
        """Converte duração ISO 8601 (ex: PT15M33S) para segundos"""
        # Regex para extrair horas, minutos e segundos
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, iso_duration)
        
        if not match:
            return 0
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        return hours * 3600 + minutes * 60 + seconds
    
    def _get_video_duration(self, video_id: str) -> Optional[int]:
        """
        Busca a duração do vídeo via YouTube API
        Retorna duração em segundos ou None em caso de erro
        """
        try:
            request = self.youtube.videos().list(
                part='contentDetails',
                id=video_id
            )
            response = request.execute()
            
            if 'items' in response and len(response['items']) > 0:
                duration_iso = response['items'][0]['contentDetails']['duration']
                duration_seconds = self._parse_duration(duration_iso)
                return duration_seconds
            
            return None
        except Exception as e:
            error_str = str(e)
            if 'insufficientPermissions' in error_str or 'insufficient authentication scopes' in error_str:
                print(f"❌ Erro de permissão ao buscar duração do vídeo {video_id}")
                print(f"💡 O token atual não tem as permissões necessárias.")
                print(f"   Solução: Delete o arquivo '{TOKEN_FILE}' e execute o script novamente")
                print(f"   para re-autenticar com as credenciais corretas.\n")
            else:
                print(f"⚠️  Erro ao buscar duração do vídeo {video_id}: {e}")
            return None
    
    def _format_duration(self, seconds: int) -> str:
        """Formata duração em segundos para HH:MM:SS"""
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        
        if hours > 0:
            return f"{hours}h{minutes:02d}m{secs:02d}s"
        elif minutes > 0:
            return f"{minutes}m{secs:02d}s"
        else:
            return f"{secs}s"
    
    def _extract_video_id(self, youtube_url: str) -> Optional[str]:
        """Extrai video ID de uma URL do YouTube"""
        if not youtube_url:
            return None
        
        # Suporta vários formatos de URL
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',  # youtube.com/watch?v=ID ou youtu.be/ID
            r'(?:embed\/)([0-9A-Za-z_-]{11})',   # youtube.com/embed/ID
        ]
        
        for pattern in patterns:
            match = re.search(pattern, youtube_url)
            if match:
                return match.group(1)
        
        return None
    
    def fetch_missing_durations(self):
        """Busca durações de vídeos que não têm o campo duration"""
        missing_count = 0
        updated_count = 0
        failed_count = 0
        
        # Conta vídeos sem duração
        for module in self.metadata['course']['modules']:
            for section in module['sections']:
                for lesson in section['lessons']:
                    if lesson.get('youtubeUrl') and not lesson.get('duration'):
                        missing_count += 1
        
        if missing_count == 0:
            print("✅ Todos os vídeos já têm duração cadastrada!")
            return
        
        print(f"📋 Vídeos sem duração: {missing_count}")
        print(f"🔍 Buscando durações via YouTube API...\n")
        
        # Processa cada vídeo
        for module in self.metadata['course']['modules']:
            for section in module['sections']:
                for lesson in section['lessons']:
                    # Pula se já tem duração ou não tem URL
                    if lesson.get('duration') or not lesson.get('youtubeUrl'):
                        continue
                    
                    # Extrai video ID
                    video_id = self._extract_video_id(lesson['youtubeUrl'])
                    if not video_id:
                        print(f"⚠️  URL inválida: {lesson['id']} - {lesson['youtubeUrl']}")
                        failed_count += 1
                        continue
                    
                    # Busca duração
                    print(f"⏱️  {lesson['id']}: {lesson['title'][:50]}...")
                    duration_seconds = self._get_video_duration(video_id)
                    
                    if duration_seconds:
                        lesson['duration'] = duration_seconds
                        print(f"   ✅ Duração: {self._format_duration(duration_seconds)}\n")
                        updated_count += 1
                    else:
                        print(f"   ❌ Falha ao buscar duração\n")
                        failed_count += 1
        
        # Salva JSON atualizado
        if updated_count > 0:
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, indent=2, ensure_ascii=False)
            print(f"💾 Arquivo {self.metadata_file} atualizado com sucesso!")
        
        # Resumo
        print("\n" + "=" * 70)
        print("📊 RESUMO")
        print("=" * 70)
        print(f"✅ Durações adicionadas: {updated_count}")
        print(f"❌ Falhas: {failed_count}")
        print(f"📋 Pendentes: {missing_count - updated_count - failed_count}")
        print("=" * 70)
        
        # Calcula estatísticas
        self._print_statistics()
    
    def _print_statistics(self):
        """Imprime estatísticas de duração por módulo"""
        print("\n" + "=" * 70)
        print("📈 ESTATÍSTICAS DE DURAÇÃO")
        print("=" * 70)
        
        total_duration = 0
        total_videos_with_duration = 0
        
        for module in self.metadata['course']['modules']:
            module_duration = 0
            module_videos = 0
            
            for section in module['sections']:
                for lesson in section['lessons']:
                    if lesson.get('duration'):
                        module_duration += lesson['duration']
                        module_videos += 1
                        total_duration += lesson['duration']
                        total_videos_with_duration += 1
            
            if module_videos > 0:
                print(f"\n{module['title']}:")
                print(f"  Vídeos: {module_videos}")
                print(f"  Duração total: {self._format_duration(module_duration)}")
        
        if total_videos_with_duration > 0:
            print(f"\n{'='*70}")
            print(f"TOTAL DO CURSO:")
            print(f"  Vídeos com duração: {total_videos_with_duration}/{self.metadata['course']['totalVideos']}")
            print(f"  Duração total: {self._format_duration(total_duration)}")
            print(f"  Duração média por vídeo: {self._format_duration(total_duration // total_videos_with_duration)}")
            print("=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description='Busca durações de vídeos do YouTube e atualiza course-metadata.json',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:
  # Buscar durações usando arquivo padrão
  python fetch_durations.py
  
  # Usar arquivo de metadados customizado
  python fetch_durations.py --metadata-file outro-curso.json

Requisitos:
  1. Instalar dependências: pip install google-api-python-client google-auth-oauthlib
  2. Obter credenciais OAuth 2.0 do Google Cloud Console
  3. Salvar credenciais como 'client_secret.json' no diretório atual
  4. Vídeos já devem ter sido enviados (campo youtubeUrl preenchido)
        """
    )
    
    parser.add_argument(
        '--metadata-file',
        default=DEFAULT_METADATA_FILE,
        help=f'Arquivo JSON com metadados do curso (padrão: {DEFAULT_METADATA_FILE})'
    )
    
    parser.add_argument(
        '--credentials',
        default=CREDENTIALS_FILE,
        help=f'Arquivo de credenciais OAuth 2.0 (padrão: {CREDENTIALS_FILE})'
    )
    
    args = parser.parse_args()
    
    # Executa
    fetcher = DurationFetcher(
        metadata_file=args.metadata_file,
        credentials_file=args.credentials
    )
    
    fetcher.authenticate()
    fetcher.load_metadata()
    fetcher.fetch_missing_durations()


if __name__ == '__main__':
    main()
