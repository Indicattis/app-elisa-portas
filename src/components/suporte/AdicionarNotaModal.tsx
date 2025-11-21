import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AdicionarNotaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNota?: string;
  onSave: (nota: string) => void;
}

export function AdicionarNotaModal({
  open,
  onOpenChange,
  currentNota = "",
  onSave,
}: AdicionarNotaModalProps) {
  const [nota, setNota] = useState(currentNota);

  const handleSave = () => {
    onSave(nota);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nota</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nota">Nota</Label>
            <Textarea
              id="nota"
              placeholder="Adicione observações sobre este chamado..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
