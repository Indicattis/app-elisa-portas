import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarioSemanalMobile } from "@/components/instalacoes/CalendarioSemanalMobile";
import { CalendarioMensalDesktop } from "@/components/instalacoes/CalendarioMensalDesktop";
import { CalendarioSemanalDesktop } from "@/components/instalacoes/CalendarioSemanalDesktop";
import { EquipesSlider } from "@/components/instalacoes/EquipesSlider";
import { EditarInstalacaoDrawer } from "@/components/instalacoes/EditarInstalacaoDrawer";
import { useInstalacoes } from "@/hooks/useInstalacoes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Instalacao } from "@/types/instalacao";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { format } from "date-fns";
import logoInstalacoes from "@/assets/logo-instalacoes.png";
import { useInstalacoesPDFData } from "@/hooks/useInstalacoesPDFData";
import { baixarCronogramaInstalacoesPDF } from "@/utils/instalacoesCronogramaPDF";
import { PedidosDisponiveis } from "@/components/instalacoes/PedidosDisponiveis";

export default function InstalacoesCalendario() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<string | null>(null);
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'semanal' | 'mensal'>('mensal');
  const { instalacoes, isLoading, updateInstalacao } = useInstalacoes(
    currentDate, 
    tipoVisualizacao === 'mensal' ? 'month' : 'week'
  );
  const { prepararDadosPDF } = useInstalacoesPDFData();
  
  const [instalacaoToEdit, setInstalacaoToEdit] = useState<Instalacao | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [refreshPedidos, setRefreshPedidos] = useState(0);

  // Filtrar instalações por equipe
  const instalacoesFiltradas = equipeSelecionadaId
    ? instalacoes.filter((inst) => inst.equipe_id === equipeSelecionadaId)
    : instalacoes;

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

  const handleUpdateInstalacao = async (params: { id: string; data: Partial<Instalacao> }) => {
    await updateInstalacao(params);
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    navigate(`/instalacoes/nova?data=${dateStr}`);
  };

  const handleEdit = (instalacao: Instalacao) => {
    setInstalacaoToEdit(instalacao);
    setEditDrawerOpen(true);
  };

  const handleEditSave = async (data: {
    data_instalacao: string;
    tipo_instalacao: 'elisa' | 'autorizados';
    responsavel_instalacao_id: string;
    responsavel_instalacao_nome: string;
  }) => {
    if (!instalacaoToEdit) return;
    
    try {
      await updateInstalacao({
        id: instalacaoToEdit.id,
        data: {
          data: data.data_instalacao,
        } as any,
      });
      toast.success("Instalação atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error("Erro ao atualizar instalação");
    }
  };

  const handleRemoverDoCalendario = async (id: string) => {
    try {
      await updateInstalacao({
        id,
        data: { data: null },
      });
      toast.success("Instalação removida do calendário");
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro ao remover instalação do calendário");
    }
  };

  const handlePedidoDropped = () => {
    setRefreshPedidos(prev => prev + 1);
  };

  const handleBaixarPDF = () => {
    if (instalacoesFiltradas.length === 0) {
      toast.info("Não há instalações para gerar o PDF");
      return;
    }

    const dadosPDF = prepararDadosPDF(
      instalacoesFiltradas,
      equipeSelecionadaId,
      currentDate,
      isMobile ? 'semanal' : tipoVisualizacao
    );
    
    baixarCronogramaInstalacoesPDF(dadosPDF);
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img 
              src={logoInstalacoes} 
              alt="Logo" 
              className="h-9 w-9 object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Cronograma de Instalações</h1>
              <p className="text-xs text-muted-foreground">Arraste pedidos para agendar</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isMobile && (
              <div className="flex gap-1 border rounded-md p-1 mr-2">
                <Button
                  variant={tipoVisualizacao === 'semanal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTipoVisualizacao('semanal')}
                  className="h-8 text-xs"
                >
                  Semana
                </Button>
                <Button
                  variant={tipoVisualizacao === 'mensal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTipoVisualizacao('mensal')}
                  className="h-8 text-xs"
                >
                  Mês
                </Button>
              </div>
            )}
            <Button
              onClick={handleBaixarPDF}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="p-4 pb-8 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <>
            <EquipesSlider
              equipeSelecionadaId={equipeSelecionadaId}
              onEquipeChange={setEquipeSelecionadaId}
            />
            
            {isMobile ? (
              <CalendarioSemanalMobile
                startDate={currentDate}
                instalacoes={instalacoesFiltradas}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onToday={handleToday}
                onDayClick={handleDayClick}
                onEdit={handleEdit}
                onRemoverDoCalendario={handleRemoverDoCalendario}
              />
            ) : (
              <>
                {tipoVisualizacao === 'semanal' ? (
                  <CalendarioSemanalDesktop
                    startDate={currentDate}
                    instalacoes={instalacoesFiltradas}
                    onPreviousWeek={handlePreviousWeek}
                    onNextWeek={handleNextWeek}
                    onToday={handleToday}
                    onUpdateInstalacao={handleUpdateInstalacao}
                    onEdit={handleEdit}
                    onRemoverDoCalendario={handleRemoverDoCalendario}
                    onPedidoDropped={handlePedidoDropped}
                  />
                ) : (
                  <CalendarioMensalDesktop
                    currentMonth={currentDate}
                    instalacoes={instalacoesFiltradas}
                    onMonthChange={setCurrentDate}
                    onUpdateInstalacao={handleUpdateInstalacao}
                    onEdit={handleEdit}
                    onRemoverDoCalendario={handleRemoverDoCalendario}
                    onPedidoDropped={handlePedidoDropped}
                  />
                )}
              </>
            )}

            {/* Listagem de pedidos disponíveis (apenas desktop) */}
            {!isMobile && (
              <PedidosDisponiveis key={refreshPedidos} />
            )}
          </>
        )}
      </main>

      {/* Drawer de Edição */}
      <EditarInstalacaoDrawer
        instalacao={instalacaoToEdit}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        onSave={handleEditSave}
      />
    </div>
  );
}
