import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { useInstalacoesCronograma } from "@/hooks/useInstalacoesCronograma";
import { useEquipesMembros } from "@/hooks/useEquipesMembros";
import { PontoInstalacao } from "./PontoInstalacao";
import { CelulaDia } from "./CelulaDia";
import { DetalhesInstalacaoDialog } from "@/components/cadastro-instalacao/DetalhesInstalacaoDialog";
import { SelecionarInstalacaoModal } from "./SelecionarInstalacaoModal";
import { EquipeMembrosList } from "./EquipeMembrosList";
import { useToast } from "@/hooks/use-toast";

interface CronogramaInstalacaoMensalProps {
  currentMonth: Date;
  onEditPonto: (instalacao: any) => void;
  equipesFiltradas?: any[];
}

export function CronogramaInstalacaoMensal({ currentMonth, onEditPonto, equipesFiltradas }: CronogramaInstalacaoMensalProps) {
  const { equipes } = useEquipesInstalacao();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { instalacoes, updateInstalacaoData } = useInstalacoesCronograma(monthStart);
  const { draggedItem, handleDragStart, handleDragEnd } = useDragAndDrop();
  const [selectedInstalacao, setSelectedInstalacao] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    equipId: string;
    equipNome: string;
    diaSemana: number;
    data: Date;
  } | null>(null);
  const { toast } = useToast();

  const equipesParaExibir = equipesFiltradas || equipes;

  // Gerar todos os dias do mês
  const diasDoMes = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Wrapper para carregar membros de cada equipe
  function EquipeMembrosEquipeWrapper({ equipeId }: { equipeId: string }) {
    const { membros } = useEquipesMembros(equipeId);
    return <EquipeMembrosList membros={membros} compact />;
  }

  const handleDrop = async (equipId: string, diaSemana: number, data: Date) => {
    if (draggedItem && draggedItem.equipId !== equipId) {
      await updateInstalacaoData(
        draggedItem.id,
        equipId,
        data
      );
    }
  };

  const handleCellDoubleClick = (equipId: string, diaSemana: number, data: Date) => {
    console.log('Double click na célula:', {
      equipId,
      diaSemana,
      data,
      dataFormatada: format(data, "dd/MM/yyyy - EEEE", { locale: ptBR })
    });
    
    const equipe = equipesParaExibir.find(e => e.id === equipId);
    if (equipe) {
      setSelectedCell({
        equipId,
        equipNome: equipe.nome,
        diaSemana,
        data
      });
      setModalOpen(true);
    }
  };

  const handleSelectInstalacao = async (
    instalacaoId: string,
    equipId: string,
    data: Date
  ) => {
    try {
      console.log('Agendando instalação:', {
        instalacaoId,
        equipId,
        data: format(data, "dd/MM/yyyy - EEEE", { locale: ptBR }),
        dataISO: data.toISOString()
      });
      
      await updateInstalacaoData(instalacaoId, equipId, data);
      toast({
        title: "Instalação agendada",
        description: `A instalação foi agendada para ${format(data, "dd/MM/yyyy - EEEE", { locale: ptBR })}`
      });
    } catch (error) {
      console.error('Erro ao agendar instalação:', error);
      toast({
        title: "Erro ao agendar",
        description: "Não foi possível agendar a instalação",
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Header com dias do mês */}
        <div className="grid border-b" style={{ gridTemplateColumns: `200px repeat(${diasDoMes.length}, minmax(80px, 1fr))` }}>
          <div className="p-3 font-medium border-r bg-muted/50 sticky left-0 z-10">Equipe</div>
          {diasDoMes.map((dia) => {
            const diaNumero = dia.getDate();
            const diaSemana = format(dia, "EEE", { locale: ptBR });
            const isWeekend = dia.getDay() === 0 || dia.getDay() === 6;
            const isToday = isSameDay(dia, new Date());
            
            return (
              <div 
                key={dia.toISOString()} 
                className={`p-2 text-center border-r last:border-r-0 ${isWeekend ? 'bg-muted/30' : ''} ${isToday ? 'bg-primary/10' : ''}`}
              >
                <div className={`text-xs font-medium ${isToday ? 'text-primary' : ''}`}>{diaSemana}</div>
                <div className={`text-sm ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                  {String(diaNumero).padStart(2, '0')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid com equipes e pontos */}
        <div className="divide-y">
          {equipesParaExibir.map((equipe) => (
            <div 
              key={equipe.id} 
              className="grid" 
              style={{ gridTemplateColumns: `200px repeat(${diasDoMes.length}, minmax(80px, 1fr))` }}
            >
              {/* Coluna da equipe */}
              <div className="p-3 border-r bg-muted/30 flex flex-col gap-2 sticky left-0 z-10 min-h-[80px]">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: equipe.cor }}
                  />
                  <span className="font-medium text-sm">{equipe.nome}</span>
                </div>
                <EquipeMembrosEquipeWrapper equipeId={equipe.id} />
              </div>

              {/* Colunas dos dias */}
              {diasDoMes.map((dia) => {
                const diaSemana = dia.getDay();
                const instalacoesNoDia = instalacoes.filter(
                  i => i.responsavel_instalacao_id === equipe.id && 
                       i.data_instalacao && 
                       isSameDay(new Date(i.data_instalacao), dia)
                );

                return (
                  <CelulaDia
                    key={`${equipe.id}-${dia.toISOString()}`}
                    equipId={equipe.id}
                    diaSemana={diaSemana}
                    data={dia}
                    onDrop={(equipId, ds) => handleDrop(equipId, ds, dia)}
                    onDoubleClick={(equipId, ds) => handleCellDoubleClick(equipId, ds, dia)}
                    draggedItem={draggedItem}
                  >
                    <div className="flex flex-col gap-1">
                      {instalacoesNoDia.map((instalacao) => (
                        <PontoInstalacao
                          key={instalacao.id}
                          instalacao={instalacao}
                          cor={equipe.cor}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onEdit={() => setSelectedInstalacao(instalacao)}
                        />
                      ))}
                    </div>
                  </CelulaDia>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedInstalacao && (
        <DetalhesInstalacaoDialog
          instalacao={selectedInstalacao}
          open={!!selectedInstalacao}
          onOpenChange={(open) => !open && setSelectedInstalacao(null)}
        />
      )}

      {selectedCell && (
        <SelecionarInstalacaoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          equipId={selectedCell.equipId}
          equipNome={selectedCell.equipNome}
          data={selectedCell.data}
          onSelectInstalacao={handleSelectInstalacao}
        />
      )}
    </div>
  );
}
