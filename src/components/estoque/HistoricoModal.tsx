import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProdutoEstoque } from "@/hooks/useEstoque";
import { useCategorias } from "@/hooks/useCategorias";
import { ArrowDown, ArrowUp, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoModalProps {
  produto: ProdutoEstoque | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacoes: any[];
  loading: boolean;
}

export function HistoricoModal({ 
  produto, 
  open, 
  onOpenChange, 
  movimentacoes,
  loading 
}: HistoricoModalProps) {
  const { categorias } = useCategorias();

  const getCategoriaColor = (categoriaValue: string) => {
    const cat = categorias.find(c => c.nome.toLowerCase() === categoriaValue.toLowerCase());
    return cat ? `bg-${cat.cor}-500` : "bg-gray-500";
  };

  if (!produto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Movimentações</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold">{produto.nome_produto}</p>
            <p className="text-sm text-muted-foreground">
              Estoque atual: <span className="font-semibold">{produto.quantidade} {produto.unidade}</span>
            </p>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando histórico...</p>
          ) : movimentacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma movimentação registrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {mov.tipo_movimentacao === 'entrada' ? (
                        <Badge className="bg-green-500 gap-1">
                          <ArrowUp className="h-3 w-3" />
                          Entrada
                        </Badge>
                      ) : mov.tipo_movimentacao === 'saida' ? (
                        <Badge className="bg-red-500 gap-1">
                          <ArrowDown className="h-3 w-3" />
                          Saída
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500 gap-1">
                          <Tag className="h-3 w-3" />
                          Categoria
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {mov.tipo_movimentacao === 'alteracao_categoria' ? (
                        <div className="flex gap-2 items-center">
                          <Badge className={getCategoriaColor(mov.categoria_anterior || '')}>
                            {mov.categoria_anterior}
                          </Badge>
                          <span>→</span>
                          <Badge className={getCategoriaColor(mov.categoria_nova || '')}>
                            {mov.categoria_nova}
                          </Badge>
                        </div>
                      ) : (
                        <span>
                          {mov.tipo_movimentacao === 'entrada' ? '+' : '-'}{mov.quantidade}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {mov.tipo_movimentacao !== 'alteracao_categoria' 
                        ? `${mov.quantidade_anterior} → ${mov.quantidade_nova}`
                        : '—'
                      }
                    </TableCell>
                    <TableCell className="text-sm">
                      {mov.admin_users?.nome || "Sistema"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {mov.observacoes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
