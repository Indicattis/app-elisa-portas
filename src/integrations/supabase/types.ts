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
      elisaportas_leads: {
        Row: {
          altura_porta: string | null
          atendente_id: string | null
          canal_aquisicao: string
          cidade: string | null
          cor_porta: string | null
          created_at: string
          data_conclusao_atendimento: string | null
          data_envio: string
          data_inicio_atendimento: string | null
          data_prevista_entrega: string | null
          email: string | null
          funcao_lead: string | null
          id: string
          largura_porta: string | null
          mensagem: string | null
          nome: string
          observacoes: string | null
          status_atendimento: number
          telefone: string
          tipo_porta: string | null
          updated_at: string
          valor_orcamento: number | null
        }
        Insert: {
          altura_porta?: string | null
          atendente_id?: string | null
          canal_aquisicao?: string
          cidade?: string | null
          cor_porta?: string | null
          created_at?: string
          data_conclusao_atendimento?: string | null
          data_envio?: string
          data_inicio_atendimento?: string | null
          data_prevista_entrega?: string | null
          email?: string | null
          funcao_lead?: string | null
          id?: string
          largura_porta?: string | null
          mensagem?: string | null
          nome: string
          observacoes?: string | null
          status_atendimento?: number
          telefone: string
          tipo_porta?: string | null
          updated_at?: string
          valor_orcamento?: number | null
        }
        Update: {
          altura_porta?: string | null
          atendente_id?: string | null
          canal_aquisicao?: string
          cidade?: string | null
          cor_porta?: string | null
          created_at?: string
          data_conclusao_atendimento?: string | null
          data_envio?: string
          data_inicio_atendimento?: string | null
          data_prevista_entrega?: string | null
          email?: string | null
          funcao_lead?: string | null
          id?: string
          largura_porta?: string | null
          mensagem?: string | null
          nome?: string
          observacoes?: string | null
          status_atendimento?: number
          telefone?: string
          tipo_porta?: string | null
          updated_at?: string
          valor_orcamento?: number | null
        }
        Relationships: []
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
      orcamentos: {
        Row: {
          campos_personalizados: Json | null
          created_at: string
          desconto_percentual: number | null
          documento_url: string | null
          forma_pagamento: string
          id: string
          lead_id: string
          updated_at: string
          usuario_id: string
          valor_frete: number
          valor_instalacao: number
          valor_pintura: number
          valor_produto: number
          valor_total: number
        }
        Insert: {
          campos_personalizados?: Json | null
          created_at?: string
          desconto_percentual?: number | null
          documento_url?: string | null
          forma_pagamento: string
          id?: string
          lead_id: string
          updated_at?: string
          usuario_id: string
          valor_frete?: number
          valor_instalacao?: number
          valor_pintura?: number
          valor_produto: number
          valor_total: number
        }
        Update: {
          campos_personalizados?: Json | null
          created_at?: string
          desconto_percentual?: number | null
          documento_url?: string | null
          forma_pagamento?: string
          id?: string
          lead_id?: string
          updated_at?: string
          usuario_id?: string
          valor_frete?: number
          valor_instalacao?: number
          valor_pintura?: number
          valor_produto?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "elisaportas_leads"
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
          lead_id: string
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
          lead_id: string
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
          lead_id?: string
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
          {
            foreignKeyName: "requisicoes_venda_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          atendente_id: string
          canal_aquisicao: string
          created_at: string
          data_venda: string
          forma_pagamento: string | null
          id: string
          lead_id: string
          observacoes_venda: string | null
          updated_at: string
          valor_venda: number
        }
        Insert: {
          atendente_id: string
          canal_aquisicao?: string
          created_at?: string
          data_venda?: string
          forma_pagamento?: string | null
          id?: string
          lead_id: string
          observacoes_venda?: string | null
          updated_at?: string
          valor_venda: number
        }
        Update: {
          atendente_id?: string
          canal_aquisicao?: string
          created_at?: string
          data_venda?: string
          forma_pagamento?: string | null
          id?: string
          lead_id?: string
          observacoes_venda?: string | null
          updated_at?: string
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_lead_id_fkey"
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
      cancel_lead_attendance: {
        Args: { lead_uuid: string }
        Returns: boolean
      }
      criar_requisicao_venda: {
        Args: { lead_uuid: string; orcamento_uuid?: string }
        Returns: string
      }
      finalizar_venda: {
        Args: {
          lead_uuid: string
          valor_venda: number
          forma_pagamento?: string
          observacoes_venda?: string
        }
        Returns: boolean
      }
      iniciar_atendimento: {
        Args: { lead_uuid: string }
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
      pause_lead_attendance: {
        Args: { lead_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "administrador" | "atendente" | "gerente_comercial"
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
      user_role: ["administrador", "atendente", "gerente_comercial"],
    },
  },
} as const
