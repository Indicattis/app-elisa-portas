import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, FileText, Package } from "lucide-react";

export default function ComprasHome() {
  const navigate = useNavigate();

  const modulos = [
    {
      title: "Fornecedores",
      description: "Gerenciar cadastro de fornecedores",
      icon: Truck,
      path: "/dashboard/administrativo/compras/fornecedores",
      color: "text-orange-600"
    },
    {
      title: "Requisições",
      description: "Gerenciar requisições de compra",
      icon: FileText,
      path: "/dashboard/administrativo/compras/requisicoes-compra",
      color: "text-blue-600"
    },
    {
      title: "Estoque",
      description: "Controle de estoque e inventário",
      icon: Package,
      path: "/dashboard/administrativo/compras/estoque",
      color: "text-green-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compras</h1>
        <p className="text-muted-foreground mt-2">
          Gestão de fornecedores, requisições e estoque
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modulos.map((modulo) => {
          const Icon = modulo.icon;
          return (
            <Card
              key={modulo.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(modulo.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className={`h-8 w-8 ${modulo.color}`} />
                  <CardTitle>{modulo.title}</CardTitle>
                </div>
                <CardDescription>{modulo.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
