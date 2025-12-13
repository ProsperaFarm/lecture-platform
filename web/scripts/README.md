# Database Scripts

Scripts utilitários para gerenciamento do banco de dados da Prospera Academy.

## sync-from-json.mjs

Script para **sincronizar** o banco de dados com o arquivo `course-metadata.json` atualizado. Use este script após o uploader do YouTube adicionar novas URLs de vídeos ao JSON.

### Diferença entre seed e sync

- **`db:seed`** (seed-database.mjs): Popula o banco pela primeira vez (inicial)
- **`db:sync`** (sync-from-json.mjs): Atualiza o banco com mudanças do JSON (incremental)

### Quando usar

✅ **Use `npm run db:sync` quando:**
- O script do YouTube uploader adicionar novas URLs ao JSON
- O script `fetch_durations.py` adicionar durações ao JSON
- Você atualizar manualmente o JSON com novos vídeos ou durações
- Quiser sincronizar mudanças no título, descrição ou metadados

### Uso

```bash
# Sincronizar com JSON padrão (../uploader/course-metadata.json)
npm run db:sync

# Sincronizar com JSON customizado
node scripts/sync-from-json.mjs /caminho/para/seu/course-metadata.json
```

### O que o script faz

1. **Lê o arquivo JSON** atualizado pelo uploader ou `fetch_durations.py`
2. **Sincroniza o curso** (upsert na tabela `courses`)
3. **Sincroniza lessons** - Detecta mudanças comparando com o banco atual (URLs e durações)
4. **Sincroniza modules e sections** - Garante que existam no banco
5. **Calcula durações agregadas**:
   - **Sections**: Soma das durações de todas as lessons na seção
   - **Modules**: Soma das durações de todas as sections no módulo
   - **Course**: Soma das durações de todos os modules no curso
6. **Reporta novos vídeos e durações** adicionados desde a última sincronização

### Durações Agregadas

Quando uma lesson recebe ou atualiza sua duração, o script automaticamente recalcula:
- ✅ Duração da **section** (soma de todas as lessons)
- ✅ Duração do **module** (soma de todas as sections)
- ✅ Duração total do **course** (soma de todos os modules)

Isso garante que as durações estejam sempre atualizadas em todos os níveis da hierarquia.

### Saída esperada

```
🔄 Starting database sync from JSON...

📦 Connecting to database: postgresql://postgres:****@localhost:5432/prospera_academy
📖 Reading course data from: /path/to/uploader/course-metadata.json

✅ Loaded course: Gestão de Fazendas de Gado de Leite - Rehagro
   - Acronym: GFGL
   - Total Videos: 236
   - Modules: 7

📝 Syncing course...
✅ Course synced (ID: 1)

📝 Syncing lessons...
   ✨ New YouTube URL: Boas-vindas e orientações...
   ✨ New YouTube URL: Conheça a equipe e o contrato de convivência...
   ⏱️  New duration: Boas-vindas e orientações... (12m34s)
   ⏱️  New duration: Conheça a equipe e o contrato de convivência... (8m15s)

📝 Syncing modules and sections...

⏱️  Calculating aggregated durations...
✅ Aggregated durations calculated:
   - Sections: 25 updated
   - Modules: 7 updated
   - Course total duration: 45h23m

✅ Database synced successfully!
   - Total lessons processed: 236
   - New lessons added: 0
   - Existing lessons updated: 236
   - New YouTube URLs added: 2
   - New durations added: 2

🎉 2 new video(s) are now available to watch!
⏱️  2 video duration(s) have been updated!

🎉 Sync completed successfully!
```

### Workflow recomendado

1. **Upload de vídeos**: Execute o script do YouTube uploader (`youtube_uploader.py`)
2. **JSON atualizado**: O uploader adiciona URLs ao `course-metadata.json`
3. **Buscar durações** (opcional): Execute `fetch_durations.py` para adicionar durações
4. **Sincronize o banco**: `npm run db:sync`
5. **Vídeos disponíveis**: Usuários podem assistir imediatamente com durações exibidas

