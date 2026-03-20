import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Missao } from "@/hooks/useMissoes";
import { cn } from "@/lib/utils";
import { format, isPast, startOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, CalendarDays, Clock, AlertTriangle, CheckCircle2, User } from "lucide-react";
import { useState } from "react";

interface DetalhesMissaoModalProps {
  missao: Missao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleCheckbox: (params: { id: string; concluida: boolean }) => void;
  onDelete: (id: string) => void;
}

export function DetalhesMissaoModal({ missao, open, onOpenChange, onToggleCheckbox, onDelete }: DetalhesMissaoModalProps) {
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  if (!missao) return null;

  const total = missao.missao_checkboxes.length;
  const concluidas = missao.missao_checkboxes.filter(c => c.concluida).length;
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white/5 border-white/10 backdrop-blur-xl text-white max-w-lg max-h-[85vh] overflow-y-auto p-0 rounded-xl">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-base font-semibold text-white pr-6">{missao.titulo}</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-2">
            {/* Responsável */}
            <div className="flex items-center justify-between mb-3">
              {missao.responsavel ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={missao.responsavel.foto_perfil_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-400">
                      {missao.responsavel.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-white/60">{missao.responsavel.nome}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-white/30">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-xs">Sem responsável</span>
                </div>
              )}
              <span className="text-xs text-white/40 tabular-nums">{concluidas}/{total}</span>
            </div>

            {/* Progress */}
            <div className="h-1.5 rounded-full bg-white/10 mb-4 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  progresso === 100 ? "bg-emerald-500" : "bg-amber-500"
                )}
                style={{ width: `${progresso}%` }}
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-1">
              {missao.missao_checkboxes.map((cb) => {
                const prazoDate = cb.prazo ? new Date(cb.prazo + "T12:00:00") : null;
                const concluidaEmDate = cb.concluida_em ? new Date(cb.concluida_em) : null;
                const prazoVencido = prazoDate && isPast(startOfDay(prazoDate));
                const concluidaComAtraso = cb.concluida && prazoDate && concluidaEmDate && concluidaEmDate > prazoDate;
                const diasAtraso = concluidaComAtraso
                  ? differenceInDays(concluidaEmDate, prazoDate)
                  : prazoVencido && !cb.concluida && prazoDate
                    ? differenceInDays(new Date(), prazoDate)
                    : 0;

                return (
                  <div
                    key={cb.id}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                      cb.concluida ? "bg-white/[0.02]" : "bg-white/[0.04] hover:bg-white/[0.06]"
                    )}
                  >
                    <Checkbox
                      checked={cb.concluida}
                      onCheckedChange={(checked) =>
                        onToggleCheckbox({ id: cb.id, concluida: !!checked })
                      }
                      className="mt-0.5 h-4 w-4 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-xs leading-relaxed block",
                        cb.concluida ? "text-white/30 line-through" : "text-white/80"
                      )}>
                        {cb.descricao}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {prazoDate && (
                          <span className={cn(
                            "text-[10px] flex items-center gap-0.5",
                            cb.concluida ? "text-white/25" : prazoVencido ? "text-red-400" : "text-white/35"
                          )}>
                            <CalendarDays className="h-2.5 w-2.5" />
                            {format(prazoDate, "dd/MM/yyyy")}
                          </span>
                        )}
                        {cb.concluida && concluidaEmDate && (
                          <span className="text-[10px] text-emerald-400/60 flex items-center gap-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {format(concluidaEmDate, "dd/MM/yyyy")}
                          </span>
                        )}
                        {concluidaComAtraso && diasAtraso > 0 && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 bg-red-500/20 text-red-400 border-red-500/30">
                            {diasAtraso}d de atraso
                          </Badge>
                        )}
                        {!cb.concluida && prazoVencido && diasAtraso > 0 && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Atrasado {diasAtraso}d
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Excluir */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-xs h-8"
                onClick={() => setConfirmarExclusao(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Excluir missão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir missão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                onDelete(missao.id);
                setConfirmarExclusao(false);
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
