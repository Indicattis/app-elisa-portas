import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Missao, MissaoCheckbox } from "@/hooks/useMissoes";
import { cn } from "@/lib/utils";
import { format, isPast, startOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, CalendarDays, Clock, AlertTriangle, CheckCircle2, User, Pencil, Check, GripVertical, X } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

interface DetalhesMissaoModalProps {
  missao: Missao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleCheckbox: (params: { id: string; concluida: boolean }) => void;
  onDelete: (id: string) => void;
  onEditarCheckbox?: (params: { id: string; descricao: string }) => void;
  onReordenarCheckboxes?: (items: { id: string; ordem: number }[]) => void;
  onDeletarCheckbox?: (id: string) => void;
  onEditarPrazoCheckbox?: (params: { id: string; prazo: string | null }) => void;
}

// Helper for prazo display
function PrazoInfo({ cb }: { cb: MissaoCheckbox }) {
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
  );
}

// View-only item (no useSortable)
function ViewCheckboxItem({
  cb,
  onToggleCheckbox,
}: {
  cb: MissaoCheckbox;
  onToggleCheckbox: (params: { id: string; concluida: boolean }) => void;
}) {
  return (
    <div className={cn(
      "flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors",
      cb.concluida ? "bg-white/[0.02]" : "bg-white/[0.04] hover:bg-white/[0.06]"
    )}>
      <Checkbox
        checked={cb.concluida}
        onCheckedChange={(checked) => onToggleCheckbox({ id: cb.id, concluida: !!checked })}
        className="mt-0.5 h-4 w-4 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
      />
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-xs leading-relaxed block",
          cb.concluida ? "text-white/30 line-through" : "text-white/80"
        )}>
          {cb.descricao}
        </span>
        <PrazoInfo cb={cb} />
      </div>
    </div>
  );
}

