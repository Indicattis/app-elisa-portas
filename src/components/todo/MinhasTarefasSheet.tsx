import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTarefas, Tarefa } from "@/hooks/useTarefas";
import { startOfWeek, endOfWeek, addWeeks, parseISO, isWithinInterval, format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MinhasTarefasSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinhasTarefasSheet({ open, onOpenChange }: MinhasTarefasSheetProps) {
  const { user } = useAuth();

  const { tarefas = [], isLoading, marcarConcluida } = useTarefas(user?.id);

  const hoje = startOfDay(new Date());
  const inicioSemanaAtual = startOfWeek(hoje, { weekStartsOn: 0 });
  const fimSemanaAtual = endOfWeek(hoje, { weekStartsOn: 0 });
  const inicioProximaSemana = addWeeks(inicioSemanaAtual, 1);
  const fimProximaSemana = addWeeks(fimSemanaAtual, 1);

  // Verificar se tarefa está atrasada
  const isAtrasada = (tarefa: Tarefa) => {
    if (tarefa.status === "concluida") return false;
    const dataStr = (tarefa as any).data_referencia || tarefa.created_at;
    if (!dataStr) return false;
    const dataTarefa = parseISO(dataStr.split('T')[0]);
    return isBefore(dataTarefa, hoje);
  };

  // Filtrar tarefas da semana atual
  const tarefasSemanaAtual = useMemo(() => {
    return tarefas.filter((tarefa) => {
      const dataStr = (tarefa as any).data_referencia || tarefa.created_at;
      if (!dataStr) return false;
      const dataTarefa = parseISO(dataStr.split('T')[0]);
      return isWithinInterval(dataTarefa, { start: inicioSemanaAtual, end: fimSemanaAtual });
    });
  }, [tarefas, inicioSemanaAtual, fimSemanaAtual]);

  // Filtrar tarefas da próxima semana
  const tarefasProximaSemana = useMemo(() => {
    return tarefas.filter((tarefa) => {
      const dataStr = (tarefa as any).data_referencia || tarefa.created_at;
      if (!dataStr) return false;
      const dataTarefa = parseISO(dataStr.split('T')[0]);
      return isWithinInterval(dataTarefa, { start: inicioProximaSemana, end: fimProximaSemana });
    });
  }, [tarefas, inicioProximaSemana, fimProximaSemana]);

  const labelSemanaAtual = `${format(inicioSemanaAtual, "dd/MM", { locale: ptBR })} - ${format(fimSemanaAtual, "dd/MM", { locale: ptBR })}`;
  const labelProximaSemana = `${format(inicioProximaSemana, "dd/MM", { locale: ptBR })} - ${format(fimProximaSemana, "dd/MM", { locale: ptBR })}`;

  const handleMarcarConcluida = async (tarefaId: string) => {
    try {
      await marcarConcluida.mutateAsync(tarefaId);
    } catch (error) {
      toast.error("Erro ao marcar tarefa como concluída");
    }
  };

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-[400px]">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const TarefasList = ({ tarefas: listaTarefas }: { tarefas: typeof tarefas }) => {
    const emAndamento = listaTarefas.filter((t) => t.status === "em_andamento");
    const concluidas = listaTarefas.filter((t) => t.status === "concluida");

    return (
      <div className="space-y-4 py-4">
        {/* Em Andamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Em Andamento ({emAndamento.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {emAndamento.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nenhuma tarefa pendente
              </p>
            ) : (
              emAndamento.map((tarefa) => {
                const atrasada = isAtrasada(tarefa);
                return (
                  <div
                    key={tarefa.id}
                    className={cn(
                      "flex items-center gap-2 h-[36px] px-2 rounded-md group",
                      "border-b border-border/30 last:border-0",
                      atrasada && "bg-destructive/5"
                    )}
                  >
                    <button
                      onClick={() => handleMarcarConcluida(tarefa.id)}
                      className="h-4 w-4 rounded border border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                      title="Marcar como concluída"
                    />
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="text-[10px]">
                        {tarefa.responsavel?.nome?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm truncate">{tarefa.descricao}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {atrasada && (
                        <Badge variant="destructive" className="h-4 text-[10px] px-1.5">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          Atrasada
                        </Badge>
                      )}
                      {tarefa.recorrente && (
                        <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
                          <Calendar className="h-2.5 w-2.5 mr-0.5" />
                          Recorrente
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Concluídas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Concluídas ({concluidas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {concluidas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nenhuma tarefa concluída
              </p>
            ) : (
              concluidas.map((tarefa) => (
                <div
                  key={tarefa.id}
                  className={cn(
                    "flex items-center gap-2 h-[36px] px-2 rounded-md",
                    "border-b border-border/30 last:border-0 opacity-60"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="text-[10px]">
                      {tarefa.responsavel?.nome?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm truncate line-through">
                    {tarefa.descricao}
                  </span>
                  {tarefa.recorrente && (
                    <Badge variant="secondary" className="h-4 text-[10px] px-1.5 flex-shrink-0">
                      <Calendar className="h-2.5 w-2.5 mr-0.5" />
                      Recorrente
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-[400px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tarefas da Semana
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="atual" className="flex-1 flex flex-col">
          <div className="px-4 py-2 border-b">
            <TabsList className="w-full">
              <TabsTrigger value="atual" className="flex-1 text-xs">
                Esta Semana
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {tarefasSemanaAtual.filter(t => t.status === 'em_andamento').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="proxima" className="flex-1 text-xs">
                Próxima Semana
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {tarefasProximaSemana.filter(t => t.status === 'em_andamento').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="atual" className="flex-1 m-0">
            <div className="px-4 py-2 text-xs text-muted-foreground text-center border-b">
              {labelSemanaAtual}
            </div>
            <ScrollArea className="flex-1 px-4 h-[calc(100vh-220px)]">
              <TarefasList tarefas={tarefasSemanaAtual} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="proxima" className="flex-1 m-0">
            <div className="px-4 py-2 text-xs text-muted-foreground text-center border-b">
              {labelProximaSemana}
            </div>
            <ScrollArea className="flex-1 px-4 h-[calc(100vh-220px)]">
              <TarefasList tarefas={tarefasProximaSemana} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
