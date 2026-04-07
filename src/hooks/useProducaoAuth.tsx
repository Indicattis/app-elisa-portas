import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    mountedRef.current = true;

    // 1. Register listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;

        if (event === 'SIGNED_OUT') {
          currentUserIdRef.current = null;
          setUser(null);
          setInitialized(true);
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          // Session still valid, no action needed
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          // Only process if user changed or not yet loaded
          if (currentUserIdRef.current === session.user.id) return;

          currentUserIdRef.current = session.user.id;
          // Use setTimeout to avoid blocking the auth state change callback
          setTimeout(async () => {
            if (!mountedRef.current) return;
            const adminUser = await fetchAdminUser(session.user.id);
            if (!mountedRef.current) return;
            if (adminUser) {
              setUser(adminUser);
            }
            // Don't sign out on failure - could be transient
            setInitialized(true);
            setLoading(false);
          }, 0);
        }
      }
    );

    // 2. THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mountedRef.current) return;

      if (session?.user) {
        currentUserIdRef.current = session.user.id;
        const adminUser = await fetchAdminUser(session.user.id);
        if (!mountedRef.current) return;
        if (adminUser) {
          setUser(adminUser);
        }
        // Don't sign out on transient failure
      }
      setInitialized(true);
      setLoading(false);
    });

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
    setUser(null);
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
