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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
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
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  const isEditing = !!cidadeParaEditar;

  // Buscar cidades únicas dos autorizados deste estado
  useEffect(() => {
    const fetchCidadesAutorizados = async () => {
      if (!open || !estadoSigla) return;
      
      setLoadingCidades(true);
      try {
        const { data, error } = await supabase
          .from('autorizados')
          .select('cidade')
          .ilike('estado', estadoSigla)
          .not('cidade', 'is', null);
        
        if (error) throw error;
        
        // Extrair cidades únicas e ordenar
        const cidadesUnicas = [...new Set(
          (data || [])
            .map(a => a.cidade)
            .filter((c): c is string => !!c && c.trim() !== '')
        )].sort();
        
        // Filtrar cidades já cadastradas (exceto a que está sendo editada)
        const cidadesFiltradas = cidadesUnicas.filter(
          c => !cidadesCadastradas.map(cc => cc.toLowerCase()).includes(c.toLowerCase()) ||
               (isEditing && c.toLowerCase() === cidadeParaEditar?.nome.toLowerCase())
        );
        
        setCidadesDisponiveis(cidadesFiltradas);
      } catch (error) {
        console.error('Erro ao buscar cidades:', error);
      } finally {
        setLoadingCidades(false);
      }
    };

    fetchCidadesAutorizados();
  }, [open, estadoSigla, cidadesCadastradas, isEditing, cidadeParaEditar]);

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
            {loadingCidades ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : cidadesDisponiveis.length > 0 ? (
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
                ? 'Cidades encontradas nos autorizados cadastrados.'
                : 'Nenhuma cidade encontrada nos autorizados. Digite manualmente.'
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
