-- ============================================================================
-- Script SQL: Reordenação das Seções do Módulo 04
-- Data: 2025-01-XX
-- Descrição: Reordena as seções do Módulo 04 "Produção e Conservação de Forragens"
--            conforme reorganização feita no course-metadata_copy.json
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Atualizar a ordem das seções do Módulo 04
-- ============================================================================
-- Nova ordem:
--   1. section-04-02: "Planejamento forrageiro"
--   2. section-04-03: "Manejo da Cultura do Milho"
--   3. section-04-01: "Silagem de Milho"
--   4. section-04-05: "Milho Reidratado"
--   5. section-04-04: "Nutrição e Manejo Alimentar"

UPDATE sections 
SET "order" = CASE 
  WHEN "sectionId" = 'section-04-02' THEN 1  -- Planejamento forrageiro (primeiro)
  WHEN "sectionId" = 'section-04-03' THEN 2  -- Manejo da Cultura do Milho (segundo)
  WHEN "sectionId" = 'section-04-01' THEN 3  -- Silagem de Milho (terceiro)
  WHEN "sectionId" = 'section-04-05' THEN 4  -- Milho Reidratado (quarto)
  WHEN "sectionId" = 'section-04-04' THEN 5  -- Nutrição e Manejo Alimentar (quinto)
END,
    "updatedAt" = NOW()
WHERE "sectionId" IN ('section-04-01', 'section-04-02', 'section-04-03', 'section-04-04', 'section-04-05')
  AND "moduleId" = 'module-04';

-- Verificar se as atualizações foram aplicadas
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM sections
  WHERE "sectionId" IN ('section-04-01', 'section-04-02', 'section-04-03', 'section-04-04', 'section-04-05')
    AND "moduleId" = 'module-04';
  
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'Nenhuma seção foi atualizada. Verifique se as seções existem no banco.';
  END IF;
  
  RAISE NOTICE 'Atualizadas % seções do módulo 04', updated_count;
END $$;

-- ============================================================================
-- 2. Atualizar título da seção section-04-03
-- ============================================================================
-- Mudança: "Cultura do Milho" → "Manejo da Cultura do Milho"

UPDATE sections 
SET title = 'Manejo da Cultura do Milho',
    "updatedAt" = NOW()
WHERE "sectionId" = 'section-04-03';

-- Verificar se o título foi atualizado
DO $$
DECLARE
  section_title TEXT;
BEGIN
  SELECT title INTO section_title
  FROM sections
  WHERE "sectionId" = 'section-04-03';
  
  IF section_title IS NULL THEN
    RAISE EXCEPTION 'Seção section-04-03 não encontrada no banco.';
  END IF;
  
  IF section_title != 'Manejo da Cultura do Milho' THEN
    RAISE EXCEPTION 'Título da seção não foi atualizado corretamente. Valor atual: %', section_title;
  END IF;
  
  RAISE NOTICE 'Título da seção section-04-03 atualizado para: %', section_title;
END $$;

-- ============================================================================
-- 3. Trocar lições entre section-04-01 e section-04-02
-- ============================================================================
-- TROCA 1: lesson-04-01-01 ("Principais desafios na produção de silagem")
--   ANTES: section-04-01, order: 1
--   DEPOIS: section-04-02, order: 1
--
-- TROCA 2: lesson-04-02-01 ("Silagem de milho")
--   ANTES: section-04-02, order: 1
--   DEPOIS: section-04-01, order: 1

-- Atualizar lesson-04-01-01: mover para section-04-02
UPDATE lessons 
SET "sectionId" = 'section-04-02',
    "order" = 1,  -- Primeira lição da section-04-02
    "updatedAt" = NOW()
WHERE "lessonId" = 'lesson-04-01-01';

-- Atualizar lesson-04-02-01: mover para section-04-01
UPDATE lessons 
SET "sectionId" = 'section-04-01',
    "order" = 1,  -- Primeira lição da section-04-01
    "updatedAt" = NOW()
WHERE "lessonId" = 'lesson-04-02-01';

-- Ajustar a ordem das outras lições da section-04-01
-- (lesson-04-01-02 agora será order 2, lesson-04-01-03 será order 3, etc.)
UPDATE lessons 
SET "order" = "order" + 1,
    "updatedAt" = NOW()
WHERE "sectionId" = 'section-04-01'
  AND "lessonId" != 'lesson-04-02-01'  -- Não atualizar a lição que acabamos de mover
  AND "lessonId" != 'lesson-04-01-15'  -- Esta será movida depois
  AND "order" >= 1;

-- Ajustar a ordem das outras lições da section-04-02
-- (lesson-04-02-02 agora será order 2, lesson-04-02-03 será order 3, etc.)
UPDATE lessons 
SET "order" = "order" + 1,
    "updatedAt" = NOW()
WHERE "sectionId" = 'section-04-02'
  AND "lessonId" != 'lesson-04-01-01'  -- Não atualizar a lição que acabamos de mover
  AND "order" >= 1;

-- Verificar as trocas
DO $$
DECLARE
  lesson_01_section VARCHAR;
  lesson_02_section VARCHAR;
