import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2 } from "lucide-react";
import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const companySchema = z.object({
  id: z.string(),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  cidade: z.string().min(3, 'Cidade deve ter pelo menos 3 caracteres'),
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX'),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  site: z.string().url('URL inválida').or(z.literal('')).optional()
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanySettings() {
  const { settings, isLoading, updateSettings, isUpdating } = useCompanySettings();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema)
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = (data: CompanyFormData) => {
    updateSettings(data);
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Configurações da Empresa
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as informações da empresa utilizadas nos contratos e documentos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
          <CardDescription>
            Estas informações serão utilizadas automaticamente na geração de contratos
            {settings?.updated_at && (
              <span className="block mt-1 text-xs">
                Última atualização: {format(new Date(settings.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome da Empresa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder="Nome completo da empresa"
                />
                {errors.nome && (
                  <p className="text-sm text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">
                  CNPJ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cnpj"
                  {...register('cnpj')}
                  placeholder="00.000.000/0000-00"
                  onChange={(e) => {
                    e.target.value = formatCNPJ(e.target.value);
                  }}
                />
                {errors.cnpj && (
                  <p className="text-sm text-destructive">{errors.cnpj.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">
                  Endereço Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endereco"
                  {...register('endereco')}
                  placeholder="Rua, número, complemento"
                />
                {errors.endereco && (
                  <p className="text-sm text-destructive">{errors.endereco.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">
                  Cidade/Estado <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cidade"
                  {...register('cidade')}
                  placeholder="Cidade - UF"
                />
                {errors.cidade && (
                  <p className="text-sm text-destructive">{errors.cidade.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">
                  CEP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cep"
                  {...register('cep')}
                  placeholder="00000-000"
                  onChange={(e) => {
                    e.target.value = formatCEP(e.target.value);
                  }}
                />
                {errors.cep && (
                  <p className="text-sm text-destructive">{errors.cep.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  placeholder="(00) 0000-0000"
                />
                {errors.telefone && (
                  <p className="text-sm text-destructive">{errors.telefone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="contato@empresa.com.br"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="site">Site</Label>
                <Input
                  id="site"
                  {...register('site')}
                  placeholder="https://www.empresa.com.br"
                />
                {errors.site && (
                  <p className="text-sm text-destructive">{errors.site.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
