CREATE TABLE `course_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` varchar(128) NOT NULL,
	`lessonId` varchar(128),
	`title` text NOT NULL,
	`description` text,
	`type` enum('pdf','slide','document','other') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` varchar(128) NOT NULL,
	`acronym` varchar(16) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`thumbnail` text,
	`totalVideos` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_courseId_unique` UNIQUE(`courseId`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` varchar(128) NOT NULL,
	`courseId` varchar(128) NOT NULL,
	`moduleId` varchar(128) NOT NULL,
	`moduleName` text,
	`sectionId` varchar(128) NOT NULL,
	`sectionName` text,
	`title` text NOT NULL,
	`youtubeUrl` text,
	`type` enum('video','live') DEFAULT 'video',
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`),
	CONSTRAINT `lessons_lessonId_unique` UNIQUE(`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetType` enum('lesson','course') NOT NULL,
	`targetId` varchar(128) NOT NULL,
	`ratingType` enum('like','dislike','stars') NOT NULL,
	`stars` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_target_idx` UNIQUE(`userId`,`targetType`,`targetId`)
);
--> statement-breakpoint
CREATE TABLE `user_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` varchar(128) NOT NULL,
	`timestamp` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` varchar(128) NOT NULL,
	`courseId` varchar(128) NOT NULL,
	`completed` boolean DEFAULT false,
	`lastWatchedPosition` int DEFAULT 0,
	`watchedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_lesson_idx` UNIQUE(`userId`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `video_transcripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` varchar(128) NOT NULL,
	`transcript` text NOT NULL,
	`summary` text,
	`keywords` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_transcripts_id` PRIMARY KEY(`id`),
	CONSTRAINT `video_transcripts_lessonId_unique` UNIQUE(`lessonId`)
);
--> statement-breakpoint
CREATE INDEX `courseId_idx` ON `course_materials` (`courseId`);--> statement-breakpoint
CREATE INDEX `lessonId_idx` ON `course_materials` (`lessonId`);--> statement-breakpoint
CREATE INDEX `courseId_idx` ON `lessons` (`courseId`);--> statement-breakpoint
CREATE INDEX `target_idx` ON `ratings` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `user_lesson_idx` ON `user_notes` (`userId`,`lessonId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `user_progress` (`userId`);--> statement-breakpoint
CREATE INDEX `courseId_idx` ON `user_progress` (`courseId`);