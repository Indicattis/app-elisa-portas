import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, DollarSign, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { useAlmoxarifado, AlmoxarifadoItem, AlmoxarifadoFormData } from "@/hooks/useAlmoxarifado";
import { useFornecedores } from "@/hooks/useFornecedores";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function ProdutosAlmoxarifado() {
  const { items, isLoading, createItem, updateItem, deleteItem, isCreating, isUpdating, isDeleting } = useAlmoxarifado();
  const { fornecedores } = useFornecedores();
  const queryClient = useQueryClient();
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AlmoxarifadoItem | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState<AlmoxarifadoFormData>({
    nome: "",
    fornecedor_id: null,
    quantidade_minima: 0,
    quantidade_maxima: 0,
    quantidade_estoque: 0,
    data_ultima_conferencia: null,
    custo: 0,
    unidade: "Un.",
    conferir_estoque: false,
  });

  const filteredItems = items.filter(item =>
    !searchTerm ||
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = useMemo(() => {
    const conferidos = filteredItems.filter(item => item.conferir_estoque);
    const base = conferidos.reduce(
      (acc, item) => ({
        minima: acc.minima + (item.quantidade_minima || 0),
        maxima: acc.maxima + (item.quantidade_maxima || 0),
        atual: acc.atual + (item.quantidade_estoque || 0),
        valor: acc.valor + (item.total_estoque || 0),
      }),
      { minima: 0, maxima: 0, atual: 0, valor: 0 }
    );
    const estoqueBaixo = conferidos.filter(item => item.quantidade_estoque < item.quantidade_minima).length;
    const estoqueExcesso = conferidos.filter(item => item.quantidade_estoque > item.quantidade_maxima).length;
    return { ...base, estoqueBaixo, estoqueExcesso };
  }, [filteredItems]);

  const handleToggleConferir = async (item: AlmoxarifadoItem) => {
    const newValue = !item.conferir_estoque;
    const { error } = await supabase
      .from("almoxarifado")
      .update({ conferir_estoque: newValue } as any)
      .eq("id", item.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["almoxarifado"] });
  };

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
      conferir_estoque: item.conferir_estoque,
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
      conferir_estoque: false,
    });
    setFormOpen(true);
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    await deleteItem(id);
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
    if (item.quantidade_estoque < item.quantidade_minima) return "low";
    if (item.quantidade_estoque > item.quantidade_maxima) return "high";
    return "normal";
  };

  const breadcrumbItems = [
    { label: 'Home', path: '/home' },
    { label: 'Direção', path: '/direcao' },
    { label: 'Estoque', path: '/direcao/estoque' },
    { label: 'Configurações', path: '/direcao/estoque/configuracoes' },
    { label: 'Produtos', path: '/direcao/estoque/configuracoes/produtos' },
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
      backPath="/direcao/estoque/configuracoes/produtos"
      headerActions={headerActions}
      breadcrumbItems={breadcrumbItems}
    >
      <div className="space-y-4">
        {/* Barra de busca + indicadores */}
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="p-4 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Input
                placeholder="Buscar insumos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <div className="flex flex-wrap gap-3 flex-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-400/70 uppercase font-medium leading-none">Valor Estoque</span>
                    <span className="text-sm font-bold text-emerald-400">{formatCurrency(totals.valor)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Package className="h-4 w-4 text-blue-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-blue-400/70 uppercase font-medium leading-none">Itens</span>
                    <span className="text-sm font-bold text-blue-400">{filteredItems.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-red-400/70 uppercase font-medium leading-none">Estoque Baixo</span>
                    <span className="text-sm font-bold text-red-400">{totals.estoqueBaixo}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-amber-400/70 uppercase font-medium leading-none">Em Excesso</span>
                    <span className="text-sm font-bold text-amber-400">{totals.estoqueExcesso}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-white/40">
              Dica: Clique duas vezes em um item para editá-lo.
            </p>
          </div>
        </div>

        {/* Tabela */}
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-white/60">Produto</TableHead>
                  <TableHead className="text-xs font-medium text-white/60">Fornecedor</TableHead>
                  <TableHead className="text-center text-xs font-medium text-white/60">Est. Mín</TableHead>
                  <TableHead className="text-center text-xs font-medium text-white/60">Est. Máx</TableHead>
                  <TableHead className="text-center text-xs font-medium text-white/60">Atual</TableHead>
                  <TableHead className="text-right text-xs font-medium text-white/60">Preço/Un</TableHead>
                  <TableHead className="text-right text-xs font-medium text-white/60">Valor Total</TableHead>
                  <TableHead className="text-center text-xs font-medium text-white/60">Conferir</TableHead>
                  <TableHead className="text-center text-xs font-medium text-white/60">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={9} className="text-center py-8 text-sm text-white/40">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={9} className="text-center py-8 text-sm text-white/40">
                      {searchTerm ? "Nenhum insumo encontrado" : "Nenhum insumo cadastrado. Clique em \"Novo Item\" para começar."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const status = getStockStatus(item);
                    const conferido = item.conferir_estoque;
                    return (
                      <TableRow
                        key={item.id}
                        className="border-white/10 hover:bg-white/5 cursor-pointer"
                        onDoubleClick={() => handleEdit(item)}
                      >
                        <TableCell>
                          <p className="text-sm font-medium text-white">{item.nome}</p>
                        </TableCell>
                        <TableCell className="text-white/60 text-sm">
                          {item.fornecedor?.nome || <span className="text-white/30">—</span>}
                        </TableCell>
                        <TableCell className="text-center text-white/80">
                          {conferido ? item.quantidade_minima : <span className="text-white/30">---</span>}
                        </TableCell>
                        <TableCell className="text-center text-white/80">
                          {conferido ? item.quantidade_maxima : <span className="text-white/30">---</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {conferido ? (
                            <Badge className={
                              status === "low"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : status === "high"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-green-500/20 text-green-400 border-green-500/30"
                            }>
                              {item.quantidade_estoque}
                            </Badge>
                          ) : <span className="text-white/30">---</span>}
                        </TableCell>
                        <TableCell className="text-right text-white/80">
                          {conferido ? formatCurrency(item.custo) : <span className="text-white/30">---</span>}
                        </TableCell>
                        <TableCell className="text-right font-medium text-white">
                          {conferido ? formatCurrency(item.total_estoque || 0) : <span className="text-white/30">---</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={item.conferir_estoque}
                            onCheckedChange={() => handleToggleConferir(item)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={(e) => { e.stopPropagation(); handleExcluir(item.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              {filteredItems.length > 0 && (
                <TableFooter className="bg-white/5 border-t border-white/20">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableCell className="font-bold text-white">
                      TOTAL ({filteredItems.length} itens)
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-center font-bold text-white">
                      {totals.minima}
                    </TableCell>
                    <TableCell className="text-center font-bold text-white">
                      {totals.maxima}
                    </TableCell>
                    <TableCell className="text-center font-bold text-white">
                      {totals.atual}
                    </TableCell>
                    <TableCell className="text-right font-bold text-white/50">
                      ---
                    </TableCell>
                    <TableCell className="text-right font-bold text-white">
                      {formatCurrency(totals.valor)}
                    </TableCell>
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="conferir_estoque"
                checked={formData.conferir_estoque}
                onCheckedChange={(checked) => setFormData({ ...formData, conferir_estoque: !!checked })}
              />
              <Label htmlFor="conferir_estoque" className="text-sm text-white/80 cursor-pointer">
                Conferir estoque deste item
              </Label>
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
    </MinimalistLayout>
  );
}
