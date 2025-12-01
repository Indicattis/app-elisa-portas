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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EmpresaEmissoraSelector } from "@/components/notas-fiscais/EmpresaEmissoraSelector";
import { VendaSelector } from "@/components/notas-fiscais/VendaSelector";
import { AdicionarNaturezaModal } from "@/components/notas-fiscais/AdicionarNaturezaModal";

const CFOP_OPTIONS = [
  { value: "5102", label: "5102 - Venda de mercadoria (dentro do estado)" },
  { value: "5101", label: "5101 - Venda de produção própria (dentro do estado)" },
  { value: "6102", label: "6102 - Venda de mercadoria (fora do estado)" },
  { value: "6101", label: "6101 - Venda de produção própria (fora do estado)" },
  { value: "5405", label: "5405 - Venda com ST já retido anteriormente" },
  { value: "5403", label: "5403 - Venda com ST retida na operação" },
];

export default function EmitirNfe() {
  const navigate = useNavigate();
  const { emitirNfe, isEmitindoNfe } = useNotasFiscais();
  const [selectedVenda, setSelectedVenda] = useState<string | undefined>();

  const [empresaEmissoraId, setEmpresaEmissoraId] = useState("");
  const [formData, setFormData] = useState({
    cnpj_cpf: "",
    razao_social: "",
    email: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    natureza_operacao: "Venda de mercadoria",
    valor_total: 0,
    cfop: "5102",
    ncm: "",
    informacoes_adicionais: "",
  });

  // Buscar vendas para vincular
  const { data: vendas } = useQuery({
    queryKey: ["vendas-nfe"],
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

  // Buscar naturezas de operação
  const { data: naturezas, refetch: refetchNaturezas } = useQuery({
    queryKey: ["naturezas-operacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("naturezas_operacao")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  const handleVendaSelect = (vendaId: string) => {
    setSelectedVenda(vendaId);
    
    // Preencher dados do destinatário automaticamente
    const venda = vendas?.find(v => v.id === vendaId);
    if (venda) {
      setFormData(prev => ({
        ...prev,
        cnpj_cpf: venda.cpf_cliente || "",
        razao_social: venda.cliente_nome || "",
        email: venda.cliente_email || "",
        bairro: venda.bairro || "",
        cidade: venda.cidade || "",
        uf: venda.estado || "",
        cep: venda.cep || "",
        valor_total: venda.valor_venda || 0,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "valor_total" ? parseFloat(value) || 0 : value,
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
    if (!formData.endereco || formData.endereco.length < 2) {
      toast.error("O endereço é obrigatório e deve ter no mínimo 2 caracteres");
      return;
    }

    if (!formData.bairro || formData.bairro.length < 2) {
      toast.error("O bairro é obrigatório e deve ter no mínimo 2 caracteres");
      return;
    }

    emitirNfe({
      ...formData,
      empresa_emissora_id: empresaEmissoraId,
      venda_id: selectedVenda,
    });
  };

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
            <h1 className="text-2xl font-bold">Emitir NF-e</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Emissão de Nota Fiscal Eletrônica
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
          <h3 className="font-semibold mb-3">Dados do Destinatário</h3>
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
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  minLength={2}
                  required
                  placeholder="Ex: Rua das Flores"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  placeholder="Ex: 123"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  minLength={2}
                  required
                  placeholder="Ex: Centro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  name="uf"
                  value={formData.uf}
                  onChange={handleChange}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                placeholder="00000-000"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Dados da Nota</h3>
          <div className="grid gap-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="natureza_operacao">Natureza da Operação *</Label>
                <Select
                  value={formData.natureza_operacao}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, natureza_operacao: value }))}
                  required
                >
                  <SelectTrigger id="natureza_operacao">
                    <SelectValue placeholder="Selecione a natureza" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {naturezas?.map((natureza) => (
                      <SelectItem key={natureza.id} value={natureza.nome}>
                        {natureza.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AdicionarNaturezaModal onNaturezaAdded={refetchNaturezas} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cfop">CFOP</Label>
                <Select
                  value={formData.cfop}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cfop: value }))}
                >
                  <SelectTrigger id="cfop">
                    <SelectValue placeholder="Selecione o CFOP" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {CFOP_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ncm">NCM</Label>
                <Input
                  id="ncm"
                  name="ncm"
                  value={formData.ncm}
                  onChange={handleChange}
                  placeholder="00000000"
                  maxLength={8}
                />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="informacoes_adicionais">Informações Adicionais</Label>
              <Textarea
                id="informacoes_adicionais"
                name="informacoes_adicionais"
                value={formData.informacoes_adicionais}
                onChange={(e) => setFormData(prev => ({ ...prev, informacoes_adicionais: e.target.value }))}
                placeholder="Informações complementares que aparecerão na nota fiscal..."
                rows={3}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                Máximo 5000 caracteres. {formData.informacoes_adicionais.length}/5000
              </p>
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
          <Button type="submit" disabled={isEmitindoNfe}>
            {isEmitindoNfe ? "Emitindo..." : "Emitir NF-e"}
          </Button>
        </div>
      </form>
    </div>
  );
}
