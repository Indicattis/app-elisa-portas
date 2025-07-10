
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Play, Tag, Trash2, X, CheckCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Lead } from "@/types/lead";
import { getLeadStatus, statusConfig } from "@/utils/leadStatus";
import { handleWhatsAppClick } from "@/utils/timeUtils";
import { getLeadTag, canEditTag } from "@/utils/newLeadSystem";
import { LeadTagSelector } from "@/components/LeadTagSelector";

interface OrcamentoInfo {
  leadId: string;
  hasOrcamento: boolean;
  status: string | null;
  count: number;
}

interface LeadTableRowProps {
  lead: Lead;
  atendentes: Map<string, string>;
  canManage: boolean;
  onRowDoubleClick: (leadId: string) => void;
  onStartAttendance: (leadId: string) => void;
  onNavigateToSale: (leadId: string) => void;
  onMarkAsLost?: (leadId: string) => void;
  onMarkAsDisqualified?: (leadId: string) => void;
  onCancelAttendance?: (leadId: string) => void;
  onMarkAsSold?: (leadId: string) => void;
  hasApprovedBudget?: boolean;
  orcamentoInfo?: OrcamentoInfo;
  onTagUpdate?: () => void;
}

export function LeadTableRow({
  lead,
  atendentes,
  canManage,
  onRowDoubleClick,
  onStartAttendance,
  onMarkAsLost,
  onMarkAsDisqualified,
  onCancelAttendance,
  onMarkAsSold,
  hasApprovedBudget = false,
  orcamentoInfo,
  onTagUpdate,
}: LeadTableRowProps) {
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const status = getLeadStatus(lead);
  const statusInfo = statusConfig[status as keyof typeof statusConfig];

  const leadTag = getLeadTag(lead.tag_id);
  const canEditTags = canEditTag(lead.novo_status || 'aguardando_atendimento');

  const handleMarkAsLostClick = () => {
    if (onMarkAsLost) {
      onMarkAsLost(lead.id);
    }
  };

  const handleMarkAsDisqualifiedClick = () => {
    if (onMarkAsDisqualified) {
      onMarkAsDisqualified(lead.id);
    }
  };

  const handleCancelAttendanceClick = () => {
    if (onCancelAttendance) {
      onCancelAttendance(lead.id);
    }
  };

  const handleMarkAsSoldClick = () => {
    if (onMarkAsSold) {
      onMarkAsSold(lead.id);
    }
  };

  // Lead vendido ou venda aprovada não pode ser alterado
  const isReadOnly = lead.novo_status === 'venda_aprovada';

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEditTags && canManage) {
      setIsTagSelectorOpen(true);
    }
  };

  const handleTagChange = async (tagId: number | null) => {
    // A função já atualiza o banco, então só chamamos o callback
    if (onTagUpdate) {
      onTagUpdate();
    }
  };

  const getOrcamentoStatusBadge = () => {
    if (!orcamentoInfo?.hasOrcamento) {
      return (
        <span className="text-muted-foreground text-sm flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Nenhum
        </span>
      );
    }

    const statusColors = {
      aprovado: "bg-green-100 text-green-800 border-green-200",
      pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      rejeitado: "bg-red-100 text-red-800 border-red-200",
    };

    const statusLabels = {
      aprovado: "Aprovado",
      pendente: "Pendente",
      rejeitado: "Rejeitado",
    };

    const badgeClass = statusColors[orcamentoInfo.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200";
    const label = statusLabels[orcamentoInfo.status as keyof typeof statusLabels] || orcamentoInfo.status;

    return (
      <div className="flex items-center gap-1">
        <FileText className="w-3 h-3" />
        <Badge variant="outline" className={`text-xs ${badgeClass}`}>
          {label}
        </Badge>
        {orcamentoInfo.count > 1 && (
          <span className="text-xs text-muted-foreground">
            ({orcamentoInfo.count})
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <TableRow 
        key={lead.id} 
        data-lead-id={lead.id}
        className={`cursor-pointer ${statusInfo.rowClassName}`}
        onDoubleClick={() => !isReadOnly && onRowDoubleClick(lead.id)}
      >
        {/* Etiqueta como ícone de tag preenchido - primeira coluna */}
        <TableCell className="w-12">
          {leadTag ? (
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-opacity ${
                canEditTags && canManage ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
              } ${leadTag.color}`}
              title={`${leadTag.name} ${canEditTags && canManage ? '- Clique para alterar' : ''}`}
              onClick={canEditTags && canManage ? handleTagClick : undefined}
            >
              <Tag 
                className="w-5 h-5 text-white" 
                fill="currentColor"
              />
            </div>
          ) : (
            <div 
              className={`w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center transition-colors ${
                canEditTags && canManage ? 'cursor-pointer hover:bg-gray-300' : 'cursor-default'
              }`}
              title={canEditTags && canManage ? "Sem etiqueta - Clique para definir" : "Sem etiqueta"}
              onClick={canEditTags && canManage ? handleTagClick : undefined}
            >
              <Tag className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </TableCell>
        
        <TableCell className="font-medium">{lead.nome}</TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="text-sm">{lead.email}</div>
            <div className="text-sm text-muted-foreground">{lead.telefone}</div>
          </div>
        </TableCell>
        <TableCell>{lead.cidade}</TableCell>
        <TableCell>
          {lead.atendente_id ? (
            <Badge variant="default" className="bg-primary text-primary-foreground font-medium px-3 py-1">
              {atendentes.get(lead.atendente_id) || "-"}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          {format(new Date(lead.data_envio), "dd/MM/yyyy", { locale: ptBR })}
        </TableCell>
        <TableCell>
          {getOrcamentoStatusBadge()}
        </TableCell>
        <TableCell>
          {lead.valor_orcamento
            ? `R$ ${lead.valor_orcamento.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`
            : "-"}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleWhatsAppClick(lead.telefone, lead.nome);
              }}
              title="Iniciar conversa no WhatsApp"
              disabled={isReadOnly}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            
            {/* Botão Capturar - apenas para leads aguardando atendimento (status 1) */}
            {canManage && lead.novo_status === 'aguardando_atendimento' && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartAttendance(lead.id);
                }}
                title="Capturar lead"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}

            {/* Botões para leads em andamento (status 2) - apenas o atendente responsável */}
            {canManage && lead.novo_status === 'em_andamento' && lead.atendente_id && (
              <>
                {/* Botão Vendido - apenas se tiver orçamento aprovado */}
                {hasApprovedBudget && onMarkAsSold && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsSold(lead.id);
                    }}
                    title="Marcar como vendido"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}

                {/* Botão Perdido */}
                {onMarkAsLost && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-600 hover:bg-red-50 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsLost(lead.id);
                    }}
                    title="Marcar como perdido"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}

                {/* Botão Parar Atendimento */}
                {onCancelAttendance && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelAttendance(lead.id);
                    }}
                    title="Parar atendimento"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}

            {/* Botão Marcar como perdido - para leads aguardando aprovação (status 4) - apenas admin/gerente */}
            {canManage && lead.novo_status === 'aguardando_aprovacao_venda' && onMarkAsLost && (
              <Button
                variant="outline"
                size="sm"
                className="border-red-500 text-red-600 hover:bg-red-50 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsLost(lead.id);
                }}
                title="Marcar como perdido"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      <LeadTagSelector
        open={isTagSelectorOpen}
        onOpenChange={setIsTagSelectorOpen}
        currentTagId={lead.tag_id}
        leadStatus={lead.novo_status || 'aguardando_atendimento'}
        onTagChange={handleTagChange}
        leadName={lead.nome}
        leadId={lead.id}
      />
    </>
  );
}
