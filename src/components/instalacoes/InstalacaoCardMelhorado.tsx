import { InstalacaoCadastrada } from "@/hooks/useInstalacoesCadastradas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, Package, User, Building2 } from "lucide-react";
import { SelecionarResponsavelMenu } from "./SelecionarResponsavelMenu";

interface InstalacaoCardMelhoradoProps {
  instalacao: InstalacaoCadastrada;
  onEdit?: (instalacao: InstalacaoCadastrada) => void;
  onDelete?: (id: string) => void;
  corEquipe?: string;
}

export const InstalacaoCardMelhorado = ({ 
  instalacao, 
  onEdit, 
  onDelete,
  corEquipe 
}: InstalacaoCardMelhoradoProps) => {
  const backgroundColor = corEquipe 
    ? `${corEquipe}15` 
    : 'transparent';
  
  const borderColor = corEquipe || 'hsl(var(--border))';

  // Determinar o responsável a ser exibido
  const getResponsavelDisplay = () => {
    if (!instalacao.responsavel_instalacao_nome) {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          <User className="h-2.5 w-2.5 mr-1" />
          Sem responsável
        </Badge>
      );
    }

    const isEquipeInterna = instalacao.tipo_instalacao === 'elisa';
    
    return (
      <Badge 
        variant="secondary" 
        className="text-[10px] px-1.5 py-0"
        style={isEquipeInterna && corEquipe ? { 
          backgroundColor: `${corEquipe}30`,
          borderColor: corEquipe 
        } : undefined}
      >
        {isEquipeInterna ? (
          <User className="h-2.5 w-2.5 mr-1" />
        ) : (
          <Building2 className="h-2.5 w-2.5 mr-1" />
        )}
        {instalacao.responsavel_instalacao_nome}
      </Badge>
    );
  };

  return (
    <Card 
      className="w-full h-[70px] hover:shadow-md transition-shadow border"
      style={{ 
        backgroundColor,
        borderColor,
      }}
    >
      <CardContent className="p-2 h-full">
        <div className="flex items-center justify-between gap-2 h-full">
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            {/* Nome do Cliente */}
            <span className="font-medium text-xs text-foreground truncate">
              {instalacao.nome_cliente}
            </span>
            
            {/* Responsável */}
            {getResponsavelDisplay()}

            {/* Cidade */}
            <span className="text-[10px] text-muted-foreground truncate">
              {instalacao.venda?.cidade || '-'}
            </span>
          </div>

          {/* Menu de Ações Melhorado */}
          <SelecionarResponsavelMenu instalacaoId={instalacao.id}>
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </SelecionarResponsavelMenu>
        </div>
      </CardContent>
    </Card>
  );
};
