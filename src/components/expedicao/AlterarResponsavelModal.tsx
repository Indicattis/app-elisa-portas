import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AlterarResponsavelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordem: OrdemCarregamento | null;
  onSuccess?: () => void;
}

export const AlterarResponsavelModal = ({
  open,
  onOpenChange,
  ordem,
  onSuccess,
}: AlterarResponsavelModalProps) => {
  const [tipoResponsavel, setTipoResponsavel] = useState<'elisa' | 'autorizados'>('elisa');
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [responsaveis, setResponsaveis] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResponsaveis, setLoadingResponsaveis] = useState(false);

  useEffect(() => {
    if (ordem) {
      setTipoResponsavel(ordem.tipo_carregamento || 'elisa');
      setResponsavelId(ordem.responsavel_carregamento_id || "");
    }
  }, [ordem]);

  useEffect(() => {
    if (open && tipoResponsavel) {
      fetchResponsaveis();
    }
  }, [tipoResponsavel, open]);

  const fetchResponsaveis = async () => {
    setLoadingResponsaveis(true);
    try {
      if (tipoResponsavel === 'elisa') {
        // Buscar instaladores da equipe Elisa
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, nome')
          .eq('ativo', true)
          .in('role', ['instalador', 'gerente_instalacoes'])
          .order('nome');

        if (error) throw error;
        setResponsaveis(data || []);
      } else {
        // Buscar autorizados ativos
        const { data, error } = await supabase
          .from('autorizados')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        setResponsaveis(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar responsáveis:", error);
      toast.error("Erro ao carregar responsáveis");
    } finally {
      setLoadingResponsaveis(false);
    }
  };

  const handleSubmit = async () => {
    if (!ordem || !responsavelId) {
      toast.error("Selecione um responsável");
      return;
    }

    setLoading(true);
    try {
      const responsavelSelecionado = responsaveis.find((r) => r.id === responsavelId);
      
      const { error } = await supabase
        .from('ordens_carregamento')
        .update({
          tipo_carregamento: tipoResponsavel,
          responsavel_tipo: tipoResponsavel,
          responsavel_carregamento_id: responsavelId,
          responsavel_carregamento_nome: responsavelSelecionado?.nome || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ordem.id);

      if (error) throw error;

      toast.success("Responsável alterado com sucesso!");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao alterar responsável:", error);
      toast.error("Erro ao alterar responsável");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Alterar Responsável</DialogTitle>
          <DialogDescription className="text-xs">
            Defina quem será responsável por este carregamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tipo de Responsável */}
          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-xs">
              Tipo de Instalação
            </Label>
            <Select value={tipoResponsavel} onValueChange={(value) => {
              setTipoResponsavel(value as 'elisa' | 'autorizados');
              setResponsavelId("");
            }}>
              <SelectTrigger id="tipo" className="h-9 text-xs">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elisa" className="text-xs">Instalação Elisa</SelectItem>
                <SelectItem value="autorizados" className="text-xs">Autorizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel" className="text-xs">
              {tipoResponsavel === 'elisa' ? 'Instalador' : 'Autorizado'}
            </Label>
            <Select 
              value={responsavelId} 
              onValueChange={setResponsavelId}
              disabled={loadingResponsaveis}
            >
              <SelectTrigger id="responsavel" className="h-9 text-xs">
                <SelectValue placeholder={loadingResponsaveis ? "Carregando..." : "Selecione o responsável"} />
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map((resp) => (
                  <SelectItem key={resp.id} value={resp.id} className="text-xs">
                    {resp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ordem && (
            <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Cliente:</span> {ordem.nome_cliente}</p>
              <p><span className="font-medium">Pedido:</span> {ordem.pedido?.numero_pedido || 'N/A'}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            size="sm"
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !responsavelId}
            size="sm"
            className="text-xs"
          >
            {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
