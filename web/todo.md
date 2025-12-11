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

## 🎯 Add Branded Overlays on Top of Plyr
- [x] Manter Plyr player funcionando
- [x] Adicionar tarjas branded sobre pontos específicos do player
- [x] Bloquear cliques nas tarjas (pointer-events: auto + stopPropagation)
- [x] Tarjas aparecem APENAS quando pausado
- [x] Tarjas não reduzem tamanho do player (position absolute)
- [ ] Testar que links do YouTube não são acessíveis

## 🎬 Fix Overlays in Fullscreen and Loading States
- [x] Mostrar tarjas também em modo fullscreen (z-index 9999)
- [x] Detectar estado de loading do vídeo (waiting/playing events)
- [x] Mostrar tarjas durante carregamento (primeiros 5s)
- [x] Aumentar tamanho das tarjas em fullscreen
- [ ] Testar em fullscreen e durante loading

## ⏱️ Adjust Overlay Timing
- [x] Mostrar tarjas por 5 segundos APÓS vídeo começar a tocar
- [x] Remover lógica de loading state
- [x] Usar timeout de 5s após evento 'playing'
- [x] Corrigir tarjas não aparecendo em fullscreen (React Portal)
- [ ] Testar timing correto e fullscreen

## ⏱️ Adjust Overlay Timing V2
- [x] Manter lógica de isLoading (mostrar tarjas durante carregamento)
- [x] APÓS loading terminar, manter tarjas por mais 5 segundos
- [x] Usar isLoading OU showInitialOverlay para exibir tarjas
- [x] React Portal para fullscreen support
- [ ] Testar que tarjas aparecem durante loading + 5s após + fullscreen

## ⏱️ Refine Overlay Timing V3
- [x] Reduzir tempo de 5s para 3s
- [x] Mostrar overlay apenas na PRIMEIRA vez após carregar (não toda vez que toca)
- [x] Adicionar flag hasShownInitialOverlay para controlar
- [ ] Testar que overlay aparece apenas uma vez por carregamento de página

## 🐛 Fix Navigation Issues
- [x] Investigar lógica de "próxima aula" que está indo para aula aleatória
- [x] Verificar como a ordem das aulas está sendo determinada
- [x] Implementar navegação sequencial correta (módulo → seção → aula)

## 🗄️ Normalize Database Schema
- [x] Criar tabela `modules` separada (id, course_id, title, order)
- [x] Criar tabela `sections` separada (id, module_id, title, order)
- [x] Atualizar tabela `lessons` para referenciar section_id
- [x] Adicionar campos `order` em todas as tabelas para controle de sequência
- [x] Criar script de migração para dados existentes (migrate-to-normalized-schema.mjs)
- [x] Criar novo script de seed para estrutura normalizada (seed-database-normalized.mjs)
- [x] Criar helpers do banco (db-normalized.ts) com getNext/getPrevious
- [x] Criar tRPC procedures para estrutura normalizada (routers-normalized.ts)
- [x] Criar nova versão do Lesson.tsx (Lesson-normalized.tsx)
- [ ] Aplicar migração no banco de dados (npm run db:migrate:normalize)
- [ ] Testar navegação próximo/anterior
- [ ] Atualizar Home.tsx para usar nova estrutura
- [ ] Substituir arquivos antigos pelos novos

## 🔄 Simplify Navigation with Direct References
- [x] Remover campos desnecessários da tabela lessons (manter apenas IDs)
- [x] Adicionar campos nextLessonId e prevLessonId na tabela lessons
- [x] Atualizar seed para calcular e popular next/prev automaticamente
- [x] Simplificar helpers do banco (apenas buscar next/prev direto)
- [x] Atualizar tRPC procedures para usar campos diretos
- [x] Atualizar Lesson.tsx para ocultar botões quando não houver next/prev
- [ ] Aplicar schema (npm run db:reset)
- [ ] Popular dados (npm run db:seed:normalized)
- [ ] Testar navegação simplificada

## 🎨 Adjust Overlay Size
- [x] Reduzir tamanho das tarjas nos cantos
- [x] Garantir que não cubram conteúdo importante do vídeo
- [x] Manter branding visível mas discreto
- [ ] Testar visualização

