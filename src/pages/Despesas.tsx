import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDespesas, DespesaFormData } from "@/hooks/useDespesas";
import { Skeleton } from "@/components/ui/skeleton";

export default function Despesas() {
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), "yyyy-MM-01"));
  const { despesas, loading, saveDespesa, updateDespesa, deleteDespesa } = useDespesas(mesSelecionado);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<DespesaFormData>({
    mes: mesSelecionado,
    nome: "",
    categoria: "",
    modalidade: "fixa",
    valor_esperado: 0,
    valor_real: 0,
    observacoes: "",
  });

  const despesasFixas = despesas.filter(d => d.modalidade === 'fixa');
  const despesasVariaveis = despesas.filter(d => d.modalidade === 'variavel');

  const totalFixasEsperado = despesasFixas.reduce((acc, d) => acc + d.valor_esperado, 0);
  const totalFixasReal = despesasFixas.reduce((acc, d) => acc + d.valor_real, 0);
  const totalVariaveisEsperado = despesasVariaveis.reduce((acc, d) => acc + d.valor_esperado, 0);
  const totalVariaveisReal = despesasVariaveis.reduce((acc, d) => acc + d.valor_real, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDespesa) {
      const success = await updateDespesa(editingDespesa.id, formData);
      if (success) {
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const success = await saveDespesa({ ...formData, mes: mesSelecionado });
      if (success) {
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (despesa: any) => {
    setEditingDespesa(despesa);
    setFormData({
      mes: despesa.mes,
      nome: despesa.nome,
      categoria: despesa.categoria,
      modalidade: despesa.modalidade,
      valor_esperado: despesa.valor_esperado,
      valor_real: despesa.valor_real,
      observacoes: despesa.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDespesa(deleteId);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setEditingDespesa(null);
    setFormData({
      mes: mesSelecionado,
      nome: "",
      categoria: "",
      modalidade: "fixa",
      valor_esperado: 0,
      valor_real: 0,
      observacoes: "",
    });
  };

  const DespesasTable = ({ despesas: lista, tipo }: { despesas: any[], tipo: string }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead className="text-right">Valor Esperado</TableHead>
          <TableHead className="text-right">Valor Real</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lista.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              Nenhuma despesa {tipo} cadastrada para este mês
            </TableCell>
          </TableRow>
        ) : (
          lista.map((despesa) => (
            <TableRow key={despesa.id}>
              <TableCell className="font-medium">{despesa.nome}</TableCell>
              <TableCell>{despesa.categoria}</TableCell>
              <TableCell className="text-right">
                R$ {despesa.valor_esperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                R$ {despesa.valor_real.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(despesa)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(despesa.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Despesas Mensais</h1>
          <p className="text-muted-foreground">Gerencie despesas fixas e variáveis</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDespesa ? 'Editar' : 'Nova'} Despesa</DialogTitle>
              <DialogDescription>
                Preencha os dados da despesa
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Despesa</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modalidade">Modalidade</Label>
                <Select
                  value={formData.modalidade}
                  onValueChange={(value: 'fixa' | 'variavel') => setFormData({ ...formData, modalidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixa">Fixa</SelectItem>
                    <SelectItem value="variavel">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_esperado">Valor Esperado</Label>
                  <Input
                    id="valor_esperado"
                    type="number"
                    step="0.01"
                    value={formData.valor_esperado}
                    onChange={(e) => setFormData({ ...formData, valor_esperado: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_real">Valor Real</Label>
                  <Input
                    id="valor_real"
                    type="number"
                    step="0.01"
                    value={formData.valor_real}
                    onChange={(e) => setFormData({ ...formData, valor_real: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button type="submit">{editingDespesa ? 'Salvar' : 'Criar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="month"
            value={format(new Date(mesSelecionado), "yyyy-MM")}
            onChange={(e) => setMesSelecionado(e.target.value + "-01")}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Despesas Fixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Esperado:</span>
                <span className="font-semibold">R$ {totalFixasEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Real:</span>
                <span className="font-semibold">R$ {totalFixasReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas Variáveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Esperado:</span>
                <span className="font-semibold">R$ {totalVariaveisEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Real:</span>
                <span className="font-semibold">R$ {totalVariaveisReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="fixas">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fixas">
                  Fixas ({despesasFixas.length})
                </TabsTrigger>
                <TabsTrigger value="variaveis">
                  Variáveis ({despesasVariaveis.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="fixas">
                <DespesasTable despesas={despesasFixas} tipo="fixa" />
              </TabsContent>
              <TabsContent value="variaveis">
                <DespesasTable despesas={despesasVariaveis} tipo="variável" />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
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
