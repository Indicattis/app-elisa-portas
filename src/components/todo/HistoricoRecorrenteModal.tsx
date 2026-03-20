import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TarefaTemplate } from "@/hooks/useTarefas";
import { CheckCircle2, Circle, Clock, Calendar, User, Trash2, AlertCircle } from "lucide-react";
import { format, isPast, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

const DIAS_SEMANA_NOMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface HistoricoRecorrenteModalProps {
  template: TarefaTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

interface TarefaHistorico {
  id: string;
  descricao: string;
  status: string;
  data_referencia: string | null;
  created_at: string;
  responsavel?: { nome: string; foto_perfil_url?: string } | null;
}

export function HistoricoRecorrenteModal({ template, open, onOpenChange, onDelete }: HistoricoRecorrenteModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: historico = [], isLoading } = useQuery({
    queryKey: ['historico-template', template?.id],
    enabled: !!template && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefas')
        .select('id, descricao, status, data_referencia, created_at')
        .eq('template_id', template!.id)
        .order('data_referencia', { ascending: false })
        .limit(7);

      if (error) throw error;
      return (data || []) as TarefaHistorico[];
    },
  });

  if (!template) return null;

  const diasLabel = template.dias_semana?.length
    ? template.dias_semana.sort((a, b) => a - b).map(d => DIAS_SEMANA_NOMES[d]).join(", ")
    : "—";

  const getStatusInfo = (tarefa: TarefaHistorico) => {
    if (tarefa.status === 'concluida') {
      return { label: "Concluída", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
    }
    if (tarefa.data_referencia && isPast(startOfDay(new Date(tarefa.data_referencia + 'T12:00:00')))) {
      return { label: "Não concluída", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };
    }
    return { label: "Pendente", icon: Circle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-[#0a1628]/95 backdrop-blur-xl border-white/10 text-white p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-white/10">
            <DialogTitle className="text-base font-semibold text-white">
              {template.descricao}
            </DialogTitle>
          </DialogHeader>

          {/* Template info */}
          <div className="px-4 py-3 space-y-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={template.responsavel?.foto_perfil_url || undefined} />
                <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-400">
                  {template.responsavel?.nome?.charAt(0)?.toUpperCase() || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-white/70">{template.responsavel?.nome || "Sem responsável"}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {diasLabel}
              </span>
              {template.hora_criacao && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {template.hora_criacao.slice(0, 5)}
                </span>
              )}
            </div>
          </div>

          {/* Histórico */}
          <div className="px-4 py-3 space-y-2 max-h-[320px] overflow-y-auto">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Últimas 7 tarefas</p>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
              </div>
            ) : historico.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-6">Nenhuma tarefa gerada ainda</p>
            ) : (
              historico.map((tarefa) => {
                const status = getStatusInfo(tarefa);
                const StatusIcon = status.icon;
                return (
                  <div
                    key={tarefa.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border ${status.bg} transition-colors`}
                  >
                    <StatusIcon className={`h-4 w-4 flex-shrink-0 ${status.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60">
                        {tarefa.data_referencia
                          ? format(new Date(tarefa.data_referencia + 'T12:00:00'), "EEEE, dd/MM/yyyy", { locale: ptBR })
                          : format(new Date(tarefa.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 border-0 ${status.color} bg-transparent`}
                    >
                      {status.label}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="p-4 pt-2 border-t border-white/5">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir tarefa recorrente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa recorrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as tarefas futuras desta recorrência serão excluídas. Tarefas já concluídas serão mantidas no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(template.id);
                setConfirmDelete(false);
                onOpenChange(false);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
