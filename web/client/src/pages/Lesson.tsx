import { useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PlyrVideoPlayer } from "@/components/PlyrVideoPlayer";
import { Layout } from "@/components/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ChevronLeft, ChevronRight, FileText, PlayCircle, Loader2 } from "lucide-react";

export default function LessonPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/course/:courseId/lesson/:lessonId");
  const courseId = params?.courseId;
  const lessonId = params?.lessonId;

  // Check authentication
  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isLoadingUser && !user) {
      setLocation("/login");
    }
  }, [user, isLoadingUser, setLocation]);

  // Fetch lesson data
  const { data: lesson, isLoading: isLoadingLesson } = trpc.lessons.getById.useQuery(
    { lessonId: lessonId || "" },
    { enabled: !!lessonId }
  );

  // Fetch course data for navigation
  const { data: course } = trpc.courses.getById.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );

  // Fetch all lessons for prev/next navigation
  const { data: allLessons = [] } = trpc.lessons.getByCourse.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );

  if (isLoadingUser || isLoadingLesson) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando aula...</p>
        </div>
      </Layout>
    );
  }

  if (!lesson || !course) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Aula não encontrada</h2>
          <Link href={courseId ? `/course/${courseId}` : "/"}>
            <Button>Voltar</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Find prev/next lessons
  const currentIndex = allLessons.findIndex(l => l.lessonId === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Extract YouTube ID if URL exists
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = lesson.youtubeUrl ? getYoutubeId(lesson.youtubeUrl) : null;

  // Debug logs
  console.log('[Lesson] Current Lesson:', lesson);
  console.log('[Lesson] YouTube URL:', lesson.youtubeUrl);
  console.log('[Lesson] Video ID:', videoId);

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb / Navigation Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 overflow-hidden whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link href={`/course/${courseId}`} className="hover:text-primary transition-colors">{course.acronym}</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="truncate">{lesson.moduleName}</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="truncate font-medium text-foreground">{lesson.title}</span>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-border/50 group">
          {lesson.youtubeUrl ? (
            <PlyrVideoPlayer 
              youtubeUrl={lesson.youtubeUrl}
              courseTitle={course?.title || ""}
              lessonTitle={lesson.title}
              moduleTitle={lesson.moduleName || ""}
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
                {lesson.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="font-normal">
                  {lesson.sectionName}
                </Badge>
                {lesson.type === 'live' && (
                  <Badge variant="destructive" className="font-normal">
                    Gravação ao Vivo
                  </Badge>
                )}
              </div>
            </div>

            {!videoId && lesson.youtubeUrl && (
              <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Aguardando Upload</AlertTitle>
                <AlertDescription>
                  O vídeo desta aula está na fila de processamento e será disponibilizado em breve.
                </AlertDescription>
              </Alert>
            )}

            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              <p>
                Nesta aula do módulo <strong>{lesson.moduleName}</strong>, abordaremos os conceitos fundamentais 
                relacionados a {lesson.title.toLowerCase()}. Acompanhe o material de apoio e faça suas anotações.
              </p>
            </div>
          </div>

          {/* Sidebar / Actions */}
          <Card className="w-full md:w-80 shrink-0 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Link href={prevLesson ? `/course/${courseId}/lesson/${prevLesson.lessonId}` : "#"}>
                <Button variant="outline" size="sm" disabled={!prevLesson} className="w-full">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
              </Link>
              <Link href={nextLesson ? `/course/${courseId}/lesson/${nextLesson.lessonId}` : "#"}>
                <Button variant="default" size="sm" disabled={!nextLesson} className="w-full">
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