## 🎨 Improve Top Overlay
- [x] Aumentar altura da tarja superior para cobrir botão "copiar link" (80px→100px, 100px→120px)
- [x] Deixar tarja superior mais escura (black/90→black/95, black/70→black/85)
- [x] Desabilitar clique direito no player de vídeo (já estava implementado)
- [ ] Testar cobertura do botão e clique direito

## 🚫 Fix Right-Click on Video
- [x] Adicionar overlay transparente sobre vídeo para bloquear clique direito (z-index: 5)
- [x] Aumentar tarja superior em 15% (100px→115px, 120px→138px)
- [ ] Testar clique direito em pause e fullscreen

## 🖱️ Fix Overlay Click Behavior
- [x] Remover overlay transparente (está bloqueando cliques esquerdos)
- [x] Usar CSS pointer-events: none no iframe do Plyr
- [x] Re-habilitar pointer-events nos controles do Plyr
- [x] Customizar cor do botão Play para verde floresta (green-600)
- [ ] Testar cliques e botão verde

## 🎮 Fix Bottom Overlay Blocking Controls
- [x] Tarja inferior está bloqueando controles do Plyr quando pausado
- [x] Posicionar tarja acima dos controles (bottom: 54px normal, 60px fullscreen)
- [x] Manter pointer-events-none para não bloquear cliques
- [x] Garantir que controles do Plyr fiquem acessíveis quando pausado
- [ ] Testar controles quando pausado

## 🎨 Improve Bottom Overlay Layout
- [x] Voltar gradiente para bottom: 0 (desde o fundo)
- [x] Aumentar altura total do overlay (154px/180px)
- [x] Aumentar z-index dos controles do Plyr para z-20 (acima do gradiente z-10)
- [x] Ajustar padding-bottom para posicionar texto acima dos controles
- [ ] Testar layout final

