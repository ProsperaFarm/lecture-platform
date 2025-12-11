#!/usr/bin/env python3
"""
YouTube Video Uploader Script
Faz upload de vídeos para o YouTube usando metadados do course-metadata.json
e atualiza o JSON com os links gerados.

Requisitos:
- Google API Client instalado: pip install google-api-python-client google-auth-oauthlib
- Credenciais OAuth 2.0 do Google Cloud Console
- Vídeos locais no caminho especificado

Uso:
    python youtube_uploader.py --videos-dir /caminho/para/videos --max-uploads 5
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
import time

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError
except ImportError:
    print("❌ Erro: Bibliotecas do Google API não encontradas.")
    print("   Instale com: pip install google-api-python-client google-auth-oauthlib")
    sys.exit(1)


# Escopos necessários para upload de vídeos
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
TOKEN_FILE = 'youtube_token.json'
CREDENTIALS_FILE = 'client_secret.json'
DEFAULT_METADATA_FILE = 'course-metadata.json'
PROGRESS_FILE = 'upload_progress.json'


class YouTubeUploader:
    """Gerencia upload de vídeos para o YouTube"""
    
    def __init__(self, videos_dir: str, credentials_file: str = CREDENTIALS_FILE, metadata_file: str = DEFAULT_METADATA_FILE):
        self.videos_dir = Path(videos_dir)
        self.credentials_file = credentials_file
        self.metadata_file = metadata_file
        self.youtube = None
        self.metadata = None
        self.progress = self._load_progress()
        
    def _load_progress(self) -> Dict:
        """Carrega progresso de uploads anteriores"""
        if os.path.exists(PROGRESS_FILE):
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'uploaded': [], 'failed': []}
    
    def _save_progress(self):
        """Salva progresso atual"""
        with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.progress, f, indent=2, ensure_ascii=False)
    
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
        
        total_videos = self.metadata['course']['totalVideos']
        print(f"📚 Curso: {self.metadata['course']['title']}")
        print(f"📹 Total de vídeos: {total_videos}")
        print(f"✅ Já enviados: {len(self.progress['uploaded'])}")
        print(f"❌ Falhas anteriores: {len(self.progress['failed'])}\n")
    
    def get_pending_lessons(self, max_uploads: Optional[int] = None) -> List[Dict]:
        """Retorna lista de aulas pendentes de upload"""
        pending = []
        uploaded_ids = set(self.progress['uploaded'])
        
        for module in self.metadata['course']['modules']:
            for section in module['sections']:
                for lesson in section['lessons']:
                    lesson_id = lesson['id']
                    
                    # Pula se já foi enviado ou se já tem youtubeUrl
                    if lesson_id in uploaded_ids or lesson.get('youtubeUrl'):
                        continue
                    
                    # Adiciona contexto completo
                    lesson_data = {
                        **lesson,
                        'module_title': module['title'],
                        'module_folder': module['folderName'],
                        'section_title': section['title'],
                        'module_order': module['order'],
                        'section_order': section['order']
                    }
                    pending.append(lesson_data)
                    
                    if max_uploads and len(pending) >= max_uploads:
                        return pending
        
        return pending
    
    def build_video_path(self, lesson: Dict) -> Path:
        """Constrói o caminho completo do arquivo de vídeo"""
        # Tenta encontrar o vídeo no diretório base ou em subpastas
        filename = lesson['fileName']
        
        # Primeiro tenta no diretório raiz
        video_path = self.videos_dir / filename
        if video_path.exists():
            return video_path
        
        # Tenta na pasta do módulo
        module_folder = lesson.get('module_folder', '')
        if module_folder:
            video_path = self.videos_dir / module_folder / filename
            if video_path.exists():
                return video_path
        
        # Busca recursivamente
        for path in self.videos_dir.rglob(filename):
            return path
        
        return None
    
    def upload_video(self, lesson: Dict, video_path: Path) -> Optional[str]:
        """
        Faz upload de um vídeo para o YouTube
        Retorna a URL do vídeo ou None em caso de erro
        """
        try:
            # Prepara metadados do vídeo
            title = self._build_title(lesson)
            description = self._build_description(lesson)
            tags = self._build_tags(lesson)
            
            # Limita título a 100 caracteres (limite do YouTube)
            if len(title) > 100:
                title = title[:97] + "..."
            
            body = {
                'snippet': {
                    'title': title,
                    'description': description,
                    'tags': tags,
                    'categoryId': '27'  # Education
                },
                'status': {
                    'privacyStatus': 'unlisted',  # Unlisted como solicitado
                    'selfDeclaredMadeForKids': False
                }
            }
            
            # Prepara arquivo para upload
            media = MediaFileUpload(
                str(video_path),
                chunksize=10 * 1024 * 1024,  # 10MB chunks
                resumable=True,
                mimetype='video/*'
            )
            
            print(f"📤 Enviando: {title}")
            print(f"   Arquivo: {video_path.name} ({self._format_size(video_path.stat().st_size)})")
            
            # Inicia upload
            request = self.youtube.videos().insert(
                part='snippet,status',
                body=body,
                media_body=media
            )
            
            response = None
            last_progress = 0
            
            while response is None:
                status, response = request.next_chunk()
                if status:
                    progress = int(status.progress() * 100)
                    if progress != last_progress and progress % 10 == 0:
                        print(f"   Progresso: {progress}%")
                        last_progress = progress
            
            video_id = response['id']
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            
            print(f"✅ Upload concluído!")
            print(f"   URL: {video_url}\n")
            
            return video_url
            
        except HttpError as e:
            print(f"❌ Erro HTTP ao fazer upload: {e}")
            
            # Verifica se é erro de limite de upload diário
            if 'uploadLimitExceeded' in str(e):
                print("\n" + "="*70)
                print("⚠️  LIMITE DIÁRIO DE UPLOADS ATINGIDO")
                print("="*70)
                print("\nO YouTube limita o número de vídeos que podem ser enviados")
                print("em um período de 24 horas (rolante).")
                print("\n📋 Informações importantes:")
                print("   • O limite é baseado em 24 horas ROLANTES (não dias de calendário)")
                print("   • Canais novos: ~10-15 vídeos/dia")
                print("   • Canais estabelecidos: ~50-100 vídeos/dia")
                print("   • O limite aumenta gradualmente com bom histórico do canal")
                print("\n⏰ Quando você poderá enviar novamente:")
                print("   • 24 horas após o PRIMEIRO upload de hoje")
                print("   • Exemplo: Primeiro upload às 10h → Próximo upload às 10h de amanhã")
                print("\n💡 Recomendação:")
                print("   • Execute o script novamente amanhã no mesmo horário")
                print("   • Considere usar --max-uploads 10 para evitar atingir o limite")
                print("\n" + "="*70)
                print("\n🛑 Parando execução. Não é possível enviar mais vídeos hoje.\n")
                # Retorna um código especial para indicar limite atingido
                return 'UPLOAD_LIMIT_EXCEEDED'
            
            return None
        except Exception as e:
            print(f"❌ Erro inesperado: {e}")
            return None
    
    def _build_title(self, lesson: Dict) -> str:
        """Constrói título do vídeo no formato: SIGLA | MÓDULO | 000 | NOME AULA"""
        MAX_LENGTH = 100
        
        # Extrai sigla do curso (usa campo 'acronym' ou gera do ID)
        course_id = self.metadata['course'].get('acronym', self.metadata['course']['id'].upper())
        
        module_title = lesson.get('module_title', '')
        section_order = str(lesson.get('section_order', 0)).zfill(3)  # 001, 002, etc.
        lesson_title = lesson['title']
        
        # Formato: SIGLA | MÓDULO | 000 | NOME AULA
        title = f"{course_id} | {module_title} | {section_order} | {lesson_title}"
        
        # Se ultrapassar 100 caracteres, trunca o nome da aula
        if len(title) > MAX_LENGTH:
            # Partes fixas do título
            prefix = f"{course_id} | {module_title} | {section_order} | "
            
            # Espaço disponível para o nome da aula
            available_space = MAX_LENGTH - len(prefix)
            
            # Trunca o nome da aula
            if available_space > 0:
                lesson_title = lesson_title[:available_space]
            
            # Reconstrói o título
            title = f"{prefix}{lesson_title}"
        
        return title
    
    def _build_description(self, lesson: Dict) -> str:
        """Constrói descrição do vídeo"""
        course_title = self.metadata['course']['title']
        module_title = lesson.get('module_title', '')
        section_title = lesson.get('section_title', '')
        
        description = f"{course_title}\n\n"
        description += f"Módulo {lesson.get('module_order', '')}: {module_title}\n"
        description += f"Seção {lesson.get('section_order', '')}: {section_title}\n"
        description += f"Aula {lesson.get('order', '')}: {lesson['title']}\n\n"
        
        if lesson.get('type') == 'live':
            description += "🔴 Gravação de aula ao vivo\n\n"
        
        description += "Este vídeo faz parte de um curso privado de gestão de fazendas leiteiras."
        
        return description
    
    def _build_tags(self, lesson: Dict) -> List[str]:
        """Constrói tags do vídeo"""
        tags = [
            'gestão rural',
            'pecuária leiteira',
            'gado de leite',
            'fazenda',
            'agronegócio'
        ]
        
        if lesson.get('type') == 'live':
            tags.append('aula ao vivo')
        
        return tags
    
    def _format_size(self, size_bytes: int) -> str:
        """Formata tamanho de arquivo"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
    
    def _parse_duration(self, iso_duration: str) -> int:
        """Converte duração ISO 8601 (ex: PT15M33S) para segundos"""
        import re
        
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
            print(f"⚠️  Erro ao buscar duração: {e}")
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
    
    def update_metadata_file(self, lesson_id: str, youtube_url: str, duration_seconds: Optional[int] = None):
        """Atualiza o arquivo JSON com a URL do YouTube e duração"""
        updated = False
        
        for module in self.metadata['course']['modules']:
            for section in module['sections']:
                for lesson in section['lessons']:
                    if lesson['id'] == lesson_id:
                        lesson['youtubeUrl'] = youtube_url
                        if duration_seconds is not None:
                            lesson['duration'] = duration_seconds
                        updated = True
                        break
                if updated:
                    break
            if updated:
                break
        
        if updated:
            # Salva JSON atualizado
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, indent=2, ensure_ascii=False)
            
            if duration_seconds:
                print(f"💾 Metadados atualizados (URL + duração: {self._format_duration(duration_seconds)})\n")
            else:
                print(f"💾 Metadados atualizados (URL)\n")
    
    def run(self, max_uploads: Optional[int] = None, delay: int = 5):
        """
        Executa o processo de upload
        
        Args:
            max_uploads: Número máximo de vídeos para enviar (None = todos)
            delay: Segundos de espera entre uploads
        """
        print("=" * 70)
        print("🎬 YouTube Video Uploader - Lecture Platform")
        print("=" * 70 + "\n")
        
        # Autentica
        self.authenticate()
        
        # Carrega metadados
        self.load_metadata()
        
        # Obtém lista de vídeos pendentes
        pending = self.get_pending_lessons(max_uploads)
        
        if not pending:
            print("✅ Todos os vídeos já foram enviados!")
            return
        
        print(f"📋 Vídeos pendentes: {len(pending)}")
        if max_uploads:
            print(f"🎯 Limite desta execução: {max_uploads} vídeos")
        print()
        
        # Processa cada vídeo
        success_count = 0
        fail_count = 0
        
        for i, lesson in enumerate(pending, 1):
            print(f"[{i}/{len(pending)}] Processando: {lesson['id']}")
            
            # Localiza arquivo de vídeo
            video_path = self.build_video_path(lesson)
            
            if not video_path:
                print(f"⚠️  Arquivo não encontrado: {lesson['fileName']}")
                self.progress['failed'].append({
                    'id': lesson['id'],
                    'reason': 'file_not_found',
                    'filename': lesson['fileName']
                })
                fail_count += 1
                print()
                continue
            
            # Faz upload
            youtube_url = self.upload_video(lesson, video_path)
            
            # Verifica se atingiu limite diário
            if youtube_url == 'UPLOAD_LIMIT_EXCEEDED':
                # Registra falha com razão específica
                self.progress['failed'].append({
                    'id': lesson['id'],
                    'reason': 'upload_limit_exceeded',
                    'filename': lesson['fileName']
                })
                fail_count += 1
                # Salva progresso antes de parar
                self._save_progress()
                # Para a execução imediatamente
                break
            elif youtube_url:
                # Extrai video_id da URL
                video_id = youtube_url.split('v=')[-1]
                
                # Busca duração do vídeo
                print(f"⏱️  Buscando duração do vídeo...")
                duration_seconds = self._get_video_duration(video_id)
                
                if duration_seconds:
                    print(f"✅ Duração: {self._format_duration(duration_seconds)}")
                
                # Atualiza JSON com URL e duração
                self.update_metadata_file(lesson['id'], youtube_url, duration_seconds)
                
                # Registra sucesso
                self.progress['uploaded'].append(lesson['id'])
                success_count += 1
            else:
                # Registra falha
                self.progress['failed'].append({
                    'id': lesson['id'],
                    'reason': 'upload_error',
                    'filename': lesson['fileName']
                })
                fail_count += 1
            
            # Salva progresso
            self._save_progress()
            
            # Aguarda antes do próximo upload (evita rate limiting)
            if i < len(pending):
                print(f"⏳ Aguardando {delay} segundos antes do próximo upload...\n")
                time.sleep(delay)
        
        # Resumo final
        print("=" * 70)
        print("📊 RESUMO DA EXECUÇÃO")
        print("=" * 70)
        print(f"✅ Sucessos: {success_count}")
        print(f"❌ Falhas: {fail_count}")
        print(f"📈 Total enviado até agora: {len(self.progress['uploaded'])}")
        print(f"📉 Pendentes: {len(self.get_pending_lessons())}")
        print("=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description='Upload de vídeos para YouTube com metadados do curso',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:
  # Upload de até 5 vídeos
  python youtube_uploader.py --videos-dir /path/to/videos --max-uploads 5
  
  # Upload de todos os vídeos pendentes
  python youtube_uploader.py --videos-dir /path/to/videos
  
  # Com delay customizado entre uploads
  python youtube_uploader.py --videos-dir /path/to/videos --max-uploads 10 --delay 10
  
  # Com arquivo de metadados customizado
  python youtube_uploader.py --videos-dir /path/to/videos --metadata-file outro-curso.json

Requisitos:
  1. Instalar dependências: pip install google-api-python-client google-auth-oauthlib
  2. Obter credenciais OAuth 2.0 do Google Cloud Console
  3. Salvar credenciais como 'client_secret.json' no diretório atual
        """
    )
    
    parser.add_argument(
        '--videos-dir',
        required=True,
        help='Diretório contendo os arquivos de vídeo'
    )
    
    parser.add_argument(
        '--max-uploads',
        type=int,
        default=None,
        help='Número máximo de vídeos para enviar (padrão: todos)'
    )
    
    parser.add_argument(
        '--delay',
        type=int,
        default=5,
        help='Segundos de espera entre uploads (padrão: 5)'
    )
    
    parser.add_argument(
        '--credentials',
        default=CREDENTIALS_FILE,
        help=f'Arquivo de credenciais OAuth 2.0 (padrão: {CREDENTIALS_FILE})'
    )
    
    parser.add_argument(
        '--metadata-file',
        default=DEFAULT_METADATA_FILE,
        help=f'Arquivo JSON com metadados do curso (padrão: {DEFAULT_METADATA_FILE})'
    )
    
    args = parser.parse_args()
    
    # Valida diretório de vídeos
    if not os.path.isdir(args.videos_dir):
        print(f"❌ Diretório não encontrado: {args.videos_dir}")
        sys.exit(1)
    
    # Executa uploader
    try:
        uploader = YouTubeUploader(args.videos_dir, args.credentials, args.metadata_file)
        uploader.run(max_uploads=args.max_uploads, delay=args.delay)
    except KeyboardInterrupt:
        print("\n\n⚠️  Upload interrompido pelo usuário.")
        print("   O progresso foi salvo e pode ser retomado posteriormente.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Erro fatal: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
