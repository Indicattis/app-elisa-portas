import { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrdensSemDataCarregamento } from "@/hooks/useOrdensSemDataCarregamento";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { toast } from "sonner";

interface AddOrdemPopoverProps {
  date: Date;
  onUpdateOrdem: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;
  onOrdemAdded?: () => void;
  size?: "default" | "sm" | "icon";
  className?: string;
}

export const AddOrdemPopover = ({
  date,
  onUpdateOrdem,
  onOrdemAdded,
  size = "icon",
  className = "",
}: AddOrdemPopoverProps) => {
  const [open, setOpen] = useState(false);
  const { ordens, isLoading } = useOrdensSemDataCarregamento();

  const handleSelectOrdem = async (ordem: OrdemCarregamento) => {
    try {
      const dataFormatada = format(date, "yyyy-MM-dd");

      await onUpdateOrdem({
        id: ordem.id,
        data: {
          data_carregamento: dataFormatada,
          status: "agendada",
        },
      });

      toast.success("Ordem adicionada ao calendário! Clique em editar para definir hora e responsável.");
      setOpen(false);
      onOrdemAdded?.();
    } catch (error) {
      console.error("Erro ao adicionar ordem:", error);
      toast.error("Erro ao adicionar ordem ao calendário");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size={size} className={className}>
          <Plus className={size === "icon" ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Adicionar Ordem</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Selecione uma ordem para agendar em {format(date, "dd/MM/yyyy")}
          </p>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : ordens.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma ordem disponível
            </div>
          ) : (
            <div className="divide-y">
              {ordens.map((ordem) => (
                <button
                  key={ordem.id}
                  onClick={() => handleSelectOrdem(ordem)}
                  className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{ordem.nome_cliente}</p>
                    {ordem.pedido && (
                      <p className="text-xs text-muted-foreground">
                        Pedido: {ordem.pedido.numero_pedido}
                      </p>
                    )}
                    {ordem.venda && (
                      <p className="text-xs text-muted-foreground">
                        {ordem.venda.cidade} - {ordem.venda.estado}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
