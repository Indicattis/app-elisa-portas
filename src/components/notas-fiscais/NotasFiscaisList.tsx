import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { StatusSefazBadge } from "./StatusSefazBadge";
import { Download, FileText, Mail, RefreshCw, XCircle, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotasFiscaisList() {
  const [filtros, setFiltros] = useState({
    tipo: undefined as 'entrada' | 'saida' | undefined,
    status: undefined as string | undefined,
    dataInicio: undefined as string | undefined,
    dataFim: undefined as string | undefined
  });

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [notaToCancel, setNotaToCancel] = useState<string | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");

  const { notasFiscais, isLoading, consultarNota, cancelarNota, isConsultando, isCancelando } = useNotasFiscais(filtros);

  const getTipoBadge = (tipo: string) => {
    return tipo === 'entrada' 
      ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Entrada</Badge>
      : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Saída</Badge>;
  };

  const handleCancelClick = (notaId: string) => {
    setNotaToCancel(notaId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (notaToCancel && motivoCancelamento) {
      cancelarNota({ notaFiscalId: notaToCancel, motivo: motivoCancelamento });
      setCancelDialogOpen(false);
      setNotaToCancel(null);
      setMotivoCancelamento("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 h-[35px]">
        <Select
          value={filtros.tipo || 'todos'}
          onValueChange={(value) => 
            setFiltros(prev => ({ ...prev, tipo: value === 'todos' ? undefined : value as any }))
          }
        >
          <SelectTrigger className="h-[35px] w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filtros.status || 'todos'}
          onValueChange={(value) => 
            setFiltros(prev => ({ ...prev, status: value === 'todos' ? undefined : value }))
          }
        >
          <SelectTrigger className="h-[35px] w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="autorizada">Autorizada</SelectItem>
            <SelectItem value="processando">Processando</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="rejeitada">Rejeitada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filtros.dataInicio || ''}
          onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value || undefined }))}
          className="h-[35px] w-[160px]"
          placeholder="Data início"
        />

        <Input
          type="date"
          value={filtros.dataFim || ''}
          onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value || undefined }))}
          className="h-[35px] w-[160px]"
          placeholder="Data fim"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Lista de Notas Fiscais</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : notasFiscais && notasFiscais.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Número/Série</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status SEFAZ</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notasFiscais.map((nf) => (
                  <TableRow key={nf.id}>
                    <TableCell>{getTipoBadge(nf.tipo)}</TableCell>
                    <TableCell className="font-medium">
                      {nf.numero}/{nf.serie}
                    </TableCell>
                    <TableCell>
                      {format(new Date(nf.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{nf.razao_social}</TableCell>
                    <TableCell>
                      R$ {nf.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <StatusSefazBadge status={nf.status_sefaz || nf.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => consultarNota(nf.id)}
                          disabled={isConsultando}
                          title="Atualizar status"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        {nf.danfe_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(nf.danfe_url, '_blank')}
                            title="Ver DANFE"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {nf.xml_autorizado_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(nf.xml_autorizado_url, '_blank')}
                            title="Baixar XML"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {nf.status_sefaz === 'autorizada' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelClick(nf.id)}
                            disabled={isCancelando}
                            title="Cancelar nota"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma nota fiscal encontrada
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Nota Fiscal</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo do cancelamento:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={motivoCancelamento}
            onChange={(e) => setMotivoCancelamento(e.target.value)}
            placeholder="Ex: Erro no valor, cliente desistiu da compra..."
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} disabled={!motivoCancelamento}>
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
