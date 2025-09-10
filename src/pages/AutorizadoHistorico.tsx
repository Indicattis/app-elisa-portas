import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutorizadosRatings } from '@/hooks/useAutorizadosRatings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Phone, Mail, User, Calendar, DollarSign, Star } from 'lucide-react';
import { AddRatingDialog } from '@/components/AddRatingDialog';
import { ETAPAS, ETAPA_COLORS } from '@/utils/etapas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Autorizado {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  responsavel?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  regiao?: string;
  logo_url?: string;
  ativo: boolean;
  etapa: string;
  vendedor_id?: string;
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

const categoriaLabels = {
  instalacao: 'Instalação',
  bos: "B.O's",
  visita_tecnica: 'Visita Técnica',
  manutencao: 'Manutenção'
} as const;

export default function AutorizadoHistorico() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [autorizado, setAutorizado] = useState<Autorizado | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { ratings, isLoading: ratingsLoading } = useAutorizadosRatings(id);

  useEffect(() => {
    if (!id) return;

    const fetchAutorizado = async () => {
      try {
        const { data, error } = await supabase
          .from('autorizados')
          .select(`
            *,
            vendedor:admin_users!vendedor_id(nome, foto_perfil_url)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setAutorizado(data);
      } catch (error) {
        console.error('Erro ao buscar autorizado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAutorizado();
  }, [id]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
      locale: ptBR,
    });
  };

  const getMediaRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.nota, 0);
    return Number((sum / ratings.length).toFixed(1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Autorizado não encontrado</p>
        <Button onClick={() => navigate('/dashboard/autorizados')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard/autorizados')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{autorizado.nome}</h1>
            <p className="text-muted-foreground">Histórico e informações detalhadas</p>
          </div>
        </div>
        
        <AddRatingDialog autorizadoId={autorizado.id} autorizadoNome={autorizado.nome}>
          <Button>
            <Star className="h-4 w-4 mr-2" />
            Adicionar Avaliação
          </Button>
        </AddRatingDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Gerais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar e nome */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={autorizado.logo_url} alt={autorizado.nome} />
                  <AvatarFallback className="text-lg">
                    {getInitials(autorizado.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{autorizado.nome}</h3>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={autorizado.ativo ? "default" : "secondary"}
                      style={{ backgroundColor: autorizado.ativo ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}
                    >
                      {autorizado.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: ETAPA_COLORS[autorizado.etapa as keyof typeof ETAPA_COLORS],
                        color: ETAPA_COLORS[autorizado.etapa as keyof typeof ETAPA_COLORS]
                      }}
                    >
                      {ETAPAS[autorizado.etapa as keyof typeof ETAPAS]}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contatos */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">CONTATOS</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {autorizado.responsavel && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Responsável</p>
                        <p className="text-sm text-muted-foreground">{autorizado.responsavel}</p>
                      </div>
                    </div>
                  )}
                  
                  {autorizado.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">E-mail</p>
                        <p className="text-sm text-muted-foreground">{autorizado.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {autorizado.telefone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Telefone</p>
                        <p className="text-sm text-muted-foreground">{autorizado.telefone}</p>
                      </div>
                    </div>
                  )}
                  
                  {autorizado.whatsapp && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">WhatsApp</p>
                        <p className="text-sm text-muted-foreground">{autorizado.whatsapp}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Endereço */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">LOCALIZAÇÃO</h4>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Endereço</p>
                    <p className="text-sm text-muted-foreground">
                      {[autorizado.endereco, autorizado.cidade, autorizado.estado, autorizado.cep]
                        .filter(Boolean)
                        .join(', ') || 'Não informado'}
                    </p>
                    {autorizado.regiao && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Região:</span> {autorizado.regiao}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendedor */}
              {autorizado.vendedor && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">VENDEDOR RESPONSÁVEL</h4>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={autorizado.vendedor.foto_perfil_url} alt={autorizado.vendedor.nome} />
                        <AvatarFallback className="text-xs">
                          {getInitials(autorizado.vendedor.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{autorizado.vendedor.nome}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Timestamps */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">HISTÓRICO</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Criado em</p>
                      <p className="text-sm text-muted-foreground">{formatDate(autorizado.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Última atualização</p>
                      <p className="text-sm text-muted-foreground">{formatDate(autorizado.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Avaliações */}
        <div className="space-y-6">
          {/* Resumo das Avaliações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Avaliações
              </CardTitle>
              <CardDescription>
                Resumo das avaliações do autorizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold">{getMediaRating()}</div>
                <div className="flex justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= getMediaRating()
                          ? 'text-yellow-400 fill-current'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {ratings.length} avaliação{ratings.length !== 1 ? 'ões' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Avaliações */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              {ratingsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Carregando avaliações...</p>
                </div>
              ) : ratings.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma avaliação encontrada
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {categoriaLabels[rating.categoria as keyof typeof categoriaLabels]}
                        </Badge>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.nota
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-sm">{rating.descricao}</p>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {rating.data_evento && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Data do evento: {format(new Date(rating.data_evento), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                        
                        {rating.custo && rating.custo > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Custo: R$ {Number(rating.custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Registrado em: {format(new Date(rating.created_at), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Registrado por atendente</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}