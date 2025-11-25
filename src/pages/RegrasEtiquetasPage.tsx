import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Tag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { useRegrasEtiquetas, RegraEtiqueta, RegraEtiquetaInput } from "@/hooks/useRegrasEtiquetas";
import { useEstoque } from "@/hooks/useEstoque";

const CONDICAO_TIPOS = [
  { value: "maior", label: "Maior que (>)" },
  { value: "menor", label: "Menor que (<)" },
  { value: "igual", label: "Igual a (=)" },
  { value: "maior_igual", label: "Maior ou igual (≥)" },
  { value: "menor_igual", label: "Menor ou igual (≤)" },
];

const CAMPOS_CONDICAO = [
  { value: "largura", label: "Largura (m)" },
  { value: "altura", label: "Altura (m)" },
  { value: "peso", label: "Peso (kg)" },
];

export default function RegrasEtiquetasPage() {
  const navigate = useNavigate();
  const { regras, isLoading, criarRegra, atualizarRegra, excluirRegra } = useRegrasEtiquetas();
  const { produtos } = useEstoque();

  const [modalAberto, setModalAberto] = useState(false);
  const [regraEditando, setRegraEditando] = useState<RegraEtiqueta | null>(null);
  const [regraExcluindo, setRegraExcluindo] = useState<RegraEtiqueta | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<string>("todos");

  const [formData, setFormData] = useState<RegraEtiquetaInput>({
    estoque_id: null,
    nome_regra: "",
    divisor: 1,
    campo_condicao: null,
    condicao_tipo: null,
    condicao_valor: null,
    ativo: true,
    prioridade: 0,
  });

  const resetForm = () => {
    setFormData({
      estoque_id: null,
      nome_regra: "",
      divisor: 1,
      campo_condicao: null,
      condicao_tipo: null,
      condicao_valor: null,
      ativo: true,
      prioridade: 0,
    });
    setRegraEditando(null);
  };

  const abrirModal = (regra?: RegraEtiqueta) => {
    if (regra) {
      setRegraEditando(regra);
      setFormData({
        estoque_id: regra.estoque_id,
        nome_regra: regra.nome_regra,
        divisor: regra.divisor,
        campo_condicao: regra.campo_condicao,
        condicao_tipo: regra.condicao_tipo,
        condicao_valor: regra.condicao_valor,
        ativo: regra.ativo,
        prioridade: regra.prioridade,
      });
    } else {
      resetForm();
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regraEditando) {
      await atualizarRegra.mutateAsync({ id: regraEditando.id, ...formData });
    } else {
      await criarRegra.mutateAsync(formData);
    }

    fecharModal();
  };

  const handleExcluir = async () => {
    if (regraExcluindo) {
      await excluirRegra.mutateAsync(regraExcluindo.id);
      setRegraExcluindo(null);
    }
  };

  const regrasFiltradas = regras.filter((regra) => {
    const matchBusca =
      !busca ||
      regra.nome_regra.toLowerCase().includes(busca.toLowerCase()) ||
      regra.estoque?.nome_produto?.toLowerCase().includes(busca.toLowerCase()) ||
      regra.estoque?.sku?.toLowerCase().includes(busca.toLowerCase());

    const matchAtivo =
      filtroAtivo === "todos" ||
      (filtroAtivo === "ativos" && regra.ativo) ||
      (filtroAtivo === "inativos" && !regra.ativo);

    return matchBusca && matchAtivo;
  });

  const formatarCondicao = (regra: RegraEtiqueta) => {
    if (!regra.campo_condicao || !regra.condicao_tipo || regra.condicao_valor === null) {
      return "-";
    }

    const campo = CAMPOS_CONDICAO.find((c) => c.value === regra.campo_condicao)?.label || regra.campo_condicao;
    const tipo = CONDICAO_TIPOS.find((t) => t.value === regra.condicao_tipo)?.label || regra.condicao_tipo;

    return `${campo} ${tipo.split(" ")[0]} ${regra.condicao_valor}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/administrativo/compras/estoque")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Regras de Etiquetas</h1>
          <p className="text-muted-foreground text-sm">
            Configure quantas etiquetas imprimir por quantidade de cada produto
          </p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Regra
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto ou nome da regra..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroAtivo} onValueChange={setFiltroAtivo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : regrasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhuma regra encontrada</p>
              <Button variant="outline" className="mt-4" onClick={() => abrirModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira regra
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Regra</TableHead>
                    <TableHead className="text-center">Divisor</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead className="text-center">Prioridade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regrasFiltradas.map((regra) => (
                    <TableRow key={regra.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {regra.estoque?.nome_produto || "Produto removido"}
                          </span>
                          {regra.estoque?.sku && (
                            <Badge variant="outline" className="ml-2 text-xs font-mono">
                              {regra.estoque.sku}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{regra.nome_regra}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">1 a cada {regra.divisor}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatarCondicao(regra)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{regra.prioridade}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={regra.ativo ? "default" : "secondary"}>
                          {regra.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirModal(regra)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRegraExcluindo(regra)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criar/Editar */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {regraEditando ? "Editar Regra" : "Nova Regra de Etiqueta"}
            </DialogTitle>
            <DialogDescription>
              Configure quantas etiquetas devem ser impressas para cada quantidade do produto.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Produto do Estoque *</Label>
              <Select
                value={formData.estoque_id || ""}
                onValueChange={(value) => setFormData({ ...formData, estoque_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.sku && `[${produto.sku}] `}
                      {produto.nome_produto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome da Regra *</Label>
              <Input
                value={formData.nome_regra}
                onChange={(e) => setFormData({ ...formData, nome_regra: e.target.value })}
                placeholder="Ex: Porta Grande, Padrão..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Divisor (itens por etiqueta) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.divisor}
                  onChange={(e) =>
                    setFormData({ ...formData, divisor: parseInt(e.target.value) || 1 })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ex: 5 = 1 etiqueta a cada 5 unidades
                </p>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.prioridade}
                  onChange={(e) =>
                    setFormData({ ...formData, prioridade: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">Maior = mais prioritário</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <Label className="text-sm font-medium">Condição por Dimensão (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Aplique esta regra apenas quando uma dimensão atender à condição.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Campo</Label>
                  <Select
                    value={formData.campo_condicao || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        campo_condicao: value === "none" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {CAMPOS_CONDICAO.map((campo) => (
                        <SelectItem key={campo.value} value={campo.value}>
                          {campo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Operador</Label>
                  <Select
                    value={formData.condicao_tipo || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        condicao_tipo: value === "none" ? null : value,
                      })
                    }
                    disabled={!formData.campo_condicao}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {CONDICAO_TIPOS.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.condicao_valor ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        condicao_valor: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="0.00"
                    disabled={!formData.campo_condicao}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Regra Ativa</Label>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.estoque_id || !formData.nome_regra}>
                {regraEditando ? "Salvar" : "Criar Regra"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!regraExcluindo} onOpenChange={() => setRegraExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a regra "{regraExcluindo?.nome_regra}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
