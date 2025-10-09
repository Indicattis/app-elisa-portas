import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRankingAnual } from "@/hooks/useRankingAnual";
import { VendedorRankingCard } from "@/components/vendas/VendedorRankingCard";
import { Trophy, TrendingUp, Users, Package } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function ForcaVendas() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const { data: ranking, isLoading } = useRankingAnual(selectedYear);

  const totalVendedores = ranking?.length || 0;
  const valorTotalAno = ranking?.reduce((acc, v) => acc + v.valor_total, 0) || 0;
  const totalPortasAno = ranking?.reduce((acc, v) => acc + v.quantidade_portas, 0) || 0;
  const valorMaximo = ranking?.[0]?.valor_total || 0;

  // Gerar anos para o seletor (últimos 5 anos)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Força de Vendas</h1>
        </div>
        
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards Estatísticos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendedores}</div>
            <p className="text-xs text-muted-foreground">
              No ranking de {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Vendido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotalAno)}</div>
            <p className="text-xs text-muted-foreground">
              Sem frete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Portas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPortasAno}</div>
            <p className="text-xs text-muted-foreground">
              Vendidas no ano
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Ranking */}
      {ranking && ranking.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ranking.map((vendedor, index) => (
            <VendedorRankingCard
              key={vendedor.atendente_id}
              vendedor={vendedor}
              posicao={index + 1}
              valorMaximo={valorMaximo}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum dado de vendas encontrado para {selectedYear}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
