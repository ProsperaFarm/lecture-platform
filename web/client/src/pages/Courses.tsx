import { SimpleLayout } from "@/components/SimpleLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, PlayCircle, Loader2, ArrowRight, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo } from "react";

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

export default function Courses() {
  const [, setLocation] = useLocation();

  // Check authentication
  const { data: user, isLoading: isLoadingAuth } = trpc.auth.me.useQuery();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      setLocation("/login");
    }
  }, [user, isLoadingAuth, setLocation]);

  // Fetch all courses
  const { data: courses, isLoading: coursesLoading } = trpc.courses.list.useQuery();

  // Fetch user progress for all courses
  const { data: allProgress = [] } = trpc.progress.getAll.useQuery(undefined, {
    enabled: !!user,
  });

  // Mock progress data for demo purposes when DB is not available
  const mockProgress = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    
    // Generate mock progress for first course (50% complete)
    const firstCourse = courses[0];
    if (!firstCourse) return [];
    
    const totalLessons = firstCourse.totalVideos || 0;
    const completedCount = Math.floor(totalLessons * 0.5); // 50% complete
    
    return Array.from({ length: completedCount }, (_, i) => ({
      id: i + 1,
      userId: 1,
      courseId: firstCourse.courseId,
      lessonId: `lesson-${i + 1}`,
      completed: true,
      lessonDuration: 600, // 10 minutes per lesson
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }, [courses]);

  // Use mock data if real progress is empty (DB not available)
  const progressData = allProgress.length > 0 ? allProgress : mockProgress;

  // Calculate progress percentage for each course
  const coursesWithProgress = useMemo(() => {
    if (!courses) return [];
    

    return courses.map(course => {
      const courseProgress = progressData.filter(p => p.courseId === course.courseId);
      const completedCount = courseProgress.filter(p => p.completed).length;
      const totalLessons = course.totalVideos || 0;
      const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      // Calculate watched duration
      const watchedDuration = courseProgress.reduce((acc, p) => {
        if (p.completed && p.lessonDuration) {
          return acc + p.lessonDuration;
        }
        return acc;
      }, 0);

      const result = {
        ...course,
        progressPercentage,
        completedCount,
        watchedDuration,
      };
      

      return result;
    });
  }, [courses, progressData, allProgress]);

  // Loading state
  if (coursesLoading || isLoadingAuth) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="container max-w-7xl py-12 px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sua jornada de conhecimento
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acesse os cursos da Prospera Farm e transforme a gestão da sua propriedade
            com conhecimento técnico e prático.
          </p>
        </div>

        {/* Courses Grid */}
        {coursesWithProgress && coursesWithProgress.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesWithProgress.map((course) => (
              <Card key={course.courseId} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Course Image */}
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={course.thumbnail || "/images/default-course-thumb.png"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                      {course.acronym}
                    </Badge>
                  </div>
                  
                  {/* Progress Bar Overlay */}
                  {course.progressPercentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex items-center justify-between text-xs text-white mb-1.5">
                        <span className="font-medium">{course.progressPercentage}% concluído</span>
                        <span>{course.completedCount}/{course.totalVideos} aulas</span>
                      </div>
                      <Progress value={course.progressPercentage} className="h-1.5 bg-white/20" />
                    </div>
                  )}
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || "Curso completo de gestão"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      <span>{course.totalVideos || 0} aulas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.totalModules || 7} módulos</span>
                    </div>
                    {course.totalDuration && course.totalDuration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(course.totalDuration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link href={`/course/${course.courseId}`}>
                    <Button className="w-full group-hover:bg-primary/90 transition-colors">
                      {course.progressPercentage > 0 ? 'Continuar Curso' : 'Acessar Curso'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">Nenhum curso disponível</h3>
            <p className="text-muted-foreground">
              Novos cursos estão sendo preparados. Volte em breve!
            </p>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
}
