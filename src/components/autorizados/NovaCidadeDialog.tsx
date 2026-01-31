import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Cidade } from '@/hooks/useEstadosCidades';

interface NovaCidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estadoId: string;
  estadoNome: string;
  onSave: (estadoId: string, nome: string) => Promise<boolean>;
  cidadeParaEditar?: Cidade | null;
  onUpdate?: (id: string, nome: string) => Promise<boolean>;
}

export function NovaCidadeDialog({
  open,
  onOpenChange,
  estadoId,
  estadoNome,
  onSave,
  cidadeParaEditar,
  onUpdate
}: NovaCidadeDialogProps) {
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!cidadeParaEditar;

  useEffect(() => {
    if (cidadeParaEditar) {
      setNome(cidadeParaEditar.nome);
    } else {
      setNome('');
    }
  }, [cidadeParaEditar, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) return;

    setSaving(true);
    try {
      let success = false;
      
      if (isEditing && onUpdate) {
        success = await onUpdate(cidadeParaEditar.id, nome);
      } else {
        success = await onSave(estadoId, nome);
      }
      
      if (success) {
        onOpenChange(false);
        setNome('');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cidade' : 'Nova Cidade'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Estado: <span className="font-medium text-foreground">{estadoNome}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Cidade</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Porto Alegre"
              required
            />
            <p className="text-xs text-muted-foreground">
              Autorizados com esta cidade no cadastro serão agrupados automaticamente.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !nome.trim()}>
              {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Cidade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
