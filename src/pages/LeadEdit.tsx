import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  status_atendimento: number;
  atendente_id: string | null;
  valor_orcamento: number | null;
  tipo_porta: string | null;
  altura_porta: string | null;
  largura_porta: string | null;
  cor_porta: string | null;
  mensagem: string | null;
  observacoes: string | null;
  data_prevista_entrega: string | null;
  funcao_lead: string | null;
}

export default function LeadEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setLead(data);
    } catch (error) {
      console.error("Erro ao buscar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados do lead",
      });
    } finally {
      setLoading(false);
    }
  };

  const canEdit = () => {
    if (!lead) return false;
    return isAdmin || lead.atendente_id === user?.id || lead.atendente_id === null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lead || !canEdit()) return;

    setSaving(true);
    const formData = new FormData(e.currentTarget);

    try {
      const updateData: any = {
        nome: formData.get("nome") as string,
        email: formData.get("email") as string,
        telefone: formData.get("telefone") as string,
        cidade: formData.get("cidade") as string,
        funcao_lead: formData.get("funcao_lead") as string,
        tipo_porta: formData.get("tipo_porta") as string,
        altura_porta: formData.get("altura_porta") as string,
        largura_porta: formData.get("largura_porta") as string,
        cor_porta: formData.get("cor_porta") as string,
        observacoes: formData.get("observacoes") as string,
        mensagem: formData.get("mensagem") as string,
      };

      const valorOrcamento = formData.get("valor_orcamento") as string;
      if (valorOrcamento) {
        updateData.valor_orcamento = parseFloat(valorOrcamento.replace(/[^\d,.-]/g, '').replace(',', '.'));
      }

      const dataPrevista = formData.get("data_prevista_entrega") as string;
      if (dataPrevista) {
        updateData.data_prevista_entrega = dataPrevista;
      }

      const statusAtendimento = formData.get("status_atendimento") as string;
      if (statusAtendimento) {
        updateData.status_atendimento = parseInt(statusAtendimento);
        
        // Se estiver marcando como concluído, adicionar data de conclusão
        if (parseInt(statusAtendimento) === 4) {
          updateData.data_conclusao_atendimento = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from("elisaportas_leads")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lead atualizado com sucesso",
      });

      navigate(`/dashboard/leads/${id}`);
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar alterações",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/leads">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Lead não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canEdit()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/dashboard/leads/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Você não tem permissão para editar este lead</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/dashboard/leads/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Lead</h1>
          <p className="text-muted-foreground">{lead.nome}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  name="nome"
                  defaultValue={lead.nome}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={lead.email || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  defaultValue={lead.telefone}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  defaultValue={lead.cidade || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="funcao_lead">Função</Label>
                <Input
                  id="funcao_lead"
                  name="funcao_lead"
                  defaultValue={lead.funcao_lead || ""}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status do Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status_atendimento">Status</Label>
                <Select name="status_atendimento" defaultValue={lead.status_atendimento.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Aguardando</SelectItem>
                    <SelectItem value="2">Em Andamento</SelectItem>
                    <SelectItem value="3">Pausado</SelectItem>
                    <SelectItem value="4">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_orcamento">Valor do Orçamento</Label>
                <Input
                  id="valor_orcamento"
                  name="valor_orcamento"
                  type="number"
                  step="0.01"
                  defaultValue={lead.valor_orcamento || ""}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_prevista_entrega">Data Prevista de Entrega</Label>
                <Input
                  id="data_prevista_entrega"
                  name="data_prevista_entrega"
                  type="date"
                  defaultValue={lead.data_prevista_entrega || ""}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Porta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_porta">Tipo de Porta</Label>
                <Input
                  id="tipo_porta"
                  name="tipo_porta"
                  defaultValue={lead.tipo_porta || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altura_porta">Altura</Label>
                <Input
                  id="altura_porta"
                  name="altura_porta"
                  defaultValue={lead.altura_porta || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="largura_porta">Largura</Label>
                <Input
                  id="largura_porta"
                  name="largura_porta"
                  defaultValue={lead.largura_porta || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor_porta">Cor</Label>
                <Input
                  id="cor_porta"
                  name="cor_porta"
                  defaultValue={lead.cor_porta || ""}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem Inicial</Label>
                <Textarea
                  id="mensagem"
                  name="mensagem"
                  defaultValue={lead.mensagem || ""}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações do Atendimento</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  defaultValue={lead.observacoes || ""}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}