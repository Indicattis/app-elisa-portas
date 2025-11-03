import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface DataProducaoEntregaModalProps {
  entregaId: string;
  currentDataProducao: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DataProducaoEntregaModal = ({
  entregaId,
  currentDataProducao,
  open,
  onOpenChange,
  onSuccess,
}: DataProducaoEntregaModalProps) => {
  const [dataProducao, setDataProducao] = useState(
    currentDataProducao ? format(new Date(currentDataProducao), 'yyyy-MM-dd') : ''
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!dataProducao) {
      toast.error('Selecione uma data de produção');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('entregas')
        .update({ data_producao: dataProducao })
        .eq('id', entregaId);

      if (error) throw error;

      toast.success('Data de produção atualizada com sucesso');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating data_producao:', error);
      toast.error('Erro ao atualizar data de produção');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Definir Data de Produção
          </DialogTitle>
          <DialogDescription>
            Selecione a data de produção da entrega
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data_producao">Data de Produção</Label>
            <Input
              id="data_producao"
              type="date"
              value={dataProducao}
              onChange={(e) => setDataProducao(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
