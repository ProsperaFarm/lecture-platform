import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, PlayCircle, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import coursesDataRaw from "../lib/courses-data.json";
import { CoursesData } from "../lib/types";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

const coursesData = coursesDataRaw as CoursesData;

export default function CourseSelection() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingAuth } = trpc.auth.me.useQuery();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      setLocation("/login");
    }
  }, [user, isLoadingAuth, setLocation]);

  // Show loading while checking auth
  if (isLoadingAuth) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-display">
              P
            </div>
            <span className="font-display font-bold text-xl text-foreground">Prospera Academy</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline-block">Bem-vindo, Aluno</span>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
              A
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
          {coursesData.courses.map((course) => (
            <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group">
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <PlayCircle className="w-4 h-4" />
                    <span>{course.totalVideos} aulas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.modules.length} módulos</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0">
                <Link href={`/course/${course.id}`} className="w-full">
                  <Button className="w-full gap-2 group-hover:bg-primary/90">
                    Acessar Curso
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
