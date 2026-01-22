import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { NeoCorrecao } from "@/types/neoCorrecao";
import { NeoCorrecaoCard } from "./NeoCorrecaoCard";

interface DraggableNeoCorrecaoProps {
  neoCorrecao: NeoCorrecao;
  onClick?: (neoCorrecao: NeoCorrecao) => void;
  onConcluir?: (id: string) => void;
  onRemover?: (id: string) => void;
  onExcluir?: (id: string) => void;
  onOpenDetails?: (neoCorrecao: NeoCorrecao) => void;
  disableDrag?: boolean;
}

export const DraggableNeoCorrecao = ({
  neoCorrecao,
  onClick,
  onConcluir,
  onRemover,
  onExcluir,
  onOpenDetails,
  disableDrag = false,
}: DraggableNeoCorrecaoProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `neo-correcao-${neoCorrecao.id}`,
    data: {
      type: 'neo_correcao',
      neoCorrecao,
    },
    disabled: disableDrag,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: disableDrag ? "pointer" : isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="animate-scale-in">
      <NeoCorrecaoCard
        neoCorrecao={neoCorrecao}
        onClick={onClick}
        onConcluir={onConcluir}
        onRemover={onRemover}
        onExcluir={onExcluir}
        onOpenDetails={onOpenDetails}
        dragListeners={disableDrag ? undefined : listeners}
      />
    </div>
  );
};
