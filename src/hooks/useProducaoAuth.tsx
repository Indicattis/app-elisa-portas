import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ProducaoUser {
  user_id: string;
  admin_user_id: string;
  nome: string;
  role: string;
  foto_perfil_url?: string;
}

interface ProducaoAuthContextType {
  user: ProducaoUser | null;
  loading: boolean;
  initialized: boolean;
  signOut: () => Promise<void>;
}

export const ProducaoAuthContext = createContext<ProducaoAuthContextType | undefined>(undefined);

async function fetchAdminUser(userId: string): Promise<ProducaoUser | null> {
  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !adminUser) return null;

  return {
    user_id: adminUser.user_id,
    admin_user_id: adminUser.id,
    nome: adminUser.nome,
    role: adminUser.role,
    foto_perfil_url: adminUser.foto_perfil_url,
  };
}

export function ProducaoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProducaoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const currentUserIdRef = useRef<string | null>(null);
  const currentProfileRef = useRef<ProducaoUser | null>(null);
  const syncRequestRef = useRef(0);

  const applyUser = (nextUser: ProducaoUser | null) => {
    currentProfileRef.current = nextUser;
    setUser(nextUser);
  };

  useEffect(() => {
    mountedRef.current = true;

    const resetAuthState = () => {
      currentUserIdRef.current = null;
      applyUser(null);
      setInitialized(true);
      setLoading(false);
    };

    const hydrateFromSession = (session: Session | null, event: AuthChangeEvent) => {
      if (!mountedRef.current) return;

      if (!session?.user) {
        resetAuthState();
        return;
      }

      const nextUserId = session.user.id;
      const alreadyHydrated = currentUserIdRef.current === nextUserId && !!currentProfileRef.current;

      if (alreadyHydrated || (event === 'TOKEN_REFRESHED' && currentUserIdRef.current === nextUserId && !!currentProfileRef.current)) {
        setInitialized(true);
        setLoading(false);
        return;
      }

      currentUserIdRef.current = nextUserId;
      setLoading(true);

      const requestId = ++syncRequestRef.current;

      window.setTimeout(async () => {
        const adminUser = await fetchAdminUser(nextUserId);

        if (!mountedRef.current || requestId !== syncRequestRef.current) {
          return;
        }

        applyUser(adminUser);
        setInitialized(true);
        setLoading(false);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;

        if (event === 'SIGNED_OUT') {
          resetAuthState();
          return;
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          hydrateFromSession(session, event);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          if (!currentProfileRef.current && session?.user) {
            hydrateFromSession(session, event);
          } else {
            setInitialized(true);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
    currentUserIdRef.current = null;
    applyUser(null);
    navigate("/producao/login", { replace: true });
  };

  return (
    <ProducaoAuthContext.Provider value={{ user, loading, initialized, signOut }}>
      {children}
    </ProducaoAuthContext.Provider>
  );
}

export function useProducaoAuth() {
  const context = useContext(ProducaoAuthContext);
  if (context === undefined) {
    throw new Error("useProducaoAuth deve ser usado dentro de ProducaoAuthProvider");
  }
  return context;
}
