import { useNavigate } from "react-router-dom";
import { Receipt, Coins, Wallet, BadgeDollarSign, DollarSign, Lock, Landmark, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MinimalistLayout } from "@/components/MinimalistLayout";

const menuItems = [
  { label: "Faturamento", icon: Receipt, path: "/administrativo/financeiro/faturamento", ativo: true },
  { label: "Custos", icon: Coins, path: "/administrativo/financeiro/custos", ativo: true },
  { label: "Gestão de Caixa", icon: Wallet, path: "/administrativo/financeiro/caixa/gestao", ativo: true },
  { label: "Contas a Pagar", icon: BadgeDollarSign, path: "/administrativo/financeiro/caixa/contas-a-pagar", ativo: false },
  { label: "Contas a Receber", icon: Receipt, path: "/administrativo/financeiro/caixa/contas-a-receber", ativo: true },
  { label: "Gastos", icon: DollarSign, path: "/administrativo/financeiro/gastos", ativo: true },
  { label: "Bancos", icon: Landmark, path: "/administrativo/financeiro/bancos", ativo: true },
];

export default function FinanceiroHub() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClick = (item: typeof menuItems[0]) => {
    if (item.ativo) {
      navigate(item.path);
    } else {
      toast({
        title: "Em desenvolvimento",
        description: `A página ${item.label} estará disponível em breve.`,
      });
    }
  };

  return (
    <MinimalistLayout
      title="Financeiro"
      subtitle="Gestão financeira"
      backPath="/administrativo"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "Financeiro" },
      ]}
    >
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              disabled={!item.ativo}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left
                ${item.ativo
                  ? 'bg-primary/5 border border-primary/10 hover:bg-primary/10 cursor-pointer'
                  : 'bg-muted/30 border border-muted/20 opacity-50 cursor-not-allowed'
                }`}
            >
              <div className={`p-2 rounded-lg ${item.ativo ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <span className={`flex-1 text-sm font-medium ${item.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              {item.ativo ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </MinimalistLayout>
  );
}
