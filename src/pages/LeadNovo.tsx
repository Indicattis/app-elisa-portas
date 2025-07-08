import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface LeadFormData {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  canal_aquisicao: string;
  tipo_porta: string;
  mensagem: string;
  cor_porta: string;
  largura_porta: string;
  altura_porta: string;
  valor_orcamento: string;
  vendido: boolean;
}

interface VendaFormData {
  valor_venda: string;
  forma_pagamento: string;
  observacoes_venda: string;
}

export default function LeadNovo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [leadData, setLeadData] = useState<LeadFormData>({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    canal_aquisicao: "Google",
    tipo_porta: "",
    mensagem: "",
    cor_porta: "",
    largura_porta: "",
    altura_porta: "",
    valor_orcamento: "",
    vendido: false
  });

  const [vendaData, setVendaData] = useState<VendaFormData>({
    valor_venda: "",
    forma_pagamento: "",
    observacoes_venda: ""
  });

  const handleLeadChange = (field: keyof LeadFormData, value: string | boolean) => {
    setLeadData(prev => ({ ...prev, [field]: value }));
  };

  const handleVendaChange = (field: keyof VendaFormData, value: string) => {
    setVendaData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar o lead
      const leadInsertData = {
        nome: leadData.nome,
        email: leadData.email || null,
        telefone: leadData.telefone,
        cidade: leadData.cidade || null,
        canal_aquisicao: leadData.canal_aquisicao,
        tipo_porta: leadData.tipo_porta || null,
        mensagem: leadData.mensagem || null,
        cor_porta: leadData.cor_porta || null,
        largura_porta: leadData.largura_porta || null,
        altura_porta: leadData.altura_porta || null,
        valor_orcamento: leadData.valor_orcamento ? parseFloat(leadData.valor_orcamento) : null,
        status_atendimento: leadData.vendido ? 5 : 1, // 5 = vendido, 1 = aguardando
        atendente_id: leadData.vendido ? user?.id : null,
        data_inicio_atendimento: leadData.vendido ? new Date().toISOString() : null,
        data_conclusao_atendimento: leadData.vendido ? new Date().toISOString() : null
      };

      const { data: lead, error: leadError } = await supabase
        .from("elisaportas_leads")
        .insert(leadInsertData)
        .select()
        .single();

      if (leadError) throw leadError;

      // Se marcado como vendido, criar a venda
      if (leadData.vendido && vendaData.valor_venda) {
        const { error: vendaError } = await supabase
          .from("vendas")
          .insert({
            lead_id: lead.id,
            atendente_id: user?.id,
            valor_venda: parseFloat(vendaData.valor_venda),
            forma_pagamento: vendaData.forma_pagamento || null,
            observacoes_venda: vendaData.observacoes_venda || null,
            canal_aquisicao: leadData.canal_aquisicao
          });

        if (vendaError) throw vendaError;
      }

      toast({
        title: "Sucesso",
        description: `Lead ${leadData.vendido ? "vendido" : ""} criado com sucesso`,
      });

      navigate("/dashboard/leads");
    } catch (error) {
      console.error("Erro ao criar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar lead",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/leads")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Adicionar Lead</h1>
            <p className="text-muted-foreground">Adicione um novo lead ao sistema</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={leadData.nome}
                    onChange={(e) => handleLeadChange("nome", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={leadData.telefone}
                    onChange={(e) => handleLeadChange("telefone", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={leadData.email}
                  onChange={(e) => handleLeadChange("email", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={leadData.cidade}
                    onChange={(e) => handleLeadChange("cidade", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canal_aquisicao">Canal de Aquisição</Label>
                  <Select value={leadData.canal_aquisicao} onValueChange={(value) => handleLeadChange("canal_aquisicao", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_orcamento">Valor do Orçamento</Label>
                <Input
                  id="valor_orcamento"
                  type="number"
                  step="0.01"
                  value={leadData.valor_orcamento}
                  onChange={(e) => handleLeadChange("valor_orcamento", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  value={leadData.mensagem}
                  onChange={(e) => handleLeadChange("mensagem", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vendido"
                  checked={leadData.vendido}
                  onCheckedChange={(checked) => handleLeadChange("vendido", checked as boolean)}
                />
                <Label htmlFor="vendido">Marcar como vendido</Label>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_porta">Tipo de Porta</Label>
                  <Input
                    id="tipo_porta"
                    value={leadData.tipo_porta}
                    onChange={(e) => handleLeadChange("tipo_porta", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor_porta">Cor da Porta</Label>
                  <Input
                    id="cor_porta"
                    value={leadData.cor_porta}
                    onChange={(e) => handleLeadChange("cor_porta", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="largura_porta">Largura</Label>
                    <Input
                      id="largura_porta"
                      value={leadData.largura_porta}
                      onChange={(e) => handleLeadChange("largura_porta", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="altura_porta">Altura</Label>
                    <Input
                      id="altura_porta"
                      value={leadData.altura_porta}
                      onChange={(e) => handleLeadChange("altura_porta", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {leadData.vendido && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Venda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_venda">Valor da Venda *</Label>
                    <Input
                      id="valor_venda"
                      type="number"
                      step="0.01"
                      value={vendaData.valor_venda}
                      onChange={(e) => handleVendaChange("valor_venda", e.target.value)}
                      required={leadData.vendido}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                    <Select value={vendaData.forma_pagamento} onValueChange={(value) => handleVendaChange("forma_pagamento", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                        <SelectItem value="Parcelado">Parcelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes_venda">Observações da Venda</Label>
                    <Textarea
                      id="observacoes_venda"
                      value={vendaData.observacoes_venda}
                      onChange={(e) => handleVendaChange("observacoes_venda", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/leads")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Lead"}
          </Button>
        </div>
      </form>
    </div>
  );
}