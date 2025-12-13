import { SimpleLayout } from "@/components/SimpleLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, PlayCircle, TrendingUp, Clock, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useMemo, useEffect } from "react";

// Helper function to format duration in seconds to readable format
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds === 0) return "0m";
  
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

export default function CourseSelection() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingAuth } = trpc.auth.me.useQuery();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      setLocation("/login");
    }
  }, [user, isLoadingAuth, setLocation]);

  // Fetch courses from database
  const { data: courses = [], isLoading: coursesLoading } = trpc.courses.list.useQuery();

  // Fetch progress stats for all courses from server
  const courseIds = courses.map(c => c.courseId);
  const { data: courseStatsMap = {}, isLoading: statsLoading } = trpc.progress.getStatsForMultiple.useQuery(
    { courseIds },
    { enabled: !!user && courses.length > 0 }
  );

  // Fetch metadata (modules and sections count) for all courses
  const { data: courseMetadataMap = {}, isLoading: metadataLoading } = trpc.courses.getMetadataForMultiple.useQuery(
    { courseIds },
    { enabled: courses.length > 0 }
  );

  // Calculate progress for each course using server stats
  const coursesWithProgress = useMemo(() => {
    return courses.map((course) => {
      const stats = courseStatsMap[course.courseId] || {
        totalLessons: course.totalVideos || 0,
        completedLessons: 0,
        progressPercentage: 0,
        watchedDuration: 0,
        totalDuration: 0,
      };

      const metadata = courseMetadataMap[course.courseId] || {
        totalModules: 0,
        totalSections: 0,
      };

      return {
        ...course,
        progressPercentage: stats.progressPercentage,
        completedCount: stats.completedLessons,
        watchedDuration: stats.watchedDuration,
        totalLessons: stats.totalLessons,
        totalModules: metadata.totalModules,
        totalSections: metadata.totalSections,
      };
    });
  }, [courses, courseStatsMap, courseMetadataMap]);

  // Show loading while checking auth or fetching stats/metadata
  if (isLoadingAuth || coursesLoading || statsLoading || metadataLoading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SimpleLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-display">
              P
            </div>
            <span className="font-display font-bold text-xl text-foreground">Prospera Academy</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              Bem-vindo, {user?.name || 'Aluno'}
            </span>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold font-display tracking-tight text-primary">
            Sua jornada de conhecimento
          </h1>
          <p className="text-lg text-muted-foreground">
            Acesse os cursos da Prospera Farm e transforme a gestão da sua propriedade com conhecimento técnico e prático.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesWithProgress.map((course) => (
            <Card key={course.courseId} className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img 
                  src={course.thumbnail || "/images/course-thumb.png"} 
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                <Badge className="absolute top-3 right-3 bg-white/90 text-primary hover:bg-white">
                  {course.acronym}
                </Badge>
                {course.progressPercentage > 0 && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center justify-between text-xs text-white mb-1">
                      <span className="font-medium">{course.progressPercentage}% concluído</span>
                      <span>{course.completedCount}/{course.totalLessons || course.totalVideos} aulas</span>
                    </div>
                    <Progress value={course.progressPercentage} className="h-1.5 bg-white/20" />
                  </div>
                )}
              </div>
              
              <CardHeader>
                <CardTitle className="font-display text-xl line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <PlayCircle className="w-4 h-4" />
                    <span>{course.totalLessons || course.totalVideos} aulas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.totalModules} módulos</span>
                  </div>
                  {course.totalSections > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <span>{course.totalSections} seções</span>
                    </div>
                  )}
                  {course.totalDuration && course.totalDuration > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(course.totalDuration)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-0">
                <Link href={`/course/${course.courseId}`} className="w-full">
                  <Button className="w-full gap-2 group-hover:bg-primary/90">
                    {course.progressPercentage > 0 ? 'Continuar Curso' : 'Acessar Curso'}
                    <TrendingUp className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}

          {/* Placeholder for future courses */}
          <Card className="flex flex-col border-dashed border-2 bg-muted/30 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-lg">Em breve</h3>
              <p className="text-sm text-muted-foreground">
                Novos cursos sobre pastagem rotacionada e nutrição animal estão sendo preparados.
              </p>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Prospera Farm. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
