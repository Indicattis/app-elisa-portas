import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Pencil, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Entrega, CreateEntregaData } from '@/hooks/useEntregas';
import { CadastroEntregaForm } from './CadastroEntregaForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [editingEntrega, setEditingEntrega] = useState<Entrega | null>(null);
  const [deletingEntrega, setDeletingEntrega] = useState<Entrega | null>(null);

  const handleUpdate = async (data: CreateEntregaData) => {
    if (!editingEntrega) return;
    const success = await onUpdate(editingEntrega.id, data);
    if (success) {
      setEditingEntrega(null);
    }
  };

  const handleDelete = () => {
    if (deletingEntrega) {
      onDelete(deletingEntrega.id);
      setDeletingEntrega(null);
    }
  };

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
              {isAdmin && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entregas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground">
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
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingEntrega(entrega)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingEntrega(entrega)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntrega} onOpenChange={() => setEditingEntrega(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
          </DialogHeader>
          {editingEntrega && (
            <CadastroEntregaForm
              initialData={editingEntrega}
              onSubmit={handleUpdate}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntrega} onOpenChange={() => setDeletingEntrega(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a entrega de <strong>{deletingEntrega?.nome_cliente}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
