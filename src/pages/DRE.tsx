import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, TrendingUp, TrendingDown, Eye, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDRE } from "@/hooks/useDRE";
import { Separator } from "@/components/ui/separator";

export default function DRE() {
  const { dres, loading, gerarDRE, deleteDRE, validarMesParaDRE } = useDRE();
  
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDRE, setSelectedDRE] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [mesSelecionado, setMesSelecionado] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [validacao, setValidacao] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  const handleValidarMes = async () => {
    if (!mesSelecionado) return;
    
    setValidating(true);
    const result = await validarMesParaDRE(mesSelecionado + "-01");
    setValidacao(result);
    setValidating(false);
  };

  const handleGerarDRE = async () => {
    if (!mesSelecionado) return;
    
    const success = await gerarDRE(mesSelecionado + "-01", observacoes);
    if (success) {
      setIsGenerateDialogOpen(false);
      setMesSelecionado("");
      setObservacoes("");
      setValidacao(null);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDRE(deleteId);
      setDeleteId(null);
    }
  };

  const handleViewDetails = (dre: any) => {
    setSelectedDRE(dre);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">D.R.E - Demonstrativo de Resultado do Exercício</h1>
          <p className="text-muted-foreground">Análise financeira mensal da empresa</p>
        </div>
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Gerar DRE
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerar Novo D.R.E</DialogTitle>
              <DialogDescription>
                Selecione o mês de referência e valide os dados antes de gerar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mes">Mês de Referência</Label>
                <div className="flex gap-2">
                  <Input
                    id="mes"
                    type="month"
                    value={mesSelecionado}
                    onChange={(e) => {
                      setMesSelecionado(e.target.value);
                      setValidacao(null);
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleValidarMes}
                    disabled={!mesSelecionado || validating}
                  >
                    Validar
                  </Button>
                </div>
              </div>

              {validacao && (
                <Alert variant={validacao.podeGerar ? "default" : "destructive"}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">
                        {validacao.podeGerar ? '✓ Mês válido para gerar DRE' : '✗ Não é possível gerar DRE'}
                      </div>
                      <div className="text-sm space-y-1">
                        <div>Total de vendas: {validacao.totalVendas}</div>
                        <div>Vendas faturadas: {validacao.vendasFaturadas}</div>
                        <div>Despesas fixas preenchidas: {validacao.despesasFixasPreenchidas ? 'Sim' : 'Não'}</div>
                        <div>Despesas variáveis preenchidas: {validacao.despesasVariaveisPreenchidas ? 'Sim' : 'Não'}</div>
                      </div>
                      {validacao.motivos.length > 0 && (
                        <div className="mt-2 text-sm">
                          <div className="font-semibold">Motivos:</div>
                          <ul className="list-disc list-inside">
                            {validacao.motivos.map((motivo: string, idx: number) => (
                              <li key={idx}>{motivo}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre este DRE..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGerarDRE}
                disabled={!validacao || !validacao.podeGerar}
              >
                Gerar DRE
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dres.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum D.R.E cadastrado ainda.<br />
              Clique em "Gerar DRE" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dres.map((dre) => (
            <Card key={dre.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {format(new Date(dre.mes), "MMMM 'de' yyyy", { locale: ptBR })}
                    </CardTitle>
                    <CardDescription>
                      {dre.vendas_faturadas} vendas faturadas
                    </CardDescription>
                  </div>
                  <Badge variant={dre.resultado_final >= 0 ? "default" : "destructive"}>
                    {dre.resultado_final >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {dre.resultado_final >= 0 ? 'Lucro' : 'Prejuízo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Faturamento:</span>
                      <span className="font-semibold">
                        R$ {dre.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custos Produção:</span>
                      <span className="font-semibold text-destructive">
                        - R$ {dre.custos_producao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desp. Fixas:</span>
                      <span className="font-semibold text-destructive">
                        - R$ {dre.despesas_fixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desp. Variáveis:</span>
                      <span className="font-semibold text-destructive">
                        - R$ {dre.despesas_variaveis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Resultado Final:</span>
                    <span className={`font-bold text-lg ${dre.resultado_final >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      R$ {dre.resultado_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(dre)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(dre.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes do D.R.E - {selectedDRE && format(new Date(selectedDRE.mes), "MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          {selectedDRE && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total de Vendas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedDRE.total_vendas}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Vendas Faturadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedDRE.vendas_faturadas}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Demonstrativo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Faturamento Total</span>
                    <span className="font-bold text-lg">
                      R$ {selectedDRE.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-destructive">
                    <span>(-) Custos de Produção</span>
                    <span>R$ {selectedDRE.custos_producao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>(-) Despesas Fixas</span>
                    <span>R$ {selectedDRE.despesas_fixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>(-) Despesas Variáveis</span>
                    <span>R$ {selectedDRE.despesas_variaveis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-lg">Resultado Final</span>
                    <span className={`font-bold text-2xl ${selectedDRE.resultado_final >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      R$ {selectedDRE.resultado_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {selectedDRE.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedDRE.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este D.R.E? Esta ação não pode ser desfeita.
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
