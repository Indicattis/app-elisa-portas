import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tarefa } from "@/hooks/useTarefas";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface CalendarioSemanalProps {
  tarefas: Tarefa[];
  diaSelecionado: Date;
  onDiaChange: (dia: Date) => void;
}

export function CalendarioSemanal({
  tarefas,
  diaSelecionado,
  onDiaChange
}: CalendarioSemanalProps) {
  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, { locale: ptBR });
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));

  const getTarefasDoDia = (dia: Date) => {
    return tarefas.filter(tarefa => {
      const dataTarefa = parseISO(tarefa.created_at);
      return isSameDay(dataTarefa, dia);
    });
  };

  const getContadores = (dia: Date) => {
    const tarefasDia = getTarefasDoDia(dia);
    return {
      total: tarefasDia.length,
      concluidas: tarefasDia.filter(t => t.status === 'concluida').length,
      pendentes: tarefasDia.filter(t => t.status === 'em_andamento').length
    };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Semana Atual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {diasSemana.map((dia) => {
            const isHoje = isSameDay(dia, hoje);
            const isSelecionado = isSameDay(dia, diaSelecionado);
            const contadores = getContadores(dia);
            const todasConcluidas = contadores.total > 0 && contadores.pendentes === 0;

            return (
              <button
                key={dia.toISOString()}
                onClick={() => onDiaChange(dia)}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg transition-colors min-h-[70px]",
                  isSelecionado
                    ? "bg-primary text-primary-foreground"
                    : isHoje
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                )}
              >
                <span className="text-xs uppercase font-medium opacity-70">
                  {format(dia, "EEE", { locale: ptBR })}
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  isHoje && !isSelecionado && "text-primary"
                )}>
                  {format(dia, "d")}
                </span>
                
                {contadores.total > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {todasConcluidas ? (
                      <CheckCircle2 className={cn(
                        "h-3.5 w-3.5",
                        isSelecionado ? "text-primary-foreground" : "text-green-500"
                      )} />
                    ) : (
                      <Badge 
                        variant={isSelecionado ? "secondary" : "outline"} 
                        className={cn(
                          "h-5 text-xs px-1.5",
                          isSelecionado && "bg-primary-foreground/20 text-primary-foreground border-0"
                        )}
                      >
                        {contadores.pendentes}
                      </Badge>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
