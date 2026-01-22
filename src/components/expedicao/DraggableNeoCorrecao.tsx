import { useDraggable } from "@dnd-kit/core";
import { NeoCorrecao } from "@/types/neoCorrecao";
import { NeoCorrecaoCard } from "./NeoCorrecaoCard";

interface DraggableNeoCorrecaoProps {
  neoCorrecao: NeoCorrecao;
  onClick?: (neoCorrecao: NeoCorrecao) => void;
  onConcluir?: (id: string) => void;
  onRemover?: (id: string) => void;
  disableDrag?: boolean;
}

export const DraggableNeoCorrecao = ({
  neoCorrecao,
  onClick,
  onConcluir,
  onRemover,
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

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <NeoCorrecaoCard
        neoCorrecao={neoCorrecao}
        onClick={onClick}
        onConcluir={onConcluir}
        onRemover={onRemover}
        dragListeners={disableDrag ? undefined : listeners}
      />
    </div>
  );
};
