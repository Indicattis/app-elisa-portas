import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSalesData, useSellersRanking, useDashboardRealtime } from '@/hooks/useDashboardData';

interface VendedorRanking {
  nome: string;
  total_vendas: number;
  posicao: number;
  foto_perfil_url?: string;
}

export default function Dashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Use React Query hooks for data fetching
  const { data: vendasData = [], isLoading: loadingVendas } = useSalesData();
  const { data: vendedores = [], isLoading: loadingVendedores } = useSellersRanking();
  
  // Setup realtime updates
  useDashboardRealtime();
  
  const loading = loadingVendas || loadingVendedores;
  const today = new Date();

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3); // Cycle through 3 slides
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);
  const totalVendasMes = useMemo(() => {
    return vendasData.reduce((sum, venda) => sum + venda.valor, 0);
  }, [vendasData]);
  const getVendedorCategory = (valor: number) => {
    if (valor >= 1500000) return {
      name: 'Orion',
      color: 'from-slate-300 to-slate-100',
      border: 'border-slate-300'
    };
    if (valor >= 1000000) return {
      name: 'Ômega',
      color: 'from-red-400 to-red-300',
      border: 'border-red-400'
    };
    if (valor >= 800000) return {
      name: 'Omni',
      color: 'from-purple-400 to-purple-300',
      border: 'border-purple-400'
    };
    if (valor >= 600000) return {
      name: 'Gama',
      color: 'from-emerald-400 to-emerald-300',
      border: 'border-emerald-400'
    };
    if (valor >= 500000) return {
      name: 'Alfa',
      color: 'from-yellow-400 to-yellow-300',
      border: 'border-yellow-400'
    };
    if (valor >= 400000) return {
      name: 'Beta',
      color: 'from-gray-400 to-gray-300',
      border: 'border-gray-400'
    };
    if (valor >= 300000) return {
      name: 'Zeta',
      color: 'from-amber-600 to-amber-500',
      border: 'border-amber-600'
    };
    return {
      name: 'Iniciante',
      color: 'from-slate-500 to-slate-400',
      border: 'border-slate-500'
    };
  };
  const getAllCategories = () => [{
    name: 'Iniciante',
    minValue: 0,
    maxValue: 300000,
    color: 'from-slate-500 to-slate-400',
    border: 'border-slate-500'
  }, {
    name: 'Zeta',
    minValue: 300000,
    maxValue: 400000,
    color: 'from-amber-600 to-amber-500',
    border: 'border-amber-600'
  }, {
    name: 'Beta',
    minValue: 400000,
    maxValue: 500000,
    color: 'from-gray-400 to-gray-300',
    border: 'border-gray-400'
  }, {
    name: 'Alfa',
    minValue: 500000,
    maxValue: 600000,
    color: 'from-yellow-400 to-yellow-300',
    border: 'border-yellow-400'
  }, {
    name: 'Gama',
    minValue: 600000,
    maxValue: 800000,
    color: 'from-emerald-400 to-emerald-300',
    border: 'border-emerald-400'
  }, {
    name: 'Omni',
    minValue: 800000,
    maxValue: 1000000,
    color: 'from-purple-400 to-purple-300',
    border: 'border-purple-400'
  }, {
    name: 'Ômega',
    minValue: 1000000,
    maxValue: 1500000,
    color: 'from-red-400 to-red-300',
    border: 'border-red-400'
  }, {
    name: 'Orion',
    minValue: 1500000,
    maxValue: Infinity,
    color: 'from-slate-300 to-slate-100',
    border: 'border-slate-300'
  }];
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Slide Container */}
      <div className="flex transition-transform duration-1000 ease-in-out" style={{
      transform: `translateX(-${currentSlide * 100}%)`
    }}>
        {/* Slide 1: Faturamento */}
        <div className="min-w-full flex-shrink-0">
          <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
            {/* Logo */}
            <div>
              <img src="/lovable-uploads/31df71a1-a366-49f8-81f7-acee745d5a32.png" alt="Grupo Elisa" className="h-20 w-auto" />
            </div>
            
            {/* Título Faturamento */}
            <h1 className="text-6xl font-bold text-foreground">Faturamento</h1>
            
            {/* Contador das vendas do mês */}
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl px-12 py-8 w-full max-w-4xl flex items-center justify-center" style={{
            height: '120px'
          }}>
              <div className="text-center">
                {loading ? <div className="text-7xl font-impact font-medium text-white">
                    Carregando...
                  </div> : <div className="text-7xl font-impact font-medium text-white">
                    {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(totalVendasMes)}
                  </div>}
              </div>
            </div>

            {/* Data e hora atual */}
            <div className="text-center text-muted-foreground space-y-3">
              <div className="text-xl font-semibold">
                {format(today, "MMMM 'de' yyyy", {
                locale: ptBR
              })}
              </div>
              
              {/* Linha horizontal */}
              <div className="w-32 h-0.5 bg-muted-foreground mx-auto"></div>
              
              <div className="text-lg">
                {format(today, "dd/MM/yyyy - HH:mm", {
                locale: ptBR
              })}
              </div>
            </div>

          </div>
        </div>

        {/* Slide 2: Ranking */}
        <div className="min-w-full flex-shrink-0">
          <div className="min-h-screen flex flex-col items-center justify-center p-6">
            {/* Container principal com ranking */}
            <div className="w-full max-w-4xl">
              {/* Lista de ranking */}
              <div className="space-y-4">
                {vendedores.slice(0, 10).map(vendedor => {
                const category = getVendedorCategory(vendedor.total_vendas);
                return <div key={`${vendedor.nome}-${vendedor.posicao}`} className="flex items-center justify-between p-6 rounded-lg bg-card border border-border shadow-lg">
                      <div className="flex items-center space-x-4">
                        {/* Foto do vendedor com borda colorida */}
                        <div className="relative">
                          {vendedor.foto_perfil_url ? <img src={vendedor.foto_perfil_url} alt={`Foto de ${vendedor.nome}`} className={`w-16 h-16 rounded-full object-cover border-4 ${category.border} shadow-md`} onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                      }} /> : null}
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-xl shadow-md border-4 ${category.border} ${vendedor.foto_perfil_url ? 'hidden' : ''}`}>
                            {vendedor.nome.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-foreground">
                            {vendedor.nome}
                          </h3>
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${category.color}`}>
                            Vendedor {category.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(vendedor.total_vendas)}
                        </div>
                      </div>
                    </div>;
              })}
                
                 {vendedores.length === 0 && <div className="text-center py-12">
                    <p className="text-xl text-muted-foreground">Nenhuma venda registrada este mês</p>
                  </div>}
              </div>
            </div>
          </div>
        </div>

        {/* Slide 3: Metas Individuais Chart */}
        <div className="min-w-full flex-shrink-0">
          <div className="min-h-screen flex flex-col items-center justify-center p-6">
            {/* Chart Layout */}
            <div className="w-full max-w-7xl mt-12">
              <div className="flex justify-center items-end gap-8 h-96">
                {getAllCategories().map((category, index) => {
                const vendedoresNaCategoria = vendedores.filter(v => {
                  if (category.name === 'Orion') return v.total_vendas >= category.minValue;
                  return v.total_vendas >= category.minValue && v.total_vendas < category.maxValue;
                });
                return <div key={category.name} className="flex flex-col items-center">
                      {/* Fotos dos vendedores */}
                      <div className="flex flex-col gap-2 mb-4 h-64 justify-end">
                        {vendedoresNaCategoria.map((vendedor, vendedorIndex) => <div key={vendedor.nome} className="flex flex-col items-center">
                            <div className="relative">
                              {vendedor.foto_perfil_url ? <img src={vendedor.foto_perfil_url} alt={`Foto de ${vendedor.nome}`} className={`w-12 h-12 rounded-full object-cover border-3 ${category.border} shadow-md`} onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                        }} /> : null}
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white font-bold text-sm shadow-md border-3 ${category.border} ${vendedor.foto_perfil_url ? 'hidden' : ''}`}>
                                {vendedor.nome.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <span className="text-xs text-foreground mt-1 text-center max-w-16 truncate">
                              {vendedor.nome}
                            </span>
                          </div>)}
                      </div>
                      
                      {/* Imagem da categoria */}
                      <div className="w-20 h-16 flex items-center justify-center">
                        {category.name === 'Orion' && <img src="/lovable-uploads/1.png" alt="Vendedor Orion" className="w-16 h-16" />}
                        {category.name === 'Ômega' && <img src="/lovable-uploads/2.png" alt="Vendedor Ômega" className="w-16 h-16" />}
                        {category.name === 'Omni' && <img src="/lovable-uploads/3.png" alt="Vendedor Omni" className="w-16 h-16" />}
                        {category.name === 'Gama' && <img src="/lovable-uploads/7.png" alt="Vendedor Gama" className="w-16 h-16" />}
                        {category.name === 'Alfa' && <img src="/lovable-uploads/6.png" alt="Vendedor Alfa" className="w-16 h-16" />}
                        {category.name === 'Beta' && <img src="/lovable-uploads/5.png" alt="Vendedor Beta" className="w-16 h-16" />}
                        {category.name === 'Zeta' && <img src="/lovable-uploads/4.png" alt="Vendedor Zeta" className="w-16 h-16" />}
                        {category.name === 'Iniciante' && <div className="w-16 h-16 bg-gradient-to-r from-slate-500 to-slate-400 rounded-full flex items-center justify-center">
                            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                          </div>}
                      </div>
                      
                      {/* Labels das faixas de valores */}
                      <div className="text-xs text-muted-foreground text-center mt-2 max-w-20">
                        {category.name === 'Orion' ? 'Acima R$ 1.5M' : category.name === 'Iniciante' ? 'Abaixo R$ 300k' : `R$ ${(category.minValue / 1000).toFixed(0)}k - R$ ${(category.maxValue / 1000).toFixed(0)}k`}
                      </div>
                    </div>;
              })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {[0, 1, 2].map(index => <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-primary scale-125' : 'bg-white/50 hover:bg-white/70'}`} />)}
      </div>
    </div>
  );
}