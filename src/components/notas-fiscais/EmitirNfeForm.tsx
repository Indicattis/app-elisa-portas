import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EmitirNfeForm() {
  const { emitirNfe, isEmitindoNfe } = useNotasFiscais();
  
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
    valor_total: 0,
    natureza_operacao: "Venda de mercadoria",
    items: [] as any[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cnpj_cpf || !formData.razao_social) {
      toast.error("Preencha os dados do destinatário");
      return;
    }

    if (formData.valor_total <= 0) {
      toast.error("Informe o valor da nota");
      return;
    }

    emitirNfe(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Destinatário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">CPF/CNPJ *</Label>
              <Input
                value={formData.cnpj_cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj_cpf: e.target.value }))}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Razão Social *</Label>
              <Input
                value={formData.razao_social}
                onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CEP</Label>
              <Input
                value={formData.cep}
                onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Número</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bairro</Label>
              <Input
                value={formData.bairro}
                onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cidade</Label>
              <Input
                value={formData.cidade}
                onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">UF</Label>
              <Input
                value={formData.uf}
                onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                maxLength={2}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da Nota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Natureza da Operação</Label>
            <Input
              value={formData.natureza_operacao}
              onChange={(e) => setFormData(prev => ({ ...prev, natureza_operacao: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valor Total (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_total}
              onChange={(e) => setFormData(prev => ({ ...prev, valor_total: parseFloat(e.target.value) || 0 }))}
              required
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isEmitindoNfe}>
          {isEmitindoNfe ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Emitindo...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Emitir NF-e
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
