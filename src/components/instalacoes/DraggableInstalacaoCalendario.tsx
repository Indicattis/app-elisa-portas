import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { InstalacaoCard } from "./InstalacaoCard";

interface DraggableInstalacaoCalendarioProps {
  instalacao: InstalacaoCalendario;
  onClick: () => void;
  compact?: boolean;
}

export const DraggableInstalacaoCalendario = ({
  instalacao,
  onClick,
  compact,
}: DraggableInstalacaoCalendarioProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: instalacao.id,
    data: {
      instalacao,
      type: 'instalacao',
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
        onClick={onClick}
        compact={compact}
      />
    </div>
  );
};
