import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarioSemanalExpedicaoMobile } from "@/components/expedicao/CalendarioSemanalExpedicaoMobile";
import { CalendarioMensalExpedicaoDesktop } from "@/components/expedicao/CalendarioMensalExpedicaoDesktop";
import { CalendarioSemanalExpedicaoDesktop } from "@/components/expedicao/CalendarioSemanalExpedicaoDesktop";
import { useOrdensCarregamentoCalendario } from "@/hooks/useOrdensCarregamentoCalendario";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { OrdensCarregamentoDisponiveis } from "@/components/expedicao/OrdensCarregamentoDisponiveis";
import { OrdemCarregamentoDetails } from "@/components/expedicao/OrdemCarregamentoDetails";
import { EditarOrdemCarregamentoDrawer } from "@/components/expedicao/EditarOrdemCarregamentoDrawer";

export default function AgendamentoExpedicaoFabrica() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'semanal' | 'mensal'>('mensal');
  const { ordens, isLoading, deleteOrdem, updateOrdem, isUpdating } = useOrdensCarregamentoCalendario(
    currentDate, 
    tipoVisualizacao === 'mensal' ? 'month' : 'week'
  );
  
  const [refreshOrdensDisponiveis, setRefreshOrdensDisponiveis] = useState(0);
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemCarregamento | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOrdem, setEditOrdem] = useState<OrdemCarregamento | null>(null);
  const [editOpen, setEditOpen] = useState(false);

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
    setEditOrdem(ordem);
    setEditOpen(true);
  };

  const handleSaveEdit = async (data: {
    data_carregamento: string;
    hora_carregamento: string;
    tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro' | null;
    responsavel_carregamento_id: string | null;
    responsavel_carregamento_nome: string | null;
  }) => {
    if (!editOrdem) return;

    await updateOrdem({
      id: editOrdem.id,
      data: {
        data_carregamento: data.data_carregamento,
        hora: data.hora_carregamento,
        hora_carregamento: data.hora_carregamento,
        tipo_carregamento: data.tipo_carregamento,
        responsavel_carregamento_id: data.responsavel_carregamento_id,
        responsavel_carregamento_nome: data.responsavel_carregamento_nome,
        status: 'agendada',
      },
    });
  };

  const handleOrdemDropped = () => {
    setRefreshOrdensDisponiveis(prev => prev + 1);
  };

  const handleRemoverDoCalendario = async (id: string) => {
    try {
      await updateOrdem({
        id,
        data: { 
          data_carregamento: null, 
          status: 'pendente',
          tipo_carregamento: null,
          responsavel_carregamento_id: null,
          responsavel_carregamento_nome: null,
          hora_carregamento: null,
        },
      });
      toast.success("Ordem removida do calendário");
      setRefreshOrdensDisponiveis(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro ao remover ordem do calendário");
    }
  };

  const handleBaixarPDF = () => {
    toast.info("Funcionalidade de PDF em desenvolvimento");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario"] });
    toast.success("Calendário atualizado");
  };

  const handleOrdemClick = (ordem: OrdemCarregamento) => {
    setSelectedOrdem(ordem);
    setDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold">Calendário Expedição</h1>
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
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Atualizar</span>
            </Button>
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
            {/* Lista de Ordens Disponíveis no topo (apenas desktop) */}
            {!isMobile && (
              <OrdensCarregamentoDisponiveis key={refreshOrdensDisponiveis} />
            )}

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
                onUpdateOrdem={handleUpdateOrdem}
                onOrdemAdded={handleOrdemDropped}
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
                  onOrdemClick={handleOrdemClick}
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
                  onOrdemClick={handleOrdemClick}
                />
              )
            )}
          </>
        )}
      </main>

      {/* Sidebar de Detalhes */}
      <OrdemCarregamentoDetails
        ordem={selectedOrdem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Drawer de Edição */}
      <EditarOrdemCarregamentoDrawer
        ordem={editOrdem}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
