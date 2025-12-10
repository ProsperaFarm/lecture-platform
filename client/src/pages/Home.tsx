import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, PlayCircle, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export default function Home() {
  const [, params] = useRoute("/course/:id");
  const courseId = params?.id;

  // Fetch course data from database via tRPC
  const { data: course, isLoading: courseLoading } = trpc.courses.getById.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );

  // Fetch lessons for the course
  const { data: lessonsData, isLoading: lessonsLoading } = trpc.lessons.getByCourse.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );

  // Group lessons by module and section
  const courseStructure = useMemo(() => {
    if (!lessonsData) return { modules: [], totalSections: 0 };

    const modulesMap = new Map<string, {
      id: string;
      title: string;
      order: number;
      sections: Map<string, {
        id: string;
        title: string;
        order: number;
        lessons: typeof lessonsData;
      }>;
    }>();

    lessonsData.forEach(lesson => {
      if (!modulesMap.has(lesson.moduleId)) {
        modulesMap.set(lesson.moduleId, {
          id: lesson.moduleId,
          title: lesson.moduleName || "Módulo sem nome",
          order: parseInt(lesson.moduleId.split('-')[1]) || 0,
          sections: new Map(),
        });
      }

      const module = modulesMap.get(lesson.moduleId)!;
      
      if (!module.sections.has(lesson.sectionId)) {
        module.sections.set(lesson.sectionId, {
          id: lesson.sectionId,
          title: lesson.sectionName || "Seção sem nome",
          order: parseInt(lesson.sectionId.split('-')[2]) || 0,
          lessons: [],
        });
      }

      const section = module.sections.get(lesson.sectionId)!;
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

    return { modules, totalSections };
  }, [lessonsData]);

  // Loading state
  if (courseLoading || lessonsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Course not found
  if (!course) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Curso não encontrado.</p>
          <Link href="/">
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const totalModules = courseStructure.modules.length;
  const totalSections = courseStructure.totalSections;
  const totalLessons = course.totalVideos || 0;
  const progress = 0; // TODO: Calculate from user progress

  // Get first lesson for "Start Course" button
  const firstLesson = courseStructure.modules[0]?.sections[0]?.lessons[0];

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
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
            
            {firstLesson && (
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href={`/course/${course.courseId}/lesson/${firstLesson.lessonId}`}>
                  <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                    <PlayCircle className="w-5 h-5" />
                    Começar Curso
                  </Button>
                </Link>
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
              <div className="text-2xl font-bold">{progress}%</div>
              <Progress value={progress} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                0 de {totalLessons} aulas assistidas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Módulos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalModules}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalSections} seções de conteúdo
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLessons}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Vídeo-aulas e gravações ao vivo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Modules List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-display">Conteúdo do Curso</h2>
          <div className="grid gap-4">
            {courseStructure.modules.map((module) => (
              <Card key={module.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold text-primary">
                        {module.title}
                      </CardTitle>
                      <CardDescription>
                        {module.sections.length} seções
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-background">
                      Módulo {module.order}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {module.sections.map((section) => (
                      <div key={section.id} className="p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-foreground/80">
                            {section.title}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {section.lessons.length} aulas
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {section.lessons.map((lesson) => (
                            <Link key={lesson.lessonId} href={`/course/${course.courseId}/lesson/${lesson.lessonId}`}>
                              <div className="group flex items-center gap-3 text-sm p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                  <PlayCircle className="w-3 h-3" />
                                </div>
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                                  {lesson.title}
                                </span>
                                {lesson.youtubeUrl ? (
                                  <Badge variant="secondary" className="ml-auto text-[10px] h-5">
                                    Assistir
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="ml-auto text-[10px] h-5 text-muted-foreground border-dashed">
                                    Pendente
                                  </Badge>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
