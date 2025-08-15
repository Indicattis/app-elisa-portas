import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, XCircle, CheckCircle2, Snowflake, DollarSign } from "lucide-react";

interface OrcamentoStatsProps {
  orcamentos: any[];
}

export function OrcamentoStats({ orcamentos }: OrcamentoStatsProps) {
  const valorTotal = orcamentos.reduce((sum, orc) => sum + (Number(orc.valor_total) || 0), 0);
  
  const statusCounts = {
    pendente: orcamentos.filter(orc => orc.status === 'pendente').length, // Em aberto
    congelado: orcamentos.filter(orc => orc.status === 'congelado').length, // Congelado
    perdido: orcamentos.filter(orc => orc.status === 'perdido').length, // Perdido
    vendido: orcamentos.filter(orc => orc.status === 'vendido').length, // Vendido
  };

  const valorPerdidos = orcamentos
    .filter(orc => orc.status === 'perdido')
    .reduce((sum, orc) => sum + (Number(orc.valor_total) || 0), 0);

  // Ranking de motivos de perda
  const motivosPerda = orcamentos
    .filter(orc => orc.status === 'perdido' && orc.motivo_perda)
    .reduce((acc, orc) => {
      acc[orc.motivo_perda] = (acc[orc.motivo_perda] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topMotivos = Object.entries(motivosPerda)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3);

  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getPercentage = (count: number) => 
    orcamentos.length > 0 ? ((count / orcamentos.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(valorTotal)}</div>
          <p className="text-xs text-muted-foreground">
            {orcamentos.length} orçamentos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{statusCounts.pendente}</div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(statusCounts.pendente)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Congelados</CardTitle>
          <Snowflake className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{statusCounts.congelado}</div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(statusCounts.congelado)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Perdidos</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{statusCounts.perdido}</div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(statusCounts.perdido)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendidos</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{statusCounts.vendido}</div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(statusCounts.vendido)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Perdidos</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(valorPerdidos)}</div>
          <p className="text-xs text-muted-foreground">
            {statusCounts.perdido} orçamentos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Motivos de Perda</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {topMotivos.length > 0 ? (
              topMotivos.map(([motivo, count], index) => (
                <div key={motivo} className="flex items-center justify-between">
                  <span className="text-xs capitalize">{motivo}</span>
                  <Badge variant="outline" className="text-xs">
                    {count as number}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Sem perdas</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}