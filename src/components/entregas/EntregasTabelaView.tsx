import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Entrega, CreateEntregaData } from '@/hooks/useEntregas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EntregasTabelaViewProps {
  entregas: Entrega[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: CreateEntregaData) => Promise<boolean>;
  onUpdateStatus: (id: string, status: string) => void;
  isAdmin: boolean;
}

const STATUS_COLORS = {
  pendente_producao: 'bg-yellow-500',
  em_producao: 'bg-blue-500',
  em_qualidade: 'bg-purple-500',
  aguardando_pintura: 'bg-orange-500',
  pronta_fabrica: 'bg-cyan-500',
  finalizada: 'bg-green-500',
};

const STATUS_LABELS = {
  pendente_producao: 'Pendente Produção',
  em_producao: 'Em Produção',
  em_qualidade: 'Em Qualidade',
  aguardando_pintura: 'Aguardando Pintura',
  pronta_fabrica: 'Pronta Fábrica',
  finalizada: 'Finalizada',
};

export const EntregasTabelaView = ({
  entregas,
  onDelete,
  onUpdate,
  onUpdateStatus,
  isAdmin,
}: EntregasTabelaViewProps) => {
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade/Estado</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Data Entrega</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entregas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma entrega cadastrada
                </TableCell>
              </TableRow>
            ) : (
              entregas.map((entrega) => (
                <TableRow key={entrega.id}>
                  <TableCell className="font-medium">{entrega.nome_cliente}</TableCell>
                  <TableCell>{entrega.telefone_cliente || '-'}</TableCell>
                  <TableCell>{`${entrega.cidade}/${entrega.estado}`}</TableCell>
                  <TableCell>{entrega.tamanho || '-'}</TableCell>
                  <TableCell>
                    {entrega.data_entrega ? format(new Date(entrega.data_entrega), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        value={entrega.status}
                        onValueChange={(value) => onUpdateStatus(entrega.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={STATUS_COLORS[entrega.status]}>
                        {STATUS_LABELS[entrega.status]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(entrega.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
