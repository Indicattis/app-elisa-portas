import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVeiculos, precisaConferenciaSemanal } from "@/hooks/useVeiculos";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { AlertaConferenciaSemanal } from "@/components/frota/AlertaConferenciaSemanal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Frota() {
  const navigate = useNavigate();
  const { veiculos, isLoading, deleteVeiculo } = useVeiculos();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleRowDoubleClick = (veiculoId: string) => {
    navigate(`/dashboard/instalacoes/frota/${veiculoId}/conferencias`);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteVeiculo(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Frota</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os veículos da empresa
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => navigate('/dashboard/instalacoes/frota/conferencia')}>
            Conferir Veículo
          </Button>
          <Button onClick={() => navigate('/dashboard/instalacoes/frota/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Veículo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Km Atual</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Troca de Óleo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conferência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {veiculos?.map((veiculo) => (
                  <TableRow 
                    key={veiculo.id}
                    onDoubleClick={() => handleRowDoubleClick(veiculo.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      {veiculo.foto_url ? (
                        <img 
                          src={veiculo.foto_url} 
                          alt={veiculo.nome}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          Sem foto
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{veiculo.nome}</TableCell>
                    <TableCell>{(veiculo as any).placa || '-'}</TableCell>
                    <TableCell>{veiculo.modelo}</TableCell>
                    <TableCell>{veiculo.ano}</TableCell>
                    <TableCell>{veiculo.km_atual.toLocaleString('pt-BR')} km</TableCell>
                    <TableCell>
                      {format(new Date(veiculo.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {veiculo.data_troca_oleo 
                        ? format(new Date(veiculo.data_troca_oleo), "dd/MM/yyyy", { locale: ptBR })
                        : 'Não informado'
                      }
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={veiculo.status} />
                    </TableCell>
                    <TableCell>
                      <AlertaConferenciaSemanal precisaConferencia={precisaConferenciaSemanal(veiculo)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/instalacoes/frota/${veiculo.id}/editar`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(veiculo.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {veiculos?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhum veículo cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
