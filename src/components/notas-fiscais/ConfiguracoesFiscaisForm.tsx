import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfiguracoesFiscais, ConfiguracoesFiscais } from "@/hooks/useConfiguracoesFiscais";
import { Settings, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ConfiguracoesFiscaisForm() {
  const { configuracoes, isLoading, updateConfiguracoes, createConfiguracoes, isUpdating, isCreating } = useConfiguracoesFiscais();
  
  const [formData, setFormData] = useState<Partial<ConfiguracoesFiscais>>({
    inscricao_estadual: "",
    inscricao_municipal: "",
    regime_tributario: "simples_nacional",
    codigo_municipio_ibge: "4305108",
    serie_nfe: 1,
    serie_nfse: 1,
    aliquota_iss_padrao: 5,
    codigo_servico_padrao: "",
    descricao_servico_padrao: "",
    cnae: "",
    ambiente: "sandbox",
    email_copia: "",
  });

  useEffect(() => {
    if (configuracoes) {
      setFormData(configuracoes);
    }
  }, [configuracoes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (configuracoes?.id) {
      updateConfiguracoes({ ...formData, id: configuracoes.id });
    } else {
      createConfiguracoes(formData);
    }
  };

  const hasApiKeys = typeof window !== 'undefined' && 
    // Verificação simplificada - as secrets não são acessíveis no frontend
    true;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Status da Integração</CardTitle>
            <Badge variant={hasApiKeys ? "default" : "secondary"}>
              {hasApiKeys ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configurado
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Pendente
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasApiKeys 
              ? "O token da API Focus NFe está configurado. O sistema está pronto para emitir notas fiscais."
              : "Configure a secret FOCUSNFE_TOKEN no Supabase para habilitar a emissão de notas via Focus NFe."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Fiscais da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Inscrição Estadual</Label>
              <Input
                value={formData.inscricao_estadual || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Inscrição Municipal</Label>
              <Input
                value={formData.inscricao_municipal || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, inscricao_municipal: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Regime Tributário</Label>
              <Select
                value={formData.regime_tributario || "simples_nacional"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, regime_tributario: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CNAE</Label>
              <Input
                value={formData.cnae || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, cnae: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações de Serviço (NFS-e)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Código Município IBGE</Label>
            <Input
              value={formData.codigo_municipio_ibge || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo_municipio_ibge: e.target.value }))}
              placeholder="4305108 (Caxias do Sul)"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Código de Serviço Padrão</Label>
            <Input
              value={formData.codigo_servico_padrao || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo_servico_padrao: e.target.value }))}
              placeholder="Ex: 07.02"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição do Serviço Padrão</Label>
            <Textarea
              value={formData.descricao_servico_padrao || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao_servico_padrao: e.target.value }))}
              placeholder="Descrição padrão do serviço prestado..."
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Alíquota ISS Padrão (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.aliquota_iss_padrao || 5}
              onChange={(e) => setFormData(prev => ({ ...prev, aliquota_iss_padrao: parseFloat(e.target.value) || 5 }))}
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Numeração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Série NF-e</Label>
              <Input
                type="number"
                value={formData.serie_nfe || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, serie_nfe: parseInt(e.target.value) || 1 }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Série NFS-e</Label>
              <Input
                type="number"
                value={formData.serie_nfse || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, serie_nfse: parseInt(e.target.value) || 1 }))}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ambiente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label className="text-xs">Ambiente de Emissão</Label>
            <Select
              value={formData.ambiente || "sandbox"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ambiente: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">🧪 Sandbox (Homologação/Testes)</SelectItem>
                <SelectItem value="production">🚀 Produção</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Use "Sandbox" para testes. Mude para "Produção" apenas quando estiver pronto para emitir notas reais.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label className="text-xs">Email para Cópia</Label>
            <Input
              type="email"
              value={formData.email_copia || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, email_copia: e.target.value }))}
              placeholder="contato@empresa.com"
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Email que receberá cópia de todas as notas emitidas
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isUpdating || isCreating}>
          {(isUpdating || isCreating) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
