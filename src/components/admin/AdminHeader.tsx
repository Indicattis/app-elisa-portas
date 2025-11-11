import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AdminHeader() {
  const { userRole, signOut } = useAuth();
  const navigate = useNavigate();

  if (!userRole) return null;

  const getUserInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground">Administração</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userRole.foto_perfil_url || undefined} alt={userRole.nome} />
            <AvatarFallback className="text-sm font-medium">
              {getUserInitials(userRole.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col">
            <span className="font-medium text-foreground leading-none">{userRole.nome}</span>
            <span className="text-sm text-muted-foreground capitalize leading-none mt-1">
              {userRole.role?.replace("_", " ")}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut()}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
