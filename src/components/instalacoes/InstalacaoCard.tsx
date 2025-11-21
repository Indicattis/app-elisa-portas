import { Instalacao } from "@/types/instalacao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Package, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InstalacaoCardProps {
  instalacao: Instalacao;
  onEdit: (instalacao: Instalacao) => void;
  onDelete: (id: string) => void;
}

export const InstalacaoCard = ({ instalacao, onEdit, onDelete }: InstalacaoCardProps) => {
  return (
    <Card className="w-full h-[60px] hover:shadow-md transition-shadow">
      <CardContent className="p-2 h-full">
        <div className="flex items-center justify-between gap-2 h-full">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {/* Nome do Cliente */}
            <span className="font-medium text-xs text-foreground truncate flex-shrink-0 max-w-[100px]">
              {instalacao.nome_cliente}
            </span>
            
            {/* Equipe Badge */}
            {instalacao.equipe && (
              <Badge 
                variant="secondary" 
                className="text-[10px] gap-1 flex-shrink-0 px-1.5 py-0.5"
                style={
                  instalacao.equipe.cor
                    ? {
                        backgroundColor: `${instalacao.equipe.cor}20`,
                        borderColor: instalacao.equipe.cor,
                        color: instalacao.equipe.cor,
                      }
                    : {}
                }
              >
                <Users className="h-2.5 w-2.5" />
                {instalacao.equipe.nome}
              </Badge>
            )}

            {/* Cidade */}
            <span className="text-xs text-muted-foreground truncate flex-shrink min-w-0">
              {instalacao.cidade}
            </span>

            {/* Produto */}
            <div className="flex items-center gap-1 flex-shrink min-w-0">
              <Package className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {instalacao.produto}
              </span>
            </div>
          </div>

          {/* Menu de Ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                <MoreVertical className="h-3.5 w-3.5" />
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
