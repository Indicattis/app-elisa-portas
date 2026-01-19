import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, isSameDay, isSameMonth } from "date-fns";
import { useState } from "react";
import { useOrdensCarregamentoInstalacao, OrdemCarregamentoInstalacao } from "@/hooks/useOrdensCarregamentoInstalacao";
import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { Badge } from "@/components/ui/badge";

interface CronogramaInstalacaoMensalProps {
  currentMonth: Date;
  onEditPonto: (ordem: any) => void;
  equipesFiltradas?: any[];
}

export function CronogramaInstalacaoMensal({ currentMonth, onEditPonto, equipesFiltradas }: CronogramaInstalacaoMensalProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { ordens } = useOrdensCarregamentoInstalacao(currentMonth, 'month');
  const { equipes } = useEquipesInstalacao();
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemCarregamentoInstalacao | null>(null);

  // Pegar o primeiro dia da primeira semana (pode ser do mês anterior)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  // Pegar o último dia da última semana (pode ser do próximo mês)
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Gerar as semanas do calendário
  const semanas = eachWeekOfInterval(
    { start: calendarStart, end: calendarEnd },
    { weekStartsOn: 0 }
  );

  const handleDayClick = (dia: Date, ordensNoDia: OrdemCarregamentoInstalacao[]) => {
    if (ordensNoDia.length === 1) {
      setSelectedOrdem(ordensNoDia[0]);
    }
  };

  // Map de equipes por ID para buscar cores
  const equipesMap = new Map(equipes.map(e => [e.id, e]));

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
                
                // Filtrar ordens do dia (aplicando filtro de equipes se existir)
                const ordensNoDia = ordens.filter(o => {
                  const matchData = o.data_carregamento && isSameDay(new Date(o.data_carregamento), dia);
                  const matchEquipe = !equipesFiltradas || equipesFiltradas.length === 0 || 
                    equipesFiltradas.some(eq => eq.id === o.responsavel_carregamento_id);
                  return matchData && matchEquipe;
                });

                return (
                  <div
                    key={dia.toISOString()}
                    onClick={() => handleDayClick(dia, ordensNoDia)}
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
                      
                      {ordensNoDia.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {ordensNoDia.slice(0, 3).map((ordem) => {
                            // Pegar cor da equipe (se for equipe interna) ou usar cor padrão
                            const equipe = ordem.responsavel_carregamento_id 
                              ? equipesMap.get(ordem.responsavel_carregamento_id) 
                              : null;
                            const cor = equipe?.cor || '#888';
                            
                            return (
                              <Badge
                                key={ordem.id}
                                variant="secondary"
                                className="w-2 h-2 p-0 rounded-full"
                                style={{ 
                                  backgroundColor: cor
                                }}
                              />
                            );
                          })}
                          {ordensNoDia.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{ordensNoDia.length - 3}
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

      {selectedOrdem && (
        <OrdemDetalheDialog 
          ordem={selectedOrdem} 
          open={!!selectedOrdem} 
          onOpenChange={(open) => !open && setSelectedOrdem(null)} 
        />
      )}
    </div>
  );
}

// Componente simples para exibir detalhes da ordem no calendário mensal
function OrdemDetalheDialog({ 
  ordem, 
  open, 
  onOpenChange 
}: { 
  ordem: OrdemCarregamentoInstalacao; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!open) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
      <div 
        className="relative bg-background border shadow-lg rounded-lg p-6 w-[400px] max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Detalhes da Ordem</h2>
            <button 
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Cliente</label>
              <p className="font-medium">{ordem.nome_cliente}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Data Carregamento</label>
              <p className="font-medium">{ordem.data_carregamento || '-'}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Responsável</label>
              <p className="font-medium">{ordem.responsavel_carregamento_nome || '-'}</p>
            </div>
            
            {ordem.venda && (
              <div>
                <label className="text-sm text-muted-foreground">Localização</label>
                <p className="font-medium">
                  {ordem.venda.cidade}{ordem.venda.estado ? `, ${ordem.venda.estado}` : ''}
                </p>
              </div>
            )}
            
            {ordem.pedido && (
              <div>
                <label className="text-sm text-muted-foreground">Pedido</label>
                <p className="font-medium">#{ordem.pedido.numero_pedido}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
