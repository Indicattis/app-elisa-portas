import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";

interface DefinirDataCarregamentoModalProps {
  pedido: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DefinirDataCarregamentoModal({
  pedido,
  open,
  onOpenChange,
  onSuccess
}: DefinirDataCarregamentoModalProps) {
  const [dataCarregamento, setDataCarregamento] = useState(
    pedido?.data_carregamento || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSalvar = async () => {
    if (!dataCarregamento) {
      toast.error("Por favor, selecione uma data de carregamento");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("pedidos_producao")
        .update({ data_carregamento: dataCarregamento })
        .eq("id", pedido.id);

      if (error) throw error;

      toast.success("Data de carregamento definida com sucesso");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar data de carregamento:", error);
      toast.error("Erro ao salvar data de carregamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Definir Data de Carregamento
          </DialogTitle>
          <DialogDescription>
            Define a data prevista para o carregamento do pedido{" "}
            <span className="font-semibold">{pedido?.numero_pedido}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="data-carregamento">Data Prevista de Carregamento</Label>
            <Input
              id="data-carregamento"
              type="date"
              value={dataCarregamento}
              onChange={(e) => setDataCarregamento(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
