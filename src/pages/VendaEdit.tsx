
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import type { Tables } from "@/integrations/supabase/types";

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

export default function VendaEdit() {
  const { id } = useParams<{ id: string }>();
  const [venda, setVenda] = useState<Tables<"vendas"> | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    valor_venda: "",
    forma_pagamento: "",
    observacoes_venda: "",
    canal_aquisicao: "Google",
    data_venda: "",
    estado: "",
    cidade: "",
    bairro: "",
    cep: ""
  });

  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVenda();
    }
  }, [id]);

  useEffect(() => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas administradores podem editar vendas",
      });
      navigate("/dashboard/faturamento");
    }
  }, [isAdmin, navigate, toast]);

  const fetchVenda = async () => {
    if (!id) return;
    
    try {
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", id)
        .single();

      if (vendaError) throw vendaError;
      
      setVenda(vendaData);
      setFormData({
        valor_venda: (vendaData.valor_venda * 100).toString(),
        forma_pagamento: vendaData.forma_pagamento || "",
        observacoes_venda: vendaData.observacoes_venda || "",
        canal_aquisicao: vendaData.canal_aquisicao || "Google",
        data_venda: new Date(vendaData.data_venda).toISOString().slice(0, 16),
        estado: vendaData.estado || "",
        cidade: vendaData.cidade || "",
        bairro: vendaData.bairro || "",
        cep: vendaData.cep || ""
      });

      // Buscar dados do lead
      if (vendaData.lead_id) {
        const { data: leadData, error: leadError } = await supabase
          .from("elisaportas_leads")
          .select("id, nome, email, telefone, cidade")
          .eq("id", vendaData.lead_id)
          .single();

        if (!leadError && leadData) {
          setLead(leadData);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados da venda",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    setLoading(true);

    try {
      const updateData = {
        valor_venda: parseFloat(formData.valor_venda) / 100,
        forma_pagamento: formData.forma_pagamento || null,
        observacoes_venda: formData.observacoes_venda || null,
        canal_aquisicao: formData.canal_aquisicao,
        data_venda: new Date(formData.data_venda).toISOString(),
        estado: formData.estado || null,
        cidade: formData.cidade || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null
      };

      const { error } = await supabase
        .from("vendas")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Venda atualizada com sucesso",
      });

      navigate("/dashboard/faturamento");
    } catch (error) {
      console.error("Erro ao atualizar venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar venda",
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

  if (!isAdmin) {
    return null;
  }

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
          <h1 className="text-3xl font-bold text-foreground">Editar Venda</h1>
          <p className="text-muted-foreground">Editar dados da venda</p>
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

              <div className="space-y-2">
                <Label htmlFor="data_venda">Data da Venda *</Label>
                <Input
                  id="data_venda"
                  type="datetime-local"
                  value={formData.data_venda}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_venda: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="Ex: SP"
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Nome da cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  placeholder="Nome do bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
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
                {loading ? "Salvando..." : "Atualizar Venda"}
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
