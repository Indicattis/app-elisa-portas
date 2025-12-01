import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Shield, AlertCircle, Wallet } from "lucide-react";
import { DepositoCaixa } from "@/types/caixa";

interface CaixaIndicadoresProps {
  depositos: DepositoCaixa[];
  giroCaixaTotal: number;
  capitalTomado: number;
  totalTravesseiro: number;
  totalPrecaucoes: number;
}

export function CaixaIndicadores({ depositos, giroCaixaTotal, capitalTomado, totalTravesseiro, totalPrecaucoes }: CaixaIndicadoresProps) {
  const valorDisponivel = giroCaixaTotal - capitalTomado;
  
  const totalDepositos = totalTravesseiro + totalPrecaucoes;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Giro de Caixa (Total)</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(giroCaixaTotal)}</div>
          <p className="text-xs text-muted-foreground">
            Capital disponível
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Capital Tomado</CardTitle>
          <TrendingUp className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(capitalTomado)}
          </div>
          <p className="text-xs text-muted-foreground">
            Capital utilizado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Disponível</CardTitle>
          <DollarSign className="h-4 w-4" style={{ color: valorDisponivel >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }} />
        </CardHeader>
        <CardContent>
          <div 
            className="text-2xl font-bold" 
            style={{ color: valorDisponivel >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}
          >
            {formatCurrency(valorDisponivel)}
          </div>
          <p className="text-xs text-muted-foreground">
            Giro - Capital Tomado
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
            {formatCurrency(totalTravesseiro)}
          </div>
          <p className="text-xs text-muted-foreground">
            {((totalTravesseiro / totalDepositos) * 100 || 0).toFixed(1)}% dos depósitos
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
            {formatCurrency(totalPrecaucoes)}
          </div>
          <p className="text-xs text-muted-foreground">
            {((totalPrecaucoes / totalDepositos) * 100 || 0).toFixed(1)}% dos depósitos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
