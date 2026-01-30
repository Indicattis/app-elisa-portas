import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, Check, Loader2 } from "lucide-react";
import { useEstoqueConferencia, ConferenciaItem } from "@/hooks/useEstoqueConferencia";
import { ConferenciaItemRow } from "@/components/conferencia/ConferenciaItemRow";

export default function ConferenciaEstoqueFabrica() {
  const navigate = useNavigate();
  const { produtos, loading, searchTerm, setSearchTerm, criarConferencia, criando } =
    useEstoqueConferencia();

  const [quantidadesConferidas, setQuantidadesConferidas] = useState<
    Record<string, number | null>
  >({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  const handleQuantidadeChange = (produtoId: string, quantidade: number | null) => {
    setQuantidadesConferidas((prev) => ({
      ...prev,
      [produtoId]: quantidade,
    }));
  };

  // Produtos filtrados pelo termo de busca local (já filtrado na query)
  const produtosFiltrados = produtos;

  // Estatísticas
  const estatisticas = useMemo(() => {
    const conferidos = Object.values(quantidadesConferidas).filter(
      (q) => q !== null
    ).length;
    const comDiferenca = produtos.filter((p) => {
      const qConf = quantidadesConferidas[p.id];
      return qConf !== null && qConf !== undefined && qConf !== p.quantidade;
    }).length;
    return { conferidos, total: produtos.length, comDiferenca };
  }, [quantidadesConferidas, produtos]);

  const handleFinalizar = async () => {
    const itens: ConferenciaItem[] = produtos
      .filter((p) => quantidadesConferidas[p.id] !== null && quantidadesConferidas[p.id] !== undefined)
      .map((p) => ({
        produto_id: p.id,
        quantidade_anterior: p.quantidade,
        quantidade_conferida: quantidadesConferidas[p.id]!,
      }));

    if (itens.length === 0) {
      return;
    }

    try {
      await criarConferencia({ itens, observacoes: observacoes || undefined });
      setShowConfirmDialog(false);
      navigate("/producao/home");
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const podeFinalizarConferencia = estatisticas.conferidos > 0;

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/producao/home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Conferência de Estoque</h1>
            <p className="text-sm text-muted-foreground">
              Informe a quantidade atual de cada item
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!podeFinalizarConferencia || criando}
        >
          {criando ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Finalizar Conferência
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <div className="text-xs text-muted-foreground">Itens no estoque</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {estatisticas.conferidos}
            </div>
            <div className="text-xs text-muted-foreground">Conferidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-500">
              {estatisticas.comDiferenca}
            </div>
            <div className="text-xs text-muted-foreground">Com diferença</div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, SKU ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Itens do Estoque</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">SKU</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-32">Categoria</TableHead>
                    <TableHead className="w-24 text-center">Sistema</TableHead>
                    <TableHead className="w-32 text-center">Conferido</TableHead>
                    <TableHead className="w-24 text-center">Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.map((produto) => (
                    <ConferenciaItemRow
                      key={produto.id}
                      produto={produto}
                      quantidadeConferida={quantidadesConferidas[produto.id] ?? null}
                      onQuantidadeChange={handleQuantidadeChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Conferência?</AlertDialogTitle>
            <AlertDialogDescription>
              Você conferiu {estatisticas.conferidos} de {estatisticas.total} itens.
              {estatisticas.comDiferenca > 0 && (
                <span className="block mt-1 text-orange-600">
                  {estatisticas.comDiferenca} item(s) com diferença serão atualizados.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium">Observações (opcional)</label>
            <Textarea
              placeholder="Adicione observações sobre a conferência..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizar} disabled={criando}>
              {criando ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
