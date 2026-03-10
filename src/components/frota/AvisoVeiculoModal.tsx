import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AvisoVeiculoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculoNome: string;
  avisoAtual?: string | null;
  avisoData?: string | null;
  onSalvar: (justificativa: string) => Promise<void>;
  onRemover: () => Promise<void>;
}

export function AvisoVeiculoModal({
  open,
  onOpenChange,
  veiculoNome,
  avisoAtual,
  avisoData,
  onSalvar,
  onRemover,
}: AvisoVeiculoModalProps) {
  const [justificativa, setJustificativa] = useState(avisoAtual || "");
  const [saving, setSaving] = useState(false);

  const handleSalvar = async () => {
    if (!justificativa.trim()) return;
    setSaving(true);
    try {
      await onSalvar(justificativa.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRemover = async () => {
    setSaving(true);
    try {
      await onRemover();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Aviso - {veiculoNome}
          </DialogTitle>
          <DialogDescription>
            {avisoAtual
              ? "Este veículo possui um aviso registrado. Você pode editar ou remover."
              : "Registre um aviso ou observação importante sobre este veículo."}
          </DialogDescription>
        </DialogHeader>

        {avisoAtual && avisoData && (
          <div className="text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
            Registrado em {format(parseISO(avisoData), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="justificativa">Justificativa</Label>
          <Textarea
            id="justificativa"
            placeholder="Descreva o aviso sobre este veículo..."
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2">
          {avisoAtual && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemover}
              disabled={saving}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remover Aviso
            </Button>
          )}
          <Button
            onClick={handleSalvar}
            disabled={saving || !justificativa.trim()}
            size="sm"
          >
            {avisoAtual ? "Atualizar" : "Registrar Aviso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
