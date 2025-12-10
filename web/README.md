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
- **Gerenciador de Pacotes**: pnpm (recomendado), npm ou yarn

### Passo a Passo

1. **Clone o repositório** (se ainda não o fez):
   ```bash
   git clone https://github.com/ProsperaFarm/lecture-platform.git
   cd lecture-platform/web
   ```

2. **Instale as dependências**:
   ```bash
   pnpm install
   # ou
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   pnpm dev
   # ou
   npm run dev
   ```

4. **Acesse a aplicação**:
   Abra seu navegador em `http://localhost:5173` (ou a porta indicada no terminal).

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

- `pnpm dev`: Inicia o servidor de desenvolvimento com Hot Module Replacement (HMR).
- `pnpm build`: Compila o projeto para produção na pasta `dist`.
- `pnpm preview`: Visualiza a versão de produção localmente.
- `pnpm check`: Executa a verificação de tipos do TypeScript.

## 📚 Documentação Adicional

Para detalhes sobre a arquitetura e decisões técnicas, consulte [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
Para informações sobre privacidade de vídeo, veja [VIDEO_PRIVACY_GUIDE.md](./VIDEO_PRIVACY_GUIDE.md).
