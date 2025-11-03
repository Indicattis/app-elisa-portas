import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Entrega, CreateEntregaData } from '@/hooks/useEntregas';
import { Eye, MapPin, CheckCircle2, ShoppingCart, Package } from 'lucide-react';
import { DetalhesEntregaDialog } from './DetalhesEntregaDialog';
import { ResponsavelEntregaModal } from './ResponsavelEntregaModal';
import { DataProducaoEntregaModal } from './DataProducaoEntregaModal';
import { useNavigate } from 'react-router-dom';

interface EntregasTabelaViewProps {
  entregas: Entrega[];
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, data: Partial<CreateEntregaData>) => Promise<boolean>;
  onGeocode: (id: string, cidade: string, estado: string) => Promise<void>;
  onConcluir: (id: string) => Promise<boolean>;
  isAdmin: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pendente_producao: 'bg-yellow-500',
  em_producao: 'bg-blue-500',
  em_qualidade: 'bg-purple-500',
  aguardando_pintura: 'bg-orange-500',
  pronta_fabrica: 'bg-cyan-500',
  finalizada: 'bg-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  pendente_producao: 'Pendente Produção',
  em_producao: 'Em Produção',
  em_qualidade: 'Em Qualidade',
  aguardando_pintura: 'Aguardando Pintura',
  pronta_fabrica: 'Pronta Fábrica',
  finalizada: 'Finalizada',
};

export const EntregasTabelaView = ({
  entregas,
  onGeocode,
  onConcluir,
  isAdmin,
}: EntregasTabelaViewProps) => {
  const navigate = useNavigate();
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [showResponsavelModal, setShowResponsavelModal] = useState(false);
  const [showDataProducaoModal, setShowDataProducaoModal] = useState(false);

  const handleViewDetalhes = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
    setShowDetalhesModal(true);
  };

  const handleGeocode = async (entrega: Entrega) => {
    await onGeocode(entrega.id, entrega.cidade, entrega.estado);
  };

  const handleConcluir = async (entrega: Entrega) => {
    if (confirm('Confirma a conclusão desta entrega? O pedido será finalizado.')) {
      await onConcluir(entrega.id);
    }
  };

  const isGeocoded = (entrega: Entrega) => entrega.latitude && entrega.longitude;
  const canConcluir = (entrega: Entrega) => 
    entrega.pedido?.etapa_atual === 'aguardando_coleta' && !entrega.entrega_concluida;

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade/Estado</TableHead>
              <TableHead>Data Entrega</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Geo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entregas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma entrega cadastrada
                </TableCell>
              </TableRow>
            ) : (
              entregas.map((entrega) => (
                <TableRow key={entrega.id}>
                  <TableCell className="font-medium">{entrega.nome_cliente}</TableCell>
                  <TableCell>{entrega.telefone_cliente || '-'}</TableCell>
                  <TableCell>{`${entrega.cidade}/${entrega.estado}`}</TableCell>
                  <TableCell>
                    {entrega.data_entrega ? format(new Date(entrega.data_entrega), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[entrega.status]}>
                      {STATUS_LABELS[entrega.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isGeocoded(entrega) ? (
                      <Badge variant="outline" className="bg-green-50">
                        <CheckCircle2 className="h-3 w-3" />
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleGeocode(entrega)}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetalhes(entrega)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {entrega.venda_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/dashboard/vendas/${entrega.venda_id}`)}
                          title="Ver venda"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {entrega.pedido_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/dashboard/pedidos/${entrega.pedido_id}`)}
                          title="Ver pedido"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canConcluir(entrega) && isAdmin && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleConcluir(entrega)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Concluir
                        </Button>
                      )}
                      {entrega.entrega_concluida && (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Concluída
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DetalhesEntregaDialog
        entrega={selectedEntrega}
        open={showDetalhesModal}
        onOpenChange={setShowDetalhesModal}
      />

      {selectedEntrega && (
        <>
          <ResponsavelEntregaModal
            entregaId={selectedEntrega.id}
            currentResponsavelId={selectedEntrega.responsavel_entrega_id}
            currentResponsavelNome={selectedEntrega.responsavel_entrega_nome}
            open={showResponsavelModal}
            onOpenChange={setShowResponsavelModal}
            onSuccess={() => window.location.reload()}
          />
          <DataProducaoEntregaModal
            entregaId={selectedEntrega.id}
            currentDataProducao={selectedEntrega.data_producao}
            open={showDataProducaoModal}
            onOpenChange={setShowDataProducaoModal}
            onSuccess={() => window.location.reload()}
          />
        </>
      )}
    </>
  );
};
