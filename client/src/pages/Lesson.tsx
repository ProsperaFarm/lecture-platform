import { Layout } from "@/components/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ChevronLeft, ChevronRight, FileText, PlayCircle } from "lucide-react";
import ReactPlayer from "react-player";
import { Link, useRoute } from "wouter";
import coursesDataRaw from "../lib/courses-data.json";
import { CoursesData, Lesson, Module, Section } from "../lib/types";

const coursesData = coursesDataRaw as CoursesData;

export default function LessonPage() {
  const [, params] = useRoute("/course/:courseId/lesson/:lessonId");
  const courseId = params?.courseId;
  const lessonId = params?.lessonId;

  const currentCourse = coursesData.courses.find(c => c.id === courseId);

  if (!currentCourse) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Curso não encontrado</h2>
          <Link href="/">
            <Button>Voltar para o Início</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Find current lesson and its context
  let currentLesson: Lesson | undefined;
  let currentSection: Section | undefined;
  let currentModule: Module | undefined;
  let nextLessonId: string | undefined;
  let prevLessonId: string | undefined;

  // Flatten all lessons to find prev/next easily
  const allLessons: { lesson: Lesson; section: Section; module: Module }[] = [];
  
  currentCourse.modules.forEach((mod: Module) => {
    mod.sections.forEach((sec: Section) => {
      sec.lessons.forEach((les: Lesson) => {
        allLessons.push({ lesson: les, section: sec, module: mod });
      });
    });
  });

  const currentIndex = allLessons.findIndex(item => item.lesson.id === lessonId);
  
  if (currentIndex !== -1) {
    const current = allLessons[currentIndex];
    currentLesson = current.lesson;
    currentSection = current.section;
    currentModule = current.module;
    
    if (currentIndex > 0) {
      prevLessonId = allLessons[currentIndex - 1].lesson.id;
    }
    
    if (currentIndex < allLessons.length - 1) {
      nextLessonId = allLessons[currentIndex + 1].lesson.id;
    }
  }

  if (!currentLesson) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Aula não encontrada</h2>
          <Link href={`/course/${courseId}`}>
            <Button>Voltar para o Curso</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Extract YouTube ID if URL exists
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = currentLesson.youtubeUrl ? getYoutubeId(currentLesson.youtubeUrl) : null;

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb / Navigation Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 overflow-hidden whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link href={`/course/${courseId}`} className="hover:text-primary transition-colors">{currentCourse.acronym}</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="truncate">{currentModule?.title}</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="truncate font-medium text-foreground">{currentLesson.title}</span>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-border/50 group">
          {currentLesson.youtubeUrl ? (
            // @ts-ignore - ReactPlayer types are causing issues but functionality is correct
            <ReactPlayer
              url={currentLesson.youtubeUrl}
              width="100%"
              height="100%"
              controls={true}
              config={{
                youtube: {
                  playerVars: {
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3, // Hide video annotations
                    fs: 1, // Allow fullscreen
                    disablekb: 0, // Enable keyboard controls
                  }
                }
              }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 text-center p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <PlayCircle className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aula em Breve</h3>
              <p className="text-muted-foreground max-w-md">
                O conteúdo desta aula está sendo preparado e será disponibilizado em breve na plataforma.
              </p>
              <Badge variant="outline" className="mt-6 border-dashed">
                Status: Pendente
              </Badge>
            </div>
          )}
        </div>

        {/* Lesson Info & Controls */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="space-y-4 flex-1">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-primary">
                {currentLesson.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="font-normal">
                  {currentSection?.title}
                </Badge>
                {currentLesson.type === 'live' && (
                  <Badge variant="destructive" className="font-normal">
                    Gravação ao Vivo
                  </Badge>
                )}
              </div>
            </div>

            {!videoId && (
              <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Aguardando Upload</AlertTitle>
                <AlertDescription>
                  O arquivo <strong>{currentLesson.fileName}</strong> está na fila de processamento.
                </AlertDescription>
              </Alert>
            )}

            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              <p>
                Nesta aula do módulo <strong>{currentModule?.title}</strong>, abordaremos os conceitos fundamentais 
                relacionados a {currentLesson.title.toLowerCase()}. Acompanhe o material de apoio e faça suas anotações.
              </p>
            </div>
          </div>

          {/* Sidebar / Actions */}
          <Card className="w-full md:w-80 shrink-0 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Link href={prevLessonId ? `/course/${courseId}/lesson/${prevLessonId}` : "#"}>
                <Button variant="outline" size="sm" disabled={!prevLessonId} className="w-full">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
              </Link>
              <Link href={nextLessonId ? `/course/${courseId}/lesson/${nextLessonId}` : "#"}>
                <Button variant="default" size="sm" disabled={!nextLessonId} className="w-full">
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Material de Apoio
              </h4>
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground h-auto py-2" disabled>
                <span className="truncate">Slides da aula (Em breve)</span>
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground h-auto py-2" disabled>
                <span className="truncate">Exercícios práticos (Em breve)</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