### Automação (opcional)

Você pode automatizar a sincronização adicionando ao final do script do uploader:

```python
# No final do youtube_uploader.py
import subprocess
subprocess.run(["npm", "run", "db:sync"], cwd="../web")
```

---

## seed-database.mjs

Script para popular o banco de dados com os metadados dos cursos a partir do arquivo `course-metadata.json`.

### Pré-requisitos

1. Banco de dados PostgreSQL rodando (via Docker ou outro método)
2. Schema do banco aplicado (`npm run db:push`)
3. Arquivo `course-metadata.json` disponível em `../uploader/course-metadata.json`

### Uso

```bash
# Com banco local (Docker)
npm run db:seed

# Com variável de ambiente customizada
DATABASE_URL="postgresql://user:pass@host:5432/dbname" npm run db:seed
```

### O que o script faz

1. **Conecta ao banco de dados** usando `DATABASE_URL` do `.env.local` ou `.env`
2. **Lê o arquivo JSON** com os metadados dos cursos
3. **Insere/atualiza o curso** na tabela `courses`
4. **Insere/atualiza todas as aulas** na tabela `lessons`
   - Preserva a hierarquia: curso → módulo → seção → aula
   - Mantém URLs do YouTube quando disponíveis
   - Marca aulas sem URL como pendentes

### Comportamento

- **Idempotente**: Pode ser executado múltiplas vezes sem duplicar dados
- **Upsert**: Atualiza registros existentes se já houver dados
- **Transacional**: Usa transações para garantir consistência (rollback em caso de erro)

### Saída esperada

```
🌱 Starting database seed...

📦 Connecting to database: postgresql://postgres:****@localhost:5432/prospera_academy

📖 Reading course data from: /path/to/uploader/course-metadata.json

✅ Loaded course: Gestão de Fazendas de Gado de Leite - Rehagro
   - Acronym: GFGL
   - Total Videos: 236
   - Modules: 7

📝 Inserting course...
✅ Course inserted/updated (ID: 1)

📝 Inserting lessons...
   Module 1: Ciclo Essencial
      Section 1: Boas-vindas e Orientações (4 lessons)
      Section 2: Planejamento e Sistema de Produção (15 lessons)
   ...

✅ Database seeded successfully!
   - Total lessons inserted: 236
   - Lessons with YouTube URLs: 150
   - Lessons pending upload: 86

🎉 Seed completed successfully!
```

### Troubleshooting

**Erro: "Connection refused"**
- Verifique se o PostgreSQL está rodando: `docker ps`
- Inicie o banco: `docker-compose -f ./docker/dev/docker-compose-dev.yaml up -d`

**Erro: "relation does not exist"**
- Execute as migrações primeiro: `npm run db:push`

**Erro: "Cannot find module"**
- Instale as dependências: `npm install`

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/prospera_academy` | Connection string do PostgreSQL |

### Estrutura de Dados

O script espera o seguinte formato no `course-metadata.json`:

```json
{
  "course": {
    "id": "gestao-fazendas-gado-leite",
    "acronym": "GFGL",
    "title": "Gestão de Fazendas de Gado de Leite - Rehagro",
    "description": "Curso completo de gestão de fazendas leiteiras",
    "totalVideos": 236,
    "modules": [
      {
        "id": "module-01",
        "order": 1,
        "title": "Ciclo Essencial",
        "sections": [
          {
            "id": "section-01-01",
            "order": 1,
            "title": "Boas-vindas e Orientações",
            "lessons": [
              {
                "id": "lesson-01-01-01",
                "order": 1,
                "title": "Boas-vindas e orientações",
                "type": "video",
                "youtubeUrl": "https://www.youtube.com/watch?v=..."
              }
            ]
          }
        ]
      }
    ]
  }
}
```
