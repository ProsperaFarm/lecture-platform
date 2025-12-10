DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'user_lesson_idx' 
    AND tablename = 'user_notes'
  ) THEN
    DROP INDEX "user_lesson_idx";
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_notes_user_lesson_idx" ON "user_notes" USING btree ("userId","lessonId");