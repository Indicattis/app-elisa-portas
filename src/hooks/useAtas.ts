import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Ata {
  id: string;
  assunto: string;
  conteudo: string;
  duracao_segundos: number;
  data_inicio: string;
  data_fim: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AtaParticipante {
  id: string;
  ata_id: string;
  user_id: string;
  created_at: string;
}

export interface AtaComParticipantes extends Ata {
  participantes: {
    user_id: string;
    admin_users: {
      nome: string;
      email: string;
      foto_perfil_url: string | null;
      role: string;
    } | null;
  }[];
  criador: {
    nome: string;
    email: string;
    foto_perfil_url: string | null;
  } | null;
}

export interface FiltrosAtas {
  dataInicio?: Date;
  dataFim?: Date;
  assunto?: string;
  participantes?: string[];
  duracaoMin?: number;
  duracaoMax?: number;
}

export function useAtas(filtros?: FiltrosAtas) {
  return useQuery({
    queryKey: ['atas', filtros],
    queryFn: async () => {
      let query = supabase
        .from('atas_reuniao')
        .select('*')
        .order('data_inicio', { ascending: false });

      // Aplicar filtros
      if (filtros?.dataInicio) {
        query = query.gte('data_inicio', filtros.dataInicio.toISOString());
      }
      if (filtros?.dataFim) {
        query = query.lte('data_fim', filtros.dataFim.toISOString());
      }
      if (filtros?.assunto) {
        query = query.ilike('assunto', `%${filtros.assunto}%`);
      }
      if (filtros?.duracaoMin !== undefined) {
        query = query.gte('duracao_segundos', filtros.duracaoMin);
      }
      if (filtros?.duracaoMax !== undefined) {
        query = query.lte('duracao_segundos', filtros.duracaoMax);
      }

      const { data: atas, error } = await query;

      if (error) throw error;

      // Buscar participantes e criadores separadamente
      const atasComDados = await Promise.all(
        (atas || []).map(async (ata) => {
          // Buscar participantes
          const { data: participantesData } = await supabase
            .from('atas_participantes')
            .select('user_id')
            .eq('ata_id', ata.id);

          const userIds = participantesData?.map(p => p.user_id) || [];
          
          // Buscar dados dos participantes
          const { data: usersData } = await supabase
            .from('admin_users')
            .select('user_id, nome, email, foto_perfil_url, role')
            .in('user_id', userIds);

          const participantes = userIds.map(userId => {
            const userData = usersData?.find(u => u.user_id === userId);
            return {
              user_id: userId,
              admin_users: userData ? {
                nome: userData.nome,
                email: userData.email,
                foto_perfil_url: userData.foto_perfil_url,
                role: userData.role
              } : null
            };
          });

          // Buscar criador
          let criador = null;
          if (ata.created_by) {
            const { data: criadorData } = await supabase
              .from('admin_users')
              .select('nome, email, foto_perfil_url')
              .eq('user_id', ata.created_by)
              .single();

            criador = criadorData;
          }

          return {
            ...ata,
            participantes,
            criador
          };
        })
      );

      // Filtrar por participantes (client-side)
      let atasFiltered = atasComDados;
      if (filtros?.participantes && filtros.participantes.length > 0) {
        atasFiltered = atasComDados.filter(ata =>
          ata.participantes.some(p =>
            filtros.participantes?.includes(p.user_id)
          )
        );
      }

      return atasFiltered as AtaComParticipantes[];
    },
  });
}

export function useAtaDetails(id: string) {
  return useQuery({
    queryKey: ['ata', id],
    queryFn: async () => {
      const { data: ata, error } = await supabase
        .from('atas_reuniao')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Buscar participantes
      const { data: participantesData } = await supabase
        .from('atas_participantes')
        .select('user_id')
        .eq('ata_id', id);

      const userIds = participantesData?.map(p => p.user_id) || [];
      
      // Buscar dados dos participantes
      const { data: usersData } = await supabase
        .from('admin_users')
        .select('user_id, nome, email, foto_perfil_url, role')
        .in('user_id', userIds);

      const participantes = userIds.map(userId => {
        const userData = usersData?.find(u => u.user_id === userId);
        return {
          user_id: userId,
          admin_users: userData ? {
            nome: userData.nome,
            email: userData.email,
            foto_perfil_url: userData.foto_perfil_url,
            role: userData.role
          } : null
        };
      });

      // Buscar criador
      let criador = null;
      if (ata.created_by) {
        const { data: criadorData } = await supabase
          .from('admin_users')
          .select('nome, email, foto_perfil_url')
          .eq('user_id', ata.created_by)
          .single();

        criador = criadorData;
      }

      return {
        ...ata,
        participantes,
        criador
      } as AtaComParticipantes;
    },
    enabled: !!id,
  });
}

export function useCreateAta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assunto,
      conteudo,
      duracao_segundos,
      data_inicio,
      data_fim,
      participantes,
    }: {
      assunto: string;
      conteudo: string;
      duracao_segundos: number;
      data_inicio: Date;
      data_fim: Date;
      participantes: string[];
    }) => {
      // 1. Criar a ata
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: ata, error: ataError } = await supabase
        .from('atas_reuniao')
        .insert({
          assunto,
          conteudo,
          duracao_segundos,
          data_inicio: data_inicio.toISOString(),
          data_fim: data_fim.toISOString(),
          created_by: user.user.id,
        })
        .select()
        .single();

      if (ataError) throw ataError;

      // 2. Adicionar participantes
      const participantesData = participantes.map(user_id => ({
        ata_id: ata.id,
        user_id,
      }));

      const { error: participantesError } = await supabase
        .from('atas_participantes')
        .insert(participantesData);

      if (participantesError) throw participantesError;

      return ata;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atas'] });
      toast.success('Ata registrada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar ata:', error);
      toast.error('Erro ao registrar ata');
    },
  });
}
