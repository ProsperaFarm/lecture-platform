# lecture-platform
Lecture Platform - FarmLecture

Portal privado estilo Udemy

## Objetivo
Portal 100% pessoal e privado para:
- Assistir aos vídeo-aulas (offline ou online)
- Marcar progresso (checklist + % assistido)
- Fazer anotações com timestamp (clica e pula no segundo exato)
- Ter interface moderna, rápida e responsiva (igual Udemy/Alura)
- Futuro: resumo automático por IA de cada aula

## Estrutura de conteúdo
Exemplo:
Curso - Gestão de Fazendas de Gado de Leite - Rehagro
├── Módulo 01 – Ciclo Essencial
├──── Seção 01 - 
|    ├── Seção 1 – Boas-vindas e Orientações
│    |    ├── Aula 1 – Boas-vindas e orientações
│    |    ├── Aula 2 – Conheça a equipe Rehagro
│    |    └── Aula 3 – Gravação ao vivo – Boas-vindas
├── Módulo 02 – Ciclo Eficiência Reprodutiva
...
├── Módulo 03 – Criação de Bezerras e Novilhas
...
├── Módulo 04 – Produção e Conservação de Forragens
...
├── Módulo 05 – Ciclo Gestão Financeira e Econômica
...
├── Módulo 06 – Ciclo Produção de Leite com Qualidade
...
└── Módulo 07 – Encerramento e Visão Estratégica
...

Cada módulo contém várias **Seções** temáticas  
Cada seção contém **Aulas** numeradas do 1 em diante (nunca repetidas dentro da seção)  
Gravações ao vivo ficam no final da seção correspondente

## Funcionalidades obrigatórias
- [ ] Upload dos vídeos no YouTube como unlisted
- [ ] Player com tracking de progresso (YouTube Iframe API)
- [ ] Marcação automática de “assistido” (>80%)
- [ ] Barra de progresso por seção/módulo/curso
- [ ] Notas com timestamp salvas no banco
- [ ] Busca global
- [ ] Modo escuro + responsivo + PWA
- [ ] Login privado (só você)

## Funcionalidades futuras
- [ ] Resumo por IA (Grok/Claude/OpenAI + transcript)
- [ ] Exportar/importar progresso e notas

## Stack (tudo grátis para uso pessoal)
- Frontend: Next.js 14+ App Router + TypeScript + TailwindCSS
- Banco & Auth: Supabase (PostgreSQL + Auth + Storage) – plano free cobre
- Hospedagem: Vercel (deploy 1-clique)
- Vídeos: YouTube unlisted + embed youtube-nocookie.com

## Status – Dezembro 2025
- Vídeos do 1o curso já baixados localmente (236 arquivos · ≈ 25 GB)
- Estrutura de módulos/seções/aulas definida
- Pendências:
  1. Com base na lista de arquivos atual, definir os meta-dados relacionados aos vídeos - em forma de JSON
  2. Script/funcionalidade para upload dos vídeos com os meta-dados relacionados em lote para YouTube, com limitador diário
  3. Projeto Next.js + Supabase rodando

5. `npm install && npm run dev`
