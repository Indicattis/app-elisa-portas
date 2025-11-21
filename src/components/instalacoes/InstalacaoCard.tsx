import { Instalacao } from "@/types/instalacao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Clock, MapPin, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InstalacaoCardProps {
  instalacao: Instalacao;
  onEdit: (instalacao: Instalacao) => void;
  onDelete: (id: string) => void;
}

export const InstalacaoCard = ({ instalacao, onEdit, onDelete }: InstalacaoCardProps) => {
  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-base">
              {instalacao.nome_cliente}
            </h3>
            
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{instalacao.hora}</span>
            </div>

            <div className="flex items-start gap-2 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{instalacao.cidade}, {instalacao.estado}</span>
            </div>

            <div className="flex items-start gap-2 mt-1 text-sm text-muted-foreground">
              <Package className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{instalacao.produto}</span>
            </div>

            {instalacao.descricao && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {instalacao.descricao}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(instalacao)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(instalacao.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
