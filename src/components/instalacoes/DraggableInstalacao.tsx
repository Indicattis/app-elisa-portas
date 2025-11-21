import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Instalacao } from "@/types/instalacao";
import { InstalacaoCard } from "./InstalacaoCard";

interface DraggableInstalacaoProps {
  instalacao: Instalacao;
  onEdit: (instalacao: Instalacao) => void;
  onDelete: (id: string) => void;
}

export const DraggableInstalacao = ({
  instalacao,
  onEdit,
  onDelete,
}: DraggableInstalacaoProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: instalacao.id,
    data: {
      instalacao,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <InstalacaoCard
        instalacao={instalacao}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};
