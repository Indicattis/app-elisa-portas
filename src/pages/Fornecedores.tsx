import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { useFornecedores, Fornecedor } from "@/hooks/useFornecedores";
import { FornecedorForm } from "@/components/compras/FornecedorForm";

export default function Fornecedores() {
  const { fornecedores, isLoading, createFornecedor, updateFornecedor, deleteFornecedor, isCreating, isUpdating, isDeleting } = useFornecedores();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<string | null>(null);

  const handleEdit = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setFormOpen(true);
  };

  const handleNew = () => {
    setSelectedFornecedor(undefined);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setFornecedorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (fornecedorToDelete) {
      await deleteFornecedor(fornecedorToDelete);
      setDeleteDialogOpen(false);
      setFornecedorToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Fornecedores</h1>
            <p className="text-muted-foreground">Gestão de fornecedores</p>
          </div>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>
            {fornecedores.length} fornecedor(es) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando fornecedores...
            </div>
          ) : fornecedores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fornecedor cadastrado. Clique em "Novo Fornecedor" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Cidade/Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell>
                      <Badge variant={fornecedor.tipo === "juridica" ? "default" : "secondary"}>
                        {fornecedor.tipo === "juridica" ? "PJ" : "PF"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                    <TableCell>{fornecedor.responsavel || "-"}</TableCell>
                    <TableCell>{fornecedor.cnpj || "-"}</TableCell>
                    <TableCell>
                      {fornecedor.cidade && fornecedor.estado 
                        ? `${fornecedor.cidade} - ${fornecedor.estado}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(fornecedor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(fornecedor.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FornecedorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (data) => {
          if (selectedFornecedor) {
            await updateFornecedor({ ...data, id: selectedFornecedor.id });
          } else {
            await createFornecedor(data);
          }
        }}
        fornecedor={selectedFornecedor}
        isSubmitting={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
