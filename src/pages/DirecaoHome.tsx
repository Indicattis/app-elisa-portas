import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTarefasCalendario } from "@/hooks/useTarefasCalendario";
import { ClipboardCheck, Calendar as CalendarIcon, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { format, addWeeks, subWeeks, addMonths, subMonths, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalendarioSemanalTarefasMobile } from "@/components/direcao/CalendarioSemanalTarefasMobile";
import { CalendarioMensalTarefasDesktop } from "@/components/direcao/CalendarioMensalTarefasDesktop";
import { TarefaDetailsSheet } from "@/components/direcao/TarefaDetailsSheet";
import { TarefaCalendario } from "@/components/direcao/TarefaCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function DirecaoHome() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [mesAno, setMesAno] = useState(new Date());
  const [weekStart, setWeekStart] = useState(new Date());
  const [tarefaSelecionada, setTarefaSelecionada] = useState<TarefaCalendario | null>(null);
  
  const { data, isLoading } = useTarefasCalendario(mesAno);

  // Função para obter tarefas de um dia específico
  const getTarefasDoDia = (date: Date): TarefaCalendario[] => {
    if (!data?.tarefasPorDia) return [];
    const diaStr = format(date, 'yyyy-MM-dd');
    return data.tarefasPorDia[diaStr]?.tarefas || [];
  };

  // Navegação semanal
  const handlePreviousWeek = () => setWeekStart(subWeeks(weekStart, 1));
  const handleNextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const handleTodayWeek = () => setWeekStart(new Date());

  // Navegação mensal
  const handlePreviousMonth = () => setMesAno(subMonths(mesAno, 1));
  const handleNextMonth = () => setMesAno(addMonths(mesAno, 1));
  const handleTodayMonth = () => setMesAno(new Date());

  // Click no dia (navegar para checklist)
  const handleDayClick = (date: Date) => {
    navigate('/dashboard/direcao/checklist');
  };

  // Click na tarefa
  const handleTarefaClick = (tarefa: TarefaCalendario) => {
    setTarefaSelecionada(tarefa);
  };

  // Marcar tarefa como concluída
  const handleMarcarConcluida = async (tarefa: TarefaCalendario) => {
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ status: 'concluida' })
        .eq('id', tarefa.id);

      if (error) throw error;

      toast.success('Tarefa marcada como concluída!');
      queryClient.invalidateQueries({ queryKey: ['tarefas-calendario'] });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  // Flatten todas as tarefas para o calendário semanal
  const todasTarefas: TarefaCalendario[] = data?.tarefasPorDia
    ? Object.values(data.tarefasPorDia).flatMap(dia => dia.tarefas)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 md:h-8 md:w-8" />
            Direção - Tarefas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Acompanhe e gerencie as tarefas da equipe
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tarefas-calendario'] })}
          >
            <RefreshCw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Atualizar</span>
          </Button>
          <Button onClick={() => navigate('/dashboard/direcao/checklist')}>
            <ClipboardCheck className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Ir para Checklist</span>
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-3 grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground hidden md:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{data?.stats.totalTarefas || 0}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 hidden md:block">
              {format(mesAno, "MMMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-destructive hidden md:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-destructive">
              {data?.stats.totalPendentes || 0}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 hidden md:block">
              Aguardando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success hidden md:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-success">
              {data?.stats.totalConcluidas || 0}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 hidden md:block">
              Finalizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendário - Responsivo */}
      <Card>
        <CardContent className="p-4 md:p-6">
          {isMobile ? (
            <CalendarioSemanalTarefasMobile
              startDate={weekStart}
              tarefas={todasTarefas}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
              onToday={handleTodayWeek}
              onDayClick={handleDayClick}
              onTarefaClick={handleTarefaClick}
              onMarcarConcluida={handleMarcarConcluida}
              getTarefasDoDia={getTarefasDoDia}
            />
          ) : (
            <CalendarioMensalTarefasDesktop
              mesAtual={mesAno}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
              onToday={handleTodayMonth}
              onDayClick={handleDayClick}
              onTarefaClick={handleTarefaClick}
              onMarcarConcluida={handleMarcarConcluida}
              getTarefasDoDia={getTarefasDoDia}
            />
          )}
        </CardContent>
      </Card>

      {/* Sheet de detalhes da tarefa */}
      <TarefaDetailsSheet
        tarefa={tarefaSelecionada}
        open={!!tarefaSelecionada}
        onOpenChange={(open) => !open && setTarefaSelecionada(null)}
        onMarcarConcluida={handleMarcarConcluida}
      />
    </div>
  );
}
