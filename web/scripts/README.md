# Database Scripts

Scripts utilitários para gerenciamento do banco de dados da Prospera Academy.

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
