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
import type { Estado } from '@/hooks/useEstadosCidades';

interface NovoEstadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sigla: string, nome: string) => Promise<boolean>;
  estadoParaEditar?: Estado | null;
  onUpdate?: (id: string, sigla: string, nome: string) => Promise<boolean>;
}

export function NovoEstadoDialog({
  open,
  onOpenChange,
  onSave,
  estadoParaEditar,
  onUpdate
}: NovoEstadoDialogProps) {
  const [sigla, setSigla] = useState('');
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!estadoParaEditar;

  useEffect(() => {
    if (estadoParaEditar) {
      setSigla(estadoParaEditar.sigla);
      setNome(estadoParaEditar.nome);
    } else {
      setSigla('');
      setNome('');
    }
  }, [estadoParaEditar, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sigla.trim() || !nome.trim()) return;

    setSaving(true);
    try {
      let success = false;
      
      if (isEditing && onUpdate) {
        success = await onUpdate(estadoParaEditar.id, sigla, nome);
      } else {
        success = await onSave(sigla, nome);
      }
      
      if (success) {
        onOpenChange(false);
        setSigla('');
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
          <DialogTitle>{isEditing ? 'Editar Estado' : 'Novo Estado'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sigla">Sigla</Label>
            <Input
              id="sigla"
              value={sigla}
              onChange={(e) => setSigla(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="Ex: RS"
              maxLength={2}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Estado</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Rio Grande do Sul"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !sigla.trim() || !nome.trim()}>
              {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Estado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
