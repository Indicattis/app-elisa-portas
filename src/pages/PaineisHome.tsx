import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tv, Map, BookOpen, Calendar, Calculator } from "lucide-react";

const paineis = [
  {
    title: "Modo TV",
    description: "Dashboard para exibição em telas grandes",
    icon: Tv,
    path: "/paineis/tv-dashboard",
    color: "from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20",
  },
  {
    title: "Mapa de Autorizados",
    description: "Visualize autorizados no mapa",
    icon: Map,
    path: "/paineis/mapa",
    color: "from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20",
  },
  {
    title: "Diário de Bordo",
    description: "Registro de atas e reuniões",
    icon: BookOpen,
    path: "/paineis/diario-bordo",
    color: "from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20",
  },
  {
    title: "Calendário",
    description: "Gerencie eventos e compromissos",
    icon: Calendar,
    path: "/paineis/calendario",
    color: "from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20",
  },
  {
    title: "Contador de Vendas",
    description: "Acompanhe vendas em tempo real",
    icon: Calculator,
    path: "/paineis/contador-vendas",
    color: "from-pink-500/10 to-pink-600/10 hover:from-pink-500/20 hover:to-pink-600/20",
  },
];

export default function PaineisHome() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painéis e Dashboards</h1>
        <p className="text-muted-foreground mt-2">
          Selecione um painel para visualizar informações específicas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paineis.map((painel) => (
          <Link key={painel.path} to={painel.path}>
            <Card className={`h-full transition-all duration-200 hover:shadow-lg border-2 bg-gradient-to-br ${painel.color}`}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-background/50">
                    <painel.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{painel.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {painel.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
