import { Navigate } from "react-router-dom";
import { useInterfaceAccess } from "@/hooks/useInterfaceAccess";
import { InterfaceType } from "@/types/permissions";

interface ProtectedInterfaceProps {
  children: React.ReactNode;
  interface: InterfaceType;
}

export function ProtectedInterface({ children, interface: interfaceType }: ProtectedInterfaceProps) {
  const { data: hasAccess, isLoading } = useInterfaceAccess(interfaceType);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
