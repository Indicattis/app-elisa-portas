import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

import { MinimalistLayout } from '@/components/MinimalistLayout';

import { usePedidosEtapas } from '@/hooks/usePedidosEtapas';
import { useNeoInstalacoesFinalizadas } from '@/hooks/useNeoInstalacoes';
import { useNeoCorrecoesFinalizadas } from '@/hooks/useNeoCorrecoes';
import { PedidosDraggableList } from '@/components/pedidos/PedidosDraggableList';
import { PedidosFiltrosMinimalista } from '@/components/pedidos/PedidosFiltrosMinimalista';
import { NeoInstalacaoCardGestao } from '@/components/pedidos/NeoInstalacaoCardGestao';
import { NeoCorrecaoCardGestao } from '@/components/pedidos/NeoCorrecaoCardGestao';

export default function CobrancasMinimalista() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('todos');
  const [corPintura, setCorPintura] = useState('todas');
  const [mostrarProntos, setMostrarProntos] = useState(false);

  const { pedidos, isLoading, arquivarPedido, deletarPedido } = usePedidosEtapas('finalizado');
  const { neoInstalacoesFinalizadas, arquivarNeoInstalacao } = useNeoInstalacoesFinalizadas();
  const { neoCorrecoesFinalizadas, arquivarNeoCorrecao } = useNeoCorrecoesFinalizadas();

  const handleArquivar = async (pedidoId: string) => {
    await arquivarPedido.mutateAsync(pedidoId);
  };

  const handleDeletarPedido = async (pedidoId: string) => {
    await deletarPedido.mutateAsync(pedidoId);
  };

  const handleArquivarNeoInstalacao = async (id: string) => {
    await arquivarNeoInstalacao(id);
  };

  const handleArquivarNeoCorrecao = async (id: string) => {
    await arquivarNeoCorrecao(id);
  };

  // Filtros - mesma lógica da gestão de fábrica
  const pedidosFiltrados = pedidos.filter((pedido: any) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
      const clienteNome = vendaData?.cliente_nome?.toLowerCase() || '';
      const numero = String(pedido.numero_pedido || '');
      if (!clienteNome.includes(search) && !numero.includes(search)) return false;
    }
    if (tipoEntrega !== 'todos') {
      const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
      if (vendaData?.tipo_entrega !== tipoEntrega) return false;
    }
    if (corPintura !== 'todas') {
      const vendaData = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
      if (vendaData?.cor_pitura !== corPintura && vendaData?.cor_pintura !== corPintura) return false;
    }
    return true;
  });

  return (
    <MinimalistLayout
      title="Cobranças"
      subtitle="Pedidos finalizados"
      backPath="/administrativo/financeiro"
      fullWidth
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Administrativo', path: '/administrativo' },
        { label: 'Financeiro', path: '/administrativo/financeiro' },
        { label: 'Cobranças' },
      ]}
      headerActions={
        <div className="flex items-center gap-2">
          <PedidosFiltrosMinimalista
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            tipoEntrega={tipoEntrega}
            onTipoEntregaChange={setTipoEntrega}
            corPintura={corPintura}
            onCorPinturaChange={setCorPintura}
            mostrarProntos={mostrarProntos}
            onMostrarProntosToggle={() => setMostrarProntos(!mostrarProntos)}
          />
        
        </div>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : pedidosFiltrados.length === 0 && neoInstalacoesFinalizadas.length === 0 && neoCorrecoesFinalizadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum pedido finalizado</p>
          </div>
        ) : (
          <>
            <PedidosDraggableList
              pedidos={pedidosFiltrados}
              pedidosParaTotais={pedidosFiltrados}
              etapa="finalizado"
              isAberto={false}
              viewMode="list"
              onReorganizar={() => {}}
              onMoverPrioridade={() => {}}
              onArquivar={handleArquivar}
              onDeletar={handleDeletarPedido}
              enableDragAndDrop={false}
              hideOrdensStatus={true}
              showPosicao={false}
            />

            {(neoInstalacoesFinalizadas.length > 0 || neoCorrecoesFinalizadas.length > 0) && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                  <span>Serviços Avulsos Finalizados</span>
                  <span className="text-emerald-400">({neoInstalacoesFinalizadas.length + neoCorrecoesFinalizadas.length})</span>
                  <span className="text-xs text-white/40 ml-auto">últimos 30 dias</span>
                </h3>
                <div className="space-y-1">
                  {neoInstalacoesFinalizadas
                    .sort((a, b) => {
                      const dateA = a.concluida_em ? new Date(a.concluida_em).getTime() : 0;
                      const dateB = b.concluida_em ? new Date(b.concluida_em).getTime() : 0;
                      return dateB - dateA;
                    })
                    .map((neo) => (
                      <NeoInstalacaoCardGestao
                        key={neo.id}
                        neoInstalacao={neo}
                        viewMode="list"
                        showConcluido
                        onArquivar={handleArquivarNeoInstalacao}
                      />
                    ))}
                  {neoCorrecoesFinalizadas
                    .sort((a, b) => {
                      const dateA = a.concluida_em ? new Date(a.concluida_em).getTime() : 0;
                      const dateB = b.concluida_em ? new Date(b.concluida_em).getTime() : 0;
                      return dateB - dateA;
                    })
                    .map((neo) => (
                      <NeoCorrecaoCardGestao
                        key={neo.id}
                        neoCorrecao={neo}
                        viewMode="list"
                        showConcluido
                        onArquivar={handleArquivarNeoCorrecao}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MinimalistLayout>
  );
}
