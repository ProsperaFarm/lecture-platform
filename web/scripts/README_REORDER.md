# Script de Reordenação do Módulo 04

Este script SQL reorganiza as seções do Módulo 04 "Produção e Conservação de Forragens" conforme a nova ordem definida no `course-metadata_copy.json`.

## Mudanças Aplicadas

### 1. Reordenação das Seções

**Antes:**
1. Silagem de Milho (section-04-01)
2. Planejamento forrageiro (section-04-02)
3. Cultura do Milho (section-04-03)
4. Nutrição e Manejo Alimentar (section-04-04)
5. Milho Reidratado (section-04-05)

**Depois:**
1. Planejamento forrageiro (section-04-02)
2. Manejo da Cultura do Milho (section-04-03)
3. Silagem de Milho (section-04-01)
4. Milho Reidratado (section-04-05)
5. Nutrição e Manejo Alimentar (section-04-04)

### 2. Atualização de Título

- **section-04-03**: "Cultura do Milho" → "Manejo da Cultura do Milho"

### 3. Movimentação de Lição

- **lesson-04-01-15**: "Doenças na cultura de milho"
  - Movida de `section-04-01` para `section-04-03`
  - Nova ordem dentro da seção: 5

## Como Executar

### Opção 1: Via psql (PostgreSQL)

```bash
# Conecte ao banco de dados
psql -h localhost -U seu_usuario -d nome_do_banco

# Execute o script
\i web/scripts/reorder-module-04-sections.sql
```

### Opção 2: Via cliente SQL do Supabase/Railway/etc

1. Copie o conteúdo de `web/scripts/reorder-module-04-sections.sql`
2. Cole no editor SQL do seu provedor
3. Execute o script

### Opção 3: Via script Node.js (recomendado)

```bash
cd web
node -e "
  const { Pool } = require('pg');
  const fs = require('fs');
  const sql = fs.readFileSync('scripts/reorder-module-04-sections.sql', 'utf8');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  pool.query(sql)
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Erro ao executar script:', err);
      process.exit(1);
    });
"
```

## Após Executar

1. Execute o sync para garantir que todas as lições estão sincronizadas:
   ```bash
   npm run db:sync
   ```

2. Verifique no frontend se a nova ordem está sendo exibida corretamente

3. Se necessário, recalcule as durações:
   ```bash
   npm run db:sync  # Já recalcula durações automaticamente
   ```

## Rollback (Se Necessário)

Se precisar reverter as mudanças, execute:

```sql
BEGIN;

-- Reverter ordem das seções
UPDATE sections 
SET "order" = CASE 
  WHEN "sectionId" = 'section-04-01' THEN 1
  WHEN "sectionId" = 'section-04-02' THEN 2
  WHEN "sectionId" = 'section-04-03' THEN 3
  WHEN "sectionId" = 'section-04-04' THEN 4
  WHEN "sectionId" = 'section-04-05' THEN 5
END
WHERE "sectionId" IN ('section-04-01', 'section-04-02', 'section-04-03', 'section-04-04', 'section-04-05')
  AND "moduleId" = 'module-04';

-- Reverter título
UPDATE sections 
SET title = 'Cultura do Milho'
WHERE "sectionId" = 'section-04-03';

-- Reverter lição (se necessário)
UPDATE lessons 
SET "sectionId" = 'section-04-01',
    "order" = 15
WHERE "lessonId" = 'lesson-04-01-15';

COMMIT;
```

## Validação

O script inclui verificações automáticas que exibem mensagens informativas:
- ✅ Confirmação de atualização das seções
- ✅ Verificação do título atualizado
- ✅ Listagem das lições da nova seção
- ✅ Ordem final das seções do módulo 04

Todas as verificações são executadas dentro de uma transação (`BEGIN`/`COMMIT`), então se algo falhar, todas as mudanças serão revertidas automaticamente.

