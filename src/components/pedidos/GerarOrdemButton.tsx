import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Wrench, Plus } from "lucide-react";

interface GerarOrdemButtonProps {
  onGerarOrdens: (tipos: string[]) => Promise<void>;
  temOrdens: boolean;
}

const TIPOS_ORDEM = [
  { id: "perfiladeira", label: "Perfiladeira", cor: "#0082ee" },
  { id: "separacao", label: "Separação", cor: "#ffe699" },
  { id: "soldagem", label: "Solda", cor: "#c6e0b4" },
  { id: "pintura", label: "Pintura", cor: "#ffc000" },
];

export const GerarOrdemButton = ({ onGerarOrdens, temOrdens }: GerarOrdemButtonProps) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [tiposSelecionados, setTiposSelecionados] = useState<string[]>([]);

  const handleToggleTipo = (tipo: string) => {
    setTiposSelecionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const handleGerar = async () => {
    if (tiposSelecionados.length > 0) {
      await onGerarOrdens(tiposSelecionados);
      setTiposSelecionados([]);
      setModalAberto(false);
    }
  };

  return (
    <Dialog open={modalAberto} onOpenChange={setModalAberto}>
      <DialogTrigger asChild>
        <Button>
          <Wrench className="h-4 w-4 mr-2" />
          {temOrdens ? "Gerar Mais Ordens" : "Gerar Ordens de Produção"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecione as Ordens a Gerar</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {TIPOS_ORDEM.map((tipo) => (
            <div
              key={tipo.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Checkbox
                id={tipo.id}
                checked={tiposSelecionados.includes(tipo.id)}
                onCheckedChange={() => handleToggleTipo(tipo.id)}
              />
              <Label
                htmlFor={tipo.id}
                className="flex-1 cursor-pointer flex items-center gap-2"
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: tipo.cor }}
                />
                <span className="font-medium">{tipo.label}</span>
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setModalAberto(false);
              setTiposSelecionados([]);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGerar}
            disabled={tiposSelecionados.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Gerar {tiposSelecionados.length > 0 && `(${tiposSelecionados.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
