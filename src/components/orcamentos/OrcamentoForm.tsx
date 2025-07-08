import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { calcularValorTotal } from "@/utils/orcamentoUtils";
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
  requer_analise: boolean;
}

interface OrcamentoFormProps {
  leads: Lead[];
  formData: OrcamentoFormData;
  setFormData: (data: OrcamentoFormData) => void;
  camposPersonalizados: Array<{ nome: string; valor: string }>;
  setCamposPersonalizados: (campos: Array<{ nome: string; valor: string }>) => void;
  onSubmit: (valorTotal: number) => Promise<any>;
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
  const handleFormChange = (field: keyof OrcamentoFormData, value: string | number | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const addCampoPersonalizado = () => {
    setCamposPersonalizados([...camposPersonalizados, { nome: "", valor: "0" }]);
  };

  const updateCampoPersonalizado = (index: number, field: "nome" | "valor", value: string) => {
    setCamposPersonalizados(
      camposPersonalizados.map((campo, i) => i === index ? { ...campo, [field]: value } : campo)
    );
  };

  const removeCampoPersonalizado = (index: number) => {
    setCamposPersonalizados(camposPersonalizados.filter((_, i) => i !== index));
  };

  const valorTotal = calcularValorTotal(
    formData.valor_produto,
    formData.valor_pintura,
    formData.valor_frete,
    formData.valor_instalacao,
    camposPersonalizados,
    formData.desconto_percentual
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(valorTotal);
  };

  return (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requer_analise"
                  checked={formData.requer_analise}
                  onCheckedChange={(checked) => handleFormChange("requer_analise", checked)}
                />
                <Label htmlFor="requer_analise">Requer Análise da Gerência</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Marque esta opção se precisar de aprovação para desconto acima de 10%
              </p>
            </div>
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
            {formData.requer_analise && (
              <div className="text-sm text-yellow-600 mt-2">
                ⚠️ Este orçamento será enviado para análise da gerência
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Orçamento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}