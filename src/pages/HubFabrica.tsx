import { useNavigate } from "react-router-dom";
import { Factory, Wrench, Package, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  {
    title: "Fábrica",
    description: "Interface de produção",
    icon: Factory,
    path: "/producao",
    color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30",
    iconColor: "text-blue-500",
  },
  {
    title: "Instalações",
    description: "Gerenciar instalações",
    icon: Wrench,
    path: "/instalacoes",
    color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30",
    iconColor: "text-green-500",
  },
  {
    title: "Pedidos",
    description: "Gestão de pedidos",
    icon: Package,
    path: "/pedidos",
    color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30",
    iconColor: "text-orange-500",
  },
];

export default function HubFabrica() {
  const navigate = useNavigate();
  const { signOut, userRole } = useAuth();

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
            {userRole && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {userRole.nome}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl">
          {/* Title Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Selecione o Módulo
            </h1>
            <p className="text-muted-foreground">
              Escolha a área que deseja acessar
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {menuItems.map((item) => (
              <Card
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`cursor-pointer transition-all duration-200 border-2 ${item.color} hover:scale-105 hover:shadow-lg`}
              >
                <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
                  <div className={`p-4 rounded-full ${item.color} mb-4`}>
                    <item.icon className={`h-10 w-10 sm:h-12 sm:w-12 ${item.iconColor}`} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-1">
                    {item.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
