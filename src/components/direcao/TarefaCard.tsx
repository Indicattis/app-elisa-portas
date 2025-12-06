import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, CheckCircle2, Clock, RefreshCw, Eye } from "lucide-react";

export interface TarefaCalendario {
  id: string;
  descricao: string;
  status: string;
  responsavel_id: string;
  responsavel_nome: string;
  responsavel_foto: string | null;
  recorrente: boolean;
}

interface TarefaCardProps {
  tarefa: TarefaCalendario;
  onClick?: (tarefa: TarefaCalendario) => void;
  onMarcarConcluida?: (tarefa: TarefaCalendario) => void;
  dragListeners?: any;
}

export const TarefaCard = ({
  tarefa,
  onClick,
  onMarcarConcluida,
  dragListeners,
}: TarefaCardProps) => {
  const isConcluida = tarefa.status === 'concluida';
  
  const getStatusColor = () => {
    if (isConcluida) {
      return 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30';
    }
    return 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20';
  };

  return (
    <Card 
      className={`relative h-[35px] p-2 border transition-all duration-200 cursor-pointer ${getStatusColor()}`}
      onClick={() => onClick?.(tarefa)}
    >
      <div className="flex items-center justify-between gap-2 h-[19px]">
        <div 
          className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing" 
          {...dragListeners}
        >
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage src={tarefa.responsavel_foto || undefined} />
            <AvatarFallback className="text-[8px]">
              {tarefa.responsavel_nome.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h4 className={`font-medium text-xs truncate ${isConcluida ? 'text-green-700 dark:text-green-400' : ''}`}>
            {tarefa.descricao}
          </h4>
          
          {tarefa.recorrente && (
            <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Badge 
            variant={isConcluida ? "default" : "destructive"}
            className={`text-[9px] px-1 py-0 h-4 ${isConcluida ? 'bg-green-500 hover:bg-green-600' : ''}`}
          >
            {isConcluida ? (
              <CheckCircle2 className="h-2.5 w-2.5" />
            ) : (
              <Clock className="h-2.5 w-2.5" />
            )}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-0.5 hover:bg-accent rounded-md transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.(tarefa);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              {!isConcluida && onMarcarConcluida && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarcarConcluida(tarefa);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como concluída
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};
