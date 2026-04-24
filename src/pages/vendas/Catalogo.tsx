import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Star, Package, Plus, Palette } from 'lucide-react';
import { useVendasCatalogo } from '@/hooks/useVendasCatalogo';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Catalogo() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');

  const { produtos, isLoading } = useVendasCatalogo({
    busca,
    categoria: categoriaFiltro || undefined
  });

  // Extrair categorias únicas
  const categorias = [...new Set(produtos?.map(p => p.categoria).filter(Boolean))] as string[];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <MinimalistLayout 
      title="Catálogo" 
      subtitle={`${produtos?.length || 0} produto${(produtos?.length || 0) !== 1 ? 's' : ''}`}
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Catálogo" }
      ]}
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/marketing/catalogo/cores')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Palette className="w-4 h-4 mr-2" />
            Cores
          </Button>
          <Button
            onClick={() => navigate('/marketing/catalogo/new')}
            className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      }
    >
      {/* Filtros */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input 
            placeholder="Buscar produtos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-primary/5 border-primary/10 text-white placeholder:text-white/40"
          />
        </div>

        {/* Filtro por categoria */}
        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoriaFiltro('')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                categoriaFiltro === '' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-primary/5 text-white/70 hover:bg-primary/10'
              }`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  categoriaFiltro === cat 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-primary/5 text-white/70 hover:bg-primary/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid de produtos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square bg-white/5" />
          ))
        ) : produtos && produtos.length > 0 ? (
          produtos.map((produto) => (
            <div
              key={produto.id}
              onClick={() => navigate(`/marketing/catalogo/editar/${produto.id}`)}
              className="bg-primary/5 border border-primary/10 rounded-xl overflow-hidden backdrop-blur-xl
                         hover:bg-primary/10 hover:border-blue-500/30 transition-all group cursor-pointer"
            >
              {/* Imagem */}
              <div className="aspect-square bg-white/5 relative overflow-hidden">
                {produto.imagem_url ? (
                  <img 
                    src={produto.imagem_url} 
                    alt={produto.nome_produto}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-white/20" />
                  </div>
                )}
                
                {/* Badge de destaque */}
                {produto.destaque && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-500/90 text-black">
                      <Star className="w-3 h-3 mr-1" />
                      Destaque
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-white truncate">{produto.nome_produto}</h3>
                {produto.categoria && (
                  <p className="text-xs text-white/50 mt-0.5">{produto.categoria}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-lg font-bold text-blue-400">
                    {formatCurrency(produto.preco_venda)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    produto.quantidade > 0 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {produto.quantidade > 0 ? `${produto.quantidade} un.` : 'Sem estoque'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">
              {busca ? 'Nenhum produto encontrado' : 'Catálogo vazio'}
            </p>
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}
