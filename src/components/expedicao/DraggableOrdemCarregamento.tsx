import { useDraggable } from "@dnd-kit/core";

import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { OrdemCarregamentoCard } from "./OrdemCarregamentoCard";

interface DraggableOrdemCarregamentoProps {
  ordem: OrdemCarregamento;
  onClick?: (ordem: OrdemCarregamento) => void;
  onEdit?: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario?: (id: string) => void;
  disableDrag?: boolean;
}

export const DraggableOrdemCarregamento = ({
  ordem,
  onClick,
  onEdit,
  onRemoverDoCalendario,
  disableDrag = false,
}: DraggableOrdemCarregamentoProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ordem.id,
    data: {
      ordem,
    },
    disabled: disableDrag,
  });

  const style = {
    opacity: isDragging ? 0.3 : 1,
    cursor: disableDrag ? "pointer" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="animate-scale-in">
      <OrdemCarregamentoCard
        ordem={ordem}
        onClick={onClick}
        onEdit={onEdit}
        onRemoverDoCalendario={onRemoverDoCalendario}
        dragListeners={disableDrag ? undefined : listeners}
      />
    </div>
  );
};
