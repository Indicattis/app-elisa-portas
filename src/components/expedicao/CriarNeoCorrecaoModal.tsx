import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { CriarNeoCorrecaoData } from "@/types/neoCorrecao";

interface Equipe {
  id: string;
  nome: string;
  cor: string | null;
}

interface CriarNeoCorrecaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dados: CriarNeoCorrecaoData) => Promise<void>;
}

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function CriarNeoCorrecaoModal({
  open,
  onOpenChange,
  onConfirm,
}: CriarNeoCorrecaoModalProps) {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [nomeCliente, setNomeCliente] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [dataCorrecao, setDataCorrecao] = useState("");
  const [hora, setHora] = useState("");
  const [equipeId, setEquipeId] = useState("");
  const [descricao, setDescricao] = useState("");

  // Carregar equipes
  useEffect(() => {
    if (open) {
      const loadEquipes = async () => {
        const { data } = await supabase
          .from("equipes_instalacao")
          .select("id, nome, cor")
          .eq("ativa", true)
          .order("nome");

        if (data) {
          setEquipes(data);
        }
      };
      loadEquipes();
    }
  }, [open]);

  // Reset form quando abrir
  useEffect(() => {
    if (open) {
      setNomeCliente("");
      setCidade("");
      setEstado("");
      setDataCorrecao("");
      setHora("");
      setEquipeId("");
      setDescricao("");
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!nomeCliente.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    if (!cidade.trim()) {
      toast.error("Informe a cidade");
      return;
    }
    if (!estado) {
      toast.error("Selecione o estado");
      return;
    }
    if (!dataCorrecao) {
      toast.error("Selecione a data da correção");
      return;
    }
    if (!hora) {
      toast.error("Informe o horário");
      return;
    }
    if (!equipeId) {
      toast.error("Selecione a equipe responsável");
      return;
    }

    const equipeSelecionada = equipes.find(e => e.id === equipeId);

    setIsLoading(true);
    try {
      await onConfirm({
        nome_cliente: nomeCliente.trim(),
        cidade: cidade.trim(),
        estado,
        data_correcao: dataCorrecao,
        hora,
        equipe_id: equipeId,
        equipe_nome: equipeSelecionada?.nome || "",
        descricao: descricao.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar correção:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Correção Avulsa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nomeCliente">Nome do Cliente *</Label>
            <Input
              id="nomeCliente"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataCorrecao">Data *</Label>
              <Input
                id="dataCorrecao"
                type="date"
                value={dataCorrecao}
                onChange={(e) => setDataCorrecao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Horário *</Label>
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipe">Equipe Responsável *</Label>
            <Select value={equipeId} onValueChange={setEquipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a equipe" />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: equipe.cor || "#9333ea" }}
                      />
                      {equipe.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição do Problema</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema ou correção necessária (opcional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Correção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
