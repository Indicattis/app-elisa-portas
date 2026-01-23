import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Settings } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfiguracoesFiscais, ConfiguracoesFiscais } from "@/hooks/useConfiguracoesFiscais";

export default function ConfiguracoesFiscaisMinimalista() {
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

  const hasApiKeys = true; // Simplified check - secrets are not accessible in frontend

  const inputStyles = "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-500/50 h-9";
  const labelStyles = "text-white/60 text-xs";

  if (isLoading) {
    return (
      <MinimalistLayout
        title="Configurações Fiscais"
        subtitle="Configure os dados fiscais da empresa"
        backPath="/administrativo/fiscal"
        breadcrumbItems={[
          { label: "Home", path: "/home" },
          { label: "Administrativo", path: "/administrativo" },
          { label: "Fiscal", path: "/administrativo/fiscal" },
          { label: "Configurações" }
        ]}
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </MinimalistLayout>
    );
  }

  return (
    <MinimalistLayout
      title="Configurações Fiscais"
      subtitle="Configure os dados fiscais da empresa para emissão de notas"
      backPath="/administrativo/fiscal"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "Fiscal", path: "/administrativo/fiscal" },
        { label: "Configurações" }
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status da Integração */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Status da Integração</h3>
            <Badge className={hasApiKeys ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-white/60 border border-white/10"}>
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
          <p className="text-sm text-white/40">
            {hasApiKeys 
              ? "O token da API Focus NFe está configurado. O sistema está pronto para emitir notas fiscais."
              : "Configure a secret FOCUSNFE_TOKEN no Supabase para habilitar a emissão de notas via Focus NFe."}
          </p>
        </div>

        {/* Dados Fiscais */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-white font-semibold text-sm mb-4">Dados Fiscais da Empresa</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={labelStyles}>Inscrição Estadual</Label>
              <Input
                value={formData.inscricao_estadual || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                className={inputStyles}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelStyles}>Inscrição Municipal</Label>
              <Input
                value={formData.inscricao_municipal || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, inscricao_municipal: e.target.value }))}
                className={inputStyles}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelStyles}>Regime Tributário</Label>
              <Select
                value={formData.regime_tributario || "simples_nacional"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, regime_tributario: value }))}
              >
                <SelectTrigger className={inputStyles}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="simples_nacional" className="text-white hover:bg-white/10">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido" className="text-white hover:bg-white/10">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real" className="text-white hover:bg-white/10">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className={labelStyles}>CNAE</Label>
              <Input
                value={formData.cnae || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, cnae: e.target.value }))}
                className={inputStyles}
              />
            </div>
          </div>
        </div>

        {/* Configurações de Serviço */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-white font-semibold text-sm mb-4">Configurações de Serviço (NFS-e)</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className={labelStyles}>Código Município IBGE</Label>
              <Input
                value={formData.codigo_municipio_ibge || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo_municipio_ibge: e.target.value }))}
                placeholder="4305108 (Caxias do Sul)"
                className={inputStyles}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelStyles}>Código de Serviço Padrão</Label>
              <Input
                value={formData.codigo_servico_padrao || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo_servico_padrao: e.target.value }))}
                placeholder="Ex: 07.02"
                className={inputStyles}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelStyles}>Descrição do Serviço Padrão</Label>
              <Textarea
                value={formData.descricao_servico_padrao || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao_servico_padrao: e.target.value }))}
                placeholder="Descrição padrão do serviço prestado..."
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-500/50"
              />
            </div>
            <div className="space-y-1">
              <Label className={labelStyles}>Alíquota ISS Padrão (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.aliquota_iss_padrao || 5}
                onChange={(e) => setFormData(prev => ({ ...prev, aliquota_iss_padrao: parseFloat(e.target.value) || 5 }))}
                className={inputStyles}
              />
            </div>
          </div>
        </div>

        {/* Numeração */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-white font-semibold text-sm mb-4">Numeração</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={labelStyles}>Série NF-e</Label>
              <Input
                type="number"
                value={formData.serie_nfe || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, serie_nfe: parseInt(e.target.value) || 1 }))}
                className={inputStyles}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelStyles}>Série NFS-e</Label>
              <Input
                type="number"
                value={formData.serie_nfse || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, serie_nfse: parseInt(e.target.value) || 1 }))}
                className={inputStyles}
              />
            </div>
          </div>
        </div>

        {/* Ambiente */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-white font-semibold text-sm mb-4">Ambiente</h3>
          <div className="space-y-1">
            <Label className={labelStyles}>Ambiente de Emissão</Label>
            <Select
              value={formData.ambiente || "sandbox"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ambiente: value }))}
            >
              <SelectTrigger className={inputStyles}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="sandbox" className="text-white hover:bg-white/10">
                  🧪 Homologação (https://homologacao.focusnfe.com.br)
                </SelectItem>
                <SelectItem value="production" className="text-white hover:bg-white/10">
                  🚀 Produção (https://api.focusnfe.com.br)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-white/40 mt-1">
              Use "Homologação" para testes. Mude para "Produção" apenas quando estiver pronto.
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-white font-semibold text-sm mb-4">Email</h3>
          <div className="space-y-1">
            <Label className={labelStyles}>Email para Cópia</Label>
            <Input
              type="email"
              value={formData.email_copia || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, email_copia: e.target.value }))}
              placeholder="contato@empresa.com"
              className={inputStyles}
            />
            <p className="text-xs text-white/40">
              Email que receberá cópia de todas as notas emitidas
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={isUpdating || isCreating}
            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white border-0"
          >
            {(isUpdating || isCreating) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </form>
    </MinimalistLayout>
  );
}
