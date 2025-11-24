import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Instalacao } from "@/types/instalacao";
import { DroppableDay } from "./DroppableDay";
import { InstalacaoCard } from "./InstalacaoCard";
import { toast } from "sonner";
import { SelecionarPedidoInstalacaoModal } from "./SelecionarPedidoInstalacaoModal";
import { supabase } from "@/integrations/supabase/client";

interface CalendarioMensalDesktopProps {
  currentMonth: Date;
  instalacoes: Instalacao[];
  onMonthChange: (date: Date) => void;
  onUpdateInstalacao: (params: { id: string; data: Partial<Instalacao> }) => Promise<void>;
  onEdit: (instalacao: Instalacao) => void;
  onRemoverDoCalendario: (id: string) => void;
  onInstalacaoCriada?: () => void;
  onPedidoDropped?: () => void;
}

export const CalendarioMensalDesktop = ({
  currentMonth,
  instalacoes,
  onMonthChange,
  onUpdateInstalacao,
  onEdit,
  onRemoverDoCalendario,
  onInstalacaoCriada,
  onPedidoDropped,
}: CalendarioMensalDesktopProps) => {
  const [activeInstalacao, setActiveInstalacao] = useState<Instalacao | null>(null);
  const [activePedido, setActivePedido] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'pedido') {
      setActivePedido(data.pedido);
    } else if (data?.instalacao) {
      setActiveInstalacao(data.instalacao);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current;
    
    setActiveInstalacao(null);
    setActivePedido(null);

    if (!over || active.id === over.id) return;

    const novaData = over.data.current?.date as Date;
    if (!novaData) return;

    try {
      // Se estamos arrastando um pedido
      if (activeData?.type === 'pedido') {
        const pedido = activeData.pedido;
        const dataFormatada = format(novaData, 'yyyy-MM-dd');

        // Criar instalação vinculada ao pedido
        const { error: insertError } = await supabase
          .from('instalacoes')
          .insert({
            pedido_id: pedido.id,
            venda_id: pedido.venda.id,
            nome_cliente: pedido.venda.cliente_nome,
            telefone_cliente: pedido.venda.cliente_telefone,
            cidade: pedido.venda.cidade || '',
            estado: pedido.venda.estado || '',
            data_instalacao: dataFormatada,
            hora: '08:00',
            produto: '',
            status: 'pronta_fabrica',
            tipo_instalacao: null,
            responsavel_instalacao_id: null,
            responsavel_instalacao_nome: null
          });

        if (insertError) throw insertError;

        // Atualizar data_carregamento do pedido
        const { error: updateError } = await supabase
          .from('pedidos_producao')
          .update({ data_carregamento: dataFormatada })
          .eq('id', pedido.id);

        if (updateError) throw updateError;

        toast.success('Instalação criada com sucesso!');
        onPedidoDropped?.();
      } else {
        // Se estamos arrastando uma instalação existente
        const instalacaoId = active.id as string;
        await onUpdateInstalacao({
          id: instalacaoId,
          data: {
            data: format(novaData, "yyyy-MM-dd"),
          },
        });
        toast.success("Data da instalação atualizada");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar operação");
    }
  };

  // Calcular dias do mês
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  return (
    <>
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Navegação do mês */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-lg font-semibold text-foreground min-w-[200px] text-center">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>

            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(new Date())}
          >
            Ir para hoje
          </Button>
        </div>

        {/* Grid do calendário */}
        <div className="rounded-lg overflow-hidden bg-muted/20 border border-border">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold text-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-7">
            {days.map((day) => (
              <DroppableDay
                key={day.toISOString()}
                date={day}
                currentMonth={currentMonth}
                instalacoes={instalacoes}
                onDayClick={handleDayClick}
                onEdit={onEdit}
                onRemoverDoCalendario={onRemoverDoCalendario}
                onPedidoDropped={onPedidoDropped}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Overlay durante o arrasto */}
      <DragOverlay>
        {activeInstalacao && (
          <div className="opacity-80">
            <InstalacaoCard
              instalacao={activeInstalacao}
              onEdit={() => {}}
              onRemoverDoCalendario={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>

    {/* Modal de seleção de pedido */}
    {selectedDate && (
      <SelecionarPedidoInstalacaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dataSelecionada={selectedDate}
        onPedidoSelecionado={onInstalacaoCriada}
      />
    )}
    </>
  );
};
