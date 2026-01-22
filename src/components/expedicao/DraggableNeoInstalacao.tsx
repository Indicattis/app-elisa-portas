import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { NeoInstalacaoCard } from "./NeoInstalacaoCard";

interface DraggableNeoInstalacaoProps {
  neoInstalacao: NeoInstalacao;
  onClick?: (neoInstalacao: NeoInstalacao) => void;
  onConcluir?: (id: string) => void;
  onRemover?: (id: string) => void;
  onOpenDetails?: (neoInstalacao: NeoInstalacao) => void;
  disableDrag?: boolean;
}

export const DraggableNeoInstalacao = ({
  neoInstalacao,
  onClick,
  onConcluir,
  onRemover,
  onOpenDetails,
  disableDrag = false,
}: DraggableNeoInstalacaoProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `neo-${neoInstalacao.id}`,
    data: {
      neoInstalacao,
      type: 'neo_instalacao',
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
      <NeoInstalacaoCard
        neoInstalacao={neoInstalacao}
        onClick={onClick}
        onConcluir={onConcluir}
        onRemover={onRemover}
        onOpenDetails={onOpenDetails}
        dragListeners={disableDrag ? undefined : listeners}
      />
    </div>
  );
};
