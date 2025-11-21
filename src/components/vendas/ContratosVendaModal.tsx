import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, User, AlertCircle, FilePlus, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GerarContratoModal } from "@/components/contratos/GerarContratoModal";
import { UploadContratoModal } from "@/components/contratos/UploadContratoModal";
import { useState } from "react";

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
      // Criar um link temporário para fazer o download
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente_assinatura': { label: 'Pendente Assinatura', variant: 'secondary' as const },
      'assinado': { label: 'Assinado', variant: 'default' as const },
      'cancelado': { label: 'Cancelado', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pendente_assinatura'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Contratos da Venda
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setGerarModalOpen(true)}
              variant="outline"
              className="flex-1"
            >
              <FilePlus className="w-4 h-4 mr-2" />
              Gerar Contrato
            </Button>
            <Button
              onClick={() => setUploadModalOpen(true)}
              variant="outline"
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Contrato
            </Button>
          </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : contratos && contratos.length > 0 ? (
          <div className="space-y-4">
            {contratos.map((contrato) => (
              <Card key={contrato.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">{contrato.nome_arquivo}</h3>
                        {getStatusBadge(contrato.status)}
                      </div>

                      {contrato.template && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <span>Template: {contrato.template.nome}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(contrato.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{formatFileSize(contrato.tamanho_arquivo)}</span>
                        </div>
                      </div>

                      {contrato.observacoes && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground">{contrato.observacoes}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleDownload(contrato)}
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum contrato encontrado para esta venda.
            </AlertDescription>
          </Alert>
        )}
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
