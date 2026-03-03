import { useState, useEffect } from "react";
import { Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface EstoqueItem {
  id: string;
  nome_produto: string;
  categoria: string | null;
  unidade: string;
  custo_unitario: number;
}

export default function DRECustosDirecao() {
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchItens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("estoque")
        .select("id, nome_produto, categoria, unidade, custo_unitario")
        .eq("ativo", true)
        .order("nome_produto", { ascending: true });

      if (error) throw error;
      setItens((data || []) as EstoqueItem[]);
    } catch (error) {
      toast.error("Erro ao carregar itens do estoque");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItens(); }, []);

  const handleStartEdit = (item: EstoqueItem) => {
    setEditingId(item.id);
    setEditValue(item.custo_unitario.toString());
  };

  const handleSave = async (id: string) => {
    const valor = parseFloat(editValue);
    if (isNaN(valor) || valor < 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const { error } = await supabase
        .from("estoque")
        .update({ custo_unitario: valor })
        .eq("id", id);
      if (error) throw error;
      setItens(prev => prev.map(i => i.id === id ? { ...i, custo_unitario: valor } : i));
      toast.success("Custo atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar custo");
      console.error(error);
    }
    setEditingId(null);
  };

  const handleCancel = () => setEditingId(null);

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") handleSave(id);
    if (e.key === "Escape") handleCancel();
  };

  const filtered = itens.filter(i =>
    i.nome_produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MinimalistLayout
      title="Custos de Estoque"
      subtitle="Configure o custo unitário de cada item"
      backPath="/direcao/dre"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Direção', path: '/direcao' },
        { label: 'DRE', path: '/direcao/dre' },
        { label: 'Custos' },
      ]}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Buscar item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/70">Nome</TableHead>
                  <TableHead className="text-white/70">Categoria</TableHead>
                  <TableHead className="text-white/70">Unidade</TableHead>
                  <TableHead className="text-white/70 text-right">Custo Unitário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-white/50 py-8">Nenhum item encontrado</TableCell></TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{item.nome_produto}</TableCell>
                      <TableCell className="text-white/70">{item.categoria || "-"}</TableCell>
                      <TableCell className="text-white/70">{item.unidade}</TableCell>
                      <TableCell className="text-right">
                        {editingId === item.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, item.id)}
                              onBlur={() => handleSave(item.id)}
                              autoFocus
                              className="w-28 h-8 bg-white/10 border-white/20 text-white text-right"
                            />
                            <button onClick={() => handleSave(item.id)} className="p-1 text-green-400 hover:text-green-300"><Check className="h-4 w-4" /></button>
                            <button onClick={handleCancel} className="p-1 text-red-400 hover:text-red-300"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="font-medium text-white hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            {formatCurrency(item.custo_unitario)}
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </MinimalistLayout>
  );
}
