import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ProducaoUser {
  user_id: string;
  nome: string;
  role: string;
  foto_perfil_url?: string;
  codigo: string;
  timestamp: string;
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
    // Verificar se há sessão armazenada
    const sessionData = localStorage.getItem("producao_session");
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData) as ProducaoUser;
        
        // Verificar se a sessão não expirou (24 horas)
        const timestamp = new Date(session.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setUser(session);
        } else {
          localStorage.removeItem("producao_session");
        }
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
        localStorage.removeItem("producao_session");
      }
    }
    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem("producao_session");
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
