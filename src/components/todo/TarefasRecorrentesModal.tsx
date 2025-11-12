import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Repeat, Calendar, User, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface TarefaTemplate {
  id: string;
  descricao: string;
  tipo_recorrencia: string;
  dias_semana?: number[] | null;
  data_proxima_criacao: string;
  ativa: boolean;
  setor: string | null;
  responsavel?: {
    nome: string;
    email: string;
  };
}

interface TarefasRecorrentesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TarefaTemplate[];
  onToggle: (id: string, ativa: boolean) => void;
  onDelete: (id: string) => void;
  podeGerenciar: boolean;
}

export function TarefasRecorrentesModal({
  open,
  onOpenChange,
  templates,
  onToggle,
  onDelete,
  podeGerenciar
}: TarefasRecorrentesModalProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getDiasSemanaNomes = (dias: number[]) => {
    const nomes = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const diasNomes = dias.sort((a, b) => a - b).map(d => nomes[d]);
    
    if (diasNomes.length === 7) return "Todos os dias";
    if (diasNomes.length === 1) return `Toda ${diasNomes[0]}`;
    if (diasNomes.length === 2) return `Toda ${diasNomes[0]} e ${diasNomes[1]}`;
    
    const ultimos = diasNomes.slice(-1)[0];
    const primeiros = diasNomes.slice(0, -1).join(", ");
    return `Toda ${primeiros} e ${ultimos}`;
  };

  const getTipoLabel = (template: TarefaTemplate) => {
    // New format: day of week based
    if (template.dias_semana && template.dias_semana.length > 0) {
      return getDiasSemanaNomes(template.dias_semana);
    }
    
    // Old format: interval based
    const labels: Record<string, string> = {
      'todos_os_dias': 'Diária',
      'primeiro_dia_mes': '1° dia do mês',
      'cada_7_dias': 'Semanal (7 dias)',
      'cada_15_dias': 'Quinzenal (15 dias)',
      'cada_30_dias': 'Mensal (30 dias)',
      'semanal': 'Semanal'
    };
    return labels[template.tipo_recorrencia] || template.tipo_recorrencia;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Tarefas Recorrentes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma tarefa recorrente configurada
              </p>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className={!template.ativa ? 'opacity-50' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{template.descricao}</p>
                          <Badge variant={template.ativa ? "default" : "secondary"}>
                            <Repeat className="h-3 w-3 mr-1" />
                            {getTipoLabel(template)}
                          </Badge>
                          {!template.ativa && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Pausada
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {template.responsavel?.nome || 'Responsável não encontrado'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Próxima: {format(new Date(template.data_proxima_criacao), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>

                        {template.setor && (
                          <Badge variant="outline" className="text-xs">
                            Setor: {template.setor}
                          </Badge>
                        )}
                      </div>

                      {podeGerenciar && (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.ativa}
                            onCheckedChange={(checked) => onToggle(template.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(template.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar tarefa recorrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa recorrente será deletada permanentemente.
              Tarefas já criadas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
