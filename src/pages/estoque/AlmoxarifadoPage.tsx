import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import { useAlmoxarifado, AlmoxarifadoItem, AlmoxarifadoFormData } from "@/hooks/useAlmoxarifado";
import { useFornecedores } from "@/hooks/useFornecedores";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default function AlmoxarifadoPage() {
  const { items, isLoading, createItem, updateItem, deleteItem, isCreating, isUpdating, isDeleting } = useAlmoxarifado();
  const { fornecedores } = useFornecedores();
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AlmoxarifadoItem | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<AlmoxarifadoFormData>({
    nome: "",
    fornecedor_id: null,
    quantidade_minima: 0,
    quantidade_maxima: 0,
    quantidade_estoque: 0,
    data_ultima_conferencia: null,
    custo: 0,
    unidade: "Un.",
  });

  const handleEdit = (item: AlmoxarifadoItem) => {
    setSelectedItem(item);
    setFormData({
      nome: item.nome,
      fornecedor_id: item.fornecedor_id,
      quantidade_minima: item.quantidade_minima,
      quantidade_maxima: item.quantidade_maxima,
      quantidade_estoque: item.quantidade_estoque,
      data_ultima_conferencia: item.data_ultima_conferencia,
      custo: item.custo,
      unidade: item.unidade,
    });
    setFormOpen(true);
  };

  const handleNew = () => {
    setSelectedItem(undefined);
    setFormData({
      nome: "",
      fornecedor_id: null,
      quantidade_minima: 0,
      quantidade_maxima: 0,
      quantidade_estoque: 0,
      data_ultima_conferencia: null,
      custo: 0,
      unidade: "Un.",
    });
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItem) {
      await updateItem({ id: selectedItem.id, ...formData });
    } else {
      await createItem(formData);
    }
    
    setFormOpen(false);
  };

  const getStockStatus = (item: AlmoxarifadoItem) => {
    if (item.quantidade_estoque < item.quantidade_minima) {
      return "low";
    }
    if (item.quantidade_estoque > item.quantidade_maxima) {
      return "high";
    }
    return "normal";
  };

  const breadcrumbItems = [
    { label: 'Home', path: '/home' },
    { label: 'Estoque', path: '/estoque' },
    { label: 'Almoxarifado' }
  ];

  const headerActions = (
    <Button 
      onClick={handleNew}
      className="bg-gradient-to-r from-blue-500 to-blue-700 text-white border-0"
      size="sm"
    >
      <Plus className="h-4 w-4 mr-2" />
      Novo Item
    </Button>
  );

  return (
    <MinimalistLayout
      title="Almoxarifado"
      subtitle="Gestão de insumos"
      backPath="/estoque"
      headerActions={headerActions}
      breadcrumbItems={breadcrumbItems}
    >
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="p-4 rounded-lg">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Lista de Insumos</h3>
            <p className="text-sm text-white/60">
              {items.length} item(s) cadastrado(s)
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-white/40">
              Carregando insumos...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              Nenhum insumo cadastrado. Clique em "Novo Item" para começar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60">Nome</TableHead>
                    <TableHead className="text-white/60">Fornecedor</TableHead>
                    <TableHead className="text-center text-white/60">Qtd. Mín.</TableHead>
                    <TableHead className="text-center text-white/60">Qtd. Máx.</TableHead>
                    <TableHead className="text-center text-white/60">Em Estoque</TableHead>
                    <TableHead className="text-white/60">Última Conf.</TableHead>
                    <TableHead className="text-right text-white/60">Custo</TableHead>
                    <TableHead className="text-center text-white/60">Un.</TableHead>
                    <TableHead className="text-right text-white/60">Total</TableHead>
                    <TableHead className="text-right text-white/60">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const status = getStockStatus(item);
                    
                    return (
                      <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            {item.nome}
                            {status === "low" && (
                              <AlertCircle className="h-4 w-4 text-red-400" />
                            )}
                            {status === "high" && (
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80">
                          {item.fornecedor?.nome || "-"}
                        </TableCell>
                        <TableCell className="text-center text-white/80">
                          {item.quantidade_minima}
                        </TableCell>
                        <TableCell className="text-center text-white/80">
                          {item.quantidade_maxima}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={
                            status === "low" 
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : status === "high"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                          }>
                            {item.quantidade_estoque}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/80">
                          {item.data_ultima_conferencia 
                            ? format(new Date(item.data_ultima_conferencia), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right text-white/80">
                          {formatCurrency(item.custo)}
                        </TableCell>
                        <TableCell className="text-center text-white/80">
                          {item.unidade}
                        </TableCell>
                        <TableCell className="text-right font-medium text-white">
                          {formatCurrency(item.total_estoque || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Editar Item" : "Novo Item"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Preencha os dados do insumo
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor_id">Fornecedor</Label>
              <Select
                value={formData.fornecedor_id || ""}
                onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value || null })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {fornecedores.map((forn) => (
                    <SelectItem key={forn.id} value={forn.id}>
                      {forn.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade_minima">Qtd. Mínima</Label>
                <Input
                  id="quantidade_minima"
                  type="number"
                  value={formData.quantidade_minima}
                  onChange={(e) => setFormData({ ...formData, quantidade_minima: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade_maxima">Qtd. Máxima</Label>
                <Input
                  id="quantidade_maxima"
                  type="number"
                  value={formData.quantidade_maxima}
                  onChange={(e) => setFormData({ ...formData, quantidade_maxima: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade_estoque">Em Estoque</Label>
                <Input
                  id="quantidade_estoque"
                  type="number"
                  value={formData.quantidade_estoque}
                  onChange={(e) => setFormData({ ...formData, quantidade_estoque: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custo">Custo</Label>
                <Input
                  id="custo"
                  type="number"
                  step="0.01"
                  value={formData.custo}
                  onChange={(e) => setFormData({ ...formData, custo: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Select
                  value={formData.unidade}
                  onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="Un.">Un.</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                    <SelectItem value="Metro">Metro</SelectItem>
                    <SelectItem value="Litro">Litro</SelectItem>
                    <SelectItem value="M²">M²</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setFormOpen(false)}
                className="border-white/10 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white border-0"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting} 
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MinimalistLayout>
  );
}
