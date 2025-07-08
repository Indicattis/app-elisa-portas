
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadComments } from "@/components/LeadComments";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  status_atendimento: number;
  data_envio: string;
  atendente_id: string | null;
  valor_orcamento: number | null;
  tipo_porta: string | null;
  altura_porta: string | null;
  largura_porta: string | null;
  cor_porta: string | null;
  funcao_lead: string | null;
  observacoes: string | null;
  mensagem: string | null;
  data_prevista_entrega: string | null;
}

export default function LeadEdit() {
  const { id } = useParams<{ id: string }>();
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
        description: "Erro ao carregar lead",
      });
      navigate("/dashboard/leads");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lead) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({
          nome: lead.nome,
          email: lead.email,
          telefone: lead.telefone,
          cidade: lead.cidade,
          valor_orcamento: lead.valor_orcamento,
          tipo_porta: lead.tipo_porta,
          altura_porta: lead.altura_porta,
          largura_porta: lead.largura_porta,
          cor_porta: lead.cor_porta,
          funcao_lead: lead.funcao_lead,
          data_prevista_entrega: lead.data_prevista_entrega,
        })
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
        description: "Erro ao salvar lead",
      });
    } finally {
      setSaving(false);
    }
  };

  const canEdit = () => {
    return isAdmin || lead?.atendente_id === user?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead || !canEdit()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para editar este lead.
          </p>
          <Button onClick={() => navigate("/dashboard/leads")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/leads")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar Lead</h1>
            <p className="text-muted-foreground">
              Editando lead de {lead.nome}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais do lead
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={lead.nome}
                onChange={(e) => setLead({ ...lead, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={lead.email || ""}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={lead.telefone}
                onChange={(e) => setLead({ ...lead, telefone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={lead.cidade || ""}
                onChange={(e) => setLead({ ...lead, cidade: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcao_lead">Função do Lead</Label>
              <Input
                id="funcao_lead"
                value={lead.funcao_lead || ""}
                onChange={(e) => setLead({ ...lead, funcao_lead: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_envio">Data de Envio</Label>
              <Input
                id="data_envio"
                value={format(new Date(lead.data_envio), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Produto</CardTitle>
            <CardDescription>
              Especificações da porta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_porta">Tipo de Porta</Label>
              <Input
                id="tipo_porta"
                value={lead.tipo_porta || ""}
                onChange={(e) => setLead({ ...lead, tipo_porta: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="altura_porta">Altura</Label>
                <Input
                  id="altura_porta"
                  value={lead.altura_porta || ""}
                  onChange={(e) => setLead({ ...lead, altura_porta: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="largura_porta">Largura</Label>
                <Input
                  id="largura_porta"
                  value={lead.largura_porta || ""}
                  onChange={(e) => setLead({ ...lead, largura_porta: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor_porta">Cor da Porta</Label>
              <Input
                id="cor_porta"
                value={lead.cor_porta || ""}
                onChange={(e) => setLead({ ...lead, cor_porta: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_orcamento">Valor do Orçamento</Label>
              <Input
                id="valor_orcamento"
                type="number"
                step="0.01"
                value={lead.valor_orcamento || ""}
                onChange={(e) => setLead({ ...lead, valor_orcamento: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_prevista_entrega">Data Prevista de Entrega</Label>
              <Input
                id="data_prevista_entrega"
                type="date"
                value={lead.data_prevista_entrega || ""}
                onChange={(e) => setLead({ ...lead, data_prevista_entrega: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mensagem Original</CardTitle>
            <CardDescription>
              Mensagem enviada pelo lead (somente leitura)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-foreground whitespace-pre-wrap italic">
                {lead.mensagem || "Nenhuma mensagem"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sistema de Comentários */}
      <LeadComments leadId={lead.id} />
    </div>
  );
}
