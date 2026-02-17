import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { MinimalistLayout } from "@/components/MinimalistLayout";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ESTADOS_BRASIL, getCidadesPorEstado } from "@/utils/estadosCidades";
import { NeoInstalacao, CriarNeoInstalacaoData } from "@/types/neoInstalacao";
import { NeoCorrecao, CriarNeoCorrecaoData } from "@/types/neoCorrecao";

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

export default function NovaNeoForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tipoParam = searchParams.get("tipo") as "instalacao" | "correcao" | null;
  const queryClient = useQueryClient();

  const isEditing = !!id;

  // Fetch existing data when editing
  const { data: fetchedData, isLoading: isLoadingData } = useQuery({
    queryKey: ["neo-edit", id, tipoParam],
    queryFn: async () => {
      if (!id || !tipoParam) return null;
      const table = tipoParam === "instalacao" ? "neo_instalacoes" : "neo_correcoes";
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!tipoParam,
  });

  const [tipo, setTipo] = useState<"instalacao" | "correcao">(
    tipoParam === "correcao" ? "correcao" : "instalacao"
  );
  const [nomeCliente, setNomeCliente] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [tipoResponsavel, setTipoResponsavel] = useState<"equipe_interna" | "autorizado">("equipe_interna");
  const [equipeId, setEquipeId] = useState("");
  const [autorizadoId, setAutorizadoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [valorAReceber, setValorAReceber] = useState("");
  const [etapaCausadora, setEtapaCausadora] = useState("");

  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [autorizados, setAutorizados] = useState<Autorizado[]>([]);

  // Load equipes & autorizados
  useEffect(() => {
    const loadData = async () => {
      const [eqRes, autRes] = await Promise.all([
        supabase.from("equipes_instalacao").select("id, nome, cor").eq("ativa", true).order("nome"),
        supabase.from("autorizados").select("id, nome, cidade, estado").eq("ativo", true).order("nome"),
      ]);
      if (eqRes.data) setEquipes(eqRes.data);
      if (autRes.data) setAutorizados(autRes.data);
    };
    loadData();
  }, []);

  // Fill form when fetched data arrives
  useEffect(() => {
    if (!fetchedData) return;
    const d = fetchedData as any;
    setNomeCliente(d.nome_cliente || "");
    setCidade(d.cidade || "");
    setEstado(d.estado || "");
    setTipoResponsavel(d.tipo_responsavel === "autorizado" ? "autorizado" : "equipe_interna");
    setEquipeId(d.equipe_id || "");
    setAutorizadoId(d.autorizado_id || "");
    setDescricao(d.descricao || "");
    setValorTotal(d.valor_total ? String(d.valor_total) : "");
    setValorAReceber(d.valor_a_receber ? String(d.valor_a_receber) : "");
    setEtapaCausadora(d.etapa_causadora || "");

    if (tipoParam === "instalacao") {
      setTipo("instalacao");
      setData(d.data_instalacao || "");
    } else {
      setTipo("correcao");
      setData(d.data_correcao || "");
      setHora(d.hora?.substring(0, 5) || "");
    }
  }, [fetchedData, tipoParam]);

  const createInstalacao = useMutation({
    mutationFn: async (dados: CriarNeoInstalacaoData) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("neo_instalacoes").insert({ ...dados, created_by: user.user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Neo instalação criada!");
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
    },
    onError: () => toast.error("Erro ao criar neo instalação"),
  });

  const createCorrecao = useMutation({
    mutationFn: async (dados: CriarNeoCorrecaoData) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("neo_correcoes").insert({ ...dados, created_by: user.user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Neo correção criada!");
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: () => toast.error("Erro ao criar neo correção"),
  });

  const updateInstalacao = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: CriarNeoInstalacaoData }) => {
      const { error } = await supabase.from("neo_instalacoes").update({ ...dados, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Neo instalação atualizada!");
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const updateCorrecao = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: CriarNeoCorrecaoData }) => {
      const { error } = await supabase.from("neo_correcoes").update({ ...dados, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Neo correção atualizada!");
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const isSaving =
    createInstalacao.isPending || createCorrecao.isPending ||
    updateInstalacao.isPending || updateCorrecao.isPending;

  const validate = () => {
    if (!nomeCliente.trim()) { toast.error("Informe o nome do cliente"); return false; }
    if (!estado) { toast.error("Selecione o estado"); return false; }
    if (!cidade.trim()) { toast.error("Informe a cidade"); return false; }
    if (tipoResponsavel === "equipe_interna" && !equipeId) { toast.error("Selecione uma equipe"); return false; }
    if (tipoResponsavel === "autorizado" && !autorizadoId) { toast.error("Selecione um autorizado"); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const selectedEquipe = equipes.find((e) => e.id === equipeId);
    const selectedAutorizado = autorizados.find((a) => a.id === autorizadoId);

    const baseData = {
      nome_cliente: nomeCliente.trim(),
      cidade: cidade.trim(),
      estado,
      tipo_responsavel: tipoResponsavel,
      equipe_id: tipoResponsavel === "equipe_interna" ? equipeId : null,
      equipe_nome: tipoResponsavel === "equipe_interna" ? selectedEquipe?.nome : null,
      autorizado_id: tipoResponsavel === "autorizado" ? autorizadoId : null,
      autorizado_nome: tipoResponsavel === "autorizado" ? selectedAutorizado?.nome : null,
      descricao: descricao.trim() || undefined,
      valor_total: valorTotal ? Number(valorTotal) : 0,
      valor_a_receber: valorAReceber ? Number(valorAReceber) : 0,
      etapa_causadora: etapaCausadora || null,
    };

    try {
      if (tipo === "instalacao") {
        const dados: CriarNeoInstalacaoData = { ...baseData, data_instalacao: data || null, hora: null };
        if (isEditing && id) {
          await updateInstalacao.mutateAsync({ id, dados });
        } else {
          await createInstalacao.mutateAsync(dados);
        }
      } else {
        const dados: CriarNeoCorrecaoData = { ...baseData, data_correcao: data || null, hora: hora || null };
        if (isEditing && id) {
          await updateCorrecao.mutateAsync({ id, dados });
        } else {
          await createCorrecao.mutateAsync(dados);
        }
      }
      navigate("/logistica/expedicao");
    } catch {
      // errors handled in mutation callbacks
    }
  };

  if (isEditing && isLoadingData) {
    return (
      <MinimalistLayout
        title="Carregando..."
        subtitle="Buscando dados do serviço"
        backPath="/logistica/expedicao"
        breadcrumbItems={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Expedição", path: "/logistica/expedicao" },
          { label: "Editar Neo" },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MinimalistLayout>
    );
  }

  return (
    <MinimalistLayout
      title={isEditing ? "Editar Serviço Neo" : "Novo Serviço Neo"}
      subtitle={isEditing ? "Altere os dados do serviço" : "Preencha os dados para criar um novo serviço"}
      backPath="/logistica/expedicao"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Logística", path: "/logistica" },
        { label: "Expedição", path: "/logistica/expedicao" },
        { label: isEditing ? "Editar Neo" : "Nova Neo" },
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tipo selector */}
        <div className="space-y-2">
          <Label>Tipo de Serviço</Label>
          <Tabs
            value={tipo}
            onValueChange={(v) => {
              if (!isEditing) {
                setTipo(v as "instalacao" | "correcao");
                setHora("");
              }
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="instalacao" className="flex-1" disabled={isEditing}>
                Neo Instalação
              </TabsTrigger>
              <TabsTrigger value="correcao" className="flex-1" disabled={isEditing}>
                Neo Correção
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <Label htmlFor="nomeCliente">Cliente *</Label>
          <Input
            id="nomeCliente"
            placeholder="Nome do cliente"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
          />
        </div>

        {/* Estado / Cidade */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estado *</Label>
            <Select value={estado} onValueChange={(v) => { setEstado(v); setCidade(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BRASIL.map((e) => (
                  <SelectItem key={e.sigla} value={e.sigla}>{e.sigla} - {e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cidade *</Label>
            <Select value={cidade} onValueChange={setCidade} disabled={!estado}>
              <SelectTrigger>
                <SelectValue placeholder={estado ? "Selecione a cidade" : "Estado primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {getCidadesPorEstado(estado).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data / Hora */}
        <div className={`grid gap-4 ${tipo === "correcao" ? "grid-cols-2" : "grid-cols-1"}`}>
          <div className="space-y-2">
            <Label>Data <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          {tipo === "correcao" && (
            <div className="space-y-2">
              <Label>Horário <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          )}
        </div>

        {/* Tipo responsável */}
        <div className="space-y-3">
          <Label>Tipo de Responsável *</Label>
          <RadioGroup
            value={tipoResponsavel}
            onValueChange={(v: "equipe_interna" | "autorizado") => {
              setTipoResponsavel(v);
              setEquipeId("");
              setAutorizadoId("");
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="equipe_interna" id="resp_equipe" />
              <Label htmlFor="resp_equipe" className="font-normal cursor-pointer">Equipe Interna</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="autorizado" id="resp_autorizado" />
              <Label htmlFor="resp_autorizado" className="font-normal cursor-pointer">Autorizado</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Equipe ou Autorizado */}
        {tipoResponsavel === "equipe_interna" ? (
          <div className="space-y-2">
            <Label>Equipe *</Label>
            <Select value={equipeId} onValueChange={setEquipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a equipe" />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eq.cor || "#6366f1" }} />
                      {eq.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Autorizado *</Label>
            <Select value={autorizadoId} onValueChange={setAutorizadoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o autorizado" />
              </SelectTrigger>
              <SelectContent>
                {autorizados.map((aut) => (
                  <SelectItem key={aut.id} value={aut.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      {aut.nome}
                      {aut.cidade && (
                        <span className="text-muted-foreground text-xs">- {aut.cidade}/{aut.estado}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Valores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Valor Total (R$)</Label>
            <Input type="number" min="0" step="0.01" placeholder="0,00" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor a Receber (R$)</Label>
            <Input type="number" min="0" step="0.01" placeholder="0,00" value={valorAReceber} onChange={(e) => setValorAReceber(e.target.value)} />
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label>Descrição / Observações</Label>
          <Textarea placeholder="Observações adicionais..." value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
        </div>

        {/* Etapa causadora */}
        <div className="space-y-2">
          <Label>Etapa Causadora <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <Select value={etapaCausadora} onValueChange={setEtapaCausadora}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soldagem">Produção (Soldagem)</SelectItem>
              <SelectItem value="perfiladeira">Produção (Perfiladeira)</SelectItem>
              <SelectItem value="separacao">Produção (Separação)</SelectItem>
              <SelectItem value="inspecao_qualidade">Inspeção de Qualidade</SelectItem>
              <SelectItem value="pintura">Pintura</SelectItem>
              <SelectItem value="expedicao">Expedição</SelectItem>
              <SelectItem value="instalacao">Instalação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => navigate("/logistica/expedicao")}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Salvar Alterações" : "Criar Serviço"}
          </Button>
        </div>
      </div>
    </MinimalistLayout>
  );
}
