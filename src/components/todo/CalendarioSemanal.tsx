import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tarefa } from "@/hooks/useTarefas";
import { CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
interface CalendarioSemanalProps {
  tarefas: Tarefa[];
}
export function CalendarioSemanal({
  tarefas
}: CalendarioSemanalProps) {
  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, {
    locale: ptBR
  });
  const diasSemana = Array.from({
    length: 7
  }, (_, i) => addDays(inicioSemana, i));
  const [diaSelecionado, setDiaSelecionado] = useState<string>(format(hoje, "yyyy-MM-dd"));
  const getTarefasDoDia = (dia: Date) => {
    return tarefas.filter(tarefa => {
      const dataTarefa = parseISO(tarefa.created_at);
      return isSameDay(dataTarefa, dia) && tarefa.status === 'em_andamento';
    });
  };
  const diaSelecionadoDate = diasSemana.find(d => format(d, "yyyy-MM-dd") === diaSelecionado) || hoje;
  const tarefasDoDiaSelecionado = getTarefasDoDia(diaSelecionadoDate);
  return;
}