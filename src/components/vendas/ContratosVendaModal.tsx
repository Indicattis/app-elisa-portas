import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, FilePlus, Upload, FileCheck, Clock, HardDrive, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GerarContratoModal } from "@/components/contratos/GerarContratoModal";
import { UploadContratoModal } from "@/components/contratos/UploadContratoModal";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ContratosVendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendaId: string;
}

export function ContratosVendaModal({ open, onOpenChange, vendaId }: ContratosVendaModalProps) {
  const [gerarModalOpen, setGerarModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['contratos-venda', vendaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_vendas')
        .select(`
          *,
          template:contratos_templates(nome)
        `)
        .eq('venda_id', vendaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!vendaId
  });

  const handleDownload = async (contrato: any) => {
    try {
      const link = document.createElement('a');
      link.href = contrato.arquivo_url;
      link.download = contrato.nome_arquivo;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar contrato:', error);
    }
  };

  const handleView = (contrato: any) => {
    window.open(contrato.arquivo_url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span>Contratos da Venda</span>
                  {contratos && contratos.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({contratos.length} {contratos.length === 1 ? 'contrato' : 'contratos'})
                    </span>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Botões de ação */}
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setGerarModalOpen(true)}
                variant="outline"
                className="flex-1 h-11 bg-background/80 hover:bg-background border-dashed"
              >
                <FilePlus className="w-4 h-4 mr-2" />
                Gerar Contrato
              </Button>
              <Button
                onClick={() => setUploadModalOpen(true)}
                variant="outline"
                className="flex-1 h-11 bg-background/80 hover:bg-background border-dashed"
              >
                <Upload className="w-4 h-4 mr-2" />
                Vincular Contrato
              </Button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-muted"></div>
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <span className="text-sm text-muted-foreground">Carregando contratos...</span>
              </div>
            ) : contratos && contratos.length > 0 ? (
              <div className="space-y-3">
                {contratos.map((contrato, index) => (
                  <div
                    key={contrato.id}
                    className={cn(
                      "group relative bg-card border rounded-xl p-4 transition-all duration-200",
                      "hover:shadow-md hover:border-primary/30 hover:bg-accent/30"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Ícone do arquivo */}
                      <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                        <FileCheck className="w-6 h-6 text-primary" />
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate pr-2" title={contrato.nome_arquivo}>
                          {contrato.nome_arquivo}
                        </h3>

                        {contrato.template && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Template: <span className="text-foreground/80">{contrato.template.nome}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDate(contrato.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5" />
                            <span>{formatFileSize(contrato.tamanho_arquivo)}</span>
                          </div>
                        </div>

                        {contrato.observacoes && (
                          <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2 line-clamp-2">
                            {contrato.observacoes}
                          </p>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex-shrink-0 flex flex-col gap-2">
                        <Button
                          onClick={() => handleView(contrato)}
                          size="sm"
                          variant="ghost"
                          className="h-9 px-3"
                        >
                          <ExternalLink className="w-4 h-4 mr-1.5" />
                          Abrir
                        </Button>
                        <Button
                          onClick={() => handleDownload(contrato)}
                          size="sm"
                          variant="default"
                          className="h-9 px-3"
                        >
                          <Download className="w-4 h-4 mr-1.5" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <FileText className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Nenhum contrato vinculado</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Esta venda ainda não possui contratos. Gere um novo contrato ou faça upload de um arquivo existente.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <GerarContratoModal
        open={gerarModalOpen}
        onOpenChange={setGerarModalOpen}
        vendaIdInicial={vendaId}
      />

      <UploadContratoModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        vendaIdInicial={vendaId}
      />
    </>
  );
}
