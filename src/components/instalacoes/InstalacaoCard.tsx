import { Instalacao } from "@/types/instalacao";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InstalacaoCardProps {
  instalacao: Instalacao;
  onEdit: (instalacao: Instalacao) => void;
  onDelete: (id: string) => void;
}

export const InstalacaoCard = ({ instalacao, onEdit, onDelete }: InstalacaoCardProps) => {
  const backgroundColor = instalacao.equipe?.cor 
    ? `${instalacao.equipe.cor}15` 
    : 'transparent';
  
  const borderColor = instalacao.equipe?.cor || 'hsl(var(--border))';

  return (
    <Card 
      className="w-full h-[60px] hover:shadow-md transition-shadow border"
      style={{ 
        backgroundColor,
        borderColor,
      }}
    >
      <CardContent className="p-2 h-full">
        <div className="flex items-center justify-between gap-2 h-full">
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            {/* Nome do Cliente */}
            <span className="font-medium text-xs text-foreground truncate">
              {instalacao.nome_cliente}
            </span>
            
            {/* Produtos Label */}
            <div className="flex items-center gap-1">
              <Package className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground truncate">
                {instalacao.produto}
              </span>
            </div>

            {/* Cidade */}
            <span className="text-[10px] text-muted-foreground truncate">
              {instalacao.cidade}
            </span>
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
