import { useState, useMemo } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarioSemanalExpedicaoMobile } from "@/components/expedicao/CalendarioSemanalExpedicaoMobile";
import { CalendarioMensalExpedicaoDesktop } from "@/components/expedicao/CalendarioMensalExpedicaoDesktop";
import { CalendarioSemanalExpedicaoDesktop } from "@/components/expedicao/CalendarioSemanalExpedicaoDesktop";
import { useOrdensInstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import logoInstalacoes from "@/assets/logo-instalacoes.png";
import { OrdemInstalacaoDetails } from "@/components/instalacoes/OrdemInstalacaoDetails";
import { OrdensSemData } from "@/components/instalacoes/OrdensSemData";

export default function Instalacoes() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'semanal' | 'mensal'>('mensal');
  const { equipes } = useEquipesInstalacao();
  const { 
    ordens, 
    isLoading, 
    updateOrdem, 
    concluirInstalacao,
    isConcluindo 
  } = useOrdensInstalacaoCalendario(
    currentDate, 
    tipoVisualizacao === 'mensal' ? 'month' : 'week'
  );

  // Mapear responsável para cor da equipe
  const getEquipeCorByResponsavel = useMemo(() => {
    const map = new Map<string, string>();
    
    equipes.forEach(equipe => {
      // Adicionar responsável
      if (equipe.responsavel_id) {
        map.set(equipe.responsavel_id, equipe.cor);
      }
      // Adicionar membros
      equipe.membros?.forEach(membro => {
        map.set(membro.id, equipe.cor);
      });
    });
    
    return (responsavelId: string | null) => {
      if (!responsavelId) return null;
      return map.get(responsavelId) || null;
    };
  }, [equipes]);

  // Enriquecer ordens com cor da equipe
  const ordensComCores = useMemo(() => {
    return ordens.map(ordem => {
      const instalacao = Array.isArray(ordem.pedido?.instalacao) 
        ? ordem.pedido?.instalacao[0] 
        : ordem.pedido?.instalacao;
      
      const corEquipe = getEquipeCorByResponsavel(instalacao?.responsavel_instalacao_id || null);
      
      return {
        ...ordem,
        _corEquipe: corEquipe
      };
    });
  }, [ordens, getEquipeCorByResponsavel]);
  
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemCarregamento | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const handleConcluirInstalacao = async (pedidoId: string) => {
    try {
      await concluirInstalacao(pedidoId);
      setDetailsOpen(false);
    } catch (error) {
      console.error("Erro ao concluir instalação:", error);
    }
  };

  const handleBaixarPDF = () => {
    toast.info("Funcionalidade de PDF em desenvolvimento");
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ordens_instalacao_calendario"] });
    toast.success("Calendário atualizado");
  };

  const handleOrdemClick = (ordem: OrdemCarregamento) => {
    setSelectedOrdem(ordem);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-4">
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
            {/* Calendários */}
            {isMobile ? (
              <CalendarioSemanalExpedicaoMobile
                startDate={currentDate}
                ordens={ordensComCores}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onToday={handleToday}
                onDayClick={handleDayClick}
                onEdit={() => {}}
                onRemoverDoCalendario={handleRemoverDoCalendario}
              />
            ) : (
              tipoVisualizacao === 'semanal' ? (
                <CalendarioSemanalExpedicaoDesktop
                  startDate={currentDate}
                  ordens={ordensComCores}
                  onPreviousWeek={handlePreviousWeek}
                  onNextWeek={handleNextWeek}
                  onToday={handleToday}
                  onUpdateOrdem={handleUpdateOrdem}
                  onEdit={() => {}}
                  onRemoverDoCalendario={handleRemoverDoCalendario}
                  onOrdemDropped={() => {}}
                  onOrdemClick={handleOrdemClick}
                />
              ) : (
                <CalendarioMensalExpedicaoDesktop
                  currentMonth={currentDate}
                  ordens={ordensComCores}
                  onMonthChange={setCurrentDate}
                  onUpdateOrdem={handleUpdateOrdem}
                  onEdit={() => {}}
                  onRemoverDoCalendario={handleRemoverDoCalendario}
                  onOrdemDropped={() => {}}
                  onOrdemClick={handleOrdemClick}
                />
              )
            )}
        </>
      )}

      {/* Listagem de Ordens Sem Data de Carregamento */}
      <div className="mt-8">
        <OrdensSemData />
      </div>

      {/* Sidebar de Detalhes com botão de Concluir Instalação */}
      <OrdemInstalacaoDetails
        ordem={selectedOrdem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onConcluirInstalacao={handleConcluirInstalacao}
        isConcluindo={isConcluindo}
      />
    </div>
  );
}
