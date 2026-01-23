import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Package, Plus, Ban, Loader2, Search, ExternalLink, X, RefreshCw } from "lucide-react";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { EmpresaEmissoraSelector } from "@/components/notas-fiscais/EmpresaEmissoraSelector";
import { StatusSefazBadge } from "@/components/notas-fiscais/StatusSefazBadge";

export default function NotasFiscaisMinimalista() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<{
    tipo?: 'entrada' | 'saida' | 'nfe' | 'nfse';
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }>({});

  const { 
    notasFiscais, 
    isLoading, 
    consultarNota, 
    cancelarNota, 
    cancelarNotaPorReferencia,
    isConsultando, 
    isCancelando,
    isCancelandoPorReferencia 
  } = useNotasFiscais(filtros);

  // States for cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [notaToCancel, setNotaToCancel] = useState<string | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");

  // State for cancel by reference dialog
  const [cancelRefDialogOpen, setCancelRefDialogOpen] = useState(false);
  const [empresaEmissoraId, setEmpresaEmissoraId] = useState("");
  const [referencia, setReferencia] = useState("");
  const [tipoNota, setTipoNota] = useState<"nfe" | "nfse">("nfe");
  const [motivoCancelamentoRef, setMotivoCancelamentoRef] = useState("");

  const buildFocusUrl = (url: string | null | undefined, ambiente?: string): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = ambiente === 'production' 
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getTipoBadge = (tipo: string) => {
    const styles: Record<string, string> = {
      'nfe': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'nfse': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'entrada': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'saida': 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return (
      <Badge className={`${styles[tipo] || 'bg-white/10 text-white/60'} border`}>
        {tipo.toUpperCase()}
      </Badge>
    );
  };

  const handleCancelClick = (notaId: string) => {
    setNotaToCancel(notaId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (notaToCancel && motivoCancelamento.length >= 15) {
      cancelarNota({ notaFiscalId: notaToCancel, motivo: motivoCancelamento });
      setCancelDialogOpen(false);
      setNotaToCancel(null);
      setMotivoCancelamento("");
    }
  };

  const handleCancelByReference = async () => {
    if (!empresaEmissoraId || !referencia || !motivoCancelamentoRef || motivoCancelamentoRef.length < 15) return;

    try {
      await cancelarNotaPorReferencia({
        empresaEmissoraId,
        referencia,
        tipoNota,
        motivo: motivoCancelamentoRef
      });
      setCancelRefDialogOpen(false);
      resetCancelRefForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetCancelRefForm = () => {
    setEmpresaEmissoraId("");
    setReferencia("");
    setTipoNota("nfe");
    setMotivoCancelamentoRef("");
  };

  const handleDialogClose = (open: boolean) => {
    setCancelRefDialogOpen(open);
    if (!open) {
      resetCancelRefForm();
    }
  };

  return (
    <MinimalistLayout
      title="Notas Fiscais"
      subtitle="Emissão e gerenciamento de NF-e e NFS-e via Focus NFe"
      backPath="/administrativo/fiscal"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "Fiscal", path: "/administrativo/fiscal" },
        { label: "Notas Fiscais" }
      ]}
      headerActions={
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCancelRefDialogOpen(true)}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Ban className="w-4 h-4 mr-2" />
            Cancelar por Ref
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white border-0">
                <Plus className="w-4 h-4 mr-2" />
                Criar Nota
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
              <DropdownMenuItem 
                onClick={() => navigate('/administrativo/fiscal/notas-fiscais/emitir-nfse')}
                className="text-white hover:bg-white/10"
              >
                <FileText className="w-4 h-4 mr-2" />
                NFS-e (Serviço)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/administrativo/fiscal/notas-fiscais/emitir-nfe')}
                className="text-white hover:bg-white/10"
              >
                <Package className="w-4 h-4 mr-2" />
                NF-e (Produto)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filtros */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Tipo</Label>
              <Select
                value={filtros.tipo || "all"}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value === "all" ? undefined : value as 'entrada' | 'saida' | 'nfe' | 'nfse' }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">Todos</SelectItem>
                  <SelectItem value="nfe" className="text-white hover:bg-white/10">NF-e</SelectItem>
                  <SelectItem value="nfse" className="text-white hover:bg-white/10">NFS-e</SelectItem>
                  <SelectItem value="entrada" className="text-white hover:bg-white/10">Entrada</SelectItem>
                  <SelectItem value="saida" className="text-white hover:bg-white/10">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Status</Label>
              <Select
                value={filtros.status || "all"}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value === "all" ? undefined : value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">Todos</SelectItem>
                  <SelectItem value="autorizada" className="text-white hover:bg-white/10">Autorizada</SelectItem>
                  <SelectItem value="pendente" className="text-white hover:bg-white/10">Pendente</SelectItem>
                  <SelectItem value="cancelada" className="text-white hover:bg-white/10">Cancelada</SelectItem>
                  <SelectItem value="erro" className="text-white hover:bg-white/10">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Data Início</Label>
              <Input
                type="date"
                value={filtros.dataInicio || ""}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value || undefined }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-xs">Data Fim</Label>
              <Input
                type="date"
                value={filtros.dataFim || ""}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value || undefined }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : !notasFiscais?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <FileText className="w-12 h-12 mb-4" />
              <p>Nenhuma nota fiscal encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Tipo</TableHead>
                  <TableHead className="text-white/60">Número/Série</TableHead>
                  <TableHead className="text-white/60">Data</TableHead>
                  <TableHead className="text-white/60">Cliente</TableHead>
                  <TableHead className="text-white/60">Valor</TableHead>
                  <TableHead className="text-white/60">Status SEFAZ</TableHead>
                  <TableHead className="text-white/60 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notasFiscais.map((nota) => (
                  <TableRow key={nota.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>{getTipoBadge(nota.tipo)}</TableCell>
                    <TableCell className="text-white">
                      {(nota as any).numero_nota ? `${(nota as any).numero_nota}/${nota.serie || 1}` : '-'}
                    </TableCell>
                    <TableCell className="text-white/80">
                      {format(new Date(nota.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-white">{(nota as any).cliente_nome || nota.razao_social || '-'}</TableCell>
                    <TableCell className="text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valor_total)}
                    </TableCell>
                    <TableCell>
                      <StatusSefazBadge status={nota.status_sefaz} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => consultarNota(nota.id)}
                          disabled={isConsultando}
                          className="text-white/60 hover:text-white hover:bg-white/10"
                          title="Consultar na SEFAZ"
                        >
                          <RefreshCw className={`w-4 h-4 ${isConsultando ? 'animate-spin' : ''}`} />
                        </Button>

                        {nota.danfe_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="text-white/60 hover:text-white hover:bg-white/10"
                            title="Ver DANFE"
                          >
                            <a 
                              href={buildFocusUrl(nota.danfe_url, nota.ambiente) || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}

                        {nota.xml_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="text-white/60 hover:text-white hover:bg-white/10"
                            title="Baixar XML"
                          >
                            <a 
                              href={buildFocusUrl(nota.xml_url, nota.ambiente) || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          </Button>
                        )}

                        {nota.status_sefaz === 'autorizada' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelClick(nota.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Cancelar nota"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Dialog: Cancelar Nota */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancelar Nota Fiscal</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Esta ação é irreversível. A nota será cancelada junto à SEFAZ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label className="text-white/80">Motivo do Cancelamento</Label>
            <Textarea
              placeholder="Informe o motivo do cancelamento (mínimo 15 caracteres)"
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[80px]"
            />
            <div className="flex justify-between text-xs">
              <span className={motivoCancelamento.length < 15 ? "text-red-400" : "text-white/40"}>
                Mínimo 15 caracteres
              </span>
              <span className={motivoCancelamento.length < 15 ? "text-red-400" : "text-white/40"}>
                {motivoCancelamento.length}/15
              </span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={motivoCancelamento.length < 15 || isCancelando}
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            >
              {isCancelando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Confirmar Cancelamento
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Cancelar por Referência */}
      <Dialog open={cancelRefDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md bg-zinc-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Cancelar Nota por Referência</DialogTitle>
            <DialogDescription className="text-white/60">
              Cancele uma nota fiscal diretamente na Focus NFe informando a referência.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Empresa Emissora</Label>
              <EmpresaEmissoraSelector
                value={empresaEmissoraId}
                onChange={setEmpresaEmissoraId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia" className="text-white/80">Referência da Nota</Label>
              <Input
                id="referencia"
                placeholder="Ex: 123456789"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/40">
                A referência (ref) usada ao emitir a nota na Focus NFe
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Tipo da Nota</Label>
              <RadioGroup
                value={tipoNota}
                onValueChange={(value) => setTipoNota(value as "nfe" | "nfse")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nfe" id="tipo-nfe" className="border-white/20 text-blue-400" />
                  <Label htmlFor="tipo-nfe" className="cursor-pointer text-white/80">NF-e (Produto)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nfse" id="tipo-nfse" className="border-white/20 text-blue-400" />
                  <Label htmlFor="tipo-nfse" className="cursor-pointer text-white/80">NFS-e (Serviço)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-white/80">Motivo do Cancelamento</Label>
              <Textarea
                id="motivo"
                placeholder="Informe o motivo do cancelamento (mínimo 15 caracteres)"
                value={motivoCancelamentoRef}
                onChange={(e) => setMotivoCancelamentoRef(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[80px]"
              />
              <div className="flex justify-between text-xs">
                <span className={motivoCancelamentoRef.length < 15 ? "text-red-400" : "text-white/40"}>
                  Mínimo 15 caracteres
                </span>
                <span className={motivoCancelamentoRef.length < 15 ? "text-red-400" : "text-white/40"}>
                  {motivoCancelamentoRef.length}/15
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handleDialogClose(false)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCancelByReference}
              disabled={!empresaEmissoraId || !referencia || motivoCancelamentoRef.length < 15 || isCancelandoPorReferencia}
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            >
              {isCancelandoPorReferencia ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Confirmar Cancelamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MinimalistLayout>
  );
}
