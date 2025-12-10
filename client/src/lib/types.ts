export interface Lesson {
  id: string;
  order: number;
  title: string;
  fileName: string;
  type: 'video' | 'live';
  youtubeUrl?: string;
}

export interface Section {
  id: string;
  order: number;
  title: string;
  lessons: Lesson[];
}

export interface Module {
  id: string;
  order: number;
  title: string;
  folderName: string;
  sections: Section[];
}

export interface Course {
  id: string;
  acronym: string;
  title: string;
  description: string;
  totalVideos: number;
  modules: Module[];
}

export interface CourseData {
  course: Course;
}
