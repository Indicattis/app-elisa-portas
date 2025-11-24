import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter } from "@dnd-kit/core";
import { Instalacao } from "@/types/instalacao";
import { Button } from "@/components/ui/button";
import { DroppableDaySimple } from "./DroppableDaySimple";
import { DraggableInstalacao } from "./DraggableInstalacao";
import { SelecionarPedidoInstalacaoModal } from "./SelecionarPedidoInstalacaoModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalendarioSemanalDesktopProps {
  startDate: Date;
  instalacoes: Instalacao[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onUpdateInstalacao: (params: { id: string; data: Partial<Instalacao> }) => Promise<void>;
  onEdit: (instalacao: Instalacao) => void;
  onDelete: (id: string) => void;
  onInstalacaoCriada?: () => void;
  onPedidoDropped?: () => void;
}

export const CalendarioSemanalDesktop = ({
  startDate,
  instalacoes,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onUpdateInstalacao,
  onEdit,
  onDelete,
  onInstalacaoCriada,
  onPedidoDropped,
}: CalendarioSemanalDesktopProps) => {
  const [activeInstalacao, setActiveInstalacao] = useState<Instalacao | null>(null);
  const [activePedido, setActivePedido] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekDayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'pedido') {
      setActivePedido(data.pedido);
    } else if (data?.instalacao) {
      setActiveInstalacao(data.instalacao as Instalacao);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current;
    
    setActiveInstalacao(null);
    setActivePedido(null);

    if (!over) return;

    const novaData = over.data.current?.date as Date;
    if (!novaData) return;

    try {
      // Se estamos arrastando um pedido
      if (activeData?.type === 'pedido') {
        const pedido = activeData.pedido;
        const dataFormatada = format(novaData, 'yyyy-MM-dd');

        // Criar instalação vinculada ao pedido
        const { error: insertError } = await supabase
          .from('instalacoes_cadastradas')
          .insert({
            pedido_id: pedido.id,
            venda_id: pedido.venda.id,
            nome_cliente: pedido.venda.cliente_nome,
            telefone_cliente: pedido.venda.cliente_telefone,
            cidade: pedido.venda.cliente_cidade || '',
            estado: pedido.venda.cliente_estado || '',
            data_instalacao: dataFormatada,
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
        const instalacao = instalacoes.find((i) => i.id === instalacaoId);
        if (!instalacao) return;

        const dataAtual = new Date(instalacao.data);
        if (isSameDay(dataAtual, novaData)) return;

        await onUpdateInstalacao({
          id: instalacaoId,
          data: {
            data: format(novaData, "yyyy-MM-dd"),
          },
        });
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar operação");
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  return (
    <>
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4 w-full">
        {/* Navegação da semana */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" size="icon" onClick={onPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <p className="text-sm font-medium">
              {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} -{" "}
              {format(addDays(weekStart, 6), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <Button variant="link" size="sm" onClick={onToday} className="h-auto p-0 text-xs">
              Ir para hoje
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-4">
          {/* Headers dos dias */}
          {weekDays.map((day, index) => (
            <div key={`header-${index}`} className="text-center pb-2 border-b">
              <p className="text-sm font-semibold">{weekDayNames[index]}</p>
              <p className="text-xs text-muted-foreground">
                {format(day, "dd/MM")}
              </p>
            </div>
          ))}

          {/* Dias com instalações */}
          {weekDays.map((day) => (
            <DroppableDaySimple
              key={day.toISOString()}
              date={day}
              instalacoes={instalacoes}
              onDayClick={handleDayClick}
              onEdit={onEdit}
              onDelete={onDelete}
              onPedidoDropped={onPedidoDropped}
            />
          ))}
        </div>

        {/* Overlay de drag */}
        <DragOverlay>
          {activeInstalacao ? (
            <div className="opacity-80">
              <DraggableInstalacao
                instalacao={activeInstalacao}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
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
