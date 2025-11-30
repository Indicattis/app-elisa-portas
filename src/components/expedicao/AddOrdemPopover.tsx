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
      <PopoverContent className="w-[600px] p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-[11px]">Adicionar Ordem</h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            Selecione uma ordem para agendar em {format(date, "dd/MM/yyyy")}
          </p>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-[10px] text-muted-foreground">
              Carregando...
            </div>
          ) : ordens.length === 0 ? (
            <div className="p-4 text-center text-[10px] text-muted-foreground">
              Nenhuma ordem disponível
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[2fr,1.5fr,1.5fr] gap-2 px-3 py-2 bg-muted/50 border-b text-[11px] font-medium">
                <div>Cliente</div>
                <div>Pedido</div>
                <div>Localização</div>
              </div>
              <div className="divide-y">
                {ordens.map((ordem) => (
                  <button
                    key={ordem.id}
                    onClick={() => handleSelectOrdem(ordem)}
                    className="w-full grid grid-cols-[2fr,1.5fr,1.5fr] gap-2 px-3 py-1 text-left hover:bg-muted/50 transition-colors items-center"
                  >
                    <div className="text-[10px] font-medium truncate">{ordem.nome_cliente}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {ordem.pedido?.numero_pedido || '-'}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {ordem.venda ? `${ordem.venda.cidade} - ${ordem.venda.estado}` : '-'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
