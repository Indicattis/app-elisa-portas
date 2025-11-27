import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, TrendingUp, CreditCard, Wallet, FileText } from "lucide-react";

export default function FinanceiroHome() {
  const navigate = useNavigate();

  const modulos = [
    {
      title: "Faturamento",
      description: "Controle de notas fiscais e faturamento",
      icon: Receipt,
      path: "/dashboard/administrativo/financeiro/faturamento",
      color: "text-green-600"
    },
    {
      title: "Notas Fiscais",
      description: "Gestão de notas fiscais de entrada e saída",
      icon: FileText,
      path: "/dashboard/administrativo/financeiro/notas-fiscais",
      color: "text-orange-600"
    },
    {
      title: "DRE",
      description: "Demonstrativo de Resultados do Exercício",
      icon: TrendingUp,
      path: "/dashboard/administrativo/financeiro/dre",
      color: "text-blue-600"
    },
    {
      title: "Despesas",
      description: "Controle de despesas operacionais",
      icon: CreditCard,
      path: "/dashboard/administrativo/financeiro/despesas",
      color: "text-red-600"
    },
    {
      title: "Gestão de Caixa",
      description: "Controle de depósitos e movimentações",
      icon: Wallet,
      path: "/dashboard/administrativo/financeiro/caixa",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground mt-2">
          Gestão financeira e contábil da empresa
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
