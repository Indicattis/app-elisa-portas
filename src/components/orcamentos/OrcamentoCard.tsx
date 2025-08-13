import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Edit, Star } from "lucide-react";
import { generateOrcamentoPDF } from "@/utils/orcamentoPDFGenerator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { OrcamentoClasse } from "@/types/orcamento";

interface OrcamentoCardProps {
  orcamento: any;
  onEdit?: (orcamento: any) => void;
  onStatusChange?: (orcamento: any) => void;
}

const ORCAMENTO_STATUS = {
  1: "Em aberto",
  2: "Congelado", 
  3: "Perdido",
  4: "Vendido",
  5: "Venda reprovada"
};

const ORCAMENTO_CLASSES: OrcamentoClasse = {
  1: { label: "Classe 1", color: "muted", range: "R$ 0 - 20.000" },
  2: { label: "Classe 2", color: "success", range: "R$ 20.001 - 50.000" },
  3: { label: "Classe 3", color: "info", range: "R$ 50.001 - 75.000" },
  4: { label: "Classe 4", color: "premium", range: "R$ 75.001 - 100.000" }
};

export function OrcamentoCard({ orcamento, onEdit, onStatusChange }: OrcamentoCardProps) {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const handleGeneratePDF = async () => {
    try {
      // Buscar produtos do orçamento
      const { data: produtos } = await supabase
        .from('orcamento_produtos')
        .select('*')
        .eq('orcamento_id', orcamento.id);

      const pdfData = {
        id: orcamento.id,
        formData: {
          lead_id: orcamento.lead_id,
          cliente_nome: orcamento.cliente_nome,
          cliente_cpf: orcamento.cliente_cpf,
          cliente_telefone: orcamento.cliente_telefone,
          cliente_estado: orcamento.cliente_estado,
          cliente_cidade: orcamento.cliente_cidade,
          cliente_bairro: orcamento.cliente_bairro,
          cliente_cep: orcamento.cliente_cep,
          valor_frete: orcamento.valor_frete.toString(),
          valor_instalacao: orcamento.valor_instalacao?.toString() || "0",
          modalidade_instalacao: orcamento.modalidade_instalacao,
          forma_pagamento: orcamento.forma_pagamento,
          desconto_total_percentual: orcamento.desconto_percentual || 0,
          requer_analise: orcamento.requer_analise,
          motivo_analise: orcamento.motivo_analise
        },
        produtos: (produtos || []).map(p => ({
          tipo_produto: p.tipo_produto as any,
          valor: p.valor,
          desconto_percentual: p.desconto_percentual,
          medidas: p.medidas,
          cor_id: p.cor_id,
          acessorio_id: p.acessorio_id,
          adicional_id: p.adicional_id,
          descricao: p.descricao,
          descricao_manutencao: p.descricao_manutencao,
          preco_producao: p.preco_producao,
          preco_instalacao: p.preco_instalacao
        })),
        calculatedTotal: orcamento.valor_total,
        numeroOrcamento: `ORC-${orcamento.id.slice(-8).toUpperCase()}`,
        vendedora: {
          nome: orcamento.admin_users?.nome || 'Atendente',
          cargo: orcamento.admin_users?.role || 'Consultor',
          avatar_url: orcamento.admin_users?.foto_perfil_url || null
        }
      };

      generateOrcamentoPDF(pdfData);
      
      toast({
        title: "PDF Gerado",
        description: "O orçamento foi baixado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar o PDF. Tente novamente.",
      });
    }
  };

  const getClasseStyle = (classe: number) => {
    const classeInfo = ORCAMENTO_CLASSES[classe as keyof OrcamentoClasse];
    
    switch (classe) {
      case 1:
        return "border-muted bg-muted/10 text-muted-foreground";
      case 2:
        return "border-green-500 bg-green-50 text-green-700";
      case 3:
        return "border-blue-500 bg-blue-50 text-blue-700";
      case 4:
        return "border-yellow-500 bg-gradient-to-br from-black to-gray-800 text-yellow-400 border-2 relative overflow-hidden";
      default:
        return "border-muted bg-muted/10 text-muted-foreground";
    }
  };

  const canEdit = () => {
    const isOwner = orcamento.usuario_id === user?.id;
    const canEditStatus = [1, 2].includes(orcamento.status_orcamento);
    return (isAdmin || isOwner) && canEditStatus;
  };

  const canChangeStatus = () => {
    const isOwner = orcamento.usuario_id === user?.id;
    const canChangeStatus = [1, 2].includes(orcamento.status_orcamento);
    return (isAdmin || isOwner) && canChangeStatus;
  };

  return (
    <Card className={`relative ${getClasseStyle(orcamento.classe)} transition-all hover:shadow-md`}>
      {orcamento.classe === 4 && (
        <div className="absolute top-2 right-2">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{orcamento.elisaportas_leads?.nome}</h3>
            <p className="text-sm opacity-75">{orcamento.elisaportas_leads?.telefone}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {ORCAMENTO_CLASSES[orcamento.classe as keyof OrcamentoClasse]?.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Atendente:</p>
          <div className="flex items-center gap-2">
            {orcamento.admin_users?.foto_perfil_url && (
              <img 
                src={orcamento.admin_users.foto_perfil_url} 
                alt="Foto do atendente"
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <p className="text-sm opacity-75">{orcamento.admin_users?.nome || "Não atribuído"}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">Produtos:</p>
          <div className="text-xs opacity-75 space-y-1">
            {orcamento.orcamento_produtos?.map((produto: any, index: number) => (
              <div key={index} className="truncate">
                {produto.tipo_produto} - R$ {produto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-lg">
              R$ {orcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div>
          <Badge 
            variant={orcamento.status_orcamento === 1 ? "default" : 
                    orcamento.status_orcamento === 2 ? "secondary" :
                    orcamento.status_orcamento === 3 ? "destructive" :
                    orcamento.status_orcamento === 4 ? "default" : "outline"}
            className={orcamento.status_orcamento === 4 ? "bg-green-500 text-white" : ""}
          >
            {ORCAMENTO_STATUS[orcamento.status_orcamento as keyof typeof ORCAMENTO_STATUS]}
          </Badge>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={handleGeneratePDF} className="flex-1">
            <Download className="w-3 h-3 mr-1" />
            PDF
          </Button>
          
          {canEdit() && onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(orcamento)} className="flex-1">
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}