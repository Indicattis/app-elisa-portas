import { useState } from "react";
import { Download, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useOrdensInstalacaoCalendario, InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { useIsMobile } from "@/hooks/use-mobile";
import { addWeeks, subWeeks } from "date-fns";
import { CriarInstalacaoModal } from "@/components/instalacoes/CriarInstalacaoModal";
import { CalendarioInstalacoesSemanal } from "@/components/instalacoes/CalendarioInstalacoesSemanal";
import { CalendarioInstalacoesMensal } from "@/components/instalacoes/CalendarioInstalacoesMensal";
import { CalendarioInstalacoesMobile } from "@/components/instalacoes/CalendarioInstalacoesMobile";
import { InstalacaoDetailsSheet } from "@/components/instalacoes/InstalacaoDetailsSheet";
import { ListaInstalacoesEquipe } from "@/components/instalacoes/ListaInstalacoesEquipe";

export default function Instalacoes() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'semanal' | 'mensal'>('mensal');
  const [modalNovaInstalacaoOpen, setModalNovaInstalacaoOpen] = useState(false);
  const [selectedInstalacao, setSelectedInstalacao] = useState<InstalacaoCalendario | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { 
    instalacoes, 
    isLoading, 
    updateInstalacao, 
    concluirInstalacao,
    isConcluindo 
  } = useOrdensInstalacaoCalendario(
    currentDate, 
    tipoVisualizacao === 'mensal' ? 'month' : 'week'
  );

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleUpdateInstalacao = async (params: { id: string; data: Partial<InstalacaoCalendario> }) => {
    await updateInstalacao(params);
  };

  const handleRemoverDoCalendario = async (id: string) => {
    try {
      await updateInstalacao({
        id,
        data: { data_instalacao: null, status: 'pendente' },
      });
      toast.success("Instalação removida do calendário");
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro ao remover instalação do calendário");
    }
  };

  const handleConcluirInstalacao = async (instalacaoId: string) => {
    try {
      await concluirInstalacao(instalacaoId);
      setDetailsOpen(false);
    } catch (error) {
      console.error("Erro ao concluir instalação:", error);
    }
  };

  const handleBaixarPDF = () => {
    toast.info("Funcionalidade de PDF em desenvolvimento");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["instalacoes_calendario"] });
    toast.success("Calendário atualizado");
  };

  const handleInstalacaoClick = (instalacao: InstalacaoCalendario) => {
    setSelectedInstalacao(instalacao);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Listagem de Instalações da Equipe do Usuário */}
      <ListaInstalacoesEquipe />

      {/* Controles de Visualização */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {!isMobile && (
            <div className="flex gap-1 border rounded-md p-1">
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
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setModalNovaInstalacaoOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Nova</span>
          </Button>
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

      {/* Calendários */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      ) : (
        <>
          {isMobile ? (
            <CalendarioInstalacoesMobile
              startDate={currentDate}
              instalacoes={instalacoes}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
              onToday={handleToday}
              onInstalacaoClick={handleInstalacaoClick}
              onRefresh={handleRefresh}
            />
          ) : tipoVisualizacao === 'semanal' ? (
            <CalendarioInstalacoesSemanal
              startDate={currentDate}
              instalacoes={instalacoes}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
              onToday={handleToday}
              onUpdateInstalacao={handleUpdateInstalacao}
              onRemoverDoCalendario={handleRemoverDoCalendario}
              onInstalacaoClick={handleInstalacaoClick}
              onRefresh={handleRefresh}
            />
          ) : (
            <CalendarioInstalacoesMensal
              currentMonth={currentDate}
              instalacoes={instalacoes}
              onMonthChange={setCurrentDate}
              onUpdateInstalacao={handleUpdateInstalacao}
              onRemoverDoCalendario={handleRemoverDoCalendario}
              onInstalacaoClick={handleInstalacaoClick}
              onRefresh={handleRefresh}
            />
          )}
        </>
      )}

      {/* Sidebar de Detalhes */}
      <InstalacaoDetailsSheet
        instalacao={selectedInstalacao}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onConcluirInstalacao={handleConcluirInstalacao}
        isConcluindo={isConcluindo}
      />

      {/* Modal para criar nova instalação */}
      <CriarInstalacaoModal
        open={modalNovaInstalacaoOpen}
        onOpenChange={setModalNovaInstalacaoOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
