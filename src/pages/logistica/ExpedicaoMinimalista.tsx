import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, CalendarDays, ArrowLeft, LogOut, Plus } from "lucide-react";

import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrdensCarregamentoCalendario } from "@/hooks/useOrdensCarregamentoCalendario";
import { useNeoInstalacoes } from "@/hooks/useNeoInstalacoes";
import { useNeoCorrecoes } from "@/hooks/useNeoCorrecoes";
import { OrdensCarregamentoDisponiveis } from "@/components/expedicao/OrdensCarregamentoDisponiveis";
import { OrdensCarregamentoDisponiveisMobile } from "@/components/expedicao/OrdensCarregamentoDisponiveisMobile";
import { OrdemCarregamentoDetails } from "@/components/expedicao/OrdemCarregamentoDetails";
import { EditarOrdemCarregamentoDrawer } from "@/components/expedicao/EditarOrdemCarregamentoDrawer";
import { NeoInstalacaoModal } from "@/components/expedicao/NeoInstalacaoModal";
import { NeoCorrecaoModal } from "@/components/expedicao/NeoCorrecaoModal";
import { NeoInstalacaoDetails } from "@/components/expedicao/NeoInstalacaoDetails";
import { NeoCorrecaoDetails } from "@/components/expedicao/NeoCorrecaoDetails";
import { CalendarioSemanalExpedicaoMobile } from "@/components/expedicao/CalendarioSemanalExpedicaoMobile";
import { CalendarioSemanalExpedicaoDesktop } from "@/components/expedicao/CalendarioSemanalExpedicaoDesktop";
import { CalendarioMensalExpedicaoDesktop } from "@/components/expedicao/CalendarioMensalExpedicaoDesktop";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays, startOfWeek, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { NeoInstalacao, CriarNeoInstalacaoData } from "@/types/neoInstalacao";
import { NeoCorrecao, CriarNeoCorrecaoData } from "@/types/neoCorrecao";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function ExpedicaoMinimalista() {
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
  const [neoModalOpen, setNeoModalOpen] = useState(false);
  const [neoCorrecaoModalOpen, setNeoCorrecaoModalOpen] = useState(false);
  
  // States for editing Neo Instalação/Correção
  const [editingNeoInstalacao, setEditingNeoInstalacao] = useState<NeoInstalacao | null>(null);
  const [editingNeoCorrecao, setEditingNeoCorrecao] = useState<NeoCorrecao | null>(null);
  
  // States for details sidebars
  const [selectedNeoInstalacao, setSelectedNeoInstalacao] = useState<NeoInstalacao | null>(null);
  const [neoInstalacaoDetailsOpen, setNeoInstalacaoDetailsOpen] = useState(false);
  const [selectedNeoCorrecao, setSelectedNeoCorrecao] = useState<NeoCorrecao | null>(null);
  const [neoCorrecaoDetailsOpen, setNeoCorrecaoDetailsOpen] = useState(false);

  const { ordens, isLoading, updateOrdem } = useOrdensCarregamentoCalendario(currentDate, viewType);
  const { neoInstalacoes, createNeoInstalacao, updateNeoInstalacao, deleteNeoInstalacao, concluirNeoInstalacao, isConcluindo: isConcluindoInstalacao } = useNeoInstalacoes(currentDate, viewType);
  const { neoCorrecoes, createNeoCorrecao, updateNeoCorrecao, deleteNeoCorrecao, concluirNeoCorrecao, isConcluindo: isConcluindoCorrecao } = useNeoCorrecoes(currentDate, viewType);

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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-carregamento-calendario'] });
  };

  const handleOrdemClick = (ordem: OrdemCarregamento) => {
    setSelectedOrdem(ordem);
    setDetailsOpen(true);
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  // Handlers para abrir detalhes
  const handleOpenNeoInstalacaoDetails = (neoInstalacao: NeoInstalacao) => {
    setSelectedNeoInstalacao(neoInstalacao);
    setNeoInstalacaoDetailsOpen(true);
  };

  const handleOpenNeoCorrecaoDetails = (neoCorrecao: NeoCorrecao) => {
    setSelectedNeoCorrecao(neoCorrecao);
    setNeoCorrecaoDetailsOpen(true);
  };

  const handleConcluirNeoInstalacao = async (id: string) => {
    await concluirNeoInstalacao(id);
    setNeoInstalacaoDetailsOpen(false);
  };

  const handleConcluirNeoCorrecao = async (id: string) => {
    await concluirNeoCorrecao(id);
    setNeoCorrecaoDetailsOpen(false);
  };

  // Handlers para edição
  const handleEditarNeoInstalacao = (neo: NeoInstalacao) => {
    setEditingNeoInstalacao(neo);
    setNeoModalOpen(true);
  };

  const handleEditarNeoCorrecao = (neo: NeoCorrecao) => {
    setEditingNeoCorrecao(neo);
    setNeoCorrecaoModalOpen(true);
  };

  const handleSaveNeoInstalacao = async (dados: CriarNeoInstalacaoData) => {
    if (editingNeoInstalacao) {
      await updateNeoInstalacao({ id: editingNeoInstalacao.id, data: dados });
      toast.success("Instalação atualizada com sucesso!");
    } else {
      await createNeoInstalacao(dados);
    }
    setEditingNeoInstalacao(null);
  };

  const handleSaveNeoCorrecao = async (dados: CriarNeoCorrecaoData) => {
    if (editingNeoCorrecao) {
      await updateNeoCorrecao({ id: editingNeoCorrecao.id, data: dados });
      toast.success("Correção atualizada com sucesso!");
    } else {
      await createNeoCorrecao(dados);
    }
    setEditingNeoCorrecao(null);
  };

  const handleCloseNeoInstalacaoModal = (open: boolean) => {
    setNeoModalOpen(open);
    if (!open) setEditingNeoInstalacao(null);
  };

  const handleCloseNeoCorrecaoModal = (open: boolean) => {
    setNeoCorrecaoModalOpen(open);
    if (!open) setEditingNeoCorrecao(null);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Expedição" }
        ]} 
        mounted={mounted} 
      />
      
      
      <div className="relative z-10 min-h-screen flex flex-col pt-14">
        {/* Header */}
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/logistica')}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Expedição</h1>
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
                onClick={() => setNeoModalOpen(true)}
                className="text-white/80 hover:text-white hover:bg-primary/10 text-xs"
              >
                <Plus className="h-4 w-4 mr-1" />
                Neo Instalação
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNeoCorrecaoModalOpen(true)}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs"
              >
                <Plus className="h-4 w-4 mr-1" />
                Neo Correção
              </Button>
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
                      onOpenNeoInstalacaoDetails={handleOpenNeoInstalacaoDetails}
                      onOpenNeoCorrecaoDetails={handleOpenNeoCorrecaoDetails}
                      onExcluirNeoInstalacao={deleteNeoInstalacao}
                      onExcluirNeoCorrecao={deleteNeoCorrecao}
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
                      onUpdateNeoInstalacao={async (params) => {
                        await updateNeoInstalacao(params);
                      }}
                      onUpdateNeoCorrecao={async (params) => {
                        await updateNeoCorrecao(params);
                      }}
                      onEdit={handleEdit}
                      onRemoverDoCalendario={handleRemoverDoCalendario}
                      onOrdemCriada={handleOrdemCriada}
                      onOrdemDropped={handleOrdemDropped}
                      onOrdemClick={handleOrdemClick}
                      onOpenNeoInstalacaoDetails={handleOpenNeoInstalacaoDetails}
                      onOpenNeoCorrecaoDetails={handleOpenNeoCorrecaoDetails}
                      onExcluirNeoInstalacao={deleteNeoInstalacao}
                      onExcluirNeoCorrecao={deleteNeoCorrecao}
                      onEditarNeoInstalacao={handleEditarNeoInstalacao}
                      onEditarNeoCorrecao={handleEditarNeoCorrecao}
                    />
                  ) : (
                    <CalendarioMensalExpedicaoDesktop
                      currentMonth={currentDate}
                      ordens={ordens || []}
                      neoInstalacoes={neoInstalacoes || []}
                      neoCorrecoes={neoCorrecoes || []}
                      onMonthChange={handleMonthChange}
                      onUpdateOrdem={handleUpdateOrdem}
                      onUpdateNeoInstalacao={async (params) => {
                        await updateNeoInstalacao(params);
                      }}
                      onUpdateNeoCorrecao={async (params) => {
                        await updateNeoCorrecao(params);
                      }}
                      onEdit={handleEdit}
                      onRemoverDoCalendario={handleRemoverDoCalendario}
                      onOrdemCriada={handleOrdemCriada}
                      onOrdemDropped={handleOrdemDropped}
                      onOrdemClick={handleOrdemClick}
                      onOpenNeoInstalacaoDetails={handleOpenNeoInstalacaoDetails}
                      onOpenNeoCorrecaoDetails={handleOpenNeoCorrecaoDetails}
                      onExcluirNeoInstalacao={deleteNeoInstalacao}
                      onExcluirNeoCorrecao={deleteNeoCorrecao}
                      onEditarNeoInstalacao={handleEditarNeoInstalacao}
                      onEditarNeoCorrecao={handleEditarNeoCorrecao}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Ordens Disponíveis */}
              <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  {isMobile ? (
                    <OrdensCarregamentoDisponiveisMobile onRefresh={handleRefresh} />
                  ) : (
                    <OrdensCarregamentoDisponiveis onRefresh={handleRefresh} />
                  )}
                </CardContent>
              </Card>
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

      {/* Modal Neo Instalação (Criar/Editar) */}
      <NeoInstalacaoModal
        open={neoModalOpen}
        onOpenChange={handleCloseNeoInstalacaoModal}
        neoInstalacao={editingNeoInstalacao}
        onConfirm={handleSaveNeoInstalacao}
      />

      {/* Modal Neo Correção (Criar/Editar) */}
      <NeoCorrecaoModal
        open={neoCorrecaoModalOpen}
        onOpenChange={handleCloseNeoCorrecaoModal}
        neoCorrecao={editingNeoCorrecao}
        onConfirm={handleSaveNeoCorrecao}
      />

      {/* Sidebar de Detalhes - Neo Instalação */}
      <NeoInstalacaoDetails
        neoInstalacao={selectedNeoInstalacao}
        open={neoInstalacaoDetailsOpen}
        onOpenChange={setNeoInstalacaoDetailsOpen}
        onConcluir={handleConcluirNeoInstalacao}
        onEditar={handleEditarNeoInstalacao}
        isConcluindo={isConcluindoInstalacao}
      />

      {/* Sidebar de Detalhes - Neo Correção */}
      <NeoCorrecaoDetails
        neoCorrecao={selectedNeoCorrecao}
        open={neoCorrecaoDetailsOpen}
        onOpenChange={setNeoCorrecaoDetailsOpen}
        onConcluir={handleConcluirNeoCorrecao}
        onEditar={handleEditarNeoCorrecao}
        isConcluindo={isConcluindoCorrecao}
      />
    </div>
  );
}
