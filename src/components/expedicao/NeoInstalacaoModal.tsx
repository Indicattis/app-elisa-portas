import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NeoInstalacao, CriarNeoInstalacaoData } from "@/types/neoInstalacao";
import { ESTADOS_BRASIL, getCidadesPorEstado } from "@/utils/estadosCidades";

interface Equipe {
  id: string;
  nome: string;
  cor: string | null;
}

interface Autorizado {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
}

interface NeoInstalacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  neoInstalacao?: NeoInstalacao | null;
  onConfirm: (dados: CriarNeoInstalacaoData) => Promise<void>;
}

export function NeoInstalacaoModal({
  open,
  onOpenChange,
  neoInstalacao,
  onConfirm,
}: NeoInstalacaoModalProps) {
  const isEditing = !!neoInstalacao;

  const [nomeCliente, setNomeCliente] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [dataInstalacao, setDataInstalacao] = useState("");
  const [tipoResponsavel, setTipoResponsavel] = useState<'equipe_interna' | 'autorizado'>('equipe_interna');
  const [equipeId, setEquipeId] = useState("");
  const [autorizadoId, setAutorizadoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [valorAReceber, setValorAReceber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);

  // Carregar equipes e autorizados quando abrir
  useEffect(() => {
    if (open) {
      loadEquipes();
      loadAutorizados();
    }
  }, [open]);

  // Preencher dados ao editar
  useEffect(() => {
    if (open && neoInstalacao) {
      setNomeCliente(neoInstalacao.nome_cliente || "");
      setCidade(neoInstalacao.cidade || "");
      setEstado(neoInstalacao.estado || "");
      setDataInstalacao(neoInstalacao.data_instalacao || "");
      setTipoResponsavel(neoInstalacao.tipo_responsavel || 'equipe_interna');
      setEquipeId(neoInstalacao.equipe_id || "");
      setAutorizadoId(neoInstalacao.autorizado_id || "");
      setDescricao(neoInstalacao.descricao || "");
      setValorTotal(neoInstalacao.valor_total ? String(neoInstalacao.valor_total) : "");
      setValorAReceber(neoInstalacao.valor_a_receber ? String(neoInstalacao.valor_a_receber) : "");
    } else if (open && !neoInstalacao) {
      // Reset para criação
      setNomeCliente("");
      setCidade("");
      setEstado("");
      setDataInstalacao("");
      setTipoResponsavel('equipe_interna');
      setEquipeId("");
      setAutorizadoId("");
      setDescricao("");
      setValorTotal("");
      setValorAReceber("");
    }
  }, [open, neoInstalacao]);

  const loadEquipes = async () => {
    const { data, error } = await supabase
      .from("equipes_instalacao")
      .select("id, nome, cor")
      .eq("ativa", true)
      .order("nome");

    if (!error && data) {
      setEquipes(data);
    }
  };

  const loadAutorizados = async () => {
    const { data, error } = await supabase
      .from("autorizados")
      .select("id, nome, cidade, estado")
      .eq("ativo", true)
      .order("nome");

    if (!error && data) {
      setAutorizados(data);
    }
  };

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

    if (tipoResponsavel === 'equipe_interna' && !equipeId) {
      toast.error("Selecione uma equipe");
      return;
    }
    if (tipoResponsavel === 'autorizado' && !autorizadoId) {
      toast.error("Selecione um autorizado");
      return;
    }

    setIsLoading(true);

    try {
      const selectedEquipe = equipes.find(e => e.id === equipeId);
      const selectedAutorizado = autorizados.find(a => a.id === autorizadoId);

      const dados: CriarNeoInstalacaoData = {
        nome_cliente: nomeCliente.trim(),
        cidade: cidade.trim(),
        estado,
        data_instalacao: dataInstalacao || null,
        hora: null,
        tipo_responsavel: tipoResponsavel,
        equipe_id: tipoResponsavel === 'equipe_interna' ? equipeId : null,
        equipe_nome: tipoResponsavel === 'equipe_interna' ? selectedEquipe?.nome : null,
        autorizado_id: tipoResponsavel === 'autorizado' ? autorizadoId : null,
        autorizado_nome: tipoResponsavel === 'autorizado' ? selectedAutorizado?.nome : null,
        descricao: descricao.trim() || undefined,
        valor_total: valorTotal ? Number(valorTotal) : 0,
        valor_a_receber: valorAReceber ? Number(valorAReceber) : 0,
      };

      await onConfirm(dados);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar instalação avulsa");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Instalação Avulsa" : "Nova Instalação Avulsa"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preencha os dados da instalação avulsa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nomeCliente">Cliente *</Label>
            <Input
              id="nomeCliente"
              placeholder="Nome do cliente"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select value={estado} onValueChange={(novoEstado) => {
                setEstado(novoEstado);
                setCidade("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent modal={false}>
                  {ESTADOS_BRASIL.map((e) => (
                    <SelectItem key={e.sigla} value={e.sigla}>
                      {e.sigla} - {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Select value={cidade} onValueChange={setCidade} disabled={!estado}>
                <SelectTrigger>
                  <SelectValue placeholder={estado ? "Selecione a cidade" : "Selecione o estado primeiro"} />
                </SelectTrigger>
                <SelectContent modal={false}>
                  {getCidadesPorEstado(estado).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataInstalacao">Data <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              id="dataInstalacao"
              type="date"
              value={dataInstalacao}
              onChange={(e) => setDataInstalacao(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de Responsável *</Label>
            <RadioGroup
              value={tipoResponsavel}
              onValueChange={(value: 'equipe_interna' | 'autorizado') => {
                setTipoResponsavel(value);
                setEquipeId("");
                setAutorizadoId("");
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equipe_interna" id="equipe_interna" />
                <Label htmlFor="equipe_interna" className="font-normal cursor-pointer">
                  Equipe Interna
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="autorizado" id="autorizado" />
                <Label htmlFor="autorizado" className="font-normal cursor-pointer">
                  Autorizado
                </Label>
              </div>
            </RadioGroup>
          </div>

          {tipoResponsavel === 'equipe_interna' ? (
            <div className="space-y-2">
              <Label htmlFor="equipe">Equipe *</Label>
              <Select value={equipeId} onValueChange={setEquipeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a equipe" />
                </SelectTrigger>
                <SelectContent modal={false}>
                  {equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: equipe.cor || '#6366f1' }}
                        />
                        {equipe.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="autorizado">Autorizado *</Label>
              <Select value={autorizadoId} onValueChange={setAutorizadoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o autorizado" />
                </SelectTrigger>
                <SelectContent modal={false}>
                  {autorizados.map((autorizado) => (
                    <SelectItem key={autorizado.id} value={autorizado.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        {autorizado.nome}
                        {autorizado.cidade && (
                          <span className="text-muted-foreground text-xs">
                            - {autorizado.cidade}/{autorizado.estado}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total (R$)</Label>
              <Input
                id="valorTotal"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorAReceber">Valor a Receber (R$)</Label>
              <Input
                id="valorAReceber"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={valorAReceber}
                onChange={(e) => setValorAReceber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição / Observações</Label>
            <Textarea
              id="descricao"
              placeholder="Observações adicionais..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
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
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
