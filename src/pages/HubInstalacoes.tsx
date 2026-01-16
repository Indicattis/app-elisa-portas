import { useNavigate, Navigate } from "react-router-dom";
import { Truck, CalendarDays, ClipboardList, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";

const menuItems = [
  {
    title: "Calendário Expedição",
    description: "Agendamento de carregamentos",
    icon: Truck,
    path: "/hub-fabrica/instalacoes/agendamento",
  },
  {
    title: "Cronograma",
    description: "Cronograma de instalações",
    icon: CalendarDays,
    path: "/hub-fabrica/instalacoes/cronograma",
  },
  {
    title: "Controle",
    description: "Controle de instalações",
    icon: ClipboardList,
    path: "/hub-fabrica/instalacoes/controle",
  },
];

export default function HubInstalacoes() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useProducaoAuth();

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
            <Button variant="ghost" size="icon" onClick={() => navigate("/hub-fabrica")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-lg">Instalações</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.nome}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
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
              Selecione a Área
            </h1>
            <p className="text-muted-foreground text-sm">
              Escolha o módulo que deseja acessar
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
