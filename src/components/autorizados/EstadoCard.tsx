import { MapPin, Users, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Estado } from '@/hooks/useEstadosCidades';

interface EstadoCardProps {
  estado: Estado;
  onClick: () => void;
  isSelected: boolean;
}

export function EstadoCard({ estado, onClick, isSelected }: EstadoCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all bg-primary/5 border-primary/10 hover:bg-primary/10",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{estado.sigla}</h3>
            <p className="text-sm text-white/60">{estado.nome}</p>
          </div>
          <MapPin className="h-6 w-6 text-primary/50" />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-white/70">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{estado.totalAutorizados} autorizados</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span>{estado.totalCidades} cidades</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
