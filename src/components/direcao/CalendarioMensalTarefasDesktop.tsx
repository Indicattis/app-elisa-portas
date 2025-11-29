import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isWeekend 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { TarefaCard, TarefaCalendario } from "./TarefaCard";
import { AdicionarTarefaPopover } from "./AdicionarTarefaPopover";

interface CalendarioMensalTarefasDesktopProps {
  mesAtual: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onTarefaClick?: (tarefa: TarefaCalendario) => void;
  onMarcarConcluida?: (tarefa: TarefaCalendario) => void;
  getTarefasDoDia: (date: Date) => TarefaCalendario[];
}

export const CalendarioMensalTarefasDesktop = ({
  mesAtual,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onTarefaClick,
  onMarcarConcluida,
  getTarefasDoDia,
}: CalendarioMensalTarefasDesktopProps) => {
  const hoje = new Date();
  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  const inicioCalendario = startOfWeek(inicioMes, { weekStartsOn: 0 });
  const fimCalendario = endOfWeek(fimMes, { weekStartsOn: 0 });
  
  const diasCalendario = eachDayOfInterval({ 
    start: inicioCalendario, 
    end: fimCalendario 
  });

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4">
      {/* Navegação do mês */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <Button variant="outline" size="icon" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button variant="outline" size="sm" onClick={onToday}>
          Ir para hoje
        </Button>
      </div>

      {/* Header dos dias da semana */}
      <div className="grid grid-cols-7 gap-1">
        {diasSemana.map((dia) => (
          <div 
            key={dia} 
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7 gap-1">
        {diasCalendario.map((dia) => {
          const isHoje = isSameDay(dia, hoje);
          const isMesAtual = isSameMonth(dia, mesAtual);
          const isFimDeSemana = isWeekend(dia);
          const tarefasDoDia = getTarefasDoDia(dia);
          const pendentes = tarefasDoDia.filter(t => t.status === 'em_andamento').length;
          const concluidas = tarefasDoDia.filter(t => t.status === 'concluida').length;

          return (
            <div
              key={dia.toISOString()}
              className={`min-h-[120px] p-2 border rounded-lg transition-all ${
                !isMesAtual
                  ? "opacity-40 bg-muted/20"
                  : isHoje
                  ? "ring-2 ring-primary bg-primary/5"
                  : isFimDeSemana
                  ? "bg-muted/30"
                  : "bg-card"
              }`}
            >
              {/* Header do dia */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-sm font-medium ${
                      isHoje ? "text-primary" : !isMesAtual ? "text-muted-foreground" : ""
                    }`}
                  >
                    {format(dia, "d")}
                  </span>
                  {pendentes > 0 && (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">
                      {pendentes}
                    </Badge>
                  )}
                  {concluidas > 0 && (
                    <Badge className="text-[9px] px-1 py-0 h-3.5 bg-success text-success-foreground">
                      {concluidas}
                    </Badge>
                  )}
                </div>
                
                {isMesAtual && <AdicionarTarefaPopover date={dia} />}
              </div>

              {/* Lista de tarefas (max 3 visíveis) */}
              <div className="space-y-1">
                {tarefasDoDia.slice(0, 3).map((tarefa) => (
                  <TarefaCard
                    key={tarefa.id}
                    tarefa={tarefa}
                    onClick={onTarefaClick}
                    onMarcarConcluida={onMarcarConcluida}
                  />
                ))}
                {tarefasDoDia.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{tarefasDoDia.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
