# Prospera Academy - TODO

## ✅ Concluído
- [x] Estrutura básica da plataforma (SPA estática)
- [x] Player de vídeo white-label (ReactPlayer)
- [x] Suporte multi-curso
- [x] Upgrade para Full-Stack (Database + Auth)

## 🔄 Em Andamento
- [ ] Resolver conflito no Home.tsx (merge template vs código customizado)
- [x] Configurar schema do banco de dados (cursos, progresso, notas, avaliações)
- [ ] Implementar sistema de login/autenticação

## 📋 Próximas Funcionalidades
- [ ] Tracking de progresso de aulas por usuário (multi-device via DB)
- [ ] Sistema de anotações pessoais em pontos do vídeo
- [ ] Sistema de avaliação (gostei/não gostei/estrelas) por vídeo/curso
- [ ] Área de administrador para gerenciar cursos
- [ ] Suporte a PDFs/Slides como materiais de curso
- [ ] Geração de sumário de texto dos vídeos para contexto de IA
- [ ] Certificados de conclusão automáticos (PDF)
- [ ] Busca global de aulas
- [ ] Modo teatro (expandir vídeo)

## 🔧 Configuração de Infraestrutura
- [ ] Decidir entre Manus OAuth (atual) ou Google OAuth direto (ver AUTH_OPTIONS.md)
- [ ] Se Google OAuth direto: Implementar Passport.js conforme AUTH_OPTIONS.md
- [x] Criar guia de setup do Google Cloud Console
- [ ] Atualizar variáveis de ambiente para Google OAuth
- [x] Documentar deploy em infraestrutura própria (VPS/Cloud)
- [ ] Testar fluxo de login com Google

## 🚀 Deploy Vercel + Supabase
- [x] Migrar schema Drizzle de MySQL para PostgreSQL
- [ ] Criar projeto no Supabase e obter connection string (ver docs/VERCEL_SUPABASE_DEPLOY.md)
- [ ] Configurar variáveis de ambiente no Vercel (ver docs/VERCEL_SUPABASE_DEPLOY.md)
- [x] Criar vercel.json com configurações de build
- [ ] Testar deploy em preview
- [ ] Deploy em produção
- [ ] Configurar domínio customizado (academy.prospera.farm)

## 🐳 Ambiente Local com Docker
- [x] Configurar docker-compose.yml com PostgreSQL
- [x] Criar script de inicialização do banco (init.sql)
- [ ] Atualizar .env.local com DATABASE_URL do Docker
- [ ] Testar aplicação localmente com Docker
- [ ] Documentar setup local no README

## 📝 SQL e Documentação
- [x] Criar arquivo SQL completo com DDL (CREATE TABLE)
- [x] Atualizar README com comandos npm (ao invés de pnpm)

## 🐛 Correções Urgentes
- [x] Resolver conflito de dependências do Vite 7 com @builder.io/vite-plugin-jsx-loc
- [ ] Testar npm install com --legacy-peer-deps
- [x] Atualizar README com instruções de instalação corretas

## 🌱 Database Seeding
- [x] Criar script de seed para popular courses e lessons
- [x] Adicionar comando npm run db:seed
- [ ] Testar importação dos dados do course-metadata.json

## 🎨 UI Restoration
- [x] Recuperar código original do Home.tsx do histórico git
- [x] Adaptar UI para usar tRPC ao invés de JSON estático
- [x] Criar procedures tRPC para courses e lessons
- [ ] Testar exibição de cursos, módulos e aulas

## 🔄 Database Sync
- [x] Criar script de sincronização que atualiza DB a partir do JSON
- [x] Adicionar comando npm run db:sync
- [x] Documentar uso do script após uploads do YouTube

## 🐛 Server Files Missing
- [x] Verificar e copiar arquivos do diretório server/_core
- [x] Garantir que todos os arquivos do servidor estejam no repositório
- [ ] Testar npm run dev localmente

## 🐛 Missing Config Files
- [x] Corrigir vite.config.ts para remover plugin incompatível
- [x] Copiar diretório shared/ completo
- [x] Copiar arquivos de configuração (tsconfig, drizzle.config, etc)

## 🔐 Replace Manus OAuth with Google OAuth
- [x] Atualizar env.ts para usar GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
- [x] Implementar fluxo de Google OAuth no servidor
- [ ] Criar componente de login no cliente
- [ ] Criar página de callback do Google OAuth
- [ ] Documentar setup do Google OAuth

