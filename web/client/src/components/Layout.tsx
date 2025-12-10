import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronRight, Menu, PlayCircle, User } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import coursesDataRaw from "../lib/courses-data.json";
import { CoursesData } from "../lib/types";

const coursesData = coursesDataRaw as CoursesData;

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Extract course ID from URL (either /course/:id or /course/:id/lesson/:lessonId)
  const [, paramsCourse] = useRoute("/course/:id");
  const [, paramsLesson] = useRoute("/course/:courseId/lesson/:lessonId");
  
  const courseId = paramsCourse?.id || paramsLesson?.courseId;
  const currentCourse = coursesData.courses.find(c => c.id === courseId);

  if (!currentCourse) {
    return <div className="p-8 text-center">Curso não encontrado. <Link href="/">Voltar</Link></div>;
  }

  const TopBar = () => {
    const { user } = useAuth();
    
    return (
      <div className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-5xl items-center justify-end px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="font-medium text-foreground">{user?.name || 'Usuário'}</span>
          </div>
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <Link href={`/course/${currentCourse.id}`}>
          <div className="cursor-pointer hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold text-sidebar-foreground font-display">
              {currentCourse.acronym}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {currentCourse.title}
            </p>
          </div>
        </Link>
        <Link href="/">
          <Button variant="outline" size="sm" className="w-full mt-4 text-xs h-7">
            <ChevronRight className="w-3 h-3 rotate-180 mr-1" />
            Trocar de Curso
          </Button>
        </Link>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {currentCourse.modules.map((module) => (
            <div key={module.id} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                {module.title}
              </h3>
              <div className="space-y-1">
                {module.sections.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <div className="px-2 py-1.5 text-sm font-medium text-sidebar-foreground/80 flex items-center gap-2">
                      <BookOpen className="w-3 h-3" />
                      {section.title}
                    </div>
                    <div className="pl-4 space-y-0.5 border-l border-sidebar-border ml-3">
                      {section.lessons.map((lesson) => {
                        const isActive = location === `/course/${currentCourse.id}/lesson/${lesson.id}`;
                        return (
                          <Link key={lesson.id} href={`/course/${currentCourse.id}/lesson/${lesson.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-xs h-auto py-2 whitespace-normal text-left font-normal",
                                isActive 
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                                  : "text-muted-foreground hover:text-sidebar-foreground"
                              )}
                              onClick={() => setIsSidebarOpen(false)}
                            >
                              <div className="flex items-start gap-2 w-full">
                                <PlayCircle className={cn(
                                  "w-3 h-3 mt-0.5 shrink-0",
                                  isActive ? "fill-current" : "opacity-50"
                                )} />
                                <span className="line-clamp-2">{lesson.title}</span>
                              </div>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-40">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 min-h-screen flex flex-col">
        {/* Top Navigation Bar */}
        <TopBar />
        
        <div className="flex-1 container py-8 lg:py-12 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
