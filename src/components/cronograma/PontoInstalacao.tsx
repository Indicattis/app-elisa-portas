import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PontoInstalacao {
  id: string;
  equipe_id: string;
  cidade: string;
  dia_semana: number;
  observacoes?: string;
}

interface PontoInstalacaoProps {
  ponto: PontoInstalacao;
  cor: string;
  onDragStart: (item: { id: string; equipId: string; cidade: string }) => void;
  onDragEnd: () => void;
  onDelete: () => void;
}

export function PontoInstalacao({ 
  ponto, 
  cor, 
  onDragStart, 
  onDragEnd, 
  onDelete 
}: PontoInstalacaoProps) {
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart({
      id: ponto.id,
      equipId: ponto.equipe_id,
      cidade: ponto.cidade
    });
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className="group relative bg-card border border-border rounded-md p-2 mb-2 cursor-move hover:shadow-sm transition-shadow"
      style={{ borderLeftColor: cor, borderLeftWidth: '3px' }}
    >
      <div className="text-sm font-medium">{ponto.cidade}</div>
      {ponto.observacoes && (
        <div className="text-xs text-muted-foreground mt-1">
          {ponto.observacoes}
        </div>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}