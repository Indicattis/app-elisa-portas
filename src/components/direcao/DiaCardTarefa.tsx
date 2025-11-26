import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { format, isSameDay, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TarefaCard, TarefaCalendario } from "./TarefaCard";

interface DiaCardTarefaProps {
  date: Date;
  tarefas: TarefaCalendario[];
  onDayClick: (date: Date) => void;
  onTarefaClick?: (tarefa: TarefaCalendario) => void;
  onMarcarConcluida?: (tarefa: TarefaCalendario) => void;
}

export const DiaCardTarefa = ({
  date,
  tarefas,
  onDayClick,
  onTarefaClick,
  onMarcarConcluida,
}: DiaCardTarefaProps) => {
  const hoje = new Date();
  const isHoje = isSameDay(date, hoje);
  const isFimDeSemana = isWeekend(date);

  // Usar diretamente tarefas recebidas (já filtradas pelo pai)
  const pendentes = tarefas.filter(t => t.status === 'em_andamento').length;
  const concluidas = tarefas.filter(t => t.status === 'concluida').length;

  return (
    <Card
      className={`min-h-[100px] transition-all ${
        isHoje
          ? "ring-2 ring-primary bg-primary/5"
          : isFimDeSemana
          ? "bg-muted/30"
          : "bg-card"
      }`}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                isHoje ? "text-primary" : "text-foreground"
              }`}
            >
              {format(date, "EEE", { locale: ptBR })}
            </span>
            <span
              className={`text-lg font-bold ${
                isHoje ? "text-primary" : ""
              }`}
            >
              {format(date, "dd", { locale: ptBR })}
            </span>
            {isHoje && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                Hoje
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {pendentes > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                {pendentes}
              </Badge>
            )}
            {concluidas > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-success text-success-foreground">
                {concluidas}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onDayClick(date)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-1.5">
        {tarefas.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Sem tarefas
          </p>
        ) : (
          tarefas.map((tarefa) => (
            <TarefaCard
              key={tarefa.id}
              tarefa={tarefa}
              onClick={onTarefaClick}
              onMarcarConcluida={onMarcarConcluida}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
