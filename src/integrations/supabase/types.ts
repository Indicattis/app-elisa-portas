export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          created_at: string
          email: string
          foto_perfil_url: string | null
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          foto_perfil_url?: string | null
          id?: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          foto_perfil_url?: string | null
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      autorizados: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          logo_url: string | null
          nome: string
          regiao: string | null
          responsavel: string | null
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          regiao?: string | null
          responsavel?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          regiao?: string | null
          responsavel?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
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
          created_at: string
          created_by: string
          data: string
          id: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          created_by: string
          data: string
          id?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: string
          id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
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
            foreignKeyName: "orcamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "elisaportas_leads"
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
      pedidos_producao: {
        Row: {
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string
          created_by: string | null
          data_entrega: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_estado: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          id: string
          numero_pedido: string
          observacoes: string | null
          produto_altura: string
          produto_cor: string
          produto_largura: string
          produto_tipo: string
          status: string
          updated_at: string
          venda_id: string | null
        }
        Insert: {
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          id?: string
          numero_pedido: string
          observacoes?: string | null
          produto_altura: string
          produto_cor: string
          produto_largura: string
          produto_tipo: string
          status?: string
          updated_at?: string
          venda_id?: string | null
        }
        Update: {
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          id?: string
          numero_pedido?: string
          observacoes?: string | null
          produto_altura?: string
          produto_cor?: string
          produto_largura?: string
          produto_tipo?: string
          status?: string
          updated_at?: string
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
      requisicoes_venda: {
        Row: {
          created_at: string
          custo_frete: number | null
          custo_instalacao: number | null
          custo_material: number | null
          custo_pintura: number | null
          data_aprovacao: string | null
          gerente_id: string | null
          id: string
          lead_id: string | null
          observacoes: string | null
          orcamento_id: string | null
          solicitante_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_frete?: number | null
          custo_instalacao?: number | null
          custo_material?: number | null
          custo_pintura?: number | null
          data_aprovacao?: string | null
          gerente_id?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          orcamento_id?: string | null
          solicitante_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_frete?: number | null
          custo_instalacao?: number | null
          custo_material?: number | null
          custo_pintura?: number | null
          data_aprovacao?: string | null
          gerente_id?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          orcamento_id?: string | null
          solicitante_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisicoes_venda_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "elisaportas_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["user_role"]
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
          created_at: string
          custo_pintura: number | null
          custo_produto: number | null
          data_venda: string
          estado: string | null
          forma_pagamento: string | null
          id: string
          lucro_total: number | null
          numero_parcelas: number | null
          observacoes_venda: string | null
          publico_alvo: string | null
          resgate: boolean | null
          updated_at: string
          valor_entrada: number | null
          valor_frete: number | null
          valor_instalacao: number | null
          valor_pintura: number | null
          valor_produto: number | null
          valor_venda: number | null
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
          created_at?: string
          custo_pintura?: number | null
          custo_produto?: number | null
          data_venda?: string
          estado?: string | null
          forma_pagamento?: string | null
          id?: string
          lucro_total?: number | null
          numero_parcelas?: number | null
          observacoes_venda?: string | null
          publico_alvo?: string | null
          resgate?: boolean | null
          updated_at?: string
          valor_entrada?: number | null
          valor_frete?: number | null
          valor_instalacao?: number | null
          valor_pintura?: number | null
          valor_produto?: number | null
          valor_venda?: number | null
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
          created_at?: string
          custo_pintura?: number | null
          custo_produto?: number | null
          data_venda?: string
          estado?: string | null
          forma_pagamento?: string | null
          id?: string
          lucro_total?: number | null
          numero_parcelas?: number | null
          observacoes_venda?: string | null
          publico_alvo?: string | null
          resgate?: boolean | null
          updated_at?: string
          valor_entrada?: number | null
          valor_frete?: number | null
          valor_instalacao?: number | null
          valor_pintura?: number | null
          valor_produto?: number | null
          valor_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_canal_aquisicao_id_fkey"
            columns: ["canal_aquisicao_id"]
            isOneToOne: false
            referencedRelation: "canais_aquisicao"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aprovar_orcamento: {
        Args:
          | {
              orcamento_uuid: string
              desconto_adicional?: number
              observacoes?: string
            }
          | {
              orcamento_uuid: string
              desconto_adicional?: number
              tipo_desconto?: string
              observacoes?: string
            }
        Returns: boolean
      }
      calcular_classe_orcamento: {
        Args: { valor_total: number }
        Returns: number
      }
      criar_requisicao_venda: {
        Args: { lead_uuid?: string; orcamento_uuid?: string }
        Returns: string
      }
      has_permission: {
        Args: {
          _user_id: string
          _permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_lead_attendant: {
        Args: { lead_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "dashboard"
        | "leads"
        | "orcamentos"
        | "vendas"
        | "producao"
        | "calendario"
        | "marketing"
        | "faturamento"
        | "contas_receber"
        | "visitas"
        | "organograma"
        | "users"
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
      status_visita: "agendada" | "concluida" | "cancelada"
      turno_visita: "manha" | "tarde" | "noite"
      user_role:
        | "administrador"
        | "atendente"
        | "gerente_comercial"
        | "gerente_fabril"
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
      app_permission: [
        "dashboard",
        "leads",
        "orcamentos",
        "vendas",
        "producao",
        "calendario",
        "marketing",
        "faturamento",
        "contas_receber",
        "visitas",
        "organograma",
        "users",
      ],
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
      status_visita: ["agendada", "concluida", "cancelada"],
      turno_visita: ["manha", "tarde", "noite"],
      user_role: [
        "administrador",
        "atendente",
        "gerente_comercial",
        "gerente_fabril",
      ],
    },
  },
} as const
