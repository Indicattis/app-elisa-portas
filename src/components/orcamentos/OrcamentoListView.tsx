import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Download, 
  Edit, 
  Trash2, 
  Star, 
  DoorOpen,
  Palette,
  Wrench,
  Package,
  AlertTriangle
} from "lucide-react";
import { generateOrcamentoPDF } from "@/utils/orcamentoPDFGenerator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OrcamentoStatusModal } from "./OrcamentoStatusModal";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { OrcamentoClasse } from "@/types/orcamento";
import type { MotivoPerda } from "@/types/orcamento";

interface OrcamentoListViewProps {
  orcamentos: any[];
  onEdit?: (orcamento: any) => void;
  onRefresh?: () => void;
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

export function OrcamentoListView({ orcamentos, onEdit, onRefresh }: OrcamentoListViewProps) {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleGeneratePDF = async (orcamento: any) => {
    try {
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
        numeroOrcamento: `ORC-${orcamento.id.slice(-8).toUpperCase()}`
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

  const handleDelete = async (orcamentoId: string) => {
    try {
      const { error } = await supabase
        .from("orcamentos")
        .delete()
        .eq("id", orcamentoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso",
      });

      onRefresh?.();
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir orçamento",
      });
    }
  };

  const handleStatusChange = async (orcamentoId: string, novoStatus: number, motivoPerda?: MotivoPerda, justificativa?: string) => {
    try {
      const updateData: any = { 
        status: getStatusString(novoStatus)
      };

      if (novoStatus === 3 && motivoPerda && justificativa) {
        updateData.motivo_perda = motivoPerda;
        updateData.justificativa_perda = justificativa;
      }

      const { error } = await supabase
        .from("orcamentos")
        .update(updateData)
        .eq("id", orcamentoId);

      if (error) throw error;

      // Se status foi alterado para "Vendido", criar requisição de venda
      if (novoStatus === 4) {
        const orcamento = orcamentos.find(o => o.id === orcamentoId);
        if (orcamento) {
          const { error: reqError } = await supabase.rpc('criar_requisicao_venda', {
            lead_uuid: orcamento.lead_id,
            orcamento_uuid: orcamentoId
          });

          if (reqError) throw reqError;

          toast({
            title: "Sucesso",
            description: "Orçamento vendido e requisição de venda criada",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Status do orçamento atualizado",
        });
      }

      onRefresh?.();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar status do orçamento",
      });
    }
  };

  const canEdit = (orcamento: any) => {
    const isOwner = orcamento.atendente_id === user?.id;
    const statusNumero = getStatusNumber(orcamento.status);
    const canEditStatus = [1, 2].includes(statusNumero);
    return (isAdmin || isOwner) && canEditStatus;
  };

  const canChangeStatus = (orcamento: any) => {
    const isOwner = orcamento.atendente_id === user?.id;
    const statusNumero = getStatusNumber(orcamento.status);
    const canChangeStatus = [1, 2].includes(statusNumero);
    return (isAdmin || isOwner) && canChangeStatus;
  };

  const getStatusNumber = (status: string) => {
    const statusMap: { [key: string]: number } = {
      'pendente': 1,
      'congelado': 2,
      'perdido': 3,
      'vendido': 4,
      'reprovado': 5
    };
    return statusMap[status] || 1;
  };

  const getStatusString = (number: number) => {
    const statusMap: { [key: number]: string } = {
      1: 'pendente',
      2: 'congelado',
      3: 'perdido',
      4: 'vendido',
      5: 'reprovado'
    };
    return statusMap[number] || 'pendente';
  };

  const canDelete = (orcamento: any) => {
    return isAdmin || orcamento.atendente_id === user?.id;
  };

  const renderProductIcons = (orcamento: any) => {
    if (!orcamento.orcamento_produtos || orcamento.orcamento_produtos.length === 0) {
      return <span className="text-muted-foreground">-</span>;
    }

    const productCounts = orcamento.orcamento_produtos.reduce((acc: any, produto: any) => {
      const tipo = produto.tipo_produto;
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const getIcon = (tipo: string) => {
      switch (tipo) {
        case 'porta_enrolar_automatica':
        case 'porta_social':
          return DoorOpen;
        case 'pintura_epoxi':
          return Palette;
        case 'manutencao':
          return Wrench;
        case 'acessorio':
        case 'adicional':
          return Package;
        default:
          return Package;
      }
    };

    return (
      <div className="flex gap-1 flex-wrap">
        {Object.entries(productCounts).map(([tipo, count]) => {
          const Icon = getIcon(tipo);
          return (
            <div key={tipo} className="flex items-center gap-1">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs">{count as number}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const getStatusBadgeVariant = (status: number) => {
    switch (status) {
      case 1: return "default"; // Em aberto
      case 2: return "secondary"; // Congelado
      case 3: return "destructive"; // Perdido
      case 4: return "default"; // Vendido
      case 5: return "outline"; // Venda reprovada
      default: return "outline";
    }
  };

  const getClasseBadgeVariant = (classe: number) => {
    switch (classe) {
      case 1: return "outline";
      case 2: return "secondary";
      case 3: return "default";
      case 4: return "destructive";
      default: return "outline";
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atendente</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Produtos</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orcamentos.map((orcamento) => (
              <TableRow key={orcamento.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={orcamento.admin_users?.foto_perfil_url} 
                        alt={orcamento.admin_users?.nome || "Atendente"} 
                      />
                      <AvatarFallback>
                        {orcamento.admin_users?.nome?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{orcamento.admin_users?.nome || "Não atribuído"}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div>
                    <div className="font-medium">{orcamento.cliente_nome}</div>
                    <div className="text-sm text-muted-foreground">{orcamento.cliente_telefone}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    {orcamento.classe === 4 && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <Badge variant={getClasseBadgeVariant(orcamento.classe)}>
                      {ORCAMENTO_CLASSES[orcamento.classe as keyof OrcamentoClasse]?.label}
                    </Badge>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant={getStatusBadgeVariant(getStatusNumber(orcamento.status))}
                    className={getStatusNumber(orcamento.status) === 4 ? "bg-green-500 text-white hover:bg-green-600" : ""}
                  >
                    {ORCAMENTO_STATUS[getStatusNumber(orcamento.status) as keyof typeof ORCAMENTO_STATUS]}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {renderProductIcons(orcamento)}
                </TableCell>
                
                <TableCell>
                  <span className="font-medium">
                    R$ {orcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGeneratePDF(orcamento)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    {canEdit(orcamento) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit?.(orcamento)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {canChangeStatus(orcamento) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrcamento(orcamento);
                          setShowStatusModal(true);
                        }}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {canDelete(orcamento) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(orcamento.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedOrcamento && (
        <OrcamentoStatusModal
          orcamento={selectedOrcamento}
          open={showStatusModal}
          onOpenChange={setShowStatusModal}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}