## 🔥 Remove Manus OAuth Completely
- [x] Remover logs de erro do OAUTH_SERVER_URL no sdk.ts
- [x] Simplificar context.ts para usar apenas Google OAuth
- [x] Testar que não há mais erros de OAuth do Manus

## 🐛 Missing Client Files
- [x] Copiar diretório client/src/lib completo (trpc.ts, utils.ts)
- [x] Adicionar variáveis de ambiente opcionais ao .env.example
- [x] Remover erro do OAuth do Manus no repositório GitHub

## 🔐 Authentication & Route Protection
- [x] Criar página de Login com botão Google OAuth
- [x] Criar página de callback do Google (/auth/google/callback)
- [x] Adicionar proteção de rotas no Home (redirecionar para login se não autenticado)
- [x] Atualizar App.tsx com rotas de autenticação
- [ ] Testar fluxo completo de login

## 🐛 Fix Google OAuth Redirect URL
- [ ] Corrigir GOOGLE_REDIRECT_URI no .env.example
- [ ] Atualizar documentação com URL correta
- [ ] Testar fluxo completo de login com URL corrigida

## 🐛 Fix OAuth invalid_grant Error
- [ ] Verificar se GOOGLE_REDIRECT_URI no backend está correta
- [ ] Adicionar logs de debug no google-oauth.ts
- [ ] Testar troca de código por token

## 🐛 Fix Double OAuth Code Usage
- [x] Adicionar proteção contra múltiplas chamadas no GoogleCallback
- [x] Usar useRef para evitar double render do React Strict Mode
- [ ] Testar que código é usado apenas uma vez

## 🐛 Fix Session Cookie Not Persisting
- [x] Verificar se cookie está sendo setado no googleCallback
- [x] Corrigir sameSite para 'lax' em localhost (HTTP)
- [x] Adicionar logs para debug de sessão
- [ ] Testar login completo com cookie persistente

## 🐛 Fix JWT Payload Fields
- [x] Verificar campos esperados pelo context.ts (openId, appId, name)
- [x] Ajustar JWT payload no googleCallback para incluir appId
- [ ] Testar autenticação completa

## 🎥 Create Lesson Video Page
- [ ] Criar página LessonView.tsx com player do YouTube
- [ ] Adicionar rota /course/:courseId/lesson/:lessonId no App.tsx
- [ ] Buscar dados da aula do banco via tRPC
- [ ] Exibir título, descrição e vídeo do YouTube
- [ ] Adicionar navegação entre aulas (anterior/próxima)

## 🐛 Fix Video Player Not Loading
- [ ] Verificar se react-player está instalado no package.json
- [ ] Verificar se lesson tem youtubeUrl no banco de dados
- [ ] Adicionar logs de debug no componente LessonView
- [ ] Testar com URL de vídeo hardcoded

## 🔄 Migrate Lesson.tsx to use tRPC
- [x] Remover import do courses-data.json
- [x] Usar trpc.lessons.getById para buscar aula
- [x] Usar trpc.courses.getById para buscar curso
- [ ] Testar que vídeos do banco aparecem corretamente

## 🎥 Implement White-Label Video Player
- [x] Substituir ReactPlayer por iframe YouTube direto
- [x] Adicionar overlay para bloquear acesso aos controles
- [x] Desabilitar clique direito no player
- [x] Usar youtube-nocookie.com
- [ ] Testar que usuário não consegue link facilmente

## 🐛 Fix lessons.getById 404 Error
- [ ] Verificar se procedure está registrada no appRouter
- [ ] Verificar se servidor foi reiniciado
- [ ] Testar endpoint manualmente

## 🎬 Implement Plyr Video Player
- [x] Criar componente PlyrVideoPlayer com CDN
- [x] Substituir WhiteLabelVideoPlayer por PlyrVideoPlayer
- [x] Configurar controles customizados (sem share/copy)
- [x] Usar youtube-nocookie.com
- [ ] Testar que player funciona corretamente

## 🎭 Add CSS Overlay to Hide YouTube Buttons When Paused
- [x] Adicionar camadas CSS que cobrem botões quando vídeo pausa
- [x] Integrar YouTube IFrame API para detectar estado
- [x] Adicionar botão customizado "Continuar" quando pausado
- [ ] Testar que botões do YouTube ficam ocultos

## 🎨 Add Branded Overlay When Video Paused
- [x] Adicionar logo da plataforma (Prospera Academy) no overlay
- [x] Mostrar informações do curso/módulo/aula
- [x] Tornar overlay visualmente atraente com gradientes
- [ ] Testar que overlay cobre botões do YouTube
