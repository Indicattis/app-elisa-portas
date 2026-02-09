import { useState, useEffect, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCidadesPorEstado } from '@/utils/estadosCidades';
import type { Cidade } from '@/hooks/useEstadosCidades';

interface NovaCidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estadoId: string;
  estadoNome: string;
  estadoSigla: string;
  onSave: (estadoId: string, nome: string) => Promise<boolean>;
  cidadeParaEditar?: Cidade | null;
  onUpdate?: (id: string, nome: string) => Promise<boolean>;
  cidadesCadastradas?: string[];
}

export function NovaCidadeDialog({
  open,
  onOpenChange,
  estadoId,
  estadoNome,
  estadoSigla,
  onSave,
  cidadeParaEditar,
  onUpdate,
  cidadesCadastradas = []
}: NovaCidadeDialogProps) {
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!cidadeParaEditar;

  // Todas as cidades do estado, filtrando as já cadastradas
  const cidadesDisponiveis = useMemo(() => {
    if (!estadoSigla) return [];
    const todas = getCidadesPorEstado(estadoSigla);
    return todas.filter(
      c => !cidadesCadastradas.map(cc => cc.toLowerCase()).includes(c.toLowerCase()) ||
           (isEditing && c.toLowerCase() === cidadeParaEditar?.nome.toLowerCase())
    );
  }, [estadoSigla, cidadesCadastradas, isEditing, cidadeParaEditar]);

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
            <Label htmlFor="cidade">Cidade</Label>
            {cidadesDisponiveis.length > 0 ? (
              <Select value={nome} onValueChange={setNome}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Selecione uma cidade" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50 max-h-60">
                  {cidadesDisponiveis.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="cidade"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite o nome da cidade"
                required
              />
            )}
            <p className="text-xs text-muted-foreground">
              {cidadesDisponiveis.length > 0 
                ? `${cidadesDisponiveis.length} cidades disponíveis no estado.`
                : 'Nenhuma cidade encontrada. Digite manualmente.'
              }
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
