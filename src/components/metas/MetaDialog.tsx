import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetaColaborador, useCriarMeta, useAtualizarMeta } from "@/hooks/useMetasColaboradorIndividual";
import { toast } from "sonner";
import { Flame, Ruler, Package, CheckCircle, Paintbrush, Truck } from "lucide-react";

interface MetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  metaParaEditar?: MetaColaborador | null;
}

const tiposMetaOptions = [
  { value: "solda", label: "Solda", icon: Flame },
  { value: "perfiladeira", label: "Perfiladeira", icon: Ruler },
  { value: "separacao", label: "Separação", icon: Package },
  { value: "qualidade", label: "Qualidade", icon: CheckCircle },
  { value: "pintura", label: "Pintura", icon: Paintbrush },
  { value: "carregamento", label: "Expedição", icon: Truck },
];

const getUnidadeDescricao = (tipo: string) => {
  switch (tipo) {
    case "solda": return "Quantidade de portas";
    case "perfiladeira": return "Metros lineares (m)";
    case "separacao": return "Quantidade de itens/linhas";
    case "qualidade": return "Quantidade de pedidos";
    case "pintura": return "Metros quadrados (m²)";
    case "carregamento": return "Quantidade de pedidos";
    default: return "Quantidade";
  }
};

export function MetaDialog({ open, onOpenChange, userId, metaParaEditar }: MetaDialogProps) {
  const [tipoMeta, setTipoMeta] = useState<MetaColaborador["tipo_meta"]>("solda");
  const [valorMeta, setValorMeta] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataTermino, setDataTermino] = useState("");
  const [recompensaValor, setRecompensaValor] = useState("");

  const criarMeta = useCriarMeta();
  const atualizarMeta = useAtualizarMeta();

  useEffect(() => {
    if (metaParaEditar) {
      setTipoMeta(metaParaEditar.tipo_meta);
      setValorMeta(metaParaEditar.valor_meta.toString());
      setDataInicio(metaParaEditar.data_inicio);
      setDataTermino(metaParaEditar.data_termino);
      setRecompensaValor(metaParaEditar.recompensa_valor.toString());
    } else {
      setTipoMeta("solda");
      setValorMeta("");
      setDataInicio(new Date().toISOString().split("T")[0]);
      setDataTermino("");
      setRecompensaValor("");
    }
  }, [metaParaEditar, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!valorMeta || !dataInicio || !dataTermino) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (new Date(dataTermino) < new Date(dataInicio)) {
      toast.error("A data de término deve ser posterior à data de início");
      return;
    }

    const metaData = {
      user_id: userId,
      tipo_meta: tipoMeta,
      valor_meta: parseFloat(valorMeta.replace(",", ".")),
      data_inicio: dataInicio,
      data_termino: dataTermino,
      recompensa_valor: parseFloat(recompensaValor.replace(",", ".")) || 0,
    };

    try {
      if (metaParaEditar) {
        await atualizarMeta.mutateAsync({ id: metaParaEditar.id, ...metaData });
        toast.success("Meta atualizada com sucesso!");
      } else {
        await criarMeta.mutateAsync(metaData);
        toast.success("Meta criada com sucesso!");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao salvar meta");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {metaParaEditar ? "Editar Meta" : "Nova Meta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Meta</Label>
            <Select value={tipoMeta} onValueChange={(v) => setTipoMeta(v as MetaColaborador["tipo_meta"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposMetaOptions.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <div className="flex items-center gap-2">
                      <tipo.icon className="h-4 w-4" />
                      <span>{tipo.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Valor da Meta *</Label>
            <Input
              type="text"
              placeholder="Ex: 100"
              value={valorMeta}
              onChange={(e) => setValorMeta(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {getUnidadeDescricao(tipoMeta)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Período de Vigência *</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Início</span>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Término</span>
                <Input
                  type="date"
                  value={dataTermino}
                  onChange={(e) => setDataTermino(e.target.value)}
                  min={dataInicio}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recompensa (R$)</Label>
            <Input
              type="text"
              placeholder="Ex: 150,00"
              value={recompensaValor}
              onChange={(e) => setRecompensaValor(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criarMeta.isPending || atualizarMeta.isPending}>
              {metaParaEditar ? "Salvar" : "Criar Meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
