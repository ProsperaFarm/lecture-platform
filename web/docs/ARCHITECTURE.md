# Arquitetura da Solução - Prospera Academy

Este documento descreve a arquitetura técnica, decisões de design e fluxo de dados da plataforma web **Prospera Academy**.

## 🏗️ Visão Geral

A Prospera Academy é uma **Single Page Application (SPA)** estática ("Client-Side Only"), projetada para ser leve, rápida e de baixo custo de manutenção. Ela não depende de um backend dinâmico complexo para renderizar o conteúdo, utilizando arquivos JSON estáticos como "banco de dados".

### Diagrama de Arquitetura Simplificado

```mermaid
graph TD
    User[Usuário] -->|Acessa| CDN[CDN / Web Server]
    CDN -->|Entrega| SPA[React SPA (Frontend)]
    SPA -->|Lê| JSON[Static JSON Data]
    SPA -->|Embed| YT[YouTube Player (Privacy Mode)]
    
    subgraph "Frontend Layer"
        Router[Wouter Router]
        Pages[React Pages]
        Components[UI Components]
        Theme[Tailwind Theme]
    end
    
    SPA --- Router
    Router --> Pages
    Pages --> Components
    Components --> Theme
```

## 🧩 Componentes Principais

### 1. Frontend Core (React + Vite)
Utilizamos **React 19** com **Vite** para garantir performance máxima e uma experiência de desenvolvimento ágil. A escolha por uma SPA permite transições fluidas entre aulas sem recarregar a página inteira.

### 2. Gerenciamento de Estado e Dados
- **Dados Estáticos**: Todo o conteúdo do curso (estrutura de módulos, títulos, descrições, IDs de vídeo) é armazenado em arquivos JSON (`client/src/lib/courses-data.json`).
- **Vantagem**: Elimina a necessidade de banco de dados SQL/NoSQL para leitura, reduzindo latência e custos.
- **Atualização**: O JSON é atualizado via scripts de automação (Python) que processam os uploads de vídeo.

### 3. Roteamento (Wouter)
Optamos pelo **Wouter** em vez do React Router por ser significativamente menor (< 2KB) e oferecer uma API baseada em Hooks mais moderna e simples, ideal para projetos que não exigem roteamento complexo de servidor.

### 4. Estilização (Tailwind CSS 4 + shadcn/ui)
- **Design System**: Baseado em variáveis CSS nativas para temas (Dark/Light mode).
- **Identidade Visual**: Cores personalizadas "Verde Bandeira" e "Terracota" configuradas no `index.css`.
- **Componentes**: Utiliza a biblioteca **shadcn/ui**, que fornece componentes acessíveis e customizáveis sem acoplamento a uma biblioteca de estilos runtime.

### 5. Player de Vídeo (ReactPlayer)
Implementação customizada sobre a IFrame API do YouTube:
- **Privacidade**: Configurado com `modestbranding`, `rel=0` e `showinfo=0`.
- **Abstração**: O componente encapsula a lógica de embed, permitindo futura migração para outros provedores (Vimeo, Bunny.net) sem alterar as páginas de aula.

## 🔄 Fluxo de Dados

1. **Carregamento Inicial**: O navegador baixa o bundle JS/CSS otimizado.
2. **Hidratação de Dados**: A aplicação lê o `courses-data.json` importado estaticamente.
3. **Navegação**:
   - O usuário seleciona um curso -> Rota `/course/:id` carrega o Dashboard.
   - O usuário clica em uma aula -> Rota `/course/:id/lesson/:lessonId` carrega o Player.
4. **Renderização da Aula**:
   - O componente `LessonPage` busca os metadados da aula no JSON usando os IDs da URL.
   - Se `youtubeUrl` existir -> Renderiza o Player.
   - Se `youtubeUrl` for nulo -> Renderiza o estado "Aula em Breve".

## 🔒 Segurança e Privacidade

Embora seja uma aplicação estática pública, implementamos camadas de "Security by Obscurity" e UX defensiva:
- **Player White-label**: Dificulta o acesso direto ao link do YouTube.
- **Vídeos Unlisted**: Conteúdo não aparece em buscas públicas.
- **Validação de Rotas**: Redirecionamento automático para 404 ou Home se IDs de curso/aula forem inválidos.

## 🚀 Escalabilidade Futura

A arquitetura foi desenhada para permitir evolução:
1. **Autenticação**: Pode ser integrada via Auth0, Firebase ou Supabase sem reescrever o frontend.
2. **Backend**: O JSON estático pode ser substituído por chamadas API (REST/GraphQL) apenas alterando a camada de serviço de dados (`client/src/lib/courses-data.json` -> `api.getCourses()`).
3. **PWA**: Fácil conversão para Progressive Web App para suporte offline básico.
