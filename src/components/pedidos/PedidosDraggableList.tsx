import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PedidoCard } from "./PedidoCard";
import type { EtapaPedido, DirecaoPrioridade, PrioridadeUpdate } from "@/types/pedidoEtapa";

interface PedidosDraggableListProps {
  pedidos: any[];
  etapa: EtapaPedido;
  isAberto: boolean;
  viewMode?: 'grid' | 'list';
  pedidoSelecionado?: any | null;
  onSelecionarPedido?: (pedido: any) => void;
  onMoverEtapa: (pedidoId: string, skipCheckboxValidation?: boolean, onProgress?: (processoId: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => void) => void;
  onRetrocederEtapa?: (pedidoId: string, etapaDestino: EtapaPedido, motivo: string) => void;
  onReorganizar: (pedidos: PrioridadeUpdate[]) => void;
  onMoverPrioridade: (pedidoId: string, direcao: DirecaoPrioridade) => void;
}

interface SortableItemProps {
  id: string;
  pedido: any;
  posicao: number;
  total: number;
  isAberto: boolean;
  viewMode?: 'grid' | 'list';
  isSelecionado?: boolean;
  onSelecionarPedido?: (pedido: any) => void;
  onMoverEtapa: (pedidoId: string, skipCheckboxValidation?: boolean, onProgress?: (processoId: string, status: 'pending' | 'in_progress' | 'completed' | 'error') => void) => void;
  onRetrocederEtapa?: (pedidoId: string, etapaDestino: EtapaPedido, motivo: string) => void;
  onMoverPrioridade: (pedidoId: string, direcao: DirecaoPrioridade) => void;
}

function SortableItem({
  id,
  pedido,
  posicao,
  total,
  isAberto,
  viewMode = 'grid',
  isSelecionado = false,
  onSelecionarPedido,
  onMoverEtapa,
  onRetrocederEtapa,
  onMoverPrioridade,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PedidoCard
        pedido={pedido}
        isAberto={isAberto}
        viewMode={viewMode}
        isSelecionado={isSelecionado}
        onSelecionarPedido={onSelecionarPedido}
        onMoverEtapa={onMoverEtapa}
        onRetrocederEtapa={onRetrocederEtapa}
        onMoverPrioridade={onMoverPrioridade}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        posicao={posicao}
        total={total}
      />
    </div>
  );
}

export function PedidosDraggableList({
  pedidos,
  etapa,
  isAberto,
  viewMode = 'grid',
  pedidoSelecionado,
  onSelecionarPedido,
  onMoverEtapa,
  onRetrocederEtapa,
  onReorganizar,
  onMoverPrioridade,
}: PedidosDraggableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = pedidos.findIndex((p) => p.id === active.id);
    const newIndex = pedidos.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Criar novo array com a ordem atualizada
    const newOrder = [...pedidos];
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    // Calcular novas prioridades (usar incrementos de 10)
    const updates = newOrder.map((pedido, index) => ({
      id: pedido.id,
      prioridade: (newOrder.length - index) * 10,
    }));

    onReorganizar(updates);
  };

  const activePedido = activeId
    ? pedidos.find((p) => p.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={pedidos.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={
          viewMode === 'list' 
            ? "space-y-2" 
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        }>
          {pedidos.map((pedido, index) => (
            <SortableItem
              key={pedido.id}
              id={pedido.id}
              pedido={pedido}
              posicao={index + 1}
              total={pedidos.length}
              isAberto={isAberto}
              viewMode={viewMode}
              isSelecionado={pedidoSelecionado?.id === pedido.id}
              onSelecionarPedido={onSelecionarPedido}
              onMoverEtapa={onMoverEtapa}
              onRetrocederEtapa={onRetrocederEtapa}
              onMoverPrioridade={onMoverPrioridade}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activePedido ? (
          <div className="opacity-80">
            <PedidoCard
              pedido={activePedido}
              isAberto={isAberto}
              onMoverEtapa={onMoverEtapa}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}