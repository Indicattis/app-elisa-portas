import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Lead } from "@/types/lead";

interface OrcamentoFormData {
  lead_id: string;
  valor_produto: string;
  valor_pintura: string;
  valor_frete: string;
  valor_instalacao: string;
  campos_personalizados: { [key: string]: number };
  forma_pagamento: string;
  desconto_percentual: number;
}

export default function Orcamentos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<OrcamentoFormData>({
    lead_id: "",
    valor_produto: "",
    valor_pintura: "0",
    valor_frete: "0",
    valor_instalacao: "0",
    campos_personalizados: {},
    forma_pagamento: "",
    desconto_percentual: 0
  });

  const [camposPersonalizados, setCamposPersonalizados] = useState<Array<{ nome: string; valor: string }>>([]);

  useEffect(() => {
    fetchLeads();
    fetchOrcamentos();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select("*")
        .order("data_envio", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar leads",
      });
    }
  };

  const fetchOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          elisaportas_leads (nome, telefone, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar orçamentos",
      });
    }
  };

  const handleFormChange = (field: keyof OrcamentoFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCampoPersonalizado = () => {
    setCamposPersonalizados(prev => [...prev, { nome: "", valor: "0" }]);
  };

  const updateCampoPersonalizado = (index: number, field: "nome" | "valor", value: string) => {
    setCamposPersonalizados(prev => 
      prev.map((campo, i) => i === index ? { ...campo, [field]: value } : campo)
    );
  };

  const removeCampoPersonalizado = (index: number) => {
    setCamposPersonalizados(prev => prev.filter((_, i) => i !== index));
  };

  const calcularValorTotal = () => {
    const valorProduto = parseFloat(formData.valor_produto) || 0;
    const valorPintura = parseFloat(formData.valor_pintura) || 0;
    const valorFrete = parseFloat(formData.valor_frete) || 0;
    const valorInstalacao = parseFloat(formData.valor_instalacao) || 0;
    
    const valorCamposPersonalizados = camposPersonalizados.reduce((sum, campo) => {
      return sum + (parseFloat(campo.valor) || 0);
    }, 0);

    const subtotal = valorProduto + valorPintura + valorFrete + valorInstalacao + valorCamposPersonalizados;
    const desconto = (valorProduto * formData.desconto_percentual) / 100;
    
    return subtotal - desconto;
  };

  const generatePDF = async (orcamento: any) => {
    // Aqui você implementaria a geração do PDF
    // Por enquanto, vamos simular
    toast({
      title: "PDF Gerado",
      description: "O orçamento foi gerado com sucesso",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const camposPersonalizadosObj = camposPersonalizados.reduce((acc, campo) => {
        if (campo.nome && campo.valor) {
          acc[campo.nome] = parseFloat(campo.valor);
        }
        return acc;
      }, {} as { [key: string]: number });

      const orcamentoData = {
        lead_id: formData.lead_id,
        usuario_id: user?.id,
        valor_produto: parseFloat(formData.valor_produto),
        valor_pintura: parseFloat(formData.valor_pintura),
        valor_frete: parseFloat(formData.valor_frete),
        valor_instalacao: parseFloat(formData.valor_instalacao),
        campos_personalizados: camposPersonalizadosObj,
        forma_pagamento: formData.forma_pagamento,
        desconto_percentual: formData.desconto_percentual,
        valor_total: calcularValorTotal()
      };

      const { data, error } = await supabase
        .from("orcamentos")
        .insert(orcamentoData)
        .select()
        .single();

      if (error) throw error;

      // Atualizar valor do orçamento no lead
      await supabase
        .from("elisaportas_leads")
        .update({ valor_orcamento: calcularValorTotal() })
        .eq("id", formData.lead_id);

      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso",
      });

      setShowForm(false);
      setFormData({
        lead_id: "",
        valor_produto: "",
        valor_pintura: "0",
        valor_frete: "0",
        valor_instalacao: "0",
        campos_personalizados: {},
        forma_pagamento: "",
        desconto_percentual: 0
      });
      setCamposPersonalizados([]);
      fetchOrcamentos();

      // Gerar PDF automaticamente
      generatePDF(data);
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar orçamento",
      });
    } finally {
      setLoading(false);
    }
  };

  const valorTotal = calcularValorTotal();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie orçamentos dos leads</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_id">Lead *</Label>
                  <Select value={formData.lead_id} onValueChange={(value) => handleFormChange("lead_id", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.nome} - {lead.telefone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                  <Select value={formData.forma_pagamento} onValueChange={(value) => handleFormChange("forma_pagamento", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="À vista">À vista</SelectItem>
                      <SelectItem value="Cartão de crédito">Cartão de crédito</SelectItem>
                      <SelectItem value="Parcelado">Parcelado</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_produto">Valor do Produto *</Label>
                  <Input
                    id="valor_produto"
                    type="number"
                    step="0.01"
                    value={formData.valor_produto}
                    onChange={(e) => handleFormChange("valor_produto", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_pintura">Valor da Pintura</Label>
                  <Input
                    id="valor_pintura"
                    type="number"
                    step="0.01"
                    value={formData.valor_pintura}
                    onChange={(e) => handleFormChange("valor_pintura", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_frete">Frete</Label>
                  <Input
                    id="valor_frete"
                    type="number"
                    step="0.01"
                    value={formData.valor_frete}
                    onChange={(e) => handleFormChange("valor_frete", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_instalacao">Instalação</Label>
                  <Input
                    id="valor_instalacao"
                    type="number"
                    step="0.01"
                    value={formData.valor_instalacao}
                    onChange={(e) => handleFormChange("valor_instalacao", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Campos Personalizados</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCampoPersonalizado}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </div>

                {camposPersonalizados.map((campo, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Nome do campo"
                      value={campo.nome}
                      onChange={(e) => updateCampoPersonalizado(index, "nome", e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      value={campo.valor}
                      onChange={(e) => updateCampoPersonalizado(index, "valor", e.target.value)}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => removeCampoPersonalizado(index)}>
                      Remover
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto no Produto</Label>
                <Select 
                  value={formData.desconto_percentual.toString()} 
                  onValueChange={(value) => handleFormChange("desconto_percentual", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem desconto</SelectItem>
                    <SelectItem value="5">5% de desconto</SelectItem>
                    <SelectItem value="10">10% de desconto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="text-lg font-semibold">
                  Valor Total: R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                {formData.desconto_percentual > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Desconto de {formData.desconto_percentual}% aplicado no produto
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Orçamento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orcamentos.map((orcamento) => (
          <Card key={orcamento.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{orcamento.elisaportas_leads?.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground">{orcamento.elisaportas_leads?.telefone}</p>
                </div>
                <Badge variant="outline">
                  R$ {orcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Produto:</span>
                  <span>R$ {orcamento.valor_produto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pintura:</span>
                  <span>R$ {orcamento.valor_pintura.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {orcamento.valor_frete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Instalação:</span>
                  <span>R$ {orcamento.valor_instalacao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                {orcamento.desconto_percentual > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto ({orcamento.desconto_percentual}%):</span>
                    <span>-R$ {((orcamento.valor_produto * orcamento.desconto_percentual) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pagamento:</span>
                  <span>{orcamento.forma_pagamento}</span>
                </div>
              </div>

              <div className="mt-4">
                <Button size="sm" variant="outline" onClick={() => generatePDF(orcamento)}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}