import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { useNavigate } from "react-router-dom";
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
  const { user, signOut } = useProducaoAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/hub-fabrica/login");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <InstalacoesSidebar />

        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px bg-border" />
                <Button variant="ghost" size="sm" onClick={() => navigate('/hub-fabrica')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <span className="font-semibold hidden sm:block">{title}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user && (
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {user.nome}
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
