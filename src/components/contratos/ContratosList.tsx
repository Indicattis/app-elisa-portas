import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContratosVendas } from "@/hooks/useContratosVendas";
import { Download, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface ContratosListProps {
  vendaId: string;
}

export function ContratosList({ vendaId }: ContratosListProps) {
  const { contratos, isLoading, deleteContrato } = useContratosVendas({ vendaId });

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Carregando contratos...</p>
      </Card>
    );
  }

  if (!contratos || contratos.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Nenhum contrato vinculado a esta venda
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Data Upload</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
          {contratos.map((contrato) => (
            <TableRow key={contrato.id}>
              <TableCell className="font-medium">
                {contrato.nome_arquivo}
              </TableCell>
              <TableCell>
                {contrato.template?.nome || 'Não especificado'}
              </TableCell>
              <TableCell>
                {format(new Date(contrato.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(contrato.arquivo_url, '_blank')}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = contrato.arquivo_url;
                      a.download = contrato.nome_arquivo;
                      a.click();
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Contrato?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O arquivo será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteContrato(contrato.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
