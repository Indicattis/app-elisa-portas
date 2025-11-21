import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Shield, AlertCircle } from "lucide-react";
import { DepositoCaixa } from "@/types/caixa";

interface CaixaIndicadoresProps {
  depositos: DepositoCaixa[];
}

export function CaixaIndicadores({ depositos }: CaixaIndicadoresProps) {
  const total = depositos.reduce((sum, dep) => sum + Number(dep.valor), 0);
  
  const giroCaixa = depositos
    .filter(d => d.categoria === 'giro_caixa')
    .reduce((sum, dep) => sum + Number(dep.valor), 0);
  
  const travesseiro = depositos
    .filter(d => d.categoria === 'travesseiro')
    .reduce((sum, dep) => sum + Number(dep.valor), 0);
  
  const precaucoes = depositos
    .filter(d => d.categoria === 'precaucoes')
    .reduce((sum, dep) => sum + Number(dep.valor), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Depositado</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(total)}</div>
          <p className="text-xs text-muted-foreground">
            {depositos.length} {depositos.length === 1 ? 'depósito' : 'depósitos'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Giro de Caixa</CardTitle>
          <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>
            {formatCurrency(giroCaixa)}
          </div>
          <p className="text-xs text-muted-foreground">
            {((giroCaixa / total) * 100 || 0).toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Travesseiro</CardTitle>
          <Shield className="h-4 w-4" style={{ color: 'hsl(var(--info))' }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--info))' }}>
            {formatCurrency(travesseiro)}
          </div>
          <p className="text-xs text-muted-foreground">
            {((travesseiro / total) * 100 || 0).toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Precauções</CardTitle>
          <AlertCircle className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color: 'hsl(var(--warning))' }}>
            {formatCurrency(precaucoes)}
          </div>
          <p className="text-xs text-muted-foreground">
            {((precaucoes / total) * 100 || 0).toFixed(1)}% do total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
