import { Building2, MapPin, Star, Settings, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmpresaEmissora } from "@/types/empresaEmissora";

interface EmpresaEmissoraCardProps {
  empresa: EmpresaEmissora;
  onEdit: (empresa: EmpresaEmissora) => void;
  onSetPadrao: (id: string) => void;
  isSettingPadrao: boolean;
}

export function EmpresaEmissoraCard({ 
  empresa, 
  onEdit, 
  onSetPadrao,
  isSettingPadrao 
}: EmpresaEmissoraCardProps) {
  const getAmbienteBadge = () => {
    if (!empresa.focusnfe_token) {
      return <Badge variant="outline" className="gap-1"><X className="w-3 h-3" /> Token não configurado</Badge>;
    }
    
    if (empresa.ambiente === 'producao') {
      return <Badge variant="default" className="gap-1 bg-green-500"><Check className="w-3 h-3" /> Produção</Badge>;
    }
    
    return <Badge variant="secondary" className="gap-1"><Settings className="w-3 h-3" /> Homologação</Badge>;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{empresa.nome}</h3>
                {empresa.padrao && (
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                CNPJ: {empresa.cnpj}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{empresa.cidade} - {empresa.estado}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {getAmbienteBadge()}
          {empresa.ativo ? (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
              <Check className="w-3 h-3" /> Ativa
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <X className="w-3 h-3" /> Inativa
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(empresa)}
            className="flex-1"
          >
            Editar
          </Button>
          {!empresa.padrao && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetPadrao(empresa.id)}
              disabled={isSettingPadrao}
              className="flex-1"
            >
              <Star className="w-3 h-3 mr-1" />
              Definir como Padrão
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
