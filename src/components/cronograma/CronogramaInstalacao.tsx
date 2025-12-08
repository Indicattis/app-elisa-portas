import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { useOrdensInstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { useEquipesMembros } from "@/hooks/useEquipesMembros";
import { PontoInstalacao } from "./PontoInstalacao";
import { CelulaDia } from "./CelulaDia";
import { DetalhesInstalacaoDialog } from "@/components/cadastro-instalacao/DetalhesInstalacaoDialog";
import { SelecionarPedidoInstalacaoModal } from "@/components/instalacoes/SelecionarPedidoInstalacaoModal";
import { EquipeMembrosList } from "./EquipeMembrosList";
import { useToast } from "@/hooks/use-toast";

interface CronogramaInstalacaoProps {
  currentWeek: Date;
  onEditPonto: (instalacao: any) => void;
  equipesFiltradas?: any[];
}

const DIAS_SEMANA = [
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

export function CronogramaInstalacao({ currentWeek, onEditPonto, equipesFiltradas }: CronogramaInstalacaoProps) {
  const { equipes } = useEquipesInstalacao();
  const { instalacoes, updateInstalacao } = useOrdensInstalacaoCalendario(currentWeek, 'week');
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

  // Wrapper para carregar membros de cada equipe
  function EquipeMembrosEquipeWrapper({ equipeId }: { equipeId: string }) {
    const { membros } = useEquipesMembros(equipeId);
    return <EquipeMembrosList membros={membros} compact />;
  }


  const handleDrop = async (equipId: string, diaSemana: number) => {
    if (draggedItem && draggedItem.equipId !== equipId) {
      // Calcular a nova data baseada no dia da semana
      // Como currentWeek já é a segunda-feira, usamos o index direto
      const index = DIAS_SEMANA.findIndex(d => d.value === diaSemana);
      const novaData = addDays(currentWeek, index);
      
      await updateInstalacao({
        id: draggedItem.id,
        data: {
          responsavel_instalacao_id: equipId,
          data_instalacao: format(novaData, 'yyyy-MM-dd')
        }
      });
    }
  };

  const handleCellDoubleClick = (equipId: string, diaSemana: number, data: Date) => {
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

  const handleSelectPedido = async () => {
    // Recarregar instalações após criar uma nova
    setModalOpen(false);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header com dias da semana */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-4 font-medium border-r bg-muted/50">Equipe</div>
          {DIAS_SEMANA.map((dia, index) => {
            const dataAtual = addDays(currentWeek, index);
            const diaNumero = dataAtual.getDate();
            const mesNumero = dataAtual.getMonth() + 1;
            
            console.log(`Header dia ${dia.label}:`, {
              index,
              dataAtual,
              dia: diaNumero,
              mes: mesNumero,
              formatado: `${String(diaNumero).padStart(2, '0')}/${String(mesNumero).padStart(2, '0')}`
            });
            
            return (
              <div key={dia.value} className="p-4 text-center border-r last:border-r-0">
                <div className="font-medium">{dia.label}</div>
                <div className="text-sm text-muted-foreground">
                  {String(diaNumero).padStart(2, '0')}/{String(mesNumero).padStart(2, '0')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid com equipes e pontos */}
        <div className="divide-y">
          {equipesParaExibir.map((equipe) => (
            <div key={equipe.id} className="grid grid-cols-8 min-h-[100px]">
              {/* Coluna da equipe */}
              <div className="p-4 border-r bg-muted/30 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: equipe.cor }}
                  />
                  <span className="font-medium">{equipe.nome}</span>
                </div>
                <EquipeMembrosEquipeWrapper equipeId={equipe.id} />
              </div>

              {/* Colunas dos dias */}
              {DIAS_SEMANA.map((dia, index) => {
                const dataAtual = addDays(currentWeek, index);
                const instalacoesNoDia = instalacoes.filter(
                  i => i.responsavel_instalacao_id === equipe.id && 
                       i.data_instalacao && 
                       isSameDay(new Date(i.data_instalacao), dataAtual)
                );

                return (
                  <CelulaDia
                    key={`${equipe.id}-${dia.value}`}
                    equipId={equipe.id}
                    diaSemana={dia.value}
                    data={dataAtual}
                    onDrop={handleDrop}
                    onDoubleClick={handleCellDoubleClick}
                    draggedItem={draggedItem}
                  >
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
        <SelecionarPedidoInstalacaoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          dataSelecionada={selectedCell.data}
          onPedidoSelecionado={handleSelectPedido}
        />
      )}
    </div>
  );
}