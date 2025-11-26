import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tarefa } from "@/hooks/useTarefas";
import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface CalendarioSemanalProps {
  tarefas: Tarefa[];
}

export function CalendarioSemanal({ tarefas }: CalendarioSemanalProps) {
  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, { locale: ptBR });
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));
  
  const [diaSelecionado, setDiaSelecionado] = useState<string>(
    format(hoje, "yyyy-MM-dd")
  );

  const getTarefasDoDia = (dia: Date) => {
    return tarefas.filter(tarefa => {
      const dataTarefa = parseISO(tarefa.created_at);
      return isSameDay(dataTarefa, dia) && tarefa.status === 'em_andamento';
    });
  };

  const diaSelecionadoDate = diasSemana.find(
    d => format(d, "yyyy-MM-dd") === diaSelecionado
  ) || hoje;
  
  const tarefasDoDiaSelecionado = getTarefasDoDia(diaSelecionadoDate);

  return (
    <Card>
      <CardContent className="pt-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary shrink-0" />
          
          <Select value={diaSelecionado} onValueChange={setDiaSelecionado}>
            <SelectTrigger className="flex-1 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {diasSemana.map((dia) => {
                const tarefasDoDia = getTarefasDoDia(dia);
                const isHoje = isSameDay(dia, hoje);
                
                return (
                  <SelectItem 
                    key={format(dia, "yyyy-MM-dd")} 
                    value={format(dia, "yyyy-MM-dd")}
                  >
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className={isHoje ? "font-semibold text-primary" : ""}>
                        {format(dia, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        {isHoje && " (Hoje)"}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Badge 
            variant={tarefasDoDiaSelecionado.length > 0 ? "destructive" : "secondary"}
            className="shrink-0 min-w-[60px] justify-center"
          >
            {tarefasDoDiaSelecionado.length} {tarefasDoDiaSelecionado.length === 1 ? "tarefa" : "tarefas"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}