// Sortable edit item (uses useSortable, must be inside DndContext)
function SortableEditItem({
  cb,
  onSaveDescricao,
  onDeleteItem,
  onEditarPrazo,
}: {
  cb: MissaoCheckbox;
  onSaveDescricao: (id: string, descricao: string) => void;
  onDeleteItem: (id: string) => void;
  onEditarPrazo: (id: string, prazo: string | null) => void;
}) {
  const [localDescricao, setLocalDescricao] = useState(cb.descricao);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cb.id });

  // Sync local state when server data changes (e.g. after save)
  useEffect(() => {
    setLocalDescricao(cb.descricao);
  }, [cb.descricao]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  const handleBlur = () => {
    const trimmed = localDescricao.trim();
    if (trimmed && trimmed !== cb.descricao) {
      onSaveDescricao(cb.id, trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const prazoDate = cb.prazo ? new Date(cb.prazo + "T12:00:00") : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-lg px-2.5 py-2 bg-white/[0.06]"
    >
      <button
        className="mt-1.5 cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60 touch-none shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={localDescricao}
        onChange={(e) => setLocalDescricao(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPointerDown={(e) => e.stopPropagation()}
        className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1 min-w-0"
      />
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              "mt-0.5 shrink-0 transition-colors",
              prazoDate ? "text-amber-400/70 hover:text-amber-400" : "text-white/20 hover:text-white/50"
            )}
            title={prazoDate ? format(prazoDate, "dd/MM/yyyy") : "Definir prazo"}
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end" side="bottom">
          <Calendar
            mode="single"
            selected={prazoDate || undefined}
            onSelect={(date) => {
              const prazo = date ? format(date, "yyyy-MM-dd") : null;
              onEditarPrazo(cb.id, prazo);
              setCalendarOpen(false);
            }}
            locale={ptBR}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <button
        className="mt-0.5 shrink-0 text-white/20 hover:text-red-400 transition-colors"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDeleteItem(cb.id)}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function DetalhesMissaoModal({ missao, open, onOpenChange, onToggleCheckbox, onDelete, onEditarCheckbox, onReordenarCheckboxes, onDeletarCheckbox, onEditarPrazoCheckbox }: DetalhesMissaoModalProps) {
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [editando, setEditando] = useState(false);
  const [localCheckboxes, setLocalCheckboxes] = useState<MissaoCheckbox[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Sync localCheckboxes with server data while editing (for deletes/prazo changes)
  useEffect(() => {
    if (editando && missao) {
      setLocalCheckboxes(prev => {
        const serverIds = new Set(missao.missao_checkboxes.map(cb => cb.id));
        // Remove items deleted on server or locally, update prazo/concluida from server, keep local ordem
        const updated = prev
          .filter(cb => serverIds.has(cb.id) && !deletedIds.has(cb.id))
          .map(cb => {
            const serverCb = missao.missao_checkboxes.find(s => s.id === cb.id);
            if (!serverCb) return cb;
            return { ...cb, prazo: serverCb.prazo, concluida: serverCb.concluida, concluida_em: serverCb.concluida_em };
          });
        return updated;
      });
    }
  }, [editando, missao?.missao_checkboxes, deletedIds]);

  const checkboxes = editando ? localCheckboxes : (missao?.missao_checkboxes || []);

  const handleStartEditing = () => {
    setDeletedIds(new Set());
    if (missao) {
      setLocalCheckboxes([...missao.missao_checkboxes]);
    }
    setEditando(true);
  };

  const handleStopEditing = () => {
    setDeletedIds(new Set());
    setEditando(false);
  };

  const handleSaveDescricao = useCallback((id: string, descricao: string) => {
    onEditarCheckbox?.({ id, descricao });
    setLocalCheckboxes(prev => prev.map(cb => cb.id === id ? { ...cb, descricao } : cb));
  }, [onEditarCheckbox]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalCheckboxes(prev => {
      const oldIndex = prev.findIndex(cb => cb.id === active.id);
      const newIndex = prev.findIndex(cb => cb.id === over.id);
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      const reordered = newOrder.map((cb, i) => ({ ...cb, ordem: i }));
      onReordenarCheckboxes?.(reordered.map(cb => ({ id: cb.id, ordem: cb.ordem })));
      return reordered;
    });
  }, [onReordenarCheckboxes]);

  const handleDeleteCheckbox = useCallback((id: string) => {
    setDeletedIds(prev => new Set(prev).add(id));
    onDeletarCheckbox?.(id);
    setLocalCheckboxes(prev => prev.filter(cb => cb.id !== id));
  }, [onDeletarCheckbox]);

  const handleEditarPrazo = useCallback((id: string, prazo: string | null) => {
    onEditarPrazoCheckbox?.({ id, prazo });
    setLocalCheckboxes(prev => prev.map(cb => cb.id === id ? { ...cb, prazo } : cb));
  }, [onEditarPrazoCheckbox]);

  if (!missao) return null;

  const total = missao.missao_checkboxes.length;
  const concluidas = missao.missao_checkboxes.filter(c => c.concluida).length;
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) setEditando(false); onOpenChange(v); }}>
        <DialogContent className="bg-white/5 border-white/10 backdrop-blur-xl text-white max-w-lg max-h-[85vh] overflow-y-auto p-0 rounded-xl [&>button.absolute]:hidden">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold text-white flex-1 min-w-0">{missao.titulo}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10 shrink-0"
                onClick={editando ? handleStopEditing : handleStartEditing}
              >
                {editando ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              </Button>
            </div>
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
            {editando ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={localCheckboxes.map(cb => cb.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {localCheckboxes.map((cb) => (
                      <SortableEditItem
                        key={cb.id}
                        cb={cb}
                        onSaveDescricao={handleSaveDescricao}
                        onDeleteItem={handleDeleteCheckbox}
                        onEditarPrazo={handleEditarPrazo}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-1">
                {checkboxes.map((cb) => (
                  <ViewCheckboxItem
                    key={cb.id}
                    cb={cb}
                    onToggleCheckbox={onToggleCheckbox}
                  />
                ))}
              </div>
            )}

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
