import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { OrdemCarregamentoCard } from "./OrdemCarregamentoCard";

interface DraggableOrdemCarregamentoProps {
  ordem: OrdemCarregamento;
  onClick?: (ordem: OrdemCarregamento) => void;
}

export const DraggableOrdemCarregamento = ({
  ordem,
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
    <div ref={setNodeRef} style={style} {...attributes} className="animate-scale-in">
      <OrdemCarregamentoCard
        ordem={ordem}
        onClick={onClick}
        dragListeners={listeners}
      />
    </div>
  );
};
