# Opções de Autenticação - Prospera Academy

Este documento explica as opções de autenticação disponíveis para a plataforma e como migrar para Google OAuth independente.

## Situação Atual

O projeto foi inicializado com o template `web-db-user` que inclui autenticação via **Manus OAuth**. Este sistema funciona como um **proxy OAuth** que abstrai múltiplos provedores (Google, GitHub, Email) em uma única interface.

### Como Funciona (Manus OAuth)

```
Usuário clica em "Login"
  ↓
Redirecionado para Manus Auth Server (api.manus.im)
  ↓
Manus redireciona para Google/GitHub/etc.
  ↓
Usuário autentica
  ↓
Google retorna para Manus
  ↓
Manus retorna para sua aplicação com JWT
  ↓
Aplicação salva sessão
```

### Vantagens do Manus OAuth

- **Zero configuração**: Funciona out-of-the-box.
- **Múltiplos provedores**: Google, GitHub, Email sem código extra.
- **Gerenciamento de usuários**: Interface admin para visualizar usuários.
- **Segurança**: Tokens JWT assinados e validados.

### Desvantagens do Manus OAuth

- **Dependência externa**: Requer conectividade com `api.manus.im`.
- **Controle limitado**: Não é possível customizar o fluxo OAuth completamente.
- **Vendor lock-in**: Migração futura pode ser trabalhosa.

## Opção 1: Usar Manus OAuth com Google (Recomendado para MVP)

Se você quer lançar rapidamente e não se importa com a dependência do Manus, **não precisa fazer nada**. O sistema já está configurado e funciona com Google OAuth através do Manus.

**Passos:**

1. Usuários fazem login via interface do Manus
2. Escolhem "Continuar com Google"
3. Autenticam e são redirecionados de volta

**Configuração necessária:** Nenhuma (já está funcionando).

## Opção 2: Google OAuth Direto (Independente)

Se você quer **total controle** e **independência** do Manus, você precisará implementar Google OAuth diretamente usando Passport.js ou similar.

### Arquitetura Proposta

```
Usuário clica em "Login com Google"
  ↓
Redirecionado para accounts.google.com
  ↓
Usuário autentica
  ↓
Google retorna para /api/auth/callback/google
  ↓
Backend valida token e cria sessão
  ↓
Usuário autenticado
```

### Implementação

#### 1. Instalar Dependências

```bash
pnpm add passport passport-google-oauth20 express-session
pnpm add -D @types/passport @types/passport-google-oauth20 @types/express-session
```

#### 2. Configurar Passport.js

**Arquivo: `server/auth/passport.ts`**

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar usuário existente
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.openId, profile.id));

        if (existingUser) {
          // Atualizar lastSignedIn
          await db
            .update(users)
            .set({ lastSignedIn: new Date() })
            .where(eq(users.id, existingUser.id));
          return done(null, existingUser);
        }

        // Criar novo usuário
        const [newUser] = await db
          .insert(users)
          .values({
            openId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            loginMethod: 'google',
            role: 'user',
          })
          .$returningId();

        const [createdUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, newUser.id));

        return done(null, createdUser);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
```

#### 3. Configurar Rotas de Autenticação

**Arquivo: `server/routes/auth.ts`**

```typescript
import express from 'express';
import passport from '../auth/passport';

const router = express.Router();

// Inicia o fluxo OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['openid', 'email', 'profile'],
}));

// Callback do Google
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Sucesso - redireciona para home
    res.redirect('/');
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.redirect('/');
  });
});

// Status de autenticação
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;
```

#### 4. Integrar no Express

**Arquivo: `server/index.ts`**

```typescript
import express from 'express';
import session from 'express-session';
import passport from './auth/passport';
import authRoutes from './routes/auth';

const app = express();

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.use('/api/auth', authRoutes);

// ... resto do código
```

#### 5. Criar Hook useAuth Customizado

**Arquivo: `client/src/hooks/useGoogleAuth.ts`**

```typescript
import { useEffect, useState } from 'react';
import type { User } from '@/../../drizzle/schema';

export function useGoogleAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = () => {
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
```

#### 6. Substituir useAuth nas Páginas

**Antes:**
```typescript
import { useAuth } from '@/_core/hooks/useAuth';
```

**Depois:**
```typescript
import { useGoogleAuth as useAuth } from '@/hooks/useGoogleAuth';
```

### Variáveis de Ambiente

Adicione ao `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=your-random-secret-string
```

## Comparação

| Aspecto | Manus OAuth | Google OAuth Direto |
|---------|-------------|---------------------|
| **Setup** | Zero config | Requer implementação |
| **Dependências** | Manus API | Google APIs |
| **Controle** | Limitado | Total |
| **Provedores** | Google, GitHub, Email | Apenas Google (ou adicionar mais) |
| **Manutenção** | Baixa | Média |
| **Vendor Lock-in** | Sim | Não |
| **Tempo de implementação** | 0 horas | 2-4 horas |

## Recomendação

**Para MVP/Protótipo:** Use Manus OAuth (Opção 1) - já está funcionando.

**Para Produção de Longo Prazo:** Implemente Google OAuth Direto (Opção 2) para independência total.

**Migração Gradual:** Você pode começar com Manus OAuth e migrar depois. Os dados de usuários no banco (`users` table) são compatíveis, apenas o `openId` mudará de formato (Manus ID → Google ID).

## Próximos Passos

1. Decida qual opção usar
2. Se escolher Opção 2, siga o guia `GOOGLE_OAUTH_SETUP.md` para obter credenciais
3. Implemente o código acima
4. Teste localmente
5. Deploy em produção

## Referências

- [Passport.js Documentation](http://www.passportjs.org/)
- [Passport Google OAuth 2.0 Strategy](https://www.passportjs.org/packages/passport-google-oauth20/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
