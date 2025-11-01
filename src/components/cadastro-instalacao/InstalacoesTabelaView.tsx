import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InstalacaoCadastrada, CreateInstalacaoData } from '@/hooks/useInstalacoesCadastradas';
import { CadastroInstalacaoForm } from './CadastroInstalacaoForm';
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

interface InstalacoesTabelaViewProps {
  instalacoes: InstalacaoCadastrada[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: CreateInstalacaoData) => Promise<boolean>;
  onAlterarParaCorrecao: (id: string, justificativa: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isAdmin: boolean;
}

const STATUS_COLORS = {
  pendente_producao: 'bg-yellow-500',
  em_producao: 'bg-blue-500',
  pronta_fabrica: 'bg-cyan-500',
  finalizada: 'bg-green-500',
};

const STATUS_LABELS = {
  pendente_producao: 'Pendente Produção',
  em_producao: 'Em Produção',
  pronta_fabrica: 'Pronta Fábrica',
  finalizada: 'Finalizada',
};

export const InstalacoesTabelaView = ({
  instalacoes,
  onDelete,
  onUpdate,
  onAlterarParaCorrecao,
  onUpdateStatus,
  isAdmin,
}: InstalacoesTabelaViewProps) => {
  const [editingInstalacao, setEditingInstalacao] = useState<InstalacaoCadastrada | null>(null);
  const [deletingInstalacao, setDeletingInstalacao] = useState<InstalacaoCadastrada | null>(null);

  const handleUpdate = async (data: CreateInstalacaoData) => {
    if (!editingInstalacao) return;
    const success = await onUpdate(editingInstalacao.id, data);
    if (success) {
      setEditingInstalacao(null);
    }
  };

  const handleDelete = () => {
    if (deletingInstalacao) {
      onDelete(deletingInstalacao.id);
      setDeletingInstalacao(null);
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
              <TableHead>Categoria</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Data Instalação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              {isAdmin && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {instalacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="text-center text-muted-foreground">
                  Nenhuma instalação cadastrada
                </TableCell>
              </TableRow>
            ) : (
              instalacoes.map((instalacao) => (
                <TableRow key={instalacao.id}>
                  <TableCell className="font-medium">{instalacao.nome_cliente}</TableCell>
                  <TableCell>{instalacao.telefone_cliente || '-'}</TableCell>
                  <TableCell>{`${instalacao.cidade}/${instalacao.estado}`}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {instalacao.categoria === 'instalacao' && 'Instalação'}
                      {instalacao.categoria === 'entrega' && 'Entrega'}
                      {instalacao.categoria === 'correcao' && 'Correção'}
                      {instalacao.categoria === 'carregamento_agendado' && 'Carregamento'}
                    </Badge>
                  </TableCell>
                  <TableCell>{instalacao.tamanho || '-'}</TableCell>
                  <TableCell>
                    {instalacao.data_instalacao ? format(new Date(instalacao.data_instalacao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        value={instalacao.status}
                        onValueChange={(value) => onUpdateStatus(instalacao.id, value)}
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
                      <Badge className={STATUS_COLORS[instalacao.status]}>
                        {STATUS_LABELS[instalacao.status]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(instalacao.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingInstalacao(instalacao)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingInstalacao(instalacao)}
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
      <Dialog open={!!editingInstalacao} onOpenChange={() => setEditingInstalacao(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Instalação</DialogTitle>
          </DialogHeader>
          {editingInstalacao && (
            <CadastroInstalacaoForm
              initialData={editingInstalacao}
              onSubmit={handleUpdate}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingInstalacao} onOpenChange={() => setDeletingInstalacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a instalação de <strong>{deletingInstalacao?.nome_cliente}</strong>?
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
