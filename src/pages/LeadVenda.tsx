
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  tipo_porta: string | null;
  altura_porta: string | null;
  largura_porta: string | null;
  cor_porta: string | null;
  valor_orcamento: number | null;
}

export default function LeadVenda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    valor_venda: "",
    forma_pagamento: "",
    observacoes_venda: "",
    estado: "",
    cidade: "",
    bairro: "",
    cep: "",
  });

  useEffect(() => {
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const { data: leadData, error } = await supabase
        .from("elisaportas_leads")
        .select("id, nome, email, telefone, cidade, tipo_porta, altura_porta, largura_porta, cor_porta, valor_orcamento")
        .eq("id", id)
        .single();

      if (error) throw error;
      setLead(leadData);
      
      // Se houver valor de orçamento, usar como valor inicial da venda
      if (leadData.valor_orcamento) {
        setFormData(prev => ({
          ...prev,
          valor_venda: leadData.valor_orcamento.toString(),
          cidade: leadData.cidade || ""
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados do lead",
      });
      navigate(`/dashboard/leads/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !id) return;

    if (!formData.valor_venda || parseFloat(formData.valor_venda) <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Valor da venda deve ser maior que zero",
      });
      return;
    }

    if (!formData.estado || !formData.cidade || !formData.bairro || !formData.cep) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Todos os campos de localização são obrigatórios",
      });
      return;
    }

    // Validar CEP (formato básico)
    const cepRegex = /^\d{5}-?\d{3}$/;
    if (!cepRegex.test(formData.cep)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "CEP deve ter o formato 00000-000",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Como a função finalizar_venda não foi atualizada, vamos fazer a operação manualmente
      // Primeiro, atualizar o status do lead
      const { error: leadError } = await supabase
        .from("elisaportas_leads")
        .update({
          status_atendimento: 5,
          data_conclusao_atendimento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (leadError) throw leadError;

      // Criar registro de venda com os novos campos
      const { error: vendaError } = await supabase
        .from("vendas")
        .insert({
          lead_id: id,
          atendente_id: user?.id,
          valor_venda: parseFloat(formData.valor_venda),
          forma_pagamento: formData.forma_pagamento || null,
          observacoes_venda: formData.observacoes_venda || null,
          estado: formData.estado,
          cidade: formData.cidade,
          bairro: formData.bairro,
          cep: formData.cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2') // Formatar CEP
        });

      if (vendaError) throw vendaError;

      // Registrar no histórico
      const { error: historicoError } = await supabase
        .from("lead_atendimento_historico")
        .insert({
          lead_id: id,
          atendente_id: user?.id,
          acao: 'finalizou_venda',
          status_anterior: 2,
          status_novo: 5
        });

      if (historicoError) throw historicoError;

      toast({
        title: "Sucesso",
        description: "Venda finalizada com sucesso!",
      });

      navigate(`/dashboard/leads/${id}`);
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao finalizar venda",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCep = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 5) {
      return cleanValue;
    }
    return cleanValue.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCep = formatCep(e.target.value);
    setFormData({ ...formData, cep: formattedCep });
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
          <h1 className="text-3xl font-bold text-foreground">Formalizar Venda</h1>
          <p className="text-muted-foreground">Lead: {lead.nome}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Lead</CardTitle>
            <CardDescription>
              Dados do cliente e produto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
              <p className="text-sm">{lead.nome}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-sm">{lead.email || "-"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
              <p className="text-sm">{lead.telefone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Cidade</Label>
              <p className="text-sm">{lead.cidade || "-"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Tipo de Porta</Label>
              <p className="text-sm">{lead.tipo_porta || "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Altura</Label>
                <p className="text-sm">{lead.altura_porta || "-"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Largura</Label>
                <p className="text-sm">{lead.largura_porta || "-"}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Cor</Label>
              <p className="text-sm">{lead.cor_porta || "-"}</p>
            </div>
            {lead.valor_orcamento && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Valor do Orçamento</Label>
                <p className="text-sm">
                  R$ {lead.valor_orcamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Venda</CardTitle>
              <CardDescription>
                Preencha os dados para formalizar a venda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="valor_venda">Valor da Venda *</Label>
                  <Input
                    id="valor_venda"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.valor_venda}
                    onChange={(e) => setFormData({ ...formData, valor_venda: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                      <SelectItem value="financiamento">Financiamento</SelectItem>
                      <SelectItem value="parcelado">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="observacoes_venda">Observações da Venda</Label>
                  <Textarea
                    id="observacoes_venda"
                    placeholder="Observações adicionais sobre a venda..."
                    value={formData.observacoes_venda}
                    onChange={(e) => setFormData({ ...formData, observacoes_venda: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/dashboard/leads/${id}`)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {submitting ? "Finalizando..." : "Finalizar Venda"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localização da Venda *</CardTitle>
              <CardDescription>
                Todos os campos são obrigatórios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estado">Estado *</Label>
                  <Input
                    id="estado"
                    placeholder="Ex: SP"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    placeholder="Ex: São Paulo"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  placeholder="Ex: Vila Madalena"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={handleCepChange}
                  maxLength={9}
                  required
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
