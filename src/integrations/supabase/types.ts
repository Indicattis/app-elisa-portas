export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      acessorios: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: []
      }
      adicionais: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          ativo: boolean
          codigo_usuario: string | null
          created_at: string
          email: string
          foto_perfil_url: string | null
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"] | null
          setor: Database["public"]["Enums"]["setor_type"] | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          codigo_usuario?: string | null
          created_at?: string
          email: string
          foto_perfil_url?: string | null
          id?: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"] | null
          setor?: Database["public"]["Enums"]["setor_type"] | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          codigo_usuario?: string | null
          created_at?: string
          email?: string
          foto_perfil_url?: string | null
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          setor?: Database["public"]["Enums"]["setor_type"] | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_routes: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          group: string | null
          icon: string | null
          interface: string | null
          key: string
          label: string
          parent_key: string | null
          path: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          group?: string | null
          icon?: string | null
          interface?: string | null
          key: string
          label: string
          parent_key?: string | null
          path: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          group?: string | null
          icon?: string | null
          interface?: string | null
          key?: string
          label?: string
          parent_key?: string | null
          path?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_routes_parent_key_fkey"
            columns: ["parent_key"]
            isOneToOne: false
            referencedRelation: "app_routes"
            referencedColumns: ["key"]
          },
        ]
      }
      atas_participantes: {
        Row: {
          ata_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ata_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ata_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atas_participantes_ata_id_fkey"
            columns: ["ata_id"]
            isOneToOne: false
            referencedRelation: "atas_reuniao"
            referencedColumns: ["id"]
          },
        ]
      }
      atas_reuniao: {
        Row: {
          assunto: string
          conteudo: string
          created_at: string
          created_by: string | null
          data_fim: string
          data_inicio: string
          duracao_segundos: number
          id: string
          updated_at: string
        }
        Insert: {
          assunto: string
          conteudo: string
          created_at?: string
          created_by?: string | null
          data_fim: string
          data_inicio: string
          duracao_segundos: number
          id?: string
          updated_at?: string
        }
        Update: {
          assunto?: string
          conteudo?: string
          created_at?: string
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          duracao_segundos?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      autorizados: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          contrato_nome_arquivo: string | null
          contrato_tamanho_arquivo: number | null
          contrato_uploaded_at: string | null
          contrato_url: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          etapa: Database["public"]["Enums"]["autorizado_etapa"] | null
          franqueado_etapa:
            | Database["public"]["Enums"]["franqueado_etapa"]
            | null
          geocode_precision: string | null
          id: string
          last_geocoded_at: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          nome: string
          regiao: string | null
          representante_etapa:
            | Database["public"]["Enums"]["representante_etapa"]
            | null
          responsavel: string | null
          telefone: string | null
          tipo_parceiro: Database["public"]["Enums"]["tipo_parceiro"]
          updated_at: string
          vendedor_id: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          contrato_nome_arquivo?: string | null
          contrato_tamanho_arquivo?: number | null
          contrato_uploaded_at?: string | null
          contrato_url?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          etapa?: Database["public"]["Enums"]["autorizado_etapa"] | null
          franqueado_etapa?:
            | Database["public"]["Enums"]["franqueado_etapa"]
            | null
          geocode_precision?: string | null
          id?: string
          last_geocoded_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nome: string
          regiao?: string | null
          representante_etapa?:
            | Database["public"]["Enums"]["representante_etapa"]
            | null
          responsavel?: string | null
          telefone?: string | null
          tipo_parceiro?: Database["public"]["Enums"]["tipo_parceiro"]
          updated_at?: string
          vendedor_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          contrato_nome_arquivo?: string | null
          contrato_tamanho_arquivo?: number | null
          contrato_uploaded_at?: string | null
          contrato_url?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          etapa?: Database["public"]["Enums"]["autorizado_etapa"] | null
          franqueado_etapa?:
            | Database["public"]["Enums"]["franqueado_etapa"]
            | null
          geocode_precision?: string | null
          id?: string
          last_geocoded_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nome?: string
          regiao?: string | null
          representante_etapa?:
            | Database["public"]["Enums"]["representante_etapa"]
            | null
          responsavel?: string | null
          telefone?: string | null
          tipo_parceiro?: Database["public"]["Enums"]["tipo_parceiro"]
          updated_at?: string
          vendedor_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autorizados_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendario_cores: {
        Row: {
          ativa: boolean
          cor: string
          created_at: string
          created_by: string | null
          data_producao: string
          id: string
        }
        Insert: {
          ativa?: boolean
          cor: string
          created_at?: string
          created_by?: string | null
          data_producao: string
          id?: string
        }
        Update: {
          ativa?: boolean
          cor?: string
          created_at?: string
          created_by?: string | null
          data_producao?: string
          id?: string
        }
        Relationships: []
      }
      canais_aquisicao: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalogo_cores: {
        Row: {
          ativa: boolean
          codigo_hex: string
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          codigo_hex: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          codigo_hex?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      contador_vendas_dias: {
        Row: {
          atendente_id: string
          created_at: string
          created_by: string
          data: string
          id: string
          numero_vendas: number
          updated_at: string
          valor: number
        }
        Insert: {
          atendente_id: string
          created_at?: string
          created_by: string
          data: string
          id?: string
          numero_vendas?: number
          updated_at?: string
          valor?: number
        }
        Update: {
          atendente_id?: string
          created_at?: string
          created_by?: string
          data?: string
          id?: string
          numero_vendas?: number
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contador_vendas_dias_atendente_id_fkey"
            columns: ["atendente_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          numero_parcela: number
          observacoes: string | null
          status: string
          updated_at: string
          valor_pago: number | null
          valor_parcela: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          numero_parcela: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_pago?: number | null
          valor_parcela: number
          venda_id: string
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          numero_parcela?: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_pago?: number | null
          valor_parcela?: number
          venda_id?: string
        }
        Relationships: []
      }
      despesas_mensais: {
        Row: {
          categoria: string
          created_at: string | null
          created_by: string | null
          id: string
          mes: string
          modalidade: string
          nome: string
          observacoes: string | null
          updated_at: string | null
          valor_esperado: number
          valor_real: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          mes: string
          modalidade: string
          nome: string
          observacoes?: string | null
          updated_at?: string | null
          valor_esperado?: number
          valor_real?: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          mes?: string
          modalidade?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string | null
          valor_esperado?: number
          valor_real?: number
        }
        Relationships: []
      }
      documentos: {
        Row: {
          arquivo_url: string
          ativo: boolean
          categoria: Database["public"]["Enums"]["documento_categoria"]
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome_arquivo: string
          tamanho_arquivo: number
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_url: string
          ativo?: boolean
          categoria?: Database["public"]["Enums"]["documento_categoria"]
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome_arquivo: string
          tamanho_arquivo: number
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string
          ativo?: boolean
          categoria?: Database["public"]["Enums"]["documento_categoria"]
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome_arquivo?: string
          tamanho_arquivo?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      dre_mensais: {
        Row: {
          created_at: string | null
          created_by: string | null
          custos_producao: number
          despesas_fixas: number
          despesas_variaveis: number
          faturamento_total: number
          id: string
          mes: string
          observacoes: string | null
          resultado_final: number
          total_vendas: number
          updated_at: string | null
          vendas_faturadas: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          custos_producao?: number
          despesas_fixas?: number
          despesas_variaveis?: number
          faturamento_total?: number
          id?: string
          mes: string
          observacoes?: string | null
          resultado_final?: number
          total_vendas?: number
          updated_at?: string | null
          vendas_faturadas?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          custos_producao?: number
          despesas_fixas?: number
          despesas_variaveis?: number
          faturamento_total?: number
          id?: string
          mes?: string
          observacoes?: string | null
          resultado_final?: number
          total_vendas?: number
          updated_at?: string | null
          vendas_faturadas?: number
        }
        Relationships: []
      }
      elisaportas_leads: {
        Row: {
          altura_porta: string | null
          atendente_id: string | null
          canal_aquisicao: string
          canal_aquisicao_id: string | null
          cidade: string | null
          cor_porta: string | null
          created_at: string
          data_conclusao_atendimento: string | null
          data_envio: string
          data_inicio_atendimento: string | null
          data_prevista_entrega: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade_completa: string | null
          endereco_complemento: string | null
          endereco_estado: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          funcao_lead: string | null
          id: string
          largura_porta: string | null
          mensagem: string | null
          motivo_perda: Database["public"]["Enums"]["motivo_perda"] | null
          nome: string
          novo_status: Database["public"]["Enums"]["lead_status"] | null
          observacoes: string | null
          observacoes_perda: string | null
          tag_id: number | null
          telefone: string
          tipo_porta: string | null
          updated_at: string
          valor_orcamento: number | null
        }
        Insert: {
          altura_porta?: string | null
          atendente_id?: string | null
          canal_aquisicao?: string
          canal_aquisicao_id?: string | null
          cidade?: string | null
          cor_porta?: string | null
          created_at?: string
          data_conclusao_atendimento?: string | null
          data_envio?: string
          data_inicio_atendimento?: string | null
          data_prevista_entrega?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade_completa?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          funcao_lead?: string | null
          id?: string
          largura_porta?: string | null
          mensagem?: string | null
          motivo_perda?: Database["public"]["Enums"]["motivo_perda"] | null
          nome: string
          novo_status?: Database["public"]["Enums"]["lead_status"] | null
          observacoes?: string | null
          observacoes_perda?: string | null
          tag_id?: number | null
          telefone: string
          tipo_porta?: string | null
          updated_at?: string
          valor_orcamento?: number | null
        }
        Update: {
          altura_porta?: string | null
          atendente_id?: string | null
          canal_aquisicao?: string
          canal_aquisicao_id?: string | null
          cidade?: string | null
          cor_porta?: string | null
          created_at?: string
          data_conclusao_atendimento?: string | null
          data_envio?: string
          data_inicio_atendimento?: string | null
          data_prevista_entrega?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade_completa?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          funcao_lead?: string | null
          id?: string
          largura_porta?: string | null
          mensagem?: string | null
          motivo_perda?: Database["public"]["Enums"]["motivo_perda"] | null
          nome?: string
          novo_status?: Database["public"]["Enums"]["lead_status"] | null
          observacoes?: string | null
          observacoes_perda?: string | null
          tag_id?: number | null
          telefone?: string
          tipo_porta?: string | null
          updated_at?: string
          valor_orcamento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "elisaportas_leads_canal_aquisicao_id_fkey"
            columns: ["canal_aquisicao_id"]
            isOneToOne: false
            referencedRelation: "canais_aquisicao"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas: {
        Row: {
          cidade: string
          created_at: string
          created_by: string | null
          data_entrega: string | null
          data_producao: string | null
          entrega_concluida: boolean | null
          entrega_concluida_em: string | null
          entrega_concluida_por: string | null
          estado: string
          geocode_precision: string | null
          id: string
          last_geocoded_at: string | null
          latitude: number | null
          longitude: number | null
          nome_cliente: string
          observacoes: string | null
          pedido_id: string | null
          responsavel_entrega_id: string | null
          responsavel_entrega_nome: string | null
          status: string
          tamanho: string | null
          telefone_cliente: string | null
          updated_at: string
          venda_id: string | null
        }
        Insert: {
          cidade: string
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          data_producao?: string | null
          entrega_concluida?: boolean | null
          entrega_concluida_em?: string | null
          entrega_concluida_por?: string | null
          estado: string
          geocode_precision?: string | null
          id?: string
          last_geocoded_at?: string | null
          latitude?: number | null
          longitude?: number | null
          nome_cliente: string
          observacoes?: string | null
          pedido_id?: string | null
          responsavel_entrega_id?: string | null
          responsavel_entrega_nome?: string | null
          status?: string
          tamanho?: string | null
          telefone_cliente?: string | null
          updated_at?: string
          venda_id?: string | null
        }
        Update: {
          cidade?: string
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          data_producao?: string | null
          entrega_concluida?: boolean | null
          entrega_concluida_em?: string | null
          entrega_concluida_por?: string | null
          estado?: string
          geocode_precision?: string | null
          id?: string
          last_geocoded_at?: string | null
          latitude?: number | null
          longitude?: number | null
          nome_cliente?: string
          observacoes?: string | null
          pedido_id?: string | null
          responsavel_entrega_id?: string | null
          responsavel_entrega_nome?: string | null
          status?: string
          tamanho?: string | null
          telefone_cliente?: string | null
          updated_at?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes_instalacao: {
        Row: {
          ativa: boolean
          cor: string | null
          created_at: string
          id: string
          nome: string
          responsavel_id: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          responsavel_id?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          responsavel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_instalacao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes_instalacao_membros: {
        Row: {
          created_at: string
          created_by: string | null
          equipe_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          equipe_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          equipe_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_instalacao_membros_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_instalacao"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          custo_unitario: number
          descricao_produto: string | null
          fornecedor_id: string | null
          id: string
          nome_produto: string
          peso_porta: number | null
          quantidade: number
          quantidade_ideal: number | null
          setor_responsavel_producao:
            | Database["public"]["Enums"]["setor_producao"]
            | null
          subcategoria_id: string | null
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_unitario?: number
          descricao_produto?: string | null
          fornecedor_id?: string | null
          id?: string
          nome_produto: string
          peso_porta?: number | null
          quantidade?: number
          quantidade_ideal?: number | null
          setor_responsavel_producao?:
            | Database["public"]["Enums"]["setor_producao"]
            | null
          subcategoria_id?: string | null
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_unitario?: number
          descricao_produto?: string | null
          fornecedor_id?: string | null
          id?: string
          nome_produto?: string
          peso_porta?: number | null
          quantidade?: number
          quantidade_ideal?: number | null
          setor_responsavel_producao?:
            | Database["public"]["Enums"]["setor_producao"]
            | null
          subcategoria_id?: string | null
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "estoque_subcategorias"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_categorias: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor: string
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      estoque_movimentacoes: {
        Row: {
          categoria_anterior: string | null
          categoria_nova: string | null
          created_at: string
          created_by: string | null
          id: string
          observacoes: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_nova: number
          tipo_movimentacao: string
        }
        Insert: {
          categoria_anterior?: string | null
          categoria_nova?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_nova: number
          tipo_movimentacao: string
        }
        Update: {
          categoria_anterior?: string | null
          categoria_nova?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          produto_id?: string
          quantidade?: number
          quantidade_anterior?: number
          quantidade_nova?: number
          tipo_movimentacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_subcategorias: {
        Row: {
          ativo: boolean
          categoria_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_subcategorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "estoque_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_calendario: {
        Row: {
          categoria: string
          created_at: string
          created_by: string
          data_evento: string
          descricao_evento: string | null
          horario_evento: string
          id: string
          nome_evento: string
          updated_at: string
        }
        Insert: {
          categoria: string
          created_at?: string
          created_by: string
          data_evento: string
          descricao_evento?: string | null
          horario_evento: string
          id?: string
          nome_evento: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string
          data_evento?: string
          descricao_evento?: string | null
          horario_evento?: string
          id?: string
          nome_evento?: string
          updated_at?: string
        }
        Relationships: []
      }
      eventos_membros: {
        Row: {
          created_at: string
          evento_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evento_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evento_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_membros_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_calendario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_eventos_membros_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          created_by: string | null
          estado: string | null
          id: string
          nome: string
          responsavel: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string | null
          id?: string
          nome: string
          responsavel?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string | null
          id?: string
          nome?: string
          responsavel?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      instalacoes_cadastradas: {
        Row: {
          alterado_para_correcao_em: string | null
          alterado_para_correcao_por: string | null
          cidade: string
          created_at: string
          created_by: string | null
          data_instalacao: string | null
          data_producao: string | null
          estado: string
          geocode_precision: string | null
          id: string
          instalacao_concluida: boolean | null
          instalacao_concluida_em: string | null
          instalacao_concluida_por: string | null
          justificativa_correcao: string | null
          last_geocoded_at: string | null
          latitude: number | null
          longitude: number | null
          nome_cliente: string
          pedido_id: string | null
          responsavel_instalacao_id: string | null
          responsavel_instalacao_nome: string | null
          status: string
          telefone_cliente: string | null
          tipo_instalacao:
            | Database["public"]["Enums"]["tipo_instalacao_enum"]
            | null
          updated_at: string
          venda_id: string | null
        }
        Insert: {
          alterado_para_correcao_em?: string | null
          alterado_para_correcao_por?: string | null
          cidade: string
          created_at?: string
          created_by?: string | null
          data_instalacao?: string | null
          data_producao?: string | null
          estado: string
          geocode_precision?: string | null
          id?: string
          instalacao_concluida?: boolean | null
          instalacao_concluida_em?: string | null
          instalacao_concluida_por?: string | null
          justificativa_correcao?: string | null
          last_geocoded_at?: string | null
          latitude?: number | null
          longitude?: number | null
          nome_cliente: string
          pedido_id?: string | null
          responsavel_instalacao_id?: string | null
          responsavel_instalacao_nome?: string | null
          status?: string
          telefone_cliente?: string | null
          tipo_instalacao?:
            | Database["public"]["Enums"]["tipo_instalacao_enum"]
            | null
          updated_at?: string
          venda_id?: string | null
        }
        Update: {
          alterado_para_correcao_em?: string | null
          alterado_para_correcao_por?: string | null
          cidade?: string
          created_at?: string
          created_by?: string | null
          data_instalacao?: string | null
          data_producao?: string | null
          estado?: string
          geocode_precision?: string | null
          id?: string
          instalacao_concluida?: boolean | null
          instalacao_concluida_em?: string | null
          instalacao_concluida_por?: string | null
          justificativa_correcao?: string | null
          last_geocoded_at?: string | null
          latitude?: number | null
          longitude?: number | null
          nome_cliente?: string
          pedido_id?: string | null
          responsavel_instalacao_id?: string | null
          responsavel_instalacao_nome?: string | null
          status?: string
          telefone_cliente?: string | null
          tipo_instalacao?:
            | Database["public"]["Enums"]["tipo_instalacao_enum"]
            | null
          updated_at?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instalacoes_cadastradas_alterado_para_correcao_por_fkey"
            columns: ["alterado_para_correcao_por"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instalacoes_cadastradas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instalacoes_cadastradas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_anexos: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          nome_arquivo: string
          tamanho_arquivo: number | null
          tipo_arquivo: string | null
          uploaded_by: string | null
          url_arquivo: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          nome_arquivo: string
          tamanho_arquivo?: number | null
          tipo_arquivo?: string | null
          uploaded_by?: string | null
          url_arquivo: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          nome_arquivo?: string
          tamanho_arquivo?: number | null
          tipo_arquivo?: string | null
          uploaded_by?: string | null
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "elisaportas_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_atendimento_historico: {
        Row: {
          acao: string
          atendente_id: string
          created_at: string
          id: string
          lead_id: string
          observacoes: string | null
          status_anterior: number | null
          status_novo: number | null
        }
        Insert: {
          acao: string
          atendente_id: string
          created_at?: string
          id?: string
          lead_id: string
          observacoes?: string | null
          status_anterior?: number | null
          status_novo?: number | null
        }
        Update: {
          acao?: string
          atendente_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          observacoes?: string | null
          status_anterior?: number | null
          status_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_atendimento_historico_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "elisaportas_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_comentarios: {
        Row: {
          comentario: string
          created_at: string
          id: string
          lead_id: string
          usuario_id: string
        }
        Insert: {
          comentario: string
          created_at?: string
          id?: string
          lead_id: string
          usuario_id: string
        }
        Update: {
          comentario?: string
          created_at?: string
          id?: string
          lead_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_comentarios_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "elisaportas_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_etiqueta_historico: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          observacoes: string | null
          tag_id_anterior: number | null
          tag_id_novo: number | null
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          observacoes?: string | null
          tag_id_anterior?: number | null
          tag_id_novo?: number | null
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          observacoes?: string | null
          tag_id_anterior?: number | null
          tag_id_novo?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_etiqueta_historico_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "elisaportas_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      linhas_ordens: {
        Row: {
          altura: number | null
          concluida: boolean | null
          concluida_em: string | null
          concluida_por: string | null
          cor_nome: string | null
          created_at: string
          id: string
          item: string
          largura: number | null
          ordem_id: string | null
          pedido_id: string
          produto_venda_id: string | null
          quantidade: number
          tamanho: string | null
          tipo_ordem: string
          tipo_pintura: string | null
          updated_at: string
        }
        Insert: {
          altura?: number | null
          concluida?: boolean | null
          concluida_em?: string | null
          concluida_por?: string | null
          cor_nome?: string | null
          created_at?: string
          id?: string
          item: string
          largura?: number | null
          ordem_id?: string | null
          pedido_id: string
          produto_venda_id?: string | null
          quantidade?: number
          tamanho?: string | null
          tipo_ordem: string
          tipo_pintura?: string | null
          updated_at?: string
        }
        Update: {
          altura?: number | null
          concluida?: boolean | null
          concluida_em?: string | null
          concluida_por?: string | null
          cor_nome?: string | null
          created_at?: string
          id?: string
          item?: string
          largura?: number | null
          ordem_id?: string | null
          pedido_id?: string
          produto_venda_id?: string | null
          quantidade?: number
          tamanho?: string | null
          tipo_ordem?: string
          tipo_pintura?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "linhas_ordens_concluida_por_fkey"
            columns: ["concluida_por"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "linhas_ordens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_investimentos: {
        Row: {
          created_at: string
          created_by: string
          id: string
          investimento_google_ads: number | null
          investimento_linkedin_ads: number | null
          investimento_meta_ads: number | null
          mes: string
          observacoes: string | null
          outros_investimentos: number | null
          regiao: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          investimento_google_ads?: number | null
          investimento_linkedin_ads?: number | null
          investimento_meta_ads?: number | null
          mes: string
          observacoes?: string | null
          outros_investimentos?: number | null
          regiao?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          investimento_google_ads?: number | null
          investimento_linkedin_ads?: number | null
          investimento_meta_ads?: number | null
          mes?: string
          observacoes?: string | null
          outros_investimentos?: number | null
          regiao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      numeracao_controle: {
        Row: {
          created_at: string | null
          id: string
          proximo_numero: number
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          proximo_numero?: number
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          proximo_numero?: number
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      orcamento_custos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          orcamento_id: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          orcamento_id: string
          tipo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          orcamento_id?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      orcamento_produtos: {
        Row: {
          acessorio_id: string | null
          adicional_id: string | null
          cor: string | null
          cor_id: string | null
          created_at: string
          desconto_percentual: number | null
          descricao: string
          descricao_manutencao: string | null
          id: string
          medidas: string | null
          orcamento_id: string
          preco_instalacao: number | null
          preco_producao: number | null
          quantidade: number
          tipo_produto: string
          updated_at: string
          valor: number
        }
        Insert: {
          acessorio_id?: string | null
          adicional_id?: string | null
          cor?: string | null
          cor_id?: string | null
          created_at?: string
          desconto_percentual?: number | null
          descricao: string
          descricao_manutencao?: string | null
          id?: string
          medidas?: string | null
          orcamento_id: string
          preco_instalacao?: number | null
          preco_producao?: number | null
          quantidade?: number
          tipo_produto: string
          updated_at?: string
          valor?: number
        }
        Update: {
          acessorio_id?: string | null
          adicional_id?: string | null
          cor?: string | null
          cor_id?: string | null
          created_at?: string
          desconto_percentual?: number | null
          descricao?: string
          descricao_manutencao?: string | null
          id?: string
          medidas?: string | null
          orcamento_id?: string
          preco_instalacao?: number | null
          preco_producao?: number | null
          quantidade?: number
          tipo_produto?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_orcamento_produtos_acessorio"
            columns: ["acessorio_id"]
            isOneToOne: false
            referencedRelation: "acessorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orcamento_produtos_adicional"
            columns: ["adicional_id"]
            isOneToOne: false
            referencedRelation: "adicionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_orcamento_produtos_cor"
            columns: ["cor_id"]
            isOneToOne: false
            referencedRelation: "catalogo_cores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_produtos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          aprovado_por: string | null
          atendente_id: string | null
          campos_personalizados: Json | null
          canal_aquisicao_id: string | null
          classe: number | null
          cliente_bairro: string | null
          cliente_cep: string | null
          cliente_cidade: string | null
          cliente_cpf: string | null
          cliente_email: string | null
          cliente_estado: string | null
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string
          data_aprovacao: string | null
          desconto_adicional_percentual: number | null
          desconto_adicional_valor: number | null
          desconto_percentual: number | null
          forma_pagamento: string
          id: string
          justificativa_perda: string | null
          lead_id: string | null
          modalidade_instalacao: string | null
          motivo_analise: string | null
          motivo_perda: string | null
          observacoes_aprovacao: string | null
          publico_alvo: string | null
          requer_analise: boolean
          status: string
          tipo_desconto_adicional: string | null
          updated_at: string
          valor_frete: number
          valor_instalacao: number
          valor_pintura: number
          valor_produto: number
          valor_total: number
        }
        Insert: {
          aprovado_por?: string | null
          atendente_id?: string | null
          campos_personalizados?: Json | null
          canal_aquisicao_id?: string | null
          classe?: number | null
          cliente_bairro?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_estado?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string
          data_aprovacao?: string | null
          desconto_adicional_percentual?: number | null
          desconto_adicional_valor?: number | null
          desconto_percentual?: number | null
          forma_pagamento: string
          id?: string
          justificativa_perda?: string | null
          lead_id?: string | null
          modalidade_instalacao?: string | null
          motivo_analise?: string | null
          motivo_perda?: string | null
          observacoes_aprovacao?: string | null
          publico_alvo?: string | null
          requer_analise?: boolean
          status?: string
          tipo_desconto_adicional?: string | null
          updated_at?: string
          valor_frete?: number
          valor_instalacao?: number
          valor_pintura?: number
          valor_produto?: number
          valor_total?: number
        }
        Update: {
          aprovado_por?: string | null
          atendente_id?: string | null
          campos_personalizados?: Json | null
          canal_aquisicao_id?: string | null
          classe?: number | null
          cliente_bairro?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_estado?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string
          data_aprovacao?: string | null
          desconto_adicional_percentual?: number | null
          desconto_adicional_valor?: number | null
          desconto_percentual?: number | null
          forma_pagamento?: string
          id?: string
          justificativa_perda?: string | null
          lead_id?: string | null
          modalidade_instalacao?: string | null
          motivo_analise?: string | null
          motivo_perda?: string | null
          observacoes_aprovacao?: string | null
          publico_alvo?: string | null
          requer_analise?: boolean
          status?: string
          tipo_desconto_adicional?: string | null
          updated_at?: string
          valor_frete?: number
          valor_instalacao?: number
          valor_pintura?: number
          valor_produto?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_atendente_id_fkey"
            columns: ["atendente_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orcamentos_canal_aquisicao_id_fkey"
            columns: ["canal_aquisicao_id"]
            isOneToOne: false
            referencedRelation: "canais_aquisicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "elisaportas_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_instalacao: {
        Row: {
          created_at: string
          created_by: string | null
          data_agendada: string | null
          data_conclusao: string | null
          data_inicio: string | null
          endereco_instalacao: string | null
          equipe_instalacao: string | null
          id: string
          numero_ordem: string
          observacoes: string | null
          pedido_id: string
          produtos: Json | null
          responsavel_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_agendada?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          endereco_instalacao?: string | null
          equipe_instalacao?: string | null
          id?: string
          numero_ordem: string
          observacoes?: string | null
          pedido_id: string
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_agendada?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          endereco_instalacao?: string | null
          equipe_instalacao?: string | null
          id?: string
          numero_ordem?: string
          observacoes?: string | null
          pedido_id?: string
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_instalacao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_perfiladeira: {
        Row: {
          capturada_em: string | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          em_backlog: boolean | null
          historico: boolean
          id: string
          numero_ordem: string
          observacoes: string | null
          pedido_id: string
          perfis_produzidos: Json | null
          prioridade: number | null
          produtos: Json | null
          responsavel_id: string | null
          status: string
          tempo_conclusao_segundos: number | null
          updated_at: string
        }
        Insert: {
          capturada_em?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          numero_ordem: string
          observacoes?: string | null
          pedido_id: string
          perfis_produzidos?: Json | null
          prioridade?: number | null
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          updated_at?: string
        }
        Update: {
          capturada_em?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          numero_ordem?: string
          observacoes?: string | null
          pedido_id?: string
          perfis_produzidos?: Json | null
          prioridade?: number | null
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_perfiladeira_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_pintura: {
        Row: {
          capturada_em: string | null
          cor_principal: string | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          em_backlog: boolean | null
          historico: boolean
          id: string
          numero_ordem: string
          observacoes: string | null
          pedido_id: string
          prioridade: number | null
          produtos: Json | null
          responsavel_id: string | null
          status: string
          tempo_conclusao_segundos: number | null
          tipo_tinta: string | null
          updated_at: string
        }
        Insert: {
          capturada_em?: string | null
          cor_principal?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          numero_ordem: string
          observacoes?: string | null
          pedido_id: string
          prioridade?: number | null
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          tipo_tinta?: string | null
          updated_at?: string
        }
        Update: {
          capturada_em?: string | null
          cor_principal?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          numero_ordem?: string
          observacoes?: string | null
          pedido_id?: string
          prioridade?: number | null
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          tipo_tinta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_pintura_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_producao: {
        Row: {
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          id: string
          observacoes: string | null
          ordem_perfiladeira_concluida: boolean | null
          ordem_pintura_concluida: boolean | null
          ordem_separacao_concluida: boolean | null
          ordem_soldagem_concluida: boolean | null
          pedido_id: string
          responsavel_id: string | null
          status: string
          tipo_ordem: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          observacoes?: string | null
          ordem_perfiladeira_concluida?: boolean | null
          ordem_pintura_concluida?: boolean | null
          ordem_separacao_concluida?: boolean | null
          ordem_soldagem_concluida?: boolean | null
          pedido_id: string
          responsavel_id?: string | null
          status?: string
          tipo_ordem: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          observacoes?: string | null
          ordem_perfiladeira_concluida?: boolean | null
          ordem_pintura_concluida?: boolean | null
          ordem_separacao_concluida?: boolean | null
          ordem_soldagem_concluida?: boolean | null
          pedido_id?: string
          responsavel_id?: string | null
          status?: string
          tipo_ordem?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_qualidade: {
        Row: {
          capturada_em: string | null
          created_at: string | null
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          em_backlog: boolean | null
          historico: boolean
          id: string
          numero_ordem: string
          observacoes: string | null
          pedido_id: string
          prioridade: number | null
          responsavel_id: string | null
          status: string
          tempo_conclusao_segundos: number | null
          updated_at: string | null
        }
        Insert: {
          capturada_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          numero_ordem: string
          observacoes?: string | null
          pedido_id: string
          prioridade?: number | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          updated_at?: string | null
        }
        Update: {
          capturada_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          numero_ordem?: string
          observacoes?: string | null
          pedido_id?: string
          prioridade?: number | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_qualidade_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ordens_qualidade_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_qualidade_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ordens_separacao: {
        Row: {
          capturada_em: string | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          em_backlog: boolean | null
          historico: boolean
          id: string
          materiais_separados: Json | null
          numero_ordem: string
          observacoes: string | null
          pedido_id: string
          prioridade: number | null
          produtos: Json | null
          responsavel_id: string | null
          status: string
          tempo_conclusao_segundos: number | null
          updated_at: string
        }
        Insert: {
          capturada_em?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          materiais_separados?: Json | null
          numero_ordem: string
          observacoes?: string | null
          pedido_id: string
          prioridade?: number | null
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          updated_at?: string
        }
        Update: {
          capturada_em?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          materiais_separados?: Json | null
          numero_ordem?: string
          observacoes?: string | null
          pedido_id?: string
          prioridade?: number | null
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_separacao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_soldagem: {
        Row: {
          capturada_em: string | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          em_backlog: boolean | null
          historico: boolean
          id: string
          numero_ordem: string
          observacoes: string | null
          pedido_id: string
          prioridade: number | null
          produtos: Json | null
          responsavel_id: string | null
          status: string
          tempo_conclusao_segundos: number | null
          updated_at: string
        }
        Insert: {
          capturada_em?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          numero_ordem: string
          observacoes?: string | null
          pedido_id: string
          prioridade?: number | null
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          updated_at?: string
        }
        Update: {
          capturada_em?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          em_backlog?: boolean | null
          historico?: boolean
          id?: string
          numero_ordem?: string
          observacoes?: string | null
          pedido_id?: string
          prioridade?: number | null
          produtos?: Json | null
          responsavel_id?: string | null
          status?: string
          tempo_conclusao_segundos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_soldagem_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      organograma_connections: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          source_user_id: string
          target_user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          source_user_id: string
          target_user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          source_user_id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      organograma_positions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          position_x: number
          position_y: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          position_x: number
          position_y: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          position_x?: number
          position_y?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      parceiro_tag_assignments: {
        Row: {
          created_at: string
          id: string
          parceiro_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parceiro_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parceiro_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parceiro_tag_assignments_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "autorizados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parceiro_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "parceiro_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      parceiro_tags: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      pedido_linhas: {
        Row: {
          altura: number | null
          categoria_linha: string
          check_coleta: boolean | null
          check_qualidade: boolean | null
          check_separacao: boolean | null
          created_at: string | null
          descricao_produto: string | null
          estoque_id: string | null
          id: string
          largura: number | null
          nome_produto: string
          ordem: number
          pedido_id: string
          produto_venda_id: string | null
          quantidade: number
          tamanho: string | null
          tipo_ordem: string | null
          updated_at: string | null
        }
        Insert: {
          altura?: number | null
          categoria_linha?: string
          check_coleta?: boolean | null
          check_qualidade?: boolean | null
          check_separacao?: boolean | null
          created_at?: string | null
          descricao_produto?: string | null
          estoque_id?: string | null
          id?: string
          largura?: number | null
          nome_produto: string
          ordem?: number
          pedido_id: string
          produto_venda_id?: string | null
          quantidade?: number
          tamanho?: string | null
          tipo_ordem?: string | null
          updated_at?: string | null
        }
        Update: {
          altura?: number | null
          categoria_linha?: string
          check_coleta?: boolean | null
          check_qualidade?: boolean | null
          check_separacao?: boolean | null
          created_at?: string | null
          descricao_produto?: string | null
          estoque_id?: string | null
          id?: string
          largura?: number | null
          nome_produto?: string
          ordem?: number
          pedido_id?: string
          produto_venda_id?: string | null
          quantidade?: number
          tamanho?: string | null
          tipo_ordem?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_linhas_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_linhas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_linhas_produto_venda_id_fkey"
            columns: ["produto_venda_id"]
            isOneToOne: false
            referencedRelation: "produtos_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_porta_observacoes: {
        Row: {
          created_at: string
          id: string
          interna_externa: string
          opcao_guia: string
          opcao_rolo: string
          opcao_tubo: string
          pedido_id: string
          posicao_guia: string
          produto_venda_id: string
          responsavel_medidas_id: string | null
          retirada_porta: boolean
          tubo_tiras_frontais: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interna_externa?: string
          opcao_guia?: string
          opcao_rolo?: string
          opcao_tubo?: string
          pedido_id: string
          posicao_guia?: string
          produto_venda_id: string
          responsavel_medidas_id?: string | null
          retirada_porta?: boolean
          tubo_tiras_frontais?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interna_externa?: string
          opcao_guia?: string
          opcao_rolo?: string
          opcao_tubo?: string
          pedido_id?: string
          posicao_guia?: string
          produto_venda_id?: string
          responsavel_medidas_id?: string | null
          retirada_porta?: boolean
          tubo_tiras_frontais?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_porta_observacoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_porta_observacoes_produto_venda_id_fkey"
            columns: ["produto_venda_id"]
            isOneToOne: false
            referencedRelation: "produtos_vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_porta_observacoes_responsavel_medidas_id_fkey"
            columns: ["responsavel_medidas_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_etapas: {
        Row: {
          checkboxes: Json | null
          created_at: string | null
          data_entrada: string | null
          data_saida: string | null
          etapa: string
          id: string
          pedido_id: string
          updated_at: string | null
        }
        Insert: {
          checkboxes?: Json | null
          created_at?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          etapa: string
          id?: string
          pedido_id: string
          updated_at?: string | null
        }
        Update: {
          checkboxes?: Json | null
          created_at?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          etapa?: string
          id?: string
          pedido_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_etapas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_producao: {
        Row: {
          cliente_bairro: string | null
          cliente_cpf: string | null
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string
          created_by: string | null
          data_carregamento: string | null
          data_entrega: string | null
          em_backlog: boolean | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_estado: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          etapa_atual: string | null
          etapa_origem_backlog: string | null
          forma_pagamento: string | null
          id: string
          modalidade_instalacao: string | null
          motivo_backlog: string | null
          numero_parcelas: number | null
          numero_pedido: string
          observacoes: string | null
          observacoes_venda: string | null
          orcamento_id: string | null
          ordens_perfiladeira: Json | null
          ordens_pintura: Json | null
          ordens_separacao: Json | null
          ordens_soldagem: Json | null
          prioridade_etapa: number | null
          produtos: Json | null
          status: string
          status_ordens: Json | null
          status_preenchimento: string | null
          updated_at: string
          valor_entrada: number | null
          valor_frete: number | null
          valor_instalacao: number | null
          valor_venda: number | null
          venda_id: string | null
        }
        Insert: {
          cliente_bairro?: string | null
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string
          created_by?: string | null
          data_carregamento?: string | null
          data_entrega?: string | null
          em_backlog?: boolean | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          etapa_atual?: string | null
          etapa_origem_backlog?: string | null
          forma_pagamento?: string | null
          id?: string
          modalidade_instalacao?: string | null
          motivo_backlog?: string | null
          numero_parcelas?: number | null
          numero_pedido: string
          observacoes?: string | null
          observacoes_venda?: string | null
          orcamento_id?: string | null
          ordens_perfiladeira?: Json | null
          ordens_pintura?: Json | null
          ordens_separacao?: Json | null
          ordens_soldagem?: Json | null
          prioridade_etapa?: number | null
          produtos?: Json | null
          status?: string
          status_ordens?: Json | null
          status_preenchimento?: string | null
          updated_at?: string
          valor_entrada?: number | null
          valor_frete?: number | null
          valor_instalacao?: number | null
          valor_venda?: number | null
          venda_id?: string | null
        }
        Update: {
          cliente_bairro?: string | null
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string
          created_by?: string | null
          data_carregamento?: string | null
          data_entrega?: string | null
          em_backlog?: boolean | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          etapa_atual?: string | null
          etapa_origem_backlog?: string | null
          forma_pagamento?: string | null
          id?: string
          modalidade_instalacao?: string | null
          motivo_backlog?: string | null
          numero_parcelas?: number | null
          numero_pedido?: string
          observacoes?: string | null
          observacoes_venda?: string | null
          orcamento_id?: string | null
          ordens_perfiladeira?: Json | null
          ordens_pintura?: Json | null
          ordens_separacao?: Json | null
          ordens_soldagem?: Json | null
          prioridade_etapa?: number | null
          produtos?: Json | null
          status?: string
          status_ordens?: Json | null
          status_preenchimento?: string | null
          updated_at?: string
          valor_entrada?: number | null
          valor_frete?: number | null
          valor_instalacao?: number | null
          valor_venda?: number | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_producao_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      pintura_inicios: {
        Row: {
          created_at: string
          id: string
          iniciado_em: string
          iniciado_por: string
          observacoes: string | null
          recarga_realizada: boolean
          recarga_realizada_em: string | null
          recarga_realizada_por: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          iniciado_em?: string
          iniciado_por: string
          observacoes?: string | null
          recarga_realizada?: boolean
          recarga_realizada_em?: string | null
          recarga_realizada_por?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          iniciado_em?: string
          iniciado_por?: string
          observacoes?: string | null
          recarga_realizada?: boolean
          recarga_realizada_em?: string | null
          recarga_realizada_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pintura_inicios_recarga_realizada_por_fkey"
            columns: ["recarga_realizada_por"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_instalacao: {
        Row: {
          cidade: string
          created_at: string | null
          created_by: string | null
          dia_semana: number
          equipe_id: string
          id: string
          observacoes: string | null
          semana_inicio: string
          updated_at: string | null
        }
        Insert: {
          cidade: string
          created_at?: string | null
          created_by?: string | null
          dia_semana: number
          equipe_id: string
          id?: string
          observacoes?: string | null
          semana_inicio: string
          updated_at?: string | null
        }
        Update: {
          cidade?: string
          created_at?: string | null
          created_by?: string | null
          dia_semana?: number
          equipe_id?: string
          id?: string
          observacoes?: string | null
          semana_inicio?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pontos_instalacao_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_instalacao"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_vendas: {
        Row: {
          acessorio_id: string | null
          adicional_id: string | null
          altura: number | null
          cor_id: string | null
          created_at: string | null
          custo_pintura: number | null
          custo_producao: number | null
          custo_produto: number | null
          desconto_percentual: number | null
          desconto_valor: number | null
          descricao: string | null
          faturamento: boolean | null
          id: string
          largura: number | null
          lucro_item: number | null
          lucro_pintura: number | null
          lucro_produto: number | null
          margem_pintura: number | null
          margem_produto: number | null
          percentual_credito: number | null
          quantidade: number | null
          tamanho: string
          tipo_desconto: string | null
          tipo_pintura: string | null
          tipo_produto: string
          updated_at: string | null
          valor_credito: number | null
          valor_frete: number
          valor_instalacao: number
          valor_pintura: number
          valor_produto: number
          valor_total: number
          valor_total_sem_frete: number
          venda_id: string
          vendas_catalogo_id: string | null
        }
        Insert: {
          acessorio_id?: string | null
          adicional_id?: string | null
          altura?: number | null
          cor_id?: string | null
          created_at?: string | null
          custo_pintura?: number | null
          custo_producao?: number | null
          custo_produto?: number | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          descricao?: string | null
          faturamento?: boolean | null
          id?: string
          largura?: number | null
          lucro_item?: number | null
          lucro_pintura?: number | null
          lucro_produto?: number | null
          margem_pintura?: number | null
          margem_produto?: number | null
          percentual_credito?: number | null
          quantidade?: number | null
          tamanho: string
          tipo_desconto?: string | null
          tipo_pintura?: string | null
          tipo_produto?: string
          updated_at?: string | null
          valor_credito?: number | null
          valor_frete?: number
          valor_instalacao?: number
          valor_pintura?: number
          valor_produto?: number
          valor_total?: number
          valor_total_sem_frete?: number
          venda_id: string
          vendas_catalogo_id?: string | null
        }
        Update: {
          acessorio_id?: string | null
          adicional_id?: string | null
          altura?: number | null
          cor_id?: string | null
          created_at?: string | null
          custo_pintura?: number | null
          custo_producao?: number | null
          custo_produto?: number | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          descricao?: string | null
          faturamento?: boolean | null
          id?: string
          largura?: number | null
          lucro_item?: number | null
          lucro_pintura?: number | null
          lucro_produto?: number | null
          margem_pintura?: number | null
          margem_produto?: number | null
          percentual_credito?: number | null
          quantidade?: number | null
          tamanho?: string
          tipo_desconto?: string | null
          tipo_pintura?: string | null
          tipo_produto?: string
          updated_at?: string | null
          valor_credito?: number | null
          valor_frete?: number
          valor_instalacao?: number
          valor_pintura?: number
          valor_produto?: number
          valor_total?: number
          valor_total_sem_frete?: number
          venda_id?: string
          vendas_catalogo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portas_vendas_acessorio_id_fkey"
            columns: ["acessorio_id"]
            isOneToOne: false
            referencedRelation: "acessorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portas_vendas_adicional_id_fkey"
            columns: ["adicional_id"]
            isOneToOne: false
            referencedRelation: "adicionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portas_vendas_cor_id_fkey"
            columns: ["cor_id"]
            isOneToOne: false
            referencedRelation: "catalogo_cores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portas_vendas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_vendas_vendas_catalogo_id_fkey"
            columns: ["vendas_catalogo_id"]
            isOneToOne: false
            referencedRelation: "vendas_catalogo"
            referencedColumns: ["id"]
          },
        ]
      }
      requisicoes_compra: {
        Row: {
          aprovado_por: string | null
          created_at: string
          created_by: string | null
          data_aprovacao: string | null
          data_necessidade: string | null
          fornecedor_id: string | null
          id: string
          motivo_rejeicao: string | null
          numero_requisicao: string
          observacoes: string | null
          solicitante_id: string | null
          status: string
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          aprovado_por?: string | null
          created_at?: string
          created_by?: string | null
          data_aprovacao?: string | null
          data_necessidade?: string | null
          fornecedor_id?: string | null
          id?: string
          motivo_rejeicao?: string | null
          numero_requisicao: string
          observacoes?: string | null
          solicitante_id?: string | null
          status?: string
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          aprovado_por?: string | null
          created_at?: string
          created_by?: string | null
          data_aprovacao?: string | null
          data_necessidade?: string | null
          fornecedor_id?: string | null
          id?: string
          motivo_rejeicao?: string | null
          numero_requisicao?: string
          observacoes?: string | null
          solicitante_id?: string | null
          status?: string
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "requisicoes_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      requisicoes_compra_itens: {
        Row: {
          created_at: string
          id: string
          observacoes: string | null
          preco_total: number | null
          preco_unitario: number | null
          produto_id: string
          quantidade: number
          requisicao_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          observacoes?: string | null
          preco_total?: number | null
          preco_unitario?: number | null
          produto_id: string
          quantidade: number
          requisicao_id: string
        }
        Update: {
          created_at?: string
          id?: string
          observacoes?: string | null
          preco_total?: number | null
          preco_unitario?: number | null
          produto_id?: string
          quantidade?: number
          requisicao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisicoes_compra_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisicoes_compra_itens_requisicao_id_fkey"
            columns: ["requisicao_id"]
            isOneToOne: false
            referencedRelation: "requisicoes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      requisicoes_parceria: {
        Row: {
          cidade: string
          cpf_cnpj: string
          created_at: string
          descricao_motivo: string
          estado: string
          id: string
          nome_completo: string
          status: string
          telefone: string
          tipo_parceria: Database["public"]["Enums"]["tipo_parceria"]
          updated_at: string
        }
        Insert: {
          cidade: string
          cpf_cnpj: string
          created_at?: string
          descricao_motivo: string
          estado: string
          id?: string
          nome_completo: string
          status?: string
          telefone: string
          tipo_parceria: Database["public"]["Enums"]["tipo_parceria"]
          updated_at?: string
        }
        Update: {
          cidade?: string
          cpf_cnpj?: string
          created_at?: string
          descricao_motivo?: string
          estado?: string
          id?: string
          nome_completo?: string
          status?: string
          telefone?: string
          tipo_parceria?: Database["public"]["Enums"]["tipo_parceria"]
          updated_at?: string
        }
        Relationships: []
      }
      setores_lideres: {
        Row: {
          atribuido_por: string
          created_at: string
          id: string
          lider_id: string
          setor: string
          updated_at: string
        }
        Insert: {
          atribuido_por: string
          created_at?: string
          id?: string
          lider_id: string
          setor: string
          updated_at?: string
        }
        Update: {
          atribuido_por?: string
          created_at?: string
          id?: string
          lider_id?: string
          setor?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_roles: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          key: string
          label: string
          ordem: number
          setor: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          key: string
          label: string
          ordem?: number
          setor?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          key?: string
          label?: string
          ordem?: number
          setor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tabela_precos_portas: {
        Row: {
          altura: number
          ativo: boolean
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          largura: number
          updated_at: string
          valor_instalacao: number
          valor_pintura: number
          valor_porta: number
        }
        Insert: {
          altura: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          largura: number
          updated_at?: string
          valor_instalacao?: number
          valor_pintura?: number
          valor_porta?: number
        }
        Update: {
          altura?: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          largura?: number
          updated_at?: string
          valor_instalacao?: number
          valor_pintura?: number
          valor_porta?: number
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          created_at: string
          created_by: string
          descricao: string
          dia_recorrencia: number | null
          id: string
          recorrente: boolean
          responsavel_id: string
          setor: string | null
          status: Database["public"]["Enums"]["tarefa_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          descricao: string
          dia_recorrencia?: number | null
          id?: string
          recorrente?: boolean
          responsavel_id: string
          setor?: string | null
          status?: Database["public"]["Enums"]["tarefa_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          descricao?: string
          dia_recorrencia?: number | null
          id?: string
          recorrente?: boolean
          responsavel_id?: string
          setor?: string | null
          status?: Database["public"]["Enums"]["tarefa_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_route_access: {
        Row: {
          can_access: boolean | null
          created_at: string | null
          id: string
          route_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          route_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          route_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_route_access_route_key_fkey"
            columns: ["route_key"]
            isOneToOne: false
            referencedRelation: "app_routes"
            referencedColumns: ["key"]
          },
        ]
      }
      vagas: {
        Row: {
          cargo: Database["public"]["Enums"]["user_role"]
          created_at: string | null
          created_by: string | null
          id: string
          justificativa: string
          status: Database["public"]["Enums"]["status_vaga"]
          updated_at: string | null
        }
        Insert: {
          cargo: Database["public"]["Enums"]["user_role"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          justificativa: string
          status?: Database["public"]["Enums"]["status_vaga"]
          updated_at?: string | null
        }
        Update: {
          cargo?: Database["public"]["Enums"]["user_role"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          justificativa?: string
          status?: Database["public"]["Enums"]["status_vaga"]
          updated_at?: string | null
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: number
          ativo: boolean
          created_at: string
          created_by: string | null
          data_troca_oleo: string | null
          foto_url: string | null
          id: string
          km_atual: number
          modelo: string
          nome: string
          placa: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ano: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          data_troca_oleo?: string | null
          foto_url?: string | null
          id?: string
          km_atual?: number
          modelo: string
          nome: string
          placa?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ano?: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          data_troca_oleo?: string | null
          foto_url?: string | null
          id?: string
          km_atual?: number
          modelo?: string
          nome?: string
          placa?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      veiculos_conferencias: {
        Row: {
          agua_conferida: boolean
          conferido_por: string
          created_at: string
          data_troca_oleo: string | null
          foto_url: string
          id: string
          km_atual: number
          nivel_oleo_conferido: boolean
          observacoes: string | null
          status: string
          veiculo_id: string
        }
        Insert: {
          agua_conferida?: boolean
          conferido_por: string
          created_at?: string
          data_troca_oleo?: string | null
          foto_url: string
          id?: string
          km_atual: number
          nivel_oleo_conferido?: boolean
          observacoes?: string | null
          status: string
          veiculo_id: string
        }
        Update: {
          agua_conferida?: boolean
          conferido_por?: string
          created_at?: string
          data_troca_oleo?: string | null
          foto_url?: string
          id?: string
          km_atual?: number
          nivel_oleo_conferido?: boolean
          observacoes?: string | null
          status?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_conferencias_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          atendente_id: string
          bairro: string | null
          canal_aquisicao_id: string | null
          cep: string | null
          cidade: string | null
          cliente_email: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          cpf_cliente: string | null
          created_at: string
          custo_total: number | null
          data_prevista_entrega: string | null
          data_venda: string
          estado: string | null
          forma_pagamento: string | null
          frete_aprovado: boolean
          id: string
          lucro_total: number | null
          numero_parcelas: number | null
          observacoes_venda: string | null
          pagamento_na_entrega: boolean | null
          publico_alvo: string | null
          tipo_entrega: string | null
          updated_at: string
          valor_a_receber: number | null
          valor_entrada: number | null
          valor_frete: number | null
          valor_instalacao: number | null
          valor_venda: number | null
          venda_presencial: boolean
        }
        Insert: {
          atendente_id: string
          bairro?: string | null
          canal_aquisicao_id?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          cpf_cliente?: string | null
          created_at?: string
          custo_total?: number | null
          data_prevista_entrega?: string | null
          data_venda?: string
          estado?: string | null
          forma_pagamento?: string | null
          frete_aprovado?: boolean
          id?: string
          lucro_total?: number | null
          numero_parcelas?: number | null
          observacoes_venda?: string | null
          pagamento_na_entrega?: boolean | null
          publico_alvo?: string | null
          tipo_entrega?: string | null
          updated_at?: string
          valor_a_receber?: number | null
          valor_entrada?: number | null
          valor_frete?: number | null
          valor_instalacao?: number | null
          valor_venda?: number | null
          venda_presencial?: boolean
        }
        Update: {
          atendente_id?: string
          bairro?: string | null
          canal_aquisicao_id?: string | null
          cep?: string | null
          cidade?: string | null
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          cpf_cliente?: string | null
          created_at?: string
          custo_total?: number | null
          data_prevista_entrega?: string | null
          data_venda?: string
          estado?: string | null
          forma_pagamento?: string | null
          frete_aprovado?: boolean
          id?: string
          lucro_total?: number | null
          numero_parcelas?: number | null
          observacoes_venda?: string | null
          pagamento_na_entrega?: boolean | null
          publico_alvo?: string | null
          tipo_entrega?: string | null
          updated_at?: string
          valor_a_receber?: number | null
          valor_entrada?: number | null
          valor_frete?: number | null
          valor_instalacao?: number | null
          valor_venda?: number | null
          venda_presencial?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_vendas_atendente"
            columns: ["atendente_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vendas_canal_aquisicao_id_fkey"
            columns: ["canal_aquisicao_id"]
            isOneToOne: false
            referencedRelation: "canais_aquisicao"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_autorizacoes_desconto: {
        Row: {
          autorizado_por: string
          created_at: string
          id: string
          observacoes: string | null
          percentual_desconto: number
          senha_usada: string
          solicitado_por: string
          tipo_autorizacao: Database["public"]["Enums"]["tipo_autorizacao_desconto"]
          venda_id: string
        }
        Insert: {
          autorizado_por: string
          created_at?: string
          id?: string
          observacoes?: string | null
          percentual_desconto: number
          senha_usada: string
          solicitado_por: string
          tipo_autorizacao: Database["public"]["Enums"]["tipo_autorizacao_desconto"]
          venda_id: string
        }
        Update: {
          autorizado_por?: string
          created_at?: string
          id?: string
          observacoes?: string | null
          percentual_desconto?: number
          senha_usada?: string
          solicitado_por?: string
          tipo_autorizacao?: Database["public"]["Enums"]["tipo_autorizacao_desconto"]
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_autorizacoes_desconto_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vendas_autorizacoes_desconto_solicitado_por_fkey"
            columns: ["solicitado_por"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vendas_autorizacoes_desconto_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_catalogo: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          custo_produto: number | null
          descricao_produto: string | null
          destaque: boolean | null
          estoque_minimo: number | null
          id: string
          imagem_url: string | null
          nome_produto: string
          peso: number | null
          preco_venda: number
          quantidade: number
          subcategoria_id: string | null
          tags: string[] | null
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_produto?: number | null
          descricao_produto?: string | null
          destaque?: boolean | null
          estoque_minimo?: number | null
          id?: string
          imagem_url?: string | null
          nome_produto: string
          peso?: number | null
          preco_venda?: number
          quantidade?: number
          subcategoria_id?: string | null
          tags?: string[] | null
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          custo_produto?: number | null
          descricao_produto?: string | null
          destaque?: boolean | null
          estoque_minimo?: number | null
          id?: string
          imagem_url?: string | null
          nome_produto?: string
          peso?: number | null
          preco_venda?: number
          quantidade?: number
          subcategoria_id?: string | null
          tags?: string[] | null
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_catalogo_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vendas_catalogo_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "estoque_subcategorias"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas_tecnicas: {
        Row: {
          created_at: string
          created_by: string
          data_visita: string
          id: string
          lead_id: string
          observacoes: string | null
          responsavel_id: string
          status: Database["public"]["Enums"]["status_visita"]
          turno: Database["public"]["Enums"]["turno_visita"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data_visita: string
          id?: string
          lead_id: string
          observacoes?: string | null
          responsavel_id: string
          status?: Database["public"]["Enums"]["status_visita"]
          turno: Database["public"]["Enums"]["turno_visita"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data_visita?: string
          id?: string
          lead_id?: string
          observacoes?: string | null
          responsavel_id?: string
          status?: Database["public"]["Enums"]["status_visita"]
          turno?: Database["public"]["Enums"]["turno_visita"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitas_tecnicas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "elisaportas_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contador: {
        Row: {
          id: string
          ultimo_indice: number
          updated_at: string
        }
        Insert: {
          id?: string
          ultimo_indice?: number
          updated_at?: string
        }
        Update: {
          id?: string
          ultimo_indice?: number
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_distribuicao: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          numero_telefone: string
          ordem: number
          total_cliques: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          numero_telefone: string
          ordem: number
          total_cliques?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          numero_telefone?: string
          ordem?: number
          total_cliques?: number
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_distribuicao_controle: {
        Row: {
          created_at: string | null
          id: string
          ultima_atendente_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ultima_atendente_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ultima_atendente_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_roulette_clicks: {
        Row: {
          atendente_id: string | null
          atendente_nome: string
          atendente_telefone: string | null
          created_at: string
          fbclid: string | null
          gclid: string | null
          id: string
          page_url: string | null
          referrer: string | null
          source: string | null
          traffic_channel: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          atendente_id?: string | null
          atendente_nome: string
          atendente_telefone?: string | null
          created_at?: string
          fbclid?: string | null
          gclid?: string | null
          id?: string
          page_url?: string | null
          referrer?: string | null
          source?: string | null
          traffic_channel?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          atendente_id?: string | null
          atendente_nome?: string
          atendente_telefone?: string | null
          created_at?: string
          fbclid?: string | null
          gclid?: string | null
          id?: string
          page_url?: string | null
          referrer?: string | null
          source?: string | null
          traffic_channel?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_roulette_clicks_atendente_id_fkey"
            columns: ["atendente_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_database_storage: {
        Args: never
        Returns: {
          size_bytes: number
          size_pretty: string
          table_name: string
        }[]
      }
      aprovar_orcamento:
        | {
            Args: {
              desconto_adicional?: number
              observacoes?: string
              orcamento_uuid: string
            }
            Returns: boolean
          }
        | {
            Args: {
              desconto_adicional?: number
              observacoes?: string
              orcamento_uuid: string
              tipo_desconto?: string
            }
            Returns: boolean
          }
      calcular_classe_orcamento: {
        Args: { valor_total: number }
        Returns: number
      }
      calcular_valor_produto_orcamento: {
        Args: { orcamento_uuid: string }
        Returns: number
      }
      concluir_entrega_e_avancar_pedido: {
        Args: { p_entrega_id: string }
        Returns: Json
      }
      concluir_instalacao_e_avancar_pedido: {
        Args: { p_instalacao_id: string }
        Returns: Json
      }
      count_base64_images: {
        Args: never
        Returns: {
          base64_count: number
          table_name: string
        }[]
      }
      criar_ordem_pintura: { Args: { p_pedido_id: string }; Returns: undefined }
      criar_ordem_qualidade: {
        Args: { p_pedido_id: string }
        Returns: undefined
      }
      criar_ordens_producao_automaticas:
        | {
            Args: { p_pedido_id: string; p_pedido_numero: string }
            Returns: undefined
          }
        | { Args: { p_pedido_id: string }; Returns: undefined }
      criar_requisicao_venda: {
        Args: { orcamento_uuid: string }
        Returns: string
      }
      gerar_numero_ordem:
        | { Args: { tipo_ordem: string }; Returns: string }
        | {
            Args: { pedido_numero: string; tipo_ordem: string }
            Returns: string
          }
      gerar_numero_requisicao: { Args: never; Returns: string }
      gerar_proximo_numero: {
        Args: { tipo_documento: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_route_access: {
        Args: { _route_key: string; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_factory_operator: { Args: { _user_id: string }; Returns: boolean }
      is_lead_attendant: { Args: { lead_uuid: string }; Returns: boolean }
      map_etapa_to_instalacao_status: {
        Args: { etapa: string }
        Returns: string
      }
      obter_proximo_whatsapp: {
        Args: never
        Returns: {
          nome: string
          numero_telefone: string
        }[]
      }
      perform_database_vacuum: { Args: never; Returns: string }
      pode_marcar_linhas_ordem: {
        Args: { p_ordem_id: string; p_tipo_ordem: string }
        Returns: boolean
      }
      resetar_pedido_para_aberto: {
        Args: { p_pedido_id: string }
        Returns: undefined
      }
      retroceder_pedido_para_etapa: {
        Args: {
          p_etapa_destino: string
          p_motivo_backlog: string
          p_pedido_id: string
        }
        Returns: undefined
      }
      verificar_ordem_pintura_concluida: {
        Args: { p_pedido_id: string }
        Returns: boolean
      }
      verificar_ordem_qualidade_concluida: {
        Args: { p_pedido_id: string }
        Returns: boolean
      }
      verificar_ordens_pedido_concluidas: {
        Args: { p_pedido_id: string }
        Returns: boolean
      }
    }
    Enums: {
      autorizado_etapa: "ativo" | "premium" | "perdido"
      autorizado_rating_categoria: "instalacao" | "suporte" | "atendimento"
      documento_categoria:
        | "manual"
        | "procedimento"
        | "formulario"
        | "contrato"
        | "politica"
        | "outros"
      franqueado_etapa: "inicial" | "avaliacao" | "aprovacao" | "ativo"
      lead_status:
        | "aguardando_atendimento"
        | "em_andamento"
        | "perdido"
        | "aguardando_aprovacao_venda"
        | "venda_reprovada"
        | "venda_aprovada"
      motivo_perda:
        | "desqualificado"
        | "perdido_por_preco"
        | "perdido_por_prazo"
        | "outro"
      motivo_perda_orcamento:
        | "preco"
        | "prazo"
        | "qualidade"
        | "logistica"
        | "atendimento"
        | "produto"
      representante_etapa:
        | "inicial"
        | "qualificacao"
        | "proposta"
        | "contratado"
      setor_producao: "perfiladeira" | "soldagem" | "separacao" | "pintura"
      setor_type:
        | "vendas"
        | "marketing"
        | "instalacoes"
        | "fabrica"
        | "administrativo"
      status_vaga: "em_analise" | "aberta" | "fechada" | "preenchida"
      status_visita: "agendada" | "concluida" | "cancelada"
      tarefa_status: "em_andamento" | "concluida"
      tipo_autorizacao_desconto: "responsavel_setor" | "master"
      tipo_instalacao_enum: "elisa" | "autorizados"
      tipo_parceiro: "autorizado" | "representante" | "franqueado"
      tipo_parceria: "autorizado" | "representante" | "licenciado"
      turno_visita: "manha" | "tarde" | "noite"
      user_role:
        | "administrador"
        | "atendente"
        | "gerente_comercial"
        | "gerente_fabril"
        | "diretor"
        | "gerente_marketing"
        | "gerente_financeiro"
        | "gerente_producao"
        | "gerente_instalacoes"
        | "instalador"
        | "aux_instalador"
        | "analista_marketing"
        | "assistente_marketing"
        | "coordenador_vendas"
        | "vendedor"
        | "assistente_administrativo"
        | "soldador"
        | "aux_geral"
        | "pintor"
        | "aux_pintura"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      autorizado_etapa: ["ativo", "premium", "perdido"],
      autorizado_rating_categoria: ["instalacao", "suporte", "atendimento"],
      documento_categoria: [
        "manual",
        "procedimento",
        "formulario",
        "contrato",
        "politica",
        "outros",
      ],
      franqueado_etapa: ["inicial", "avaliacao", "aprovacao", "ativo"],
      lead_status: [
        "aguardando_atendimento",
        "em_andamento",
        "perdido",
        "aguardando_aprovacao_venda",
        "venda_reprovada",
        "venda_aprovada",
      ],
      motivo_perda: [
        "desqualificado",
        "perdido_por_preco",
        "perdido_por_prazo",
        "outro",
      ],
      motivo_perda_orcamento: [
        "preco",
        "prazo",
        "qualidade",
        "logistica",
        "atendimento",
        "produto",
      ],
      representante_etapa: [
        "inicial",
        "qualificacao",
        "proposta",
        "contratado",
      ],
      setor_producao: ["perfiladeira", "soldagem", "separacao", "pintura"],
      setor_type: [
        "vendas",
        "marketing",
        "instalacoes",
        "fabrica",
        "administrativo",
      ],
      status_vaga: ["em_analise", "aberta", "fechada", "preenchida"],
      status_visita: ["agendada", "concluida", "cancelada"],
      tarefa_status: ["em_andamento", "concluida"],
      tipo_autorizacao_desconto: ["responsavel_setor", "master"],
      tipo_instalacao_enum: ["elisa", "autorizados"],
      tipo_parceiro: ["autorizado", "representante", "franqueado"],
      tipo_parceria: ["autorizado", "representante", "licenciado"],
      turno_visita: ["manha", "tarde", "noite"],
      user_role: [
        "administrador",
        "atendente",
        "gerente_comercial",
        "gerente_fabril",
        "diretor",
        "gerente_marketing",
        "gerente_financeiro",
        "gerente_producao",
        "gerente_instalacoes",
        "instalador",
        "aux_instalador",
        "analista_marketing",
        "assistente_marketing",
        "coordenador_vendas",
        "vendedor",
        "assistente_administrativo",
        "soldador",
        "aux_geral",
        "pintor",
        "aux_pintura",
      ],
    },
  },
} as const
