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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      agente_conversas: {
        Row: {
          atualizado_em: string
          cliente_id: string
          consultor_id: string
          criado_em: string
          id: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          consultor_id: string
          criado_em?: string
          id?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          consultor_id?: string
          criado_em?: string
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "agente_conversas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_gestao"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_mensagens: {
        Row: {
          conteudo: string
          conversa_id: string
          criado_em: string
          id: string
          ordem: number
          papel: string
        }
        Insert: {
          conteudo: string
          conversa_id: string
          criado_em?: string
          id?: string
          ordem?: number
          papel: string
        }
        Update: {
          conteudo?: string
          conversa_id?: string
          criado_em?: string
          id?: string
          ordem?: number
          papel?: string
        }
        Relationships: [
          {
            foreignKeyName: "agente_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "agente_conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_gestao: {
        Row: {
          atualizado_em: string
          consultor_id: string
          cpf: string
          criado_em: string
          email: string | null
          id: string
          mcp_cliente_cifrado: string | null
          nome: string
          observacoes: string | null
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          consultor_id: string
          cpf: string
          criado_em?: string
          email?: string | null
          id?: string
          mcp_cliente_cifrado?: string | null
          nome: string
          observacoes?: string | null
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          consultor_id?: string
          cpf?: string
          criado_em?: string
          email?: string | null
          id?: string
          mcp_cliente_cifrado?: string | null
          nome?: string
          observacoes?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      consultor_ai_config: {
        Row: {
          api_key_cifrada: string | null
          atualizado_em: string
          criado_em: string
          id: string
          mcp_token_cifrado: string | null
          mcp_url: string | null
          modelo: string | null
          provedor: string
          user_id: string
        }
        Insert: {
          api_key_cifrada?: string | null
          atualizado_em?: string
          criado_em?: string
          id?: string
          mcp_token_cifrado?: string | null
          mcp_url?: string | null
          modelo?: string | null
          provedor?: string
          user_id: string
        }
        Update: {
          api_key_cifrada?: string | null
          atualizado_em?: string
          criado_em?: string
          id?: string
          mcp_token_cifrado?: string | null
          mcp_url?: string | null
          modelo?: string | null
          provedor?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_etapas: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cor: string
          criado_em: string
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cor?: string
          criado_em?: string
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cor?: string
          criado_em?: string
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: []
      }
      diagnostico_sessoes: {
        Row: {
          aberto_em: string
          atualizado_em: string
          concluido_em: string | null
          criado_em: string
          dados_em: string | null
          diagnostico_id: string
          id: string
          iniciado_em: string | null
          origem: string | null
          resposta_id: string | null
          sessao_key: string
          utm: Json | null
        }
        Insert: {
          aberto_em?: string
          atualizado_em?: string
          concluido_em?: string | null
          criado_em?: string
          dados_em?: string | null
          diagnostico_id: string
          id?: string
          iniciado_em?: string | null
          origem?: string | null
          resposta_id?: string | null
          sessao_key: string
          utm?: Json | null
        }
        Update: {
          aberto_em?: string
          atualizado_em?: string
          concluido_em?: string | null
          criado_em?: string
          dados_em?: string | null
          diagnostico_id?: string
          id?: string
          iniciado_em?: string | null
          origem?: string | null
          resposta_id?: string | null
          sessao_key?: string
          utm?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_sessoes_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostico_sessoes_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "respostas_diagnostico"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos: {
        Row: {
          atualizado_em: string
          capa_itens: string | null
          criado_em: string
          criado_por: string
          descricao: string | null
          id: string
          link_agendamento: string | null
          publico: string
          slug: string
          status: Database["public"]["Enums"]["diagnostico_status"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          capa_itens?: string | null
          criado_em?: string
          criado_por: string
          descricao?: string | null
          id?: string
          link_agendamento?: string | null
          publico?: string
          slug: string
          status?: Database["public"]["Enums"]["diagnostico_status"]
          titulo: string
        }
        Update: {
          atualizado_em?: string
          capa_itens?: string | null
          criado_em?: string
          criado_por?: string
          descricao?: string | null
          id?: string
          link_agendamento?: string | null
          publico?: string
          slug?: string
          status?: Database["public"]["Enums"]["diagnostico_status"]
          titulo?: string
        }
        Relationships: []
      }
      dimensoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          descricao: string | null
          diagnostico_id: string
          id: string
          ordem: number
          peso_dimensao: number
          ramo: Database["public"]["Enums"]["ramo_diagnostico"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          diagnostico_id: string
          id?: string
          ordem?: number
          peso_dimensao?: number
          ramo?: Database["public"]["Enums"]["ramo_diagnostico"]
          titulo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          diagnostico_id?: string
          id?: string
          ordem?: number
          peso_dimensao?: number
          ramo?: Database["public"]["Enums"]["ramo_diagnostico"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "dimensoes_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      lead_anexos: {
        Row: {
          anotacao_id: string
          autor_id: string | null
          criado_em: string
          id: string
          mime: string | null
          nome: string
          path: string
          resposta_id: string
          tamanho: number
        }
        Insert: {
          anotacao_id: string
          autor_id?: string | null
          criado_em?: string
          id?: string
          mime?: string | null
          nome: string
          path: string
          resposta_id: string
          tamanho?: number
        }
        Update: {
          anotacao_id?: string
          autor_id?: string | null
          criado_em?: string
          id?: string
          mime?: string | null
          nome?: string
          path?: string
          resposta_id?: string
          tamanho?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_anexos_anotacao_id_fkey"
            columns: ["anotacao_id"]
            isOneToOne: false
            referencedRelation: "lead_anotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_anexos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_anexos_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "respostas_diagnostico"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_anotacoes: {
        Row: {
          autor_id: string | null
          criado_em: string
          id: string
          origem: string
          resposta_id: string
          texto: string
        }
        Insert: {
          autor_id?: string | null
          criado_em?: string
          id?: string
          origem?: string
          resposta_id: string
          texto: string
        }
        Update: {
          autor_id?: string | null
          criado_em?: string
          id?: string
          origem?: string
          resposta_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_anotacoes_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_anotacoes_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "respostas_diagnostico"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_eventos: {
        Row: {
          autor_id: string | null
          criado_em: string
          de: string | null
          id: string
          para: string | null
          resposta_id: string
          tipo: string
        }
        Insert: {
          autor_id?: string | null
          criado_em?: string
          de?: string | null
          id?: string
          para?: string | null
          resposta_id: string
          tipo: string
        }
        Update: {
          autor_id?: string | null
          criado_em?: string
          de?: string | null
          id?: string
          para?: string | null
          resposta_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_eventos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_eventos_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "respostas_diagnostico"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_perda: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: []
      }
      opcoes_resposta: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          letra: string | null
          ordem: number
          pergunta_id: string
          peso: number
          ramo: Database["public"]["Enums"]["ramo_diagnostico"] | null
          rotulo: string | null
          rotulo_descricao: string | null
          texto: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          letra?: string | null
          ordem?: number
          pergunta_id: string
          peso?: number
          ramo?: Database["public"]["Enums"]["ramo_diagnostico"] | null
          rotulo?: string | null
          rotulo_descricao?: string | null
          texto: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          letra?: string | null
          ordem?: number
          pergunta_id?: string
          peso?: number
          ramo?: Database["public"]["Enums"]["ramo_diagnostico"] | null
          rotulo?: string | null
          rotulo_descricao?: string | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "opcoes_resposta_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "perguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      origens: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: []
      }
      perfis_resultado: {
        Row: {
          atualizado_em: string
          conteudo: Json | null
          cor: string
          criado_em: string
          cta_texto: string | null
          cta_url: string | null
          descricao: string | null
          diagnostico_id: string
          dimensao_id: string | null
          faixa_max: number
          faixa_min: number
          id: string
          min_regras: number
          modo_ativacao: string
          ordem: number
          ramo: Database["public"]["Enums"]["ramo_diagnostico"]
          regras: Json
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          conteudo?: Json | null
          cor?: string
          criado_em?: string
          cta_texto?: string | null
          cta_url?: string | null
          descricao?: string | null
          diagnostico_id: string
          dimensao_id?: string | null
          faixa_max?: number
          faixa_min?: number
          id?: string
          min_regras?: number
          modo_ativacao?: string
          ordem?: number
          ramo?: Database["public"]["Enums"]["ramo_diagnostico"]
          regras?: Json
          titulo: string
        }
        Update: {
          atualizado_em?: string
          conteudo?: Json | null
          cor?: string
          criado_em?: string
          cta_texto?: string | null
          cta_url?: string | null
          descricao?: string | null
          diagnostico_id?: string
          dimensao_id?: string | null
          faixa_max?: number
          faixa_min?: number
          id?: string
          min_regras?: number
          modo_ativacao?: string
          ordem?: number
          ramo?: Database["public"]["Enums"]["ramo_diagnostico"]
          regras?: Json
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_resultado_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_resultado_dimensao_id_fkey"
            columns: ["dimensao_id"]
            isOneToOne: false
            referencedRelation: "dimensoes"
            referencedColumns: ["id"]
          },
        ]
      }
      perguntas: {
        Row: {
          atualizado_em: string
          criado_em: string
          dimensao_id: string
          id: string
          obrigatoria: boolean
          ordem: number
          peso_pergunta: number
          ramifica: boolean
          texto: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          dimensao_id: string
          id?: string
          obrigatoria?: boolean
          ordem?: number
          peso_pergunta?: number
          ramifica?: boolean
          texto: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          dimensao_id?: string
          id?: string
          obrigatoria?: boolean
          ordem?: number
          peso_pergunta?: number
          ramifica?: boolean
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "perguntas_dimensao_id_fkey"
            columns: ["dimensao_id"]
            isOneToOne: false
            referencedRelation: "dimensoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          avatar_url: string | null
          criado_em: string
          email: string
          id: string
          nome_completo: string
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          avatar_url?: string | null
          criado_em?: string
          email?: string
          id: string
          nome_completo?: string
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          avatar_url?: string | null
          criado_em?: string
          email?: string
          id?: string
          nome_completo?: string
          status?: Database["public"]["Enums"]["user_status"]
        }
        Relationships: []
      }
      respostas_diagnostico: {
        Row: {
          atualizado_em: string
          cargo: string | null
          consentimento: boolean
          cpf: string | null
          criado_em: string
          devolutiva: Json | null
          diagnostico_id: string
          diagnostico_titulo: string
          dimensoes_resultado: Json
          email: string
          estado_civil: string | null
          etapa: Database["public"]["Enums"]["lead_etapa"]
          etapa_id: string | null
          fechado_em: string | null
          id: string
          insights: Json | null
          motivo_perda: string | null
          motivo_perda_id: string | null
          nome: string
          origem: string | null
          origem_id: string | null
          perfil_cor: string | null
          perfil_descricao: string | null
          perfil_id: string | null
          perfil_titulo: string | null
          proximo_contato: string | null
          ramo: Database["public"]["Enums"]["ramo_diagnostico"] | null
          renda: string | null
          responsavel_id: string | null
          resultado: Database["public"]["Enums"]["lead_resultado"]
          rotulos: Json
          score: number
          score_maximo: number
          score_percentual: number
          utm: Json | null
          valor_estimado: number | null
          whatsapp: string | null
        }
        Insert: {
          atualizado_em?: string
          cargo?: string | null
          consentimento?: boolean
          cpf?: string | null
          criado_em?: string
          devolutiva?: Json | null
          diagnostico_id: string
          diagnostico_titulo: string
          dimensoes_resultado?: Json
          email: string
          estado_civil?: string | null
          etapa?: Database["public"]["Enums"]["lead_etapa"]
          etapa_id?: string | null
          fechado_em?: string | null
          id?: string
          insights?: Json | null
          motivo_perda?: string | null
          motivo_perda_id?: string | null
          nome: string
          origem?: string | null
          origem_id?: string | null
          perfil_cor?: string | null
          perfil_descricao?: string | null
          perfil_id?: string | null
          perfil_titulo?: string | null
          proximo_contato?: string | null
          ramo?: Database["public"]["Enums"]["ramo_diagnostico"] | null
          renda?: string | null
          responsavel_id?: string | null
          resultado?: Database["public"]["Enums"]["lead_resultado"]
          rotulos?: Json
          score?: number
          score_maximo?: number
          score_percentual?: number
          utm?: Json | null
          valor_estimado?: number | null
          whatsapp?: string | null
        }
        Update: {
          atualizado_em?: string
          cargo?: string | null
          consentimento?: boolean
          cpf?: string | null
          criado_em?: string
          devolutiva?: Json | null
          diagnostico_id?: string
          diagnostico_titulo?: string
          dimensoes_resultado?: Json
          email?: string
          estado_civil?: string | null
          etapa?: Database["public"]["Enums"]["lead_etapa"]
          etapa_id?: string | null
          fechado_em?: string | null
          id?: string
          insights?: Json | null
          motivo_perda?: string | null
          motivo_perda_id?: string | null
          nome?: string
          origem?: string | null
          origem_id?: string | null
          perfil_cor?: string | null
          perfil_descricao?: string | null
          perfil_id?: string | null
          perfil_titulo?: string | null
          proximo_contato?: string | null
          ramo?: Database["public"]["Enums"]["ramo_diagnostico"] | null
          renda?: string | null
          responsavel_id?: string | null
          resultado?: Database["public"]["Enums"]["lead_resultado"]
          rotulos?: Json
          score?: number
          score_maximo?: number
          score_percentual?: number
          utm?: Json | null
          valor_estimado?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_diagnostico_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_diagnostico_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "crm_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_diagnostico_motivo_perda_id_fkey"
            columns: ["motivo_perda_id"]
            isOneToOne: false
            referencedRelation: "motivos_perda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_diagnostico_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_diagnostico_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_resultado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_diagnostico_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_itens: {
        Row: {
          criado_em: string
          dimensao_id: string | null
          dimensao_titulo: string | null
          id: string
          opcao_id: string | null
          opcao_texto: string
          pergunta_id: string | null
          pergunta_texto: string
          peso_aplicado: number
          resposta_id: string
        }
        Insert: {
          criado_em?: string
          dimensao_id?: string | null
          dimensao_titulo?: string | null
          id?: string
          opcao_id?: string | null
          opcao_texto: string
          pergunta_id?: string | null
          pergunta_texto: string
          peso_aplicado?: number
          resposta_id: string
        }
        Update: {
          criado_em?: string
          dimensao_id?: string | null
          dimensao_titulo?: string | null
          id?: string
          opcao_id?: string | null
          opcao_texto?: string
          pergunta_id?: string | null
          pergunta_texto?: string
          peso_aplicado?: number
          resposta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_itens_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "respostas_diagnostico"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_user: { Args: never; Returns: boolean }
      is_master_admin: { Args: never; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "master_admin" | "consultor"
      diagnostico_status: "rascunho" | "publicado"
      lead_etapa:
        | "novo"
        | "contatado"
        | "devolutiva_agendada"
        | "proposta_enviada"
        | "cliente"
        | "perdido"
      lead_resultado: "aberto" | "ganho" | "perdido"
      ramo_diagnostico: "comum" | "solteiro" | "casal"
      user_status: "pendente" | "aprovado" | "bloqueado"
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
      app_role: ["master_admin", "consultor"],
      diagnostico_status: ["rascunho", "publicado"],
      lead_etapa: [
        "novo",
        "contatado",
        "devolutiva_agendada",
        "proposta_enviada",
        "cliente",
        "perdido",
      ],
      lead_resultado: ["aberto", "ganho", "perdido"],
      ramo_diagnostico: ["comum", "solteiro", "casal"],
      user_status: ["pendente", "aprovado", "bloqueado"],
    },
  },
} as const
