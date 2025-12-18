#!/usr/bin/env python3
"""
YouTube Video Language Updater Script
Atualiza metadados de idioma de vídeos já enviados para o YouTube

Este script atualiza os campos defaultLanguage e defaultAudioLanguage
de vídeos que já foram enviados, mas não tinham essa informação no momento do upload.

Uso:
    python update_youtube_language.py
    python update_youtube_language.py --metadata-file outro-curso.json
"""

import argparse
import json
import os
import sys
import re
from typing import Dict, List, Optional
import time

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    print("❌ Erro: Bibliotecas do Google API não encontradas.")
    print("   Instale com: pip install google-api-python-client google-auth-oauthlib")
    sys.exit(1)


# Escopos necessários para atualizar vídeos
# youtube.force-ssl: Permite atualizar metadados de vídeos existentes
# youtube.readonly: Permite ler informações dos vídeos
SCOPES = [
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.readonly'
]
TOKEN_FILE = 'youtube_token.json'
CREDENTIALS_FILE = 'client_secret.json'
DEFAULT_METADATA_FILE = 'course-metadata.json'


class YouTubeLanguageUpdater:
    """Atualiza metadados de idioma de vídeos do YouTube"""
    
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
    
    def _get_language(self, lesson: Dict) -> Optional[str]:
        """
        Obtém o idioma do vídeo
        Prioridade: lesson.language > course.language
        Retorna código ISO 639-1 (ex: 'pt-BR', 'en', 'es')
        """
        # Primeiro tenta obter do lesson
        if lesson.get('language'):
            return lesson['language']
        
        # Se não tiver no lesson, usa o do course
        if self.metadata and self.metadata.get('course', {}).get('language'):
            return self.metadata['course']['language']
        
        return None
    
    def _get_current_video_metadata(self, video_id: str) -> Optional[Dict]:
        """Busca metadados atuais do vídeo no YouTube"""
        try:
            request = self.youtube.videos().list(
                part='snippet',
                id=video_id
            )
            response = request.execute()
            
            if 'items' in response and len(response['items']) > 0:
                return response['items'][0]
            
            return None
        except Exception as e:
            print(f"⚠️  Erro ao buscar metadados do vídeo {video_id}: {e}")
            return None
    
    def update_video_language(self, video_id: str, language: str) -> bool:
        """
        Atualiza o idioma de um vídeo no YouTube
        Retorna True se bem-sucedido, False caso contrário
        """
        try:
            # Busca metadados atuais do vídeo
            video_data = self._get_current_video_metadata(video_id)
            if not video_data:
                print(f"⚠️  Vídeo {video_id} não encontrado no YouTube")
                return False
            
            snippet = video_data['snippet']
            
            # Verifica se o idioma já está correto
            current_lang = snippet.get('defaultLanguage', '')
            current_audio_lang = snippet.get('defaultAudioLanguage', '')
            
            if current_lang == language and current_audio_lang == language:
                print(f"   ✓ Idioma já está correto: {language}")
                return True
            
            # Atualiza o snippet com o novo idioma
            snippet['defaultLanguage'] = language
            snippet['defaultAudioLanguage'] = language
            
            # Prepara requisição de atualização
            body = {
                'id': video_id,
                'snippet': snippet
            }
            
            # Atualiza o vídeo
            request = self.youtube.videos().update(
                part='snippet',
                body=body
            )
            response = request.execute()
            
            print(f"   ✅ Idioma atualizado: {language}")
            return True
            
        except HttpError as e:
            error_details = str(e)
            if 'quotaExceeded' in error_details:
                print(f"   ❌ Erro: Cota da API excedida")
                print(f"      Aguarde antes de tentar novamente")
            elif 'forbidden' in error_details.lower() or 'insufficientPermissions' in error_details:
                print(f"   ❌ Erro: Sem permissão para atualizar este vídeo")
            else:
                print(f"   ❌ Erro HTTP: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Erro inesperado: {e}")
            return False
    
    def update_all_videos(self, dry_run: bool = False):
        """Atualiza idioma de todos os vídeos que têm youtubeUrl"""
        videos_to_update = []
        
        # Coleta todos os vídeos que precisam ser atualizados
        for module in self.metadata['course']['modules']:
            for section in module['sections']:
                for lesson in section['lessons']:
                    if lesson.get('youtubeUrl'):
                        language = self._get_language(lesson)
                        if language:
                            video_id = self._extract_video_id(lesson['youtubeUrl'])
                            if video_id:
                                videos_to_update.append({
                                    'lesson_id': lesson['id'],
                                    'lesson_title': lesson['title'],
                                    'video_id': video_id,
                                    'youtube_url': lesson['youtubeUrl'],
                                    'language': language
                                })
        
        if not videos_to_update:
            print("✅ Nenhum vídeo encontrado para atualizar!")
            return
        
        print(f"📋 Vídeos encontrados: {len(videos_to_update)}")
        if dry_run:
            print("🔍 Modo DRY RUN - Nenhuma alteração será feita\n")
        else:
            print("🚀 Iniciando atualização...\n")
        
        success_count = 0
        fail_count = 0
        skip_count = 0
        
        for i, video_info in enumerate(videos_to_update, 1):
            print(f"[{i}/{len(videos_to_update)}] {video_info['lesson_id']}: {video_info['lesson_title'][:50]}...")
            print(f"   Video ID: {video_info['video_id']}")
            print(f"   Idioma: {video_info['language']}")
            
            if dry_run:
                print(f"   🔍 [DRY RUN] Seria atualizado para: {video_info['language']}")
                skip_count += 1
            else:
                success = self.update_video_language(video_info['video_id'], video_info['language'])
                if success:
                    success_count += 1
                else:
                    fail_count += 1
                
                # Aguarda um pouco entre requisições para evitar rate limiting
                if i < len(videos_to_update):
                    time.sleep(1)
            
            print()
        
        # Resumo
        print("=" * 70)
        print("📊 RESUMO")
        print("=" * 70)
        if dry_run:
            print(f"🔍 Modo DRY RUN - Nenhuma alteração foi feita")
            print(f"📋 Vídeos que seriam atualizados: {skip_count}")
        else:
            print(f"✅ Sucessos: {success_count}")
            print(f"❌ Falhas: {fail_count}")
        print(f"📈 Total processado: {len(videos_to_update)}")
        print("=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description='Atualiza metadados de idioma de vídeos do YouTube',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:
  # Atualizar todos os vídeos do curso padrão
  python update_youtube_language.py
  
  # Modo dry-run (apenas simula, não faz alterações)
  python update_youtube_language.py --dry-run
  
  # Com arquivo de metadados customizado
  python update_youtube_language.py --metadata-file outro-curso.json

Requisitos:
  1. Instalar dependências: pip install google-api-python-client google-auth-oauthlib
  2. Ter credenciais OAuth 2.0 configuradas (client_secret.json)
  3. Vídeos já devem ter sido enviados (campo youtubeUrl preenchido)
  4. Curso deve ter campo 'language' no course-metadata.json
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
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Modo dry-run: apenas simula as atualizações sem fazer alterações reais'
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("🌍 YouTube Video Language Updater")
    print("=" * 70 + "\n")
    
    # Executa
    updater = YouTubeLanguageUpdater(
        metadata_file=args.metadata_file,
        credentials_file=args.credentials
    )
    
    updater.authenticate()
    updater.load_metadata()
    updater.update_all_videos(dry_run=args.dry_run)


if __name__ == '__main__':
    main()

