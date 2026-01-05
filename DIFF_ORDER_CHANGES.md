# Diferenças entre course-metadata_copy.json e course-data.json

## Resumo das Alterações

O arquivo `course-metadata_copy.json` foi reorganizado para melhorar a ordem lógica do conteúdo. As principais mudanças são:

---

## **Módulo 04 - Produção e Conservação de Forragens**

### Reordenação das Seções:

**ANTES (course-data.json):**
1. section-04-01: "Silagem de Milho" (order: 1)
2. section-04-02: "Planejamento forrageiro" (order: 2)
3. section-04-03: "Cultura do Milho" (order: 3)
4. section-04-04: "Nutrição e Manejo Alimentar" (order: 4)
5. section-04-05: "Milho Reidratado" (order: 5)

**DEPOIS (course-metadata_copy.json):**
1. section-04-02: "Planejamento forrageiro" (order: 2) ← Movido para primeiro
2. section-04-03: "Manejo da Cultura do Milho" (order: 3) ← Título alterado e movido para segundo
3. section-04-01: "Silagem de Milho" (order: 1) ← Movido para terceiro
4. section-04-05: "Milho Reidratado" (order: 5) ← Mantido
5. section-04-04: "Nutrição e Manejo Alimentar" (order: 4) ← Mantido

**Justificativa:** A nova ordem segue uma lógica mais didática: primeiro o planejamento forrageiro, depois o manejo da cultura, depois a silagem, reidratação e nutrição.

### Mudanças na Seção "Manejo da Cultura do Milho" (section-04-03):

**Título alterado:**
- ANTES: "Cultura do Milho"
- DEPOIS: "Manejo da Cultura do Milho"

**Nova lição adicionada:**
- `lesson-04-01-15`: "Doenças na cultura de milho" (order: 15, fileName: "Videoaula 15Doenças na cultura de milho.mp4")
  - Esta lição está na seção section-04-03 no copy, mas tem ID `lesson-04-01-15` (pertencia à section-04-01)
  - No copy, ela aparece com order 15 dentro da seção 04-03

**Troca de lições entre seções:**
- `lesson-04-01-01`: "Principais desafios na produção de silagem"
  - ANTES: section-04-01, order: 1
  - DEPOIS: section-04-02, order: 1
  
- `lesson-04-02-01`: "Silagem de milho"
  - ANTES: section-04-02, order: 1
  - DEPOIS: section-04-01, order: 1

**Nota:** As outras lições das seções 04-01 e 04-02 terão suas ordens ajustadas automaticamente (+1) após essas trocas.

---

## **Módulo 03 - Criação de Bezerras e Novilhas**

### Reordenação das Seções:

**ANTES (course-data.json):**
1. section-03-01: "Manejo Inicial e Parto" (order: 1)
2. section-03-02: "Colostragem" (order: 2)
3. section-03-03: "Nutrição e Dieta" (order: 3)
4. section-03-04: "Recria de Novilhas" (order: 4)
5. section-03-05: "Sistemas e Primeiros Cuidados" (order: 5)
6. section-03-06: "Doenças e Tratamentos" (order: 6)
7. section-03-07: "Programa Sanitário" (order: 7)

**DEPOIS (course-metadata_copy.json):**
1. section-03-01: "Manejo Inicial e Parto" (order: 1) ← Mantido
2. section-03-02: "Colostragem" (order: 2) ← Mantido
3. section-03-03: "Nutrição e Dieta" (order: 3) ← Mantido
4. section-03-04: "Recria de Novilhas" (order: 4) ← Mantido
5. section-03-05: "Sistemas e Primeiros Cuidados" (order: 5) ← Mantido
6. section-03-06: "Doenças e Tratamentos" (order: 6) ← Mantido
7. section-03-07: "Programa Sanitário" (order: 7) ← Mantido

**Resultado:** Nenhuma mudança na ordem das seções do Módulo 03.

---

## Lista de Atualizações Necessárias no Banco de Dados

### 1. Atualizar a ordem das seções do Módulo 04:

```sql
-- Reordenar seções do módulo 04
UPDATE sections 
SET "order" = CASE 
  WHEN id = 'section-04-02' THEN 1  -- Planejamento forrageiro (primeiro)
  WHEN id = 'section-04-03' THEN 2  -- Manejo da Cultura do Milho (segundo)
  WHEN id = 'section-04-01' THEN 3  -- Silagem de Milho (terceiro)
  WHEN id = 'section-04-05' THEN 4  -- Milho Reidratado (quarto)
  WHEN id = 'section-04-04' THEN 5  -- Nutrição e Manejo Alimentar (quinto)
END
WHERE id IN ('section-04-01', 'section-04-02', 'section-04-03', 'section-04-04', 'section-04-05')
  AND module_id = (SELECT id FROM modules WHERE id = 'module-04');
```

### 2. Atualizar título da seção section-04-03:

```sql
UPDATE sections 
SET title = 'Manejo da Cultura do Milho'
WHERE id = 'section-04-03';
```

### 3. Trocar lições entre section-04-01 e section-04-02:

```sql
-- Mover lesson-04-01-01 para section-04-02
UPDATE lessons 
SET "sectionId" = 'section-04-02',
    "order" = 1
WHERE "lessonId" = 'lesson-04-01-01';

-- Mover lesson-04-02-01 para section-04-01
UPDATE lessons 
SET "sectionId" = 'section-04-01',
    "order" = 1
WHERE "lessonId" = 'lesson-04-02-01';

-- Ajustar ordem das outras lições (+1)
UPDATE lessons 
SET "order" = "order" + 1
WHERE "sectionId" = 'section-04-01'
  AND "lessonId" NOT IN ('lesson-04-02-01', 'lesson-04-01-15')
  AND "order" >= 1;

UPDATE lessons 
SET "order" = "order" + 1
WHERE "sectionId" = 'section-04-02'
  AND "lessonId" != 'lesson-04-01-01'
  AND "order" >= 1;
```

### 4. Mover lição "Doenças na cultura de milho" para section-04-03:

```sql
-- Verificar se a lição existe e atualizar a section_id
UPDATE lessons 
SET "sectionId" = 'section-04-03',
    "order" = 6  -- Nova ordem dentro da seção 04-03 (após as 5 lições existentes)
WHERE "lessonId" = 'lesson-04-01-15';
```

**Nota:** É necessário verificar se `lesson-04-01-15` precisa ser criada ou apenas movida de section-04-01 para section-04-03.

---

## Ordem Final Esperada no Banco

### Módulo 04 - Seções:
1. **Planejamento forrageiro** (section-04-02, order: 1)
2. **Manejo da Cultura do Milho** (section-04-03, order: 2)
3. **Silagem de Milho** (section-04-01, order: 3)
4. **Milho Reidratado** (section-04-05, order: 4)
5. **Nutrição e Manejo Alimentar** (section-04-04, order: 5)

---

## Próximos Passos

1. Executar os comandos SQL acima para atualizar o banco de dados
2. Executar `npm run db:sync` para garantir que todas as alterações estão sincronizadas
3. Verificar no frontend se a nova ordem está sendo exibida corretamente

