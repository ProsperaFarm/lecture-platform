import { User, LogOut } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SimpleLayoutProps {
  children: React.ReactNode;
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Platform Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-sm">
              P
            </div>
            <span className="font-bold text-lg">Prospera Academy</span>
          </div>
          
          {/* User Menu */}
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

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
