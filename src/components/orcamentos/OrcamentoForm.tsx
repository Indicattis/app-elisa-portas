
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, Download } from "lucide-react";
import { ProdutoForm } from "./ProdutoForm";
import { generateOrcamentoPDF } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/types/lead";
import type { OrcamentoProduto } from "@/types/produto";

interface OrcamentoFormProps {
  leads: Lead[];
  formData: any;
  setFormData: (data: any) => void;
  camposPersonalizados: Array<{ nome: string; valor: string }>;
  setCamposPersonalizados: (campos: Array<{ nome: string; valor: string }>) => void;
  onSubmit: (valorTotal: number) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function OrcamentoForm({
  leads,
  formData,
  setFormData,
  camposPersonalizados,
  setCamposPersonalizados,
  onSubmit,
  onCancel,
  loading
}: OrcamentoFormProps) {
  const { toast } = useToast();
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [produtos, setProdutos] = useState<OrcamentoProduto[]>([]);

  // Calcular total sempre que os valores mudarem
  useEffect(() => {
    const produto = parseFloat(formData.valor_produto) || 0;
    const pintura = parseFloat(formData.valor_pintura) || 0;
    const frete = parseFloat(formData.valor_frete) || 0;
    const instalacao = parseFloat(formData.valor_instalacao) || 0;
    const personalizados = camposPersonalizados.reduce((acc, campo) => {
      return acc + (parseFloat(campo.valor) || 0);
    }, 0);
    const valorProdutos = produtos.reduce((acc, prod) => acc + prod.valor, 0);

    const subtotal = produto + pintura + frete + instalacao + personalizados + valorProdutos;
    const total = subtotal; // Removido o desconto - apenas gerente comercial pode aplicar desconto

    setCalculatedTotal(total);
  }, [
    formData.valor_produto,
    formData.valor_pintura,
    formData.valor_frete,
    formData.valor_instalacao,
    camposPersonalizados,
    produtos
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(calculatedTotal);
  };

  const addCampoPersonalizado = () => {
    setCamposPersonalizados([...camposPersonalizados, { nome: "", valor: "" }]);
  };

  const removeCampoPersonalizado = (index: number) => {
    setCamposPersonalizados(camposPersonalizados.filter((_, i) => i !== index));
  };

  const updateCampoPersonalizado = (index: number, field: string, value: string) => {
    const updated = [...camposPersonalizados];
    updated[index] = { ...updated[index], [field]: value };
    setCamposPersonalizados(updated);
  };

  const handleDownloadPDF = () => {
    try {
      const selectedLead = leads.find(lead => lead.id === formData.lead_id);
      if (!selectedLead) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Selecione um lead para gerar o PDF",
        });
        return;
      }

      const pdfData = {
        id: `ORD-${Date.now()}`,
        cliente: {
          nome: selectedLead.nome,
          telefone: selectedLead.telefone,
          email: selectedLead.email || "",
          cidade: selectedLead.cidade || "",
        },
        produtos,
        valor_pintura: parseFloat(formData.valor_pintura) || 0,
        valor_frete: parseFloat(formData.valor_frete) || 0,
        valor_instalacao: parseFloat(formData.valor_instalacao) || 0,
        valor_total: calculatedTotal,
        desconto_percentual: 0, // Desconto removido do formulário
        forma_pagamento: formData.forma_pagamento || "Não informado",
        data_criacao: new Date().toLocaleDateString("pt-BR"),
      };

      generateOrcamentoPDF(pdfData);
      
      toast({
        title: "PDF Gerado",
        description: "O orçamento foi baixado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar o PDF. Tente novamente.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulário de Orçamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead">Lead</Label>
              <Select
                value={formData.lead_id}
                onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lead" />
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
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_vista">À Vista</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="financiamento">Financiamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_produto">Valor do Produto (R$)</Label>
              <Input
                id="valor_produto"
                type="number"
                step="0.01"
                value={formData.valor_produto}
                onChange={(e) => setFormData({ ...formData, valor_produto: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_pintura">Valor da Pintura (R$)</Label>
              <Input
                id="valor_pintura"
                type="number"
                step="0.01"
                value={formData.valor_pintura}
                onChange={(e) => setFormData({ ...formData, valor_pintura: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_frete">Valor do Frete (R$)</Label>
              <Input
                id="valor_frete"
                type="number"
                step="0.01"
                value={formData.valor_frete}
                onChange={(e) => setFormData({ ...formData, valor_frete: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_instalacao">Valor da Instalação (R$)</Label>
              <Input
                id="valor_instalacao"
                type="number"
                step="0.01"
                value={formData.valor_instalacao}
                onChange={(e) => setFormData({ ...formData, valor_instalacao: e.target.value })}
              />
            </div>
          </div>

          <ProdutoForm produtos={produtos} setProdutos={setProdutos} />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Campos Personalizados</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCampoPersonalizado}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Campo
              </Button>
            </div>

            {camposPersonalizados.map((campo, index) => (
              <div key={index} className="flex items-center space-x-2">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCampoPersonalizado(index)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>


          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requer_analise"
                checked={formData.requer_analise}
                onCheckedChange={(checked) => setFormData({ ...formData, requer_analise: checked })}
              />
              <Label htmlFor="requer_analise">Requer análise da gerência</Label>
            </div>

            {formData.requer_analise && (
              <div className="space-y-2">
                <Label htmlFor="motivo_analise">Motivo da Análise *</Label>
                <Textarea
                  id="motivo_analise"
                  placeholder="Descreva o motivo pelo qual este orçamento requer análise..."
                  value={formData.motivo_analise}
                  onChange={(e) => setFormData({ ...formData, motivo_analise: e.target.value })}
                  required={formData.requer_analise}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-lg font-semibold">Total do Orçamento:</span>
            <span className="text-2xl font-bold text-primary">
              R$ {calculatedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={!formData.lead_id}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
            
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar Orçamento"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
