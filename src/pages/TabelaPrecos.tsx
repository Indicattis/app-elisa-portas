import { useState } from "react";
import { DollarSign, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTabelaPrecos, ItemTabelaPreco, ItemTabelaPrecoInput } from "@/hooks/useTabelaPrecos";
import { ItemModal } from "@/components/tabela-precos/ItemModal";

export default function TabelaPrecos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemTabelaPreco | null>(null);
  const [itemParaInativar, setItemParaInativar] = useState<ItemTabelaPreco | null>(null);

  const { itens, isLoading, adicionarItem, editarItem, inativarItem } = useTabelaPrecos(searchTerm);

  const handleNovoItem = () => {
    setItemEditando(null);
    setModalOpen(true);
  };

  const handleEditarItem = (item: ItemTabelaPreco) => {
    setItemEditando(item);
    setModalOpen(true);
  };

  const handleSubmit = async (dados: ItemTabelaPrecoInput) => {
    if (itemEditando) {
      await editarItem({ id: itemEditando.id, dados });
    } else {
      await adicionarItem(dados);
    }
  };

  const handleConfirmarInativacao = async () => {
    if (itemParaInativar) {
      await inativarItem(itemParaInativar.id);
      setItemParaInativar(null);
    }
  };

  const calcularTotal = (item: ItemTabelaPreco) => {
    return item.valor_porta + item.valor_instalacao + item.valor_pintura;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tabela de Preços</h1>
            <p className="text-sm text-muted-foreground">
              Gestão de preços das portas por tamanho
            </p>
          </div>
        </div>

        <Button onClick={handleNovoItem}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Itens Cadastrados</CardTitle>
              <CardDescription>
                {itens.length} {itens.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou medidas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : itens.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Largura</TableHead>
                    <TableHead className="text-center">Altura</TableHead>
                    <TableHead className="text-right">Valor Porta</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Valor Instalação</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Valor Pintura</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => {
                    const total = calcularTotal(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.descricao}</TableCell>
                        <TableCell className="text-center">{item.largura}m</TableCell>
                        <TableCell className="text-center">{item.altura}m</TableCell>
                        <TableCell className="text-right">
                          {item.valor_porta.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">
                          {item.valor_instalacao.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">
                          {item.valor_pintura.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-semibold">
                            {total.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            })}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditarItem(item)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setItemParaInativar(item)}
                              title="Inativar"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </CardContent>
      </Card>

      {/* Modal de Adicionar/Editar */}
      <ItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
        itemEditando={itemEditando}
      />

      {/* Dialog de Confirmação de Inativação */}
      <AlertDialog open={!!itemParaInativar} onOpenChange={() => setItemParaInativar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Inativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja inativar o item "{itemParaInativar?.descricao}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarInativacao}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
