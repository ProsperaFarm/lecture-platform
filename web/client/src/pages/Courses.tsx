import { SimpleLayout } from "@/components/SimpleLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, PlayCircle, Loader2, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

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
  const { data: courses, isLoading: coursesLoading } = trpc.courses.getAll.useQuery();

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
        {courses && courses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.courseId} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Course Image */}
                {course.imageUrl && (
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                        {course.acronym}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || "Curso completo de gestão"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      <span>{course.totalVideos || 0} aulas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>7 módulos</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/course/${course.courseId}`}>
                    <Button className="w-full group-hover:bg-primary/90 transition-colors">
                      Acessar Curso
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
