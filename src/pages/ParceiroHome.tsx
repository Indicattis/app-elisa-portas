import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, UserCheck } from "lucide-react";

export default function ParceiroHome() {
  const navigate = useNavigate();

  const parceiros = [
    {
      title: "Autorizados",
      description: "Gerenciar parceiros autorizados",
      icon: UserCheck,
      path: "/dashboard/vendas/parceiros/autorizados",
      color: "text-blue-600"
    },
    {
      title: "Representantes",
      description: "Gerenciar representantes comerciais",
      icon: Users,
      path: "/dashboard/vendas/parceiros/representantes",
      color: "text-green-600"
    },
    {
      title: "Franqueados",
      description: "Gerenciar franqueados",
      icon: Building2,
      path: "/dashboard/vendas/parceiros/franqueados",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Parceiros</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todos os tipos de parceiros comerciais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parceiros.map((parceiro) => {
          const Icon = parceiro.icon;
          return (
            <Card
              key={parceiro.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(parceiro.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className={`h-8 w-8 ${parceiro.color}`} />
                  <CardTitle>{parceiro.title}</CardTitle>
                </div>
                <CardDescription>{parceiro.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
