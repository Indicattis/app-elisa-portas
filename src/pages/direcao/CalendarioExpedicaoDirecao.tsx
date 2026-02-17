import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, CalendarDays, ArrowLeft, LogOut, RefreshCw } from "lucide-react";

import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrdensCarregamentoCalendario } from "@/hooks/useOrdensCarregamentoCalendario";
import { useNeoInstalacoes, useNeoInstalacoesSemData } from "@/hooks/useNeoInstalacoes";
import { useNeoCorrecoes, useNeoCorrecoesSemData } from "@/hooks/useNeoCorrecoes";
import { OrdensCarregamentoDisponiveis } from "@/components/expedicao/OrdensCarregamentoDisponiveis";
import { OrdemCarregamentoDetails } from "@/components/expedicao/OrdemCarregamentoDetails";
import { EditarOrdemCarregamentoDrawer } from "@/components/expedicao/EditarOrdemCarregamentoDrawer";
import { CalendarioSemanalExpedicaoMobile } from "@/components/expedicao/CalendarioSemanalExpedicaoMobile";
import { CalendarioSemanalExpedicaoDesktop } from "@/components/expedicao/CalendarioSemanalExpedicaoDesktop";
import { CalendarioMensalExpedicaoDesktop } from "@/components/expedicao/CalendarioMensalExpedicaoDesktop";
import { NeoServicosDisponiveis } from "@/components/expedicao/NeoServicosDisponiveis";
import { NeoServicosDisponiveisMobile } from "@/components/expedicao/NeoServicosDisponiveisMobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays, startOfWeek, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function CalendarioExpedicaoDirecao() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('month');
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemCarregamento | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingOrdem, setEditingOrdem] = useState<OrdemCarregamento | null>(null);

  const { ordens, isLoading, updateOrdem } = useOrdensCarregamentoCalendario(currentDate, viewType);
  const { neoInstalacoes } = useNeoInstalacoes(currentDate, viewType);
  const { neoCorrecoes } = useNeoCorrecoes(currentDate, viewType);
  
  // Neo serviços sem data (pendentes de agendamento)
  const { neoInstalacoesSemData, updateNeoInstalacao, isLoading: isLoadingNeoInstalacoes, reorganizarNeoInstalacoes } = useNeoInstalacoesSemData();
  const { neoCorrecoesSemData, updateNeoCorrecao, isLoading: isLoadingNeoCorrecoes, reorganizarNeoCorrecoes } = useNeoCorrecoesSemData();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const handlePreviousWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
  const handleToday = () => {
    if (viewType === 'month') {
      setCurrentDate(startOfMonth(new Date()));
    } else {
      setCurrentDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    }
  };

  const handleUpdateOrdem = async (params: { id: string; data: Partial<OrdemCarregamento> }) => {
    await updateOrdem(params);
  };

  const handleEdit = (ordem: OrdemCarregamento) => {
    setEditingOrdem(ordem);
    setEditDrawerOpen(true);
  };

  const handleSaveEdit = async (data: any) => {
    if (editingOrdem) {
      await updateOrdem({ id: editingOrdem.id, data });
      setEditDrawerOpen(false);
      setEditingOrdem(null);
    }
  };

  const handleOrdemCriada = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-carregamento-disponiveis'] });
  };

  const handleOrdemDropped = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-carregamento-disponiveis'] });
  };

  const handleRemoverDoCalendario = (ordemId: string) => {
    updateOrdem({ 
      id: ordemId, 
      data: { 
        data_carregamento: null, 
        status: 'pendente' 
      } 
    });
    toast.success("Ordem removida do calendário");
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['ordens-carregamento-calendario'] }),
      queryClient.invalidateQueries({ queryKey: ['ordens-carregamento-disponiveis'] }),
      queryClient.invalidateQueries({ queryKey: ['neo_instalacoes_calendario'] }),
      queryClient.invalidateQueries({ queryKey: ['neo_correcoes_calendario'] }),
      queryClient.invalidateQueries({ queryKey: ['neo_instalacoes_sem_data'] }),
      queryClient.invalidateQueries({ queryKey: ['neo_correcoes_sem_data'] }),
    ]);
    toast.success("Calendário atualizado");
    setIsRefreshing(false);
  };

  const handleOrdemClick = (ordem: OrdemCarregamento) => {
    setSelectedOrdem(ordem);
    setDetailsOpen(true);
  };

  // Handlers para agendar Neo serviços
  const handleAgendarInstalacao = async (id: string, data: string) => {
    await updateNeoInstalacao({ id, data: { data_instalacao: data } });
    queryClient.invalidateQueries({ queryKey: ['neo_instalacoes_calendario'] });
  };

  const handleAgendarCorrecao = async (id: string, data: string) => {
    await updateNeoCorrecao({ id, data: { data_correcao: data } });
    queryClient.invalidateQueries({ queryKey: ['neo_correcoes_calendario'] });
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Direção", path: "/direcao" },
          { label: "Gestão de Instalações", path: "/direcao/gestao-instalacao" },
          { label: "Calendário Expedição" }
        ]} 
        mounted={mounted} 
      />
      
      
      <div className="relative z-10 min-h-screen flex flex-col pt-14">
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/direcao/gestao-instalacao')}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Calendário Expedição</h1>
                <p className="text-xs text-white/60">
                  {viewType === 'week' 
                    ? `${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`
                    : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewType(viewType === 'week' ? 'month' : 'week')}
                className="text-white/80 hover:text-white hover:bg-primary/10"
              >
                {viewType === 'week' ? <CalendarDays className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-white/80 hover:text-white hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="text-white/80 hover:text-white hover:bg-primary/10 text-xs"
              >
                Hoje
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-white/80 hover:text-white hover:bg-primary/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Calendário */}
              <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  {isMobile ? (
                    <CalendarioSemanalExpedicaoMobile
                      startDate={weekStart}
                      ordens={ordens || []}
                      neoInstalacoes={neoInstalacoes || []}
                      neoCorrecoes={neoCorrecoes || []}
                      onPreviousWeek={handlePreviousWeek}
                      onNextWeek={handleNextWeek}
                      onToday={handleToday}
                      onDayClick={() => {}}
                      onEdit={handleEdit}
                      onRemoverDoCalendario={handleRemoverDoCalendario}
                      onUpdateOrdem={handleUpdateOrdem}
                      onOrdemAdded={handleOrdemCriada}
                    />
                  ) : viewType === 'week' ? (
                    <CalendarioSemanalExpedicaoDesktop
                      startDate={weekStart}
                      ordens={ordens || []}
                      neoInstalacoes={neoInstalacoes || []}
                      neoCorrecoes={neoCorrecoes || []}
                      onPreviousWeek={handlePreviousWeek}
                      onNextWeek={handleNextWeek}
                      onToday={handleToday}
                      onUpdateOrdem={handleUpdateOrdem}
                      onEdit={handleEdit}
                      onRemoverDoCalendario={handleRemoverDoCalendario}
                      onOrdemCriada={handleOrdemCriada}
                      onOrdemDropped={handleOrdemDropped}
                      onOrdemClick={handleOrdemClick}
                    />
                  ) : (
                    <CalendarioMensalExpedicaoDesktop
                      currentMonth={currentDate}
                      ordens={ordens || []}
                      neoInstalacoes={neoInstalacoes || []}
                      neoCorrecoes={neoCorrecoes || []}
                      onMonthChange={handleMonthChange}
                      onUpdateOrdem={handleUpdateOrdem}
                      onEdit={handleEdit}
                      onRemoverDoCalendario={handleRemoverDoCalendario}
                      onOrdemCriada={handleOrdemCriada}
                      onOrdemDropped={handleOrdemDropped}
                      onOrdemClick={handleOrdemClick}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Ordens Disponíveis */}
              {!isMobile && (
                <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <OrdensCarregamentoDisponiveis onRefresh={handleRefresh} />
                  </CardContent>
                </Card>
              )}

              {/* Neo Serviços Pendentes de Agendamento */}
              {isMobile ? (
                <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <NeoServicosDisponiveisMobile
                      neoInstalacoes={neoInstalacoesSemData || []}
                      neoCorrecoes={neoCorrecoesSemData || []}
                      onAgendarInstalacao={handleAgendarInstalacao}
                      onAgendarCorrecao={handleAgendarCorrecao}
                      isLoadingInstalacoes={isLoadingNeoInstalacoes}
                      isLoadingCorrecoes={isLoadingNeoCorrecoes}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <NeoServicosDisponiveis
                      neoInstalacoes={neoInstalacoesSemData || []}
                      neoCorrecoes={neoCorrecoesSemData || []}
                      onAgendarInstalacao={handleAgendarInstalacao}
                      onAgendarCorrecao={handleAgendarCorrecao}
                      isLoadingInstalacoes={isLoadingNeoInstalacoes}
                      isLoadingCorrecoes={isLoadingNeoCorrecoes}
                      onReorganizarInstalacoes={reorganizarNeoInstalacoes}
                      onReorganizarCorrecoes={reorganizarNeoCorrecoes}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Detalhes da Ordem */}
      <OrdemCarregamentoDetails
        ordem={selectedOrdem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Drawer de Edição */}
      <EditarOrdemCarregamentoDrawer
        ordem={editingOrdem}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