## 🎨 Customize Plyr Progress and Volume Colors
- [x] Mudar cor da barra de progresso para verde floresta (#16a34a)
- [x] Mudar cor do buffer para verde transparente (rgba 0.25)
- [x] Mudar cor da barra de volume para verde floresta (#16a34a)
- [ ] Testar cores no player

## 🔄 Revert Bottom Overlay Changes
- [x] Reverter commit 9f54d47 (altura e padding incorretos)
- [x] Voltar gradiente para altura original (100px/120px)
- [x] Voltar texto para posição original (p-4/p-6 sem padding-bottom extra)
- [x] Manter z-index: 20 nos controles (já está correto no CSS)
- [x] Controles ficam em bottom: 0 (posição normal) mas acima do gradiente (z-20 > z-10)
- [ ] Testar layout final

## 🎯 Position Text Above Controls
- [x] Separar texto do gradiente em div independente
- [x] Posicionar texto do curso 54px acima (normal) / 60px acima (fullscreen)
- [x] Aumentar z-index dos controles para z-50 (acima de tudo)
- [x] Manter gradiente em bottom: 0 com altura 100px/120px
- [ ] Testar layout final

## 🐛 Fix Controls Visibility
- [x] Remover `position: relative` dos controles (você já fez)
- [x] Manter gradiente em bottom: 0 (precisa cobrir logo do YouTube)
- [x] Adicionar fundo próprio aos controles (linear-gradient preto semi-transparente)
- [x] Controles com z-50 ficam acima do gradiente z-10
- [ ] Testar visibilidade dos controles

## 🔍 Debug Controls Z-Index Issue
- [x] Problema: Controles não ficam visíveis mesmo com z-50
- [x] Causa: Gradiente z-10 estava acima dos controles Plyr (z padrão)
- [x] Solução: Reduzir z-index do gradiente para z-1
- [x] Texto em z-2 (acima do gradiente, abaixo dos controles)
- [x] Controles Plyr com z-50 (acima de tudo)
- [ ] Testar visibilidade dos controles

## 🎬 Fix Controls Visibility When Paused
- [x] Problema acontece especificamente quando vídeo está pausado
- [x] Adicionar CSS para `.plyr--paused .plyr__controls` (z-50, opacity: 1, visibility: visible)
- [x] Adicionar CSS para `.plyr__control-bar` (z-50)
- [x] Forçar controles visíveis com !important
- [ ] Testar visibilidade em pause e play

## 🔄 New Strategy: Two Gradients
- [x] Criar gradiente fino (30px) em bottom: 0 para cobrir logo do YouTube
- [x] Criar gradiente principal (60px/80px) em bottom: 54px/60px para branding
- [x] Remover z-index complexo (deixar natural)
- [x] Controles ficam entre os dois gradientes (visíveis)
- [ ] Testar se YouTube fica coberto e controles visíveis

## 🎯 Optimize YouTube Cover Gradient
- [x] Mudar gradiente do YouTube para cobrir apenas bottom-right
- [x] Usar right: 0, width: 20% (últimos 20% da largura)
- [x] Manter altura de 30px
- [ ] Testar se cobre logo do YouTube

## 🔧 Adjust YouTube Cover
- [x] Aumentar altura de 30px para 54px (altura dos controles)
- [x] Mudar de retângulo preto para gradiente (right to left: from-black/95 via-black/70 to-transparent)
- [ ] Testar cobertura do logo do YouTube

## 🐛 Fix Bottom Gradient Covering Content
- [x] Gradiente inferior está cobrindo foto da coordenadora e informações do curso
- [x] Reduzir altura do gradiente inferior (60px/80px → 30px/40px)
- [x] Deixar gradiente mais transparente (black/95-80 → black/60-30)
- [ ] Testar que não cobre conteúdo importante

## ⏭️ Add Navigation Buttons Inside Player
- [x] Adicionar botões de seta (prev/next) dentro do player
- [x] Posicionar nos cantos (esquerda e direita, verticalmente centrados)
- [x] Mostrar apenas ao passar mouse sobre o player (isHovering state)
- [x] Adicionar tooltip com nome da aula ao hover no botão
- [x] Implementar navegação ao clicar (onNavigate callback)
- [x] Estilizar com fundo semi-transparente e ícones brancos
- [x] Adicionar props ao PlyrVideoPlayer (prevLessonId, nextLessonId, etc)
- [x] Atualizar Lesson.tsx para passar props e handler
- [ ] Testar navegação e tooltips

## 🐛 Fix Navigation Button Issues
- [x] Reduzir tamanho do texto do tooltip (text-sm → text-xs)
- [x] Permitir quebra de linha no tooltip (removido whitespace-nowrap, max-w-[200px])
- [x] Adicionar debug logs para investigar navegação
- [ ] Testar navegação e tooltip (aguardando feedback do usuário)

## 🐛 Fix Navigation Using Wrong ID
- [x] Navegação está usando `lesson.id` (UUID) em vez de `lesson.lessonId`
- [x] Corrigir Lesson.tsx para passar `lessonId` em vez de `id`
- [x] Testar navegação com IDs corretos

## 👤 Show User Name in Top Navigation Bar
- [x] Verificar estrutura atual do Layout.tsx
- [x] Adicionar useAuth() para obter dados do usuário
- [x] Exibir nome do usuário na barra superior
- [x] Testar exibição do nome

## 📂 Collapsible Sidebar with Improved Scrolling
- [x] Adicionar botão de toggle para fechar/abrir sidebar
- [x] Implementar estado de sidebar (aberta/fechada)
- [x] Melhorar ScrollArea para acessar todas as 236 aulas
- [x] Ajustar layout quando sidebar está fechada
- [x] Adicionar transição suave ao abrir/fechar
- [x] Testar rolagem vertical com muitas aulas

## 🐛 Fix Invalid URL Error in useAuth
- [x] Investigar erro "Invalid URL" no getLoginUrl
- [x] Verificar variáveis de ambiente necessárias
- [x] Corrigir const.ts ou useAuth hook
- [x] Testar que TopBar funciona sem erro

## 🔧 Remove Manus OAuth Dependency from useAuth
- [x] Simplificar useAuth para não chamar getLoginUrl() por padrão
- [x] useAuth deve funcionar sem variáveis de ambiente do Manus
- [x] Manter apenas Google OAuth (já configurado)
- [x] Testar que TopBar funciona normalmente

## 🐛 Fix Layout Error and Add TopBar to Course Selection
- [x] Corrigir erro no Layout quando curso não é encontrado
- [x] Layout deve funcionar sem quebrar quando currentCourse é null
- [x] Adicionar TopBar na página de seleção de cursos (Home.tsx)
- [x] Testar ambas as páginas (seleção de cursos e lesson)

## 👤 Improve TopBar User Menu
- [x] Remover "Bem-vindo" do TopBar (mostrar apenas nome)
- [x] Adicionar DropdownMenu ao clicar no nome do usuário
- [x] Adicionar opção "Sair" no dropdown
- [x] Implementar logout ao clicar em "Sair"
- [x] Testar funcionalidade de logout

## 🏠 Platform Name and Navigation Improvements
- [x] Adicionar "Prospera Academy" na TopBar (ambos layouts)
- [x] Criar página de lista de todos os cursos (/)
- [x] Adicionar botão "Voltar para cursos" na página de curso único
- [x] Verificar e corrigir problemas de navegação/links travados
- [x] Testar navegação entre todas as páginas

## 🐛 Fix Courses List Page Not Showing Courses
- [x] Verificar se endpoint courses.getAll existe
- [x] Criar ou corrigir query para listar todos os cursos
- [x] Testar que a página de cursos mostra os cursos disponíveis

## 🐛 Fix Module and Section Names on Course Detail Page
- [x] Verificar como módulos e seções estão sendo exibidos
- [x] Corrigir nomes dos módulos para mostrar títulos corretos
- [x] Corrigir nomes das seções para mostrar títulos corretos
- [x] Testar exibição na página de detalhes do curso

## 🚨 CRITICAL: Fix Infinite auth.me Query Loop
- [x] Identificar causa do loop infinito de navegação
- [x] Remover ou corrigir useEffect que causa navegação repetida
- [x] Atualizar Layout.tsx para usar tRPC em vez de courses-data.json
- [x] Corrigir useAuth hook para evitar re-fetches infinitos
- [x] Adicionar configurações de cache/staleTime nas queries tRPC
- [x] Testar que auth.me não é chamado infinitamente

## ⏱️ Add Video Duration Tracking
- [x] Modificar youtube_uploader.py para buscar duração após upload
- [x] Adicionar campo `duration` (em segundos) no course-metadata.json
- [x] Criar script fetch_durations.py para buscar durações de vídeos já enviados
- [x] Adicionar coluna `duration` na tabela `lessons` do banco
- [x] Atualizar seeding para incluir duração
- [x] Exibir duração total por módulo/seção/curso na interface
- [ ] Testar busca de duração via YouTube API

## 🗄️ Local Database Setup
- [x] Criar script SQL para inicializar banco de dados local
- [x] Documentar processo de setup do banco local
- [ ] Testar criação de tabelas localmente

## ⚡ Optimize Duration Calculations with Pre-calculated Fields
- [x] Adicionar coluna `totalDuration` na tabela `sections`
- [x] Adicionar coluna `totalDuration` na tabela `modules`
- [x] Adicionar coluna `totalDuration` na tabela `courses`
- [x] Atualizar seeding para calcular e armazenar totalDuration
- [x] Atualizar queries para usar totalDuration pré-calculado
- [x] Remover cálculos de duração em tempo real no frontend

## 🐛 Add Missing Users Table to init-database.sql
- [x] Adicionar tabela users ao init-database.sql
- [ ] Testar criação completa do banco local

## ✅ User Progress Tracking System
- [x] Criar endpoints tRPC para marcar/desmarcar aula como completa
- [x] Criar endpoint para buscar progresso do usuário por curso
- [x] Adicionar detecção automática de conclusão no player (90% ou últimos 30s)
- [x] Adicionar checkbox na sidebar para marcação manual
- [x] Adicionar indicadores visuais (check verde para completo, line-through)
- [x] Exibir progresso na TopBar: "Prospera Academy | Nome do curso - Seu progresso 2% (4/200)"
- [x] Exibir contagem de aulas completas nas seções: "Boas-vindas e Orientações 3/4"
- [x] Exibir contagem de aulas completas nos módulos: "X/Y aulas"
- [x] Calcular e exibir % de conclusão do curso completo
- [ ] Testar marcação automática e manual

## 🐛 Sidebar UI Improvements (Dec 10, 2024)
- [x] Corrigir checkbox que não responde ao clique (usar onCheckedChange corretamente)
- [x] Corrigir atualização automática sem refresh (trpc.useUtils() para invalidação)
- [x] Remover ícone PlayCircle das aulas (redundante com checkbox)
- [x] Converter módulos para Accordion colapsável (shadcn/ui)
- [x] Exibir progresso no header do módulo: "X/Y | HHhMMm"
- [x] Todos os módulos abertos por padrão para melhor UX
