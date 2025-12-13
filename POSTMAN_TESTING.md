# Como Testar Endpoints tRPC com Postman

O tRPC usa um formato específico de URL para as requisições. Aqui está como testar os endpoints no Postman.

## Configuração Base

- **Base URL**: `http://localhost:3000/api/trpc`
- **Method**: `GET` (para queries) ou `POST` (para mutations)
- **Content-Type**: `application/json`

## Formato das URLs

O tRPC com Express adapter usa o formato: `/api/trpc/{procedure}`

Onde `{procedure}` é o caminho do procedimento usando ponto como separador (ex: `progress.getStats`)

**Importante:** O tRPC aceita tanto GET quanto POST para queries. Para mutations, sempre use POST.

## Autenticação

Os endpoints de progresso requerem autenticação via cookie. Você precisa:

1. Fazer login primeiro (via navegador ou OAuth)
2. Copiar o cookie de sessão do navegador
3. Adicionar o cookie nas requisições do Postman

### Como obter o cookie:

1. Abra o navegador e faça login na aplicação
2. Abra as DevTools (F12)
3. Vá em **Application** > **Cookies** > `http://localhost:3000`
4. Copie o valor do cookie `manus-session` (ou o nome configurado em `COOKIE_NAME`)

## Exemplos de Requisições

### 1. Listar Cursos (sem autenticação)

**POST** `http://localhost:3000/api/trpc/courses.list`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{}
```

**Resposta esperada:**
```json
{
  "result": {
    "data": [
      {
        "courseId": "gestao-fazendas-gado-leite",
        "acronym": "GFGL",
        "title": "Gestão de Fazendas de Gado de Leite",
        ...
      }
    ]
  }
}
```

---

### 2. Obter Estatísticas de Progresso de um Curso ⭐ NOVO

Este é o novo endpoint que calcula as estatísticas de progresso no servidor.

**POST** `http://localhost:3000/api/trpc/progress.getStats`

**Headers:**
```
Content-Type: application/json
Cookie: manus-session=SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "courseId": "gestao-fazendas-gado-leite"
}
```

**Resposta esperada:**
```json
{
  "result": {
    "data": {
      "totalLessons": 25,
      "completedLessons": 10,
      "progressPercentage": 40,
      "watchedDuration": 3600,
      "totalDuration": 9000
    }
  }
}
```

**Nota:** Este endpoint retorna as mesmas estatísticas que são calculadas no frontend, mas agora calculadas no servidor para garantir consistência.

---

### 3. Obter Estatísticas de Múltiplos Cursos

**POST** `http://localhost:3000/api/trpc/progress.getStatsForMultiple`

**Headers:**
```
Content-Type: application/json
Cookie: manus-session=SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "courseIds": [
    "gestao-fazendas-gado-leite",
    "outro-curso-id"
  ]
}
```

---

### 4. Obter Progresso por Curso

**POST** `http://localhost:3000/api/trpc/progress.getByCourse`

**Headers:**
```
Content-Type: application/json
Cookie: manus-session=SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "courseId": "gestao-fazendas-gado-leite"
}
```

---

### 5. Obter Todas as Lições de um Curso

**POST** `http://localhost:3000/api/trpc/lessons.getWithDetails`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "courseId": "gestao-fazendas-gado-leite"
}
```

---

### 6. Toggle Completion (Mutation)

**POST** `http://localhost:3000/api/trpc/progress.toggleCompletion`

**Headers:**
```
Content-Type: application/json
Cookie: manus-session=SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "lessonId": "lesson-01-01-01",
  "courseId": "gestao-fazendas-gado-leite",
  "completed": true
}
```

---

## Dica: Usando o Postman Interceptor

Para facilitar, você pode usar o **Postman Interceptor** para capturar automaticamente os cookies do navegador:

1. Instale a extensão do Postman Interceptor no Chrome
2. Ative o Interceptor no Postman
3. Faça login no navegador
4. As requisições do Postman usarão automaticamente os cookies do navegador

---

## Coleção Postman

Você pode criar uma coleção Postman com estas requisições:

1. **Variáveis de Ambiente:**
   - `base_url`: `http://localhost:3000`
   - `session_cookie`: (cole o valor do cookie aqui)

2. **Pre-request Script** (para adicionar o cookie automaticamente):
```javascript
pm.request.headers.add({
    key: 'Cookie',
    value: `manus-session=${pm.environment.get('session_cookie')}`
});
```

---

## Troubleshooting

### Erro 401/403 (Não autorizado)
- Verifique se o cookie está correto
- Verifique se o cookie não expirou (eles expiram em 7 dias)
- Faça login novamente e copie o novo cookie

### Erro 400 (Bad Request)
- Verifique o formato do JSON no body
- Verifique se os parâmetros estão corretos (ex: `courseId` deve ser uma string)

### Erro 500 (Internal Server Error)
- Verifique os logs do servidor
- Verifique se o banco de dados está rodando

---

## Endpoints Disponíveis

### Courses
- `courses.list` - Lista todos os cursos
- `courses.getById` - Obtém um curso por ID

### Progress
- `progress.getAll` - Obtém todo o progresso do usuário
- `progress.getByCourse` - Obtém progresso de um curso
- `progress.getByLesson` - Obtém progresso de uma lição
- `progress.getStats` - **NOVO** - Obtém estatísticas de progresso de um curso
- `progress.getStatsForMultiple` - **NOVO** - Obtém estatísticas de múltiplos cursos
- `progress.upsert` - Atualiza/cria progresso
- `progress.toggleCompletion` - Alterna status de conclusão

### Lessons
- `lessons.getByCourse` - Obtém lições de um curso
- `lessons.getWithDetails` - Obtém lições com detalhes (módulos/seções)
- `lessons.getById` - Obtém uma lição por ID
- `lessons.getNext` - Obtém próxima lição
- `lessons.getPrevious` - Obtém lição anterior

### Auth
- `auth.me` - Obtém usuário atual
- `auth.logout` - Faz logout
- `auth.getGoogleAuthUrl` - Obtém URL de autenticação Google

