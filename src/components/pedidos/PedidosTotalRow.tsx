import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PedidosTotalRowProps {
  pedidos: any[];
  etapa?: string;
}

function getProdutosFromPedido(pedido: any): any[] {
  const vendas = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
  return vendas?.produtos_vendas || pedido.produtos_vendas || [];
}

function calcularTotaisPortas(pedidos: any[]) {
  let totalP = 0;
  let totalG = 0;

  pedidos.forEach(pedido => {
    // Usar valores pré-calculados das ordens de soldagem
    const ordemSoldagem = pedido.ordens?.soldagem;
    if (ordemSoldagem) {
      totalP += ordemSoldagem.qtd_portas_p || 0;
      totalG += ordemSoldagem.qtd_portas_g || 0;
    }
  });

  return { totalP, totalG };
}

function calcularTotalMetragemLinear(pedidos: any[]) {
  let total = 0;
  
  pedidos.forEach(pedido => {
    // Usar valor pré-calculado da ordem de perfiladeira
    const ordemPerfiladeira = pedido.ordens?.perfiladeira;
    if (ordemPerfiladeira) {
      total += ordemPerfiladeira.metragem_linear || 0;
    }
  });
  
  return total;
}

function calcularTotalMetragemQuadrada(pedidos: any[]) {
  let total = 0;
  
  pedidos.forEach(pedido => {
    // Usar valor pré-calculado das ordens de pintura
    const ordemPintura = pedido.ordens?.pintura;
    if (ordemPintura) {
      total += ordemPintura.metragem_quadrada || 0;
    }
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
    embalagem: 0,
  };

  pedidos.forEach(pedido => {
    const ordensSoldagem = pedido.ordens_soldagem || [];
    totais.soldagem += ordensSoldagem.length;

    const ordensPerfiladeira = pedido.ordens_perfiladeira || [];
    totais.perfiladeira += ordensPerfiladeira.length;

    const ordensSeparacao = pedido.ordens_separacao || [];
    totais.separacao += ordensSeparacao.length;

    const ordensQualidade = pedido.ordens_qualidade || [];
    totais.qualidade += ordensQualidade.length;

    const ordensPintura = pedido.ordens_pintura || [];
    totais.pintura += ordensPintura.length;

    const ordensEmbalagem = pedido.ordens_embalagem || [];
    totais.embalagem += ordensEmbalagem.length;
  });

  return totais;
}

function calcularCoresUnicas(pedidos: any[]): { nome: string; codigo_hex: string }[] {
  const coresMap = new Map<string, { nome: string; codigo_hex: string }>();
  
  pedidos.forEach(pedido => {
    const produtos = getProdutosFromPedido(pedido);
    produtos.forEach((produto: any) => {
      if (produto.tipo_produto === 'porta_enrolar' && produto.cor_nome) {
        const key = produto.cor_nome.toLowerCase();
        if (!coresMap.has(key)) {
          coresMap.set(key, {
            nome: produto.cor_nome,
            codigo_hex: produto.cor_codigo_hex || '#888888'
          });
        }
      }
    });
  });
  
  return Array.from(coresMap.values());
}

function isAcoGalvanizado(nome: string): boolean {
  const nomeNormalizado = nome.toLowerCase().trim();
  return nomeNormalizado.includes('galvanizado') || 
         nomeNormalizado.includes('aço') || 
         nomeNormalizado.includes('aco') ||
         nomeNormalizado.includes('natural');
}

export function PedidosTotalRow({ pedidos, etapa }: PedidosTotalRowProps) {
  if (pedidos.length === 0) return null;
  const ocultarMetragem = etapa === 'instalacoes' || etapa === 'aguardando_coleta';

  const { totalP, totalG } = calcularTotaisPortas(pedidos);
  const ordensStats = calcularTotaisOrdens(pedidos);
  const totalMetragemLinear = calcularTotalMetragemLinear(pedidos);
  const totalMetragemQuadrada = calcularTotalMetragemQuadrada(pedidos);
  const coresUnicas = calcularCoresUnicas(pedidos);

  return (
    <TooltipProvider>
      <div
        className="bg-muted/50 border-t-2 border-primary/20 rounded-md px-2 py-2 mt-2"
        style={{
          display: 'grid',
          gridTemplateColumns: '20px 20px 180px 100px 20px 40px 40px 80px 70px 150px 50px 80px 24px 24px 24px 24px 24px 24px 1fr 55px',
          gap: '6px',
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

        {/* Terceirização placeholder */}
        <div />

        {/* Metragem Linear Total */}
        {ocultarMetragem ? (
          <div />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <span className="text-[10px] font-bold text-blue-600">
                  {totalMetragemLinear > 0 ? `${totalMetragemLinear.toFixed(0)}m` : '—'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Total metragem linear (perfiladeira)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Metragem Quadrada Total */}
        {ocultarMetragem ? (
          <div />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <span className="text-[10px] font-bold text-green-600">
                  {totalMetragemQuadrada > 0 ? `${totalMetragemQuadrada.toFixed(1)}m²` : '—'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Total área das portas</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Data Carregamento placeholder */}
        <div />
        
        {/* Responsável placeholder */}
        <div />
        
        {/* Portas P/G */}
        <div className="flex items-center justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-[10px] px-1.5 py-0 h-5 font-bold cursor-help">
                {totalP}P
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Portas pequenas (≤25m²)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-[10px] px-1.5 py-0 h-5 font-bold cursor-help">
                {totalG}G
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Portas grandes (&gt;25m²)</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Tipo Entrega placeholder */}
        <div />
        
        {/* Cores - agora exibe quantidade */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center gap-1 cursor-help">
              {coresUnicas.length > 0 ? (
                <>
                  {coresUnicas.slice(0, 2).map((cor, idx) => (
                    <div 
                      key={idx}
                      className="h-4 flex-1 border border-border"
                      style={{ 
                        backgroundColor: isAcoGalvanizado(cor.nome) ? 'transparent' : cor.codigo_hex,
                        borderRadius: '10px',
                        maxWidth: '30px'
                      }}
                    />
                  ))}
                  {coresUnicas.length > 2 && (
                    <span className="text-[9px] font-bold text-muted-foreground">+{coresUnicas.length - 2}</span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground text-[10px]">—</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="text-xs font-bold">{coresUnicas.length} cores diferentes</p>
              {coresUnicas.map((cor, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div 
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: isAcoGalvanizado(cor.nome) ? 'transparent' : cor.codigo_hex }}
                  />
                  <span>{cor.nome}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
        
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
        
        {/* Embalagem */}
        <div className="flex items-center justify-center">
          <span className="text-[11px] font-bold text-cyan-500">
            {ordensStats.embalagem}
          </span>
        </div>
        
        {/* Tempo placeholder */}
        <div />
        
        {/* Ações placeholder */}
        <div />
      </div>
    </TooltipProvider>
  );
}