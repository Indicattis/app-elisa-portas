import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
}

const canaisAquisicao = [
  "Google",
  "Indicação", 
  "Meta",
  "LinkedIn",
  "Cliente fidelizado"
];

export default function VendaNova() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("lead");
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    valor_venda: "",
    forma_pagamento: "",
    observacoes_venda: "",
    canal_aquisicao: "Google",
    estado: "",
    cidade: "",
    bairro: "",
    cep: ""
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (leadId) {
      fetchLead();
    }
  }, [leadId]);

  const fetchLead = async () => {
    if (!leadId) return;
    
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select("id, nome, email, telefone, cidade")
        .eq("id", leadId)
        .single();

      if (error) throw error;
      setLead(data);
      
      // Pré-preencher cidade se disponível
      if (data.cidade) {
        setFormData(prev => ({ ...prev, cidade: data.cidade }));
      }
    } catch (error) {
      console.error("Erro ao buscar lead:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados do lead",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado",
      });
      return;
    }

    setLoading(true);

    try {
      const vendaData = {
        lead_id: leadId,
        atendente_id: user.id,
        valor_venda: parseFloat(formData.valor_venda),
        forma_pagamento: formData.forma_pagamento || null,
        observacoes_venda: formData.observacoes_venda || null,
        canal_aquisicao: formData.canal_aquisicao,
        estado: formData.estado,
        cidade: formData.cidade,
        bairro: formData.bairro,
        cep: formData.cep
      };

      const { error } = await supabase
        .from("vendas")
        .insert(vendaData);

      if (error) throw error;

      // Se associado a um lead, atualizar status do lead para vendido
      if (leadId) {
        await supabase
          .from("elisaportas_leads")
          .update({ status_atendimento: 5 })
          .eq("id", leadId);
      }

      toast({
        title: "Sucesso",
        description: "Venda cadastrada com sucesso",
      });

      navigate("/dashboard/faturamento");
    } catch (error) {
      console.error("Erro ao cadastrar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cadastrar venda",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleValueChange = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, valor_venda: numbers }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Venda</h1>
          <p className="text-muted-foreground">Cadastrar uma nova venda no sistema</p>
        </div>
      </div>

      {lead && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nome:</strong> {lead.nome}</div>
              <div><strong>Email:</strong> {lead.email}</div>
              <div><strong>Telefone:</strong> {lead.telefone}</div>
              <div><strong>Cidade:</strong> {lead.cidade}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_venda">Valor da Venda *</Label>
                <Input
                  id="valor_venda"
                  placeholder="R$ 0,00"
                  value={formData.valor_venda ? formatCurrency(formData.valor_venda) : ""}
                  onChange={(e) => handleValueChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Input
                  id="forma_pagamento"
                  placeholder="Ex: PIX, Cartão, Boleto"
                  value={formData.forma_pagamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="canal_aquisicao">Canal de Aquisição *</Label>
                <Select
                  value={formData.canal_aquisicao}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, canal_aquisicao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {canaisAquisicao.map((canal) => (
                      <SelectItem key={canal} value={canal}>
                        {canal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  placeholder="Ex: SP"
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  placeholder="Nome da cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  placeholder="Nome do bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes_venda">Observações</Label>
              <Textarea
                id="observacoes_venda"
                placeholder="Observações sobre a venda..."
                value={formData.observacoes_venda}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes_venda: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Cadastrar Venda"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}