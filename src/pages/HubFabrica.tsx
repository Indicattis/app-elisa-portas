import { useNavigate, Navigate } from "react-router-dom";
import { Factory, Wrench, Package, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface ProducaoUser {
  user_id: string;
  nome: string;
  foto_perfil_url?: string;
}

const menuItems = [
  {
    title: "Fábrica",
    description: "Interface de produção",
    icon: Factory,
    path: "/hub-fabrica/producao",
  },
  {
    title: "Instalações",
    description: "Gerenciar instalações",
    icon: Wrench,
    path: "/hub-fabrica/instalacoes",
  },
  {
    title: "Pedidos",
    description: "Gestão de pedidos",
    icon: Package,
    path: "/hub-fabrica/pedidos",
  },
];

export default function HubFabrica() {
  const navigate = useNavigate();
  const [user, setUser] = useState<ProducaoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          const { data: adminUser, error } = await supabase
            .from("admin_users")
            .select("user_id, nome, foto_perfil_url")
            .eq("user_id", session.user.id)
            .eq("ativo", true)
            .maybeSingle();

          if (!mounted) return;

          if (adminUser && !error) {
            setUser({
              user_id: adminUser.user_id,
              nome: adminUser.nome,
              foto_perfil_url: adminUser.foto_perfil_url,
            });
          } else {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate("/hub-fabrica/login", { replace: true });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      navigate("/hub-fabrica/login", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/hub-fabrica/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Factory className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Hub de Operações</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.nome}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Selecione o Módulo
            </h1>
            <p className="text-muted-foreground text-sm">
              Escolha a área que deseja acessar
            </p>
          </div>

          {/* Buttons List */}
          <div className="flex flex-col items-center gap-3">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-[300px] h-14 text-base font-medium justify-start gap-3"
                variant="default"
              >
                <item.icon className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span>{item.title}</span>
                  <span className="text-xs font-normal opacity-80">{item.description}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
