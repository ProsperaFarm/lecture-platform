import { SimpleLayout } from "@/components/SimpleLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, Clock, PlayCircle, Loader2, ArrowLeft, ChevronDown, ChevronUp, RotateCcw, AlertTriangle } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper function to format duration in seconds to readable format
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds === 0) return "";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') + 'm' : ''}`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

export default function Home() {
  const [, params] = useRoute("/course/:id");
  const [location, setLocation] = useLocation();
  const courseId = params?.id;

  // Check authentication
  const { data: user, isLoading: isLoadingAuth } = trpc.auth.me.useQuery();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      setLocation("/login");
    }
  }, [user, isLoadingAuth, setLocation]);

  // Fetch course data from database via tRPC
  const { data: course, isLoading: courseLoading } = trpc.courses.getById.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );
  
  // Fetch lessons for this course with module and section names
  const { data: lessonsData = [], isLoading: lessonsLoading } = trpc.lessons.getWithDetails.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );

  // Fetch user progress for this course
  const { data: userProgressData = [] } = trpc.progress.getByCourse.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );

  // Fetch course progress stats from server
  const { data: courseProgressStats } = trpc.progress.getStats.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );

  // Fetch last watched lesson for this course (only if user is authenticated)
  const { data: lastWatchedLesson, isLoading: lastWatchedLoading } = trpc.lessons.getLastWatched.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId && !!user }
  );
  
  // Debug log
  useEffect(() => {
    if (lastWatchedLesson) {
      console.log('[Home] ✅ Last watched lesson found:', {
        lessonId: lastWatchedLesson.lessonId,
        title: lastWatchedLesson.title
      });
    } else if (!lastWatchedLoading) {
      console.log('[Home] ❌ No last watched lesson found (query completed)');
    }
  }, [lastWatchedLesson, lastWatchedLoading]);

  // Get tRPC utils for query invalidation
  const utils = trpc.useUtils();

  // State for accordion expansion
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // State for reset confirmation dialog
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Mutation to toggle lesson completion
  const toggleCompletionMutation = trpc.progress.toggleCompletion.useMutation({
    onSuccess: () => {
      utils.progress.getByCourse.invalidate({ courseId: courseId || "" });
      utils.progress.getStats.invalidate({ courseId: courseId || "" });
    },
  });

  // Mutation to reset course progress
  const resetProgressMutation = trpc.progress.reset.useMutation({
    onSuccess: () => {
      utils.progress.getByCourse.invalidate({ courseId: courseId || "" });
      utils.progress.getStats.invalidate({ courseId: courseId || "" });
      setShowResetDialog(false);
    },
  });

  const handleToggleCompletion = (lessonId: string) => {
    if (courseId) {
      const currentStatus = progressMap.get(lessonId) || false;
      toggleCompletionMutation.mutate({ 
        courseId, 
        lessonId, 
        completed: !currentStatus 
      });
    }
  };

  // Functions to expand/collapse all modules
  const expandAllModules = () => {
    setExpandedModules(courseStructure.modules.map(m => m.id));
  };

  const collapseAllModules = () => {
    setExpandedModules([]);
  };

  // Handle reset progress
  const handleResetProgress = () => {
    if (courseId) {
      resetProgressMutation.mutate({ courseId });
    }
  };

  // Create a map of lessonId -> completed status for quick lookup
  const progressMap = useMemo(() => {
    const map = new Map<string, boolean>();
    userProgressData.forEach(progress => {
      map.set(progress.lessonId, progress.completed || false);
    });
    return map;
  }, [userProgressData]);

  // Group lessons by module and section with progress
  const courseStructure = useMemo(() => {
    if (!lessonsData || lessonsData.length === 0) {
      return { modules: [], totalSections: 0, totalLessons: 0, completedLessons: 0, watchedDuration: 0, totalDuration: 0 };
    }

    const modulesMap = new Map<string, {
      id: string;
      title: string;
      order: number;
      totalDuration: number;
      completedCount: number;
      totalCount: number;
      sections: Map<string, {
        id: string;
        title: string;
        order: number;
        totalDuration: number;
        completedCount: number;
        totalCount: number;
        lessons: typeof lessonsData;
      }>;
    }>();

    // Use stats from server if available, otherwise calculate from lessons
    const totalCompletedLessons = courseProgressStats?.completedLessons ?? 0;
    const totalWatchedDuration = courseProgressStats?.watchedDuration ?? 0;
    const totalCourseDuration = courseProgressStats?.totalDuration ?? 0;

    lessonsData.forEach(lesson => {
      const isCompleted = progressMap.get(lesson.lessonId) || false;
      const lessonDuration = lesson.duration || 0;

      if (!modulesMap.has(lesson.moduleId)) {
        modulesMap.set(lesson.moduleId, {
          id: lesson.moduleId,
          title: lesson.moduleName || "Módulo sem nome",
          order: parseInt(lesson.moduleId.split('-')[1]) || 0,
          totalDuration: 0,
          completedCount: 0,
          totalCount: 0,
          sections: new Map(),
        });
      }

      const module = modulesMap.get(lesson.moduleId)!;
      module.totalDuration += lessonDuration;
      module.totalCount++;
      if (isCompleted) module.completedCount++;
      
      if (!module.sections.has(lesson.sectionId)) {
        module.sections.set(lesson.sectionId, {
          id: lesson.sectionId,
          title: lesson.sectionName || "Seção sem nome",
          order: parseInt(lesson.sectionId.split('-')[2]) || 0,
          totalDuration: 0,
          completedCount: 0,
          totalCount: 0,
          lessons: [],
        });
      }

      const section = module.sections.get(lesson.sectionId)!;
      section.totalDuration += lessonDuration;
      section.totalCount++;
      if (isCompleted) section.completedCount++;
      section.lessons.push(lesson);
    });

    // Convert maps to arrays and sort
    const modules = Array.from(modulesMap.values())
      .sort((a, b) => a.order - b.order)
      .map(module => ({
        ...module,
        sections: Array.from(module.sections.values())
          .sort((a, b) => a.order - b.order)
          .map(section => ({
            ...section,
            lessons: section.lessons.sort((a, b) => (a.order || 0) - (b.order || 0)),
          })),
      }));

    const totalSections = modules.reduce((acc, m) => acc + m.sections.length, 0);

    return {
      modules,
      totalSections,
      totalLessons: course?.totalVideos ?? lessonsData.length,
      completedLessons: totalCompletedLessons,
      watchedDuration: totalWatchedDuration,
      totalDuration: totalCourseDuration,
    };
  }, [lessonsData, progressMap, courseProgressStats]);

  // Update expanded modules when course structure changes
  useEffect(() => {
    if (courseStructure.modules.length > 0 && expandedModules.length === 0) {
      setExpandedModules(courseStructure.modules.map(m => m.id));
    }
  }, [courseStructure.modules.length, expandedModules.length]);

  // Calculate continue lesson (before returns)
  const firstLesson = courseStructure.modules[0]?.sections[0]?.lessons[0];
  const continueLesson = lastWatchedLesson || firstLesson;
  
  // Debug: log which lesson will be used
  useEffect(() => {
    if (continueLesson) {
      console.log('[Home] Continue lesson:', {
        lessonId: continueLesson.lessonId,
        title: continueLesson.title,
        isLastWatched: !!lastWatchedLesson,
        isFirstLesson: !lastWatchedLesson
      });
    }
  }, [continueLesson, lastWatchedLesson]);

  // Loading state
  if (courseLoading || lessonsLoading || isLoadingAuth) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SimpleLayout>
    );
  }

  // Course not found
  if (!course) {
    return (
      <SimpleLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Curso não encontrado.</p>
          <Link href="/">
            <Button>Voltar para Home</Button>
          </Link>
        </div>
      </SimpleLayout>
    );
  }

  // Use progress percentage from server stats
  const progressPercentage = courseProgressStats?.progressPercentage ?? 0;

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="bg-background border rounded-lg shadow-sm space-y-8 p-8 animate-in fade-in duration-500">
            {/* Back Button */}
            <div>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para Cursos
                </Button>
              </Link>
            </div>
            
            {/* Hero Section */}
            <div className="relative rounded-xl overflow-hidden bg-card border shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20 z-10" />
              <img 
                src={course.thumbnail || "/images/hero-bg.png"} 
                alt="Farm Landscape" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-20 p-8 md:p-12 text-white space-y-4 max-w-2xl">
                <Badge variant="secondary" className="bg-primary/20 text-primary-foreground hover:bg-primary/30 border-none backdrop-blur-sm">
                  {course.acronym}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">
                  {course.title}
                </h1>
                <p className="text-lg text-white/80 leading-relaxed">
                  {course.description}
                </p>
                
                {continueLesson && (
                  <div className="flex flex-wrap gap-4 pt-4">
                    <Link href={`/course/${course.courseId}/lesson/${continueLesson.lessonId}`}>
                      <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                        <PlayCircle className="w-5 h-5" />
                        {lastWatchedLesson ? 'Continuar Curso' : progressPercentage > 0 ? 'Continuar Curso' : 'Começar Curso'}
                      </Button>
                    </Link>
                    {/* Debug info - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-white/60 mt-2">
                        {lastWatchedLesson ? `Último vídeo: ${lastWatchedLesson.title}` : 'Usando primeira aula'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Total</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progressPercentage}%</div>
              <Progress value={progressPercentage} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {courseStructure.completedLessons} de {courseStructure.totalLessons} aulas assistidas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDuration(courseStructure.watchedDuration)} / {formatDuration(course?.totalDuration || courseStructure.totalDuration)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Módulos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courseStructure.modules.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {courseStructure.totalSections} seções • {courseStructure.totalLessons} aulas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDuration(course?.totalDuration || courseStructure.totalDuration)} de conteúdo
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courseStructure.totalLessons}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Vídeo-aulas e gravações ao vivo
              </p>
            </CardContent>
          </Card>
        </div>

            {/* Modules List with Accordions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-display">Conteúdo do Curso</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={expandAllModules}
                    title="Expandir Todos"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={collapseAllModules}
                    title="Recolher Todos"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowResetDialog(true)}
                    className="text-destructive hover:text-destructive"
                    title="Resetar Progresso"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Accordion 
                type="multiple" 
                value={expandedModules}
                onValueChange={setExpandedModules}
                className="space-y-4"
              >
                {courseStructure.modules.map((module) => (
                  <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
                    <AccordionTrigger className="hover:no-underline px-6 py-4">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-primary">
                            {module.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.sections.length} seções • {module.totalCount} aulas
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-primary">
                            {module.completedCount}/{module.totalCount}
                          </span>
                          {module.totalDuration > 0 && (
                            <span className="text-sm text-muted-foreground">
                              | {formatDuration(module.totalDuration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <Accordion type="multiple" defaultValue={module.sections.map(s => s.id)} className="space-y-2">
                        {module.sections.map((section) => (
                          <AccordionItem key={section.id} value={section.id} className="border-none">
                            <AccordionTrigger className="hover:no-underline py-3 px-4 hover:bg-muted/50 rounded-md">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  <span className="font-medium">{section.title}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-primary">
                                    {section.completedCount}/{section.totalCount}
                                  </span>
                                  {section.totalDuration > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                      | {formatDuration(section.totalDuration)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-2">
                              <div className="space-y-1 mt-2">
                                {section.lessons.map((lesson) => {
                                  const isActive = location === `/course/${course.courseId}/lesson/${lesson.lessonId}`;
                                  const isCompleted = progressMap.get(lesson.lessonId) || false;
                                  return (
                                    <div key={lesson.lessonId} className="flex items-center gap-2 group">
                                      <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={() => handleToggleCompletion(lesson.lessonId)}
                                        className="shrink-0"
                                      />
                                      <Link href={`/course/${course.courseId}/lesson/${lesson.lessonId}`} className="flex-1">
                                        <div className={cn(
                                          "flex items-center justify-between gap-2 p-3 rounded-md cursor-pointer transition-colors",
                                          isActive 
                                            ? "bg-primary/10 text-primary font-medium" 
                                            : "hover:bg-muted/50 text-muted-foreground",
                                          isCompleted && "opacity-70"
                                        )}>
                                          <span className={cn(
                                            "text-sm flex-1",
                                            isCompleted && "line-through"
                                          )}>
                                            {lesson.title}
                                          </span>
                                          {lesson.duration && (
                                            <span className="text-xs text-muted-foreground shrink-0">
                                              {formatDuration(lesson.duration)}
                                            </span>
                                          )}
                                        </div>
                                      </Link>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Progress Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Resetar Progresso do Curso
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja resetar todo o progresso deste curso? 
              Esta ação irá apagar todas as lições marcadas como concluídas e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetProgress}
              disabled={resetProgressMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetProgressMutation.isPending ? "Resetando..." : "Sim, Resetar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SimpleLayout>
  );
}
