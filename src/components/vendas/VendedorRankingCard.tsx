import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShoppingCart, Package } from "lucide-react";
import { RankingVendedor } from "@/hooks/useRankingAnual";

interface VendedorRankingCardProps {
  vendedor: RankingVendedor;
  posicao: number;
  valorMaximo: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function VendedorRankingCard({ vendedor, posicao, valorMaximo }: VendedorRankingCardProps) {
  const percentualBarra = valorMaximo > 0 ? (vendedor.valor_total / valorMaximo) * 100 : 0;

  const getBadgeVariant = () => {
    if (posicao === 1) return "default";
    if (posicao === 2) return "secondary";
    if (posicao === 3) return "outline";
    return "outline";
  };

  const getBadgeIcon = () => {
    if (posicao === 1) return "🥇";
    if (posicao === 2) return "🥈";
    if (posicao === 3) return "🥉";
    return `${posicao}º`;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={vendedor.foto_perfil_url || undefined} />
            <AvatarFallback className="text-lg">
              {vendedor.atendente_nome?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Badge variant={getBadgeVariant()} className="text-lg font-bold px-3 py-1">
            {getBadgeIcon()}
          </Badge>
        </div>

        <h3 className="font-semibold text-lg mb-4 truncate" title={vendedor.atendente_nome}>
          {vendedor.atendente_nome}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-bold text-primary">
              {formatCurrency(vendedor.valor_total)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            <span>{vendedor.quantidade_vendas} vendas</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{vendedor.quantidade_portas} portas</span>
          </div>

          {/* Barra de progresso */}
          <div className="mt-4 pt-4 border-t">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${percentualBarra}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
