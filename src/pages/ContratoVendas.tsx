import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Settings } from "lucide-react";
import { useContratosVendas } from "@/hooks/useContratosVendas";
import { UploadContratoModal } from "@/components/contratos/UploadContratoModal";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContratosFilters } from "@/components/contratos/ContratosFilters";
import { useNavigate } from "react-router-dom";

export default function ContratoVendas() {
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    clienteNome: '',
    clienteCpf: '',
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined,
  });

  const {
    contratos,
    isLoading,
  } = useContratosVendas(filters);

  const handleDownloadContrato = (url: string, nomeArquivo: string) => {
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contratos de Vendas</h1>
          <p className="text-muted-foreground">Gerencie os contratos das vendas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/vendas/contratos/templates')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Templates
          </Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contratos?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contratos?.filter(c => {
                const date = new Date(c.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <ContratosFilters onFiltersChange={setFilters} />

      {/* Tabela de Contratos */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {!contratos || contratos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filters.clienteNome || filters.clienteCpf || filters.dataInicio || filters.dataFim
                ? "Nenhum contrato encontrado com os filtros aplicados"
                : "Nenhum contrato cadastrado"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell>
                      <div className="font-medium">{contrato.venda?.cliente_nome || '-'}</div>
                      <div className="text-sm text-muted-foreground">
                        {contrato.venda?.cpf_cliente || ''}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {contrato.nome_arquivo}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contrato.template?.nome || 'Manual'}
                    </TableCell>
                    <TableCell>
                      {formatDate(contrato.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadContrato(contrato.arquivo_url, contrato.nome_arquivo)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <UploadContratoModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />
    </div>
  );
}
