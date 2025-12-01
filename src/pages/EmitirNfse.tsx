import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConfiguracoesFiscais } from "@/hooks/useConfiguracoesFiscais";
import { toast } from "sonner";
import { EmpresaEmissoraSelector } from "@/components/notas-fiscais/EmpresaEmissoraSelector";
import { VendaSelector } from "@/components/notas-fiscais/VendaSelector";

export default function EmitirNfse() {
  const navigate = useNavigate();
  const { emitirNfse, isEmitindoNfse } = useNotasFiscais();
  const { configuracoes } = useConfiguracoesFiscais();
  const [selectedVenda, setSelectedVenda] = useState<string | undefined>();

  const [empresaEmissoraId, setEmpresaEmissoraId] = useState("");
  const [formData, setFormData] = useState({
    cnpj_cpf: "",
    razao_social: "",
    email: "",
    tomador_endereco: "",
    tomador_numero: "",
    tomador_bairro: "",
    tomador_cidade: "",
    tomador_uf: "",
    tomador_cep: "",
    valor_total: 0,
    codigo_servico: configuracoes?.codigo_servico_padrao || "",
    descricao_servico: configuracoes?.descricao_servico_padrao || "",
    aliquota_iss: configuracoes?.aliquota_iss_padrao || 5,
  });

  // Buscar vendas para vincular (com dados completos)
  const { data: vendas } = useQuery({
    queryKey: ["vendas-nfse"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select(`
          id,
          cliente_nome,
          cpf_cliente,
          cliente_email,
          cidade,
          estado,
          cep,
          bairro,
          valor_venda,
          forma_pagamento,
          data_venda,
          produtos_vendas:produtos_vendas(id)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const handleVendaSelect = (vendaId: string) => {
    setSelectedVenda(vendaId);
    
    // Preencher dados do tomador automaticamente
    const venda = vendas?.find(v => v.id === vendaId);
    if (venda) {
      setFormData(prev => ({
        ...prev,
        cnpj_cpf: venda.cpf_cliente || "",
        razao_social: venda.cliente_nome || "",
        email: venda.cliente_email || "",
        tomador_bairro: venda.bairro || "",
        tomador_cidade: venda.cidade || "",
        tomador_uf: venda.estado || "",
        tomador_cep: venda.cep || "",
        valor_total: venda.valor_venda || 0,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "valor_total" || name === "aliquota_iss" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresaEmissoraId) {
      toast.error("Selecione a empresa emissora");
      return;
    }

    if (!formData.cnpj_cpf || !formData.razao_social || !formData.valor_total) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validação de campos de endereço obrigatórios
    if (!formData.tomador_endereco || formData.tomador_endereco.length < 2) {
      toast.error("O endereço é obrigatório e deve ter no mínimo 2 caracteres");
      return;
    }

    if (!formData.tomador_bairro || formData.tomador_bairro.length < 2) {
      toast.error("O bairro é obrigatório e deve ter no mínimo 2 caracteres");
      return;
    }

    emitirNfse({
      ...formData,
      empresa_emissora_id: empresaEmissoraId,
      venda_id: selectedVenda,
    });
  };

  const valorIss = formData.valor_total * (formData.aliquota_iss / 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/administrativo/financeiro/notas-fiscais")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Emitir NFS-e</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Emissão de Nota Fiscal de Serviço Eletrônica
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <EmpresaEmissoraSelector 
          value={empresaEmissoraId}
          onChange={setEmpresaEmissoraId}
        />

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Vincular a Venda (Opcional)</h3>
          <VendaSelector
            vendas={vendas}
            selectedVenda={selectedVenda}
            onSelect={handleVendaSelect}
          />
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Dados do Tomador</h3>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj_cpf">CPF/CNPJ *</Label>
                <Input
                  id="cnpj_cpf"
                  name="cnpj_cpf"
                  value={formData.cnpj_cpf}
                  onChange={handleChange}
                  required
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social *</Label>
                <Input
                  id="razao_social"
                  name="razao_social"
                  value={formData.razao_social}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="tomador_endereco">Endereço *</Label>
                <Input
                  id="tomador_endereco"
                  name="tomador_endereco"
                  value={formData.tomador_endereco}
                  onChange={handleChange}
                  minLength={2}
                  required
                  placeholder="Ex: Rua das Flores"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tomador_numero">Número</Label>
                <Input
                  id="tomador_numero"
                  name="tomador_numero"
                  value={formData.tomador_numero}
                  onChange={handleChange}
                  placeholder="Ex: 123"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tomador_bairro">Bairro *</Label>
                <Input
                  id="tomador_bairro"
                  name="tomador_bairro"
                  value={formData.tomador_bairro}
                  onChange={handleChange}
                  minLength={2}
                  required
                  placeholder="Ex: Centro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tomador_cidade">Cidade</Label>
                <Input
                  id="tomador_cidade"
                  name="tomador_cidade"
                  value={formData.tomador_cidade}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tomador_uf">UF</Label>
                <Input
                  id="tomador_uf"
                  name="tomador_uf"
                  value={formData.tomador_uf}
                  onChange={handleChange}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tomador_cep">CEP</Label>
              <Input
                id="tomador_cep"
                name="tomador_cep"
                value={formData.tomador_cep}
                onChange={handleChange}
                placeholder="00000-000"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Dados do Serviço</h3>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_servico">Código do Serviço</Label>
                <Input
                  id="codigo_servico"
                  name="codigo_servico"
                  value={formData.codigo_servico}
                  onChange={handleChange}
                  placeholder="Ex: 07.02"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_total">Valor Total *</Label>
                <Input
                  id="valor_total"
                  name="valor_total"
                  type="number"
                  step="0.01"
                  value={formData.valor_total}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_servico">Descrição do Serviço</Label>
              <Textarea
                id="descricao_servico"
                name="descricao_servico"
                value={formData.descricao_servico}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aliquota_iss">Alíquota ISS (%)</Label>
                <Input
                  id="aliquota_iss"
                  name="aliquota_iss"
                  type="number"
                  step="0.01"
                  value={formData.aliquota_iss}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor ISS Calculado</Label>
                <Input value={`R$ ${valorIss.toFixed(2)}`} disabled />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard/administrativo/financeiro/notas-fiscais")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isEmitindoNfse}>
            {isEmitindoNfse ? "Emitindo..." : "Emitir NFS-e"}
          </Button>
        </div>
      </form>
    </div>
  );
}
