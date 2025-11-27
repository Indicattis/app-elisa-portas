import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotasFiscais, NotaFiscalFormData } from "@/hooks/useNotasFiscais";
import { FileText, Plus, Upload, Download, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function NotasFiscais() {
  const [filtros, setFiltros] = useState({
    tipo: undefined as 'entrada' | 'saida' | undefined,
    status: undefined as string | undefined,
    dataInicio: undefined as string | undefined,
    dataFim: undefined as string | undefined
  });

  const { notasFiscais, isLoading, createNotaFiscal, deleteNotaFiscal, uploadArquivo } = useNotasFiscais(filtros);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<NotaFiscalFormData>({
    tipo: 'saida',
    numero: '',
    serie: '',
    chave_acesso: '',
    valor_total: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    cnpj_cpf: '',
    razao_social: '',
    status: 'emitida',
    observacoes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNotaFiscal(formData);
    setDialogOpen(false);
    setFormData({
      tipo: 'saida',
      numero: '',
      serie: '',
      chave_acesso: '',
      valor_total: 0,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: '',
      cnpj_cpf: '',
      razao_social: '',
      status: 'emitida',
      observacoes: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      emitida: 'default',
      pendente: 'secondary',
      cancelada: 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'entrada' 
      ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Entrada</Badge>
      : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Saída</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Controle de notas fiscais de entrada e saída
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-3.5 h-3.5" />
              Nova Nota Fiscal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Nota Fiscal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: 'entrada' | 'saida') => 
                      setFormData(prev => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emitida">Emitida</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Número *</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Série *</Label>
                  <Input
                    value={formData.serie}
                    onChange={(e) => setFormData(prev => ({ ...prev, serie: e.target.value }))}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-medium">Chave de Acesso</Label>
                  <Input
                    value={formData.chave_acesso}
                    onChange={(e) => setFormData(prev => ({ ...prev, chave_acesso: e.target.value }))}
                    maxLength={44}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Valor Total (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_total: parseFloat(e.target.value) }))}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Data Emissão *</Label>
                  <Input
                    type="date"
                    value={formData.data_emissao}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_emissao: e.target.value }))}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Data Vencimento</Label>
                  <Input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">CNPJ/CPF *</Label>
                  <Input
                    value={formData.cnpj_cpf}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj_cpf: e.target.value }))}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-medium">Razão Social *</Label>
                  <Input
                    value={formData.razao_social}
                    onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
                    required
                    className="h-9"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-medium">Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Tipo</Label>
              <Select
                value={filtros.tipo || 'todos'}
                onValueChange={(value) => 
                  setFiltros(prev => ({ ...prev, tipo: value === 'todos' ? undefined : value as any }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Status</Label>
              <Select
                value={filtros.status || 'todos'}
                onValueChange={(value) => 
                  setFiltros(prev => ({ ...prev, status: value === 'todos' ? undefined : value }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Data Início</Label>
              <Input
                type="date"
                value={filtros.dataInicio || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value || undefined }))}
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Data Fim</Label>
              <Input
                type="date"
                value={filtros.dataFim || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value || undefined }))}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Lista de Notas Fiscais</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : notasFiscais && notasFiscais.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Número/Série</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notasFiscais.map((nf) => (
                  <TableRow key={nf.id}>
                    <TableCell>{getTipoBadge(nf.tipo)}</TableCell>
                    <TableCell className="font-medium">
                      {nf.numero}/{nf.serie}
                    </TableCell>
                    <TableCell>
                      {format(new Date(nf.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{nf.razao_social}</TableCell>
                    <TableCell>
                      R$ {nf.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(nf.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {nf.pdf_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(nf.pdf_url, '_blank')}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotaFiscal(nf.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma nota fiscal encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