BEGIN
  SELECT "sectionId" INTO lesson_01_section
  FROM lessons
  WHERE "lessonId" = 'lesson-04-01-01';
  
  SELECT "sectionId" INTO lesson_02_section
  FROM lessons
  WHERE "lessonId" = 'lesson-04-02-01';
  
  IF lesson_01_section = 'section-04-02' THEN
    RAISE NOTICE '✅ Lição lesson-04-01-01 movida para section-04-02';
  ELSE
    RAISE WARNING '⚠️ Lição lesson-04-01-01 está na seção: % (esperado: section-04-02)', lesson_01_section;
  END IF;
  
  IF lesson_02_section = 'section-04-01' THEN
    RAISE NOTICE '✅ Lição lesson-04-02-01 movida para section-04-01';
  ELSE
    RAISE WARNING '⚠️ Lição lesson-04-02-01 está na seção: % (esperado: section-04-01)', lesson_02_section;
  END IF;
END $$;

-- ============================================================================
-- 4. Mover lição "Doenças na cultura de milho" para section-04-03
-- ============================================================================
-- A lição lesson-04-01-15 deve ser movida de section-04-01 para section-04-03
-- e ter sua ordem atualizada dentro da nova seção

-- Primeiro, verificar se a lição existe
DO $$
DECLARE
  lesson_exists BOOLEAN;
  current_section_id VARCHAR;
  current_order INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM lessons WHERE "lessonId" = 'lesson-04-01-15'
  ) INTO lesson_exists;
  
  IF NOT lesson_exists THEN
    RAISE NOTICE 'Lição lesson-04-01-15 não encontrada. Ela será criada quando o sync for executado.';
  ELSE
    SELECT "sectionId", "order" INTO current_section_id, current_order
    FROM lessons
    WHERE "lessonId" = 'lesson-04-01-15';
    
    RAISE NOTICE 'Lição lesson-04-01-15 encontrada. Seção atual: %, Ordem atual: %', current_section_id, current_order;
  END IF;
END $$;

-- Atualizar a lição se ela existir
UPDATE lessons 
SET "sectionId" = 'section-04-03',
    "moduleId" = 'module-04',  -- Garantir que está no módulo correto
    "order" = 6,  -- Nova ordem dentro da seção 04-03 (após as outras 5 lições)
    "updatedAt" = NOW()
WHERE "lessonId" = 'lesson-04-01-15';

-- Verificar se a lição foi atualizada
DO $$
DECLARE
  updated_lesson_section VARCHAR;
BEGIN
  SELECT "sectionId" INTO updated_lesson_section
  FROM lessons
  WHERE "lessonId" = 'lesson-04-01-15';
  
  IF updated_lesson_section IS NOT NULL THEN
    IF updated_lesson_section = 'section-04-03' THEN
      RAISE NOTICE '✅ Lição lesson-04-01-15 movida com sucesso para section-04-03';
    ELSE
      RAISE WARNING '⚠️ Lição lesson-04-01-15 está na seção: %. Verifique se a atualização foi aplicada.', updated_lesson_section;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 5. Verificar ordens das lições nas seções afetadas
-- ============================================================================
-- Listar as lições de cada seção após as mudanças

DO $$
DECLARE
  lesson_record RECORD;
BEGIN
  RAISE NOTICE '=== Lições da section-04-01 (Silagem de Milho) ===';
  FOR lesson_record IN
    SELECT "lessonId", title, "order"
    FROM lessons
    WHERE "sectionId" = 'section-04-01'
    ORDER BY "order"
    LIMIT 5
  LOOP
    RAISE NOTICE '  %: % (order: %)', lesson_record."order", lesson_record.title, lesson_record."lessonId";
  END LOOP;
END $$;

DO $$
DECLARE
  lesson_record RECORD;
BEGIN
  RAISE NOTICE '=== Lições da section-04-02 (Planejamento forrageiro) ===';
  FOR lesson_record IN
    SELECT "lessonId", title, "order"
    FROM lessons
    WHERE "sectionId" = 'section-04-02'
    ORDER BY "order"
    LIMIT 5
  LOOP
    RAISE NOTICE '  %: % (order: %)', lesson_record."order", lesson_record.title, lesson_record."lessonId";
  END LOOP;
END $$;

DO $$
DECLARE
  lesson_record RECORD;
BEGIN
  RAISE NOTICE '=== Lições da section-04-03 (Manejo da Cultura do Milho) ===';
  FOR lesson_record IN
    SELECT "lessonId", title, "order"
    FROM lessons
    WHERE "sectionId" = 'section-04-03'
    ORDER BY "order"
  LOOP
    RAISE NOTICE '  %: % (order: %)', lesson_record."order", lesson_record.title, lesson_record."lessonId";
  END LOOP;
END $$;

-- ============================================================================
-- 6. Verificação final
-- ============================================================================
-- Listar todas as seções do módulo 04 em ordem
DO $$
DECLARE
  section_record RECORD;
BEGIN
  RAISE NOTICE '=== Seções do Módulo 04 (ordem final) ===';
  FOR section_record IN
    SELECT "sectionId", title, "order"
    FROM sections
    WHERE "moduleId" = 'module-04'
    ORDER BY "order"
  LOOP
    RAISE NOTICE '%: % (order: %)', section_record."sectionId", section_record.title, section_record."order";
  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- Após executar este script, execute:
--   1. npm run db:sync (para sincronizar qualquer lição que faltar)
--   2. Verifique no frontend se a nova ordem está correta
-- ============================================================================

