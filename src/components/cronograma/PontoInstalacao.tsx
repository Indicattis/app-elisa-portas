import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InstalacaoCronograma } from "@/hooks/useInstalacoesCronograma";

interface PontoInstalacaoProps {
  instalacao: InstalacaoCronograma;
  cor: string;
  onDragStart: (item: { id: string; equipId: string; cidade: string }) => void;
  onDragEnd: () => void;
  onEdit: () => void;
}

export function PontoInstalacao({ 
  instalacao, 
  cor, 
  onDragStart, 
  onDragEnd,
  onEdit 
}: PontoInstalacaoProps) {
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart({
      id: instalacao.id,
      equipId: instalacao.responsavel_instalacao_id || '',
      cidade: instalacao.cidade
    });
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'instalacao': return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'entrega': return 'bg-green-500/10 text-green-700 border-green-300';
      case 'correcao': return 'bg-orange-500/10 text-orange-700 border-orange-300';
      case 'carregamento_agendado': return 'bg-purple-500/10 text-purple-700 border-purple-300';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente_producao': return 'bg-yellow-500/10 text-yellow-700 border-yellow-300';
      case 'pronta_fabrica': return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'finalizada': return 'bg-green-500/10 text-green-700 border-green-300';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-300';
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'instalacao': return 'Instalação';
      case 'entrega': return 'Entrega';
      case 'correcao': return 'Correção';
      case 'carregamento_agendado': return 'Carregamento';
      default: return categoria;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente_producao': return 'Pendente';
      case 'pronta_fabrica': return 'Pronta';
      case 'finalizada': return 'Finalizada';
      default: return status;
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className="group relative bg-card border border-border rounded-lg p-3 mb-2 cursor-move hover:shadow-md transition-all"
      style={{ borderLeftColor: cor, borderLeftWidth: '4px' }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit();
      }}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-sm truncate flex-1">
            {instalacao.nome_cliente}
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{instalacao.cidade}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={`text-xs ${getCategoriaColor(instalacao.categoria)}`}>
            {getCategoriaLabel(instalacao.categoria)}
          </Badge>
          <Badge variant="outline" className={`text-xs ${getStatusColor(instalacao.status)}`}>
            {getStatusLabel(instalacao.status)}
          </Badge>
        </div>

        {instalacao.tamanho && (
          <div className="text-xs text-muted-foreground">
            {instalacao.tamanho}
          </div>
        )}
      </div>
    </div>
  );
}