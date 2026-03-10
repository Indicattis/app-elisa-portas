import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Droplet, ClipboardCheck } from "lucide-react";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVeiculos } from "@/hooks/useVeiculos";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { TrocaOleoDialog } from "@/components/frota/TrocaOleoDialog";
import { format, startOfWeek, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

function isConferenciaEmDia(data: string | null | undefined): boolean {
  if (!data) return false;
  const lastMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return isAfter(new Date(data), lastMonday);
}
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

export default function FrotaMinimalista() {
  const navigate = useNavigate();
  useAuth();
  const { veiculos, isLoading, deleteVeiculo } = useVeiculos();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [trocaOleoOpen, setTrocaOleoOpen] = useState(false);

  const handleRowClick = (veiculoId: string) => {
    navigate(`/logistica/frota/${veiculoId}/conferencias`);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteVeiculo(deleteId);
      setDeleteId(null);
    }
  };

  const headerActions = (
    <>
      <Button
        size="sm"
        onClick={() => navigate('/logistica/frota/conferencia')}
        className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/20 text-white shadow-lg shadow-blue-500/10 hover:from-blue-500/30 hover:to-blue-600/30 hover:scale-[1.02] transition-all duration-300 text-xs gap-1.5"
      >
        <ClipboardCheck className="h-4 w-4" />
        <span className="hidden sm:inline">Conferir</span>
      </Button>
      <Button
        size="sm"
        onClick={() => setTrocaOleoOpen(true)}
        className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/20 text-white shadow-lg shadow-blue-500/10 hover:from-blue-500/30 hover:to-blue-600/30 hover:scale-[1.02] transition-all duration-300 text-xs gap-1.5"
      >
        <Droplet className="h-4 w-4" />
        <span className="hidden sm:inline">Troca Óleo</span>
      </Button>
      <Button
        size="sm"
        onClick={() => navigate('/logistica/frota/novo')}
        className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 border border-blue-400/30 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-300 text-xs gap-1.5"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Novo</span>
      </Button>
    </>
  );

  return (
    <MinimalistLayout
      title="Frota"
      subtitle="Gerencie os veículos da empresa"
      backPath="/logistica"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Logística", path: "/logistica" },
        { label: "Frota" }
      ]}
      headerActions={headerActions}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <Card className="bg-white/5 border-blue-500/10 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="border-blue-500/10 hover:bg-white/5">
                    <TableHead className="text-xs text-white/70">Foto</TableHead>
                    <TableHead className="text-xs text-white/70">Modelo</TableHead>
                    <TableHead className="text-xs text-white/70">Placa</TableHead>
                    <TableHead className="text-xs text-white/70">Ano</TableHead>
                    <TableHead className="text-xs text-white/70">Apelido</TableHead>
                    <TableHead className="text-xs text-white/70">Responsável</TableHead>
                    <TableHead className="text-xs text-white/70">Km Atual</TableHead>
                    <TableHead className="text-xs text-white/70">Próx. Troca Óleo</TableHead>
                    <TableHead className="text-xs text-white/70">Status</TableHead>
                    <TableHead className="text-xs text-white/70">Aviso</TableHead>
                    <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculos?.map((veiculo) => (
                    <TableRow 
                      key={veiculo.id}
                      onClick={() => handleRowClick(veiculo.id)}
                      className={`cursor-pointer border-white/10 hover:bg-blue-500/5 text-white/90 ${veiculo.aviso_justificativa ? 'border-l-2 border-l-amber-500' : ''}`}
                    >
                      <TableCell>
                        {veiculo.foto_url ? (
                          <img 
                            src={veiculo.foto_url} 
                            alt={veiculo.nome}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/50">
                            -
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{veiculo.nome}</TableCell>
                      <TableCell>{veiculo.placa || '-'}</TableCell>
                      <TableCell>{veiculo.ano}</TableCell>
                      <TableCell className="font-medium">{veiculo.modelo}</TableCell>
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
                          <span className="text-white/30">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAvisoVeiculo({ id: veiculo.id, nome: veiculo.nome, aviso: veiculo.aviso_justificativa, data: veiculo.aviso_data });
                            }}
                          >
                            <MessageSquareWarning className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-white/70 hover:text-blue-400 hover:bg-blue-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/logistica/frota/${veiculo.id}/editar`);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(veiculo.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {veiculos?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-white/50">
                        Nenhum veículo cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <TrocaOleoDialog 
        open={trocaOleoOpen} 
        onOpenChange={setTrocaOleoOpen} 
        veiculos={veiculos || []} 
      />

      {avisoVeiculo && (
        <AvisoVeiculoModal
          open={!!avisoVeiculo}
          onOpenChange={(open) => !open && setAvisoVeiculo(null)}
          veiculoNome={avisoVeiculo.nome}
          avisoAtual={avisoVeiculo.aviso}
          avisoData={avisoVeiculo.data}
          onSalvar={async (justificativa) => {
            await updateVeiculo({ id: avisoVeiculo.id, data: { aviso_justificativa: justificativa, aviso_data: new Date().toISOString() } as any });
            setAvisoVeiculo(null);
          }}
          onRemover={async () => {
            await updateVeiculo({ id: avisoVeiculo.id, data: { aviso_justificativa: null, aviso_data: null } as any });
            setAvisoVeiculo(null);
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-black/90 border-white/10 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-white/10 text-white hover:bg-white/15">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500/80 hover:bg-red-500 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
