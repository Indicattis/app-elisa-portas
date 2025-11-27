import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { useConfiguracoesFiscais } from "@/hooks/useConfiguracoesFiscais";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EmitirNfseForm() {
  const { emitirNfse, isEmitindoNfse } = useNotasFiscais();
  const { configuracoes } = useConfiguracoesFiscais();
  
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
    codigo_servico: "",
    descricao_servico: "",
    valor_total: 0,
    aliquota_iss: 5,
  });

  useEffect(() => {
    if (configuracoes) {
      setFormData(prev => ({
        ...prev,
        codigo_servico: configuracoes.codigo_servico_padrao || "",
        descricao_servico: configuracoes.descricao_servico_padrao || "",
        aliquota_iss: configuracoes.aliquota_iss_padrao || 5,
      }));
    }
  }, [configuracoes]);

  const valorIss = (formData.valor_total * formData.aliquota_iss) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cnpj_cpf || !formData.razao_social) {
      toast.error("Preencha os dados do tomador");
      return;
    }

    if (!formData.descricao_servico || formData.valor_total <= 0) {
      toast.error("Preencha os dados do serviço");
      return;
    }

    emitirNfse(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Tomador (Cliente)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">CPF/CNPJ *</Label>
              <Input
                value={formData.cnpj_cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj_cpf: e.target.value }))}
                placeholder="000.000.000-00"
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nome/Razão Social *</Label>
              <Input
                value={formData.razao_social}
                onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@email.com"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CEP</Label>
              <Input
                value={formData.tomador_cep}
                onChange={(e) => setFormData(prev => ({ ...prev, tomador_cep: e.target.value }))}
                placeholder="00000-000"
                className="h-9"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Endereço</Label>
              <Input
                value={formData.tomador_endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, tomador_endereco: e.target.value }))}
                placeholder="Rua, Avenida..."
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Número</Label>
              <Input
                value={formData.tomador_numero}
                onChange={(e) => setFormData(prev => ({ ...prev, tomador_numero: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bairro</Label>
              <Input
                value={formData.tomador_bairro}
                onChange={(e) => setFormData(prev => ({ ...prev, tomador_bairro: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cidade</Label>
              <Input
                value={formData.tomador_cidade}
                onChange={(e) => setFormData(prev => ({ ...prev, tomador_cidade: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">UF</Label>
              <Input
                value={formData.tomador_uf}
                onChange={(e) => setFormData(prev => ({ ...prev, tomador_uf: e.target.value.toUpperCase() }))}
                maxLength={2}
                placeholder="RS"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Código do Serviço Municipal *</Label>
            <Input
              value={formData.codigo_servico}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo_servico: e.target.value }))}
              placeholder="Ex: 07.02"
              required
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição do Serviço *</Label>
            <Textarea
              value={formData.descricao_servico}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao_servico: e.target.value }))}
              placeholder="Descreva o serviço prestado..."
              required
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Valor do Serviço (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_total: parseFloat(e.target.value) || 0 }))}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Alíquota ISS (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.aliquota_iss}
                onChange={(e) => setFormData(prev => ({ ...prev, aliquota_iss: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor ISS (R$)</Label>
              <Input
                value={valorIss.toFixed(2)}
                disabled
                className="h-9 bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isEmitindoNfse}>
          {isEmitindoNfse ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Emitindo...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Emitir NFS-e
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
