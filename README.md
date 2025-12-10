# Prospera Academy - Plataforma Web

Plataforma de ensino à distância (LMS) da **Prospera Farm**, desenvolvida para oferecer acesso aos cursos de capacitação técnica (como Gestão de Fazendas de Gado de Leite) de forma intuitiva e profissional.

## 🚀 Stack Tecnológica

O projeto foi construído utilizando uma arquitetura moderna e performática de Single Page Application (SPA):

- **Framework**: [React 19](https://react.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Roteamento**: [Wouter](https://github.com/molefrog/wouter) (leve e minimalista)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind)
- **Player de Vídeo**: [ReactPlayer](https://github.com/cookpete/react-player) (customizado para privacidade)
- **Ícones**: [Lucide React](https://lucide.dev/)

## 🛠️ Como Rodar Localmente

### Pré-requisitos

- **Node.js**: Versão 18 ou superior
- **Gerenciador de Pacotes**: npm

### Passo a Passo

1. **Clone o repositório** (se ainda não o fez):
   ```bash
   git clone https://github.com/ProsperaFarm/lecture-platform.git
   cd lecture-platform/web
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**:
   Abra seu navegador em `http://localhost:3000` (ou a porta indicada no terminal).

## 📦 Estrutura do Projeto

```
web/
├── client/
│   ├── public/          # Assets estáticos (imagens, favicon)
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis (UI, Layout)
│   │   ├── contexts/    # Contextos React (Tema, Estado Global)
│   │   ├── hooks/       # Hooks customizados
│   │   ├── lib/         # Utilitários e dados estáticos (JSON)
│   │   ├── pages/       # Páginas da aplicação (Home, Lesson, etc.)
│   │   ├── types/       # Definições de tipos TypeScript
│   │   ├── App.tsx      # Configuração de rotas e providers
│   │   └── main.tsx     # Ponto de entrada da aplicação
│   └── index.html       # Template HTML principal
├── server/              # Servidor estático simples (opcional para prod)
├── docs/                # Documentação da arquitetura
└── package.json         # Dependências e scripts
```

## 📝 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento com Hot Module Replacement (HMR).
- `npm run build`: Compila o projeto para produção na pasta `dist`.
- `npm run check`: Executa a verificação de tipos do TypeScript.
- `npm run db:push`: Gera e aplica migrações do banco de dados (Drizzle).
- `npm test`: Executa os testes unitários com Vitest.

## 📚 Documentação Adicional

- **[Guia de Arquitetura](./docs/ARCHITECTURE.md)**: Detalhes técnicos da solução Full-Stack.
- **[Opções de Autenticação](./docs/AUTH_OPTIONS.md)**: Manus OAuth vs Google OAuth direto.
- **[Setup do Google OAuth](./docs/GOOGLE_OAUTH_SETUP.md)**: Passo a passo completo para configurar Google Cloud Console.
- **[Guia de Deploy](./docs/DEPLOYMENT.md)**: Deploy em VPS, Vercel, Railway ou Cloud.
- **[Transição para Full-Stack](./docs/TRANSITION_TO_FULLSTACK.md)**: Razões para migrar de estático para Full-Stack.
- **[Privacidade de Vídeos](./VIDEO_PRIVACY_GUIDE.md)**: Limitações e alternativas para proteção de conteúdo.
