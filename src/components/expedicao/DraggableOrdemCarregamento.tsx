import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { OrdemCarregamentoCard } from "./OrdemCarregamentoCard";

interface DraggableOrdemCarregamentoProps {
  ordem: OrdemCarregamento;
  onEdit: (ordem: OrdemCarregamento) => void;
  onRemoverDoCalendario: (id: string) => void;
  onClick?: (ordem: OrdemCarregamento) => void;
}

export const DraggableOrdemCarregamento = ({
  ordem,
  onEdit,
  onRemoverDoCalendario,
  onClick,
}: DraggableOrdemCarregamentoProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ordem.id,
    data: {
      ordem,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <OrdemCarregamentoCard
        ordem={ordem}
        onEdit={onEdit}
        onRemoverDoCalendario={onRemoverDoCalendario}
        onClick={onClick}
        dragListeners={listeners}
      />
    </div>
  );
};
