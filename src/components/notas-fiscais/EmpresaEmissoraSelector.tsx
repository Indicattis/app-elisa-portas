import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Building2, AlertCircle } from "lucide-react";
import { useEmpresasEmissoras } from "@/hooks/useEmpresasEmissoras";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface EmpresaEmissoraSelectorProps {
  value: string;
  onChange: (empresaId: string) => void;
}

export function EmpresaEmissoraSelector({ value, onChange }: EmpresaEmissoraSelectorProps) {
  const { empresas, isLoading } = useEmpresasEmissoras();

  const empresasAtivas = empresas?.filter(e => e.ativo) || [];
  const empresaSelecionada = empresasAtivas.find(e => e.id === value);

  // Auto-seleciona se houver apenas uma empresa
  useEffect(() => {
    if (empresasAtivas.length === 1 && !value) {
      onChange(empresasAtivas[0].id);
    }
  }, [empresasAtivas, value, onChange]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (empresasAtivas.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma empresa emissora ativa encontrada. Configure uma empresa em Admin → Empresas Emissoras.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="space-y-2">
        <Label htmlFor="empresa-emissora">Empresa Emissora *</Label>
        <Select value={value} onValueChange={onChange} disabled={empresasAtivas.length === 1}>
          <SelectTrigger id="empresa-emissora">
            <SelectValue placeholder="Selecione a empresa emissora" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {empresasAtivas.map((empresa) => (
              <SelectItem key={empresa.id} value={empresa.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {empresa.titulo || empresa.nome}
                  {empresa.padrao && <span className="text-yellow-500">⭐</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {empresaSelecionada && (
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">CNPJ:</span>
            <span className="font-medium">{empresaSelecionada.cnpj}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Ambiente:</span>
            <Badge variant={empresaSelecionada.ambiente === 'production' ? 'default' : 'secondary'}>
              {empresaSelecionada.ambiente === 'production' ? '🟢 Produção' : '🟡 Homologação'}
            </Badge>
          </div>
          {empresaSelecionada.inscricao_estadual && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">IE:</span>
              <span>{empresaSelecionada.inscricao_estadual}</span>
            </div>
          )}
          {empresaSelecionada.inscricao_municipal && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">IM:</span>
              <span>{empresaSelecionada.inscricao_municipal}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
