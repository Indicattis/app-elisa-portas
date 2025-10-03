import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { useInstalacoesCronograma } from "@/hooks/useInstalacoesCronograma";
import { PontoInstalacao } from "./PontoInstalacao";
import { CelulaDia } from "./CelulaDia";
import { DetalhesInstalacaoDialog } from "@/components/cadastro-instalacao/DetalhesInstalacaoDialog";
import { useState } from "react";

interface CronogramaInstalacaoProps {
  currentWeek: Date;
  onEditPonto: (instalacao: any) => void;
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

export function CronogramaInstalacao({ currentWeek, onEditPonto }: CronogramaInstalacaoProps) {
  const { equipes } = useEquipesInstalacao();
  const { instalacoes, updateInstalacaoData } = useInstalacoesCronograma(currentWeek);
  const { draggedItem, handleDragStart, handleDragEnd } = useDragAndDrop();
  const [selectedInstalacao, setSelectedInstalacao] = useState<any>(null);

  const handleDrop = async (equipId: string, diaSemana: number) => {
    if (draggedItem && draggedItem.equipId !== equipId) {
      // Calcular a nova data baseada no dia da semana
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const novaData = addDays(weekStart, diaSemana === 0 ? 6 : diaSemana - 1);
      
      await updateInstalacaoData(
        draggedItem.id,
        equipId,
        novaData
      );
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header com dias da semana */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-4 font-medium border-r bg-muted/50">Equipe</div>
          {DIAS_SEMANA.map((dia, index) => {
            const dataAtual = addDays(currentWeek, index);
            return (
              <div key={dia.value} className="p-4 text-center border-r last:border-r-0">
                <div className="font-medium">{dia.label}</div>
                <div className="text-sm text-muted-foreground">
                  {format(dataAtual, "dd/MM", { locale: ptBR })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid com equipes e pontos */}
        <div className="divide-y">
          {equipes.map((equipe) => (
            <div key={equipe.id} className="grid grid-cols-8 min-h-[100px]">
              {/* Coluna da equipe */}
              <div className="p-4 border-r bg-muted/30 flex items-center">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: equipe.cor }}
                  />
                  <span className="font-medium">{equipe.nome}</span>
                </div>
              </div>

              {/* Colunas dos dias */}
              {DIAS_SEMANA.map((dia) => {
                const instalacoesNoDia = instalacoes.filter(
                  i => i.responsavel_instalacao_id === equipe.id && i.dia_semana === dia.value
                );

                return (
                  <CelulaDia
                    key={`${equipe.id}-${dia.value}`}
                    equipId={equipe.id}
                    diaSemana={dia.value}
                    onDrop={handleDrop}
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
    </div>
  );
}