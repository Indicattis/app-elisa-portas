import { Badge } from '@/components/ui/badge';
import { FileText, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrigemBadgesProps {
  pedidoId?: string | null;
  pedidoNumero?: string | null;
  vendaId?: string | null;
  size?: 'sm' | 'default';
  orientation?: 'horizontal' | 'vertical';
}

export function OrigemBadges({
  pedidoId,
  pedidoNumero,
  vendaId,
  size = 'default',
  orientation = 'horizontal',
}: OrigemBadgesProps) {
  const navigate = useNavigate();

  if (!pedidoId && !vendaId) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const containerClass = orientation === 'horizontal' ? 'flex gap-2' : 'flex flex-col gap-1';
  const badgeClass = size === 'sm' ? 'text-xs h-5' : '';

  return (
    <div className={containerClass}>
      {pedidoId && (
        <Badge
          variant="outline"
          className={`cursor-pointer hover:bg-green-500/10 gap-1 ${badgeClass}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dashboard/pedido/${pedidoId}/edit`);
          }}
          title="Clique para visualizar o pedido"
        >
          <Package className="h-3 w-3" />
          {pedidoNumero || 'Ver Pedido'}
        </Badge>
      )}
      
      {vendaId && (
        <Badge
          variant="outline"
          className={`cursor-pointer hover:bg-blue-500/10 gap-1 ${badgeClass}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dashboard/vendas/${vendaId}/view`);
          }}
          title="Clique para visualizar a venda"
        >
          <FileText className="h-3 w-3" />
          Ver Venda
        </Badge>
      )}
    </div>
  );
}
