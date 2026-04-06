import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  signOut: () => Promise<void>;
}

export const ProducaoAuthContext = createContext<ProducaoAuthContextType | undefined>(undefined);

export function ProducaoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProducaoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Verificar sessão Supabase Auth
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          // Buscar dados complementares do usuário
          const { data: adminUser, error } = await supabase
            .from("admin_users")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("ativo", true)
            .maybeSingle();

          if (!mounted) return;

          if (adminUser && !error) {
            setUser({
              user_id: adminUser.user_id,
              admin_user_id: adminUser.id,
              nome: adminUser.nome,
              role: adminUser.role,
              foto_perfil_url: adminUser.foto_perfil_url,
            });
          } else {
            // Se não encontrou admin_user ou teve erro, fazer logout
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Monitorar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Apenas atualizações síncronas aqui
        if (event === 'SIGNED_IN' && session?.user) {
          // Ignorar se o user já está carregado (é apenas token refresh, não login real)
          setUser(prev => {
            if (prev) return prev; // já logado, não re-buscar
            // Login real: buscar dados do usuário
            setTimeout(() => {
              if (!mounted) return;
              supabase
                .from("admin_users")
                .select("*")
                .eq("user_id", session.user.id)
                .eq("ativo", true)
                .maybeSingle()
                .then(({ data: adminUser, error }) => {
                  if (mounted && adminUser && !error) {
                    setUser({
                      user_id: adminUser.user_id,
                      admin_user_id: adminUser.id,
                      nome: adminUser.nome,
                      role: adminUser.role,
                      foto_perfil_url: adminUser.foto_perfil_url,
                    });
                  }
                });
            }, 0);
            return prev;
          });
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed - não precisa fazer nada, sessão continua válida
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate("/producao/login", { replace: true });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, limpar estado local e redirecionar
      setUser(null);
      navigate("/producao/login", { replace: true });
    }
  };

  return (
    <ProducaoAuthContext.Provider value={{ user, loading, signOut }}>
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
