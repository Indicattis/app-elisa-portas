import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProducaoUser {
  user_id: string;
  nome: string;
  role: string;
  foto_perfil_url?: string;
  codigo: string;
}

interface ProducaoAuthContextType {
  user: ProducaoUser | null;
  loading: boolean;
  signOut: () => void;
}

const ProducaoAuthContext = createContext<ProducaoAuthContextType | undefined>(undefined);

export function ProducaoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProducaoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar sessão Supabase Auth
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Buscar dados complementares do usuário
          const { data: adminUser } = await supabase
            .from("admin_users")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("setor", "fabrica")
            .eq("ativo", true)
            .single();

          if (adminUser) {
            setUser({
              user_id: adminUser.user_id,
              nome: adminUser.nome,
              role: adminUser.role,
              foto_perfil_url: adminUser.foto_perfil_url,
              codigo: adminUser.codigo_usuario,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Monitorar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: adminUser } = await supabase
            .from("admin_users")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("setor", "fabrica")
            .eq("ativo", true)
            .single();

          if (adminUser) {
            setUser({
              user_id: adminUser.user_id,
              nome: adminUser.nome,
              role: adminUser.role,
              foto_perfil_url: adminUser.foto_perfil_url,
              codigo: adminUser.codigo_usuario,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/producao/login");
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
