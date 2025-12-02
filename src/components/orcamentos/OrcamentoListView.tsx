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
  AlertTriangle,
  Plus
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

const getCargoLabel = (role?: string): string => {
  const cargoLabels: Record<string, string> = {
    'administrador': 'Administrador',
    'diretor': 'Diretor',
    'gerente_comercial': 'Gerente Comercial',
    'coordenador_vendas': 'Coordenador de Vendas',
    'vendedor': 'Vendedor',
    'atendente': 'Atendente Comercial',
    'gerente_marketing': 'Gerente de Marketing',
    'analista_marketing': 'Analista de Marketing',
    'assistente_marketing': 'Assistente de Marketing',
    'gerente_instalacoes': 'Gerente de Instalações',
    'instalador': 'Instalador',
    'aux_instalador': 'Auxiliar de Instalação',
    'gerente_fabril': 'Gerente Fabril',
    'gerente_producao': 'Gerente de Produção',
    'soldador': 'Soldador',
    'pintor': 'Pintor',
    'aux_pintura': 'Auxiliar de Pintura',
    'aux_geral': 'Auxiliar Geral',
    'gerente_financeiro': 'Gerente Financeiro',
    'assistente_administrativo': 'Assistente Administrativo'
  };
  return cargoLabels[role || ''] || 'Consultor de Vendas';
};

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

  const [loadingPedido, setLoadingPedido] = useState<Record<string, boolean>>({});

  const handleGerarPedido = async (orcamento: any) => {
    try {
      setLoadingPedido(prev => ({ ...prev, [orcamento.id]: true }));
      
      // Verificar se já existe pedido para este orçamento
      const { data: pedidoExistente, error: verificacaoError } = await supabase
        .from("pedidos_producao")
        .select("numero_pedido")
        .eq("orcamento_id", orcamento.id)
        .single();

      if (verificacaoError && verificacaoError.code !== 'PGRST116') {
        throw verificacaoError;
      }

      if (pedidoExistente) {
        toast({
          variant: "destructive",
          title: "Pedido já existe",
          description: `Já existe o pedido ${pedidoExistente.numero_pedido} para este orçamento`,
        });
        return;
      }

      // ... keep existing code (rest of function)
      const { data: orcamentoCompleto, error: orcamentoError } = await supabase
        .from('orcamentos')
        .select(`
          *,
          elisaportas_leads (*),
          orcamento_produtos (*)
        `)
        .eq('id', orcamento.id)
        .single();

      if (orcamentoError) throw orcamentoError;

      // Gerar número do pedido único
      const numeroPedido = `PED-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Pegar o primeiro produto para as especificações do pedido
      const primeiroProduto = orcamentoCompleto.orcamento_produtos?.[0];
      
      // Criar pedido
      const { error: pedidoError } = await supabase
        .from('pedidos_producao')
        .insert({
          numero_pedido: numeroPedido,
          orcamento_id: orcamentoCompleto.id,
          cliente_nome: orcamentoCompleto.cliente_nome,
          cliente_telefone: orcamentoCompleto.cliente_telefone,
          cliente_email: orcamentoCompleto.cliente_email,
          cliente_cpf: orcamentoCompleto.cliente_cpf,
          cliente_bairro: orcamentoCompleto.cliente_bairro,
          endereco_rua: orcamentoCompleto.elisaportas_leads?.endereco_rua || '',
          endereco_numero: orcamentoCompleto.elisaportas_leads?.endereco_numero || '',
          endereco_bairro: orcamentoCompleto.cliente_bairro || '',
          endereco_cidade: orcamentoCompleto.cliente_cidade || '',
          endereco_estado: orcamentoCompleto.cliente_estado || '',
          endereco_cep: orcamentoCompleto.cliente_cep || '',
          forma_pagamento: orcamentoCompleto.forma_pagamento,
          valor_venda: orcamentoCompleto.valor_total,
          valor_frete: orcamentoCompleto.valor_frete,
          valor_instalacao: orcamentoCompleto.valor_instalacao,
          modalidade_instalacao: orcamentoCompleto.modalidade_instalacao,
          produtos: orcamentoCompleto.orcamento_produtos || [],
          status: 'pendente',
          observacoes: `Pedido gerado a partir do orçamento ${orcamento.id}`,
          created_by: user?.id
        });

      if (pedidoError) throw pedidoError;

      toast({
        title: "Pedido Criado",
        description: `Pedido ${numeroPedido} foi criado com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao gerar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar pedido. Tente novamente.",
      });
    } finally {
      setLoadingPedido(prev => ({ ...prev, [orcamento.id]: false }));
    }
  };

  const handleGeneratePDF = async (orcamento: any) => {
    try {
      const { data: produtos } = await supabase
        .from('orcamento_produtos')
        .select('*')
        .eq('orcamento_id', orcamento.id);

      const pdfData = {
        id: orcamento.id,
        formData: {
          cliente_nome: orcamento.cliente_nome,
          cliente_cpf: orcamento.cliente_cpf,
          cliente_telefone: orcamento.cliente_telefone,
          cliente_estado: orcamento.cliente_estado,
          cliente_cidade: orcamento.cliente_cidade,
          cliente_bairro: orcamento.cliente_bairro,
          cliente_cep: orcamento.cliente_cep,
          valor_frete: orcamento.valor_frete?.toString() || "0",
          valor_instalacao: orcamento.valor_instalacao?.toString() || "0",
          modalidade_instalacao: orcamento.modalidade_instalacao,
          forma_pagamento: orcamento.forma_pagamento,
          desconto_total_percentual: orcamento.desconto_percentual || 0,
          requer_analise: orcamento.requer_analise,
          motivo_analise: orcamento.motivo_analise,
          produtos: (produtos || []).map(p => ({
            tipo_produto: p.tipo_produto as any,
            valor: p.valor,
            quantidade: p.quantidade || 1,
            desconto_percentual: p.desconto_percentual,
            medidas: p.medidas,
            cor_id: p.cor_id,
            acessorio_id: p.acessorio_id,
            adicional_id: p.adicional_id,
            descricao: p.descricao,
            descricao_manutencao: p.descricao_manutencao,
            preco_producao: p.preco_producao,
            preco_instalacao: p.preco_instalacao
          }))
        },
        calculatedTotal: orcamento.valor_total,
        numeroOrcamento: `ORC-${orcamento.id.slice(-8).toUpperCase()}`,
        vendedora: {
          nome: orcamento.admin_users?.nome || 'Atendente',
          cargo: getCargoLabel(orcamento.admin_users?.role),
          avatar_url: orcamento.admin_users?.foto_perfil_url || null
        }
      };

      generateOrcamentoPDF(pdfData.formData as any, pdfData.calculatedTotal, {
        id: pdfData.id,
        numeroOrcamento: pdfData.numeroOrcamento,
        vendedora: pdfData.vendedora
      });
      
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
    return isAdmin;
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
        case 'porta_enrolar':
        case 'porta_social':
          return DoorOpen;
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
      <div className="rounded-md border w-full overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Mobile: apenas 2 colunas */}
              <TableHead className="text-xs sm:text-sm">Cliente</TableHead>
              <TableHead className="text-xs sm:text-sm">Valor</TableHead>
              
              {/* Desktop: colunas adicionais */}
              <TableHead className="hidden md:table-cell text-xs sm:text-sm">Atendente</TableHead>
              <TableHead className="hidden lg:table-cell text-xs sm:text-sm">Classe</TableHead>
              <TableHead className="hidden md:table-cell text-xs sm:text-sm">Status</TableHead>
              <TableHead className="hidden lg:table-cell text-xs sm:text-sm">Produtos</TableHead>
              <TableHead className="hidden lg:table-cell text-xs sm:text-sm">Data</TableHead>
              <TableHead className="hidden sm:table-cell text-xs sm:text-sm text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orcamentos.map((orcamento) => (
              <TableRow key={orcamento.id}>
                {/* Mobile: Coluna Cliente */}
                <TableCell className="p-2 sm:p-4">
                  <div className="space-y-1">
                    <div className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                      {orcamento.cliente_nome}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {orcamento.cliente_telefone}
                    </div>
                    
                    {/* Mobile: Info extra compacta */}
                    <div className="flex flex-wrap gap-1 mt-1 md:hidden">
                      <Badge 
                        variant={getStatusBadgeVariant(getStatusNumber(orcamento.status))}
                        className={`text-[10px] px-1.5 py-0 h-4 ${getStatusNumber(orcamento.status) === 4 ? "bg-green-500 text-white hover:bg-green-600" : ""}`}
                      >
                        {ORCAMENTO_STATUS[getStatusNumber(orcamento.status) as keyof typeof ORCAMENTO_STATUS]}
                      </Badge>
                      {orcamento.classe === 4 && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </div>
                </TableCell>
                
                {/* Mobile: Coluna Valor */}
                <TableCell className="p-2 sm:p-4">
                  <div className="space-y-1">
                    <span className="font-medium text-xs sm:text-sm block">
                      R$ {orcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground block md:hidden">
                      {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    
                    {/* Mobile: Ações compactas */}
                    <div className="flex gap-1 mt-1 sm:hidden">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGeneratePDF(orcamento)}
                        className="h-6 w-6 p-0"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      
                      {canEdit(orcamento) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit?.(orcamento)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
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
                          className="h-6 w-6 p-0"
                        >
                          <AlertTriangle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                {/* Desktop: Atendente */}
                <TableCell className="hidden md:table-cell p-2 sm:p-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                      <AvatarImage 
                        src={orcamento.admin_users?.foto_perfil_url} 
                        alt={orcamento.admin_users?.nome || "Atendente"} 
                      />
                      <AvatarFallback className="text-xs">
                        {orcamento.admin_users?.nome?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs sm:text-sm truncate max-w-[100px]">
                      {orcamento.admin_users?.nome || "Não atribuído"}
                    </span>
                  </div>
                </TableCell>
                
                {/* Desktop: Classe */}
                <TableCell className="hidden lg:table-cell p-2 sm:p-4">
                  <div className="flex items-center gap-2">
                    {orcamento.classe === 4 && (
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                    <Badge variant={getClasseBadgeVariant(orcamento.classe)} className="text-[10px] sm:text-xs">
                      {ORCAMENTO_CLASSES[orcamento.classe as keyof OrcamentoClasse]?.label}
                    </Badge>
                  </div>
                </TableCell>
                
                {/* Desktop: Status */}
                <TableCell className="hidden md:table-cell p-2 sm:p-4">
                  <Badge 
                    variant={getStatusBadgeVariant(getStatusNumber(orcamento.status))}
                    className={`text-[10px] sm:text-xs ${getStatusNumber(orcamento.status) === 4 ? "bg-green-500 text-white hover:bg-green-600" : ""}`}
                  >
                    {ORCAMENTO_STATUS[getStatusNumber(orcamento.status) as keyof typeof ORCAMENTO_STATUS]}
                  </Badge>
                </TableCell>
                
                {/* Desktop: Produtos */}
                <TableCell className="hidden lg:table-cell p-2 sm:p-4">
                  {renderProductIcons(orcamento)}
                </TableCell>
                
                {/* Desktop: Data */}
                <TableCell className="hidden lg:table-cell p-2 sm:p-4">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </TableCell>
                
                {/* Desktop: Ações */}
                <TableCell className="hidden sm:table-cell text-right p-2 sm:p-4">
                  <div className="flex justify-end gap-1 sm:gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGeneratePDF(orcamento)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    
                    {(orcamento.status === 'vendido' || getStatusNumber(orcamento.status) === 4) && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleGerarPedido(orcamento)}
                        disabled={loadingPedido[orcamento.id]}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        {loadingPedido[orcamento.id] ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </Button>
                    )}
                    
                    {canEdit(orcamento) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit?.(orcamento)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
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
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                    
                    {canDelete(orcamento) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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