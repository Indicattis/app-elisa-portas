import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Droplet, ArrowLeft, LogOut } from "lucide-react";

import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVeiculos } from "@/hooks/useVeiculos";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { TrocaOleoDialog } from "@/components/frota/TrocaOleoDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
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
  const { signOut } = useAuth();
  const { veiculos, isLoading, deleteVeiculo } = useVeiculos();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [trocaOleoOpen, setTrocaOleoOpen] = useState(false);

  const handleRowDoubleClick = (veiculoId: string) => {
    navigate(`/dashboard/logistica/frota/${veiculoId}/conferencias`);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteVeiculo(deleteId);
      setDeleteId(null);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Frota" }
        ]} 
        mounted={mounted} 
      />
      
      <div className="relative z-10 min-h-screen flex flex-col pt-14">
        <header className="sticky top-0 z-20 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/logistica')}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/80" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Frota</h1>
                <p className="text-xs text-white/60">Gerencie os veículos da empresa</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrocaOleoOpen(true)}
                className="border-primary/30 bg-primary/10 text-white hover:bg-primary/20 text-xs gap-1"
              >
                <Droplet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Troca Óleo</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/dashboard/logistica/frota/novo')}
                className="text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-white/80 hover:text-white hover:bg-primary/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="border-primary/10 hover:bg-primary/5">
                          <TableHead className="text-xs text-white/70">Foto</TableHead>
                          <TableHead className="text-xs text-white/70">Modelo</TableHead>
                          <TableHead className="text-xs text-white/70">Placa</TableHead>
                          <TableHead className="text-xs text-white/70">Ano</TableHead>
                          <TableHead className="text-xs text-white/70">Apelido</TableHead>
                          <TableHead className="text-xs text-white/70">Responsável</TableHead>
                          <TableHead className="text-xs text-white/70">Km Atual</TableHead>
                          <TableHead className="text-xs text-white/70">Próx. Troca Óleo</TableHead>
                          <TableHead className="text-xs text-white/70">Status</TableHead>
                          <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {veiculos?.map((veiculo) => (
                          <TableRow 
                            key={veiculo.id}
                            onDoubleClick={() => handleRowDoubleClick(veiculo.id)}
                            className="cursor-pointer border-primary/10 hover:bg-primary/10 text-white/90"
                          >
                            <TableCell>
                              {veiculo.foto_url ? (
                                <img 
                                  src={veiculo.foto_url} 
                                  alt={veiculo.nome}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center text-[10px] text-white/50">
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
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-primary/20"
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
                            <TableCell colSpan={10} className="text-center py-8 text-white/50">
                              Nenhum veículo cadastrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

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
