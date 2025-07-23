
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string;
  role: 'administrador' | 'atendente' | 'gerente_comercial' | 'gerente_fabril';
  created_at: string;
  ativo: boolean;
  nome: string;
  foto_perfil_url: string | null;
  user_id: string;
}

interface AuthContextType {
  user: User | null;
  userRole: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  isAtendente: boolean;
  isGerenteComercial: boolean;
  isGerenteFabril: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const fetchUserRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }

        if (mounted) {
          setUserRole(data);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setUserRole(null);
          }
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          // Usar setTimeout para evitar loop infinito
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          // Usar setTimeout para evitar loop infinito
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setUser(session.user);
          setLoading(false);
        }
      }
    );

    // Inicializar auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message,
        });
        throw error;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: error.message,
        });
        throw error;
      }

      toast({
        title: "Cadastro realizado",
        description: "Verifique seu email para confirmar a conta.",
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userRole?.role === 'administrador';
  const isAtendente = userRole?.role === 'atendente';
  const isGerenteComercial = userRole?.role === 'gerente_comercial';
  const isGerenteFabril = userRole?.role === 'gerente_fabril';

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      loading, 
      isAdmin, 
      isAtendente,
      isGerenteComercial,
      isGerenteFabril,
      signOut,
      signIn,
      signUp
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
