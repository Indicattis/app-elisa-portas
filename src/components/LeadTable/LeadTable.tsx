
import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LeadTableRow } from "./LeadTableRow";
import type { Lead } from "@/types/lead";

interface OrcamentoInfo {
  leadId: string;
  hasOrcamento: boolean;
  status: string | null;
  count: number;
}

interface LeadTableProps {
  leads: Lead[];
  atendentes: Map<string, string>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canManageLead: (lead: Lead) => boolean;
  onRowDoubleClick: (leadId: string) => void;
  onStartAttendance: (leadId: string) => void;
  onNavigateToSale: (leadId: string) => void;
  onMarkAsLost?: (leadId: string) => void;
  onMarkAsDisqualified?: (leadId: string) => void;
  onCancelAttendance?: (leadId: string) => void;
  onMarkAsSold?: (leadId: string) => void;
  leadsWithApprovedBudgets: Set<string>;
  orcamentosInfo: Map<string, OrcamentoInfo>;
  onTagUpdate?: () => void;
}

export function LeadTable({
  leads,
  atendentes,
  currentPage,
  totalPages,
  onPageChange,
  canManageLead,
  onRowDoubleClick,
  onStartAttendance,
  onNavigateToSale,
  onMarkAsLost,
  onMarkAsDisqualified,
  onCancelAttendance,
  onMarkAsSold,
  leadsWithApprovedBudgets,
  orcamentosInfo,
  onTagUpdate,
}: LeadTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Tag</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Atendente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <LeadTableRow
                key={lead.id}
                lead={lead}
                atendentes={atendentes}
                canManage={canManageLead(lead)}
                onRowDoubleClick={onRowDoubleClick}
                onStartAttendance={onStartAttendance}
                onNavigateToSale={onNavigateToSale}
                onMarkAsLost={onMarkAsLost}
                onMarkAsDisqualified={onMarkAsDisqualified}
                onCancelAttendance={onCancelAttendance}
                onMarkAsSold={onMarkAsSold}
                hasApprovedBudget={leadsWithApprovedBudgets.has(lead.id)}
                orcamentoInfo={orcamentosInfo.get(lead.id)}
                onTagUpdate={onTagUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
