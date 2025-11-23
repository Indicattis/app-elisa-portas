import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaineisHeaderProps {
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
}

export function PaineisHeader({ sidebarVisible, onToggleSidebar }: PaineisHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="flex items-center justify-between px-2 h-12">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleSidebar}
            title={sidebarVisible ? "Esconder sidebar" : "Mostrar sidebar"}
          >
            {sidebarVisible ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Painéis</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
              <Settings className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
