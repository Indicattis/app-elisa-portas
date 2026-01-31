import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Estado } from '@/hooks/useEstadosCidades';

const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

interface NovoEstadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sigla: string, nome: string) => Promise<boolean>;
  estadoParaEditar?: Estado | null;
  onUpdate?: (id: string, sigla: string, nome: string) => Promise<boolean>;
  estadosCadastrados?: string[];
}

export function NovoEstadoDialog({
  open,
  onOpenChange,
  onSave,
  estadoParaEditar,
  onUpdate,
  estadosCadastrados = []
}: NovoEstadoDialogProps) {
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!estadoParaEditar;

  // Filtrar estados já cadastrados (exceto o que está sendo editado)
  const estadosDisponiveis = ESTADOS_BRASIL.filter(
    e => !estadosCadastrados.includes(e.sigla) || (isEditing && e.sigla === estadoParaEditar?.sigla)
  );

  useEffect(() => {
    if (estadoParaEditar) {
      setEstadoSelecionado(estadoParaEditar.sigla);
    } else {
      setEstadoSelecionado('');
    }
  }, [estadoParaEditar, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const estado = ESTADOS_BRASIL.find(e => e.sigla === estadoSelecionado);
    if (!estado) return;

    setSaving(true);
    try {
      let success = false;
      
      if (isEditing && onUpdate) {
        success = await onUpdate(estadoParaEditar.id, estado.sigla, estado.nome);
      } else {
        success = await onSave(estado.sigla, estado.nome);
      }
      
      if (success) {
        onOpenChange(false);
        setEstadoSelecionado('');
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
            <Label htmlFor="estado">Estado</Label>
            <Select value={estadoSelecionado} onValueChange={setEstadoSelecionado}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Selecione um estado" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {estadosDisponiveis.map(estado => (
                  <SelectItem key={estado.sigla} value={estado.sigla}>
                    {estado.sigla} - {estado.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !estadoSelecionado}>
              {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Estado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
