import { useAuth } from "./useAuth";

export function useCanEditVenda(vendaAtendenteId?: string) {
  const { user, isAdmin } = useAuth();

  if (!user || !vendaAtendenteId) {
    return { canEdit: false, loading: false };
  }

  const canEdit = isAdmin || vendaAtendenteId === user.id;

  return { canEdit, loading: false };
}
