import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Tags, Info, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface RegraEtiqueta {
  id: string;
  estoque_id: string | null;
  nome_regra: string;
  divisor: number;
  campo_condicao: string | null;
  condicao_tipo: string | null;
  condicao_valor: number | null;
  ativo: boolean;
  prioridade: number;
}

interface RegrasEtiquetasEditorProps {
  estoqueId: string;
  nomeProduto: string;
}

const CONDICAO_TIPOS = [
  { value: "maior", label: "maior que" },
  { value: "menor", label: "menor que" },
  { value: "igual", label: "igual a" },
  { value: "maior_igual", label: "maior ou igual a" },
  { value: "menor_igual", label: "menor ou igual a" },
];

const CAMPOS_CONDICAO = [
  { value: "tamanho", label: "Largura (m)" },
  { value: "altura", label: "Altura (m)" },
];

export function RegrasEtiquetasEditor({ estoqueId, nomeProduto }: RegrasEtiquetasEditorProps) {
  const queryClient = useQueryClient();
  const [novaRegra, setNovaRegra] = useState({
    nome_regra: "",
    divisor: 10,
    campo_condicao: "",
    condicao_tipo: "",
    condicao_valor: 0,
    prioridade: 1,
  });
  const [mostrarFormNova, setMostrarFormNova] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoDados, setEditandoDados] = useState<Partial<RegraEtiqueta>>({});

  // Buscar regras do produto
  const { data: regras = [], isLoading } = useQuery({
    queryKey: ["regras-etiquetas", estoqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regras_etiquetas")
        .select("*")
        .eq("estoque_id", estoqueId)
        .order("prioridade", { ascending: false });

      if (error) throw error;
      return data as RegraEtiqueta[];
    },
    enabled: !!estoqueId,
  });

  // Criar regra
  const criarRegra = useMutation({
    mutationFn: async (input: typeof novaRegra) => {
      const { data, error } = await supabase
        .from("regras_etiquetas")
        .insert({
          estoque_id: estoqueId,
          nome_regra: input.nome_regra || `Regra para ${nomeProduto}`,
          divisor: input.divisor,
          campo_condicao: input.campo_condicao || null,
          condicao_tipo: input.condicao_tipo || null,
          condicao_valor: input.condicao_valor || null,
          prioridade: input.prioridade,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regras-etiquetas", estoqueId] });
      toast.success("Regra criada com sucesso");
      setMostrarFormNova(false);
      setNovaRegra({
        nome_regra: "",
        divisor: 10,
        campo_condicao: "",
        condicao_tipo: "",
        condicao_valor: 0,
        prioridade: 1,
      });
    },
    onError: (error: any) => {
      toast.error("Erro ao criar regra: " + error.message);
    },
  });

  // Atualizar regra
  const atualizarRegra = useMutation({
    mutationFn: async ({ id, ...input }: Partial<RegraEtiqueta> & { id: string }) => {
      const { data, error } = await supabase
        .from("regras_etiquetas")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regras-etiquetas", estoqueId] });
      toast.success("Regra atualizada");
      setEditandoId(null);
      setEditandoDados({});
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar regra: " + error.message);
    },
  });

  // Excluir regra
  const excluirRegra = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("regras_etiquetas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regras-etiquetas", estoqueId] });
      toast.success("Regra excluída");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir regra: " + error.message);
    },
  });

  const handleToggleAtivo = (regra: RegraEtiqueta) => {
    atualizarRegra.mutate({ id: regra.id, ativo: !regra.ativo });
  };

  const iniciarEdicao = (regra: RegraEtiqueta) => {
    setEditandoId(regra.id);
    setEditandoDados({
      nome_regra: regra.nome_regra,
      divisor: regra.divisor,
      campo_condicao: regra.campo_condicao || "",
      condicao_tipo: regra.condicao_tipo || "",
      condicao_valor: regra.condicao_valor || 0,
      prioridade: regra.prioridade,
    });
  };

  const salvarEdicao = () => {
    if (!editandoId) return;
    atualizarRegra.mutate({
      id: editandoId,
      nome_regra: editandoDados.nome_regra,
      divisor: editandoDados.divisor,
      campo_condicao: editandoDados.campo_condicao || null,
      condicao_tipo: editandoDados.condicao_tipo || null,
      condicao_valor: editandoDados.condicao_valor || null,
      prioridade: editandoDados.prioridade,
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditandoDados({});
  };

  const formatarCondicao = (regra: RegraEtiqueta) => {
    if (!regra.campo_condicao || !regra.condicao_tipo || regra.condicao_valor === null) {
      return "Sem condição (regra padrão)";
    }
    const campo = CAMPOS_CONDICAO.find(c => c.value === regra.campo_condicao)?.label || regra.campo_condicao;
    const tipo = CONDICAO_TIPOS.find(t => t.value === regra.condicao_tipo)?.label || regra.condicao_tipo;
    return `${campo} ${tipo} ${regra.condicao_valor}m`;
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Tags className="h-5 w-5" />
          Regras de Quebra de Etiquetas
        </CardTitle>
        <CardDescription>
          Configure como as etiquetas se distribuem pela quantidade produzida deste item.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de regras existentes */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : regras.length === 0 ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Nenhuma regra configurada. Cada unidade receberá 1 etiqueta.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {regras.map((regra) => (
              <div
                key={regra.id}
                className={`p-4 rounded-lg border ${regra.ativo ? "bg-background" : "bg-muted/30 opacity-60"}`}
              >
                {editandoId === regra.id ? (
                  // Modo edição
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome da Regra</Label>
                        <Input
                          value={editandoDados.nome_regra || ""}
                          onChange={(e) => setEditandoDados({ ...editandoDados, nome_regra: e.target.value })}
                          placeholder="Ex: Regra padrão"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Divisor (unidades por etiqueta)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={editandoDados.divisor || 1}
                          onChange={(e) => setEditandoDados({ ...editandoDados, divisor: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Campo Condição</Label>
                        <Select
                          value={editandoDados.campo_condicao || "none"}
                          onValueChange={(value) => setEditandoDados({ ...editandoDados, campo_condicao: value === "none" ? "" : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem condição</SelectItem>
                            {CAMPOS_CONDICAO.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {editandoDados.campo_condicao && (
                        <>
                          <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                              value={editandoDados.condicao_tipo || ""}
                              onValueChange={(value) => setEditandoDados({ ...editandoDados, condicao_tipo: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {CONDICAO_TIPOS.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Valor (m)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={editandoDados.condicao_valor || 0}
                              onChange={(e) => setEditandoDados({ ...editandoDados, condicao_valor: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </>
                      )}
                      <div className="space-y-2">
                        <Label>Prioridade</Label>
                        <Input
                          type="number"
                          min={1}
                          value={editandoDados.prioridade || 1}
                          onChange={(e) => setEditandoDados({ ...editandoDados, prioridade: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={cancelarEdicao}>
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={salvarEdicao}>
                        <Check className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Modo visualização
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{regra.nome_regra}</span>
                        <Badge variant="outline" className="text-xs">
                          Prioridade: {regra.prioridade}
                        </Badge>
                        {!regra.ativo && (
                          <Badge variant="secondary" className="text-xs">Inativa</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        1 etiqueta a cada <strong>{regra.divisor}</strong> unidades
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Condição: {formatarCondicao(regra)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={regra.ativo}
                        onCheckedChange={() => handleToggleAtivo(regra)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => iniciarEdicao(regra)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir regra</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a regra "{regra.nome_regra}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => excluirRegra.mutate(regra.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulário para nova regra */}
        {mostrarFormNova ? (
          <div className="p-4 rounded-lg border border-dashed bg-muted/30 space-y-4">
            <h4 className="font-medium">Nova Regra</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Regra</Label>
                <Input
                  value={novaRegra.nome_regra}
                  onChange={(e) => setNovaRegra({ ...novaRegra, nome_regra: e.target.value })}
                  placeholder="Ex: Regra padrão"
                />
              </div>
              <div className="space-y-2">
                <Label>Divisor (unidades por etiqueta) *</Label>
                <Input
                  type="number"
                  min={1}
                  value={novaRegra.divisor}
                  onChange={(e) => setNovaRegra({ ...novaRegra, divisor: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Campo Condição</Label>
                <Select
                  value={novaRegra.campo_condicao || "none"}
                  onValueChange={(value) => setNovaRegra({ ...novaRegra, campo_condicao: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem condição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem condição (regra padrão)</SelectItem>
                    {CAMPOS_CONDICAO.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {novaRegra.campo_condicao && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={novaRegra.condicao_tipo || ""}
                      onValueChange={(value) => setNovaRegra({ ...novaRegra, condicao_tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDICAO_TIPOS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (m) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={novaRegra.condicao_valor}
                      onChange={(e) => setNovaRegra({ ...novaRegra, condicao_valor: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Input
                  type="number"
                  min={1}
                  value={novaRegra.prioridade}
                  onChange={(e) => setNovaRegra({ ...novaRegra, prioridade: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMostrarFormNova(false)}>
                Cancelar
              </Button>
              <Button onClick={() => criarRegra.mutate(novaRegra)}>
                Criar Regra
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setMostrarFormNova(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Regra
          </Button>
        )}

        {/* Informações de ajuda */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 text-sm">
          <Info className="h-4 w-4 mt-0.5 text-blue-500" />
          <div className="space-y-1 text-muted-foreground">
            <p>
              <strong>Como funciona:</strong> Regras com maior prioridade são verificadas primeiro.
            </p>
            <p>
              Se a condição for atendida (ex: largura &gt; 6.5m), aquela regra será usada.
              Caso contrário, a próxima regra é verificada.
            </p>
            <p>
              Se nenhuma regra existir ou for aplicável, cada unidade recebe 1 etiqueta.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
