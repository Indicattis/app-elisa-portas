import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Wrench, ArrowLeft } from "lucide-react";
import { 
  SidebarProvider, 
  SidebarInset, 
  SidebarTrigger
} from "@/components/ui/sidebar";
import { InstalacoesSidebar } from "@/components/InstalacoesSidebar";

interface InstalacoesLayoutProps {
  children: ReactNode;
  title?: string;
}

export function InstalacoesLayout({ children, title = "Instalações" }: InstalacoesLayoutProps) {
  const { userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Verifica se está na home de instalações
  const isInstalacoesHome = location.pathname === '/instalacoes' || location.pathname === '/instalacoes/';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <InstalacoesSidebar />

        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px bg-border mx-1" />
                {!isInstalacoesHome ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/instalacoes')}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Voltar</span>
                  </Button>
                ) : (
                  <>
                    <Wrench className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg">{title}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {userRole && (
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {userRole.nome}
                  </span>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
