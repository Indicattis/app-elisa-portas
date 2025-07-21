import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cep: string | null;
  endereco_cidade_completa: string | null;
  endereco_estado: string | null;
}

export default function LeadEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalogoCores, setCatalogoCores] = useState<{ nome: string; codigo_hex: string }[]>([]);
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchCatalogoCores();
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

  const fetchCatalogoCores = async () => {
    const { data, error } = await supabase
      .from("catalogo_cores")
      .select("nome, codigo_hex")
      .eq("ativa", true)
      .order("nome");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar catálogo de cores",
      });
      return;
    }

    setCatalogoCores(data || []);
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
          tipo_porta: lead.tipo_porta,
          altura_porta: lead.altura_porta,
          largura_porta: lead.largura_porta,
          cor_porta: lead.cor_porta,
          funcao_lead: lead.funcao_lead,
          data_prevista_entrega: lead.data_prevista_entrega,
          endereco_rua: lead.endereco_rua,
          endereco_numero: lead.endereco_numero,
          endereco_complemento: lead.endereco_complemento,
          endereco_bairro: lead.endereco_bairro,
          endereco_cep: lead.endereco_cep,
          endereco_cidade_completa: lead.endereco_cidade_completa,
          endereco_estado: lead.endereco_estado,
          observacoes: lead.observacoes,
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

            <div className="space-y-2">
              <Label htmlFor="valor_orcamento">Valor do Orçamento</Label>
              <Input
                id="valor_orcamento"
                value={lead.valor_orcamento ? `R$ ${lead.valor_orcamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não definido"}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O valor do orçamento é definido automaticamente por orçamentos aprovados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço Completo</CardTitle>
            <CardDescription>
              Informações de endereço do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endereco_rua">Rua/Logradouro</Label>
              <Input
                id="endereco_rua"
                value={lead.endereco_rua || ""}
                onChange={(e) => setLead({ ...lead, endereco_rua: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endereco_numero">Número</Label>
                <Input
                  id="endereco_numero"
                  value={lead.endereco_numero || ""}
                  onChange={(e) => setLead({ ...lead, endereco_numero: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco_complemento">Complemento</Label>
                <Input
                  id="endereco_complemento"
                  value={lead.endereco_complemento || ""}
                  onChange={(e) => setLead({ ...lead, endereco_complemento: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_bairro">Bairro</Label>
              <Input
                id="endereco_bairro"
                value={lead.endereco_bairro || ""}
                onChange={(e) => setLead({ ...lead, endereco_bairro: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_cep">CEP</Label>
              <Input
                id="endereco_cep"
                value={lead.endereco_cep || ""}
                onChange={(e) => setLead({ ...lead, endereco_cep: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_cidade_completa">Cidade Completa</Label>
              <Input
                id="endereco_cidade_completa"
                value={lead.endereco_cidade_completa || ""}
                onChange={(e) => setLead({ ...lead, endereco_cidade_completa: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_estado">Estado</Label>
              <Input
                id="endereco_estado"
                value={lead.endereco_estado || ""}
                onChange={(e) => setLead({ ...lead, endereco_estado: e.target.value })}
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
              <Select 
                value={lead.cor_porta || ""} 
                onValueChange={(value) => setLead({ ...lead, cor_porta: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cor">
                    {lead.cor_porta && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded border border-gray-300" 
                          style={{ 
                            backgroundColor: catalogoCores.find(c => c.nome === lead.cor_porta)?.codigo_hex 
                          }}
                        />
                        {lead.cor_porta}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Remover cor</SelectItem>
                  {catalogoCores.map((cor) => (
                    <SelectItem key={cor.nome} value={cor.nome}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded border border-gray-300" 
                          style={{ backgroundColor: cor.codigo_hex }}
                        />
                        {cor.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <CardTitle>Observações</CardTitle>
            <CardDescription>
              Observações internas sobre o lead
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={lead.observacoes || ""}
                onChange={(e) => setLead({ ...lead, observacoes: e.target.value })}
                placeholder="Adicione observações sobre o lead..."
                rows={4}
              />
            </div>

            <div>
              <Label>Mensagem Original</Label>
              <div className="bg-muted/30 rounded-lg p-4 mt-2">
                <p className="text-foreground whitespace-pre-wrap italic text-sm">
                  {lead.mensagem || "Nenhuma mensagem"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                A mensagem original não pode ser editada
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <LeadComments leadId={lead.id} />
    </div>
  );
}
