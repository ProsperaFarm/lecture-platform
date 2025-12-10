import { useAuth } from "@/_core/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, PlayCircle } from "lucide-react";
import { Link, useRoute } from "wouter";
import coursesDataRaw from "../lib/courses-data.json";
import { CoursesData } from "../lib/types";

const coursesData = coursesDataRaw as CoursesData;

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [, params] = useRoute("/course/:id");
  const courseId = params?.id;
  const currentCourse = coursesData.courses.find(c => c.id === courseId);

  if (!currentCourse) {
    return <div className="p-8 text-center">Curso não encontrado. <Link href="/">Voltar</Link></div>;
  }

  // Calculate total stats
  const totalModules = currentCourse.modules.length;
  const totalSections = currentCourse.modules.reduce(
    (acc, mod) => acc + mod.sections.length, 0
  );
  const totalLessons = currentCourse.totalVideos;
  
  // Mock progress (would come from local storage or DB in future)
  const progress = 0; 

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Hero Section */}
        <div className="relative rounded-xl overflow-hidden bg-card border shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20 z-10" />
          <img 
            src={currentCourse.thumbnail || "/images/hero-bg.png"} 
            alt="Farm Landscape" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-20 p-8 md:p-12 text-white space-y-4 max-w-2xl">
            <Badge variant="secondary" className="bg-primary/20 text-primary-foreground hover:bg-primary/30 border-none backdrop-blur-sm">
              {currentCourse.acronym}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">
              {currentCourse.title}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              {currentCourse.description}
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href={`/course/${currentCourse.id}/lesson/${currentCourse.modules[0].sections[0].lessons[0].id}`}>
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                  <PlayCircle className="w-5 h-5" />
                  Começar Curso
                </Button>
              </Link>
            </div>
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
            {currentCourse.modules.map((module) => (
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
                            <Link key={lesson.id} href={`/course/${currentCourse.id}/lesson/${lesson.id}`}>
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
