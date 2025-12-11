import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, ChevronLeft, ChevronRight, Menu, PlayCircle, User, LogOut, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface LayoutProps {
  children: React.ReactNode;
}

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

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  
  // Extract course ID from URL (either /course/:id or /course/:id/lesson/:lessonId)
  const [, paramsCourse] = useRoute("/course/:id");
  const [, paramsLesson] = useRoute("/course/:courseId/lesson/:lessonId");
  
  const courseId = paramsCourse?.id || paramsLesson?.courseId;
  
  // Fetch course data from database
  const { data: course, isLoading: courseLoading } = trpc.courses.getById.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );
  
  // Fetch lessons with module and section names
  const { data: lessonsData = [], isLoading: lessonsLoading } = trpc.lessons.getWithDetails.useQuery(
    { courseId: courseId || "" },
    { enabled: !!courseId }
  );

  // Group lessons by module and section
  const courseStructure = useMemo(() => {
    if (!lessonsData || lessonsData.length === 0) {
      return { modules: [], totalSections: 0 };
    }

    const modulesMap = new Map<string, {
      id: string;
      title: string;
      order: number;
      totalDuration: number;
      sections: Map<string, {
        id: string;
        title: string;
        order: number;
        totalDuration: number;
        lessons: typeof lessonsData;
      }>;
    }>();

    lessonsData.forEach(lesson => {
      if (!modulesMap.has(lesson.moduleId)) {
        modulesMap.set(lesson.moduleId, {
          id: lesson.moduleId,
          title: lesson.moduleName || "Módulo sem nome",
          order: lesson.moduleOrder || 0,
          totalDuration: lesson.moduleTotalDuration || 0, // Use pre-calculated value from database
          sections: new Map(),
        });
      }

      const module = modulesMap.get(lesson.moduleId)!;
      
      if (!module.sections.has(lesson.sectionId)) {
        module.sections.set(lesson.sectionId, {
          id: lesson.sectionId,
          title: lesson.sectionName || "Seção sem nome",
          order: lesson.sectionOrder || 0,
          totalDuration: lesson.sectionTotalDuration || 0, // Use pre-calculated value from database
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Course not found
  if (!course) {
    return (
      <div className="p-8 text-center">
        Curso não encontrado. <Link href="/">Voltar</Link>
      </div>
    );
  }

  const TopBar = () => {
    const { user, logout } = useAuth();
    
    const handleLogout = async () => {
      await logout();
      window.location.href = "/login";
    };
    
    return (
      <div className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Left side: Toggle + Platform Name */}
          <div className="flex items-center gap-3">
            {/* Toggle button for desktop sidebar */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden lg:flex"
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
            >
              {isDesktopSidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </Button>
            
            {/* Platform Name */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xs">
                P
              </div>
              <span className="font-bold">Prospera Academy</span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{user?.name || 'Usuário'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border shrink-0">
        <Link href={`/course/${course.courseId}`}>
          <div className="cursor-pointer hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold text-sidebar-foreground font-display">
              {course.acronym}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {course.title}
            </p>
            {course.totalDuration && course.totalDuration > 0 && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                Duração total: {formatDuration(course.totalDuration)}
              </p>
            )}
          </div>
        </Link>
        <Link href="/">
          <Button variant="outline" size="sm" className="w-full mt-4 text-xs h-7">
            <ChevronRight className="w-3 h-3 rotate-180 mr-1" />
            Trocar de Curso
          </Button>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
        <div className="p-4 space-y-6 pb-8">
          {courseStructure.modules.map((module) => (
            <div key={module.id} className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {module.title}
                </h3>
                {module.totalDuration > 0 && (
                  <span className="text-xs text-muted-foreground/60">
                    {formatDuration(module.totalDuration)}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {module.sections.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <div className="px-2 py-1.5 text-sm font-medium text-sidebar-foreground/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3 h-3" />
                        {section.title}
                      </div>
                      {section.totalDuration > 0 && (
                        <span className="text-xs text-muted-foreground/60">
                          {formatDuration(section.totalDuration)}
                        </span>
                      )}
                    </div>
                    <div className="pl-4 space-y-0.5 border-l border-sidebar-border ml-3">
                      {section.lessons.map((lesson) => {
                        const isActive = location === `/course/${course.courseId}/lesson/${lesson.lessonId}`;
                        return (
                          <Link key={lesson.lessonId} href={`/course/${course.courseId}/lesson/${lesson.lessonId}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-xs h-auto py-2 whitespace-normal text-left font-normal",
                                isActive 
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                                  : "text-muted-foreground hover:text-sidebar-foreground"
                              )}
                              onClick={() => setIsMobileSidebarOpen(false)}
                            >
                              <div className="flex items-start gap-2 w-full">
                                <PlayCircle className={cn(
                                  "w-3 h-3 mt-0.5 shrink-0",
                                  isActive ? "fill-current" : "opacity-50"
                                )} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="line-clamp-2 flex-1">{lesson.title}</span>
                                    {lesson.duration && (
                                      <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5">
                                        {formatDuration(lesson.duration)}
                                      </span>
                                    )}
                                  </div>
                                </div>
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
      {/* Desktop Sidebar - Collapsible */}
      <aside 
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300",
          isDesktopSidebarOpen ? "w-80" : "w-0"
        )}
      >
        <div className={cn(
          "h-full transition-opacity duration-300",
          isDesktopSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
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
      <main 
        className={cn(
          "flex-1 min-h-screen flex flex-col transition-all duration-300",
          isDesktopSidebarOpen ? "lg:ml-80" : "lg:ml-0"
        )}
      >
        {/* Top Navigation Bar */}
        <TopBar />
        
        <div className="flex-1 container py-8 lg:py-12 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
