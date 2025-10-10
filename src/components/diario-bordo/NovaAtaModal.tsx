import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, Play, Pause } from 'lucide-react';
import { useCronometro } from '@/hooks/useCronometro';
import { formatCronometro } from '@/utils/timeFormat';

interface NovaAtaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinalize: (data: { assunto: string; conteudo: string; duracao: number; dataInicio: Date; dataFim: Date }) => void;
}

export function NovaAtaModal({ open, onOpenChange, onFinalize }: NovaAtaModalProps) {
  const [assunto, setAssunto] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { segundosDecorridos, isRunning, startTime, start, pause } = useCronometro();

  // Iniciar cronômetro automaticamente ao abrir
  useState(() => {
    if (open && !isRunning) {
      start();
    }
  });

  const handleCancel = () => {
    if (assunto || conteudo) {
      setShowCancelDialog(true);
    } else {
      resetAndClose();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setAssunto('');
    setConteudo('');
    onOpenChange(false);
  };

  const handleFinalize = () => {
    if (!assunto.trim()) {
      return;
    }
    if (!conteudo.trim()) {
      return;
    }

    onFinalize({
      assunto: assunto.trim(),
      conteudo: conteudo.trim(),
      duracao: segundosDecorridos,
      dataInicio: startTime || new Date(),
      dataFim: new Date(),
    });

    resetAndClose();
  };

  const isValid = assunto.trim().length >= 3 && conteudo.trim().length >= 10;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Nova Ata de Reunião</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isRunning ? "destructive" : "default"}
                  size="sm"
                  onClick={isRunning ? pause : start}
                  className="h-10"
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                  <Clock className={`h-5 w-5 ${segundosDecorridos > 3600 ? 'text-red-500' : 'text-primary'}`} />
                  <span className={`text-lg font-mono font-bold ${segundosDecorridos > 3600 ? 'text-red-500' : 'text-primary'}`}>
                    {formatCronometro(segundosDecorridos)}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assunto">
                Assunto da Reunião <span className="text-red-500">*</span>
              </Label>
              <Input
                id="assunto"
                placeholder="Ex: Planejamento Trimestral de Vendas"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                maxLength={200}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                {assunto.length}/200 caracteres
              </p>
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="conteudo">
                Conteúdo da Ata <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="conteudo"
                placeholder="Descreva os principais pontos discutidos, decisões tomadas e próximos passos..."
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                className="min-h-[300px] resize-y text-base"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 10 caracteres ({conteudo.length} digitados)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleFinalize} disabled={!isValid}>
              Finalizar Ata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar ata?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem conteúdo não salvo. Tem certeza que deseja descartar esta ata?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
