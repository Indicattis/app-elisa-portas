import { Truck, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstalacoesDashboard } from "@/hooks/useInstalacoesDashboard";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";
import { OrdensCarregamentoSlimTable } from "@/components/carregamento/OrdensCarregamentoSlimTable";

export default function LogisticaHome() {
  const { data: instalacaoMetrics, isLoading: loadingInstalacoes } = useInstalacoesDashboard();
  const { ordens: ordensCarregamento, isLoading: loadingOrdens, concluirOrdem } = useOrdensCarregamento();

  const isLoading = loadingInstalacoes || loadingOrdens;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
          <Truck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            Dashboard de Logística
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visão geral de instalações e carregamentos
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Instalações Pendentes</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {instalacaoMetrics?.instalacoesPendentes || 0}
            </div>
            <p className="text-xs text-muted-foreground">aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Instalações Concluídas</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {instalacaoMetrics?.instalacoesConcluidasMes || 0}
            </div>
            <p className="text-xs text-muted-foreground">este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Carregamentos Pendentes</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {ordensCarregamento?.filter(o => o.status !== 'concluida').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">aguardando</p>
          </CardContent>
        </Card>
      </div>

      {/* Ordens de Carregamento */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">Ordens de Carregamento</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <OrdensCarregamentoSlimTable ordens={ordensCarregamento || []} onConcluirOrdem={concluirOrdem} />
        </CardContent>
      </Card>
    </div>
  );
}