import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Clock, RefreshCw, ArrowRight } from "lucide-react";
import { TarefaCalendario } from "./TarefaCard";
import { useNavigate } from "react-router-dom";

interface TarefaDetailsSheetProps {
  tarefa: TarefaCalendario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarcarConcluida?: (tarefa: TarefaCalendario) => void;
}

export const TarefaDetailsSheet = ({
  tarefa,
  open,
  onOpenChange,
  onMarcarConcluida,
}: TarefaDetailsSheetProps) => {
  const navigate = useNavigate();
  const isConcluida = tarefa?.status === 'concluida';

  if (!tarefa) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isConcluida ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Clock className="h-5 w-5 text-amber-500" />
            )}
            Detalhes da Tarefa
          </SheetTitle>
          <SheetDescription>
            Informações completas sobre a tarefa
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Responsável */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={tarefa.responsavel_foto || undefined} />
              <AvatarFallback className="text-lg">
                {tarefa.responsavel_nome.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Responsável</p>
              <p className="font-medium">{tarefa.responsavel_nome}</p>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Descrição</p>
            <p className={`text-base ${isConcluida ? 'line-through opacity-60' : ''}`}>
              {tarefa.descricao}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <Badge 
              variant={isConcluida ? "default" : "destructive"}
              className="text-sm py-1"
            >
              {isConcluida ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Concluída
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Pendente
                </>
              )}
            </Badge>

            {tarefa.recorrente && (
              <Badge variant="secondary" className="text-sm py-1">
                <RefreshCw className="h-4 w-4 mr-1" />
                Recorrente
              </Badge>
            )}
          </div>

          {/* Ações */}
          <div className="space-y-2 pt-4 border-t">
            {!isConcluida && onMarcarConcluida && (
              <Button
                className="w-full"
                onClick={() => {
                  onMarcarConcluida(tarefa);
                  onOpenChange(false);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Concluída
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard/direcao/checklist')}
            >
              Ver no Checklist
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
