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
