import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResponsavelInstalacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instalacaoId: string;
  tipoAtual?: string | null;
  responsavelIdAtual?: string | null;
  responsavelNomeAtual?: string | null;
  onSave: (
    instalacaoId: string,
    tipoInstalacao: 'elisa' | 'autorizado',
    responsavelId: string,
    responsavelNome: string
  ) => Promise<void>;
}

interface Equipe {
  id: string;
  nome: string;
}

interface Autorizado {
  id: string;
  nome: string;
}

export const ResponsavelInstalacaoModal = ({
  open,
  onOpenChange,
  instalacaoId,
  tipoAtual,
  responsavelIdAtual,
  responsavelNomeAtual,
  onSave,
}: ResponsavelInstalacaoModalProps) => {
  const [tipoInstalacao, setTipoInstalacao] = useState<'elisa' | 'autorizado'>(
    (tipoAtual as 'elisa' | 'autorizado') || 'elisa'
  );
  const [responsavelId, setResponsavelId] = useState<string>(responsavelIdAtual || '');
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    // Reset responsavel quando mudar o tipo
    setResponsavelId('');
  }, [tipoInstalacao]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Buscar equipes
      const { data: equipesData, error: equipesError } = await supabase
        .from('equipes_instalacao')
        .select('id, nome')
        .eq('ativa', true)
        .order('nome');

      if (equipesError) throw equipesError;
      setEquipes(equipesData || []);

      // Buscar autorizados
      const { data: autorizadosData, error: autorizadosError } = await supabase
        .from('autorizados')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (autorizadosError) throw autorizadosError;
      setAutorizados(autorizadosData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar equipes e autorizados');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    if (!responsavelId) {
      toast.error('Selecione um responsável');
      return;
    }

    setLoading(true);
    try {
      // Encontrar o nome do responsável
      let responsavelNome = '';
      if (tipoInstalacao === 'elisa') {
        const equipe = equipes.find((e) => e.id === responsavelId);
        responsavelNome = equipe?.nome || '';
      } else {
        const autorizado = autorizados.find((a) => a.id === responsavelId);
        responsavelNome = autorizado?.nome || '';
      }

      await onSave(instalacaoId, tipoInstalacao, responsavelId, responsavelNome);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar responsável:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tipoAtual ? 'Editar Responsável' : 'Inserir Responsável'}
          </DialogTitle>
          <DialogDescription>
            {tipoAtual
              ? 'Altere o tipo de instalação e o responsável.'
              : 'Defina o tipo de instalação e o responsável.'}
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-instalacao">Tipo de Instalação *</Label>
              <Select
                value={tipoInstalacao}
                onValueChange={(value: 'elisa' | 'autorizado') => setTipoInstalacao(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elisa">Equipe Elisa</SelectItem>
                  <SelectItem value="autorizado">Autorizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">
                {tipoInstalacao === 'elisa' ? 'Equipe' : 'Autorizado'} *
              </Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      tipoInstalacao === 'elisa'
                        ? 'Selecione a equipe'
                        : 'Selecione o autorizado'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {tipoInstalacao === 'elisa'
                    ? equipes.map((equipe) => (
                        <SelectItem key={equipe.id} value={equipe.id}>
                          {equipe.nome}
                        </SelectItem>
                      ))
                    : autorizados.map((autorizado) => (
                        <SelectItem key={autorizado.id} value={autorizado.id}>
                          {autorizado.nome}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || loadingData}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!responsavelId || loading || loadingData}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
