import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  // Se o usuário estiver autenticado, redireciona para o dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-primary">APP Elisa Portas</h1>
          <p className="text-xl text-muted-foreground">
            Sistema de gerenciamento de leads para Elisaportas
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Faça login para acessar o dashboard e gerenciar seus leads
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/auth">Fazer Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Ir para Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
