import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tarefa } from "@/hooks/useTarefas";
import { CalendarDays } from "lucide-react";

interface CalendarioSemanalProps {
  tarefas: Tarefa[];
}

export function CalendarioSemanal({ tarefas }: CalendarioSemanalProps) {
  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, { locale: ptBR });
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));

  const getTarefasDoDia = (dia: Date) => {
    return tarefas.filter(tarefa => {
      const dataTarefa = parseISO(tarefa.created_at);
      return isSameDay(dataTarefa, dia) && tarefa.status === 'em_andamento';
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Tarefas da Semana</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map((dia, index) => {
            const tarefasDoDia = getTarefasDoDia(dia);
            const isHoje = isSameDay(dia, hoje);
            
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all ${
                  isHoje
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <div className="text-center mb-2">
                  <div className="text-xs text-muted-foreground font-medium uppercase">
                    {format(dia, "EEE", { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-bold ${isHoje ? "text-primary" : ""}`}>
                    {format(dia, "dd", { locale: ptBR })}
                  </div>
                </div>
                {tarefasDoDia.length > 0 ? (
                  <Badge
                    variant={isHoje ? "default" : "secondary"}
                    className="w-full justify-center text-xs"
                  >
                    {tarefasDoDia.length} {tarefasDoDia.length === 1 ? "tarefa" : "tarefas"}
                  </Badge>
                ) : (
                  <div className="text-xs text-center text-muted-foreground">
                    Nenhuma
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
