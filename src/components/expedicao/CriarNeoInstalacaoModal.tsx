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
import { Loader2, UserCircle } from "lucide-react";
import { CriarNeoInstalacaoData } from "@/types/neoInstalacao";

interface Equipe {
  id: string;
  nome: string;
  cor: string | null;
}

interface CriarNeoInstalacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dados: CriarNeoInstalacaoData) => Promise<void>;
}

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function CriarNeoInstalacaoModal({
  open,
  onOpenChange,
  onConfirm,
}: CriarNeoInstalacaoModalProps) {
  const [nomeCliente, setNomeCliente] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [dataInstalacao, setDataInstalacao] = useState("");
  const [hora, setHora] = useState("08:00");
  const [equipeId, setEquipeId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEquipes, setLoadingEquipes] = useState(false);

  // Carregar equipes de instalação
  useEffect(() => {
    if (open) {
      setLoadingEquipes(true);
      supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true)
        .order("nome")
        .then(({ data, error }) => {
          if (error) {
            console.error("Erro ao carregar equipes:", error);
            toast.error("Erro ao carregar equipes");
          } else {
            setEquipes(data || []);
          }
          setLoadingEquipes(false);
        });
    }
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setNomeCliente("");
      setCidade("");
      setEstado("");
      setDataInstalacao("");
      setHora("08:00");
      setEquipeId("");
      setDescricao("");
    }
  }, [open]);

  const handleConfirm = async () => {
    // Validações
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
    if (!dataInstalacao) {
      toast.error("Informe a data da instalação");
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

    setLoading(true);
    try {
      await onConfirm({
        nome_cliente: nomeCliente.trim(),
        cidade: cidade.trim(),
        estado,
        data_instalacao: dataInstalacao,
        hora,
        equipe_id: equipeId,
        equipe_nome: equipeSelecionada?.nome || "",
        descricao: descricao.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar neo instalação:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            Nova Instalação Avulsa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="nome_cliente">Cliente *</Label>
            <Input
              id="nome_cliente"
              placeholder="Nome do cliente"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
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

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="data_instalacao">Data *</Label>
              <Input
                id="data_instalacao"
                type="date"
                value={dataInstalacao}
                onChange={(e) => setDataInstalacao(e.target.value)}
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

          {/* Equipe */}
          <div className="space-y-2">
            <Label htmlFor="equipe">Equipe Responsável *</Label>
            <Select value={equipeId} onValueChange={setEquipeId} disabled={loadingEquipes}>
              <SelectTrigger>
                <SelectValue placeholder={loadingEquipes ? "Carregando..." : "Selecione a equipe"} />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    <div className="flex items-center gap-2">
                      {equipe.cor && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: equipe.cor }}
                        />
                      )}
                      {equipe.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descrição do serviço (opcional)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Instalação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
