import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EmpresaEmissoraSelector } from "@/components/notas-fiscais/EmpresaEmissoraSelector";

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
          valor_venda
        `)
        .order("created_at", { ascending: false })
        .limit(50);

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
          <div className="space-y-2">
            <Label htmlFor="venda">Selecione a Venda</Label>
            <Select value={selectedVenda} onValueChange={handleVendaSelect}>
              <SelectTrigger id="venda">
                <SelectValue placeholder="Selecione uma venda" />
              </SelectTrigger>
              <SelectContent>
                {vendas?.map((venda) => (
                  <SelectItem key={venda.id} value={venda.id}>
                    {venda.cliente_nome} - {venda.id.substring(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
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
            <div className="space-y-2">
              <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
              <Input
                id="natureza_operacao"
                name="natureza_operacao"
                value={formData.natureza_operacao}
                onChange={handleChange}
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
