import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pronto: {
    label: 'Pronto',
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600'
  },
  pendente_conferencia: {
    label: 'Pendente Conferência',
    variant: 'default' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-black'
  },
  pendente_oleo: {
    label: 'Pendente Óleo',
    variant: 'default' as const,
    className: 'bg-orange-500 hover:bg-orange-600'
  },
  atencao: {
    label: 'Atenção',
    variant: 'default' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600'
  },
  critico: {
    label: 'Crítico',
    variant: 'destructive' as const,
    className: ''
  },
  mecanico: {
    label: 'Mecânico',
    variant: 'default' as const,
    className: 'bg-purple-500 hover:bg-purple-600'
  },
  em_uso: {
    label: 'Em Uso',
    variant: 'default' as const,
    className: 'bg-blue-500 hover:bg-blue-600'
  }
};

export type StatusVeiculo = 'pronto' | 'pendente_conferencia' | 'pendente_oleo' | 'atencao' | 'critico' | 'mecanico' | 'em_uso';

interface StatusBadgeProps {
  status: StatusVeiculo;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pronto;
  
  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
}
