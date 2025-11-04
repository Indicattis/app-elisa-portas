import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { ESTADOS_BRASIL, CIDADES_POR_ESTADO } from '@/utils/estadosCidades';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MapaLocalizacaoPesquisaProps {
  onPesquisar: (lat: number, lng: number) => void;
}

export function MapaLocalizacaoPesquisa({ onPesquisar }: MapaLocalizacaoPesquisaProps) {
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handlePesquisar = async () => {
    if (!estadoSelecionado || !cidadeSelecionada) {
      toast.error('Selecione um estado e uma cidade');
      return;
    }

    setLoading(true);
    try {
      // Chamar a função de geocodificação
      const { data, error } = await supabase.functions.invoke('geocode-nominatim', {
        body: {
          id: 'temp-search',
          cidade: cidadeSelecionada,
          estado: estadoSelecionado
        }
      });

      if (error) throw error;

      if (data?.success && data?.latitude && data?.longitude) {
        onPesquisar(data.latitude, data.longitude);
        toast.success(`Localização encontrada: ${cidadeSelecionada}, ${estadoSelecionado}`);
      } else {
        toast.error('Não foi possível encontrar as coordenadas para esta localização');
      }
    } catch (error) {
      console.error('Erro ao geocodificar:', error);
      toast.error('Erro ao buscar localização');
    } finally {
      setLoading(false);
    }
  };

  const cidadesDisponiveis = estadoSelecionado ? CIDADES_POR_ESTADO[estadoSelecionado] || [] : [];

  return (
    <Card className="fixed top-20 left-4 z-[1000] p-4 w-80 shadow-lg">
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Pesquisar Localização</h3>
        
        <div className="space-y-2">
          <Select
            value={estadoSelecionado}
            onValueChange={(value) => {
              setEstadoSelecionado(value);
              setCidadeSelecionada(''); // Reset cidade ao mudar estado
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_BRASIL.map((estado) => (
                <SelectItem key={estado.sigla} value={estado.sigla}>
                  {estado.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={cidadeSelecionada}
            onValueChange={setCidadeSelecionada}
            disabled={!estadoSelecionado}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cidade" />
            </SelectTrigger>
            <SelectContent>
              {cidadesDisponiveis.map((cidade) => (
                <SelectItem key={cidade} value={cidade}>
                  {cidade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handlePesquisar} 
          disabled={!estadoSelecionado || !cidadeSelecionada || loading}
          className="w-full"
        >
          <Search className="h-4 w-4 mr-2" />
          {loading ? 'Pesquisando...' : 'Pesquisar'}
        </Button>
      </div>
    </Card>
  );
}
