import { useState } from "react";
import { Plus, Download, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarioSemanalExpedicaoMobile } from "@/components/expedicao/CalendarioSemanalExpedicaoMobile";
import { CalendarioMensalExpedicaoDesktop } from "@/components/expedicao/CalendarioMensalExpedicaoDesktop";
import { CalendarioSemanalExpedicaoDesktop } from "@/components/expedicao/CalendarioSemanalExpedicaoDesktop";
import { useOrdensCarregamentoCalendario } from "@/hooks/useOrdensCarregamentoCalendario";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import logoExpedicao from "@/assets/logo-instalacoes.png";
import { OrdensCarregamentoDisponiveis } from "@/components/expedicao/OrdensCarregamentoDisponiveis";

export default function Expedicao() {
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'semanal' | 'mensal'>('mensal');
  const { ordens, isLoading, deleteOrdem, updateOrdem, isUpdating } = useOrdensCarregamentoCalendario(
    currentDate, 
    tipoVisualizacao === 'mensal' ? 'month' : 'week'
  );
  
  const [refreshOrdensDisponiveis, setRefreshOrdensDisponiveis] = useState(0);

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleUpdateOrdem = async (params: { id: string; data: Partial<OrdemCarregamento> }) => {
    await updateOrdem(params);
  };

  const handleDayClick = (date: Date) => {
    // Implementar navegação para criar nova ordem se necessário
  };

  const handleEdit = (ordem: OrdemCarregamento) => {
    // Implementar edição de ordem
    toast.info("Funcionalidade de edição em desenvolvimento");
  };

  const handleOrdemDropped = () => {
    setRefreshOrdensDisponiveis(prev => prev + 1);
  };

  const handleRemoverDoCalendario = async (id: string) => {
    try {
      await updateOrdem({
        id,
        data: { data_carregamento: null, status: 'pendente' },
      });
      toast.success("Ordem removida do calendário");
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro ao remover ordem do calendário");
    }
  };

  const handleBaixarPDF = () => {
    toast.info("Funcionalidade de PDF em desenvolvimento");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoExpedicao} alt="Logo" className="h-9 w-9 object-contain" />
            <div>
              <h1 className="text-lg font-semibold">Expedição</h1>
              <p className="text-xs text-muted-foreground">Gerenciar carregamentos</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Toggle Semana/Mês (desktop) */}
            {!isMobile && (
              <div className="flex gap-1 border rounded-md p-1 mr-2">
                <Button 
                  variant={tipoVisualizacao === 'semanal' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setTipoVisualizacao('semanal')}
                  className="h-8 px-3 text-xs"
                >
                  Semana
                </Button>
                <Button 
                  variant={tipoVisualizacao === 'mensal' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setTipoVisualizacao('mensal')}
                  className="h-8 px-3 text-xs"
                >
                  Mês
                </Button>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleBaixarPDF}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="p-4 pb-8 space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando calendário...</p>
          </div>
        ) : (
          <>
            {/* Calendários */}
            {isMobile ? (
              <CalendarioSemanalExpedicaoMobile
                startDate={currentDate}
                ordens={ordens}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onToday={handleToday}
                onDayClick={handleDayClick}
                onEdit={handleEdit}
                onRemoverDoCalendario={handleRemoverDoCalendario}
              />
            ) : (
              tipoVisualizacao === 'semanal' ? (
                <CalendarioSemanalExpedicaoDesktop
                  startDate={currentDate}
                  ordens={ordens}
                  onPreviousWeek={handlePreviousWeek}
                  onNextWeek={handleNextWeek}
                  onToday={handleToday}
                  onUpdateOrdem={handleUpdateOrdem}
                  onEdit={handleEdit}
                  onRemoverDoCalendario={handleRemoverDoCalendario}
                  onOrdemDropped={handleOrdemDropped}
                />
              ) : (
                <CalendarioMensalExpedicaoDesktop
                  currentMonth={currentDate}
                  ordens={ordens}
                  onMonthChange={setCurrentDate}
                  onUpdateOrdem={handleUpdateOrdem}
                  onEdit={handleEdit}
                  onRemoverDoCalendario={handleRemoverDoCalendario}
                  onOrdemDropped={handleOrdemDropped}
                />
              )
            )}

            {/* Lista de Ordens Disponíveis abaixo (apenas desktop) */}
            {!isMobile && (
              <OrdensCarregamentoDisponiveis key={refreshOrdensDisponiveis} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
