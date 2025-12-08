import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, isSameDay, isSameMonth } from "date-fns";
import { useState } from "react";
import { DetalhesInstalacaoDialog } from "@/components/cadastro-instalacao/DetalhesInstalacaoDialog";
import { Badge } from "@/components/ui/badge";
import { InstalacaoCronogramaEquipe } from "@/hooks/useInstalacoesCronogramaEquipes";

interface CronogramaInstalacaoEquipesMensalProps {
  currentMonth: Date;
  onEditPonto: (instalacao: any) => void;
  equipesFiltradas?: any[];
  instalacoes: InstalacaoCronogramaEquipe[];
}

export function CronogramaInstalacaoEquipesMensal({ 
  currentMonth, 
  onEditPonto, 
  equipesFiltradas,
  instalacoes 
}: CronogramaInstalacaoEquipesMensalProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const [selectedInstalacao, setSelectedInstalacao] = useState<any>(null);

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const semanas = eachWeekOfInterval(
    { start: calendarStart, end: calendarEnd },
    { weekStartsOn: 0 }
  );

  const handleDayClick = (dia: Date, instalacoesDoDia: any[]) => {
    if (instalacoesDoDia.length === 1) {
      setSelectedInstalacao(instalacoesDoDia[0]);
    }
  };

  return (
    <div className="w-full">
      {/* Header com dias da semana */}
      <div className="grid grid-cols-7 border-b">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
          <div 
            key={dia} 
            className={`p-3 text-center font-medium border-r last:border-r-0 ${
              index === 0 || index === 6 ? 'bg-muted/30' : 'bg-muted/50'
            }`}
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grid com semanas */}
      <div className="divide-y">
        {semanas.map((semanaInicio) => {
          const diasDaSemana = eachDayOfInterval({
            start: semanaInicio,
            end: endOfWeek(semanaInicio, { weekStartsOn: 0 })
          });

          return (
            <div key={semanaInicio.toISOString()} className="grid grid-cols-7">
              {diasDaSemana.map((dia) => {
                const isWeekend = dia.getDay() === 0 || dia.getDay() === 6;
                const isToday = isSameDay(dia, new Date());
                const isCurrentMonth = isSameMonth(dia, currentMonth);
                
                const instalacoesNoDia = instalacoes.filter(i => {
                  const matchData = i.data_instalacao && isSameDay(new Date(i.data_instalacao), dia);
                  const matchEquipe = !equipesFiltradas || equipesFiltradas.length === 0 || 
                    equipesFiltradas.some(eq => eq.id === i.responsavel_instalacao_id);
                  return matchData && matchEquipe;
                });

                return (
                  <div
                    key={dia.toISOString()}
                    onClick={() => handleDayClick(dia, instalacoesNoDia)}
                    className={`min-h-[100px] p-2 border-r last:border-r-0 cursor-pointer hover:bg-muted/20 transition-colors ${
                      isWeekend ? 'bg-muted/10' : ''
                    } ${isToday ? 'bg-primary/5' : ''} ${!isCurrentMonth ? 'opacity-40' : ''}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`text-sm mb-2 ${
                        isToday ? 'font-bold text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {dia.getDate()}
                      </div>
                      
                      {instalacoesNoDia.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {instalacoesNoDia.slice(0, 3).map((instalacao) => {
                            const cor = instalacao.equipe?.cor || '#888';
                            
                            return (
                              <Badge
                                key={instalacao.id}
                                variant="secondary"
                                className="w-2 h-2 p-0 rounded-full"
                                style={{ 
                                  backgroundColor: cor
                                }}
                              />
                            );
                          })}
                          {instalacoesNoDia.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{instalacoesNoDia.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
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
