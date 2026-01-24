import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, ArrowLeft, Search, Package } from "lucide-react";

import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useFretesCidades, FreteCidade, FreteCidadeInput } from "@/hooks/useFretesCidades";
import { FreteDialog } from "@/components/frete/FreteDialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function FreteMinimalista() {
  const navigate = useNavigate();
  const { fretes, isLoading, deleteFrete, toggleAtivo } = useFretesCidades();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFrete, setEditingFrete] = useState<FreteCidade | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const fretesFiltrados = useMemo(() => {
    if (!fretes) return [];
    
    return fretes.filter(frete => {
      const matchSearch = frete.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         frete.estado.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = filterEstado === "todos" || frete.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [fretes, searchTerm, filterEstado]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteFrete.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleEdit = (frete: FreteCidade) => {
    setEditingFrete(frete);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingFrete(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingFrete(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Logística", path: "/logistica" },
          { label: "Frete" }
        ]} 
        mounted={mounted} 
      />
      
      <div className="relative z-10 min-h-screen flex flex-col pt-14">
        {/* Header */}
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
                <h1 className="text-lg font-semibold text-white">Frete por Cidade</h1>
                <p className="text-xs text-white/60">Gerencie os valores de frete</p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleNew}
              className="text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
          </div>
        </header>

        {/* Filtros */}
        <div className="px-4 py-3 border-b border-primary/10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Buscar por cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Estados</SelectItem>
                {ESTADOS_BR.map(estado => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conteúdo */}
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
                          <TableHead className="text-xs text-white/70">Estado</TableHead>
                          <TableHead className="text-xs text-white/70">Cidade</TableHead>
                          <TableHead className="text-xs text-white/70">Valor do Frete</TableHead>
                          <TableHead className="text-xs text-white/70">Observações</TableHead>
                          <TableHead className="text-xs text-white/70">Ativo</TableHead>
                          <TableHead className="text-right text-xs text-white/70">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fretesFiltrados.map((frete) => (
                          <TableRow 
                            key={frete.id}
                            className="cursor-pointer border-primary/10 hover:bg-primary/10 text-white/90"
                          >
                            <TableCell className="font-medium">{frete.estado}</TableCell>
                            <TableCell>{frete.cidade}</TableCell>
                            <TableCell className="font-medium text-green-400">
                              {formatCurrency(frete.valor_frete)}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-white/60">
                              {frete.observacoes || '-'}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={frete.ativo}
                                onCheckedChange={(checked) => 
                                  toggleAtivo.mutate({ id: frete.id, ativo: checked })
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-primary/20"
                                  onClick={() => handleEdit(frete)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  onClick={() => setDeleteId(frete.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {fretesFiltrados.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-white/50">
                              <div className="flex flex-col items-center gap-2">
                                <Package className="h-8 w-8 text-white/30" />
                                <span>Nenhum frete cadastrado</span>
                              </div>
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

      <FreteDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        frete={editingFrete}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este frete? Esta ação não pode ser desfeita.
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
