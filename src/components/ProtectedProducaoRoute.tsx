import { Navigate, useLocation } from "react-router-dom";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";

interface ProtectedProducaoRouteProps {
  children: React.ReactNode;
}

export function ProtectedProducaoRoute({ children }: ProtectedProducaoRouteProps) {
  const { user, loading } = useProducaoAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/producao/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
