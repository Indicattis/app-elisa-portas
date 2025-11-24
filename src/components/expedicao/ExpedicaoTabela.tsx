import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface ExpedicaoTabelaProps {
  ordens: any[];
  onConcluir: (id: string) => Promise<void>;
}

export function ExpedicaoTabela({ ordens, onConcluir }: ExpedicaoTabelaProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordens.map((ordem) => (
            <TableRow key={ordem.id}>
              <TableCell className="font-medium">{ordem.nome_cliente}</TableCell>
              <TableCell>
                {ordem.data_carregamento && format(new Date(ordem.data_carregamento), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>{ordem.hora_carregamento || ordem.hora}</TableCell>
              <TableCell>
                {ordem.carregamento_concluido ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Concluída
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-orange-600">
                    <Clock className="h-4 w-4" />
                    Pendente
                  </span>
                )}
              </TableCell>
              <TableCell>
                {!ordem.carregamento_concluido && (
                  <Button
                    size="sm"
                    onClick={() => onConcluir(ordem.id)}
                  >
                    Concluir
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
