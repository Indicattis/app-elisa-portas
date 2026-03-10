import { Badge } from "@/components/ui/badge";

const statusConfig = {
  rodando: {
    label: 'Rodando',
    className: 'bg-green-500 hover:bg-green-600 text-white'
  },
  mecanico: {
    label: 'Mecânico',
    className: 'bg-gray-500 hover:bg-gray-600 text-white'
  },
  parado: {
    label: 'Parado',
    className: 'bg-red-500 hover:bg-red-600 text-white'
  }
};

export type StatusVeiculo = 'rodando' | 'mecanico' | 'parado';

interface StatusBadgeProps {
  status: StatusVeiculo;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.rodando;
  
  return (
    <Badge 
      variant="default"
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
}
