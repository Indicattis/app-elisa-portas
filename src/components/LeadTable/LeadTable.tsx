
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { LeadTableRow } from "./LeadTableRow";
import type { Lead } from "@/types/lead";

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
}: LeadTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Leads</CardTitle>
        <CardDescription>
          {leads.length} leads encontrados | Página {currentPage} de {totalPages}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Atendente</TableHead>
                <TableHead>Data</TableHead>
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
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => onPageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
