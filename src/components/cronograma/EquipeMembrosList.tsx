import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { EquipeMembro } from "@/hooks/useEquipesMembros";

interface EquipeMembrosListProps {
  membros: EquipeMembro[];
  compact?: boolean;
}

export function EquipeMembrosList({ membros, compact = false }: EquipeMembrosListProps) {
  if (membros.length === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Users className="h-3 w-3" />
        <span className="text-xs">Sem membros</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex -space-x-2">
          {membros.slice(0, 3).map((membro) => (
            <Avatar key={membro.id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={membro.user?.foto_perfil_url} />
              <AvatarFallback className="text-xs">
                {membro.user?.nome?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {membros.length > 3 && (
          <Badge variant="secondary" className="text-xs h-6 px-2">
            +{membros.length - 3}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {membros.map((membro) => (
        <div key={membro.id} className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={membro.user?.foto_perfil_url} />
            <AvatarFallback className="text-xs">
              {membro.user?.nome?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {membro.user?.nome || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {membro.user?.email}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
