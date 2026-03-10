import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Droplet, AlertTriangle, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVeiculos } from "@/hooks/useVeiculos";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { TrocaOleoDialog } from "@/components/frota/TrocaOleoDialog";
import { AvisoVeiculoModal } from "@/components/frota/AvisoVeiculoModal";
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
  const { veiculos, isLoading, deleteVeiculo, updateVeiculo } = useVeiculos();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [trocaOleoOpen, setTrocaOleoOpen] = useState(false);
  const [avisoVeiculo, setAvisoVeiculo] = useState<{ id: string; nome: string; aviso: string | null; data: string | null } | null>(null);

  const handleRowDoubleClick = (veiculoId: string) => {
    navigate(`/dashboard/logistica/frota/${veiculoId}/conferencias`);
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
          <Button variant="outline" onClick={() => setTrocaOleoOpen(true)}>
            <Droplet className="h-4 w-4 mr-2" />
            Marcar Troca de Óleo
          </Button>
          <Button onClick={() => navigate('/dashboard/logistica/frota/conferencia')}>
            Conferir Veículo
          </Button>
          <Button onClick={() => navigate('/dashboard/logistica/frota/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Veículo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Foto</TableHead>
                  <TableHead className="text-xs">Modelo</TableHead>
                  <TableHead className="text-xs">Placa</TableHead>
                  <TableHead className="text-xs">Ano</TableHead>
                  <TableHead className="text-xs">Apelido</TableHead>
                  <TableHead className="text-xs">Responsável</TableHead>
                  <TableHead className="text-xs">Km Atual</TableHead>
                  <TableHead className="text-xs">Próx. Troca Óleo</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Aviso</TableHead>
                  <TableHead className="text-right text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {veiculos?.map((veiculo) => (
                  <TableRow 
                    key={veiculo.id}
                    onDoubleClick={() => handleRowDoubleClick(veiculo.id)}
                    className={`cursor-pointer hover:bg-muted/50 ${veiculo.aviso_justificativa ? 'border-l-2 border-l-amber-500' : ''}`}
                  >
                    <TableCell>
                      {veiculo.foto_url ? (
                        <img 
                          src={veiculo.foto_url} 
                          alt={veiculo.nome}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground">
                          -
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{veiculo.modelo}</TableCell>
                    <TableCell>{veiculo.placa || '-'}</TableCell>
                    <TableCell>{veiculo.ano}</TableCell>
                    <TableCell className="font-medium">{veiculo.nome}</TableCell>
                    <TableCell>{veiculo.responsavel || '-'}</TableCell>
                    <TableCell>{veiculo.km_atual.toLocaleString('pt-BR')} km</TableCell>
                    <TableCell>
                      {veiculo.data_proxima_troca_oleo 
                        ? format(new Date(veiculo.data_proxima_troca_oleo), "dd/MM/yy", { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={veiculo.status} />
                    </TableCell>
                    <TableCell>
                      {veiculo.aviso_justificativa ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAvisoVeiculo({ id: veiculo.id, nome: veiculo.nome, aviso: veiculo.aviso_justificativa, data: veiculo.aviso_data });
                          }}
                        >
                          <MessageSquareWarning className="h-3.5 w-3.5 text-amber-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/logistica/frota/${veiculo.id}/editar`);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(veiculo.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

      <TrocaOleoDialog 
        open={trocaOleoOpen} 
        onOpenChange={setTrocaOleoOpen} 
        veiculos={veiculos || []} 
      />

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
