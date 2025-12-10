CREATE TABLE "course_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar(128) NOT NULL,
	"lessonId" varchar(128),
	"title" text NOT NULL,
	"description" text,
	"type" varchar(16) NOT NULL,
	"fileUrl" text NOT NULL,
	"fileKey" text NOT NULL,
	"fileSize" integer,
	"mimeType" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar(128) NOT NULL,
	"acronym" varchar(16) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail" text,
	"totalVideos" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_courseId_unique" UNIQUE("courseId")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"lessonId" varchar(128) NOT NULL,
	"courseId" varchar(128) NOT NULL,
	"moduleId" varchar(128) NOT NULL,
	"moduleName" text,
	"sectionId" varchar(128) NOT NULL,
	"sectionName" text,
	"title" text NOT NULL,
	"youtubeUrl" text,
	"type" varchar(16) DEFAULT 'video',
	"order" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_lessonId_unique" UNIQUE("lessonId")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"targetType" varchar(16) NOT NULL,
	"targetId" varchar(128) NOT NULL,
	"ratingType" varchar(16) NOT NULL,
	"stars" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_target_idx" UNIQUE("userId","targetType","targetId")
);
--> statement-breakpoint
CREATE TABLE "user_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"lessonId" varchar(128) NOT NULL,
	"timestamp" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"lessonId" varchar(128) NOT NULL,
	"courseId" varchar(128) NOT NULL,
	"completed" boolean DEFAULT false,
	"lastWatchedPosition" integer DEFAULT 0,
	"watchedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_lesson_idx" UNIQUE("userId","lessonId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(16) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "video_transcripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"lessonId" varchar(128) NOT NULL,
	"transcript" text NOT NULL,
	"summary" text,
	"keywords" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_transcripts_lessonId_unique" UNIQUE("lessonId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_materials_courseId_idx" ON "course_materials" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessonId_idx" ON "course_materials" USING btree ("lessonId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_courseId_idx" ON "lessons" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "target_idx" ON "ratings" USING btree ("targetType","targetId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_lesson_idx" ON "user_notes" USING btree ("userId","lessonId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "userId_idx" ON "user_progress" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_progress_courseId_idx" ON "user_progress" USING btree ("courseId");