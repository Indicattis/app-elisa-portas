import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Handshake, Building2, Users, Store, MapPin, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { TIPO_PARCEIRO_LABELS, getEtapasByTipo, getCurrentEtapa } from '@/utils/parceiros';

type TipoParceiro = 'autorizado' | 'representante' | 'franqueado';

export default function MeusParceiros() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tipoFiltro, setTipoFiltro] = useState<TipoParceiro | ''>('');

  const { data: parceiros, isLoading } = useQuery({
    queryKey: ['meus-parceiros', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Primeiro buscar o admin_user para obter o id
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (adminError || !adminUser) return [];
      
      const { data, error } = await supabase
        .from('autorizados')
        .select(`
          id,
          nome,
          tipo_parceiro,
          cidade,
          estado,
          telefone,
          email,
          etapa,
          representante_etapa,
          franqueado_etapa
        `)
        .eq('vendedor_id', adminUser.id)
        .eq('ativo', true)
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const parceirosFiltrados = parceiros?.filter(p => 
    !tipoFiltro || p.tipo_parceiro === tipoFiltro
  ) || [];

  const getTipoIcon = (tipo: TipoParceiro) => {
    switch (tipo) {
      case 'autorizado': return Store;
      case 'representante': return Users;
      case 'franqueado': return Building2;
      default: return Handshake;
    }
  };

  const getTipoColor = (tipo: TipoParceiro) => {
    switch (tipo) {
      case 'autorizado': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'representante': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'franqueado': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Contadores por tipo
  const autorizados = parceiros?.filter(p => p.tipo_parceiro === 'autorizado').length || 0;
  const representantes = parceiros?.filter(p => p.tipo_parceiro === 'representante').length || 0;
  const franqueados = parceiros?.filter(p => p.tipo_parceiro === 'franqueado').length || 0;

  return (
    <MinimalistLayout 
      title="Meus Parceiros" 
      subtitle={`${parceirosFiltrados.length} parceiro${parceirosFiltrados.length !== 1 ? 's' : ''}`}
    >
      {/* Cards de contagem */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setTipoFiltro(tipoFiltro === 'autorizado' ? '' : 'autorizado')}
          className={`bg-primary/5 border rounded-xl p-4 backdrop-blur-sm text-center transition-all ${
            tipoFiltro === 'autorizado' ? 'border-blue-500/50 bg-blue-500/10' : 'border-primary/10 hover:bg-primary/10'
          }`}
        >
          <Store className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{autorizados}</p>
          <p className="text-xs text-white/60">Autorizados</p>
        </button>
        
        <button
          onClick={() => setTipoFiltro(tipoFiltro === 'representante' ? '' : 'representante')}
          className={`bg-primary/5 border rounded-xl p-4 backdrop-blur-sm text-center transition-all ${
            tipoFiltro === 'representante' ? 'border-purple-500/50 bg-purple-500/10' : 'border-primary/10 hover:bg-primary/10'
          }`}
        >
          <Users className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{representantes}</p>
          <p className="text-xs text-white/60">Representantes</p>
        </button>
        
        <button
          onClick={() => setTipoFiltro(tipoFiltro === 'franqueado' ? '' : 'franqueado')}
          className={`bg-primary/5 border rounded-xl p-4 backdrop-blur-sm text-center transition-all ${
            tipoFiltro === 'franqueado' ? 'border-green-500/50 bg-green-500/10' : 'border-primary/10 hover:bg-primary/10'
          }`}
        >
          <Building2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{franqueados}</p>
          <p className="text-xs text-white/60">Franqueados</p>
        </button>
      </div>

      {/* Lista de parceiros */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-white/5" />
          ))
        ) : parceirosFiltrados.length > 0 ? (
          parceirosFiltrados.map((parceiro) => {
            const TipoIcon = getTipoIcon(parceiro.tipo_parceiro as TipoParceiro);
            const etapaAtual = getCurrentEtapa(parceiro);
            const etapasInfo = getEtapasByTipo(parceiro.tipo_parceiro as TipoParceiro);
            
            return (
              <div
                key={parceiro.id}
                onClick={() => navigate(`/dashboard/parceiros/${parceiro.tipo_parceiro}/${parceiro.id}`)}
                className="bg-primary/5 border border-primary/10 rounded-xl p-4 backdrop-blur-sm
                           hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getTipoColor(parceiro.tipo_parceiro as TipoParceiro).split(' ').slice(0, 2).join(' ')}`}>
                    <TipoIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{parceiro.nome}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getTipoColor(parceiro.tipo_parceiro as TipoParceiro)}`}>
                        {TIPO_PARCEIRO_LABELS[parceiro.tipo_parceiro as TipoParceiro]}
                      </span>
                    </div>
                    
                    {etapaAtual && (
                      <p className="text-sm text-white/60 mb-2">
                        Etapa: {etapasInfo.etapas[etapaAtual] || etapaAtual}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      {(parceiro.cidade || parceiro.estado) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{[parceiro.cidade, parceiro.estado].filter(Boolean).join(' - ')}</span>
                        </div>
                      )}
                      {parceiro.telefone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{parceiro.telefone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Handshake className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">
              {tipoFiltro ? 'Nenhum parceiro encontrado nesta categoria' : 'Você ainda não tem parceiros vinculados'}
            </p>
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}
