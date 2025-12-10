import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronRight, Menu, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import courseDataRaw from "../lib/course-data.json";
import { CourseData } from "../lib/types";

const courseData = courseDataRaw as CourseData;

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground font-display">
          {courseData.course.acronym}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {courseData.course.title}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {courseData.course.modules.map((module) => (
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
                        const isActive = location === `/lesson/${lesson.id}`;
                        return (
                          <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
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
        <div className="flex-1 container py-8 lg:py-12 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
