import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, XCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generatePDF, getStatusBadgeProps } from "@/utils/orcamentoUtils";
import { useAuth } from "@/hooks/useAuth";

interface OrcamentoTableProps {
  orcamentos: any[];
  onApprove: (orcamento: any) => void;
  onReject: (orcamentoId: string) => void;
}

export function OrcamentoTable({ orcamentos, onApprove, onReject }: OrcamentoTableProps) {
  const { isAdmin, isGerenteComercial } = useAuth();

  const getStatusBadge = (status: string) => {
    const props = getStatusBadgeProps(status);
    const IconComponent = props.icon === "Clock" ? Clock : props.icon === "CheckCircle" ? CheckCircle : XCircle;
    
    return (
      <Badge variant={props.variant} className={props.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {props.text}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Orçamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orcamentos.map((orcamento) => (
              <TableRow key={orcamento.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{orcamento.elisaportas_leads?.nome}</div>
                    <div className="text-sm text-muted-foreground">{orcamento.elisaportas_leads?.telefone}</div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(orcamento.status)}</TableCell>
                <TableCell className="font-medium">
                  R$ {orcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{orcamento.forma_pagamento}</TableCell>
                <TableCell>
                  {format(new Date(orcamento.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => generatePDF(orcamento)}>
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </Button>
                    {(isAdmin || isGerenteComercial) && orcamento.status === 'pendente' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 border-green-600"
                          onClick={() => onApprove(orcamento)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 border-red-600"
                          onClick={() => onReject(orcamento.id)}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reprovar
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}