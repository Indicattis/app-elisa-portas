import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTabsAccess } from "@/hooks/useTabsAccess";

const Index = () => {
  const { user, loading } = useAuth();
  const { data: tabs, isLoading: tabsLoading } = useTabsAccess('sidebar');

  if (loading || tabsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Encontrar a primeira aba acessível
  const firstAccessibleTab = tabs?.find(tab => tab.can_access && tab.href && tab.href !== '#');
  
  if (firstAccessibleTab) {
    return <Navigate to={firstAccessibleTab.href} replace />;
  }

  // Se não houver nenhuma aba acessível, redirecionar para forbidden
  return <Navigate to="/forbidden" replace />;
};

export default Index;
