import { Badge } from "@/components/ui/badge";

interface PedidosTotalRowProps {
  pedidos: any[];
}

function getProdutosFromPedido(pedido: any): any[] {
  // Tentar diferentes caminhos para acessar produtos_vendas
  const vendas = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
  return vendas?.produtos_vendas || pedido.produtos_vendas || [];
}

function calcularTotaisPortas(pedidos: any[]) {
  let totalP = 0;
  let totalG = 0;

  pedidos.forEach(pedido => {
    const produtos = getProdutosFromPedido(pedido);
    produtos.forEach((produto: any) => {
      if (produto.tipo_produto === 'porta_enrolar') {
        const largura = produto.largura || 0;
        const altura = produto.altura || 0;
        const quantidade = produto.quantidade || 1;
        const area = (largura / 100) * (altura / 100);
        
        for (let i = 0; i < quantidade; i++) {
          if (area <= 9) {
            totalP++;
          } else {
            totalG++;
          }
        }
      }
    });
  });

  return { totalP, totalG };
}

function calcularTotalMetragemLinear(pedidos: any[]) {
  let total = 0;
  
  pedidos.forEach(pedido => {
    const linhas = pedido.linhas_perfiladeira || [];
    linhas.forEach((linha: any) => {
      const tamanho = linha.tamanho || '0';
      const metros = parseFloat(tamanho.replace(',', '.')) || 0;
      const quantidade = linha.quantidade || 1;
      total += metros * quantidade;
    });
  });
  
  return total;
}

function calcularTotalMetragemQuadrada(pedidos: any[]) {
  let total = 0;
  
  pedidos.forEach(pedido => {
    const produtos = getProdutosFromPedido(pedido);
    produtos.forEach((produto: any) => {
      if (produto.tipo_produto === 'porta_enrolar') {
        let largura = produto.largura || 0;
        let altura = produto.altura || 0;
        
        // Converter cm para m se necessário
        if (largura > 100) largura = largura / 100;
        if (altura > 100) altura = altura / 100;
        
        const quantidade = produto.quantidade || 1;
        total += largura * altura * quantidade;
      }
    });
  });
  
  return total;
}

function calcularTotaisOrdens(pedidos: any[]) {
  const totais = {
    soldagem: 0,
    perfiladeira: 0,
    separacao: 0,
    qualidade: 0,
    pintura: 0,
  };

  pedidos.forEach(pedido => {
    // Ordens de soldagem
    const ordensSoldagem = pedido.ordens_soldagem || [];
    totais.soldagem += ordensSoldagem.length;

    // Ordens de perfiladeira
    const ordensPerfiladeira = pedido.ordens_perfiladeira || [];
    totais.perfiladeira += ordensPerfiladeira.length;

    // Ordens de separação
    const ordensSeparacao = pedido.ordens_separacao || [];
    totais.separacao += ordensSeparacao.length;

    // Ordens de qualidade
    const ordensQualidade = pedido.ordens_qualidade || [];
    totais.qualidade += ordensQualidade.length;

    // Ordens de pintura
    const ordensPintura = pedido.ordens_pintura || [];
    totais.pintura += ordensPintura.length;
  });

  return totais;
}

export function PedidosTotalRow({ pedidos }: PedidosTotalRowProps) {
  if (pedidos.length === 0) return null;

  const { totalP, totalG } = calcularTotaisPortas(pedidos);
  const ordensStats = calcularTotaisOrdens(pedidos);
  const totalMetragemLinear = calcularTotalMetragemLinear(pedidos);
  const totalMetragemQuadrada = calcularTotalMetragemQuadrada(pedidos);

  return (
    <div
      className="bg-muted/50 border-t-2 border-primary/20 rounded-md px-2 py-2 mt-2"
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 24px 1fr 50px 50px 75px 120px 50px 80px 28px 28px 28px 28px 28px 70px 60px',
        gap: '4px',
        alignItems: 'center',
      }}
    >
      {/* Drag Handle placeholder */}
      <div />
      
      {/* Avatar placeholder */}
      <div />
      
      {/* Label TOTAL */}
      <div className="flex items-center">
        <span className="font-bold text-sm text-foreground">
          TOTAL ({pedidos.length} pedidos)
        </span>
      </div>

      {/* Metragem Linear Total */}
      <div className="text-center">
        <span className="text-[10px] font-bold text-blue-600">
          {totalMetragemLinear > 0 ? `${totalMetragemLinear.toFixed(0)}m` : '—'}
        </span>
      </div>

      {/* Metragem Quadrada Total */}
      <div className="text-center">
        <span className="text-[10px] font-bold text-green-600">
          {totalMetragemQuadrada > 0 ? `${totalMetragemQuadrada.toFixed(1)}m²` : '—'}
        </span>
      </div>
      
      {/* Data Carregamento placeholder */}
      <div />
      
      {/* Portas P/G */}
      <div className="flex items-center justify-center gap-1">
        {totalP > 0 && (
          <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-[10px] px-1.5 py-0 h-5 font-bold">
            {totalP}P
          </Badge>
        )}
        {totalG > 0 && (
          <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-[10px] px-1.5 py-0 h-5 font-bold">
            {totalG}G
          </Badge>
        )}
        {totalP === 0 && totalG === 0 && (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </div>
      
      {/* Tipo Entrega placeholder */}
      <div />
      
      {/* Cores placeholder */}
      <div />
      
      {/* Soldagem */}
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-bold text-orange-500">
          {ordensStats.soldagem}
        </span>
      </div>
      
      {/* Perfiladeira */}
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-bold text-blue-500">
          {ordensStats.perfiladeira}
        </span>
      </div>
      
      {/* Separação */}
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-bold text-purple-500">
          {ordensStats.separacao}
        </span>
      </div>
      
      {/* Qualidade */}
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-bold text-green-500">
          {ordensStats.qualidade}
        </span>
      </div>
      
      {/* Pintura */}
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-bold text-pink-500">
          {ordensStats.pintura}
        </span>
      </div>
      
      {/* Tempo placeholder */}
      <div />
      
      {/* Ações placeholder */}
      <div />
    </div>
  );
}
