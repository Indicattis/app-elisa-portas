import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTarefasCalendario } from "@/hooks/useTarefasCalendario";
import { ClipboardCheck, Calendar as CalendarIcon, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function DirecaoHome() {
  const navigate = useNavigate();
  const [mesAno, setMesAno] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | undefined>();
  const { data, isLoading } = useTarefasCalendario(mesAno);

  const tarefasDoDia = diaSelecionado
    ? data?.tarefasPorDia[format(diaSelecionado, 'yyyy-MM-dd')]
    : null;

  const renderDay = (day: Date) => {
    const diaStr = format(day, 'yyyy-MM-dd');
    const tarefasDia = data?.tarefasPorDia[diaStr];

    if (!tarefasDia || (tarefasDia.totalPendentes === 0 && tarefasDia.totalConcluidas === 0)) {
      return null;
    }

    return (
      <div className="flex gap-1 mt-1 justify-center">
        {tarefasDia.totalPendentes > 0 && (
          <Badge variant="destructive" className="h-4 px-1 text-[10px] font-medium">
            {tarefasDia.totalPendentes}
          </Badge>
        )}
        {tarefasDia.totalConcluidas > 0 && (
          <Badge className="h-4 px-1 text-[10px] font-medium bg-success text-success-foreground">
            {tarefasDia.totalConcluidas}
          </Badge>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarIcon className="h-8 w-8" />
            Direção - Calendário de Tarefas
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe e gerencie as tarefas da equipe por dia
          </p>
        </div>

        <Button onClick={() => navigate('/dashboard/direcao/checklist')}>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Ir para Checklist
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.totalTarefas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tarefas no mês de {format(mesAno, "MMMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {data?.stats.totalPendentes || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {data?.stats.totalConcluidas || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Finalizadas com sucesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendário */}
      <Card>
        <CardHeader>
          <CardTitle>Calendário do Mês</CardTitle>
          <CardDescription>
            Clique em um dia para ver as tarefas detalhadas. 
            <Badge variant="destructive" className="ml-2 h-4 px-1 text-[10px]">n</Badge> indica pendentes, 
            <Badge className="ml-1 h-4 px-1 text-[10px] bg-success text-success-foreground">n</Badge> indica concluídas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={diaSelecionado}
            onSelect={setDiaSelecionado}
            month={mesAno}
            onMonthChange={setMesAno}
            className="rounded-md border"
            modifiers={{
              hasTasks: (date) => {
                const diaStr = format(date, 'yyyy-MM-dd');
                const tarefas = data?.tarefasPorDia[diaStr];
                return !!(tarefas && (tarefas.totalPendentes > 0 || tarefas.totalConcluidas > 0));
              }
            }}
            modifiersClassNames={{
              hasTasks: "font-bold"
            }}
          />
        </CardContent>
      </Card>

      {/* Sheet com detalhes do dia */}
      <Sheet open={!!diaSelecionado} onOpenChange={(open) => !open && setDiaSelecionado(undefined)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {diaSelecionado && format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}
            </SheetTitle>
            <SheetDescription>
              {tarefasDoDia?.tarefas.length || 0} tarefa(s) cadastrada(s) neste dia
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {tarefasDoDia?.tarefas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma tarefa neste dia
              </p>
            ) : (
              tarefasDoDia?.tarefas.map((tarefa) => (
                <Card key={tarefa.id} className={cn(
                  "transition-all",
                  tarefa.status === 'concluida' && "opacity-60"
                )}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={tarefa.responsavel_foto || undefined} />
                        <AvatarFallback>
                          {tarefa.responsavel_nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm",
                          tarefa.status === 'concluida' && "line-through"
                        )}>
                          {tarefa.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Responsável: {tarefa.responsavel_nome}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={tarefa.status === 'concluida' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {tarefa.status === 'concluida' ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Concluída
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </>
                            )}
                          </Badge>

                          {tarefa.recorrente && (
                            <Badge variant="secondary" className="text-xs">
                              Recorrente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard/direcao/checklist')}
            >
              Ver todas as tarefas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
