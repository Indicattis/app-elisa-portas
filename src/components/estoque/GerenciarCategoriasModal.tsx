import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategorias, Categoria } from "@/hooks/useCategorias";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

interface GerenciarCategoriasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CORES_DISPONIVEIS = [
  { valor: "gray", nome: "Cinza" },
  { valor: "blue", nome: "Azul" },
  { valor: "purple", nome: "Roxo" },
  { valor: "green", nome: "Verde" },
  { valor: "orange", nome: "Laranja" },
  { valor: "red", nome: "Vermelho" },
  { valor: "yellow", nome: "Amarelo" },
  { valor: "pink", nome: "Rosa" },
  { valor: "indigo", nome: "Índigo" },
];

export function GerenciarCategoriasModal({ open, onOpenChange }: GerenciarCategoriasModalProps) {
  const { categorias, adicionarCategoria, editarCategoria, removerCategoria } = useCategorias();
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [categoriaRemover, setCategoriaRemover] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: "", cor: "gray" });

  const handleSubmit = async () => {
    if (!formData.nome.trim()) return;

    if (editando) {
      await editarCategoria({ id: editando.id, ...formData });
      setEditando(null);
    } else {
      await adicionarCategoria({
        ...formData,
        ordem: categorias.length + 1,
      });
    }
    setFormData({ nome: "", cor: "gray" });
  };

  const handleEditar = (categoria: Categoria) => {
    setEditando(categoria);
    setFormData({ nome: categoria.nome, cor: categoria.cor });
  };

  const handleCancelar = () => {
    setEditando(null);
    setFormData({ nome: "", cor: "gray" });
  };

  const handleRemover = async () => {
    if (categoriaRemover) {
      await removerCategoria(categoriaRemover);
      setCategoriaRemover(null);
    }
  };

  const getCorClass = (cor: string) => `bg-${cor}-500`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Formulário */}
            <div className="p-4 border rounded-lg space-y-4">
              <h3 className="font-semibold">
                {editando ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Categoria</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Ferramentas"
                  />
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {CORES_DISPONIVEIS.map((cor) => (
                      <button
                        key={cor.valor}
                        type="button"
                        onClick={() => setFormData({ ...formData, cor: cor.valor })}
                        className={`w-8 h-8 rounded-full ${getCorClass(cor.valor)} ${
                          formData.cor === cor.valor
                            ? "ring-2 ring-offset-2 ring-primary"
                            : "opacity-60 hover:opacity-100"
                        } transition-all`}
                        title={cor.nome}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {editando && (
                  <Button variant="outline" onClick={handleCancelar}>
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleSubmit} disabled={!formData.nome.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {editando ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </div>

            {/* Lista de Categorias */}
            <div>
              <h3 className="font-semibold mb-3">Categorias Existentes</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Visualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell className="font-medium">{categoria.nome}</TableCell>
                      <TableCell>
                        <Badge className={getCorClass(categoria.cor)}>
                          {categoria.nome}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditar(categoria)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCategoriaRemover(categoria.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categorias.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Nenhuma categoria cadastrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!categoriaRemover} onOpenChange={() => setCategoriaRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta categoria? Os produtos com esta categoria
              continuarão com ela, mas ela não estará mais disponível para novos produtos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemover}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
