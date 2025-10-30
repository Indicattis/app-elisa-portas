import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useCategorias } from "@/hooks/useCategorias";

interface GerenciarSubcategoriasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarSubcategoriasModal({ open, onOpenChange }: GerenciarSubcategoriasModalProps) {
  const { categorias } = useCategorias();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const { subcategorias, adicionarSubcategoria, removerSubcategoria } = useSubcategorias(categoriaSelecionada || undefined);
  
  const [novaSubcategoria, setNovaSubcategoria] = useState({
    nome: "",
    descricao: "",
  });

  const handleAdicionar = async () => {
    if (!categoriaSelecionada || !novaSubcategoria.nome) return;
    
    await adicionarSubcategoria({
      nome: novaSubcategoria.nome,
      descricao: novaSubcategoria.descricao,
      categoria_id: categoriaSelecionada,
      ordem: subcategorias.length,
    });
    
    setNovaSubcategoria({ nome: "", descricao: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Subcategorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seletor de Categoria */}
          <div>
            <Label>Categoria Principal</Label>
            <Select value={categoriaSelecionada || ""} onValueChange={setCategoriaSelecionada}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {categoriaSelecionada && (
            <>
              {/* Formulário de Nova Subcategoria */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold">Adicionar Subcategoria</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={novaSubcategoria.nome}
                        onChange={(e) => setNovaSubcategoria({...novaSubcategoria, nome: e.target.value})}
                        placeholder="Ex: Fechaduras"
                      />
                    </div>
                    <div>
                      <Label>Descrição (opcional)</Label>
                      <Input
                        value={novaSubcategoria.descricao}
                        onChange={(e) => setNovaSubcategoria({...novaSubcategoria, descricao: e.target.value})}
                        placeholder="Ex: Componentes de travamento"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAdicionar} size="sm" disabled={!novaSubcategoria.nome}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Subcategorias */}
              <div className="space-y-2">
                <h3 className="font-semibold">Subcategorias Cadastradas</h3>
                {subcategorias.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma subcategoria cadastrada para esta categoria.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subcategorias.map((sub) => (
                      <Card key={sub.id}>
                        <CardContent className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{sub.nome}</p>
                            {sub.descricao && (
                              <p className="text-sm text-muted-foreground">{sub.descricao}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removerSubcategoria(sub.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
