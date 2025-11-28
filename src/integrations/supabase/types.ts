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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_test_assignments: {
        Row: {
          assigned_at: string | null
          id: number
          phone: string
          test_name: string
          variant_name: string
        }
        Insert: {
          assigned_at?: string | null
          id?: number
          phone: string
          test_name: string
          variant_name: string
        }
        Update: {
          assigned_at?: string | null
          id?: number
          phone?: string
          test_name?: string
          variant_name?: string
        }
        Relationships: []
      }
      ab_test_metrics: {
        Row: {
          conversa_id: number | null
          created_at: string | null
          id: number
          metadata: Json | null
          metric_name: string
          metric_value: number | null
          phone: string
          test_name: string
          variant_name: string
        }
        Insert: {
          conversa_id?: number | null
          created_at?: string | null
          id?: number
          metadata?: Json | null
          metric_name: string
          metric_value?: number | null
          phone: string
          test_name: string
          variant_name: string
        }
        Update: {
          conversa_id?: number | null
          created_at?: string | null
          id?: number
          metadata?: Json | null
          metric_name?: string
          metric_value?: number | null
          phone?: string
          test_name?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_metrics_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_test_variants: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          test_name: string
          traffic_percentage: number | null
          variant_config: Json
          variant_name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          test_name: string
          traffic_percentage?: number | null
          variant_config: Json
          variant_name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          test_name?: string
          traffic_percentage?: number | null
          variant_config?: Json
          variant_name?: string
        }
        Relationships: []
      }
      agent_errors: {
        Row: {
          ai_model: string | null
          conversa_id: number | null
          created_at: string | null
          error_context: Json | null
          error_message: string | null
          error_type: string
          id: number
          phone: string
        }
        Insert: {
          ai_model?: string | null
          conversa_id?: number | null
          created_at?: string | null
          error_context?: Json | null
          error_message?: string | null
          error_type: string
          id?: number
          phone: string
        }
        Update: {
          ai_model?: string | null
          conversa_id?: number | null
          created_at?: string | null
          error_context?: Json | null
          error_message?: string | null
          error_type?: string
          id?: number
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_errors_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_decision_log: {
        Row: {
          ai_model: string
          ai_response: string
          appointment_scheduled: boolean | null
          client_updated: boolean | null
          confidence_score: number | null
          conversa_id: number | null
          conversation_context: Json | null
          created_at: string | null
          handoff_triggered: boolean | null
          id: number
          intent: string | null
          phone: string
          response_time_ms: number | null
          sentiment: string | null
          tokens_used: number | null
          tool_calls: Json | null
          user_message: string
        }
        Insert: {
          ai_model: string
          ai_response: string
          appointment_scheduled?: boolean | null
          client_updated?: boolean | null
          confidence_score?: number | null
          conversa_id?: number | null
          conversation_context?: Json | null
          created_at?: string | null
          handoff_triggered?: boolean | null
          id?: number
          intent?: string | null
          phone: string
          response_time_ms?: number | null
          sentiment?: string | null
          tokens_used?: number | null
          tool_calls?: Json | null
          user_message: string
        }
        Update: {
          ai_model?: string
          ai_response?: string
          appointment_scheduled?: boolean | null
          client_updated?: boolean | null
          confidence_score?: number | null
          conversa_id?: number | null
          conversation_context?: Json | null
          created_at?: string | null
          handoff_triggered?: boolean | null
          id?: number
          intent?: string | null
          phone?: string
          response_time_ms?: number | null
          sentiment?: string | null
          tokens_used?: number | null
          tool_calls?: Json | null
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_decision_log_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          cliente_id: number | null
          created_at: string | null
          datetime: string | null
          doctor_id: number | null
          google_event_id: string | null
          id: number
          notes: string | null
          phone: string
          procedure: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          cliente_id?: number | null
          created_at?: string | null
          datetime?: string | null
          doctor_id?: number | null
          google_event_id?: string | null
          id?: number
          notes?: string | null
          phone: string
          procedure: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          cliente_id?: number | null
          created_at?: string | null
          datetime?: string | null
          doctor_id?: number | null
          google_event_id?: string | null
          id?: number
          notes?: string | null
          phone?: string
          procedure?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_com_ultima_conversa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointments_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changed_fields: Json | null
          created_at: string | null
          id: number
          ip_address: unknown
          record_id: number
          table_name: string
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: number
          ip_address?: unknown
          record_id: number
          table_name: string
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          changed_fields?: Json | null
          created_at?: string | null
          id?: number
          ip_address?: unknown
          record_id?: number
          table_name?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          appointment_id: number | null
          appointment_scheduled: boolean | null
          budget_value: number | null
          cliente_id: number | null
          conversa_id: number | null
          created_at: string | null
          id: number
          phone: string
          recall_sent: boolean | null
          sent_at: string | null
          treatment_name: string | null
        }
        Insert: {
          appointment_id?: number | null
          appointment_scheduled?: boolean | null
          budget_value?: number | null
          cliente_id?: number | null
          conversa_id?: number | null
          created_at?: string | null
          id?: number
          phone: string
          recall_sent?: boolean | null
          sent_at?: string | null
          treatment_name?: string | null
        }
        Update: {
          appointment_id?: number | null
          appointment_scheduled?: boolean | null
          budget_value?: number | null
          cliente_id?: number | null
          conversa_id?: number | null
          created_at?: string | null
          id?: number
          phone?: string
          recall_sent?: boolean | null
          sent_at?: string | null
          treatment_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_com_ultima_conversa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      business_rules: {
        Row: {
          description: string | null
          id: number
          rule_key: string
          rule_value: Json
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          rule_key: string
          rule_value: Json
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          rule_key?: string
          rule_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          birth_date: string | null
          client_name: string | null
          consent_date: string | null
          consent_given: boolean | null
          consent_type: string | null
          cpf: string | null
          created_at: string | null
          data_retention_until: string | null
          email: string | null
          first_contact_at: string | null
          id: number
          is_existing_patient: boolean | null
          last_appointment_date: string | null
          lead_source: string | null
          name: string | null
          payment_amount: number | null
          payment_date: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_status: string | null
          phone: string
          stage: string | null
          status: string | null
          total_appointments: number | null
          treatment_interest: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          client_name?: string | null
          consent_date?: string | null
          consent_given?: boolean | null
          consent_type?: string | null
          cpf?: string | null
          created_at?: string | null
          data_retention_until?: string | null
          email?: string | null
          first_contact_at?: string | null
          id?: number
          is_existing_patient?: boolean | null
          last_appointment_date?: string | null
          lead_source?: string | null
          name?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_status?: string | null
          phone: string
          stage?: string | null
          status?: string | null
          total_appointments?: number | null
          treatment_interest?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          client_name?: string | null
          consent_date?: string | null
          consent_given?: boolean | null
          consent_type?: string | null
          cpf?: string | null
          created_at?: string | null
          data_retention_until?: string | null
          email?: string | null
          first_contact_at?: string | null
          id?: number
          is_existing_patient?: boolean | null
          last_appointment_date?: string | null
          lead_source?: string | null
          name?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_status?: string | null
          phone?: string
          stage?: string | null
          status?: string | null
          total_appointments?: number | null
          treatment_interest?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversas: {
        Row: {
          agent_rating: number | null
          appointment_date: string | null
          appointment_recently_created: string | null
          appointment_scheduled: boolean | null
          avg_response_time_ms: number | null
          budget_recall_sent: boolean | null
          claimed_at: string | null
          claimed_by: string | null
          cliente_id: number | null
          created_at: string | null
          doctor_name: string | null
          handoff_ativo: boolean | null
          handoff_block_until: string | null
          handoff_reason: string | null
          handoff_start_at: string | null
          handoff_started_at: string | null
          id: number
          intent: string | null
          last_message_at: string | null
          messages_count: number | null
          openai_thread_id: string | null
          phone: string
          post_consultation_recall_sent: boolean | null
          post_procedure_recall_sent: boolean | null
          resolution_status: string | null
          resolution_type: string | null
          sentiment: string | null
          status: string | null
          summary: string | null
          treatment_mentioned: string | null
          updated_at: string | null
        }
        Insert: {
          agent_rating?: number | null
          appointment_date?: string | null
          appointment_recently_created?: string | null
          appointment_scheduled?: boolean | null
          avg_response_time_ms?: number | null
          budget_recall_sent?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          cliente_id?: number | null
          created_at?: string | null
          doctor_name?: string | null
          handoff_ativo?: boolean | null
          handoff_block_until?: string | null
          handoff_reason?: string | null
          handoff_start_at?: string | null
          handoff_started_at?: string | null
          id?: number
          intent?: string | null
          last_message_at?: string | null
          messages_count?: number | null
          openai_thread_id?: string | null
          phone: string
          post_consultation_recall_sent?: boolean | null
          post_procedure_recall_sent?: boolean | null
          resolution_status?: string | null
          resolution_type?: string | null
          sentiment?: string | null
          status?: string | null
          summary?: string | null
          treatment_mentioned?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_rating?: number | null
          appointment_date?: string | null
          appointment_recently_created?: string | null
          appointment_scheduled?: boolean | null
          avg_response_time_ms?: number | null
          budget_recall_sent?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          cliente_id?: number | null
          created_at?: string | null
          doctor_name?: string | null
          handoff_ativo?: boolean | null
          handoff_block_until?: string | null
          handoff_reason?: string | null
          handoff_start_at?: string | null
          handoff_started_at?: string | null
          id?: number
          intent?: string | null
          last_message_at?: string | null
          messages_count?: number | null
          openai_thread_id?: string | null
          phone?: string
          post_consultation_recall_sent?: boolean | null
          post_procedure_recall_sent?: boolean | null
          resolution_status?: string | null
          resolution_type?: string | null
          sentiment?: string | null
          status?: string | null
          summary?: string | null
          treatment_mentioned?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_com_ultima_conversa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversas_client"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversas_client"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_com_ultima_conversa"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_unavailability: {
        Row: {
          created_at: string | null
          created_by: string | null
          doctor_id: number | null
          end_datetime: string
          id: number
          reason: string | null
          start_datetime: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          doctor_id?: number | null
          end_datetime: string
          id?: number
          reason?: string | null
          start_datetime: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          doctor_id?: number | null
          end_datetime?: string
          id?: number
          reason?: string | null
          start_datetime?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_unavailability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          id: number
          name: string
          specialty: string | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: number
          name: string
          specialty?: string | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: number
          name?: string
          specialty?: string | null
        }
        Relationships: []
      }
      followups: {
        Row: {
          appointment_id: number | null
          attempt_number: number | null
          budget_id: number | null
          cliente_id: number | null
          conversa_id: number | null
          created_at: string | null
          id: number
          message: string | null
          metadata: Json | null
          phone: string
          recall_type: string | null
          scheduled_for: string
          sent_at: string | null
          status: string | null
          trigger_event: string | null
          trigger_event_date: string | null
          type: string
        }
        Insert: {
          appointment_id?: number | null
          attempt_number?: number | null
          budget_id?: number | null
          cliente_id?: number | null
          conversa_id?: number | null
          created_at?: string | null
          id?: number
          message?: string | null
          metadata?: Json | null
          phone: string
          recall_type?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          trigger_event?: string | null
          trigger_event_date?: string | null
          type: string
        }
        Update: {
          appointment_id?: number | null
          attempt_number?: number | null
          budget_id?: number | null
          cliente_id?: number | null
          conversa_id?: number | null
          created_at?: string | null
          id?: number
          message?: string | null
          metadata?: Json | null
          phone?: string
          recall_type?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          trigger_event?: string | null
          trigger_event_date?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_followups_client"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_followups_client"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_com_ultima_conversa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_com_ultima_conversa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      interesses: {
        Row: {
          cliente_id: number | null
          detected_at: string | null
          id: number
          interest_level: number | null
          treatment_name: string
        }
        Insert: {
          cliente_id?: number | null
          detected_at?: string | null
          id?: number
          interest_level?: number | null
          treatment_name: string
        }
        Update: {
          cliente_id?: number | null
          detected_at?: string | null
          id?: number
          interest_level?: number | null
          treatment_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "interesses_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interesses_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_com_ultima_conversa"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          content: string | null
          id: number
        }
        Insert: {
          content?: string | null
          id?: number
        }
        Update: {
          content?: string | null
          id?: number
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          conversa_id: number | null
          created_at: string | null
          id: number
          media_type: string | null
          media_url: string | null
          message: string | null
          message_type: string | null
          phone: string
          processed: boolean | null
          sender: string
          zapi_message_id: string | null
        }
        Insert: {
          conversa_id?: number | null
          created_at?: string | null
          id?: number
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          message_type?: string | null
          phone: string
          processed?: boolean | null
          sender: string
          zapi_message_id?: string | null
        }
        Update: {
          conversa_id?: number | null
          created_at?: string | null
          id?: number
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          message_type?: string | null
          phone?: string
          processed?: boolean | null
          sender?: string
          zapi_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mensagens_conversa"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      message_buffer: {
        Row: {
          buffer_expires_at: string
          created_at: string | null
          last_message_at: string
          last_retry_at: string | null
          locked_at: string | null
          locked_by: string | null
          phone: string
          processing: boolean | null
          retry_count: number | null
        }
        Insert: {
          buffer_expires_at: string
          created_at?: string | null
          last_message_at: string
          last_retry_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          phone: string
          processing?: boolean | null
          retry_count?: number | null
        }
        Update: {
          buffer_expires_at?: string
          created_at?: string | null
          last_message_at?: string
          last_retry_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          phone?: string
          processing?: boolean | null
          retry_count?: number | null
        }
        Relationships: []
      }
      message_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          message: string
          phone: string
          priority: number | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          message: string
          phone: string
          priority?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          message?: string
          phone?: string
          priority?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      n8n_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: number
          phone: string
          processed_at: string | null
          status: string
          tool_args: Json
          tool_name: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          phone: string
          processed_at?: string | null
          status?: string
          tool_args: Json
          tool_name: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          phone?: string
          processed_at?: string | null
          status?: string
          tool_args?: Json
          tool_name?: string
        }
        Relationships: []
      }
      n8n_webhook_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          request_params: Json | null
          response_data: Json | null
          response_time_ms: number | null
          status_code: number | null
          success: boolean | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          request_params?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          success?: boolean | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          request_params?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          success?: boolean | null
        }
        Relationships: []
      }
      pending_appointments: {
        Row: {
          created_at: string | null
          date: string
          doctor: string
          error: string | null
          id: string
          phone: string
          procedure: string | null
          status: string | null
          synced_at: string | null
          time: string
        }
        Insert: {
          created_at?: string | null
          date: string
          doctor: string
          error?: string | null
          id?: string
          phone: string
          procedure?: string | null
          status?: string | null
          synced_at?: string | null
          time: string
        }
        Update: {
          created_at?: string | null
          date?: string
          doctor?: string
          error?: string | null
          id?: string
          phone?: string
          procedure?: string | null
          status?: string | null
          synced_at?: string | null
          time?: string
        }
        Relationships: []
      }
      pipeline_events: {
        Row: {
          changed_at: string | null
          changed_by: string
          cliente_id: number | null
          id: number
          new_stage: string
          old_stage: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          cliente_id?: number | null
          id?: number
          new_stage: string
          old_stage?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          cliente_id?: number | null
          id?: number
          new_stage?: string
          old_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_events_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_events_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_com_ultima_conversa"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recall_config: {
        Row: {
          created_at: string | null
          delay_days_max: number
          delay_days_min: number
          enabled: boolean | null
          id: number
          message_template: string
          recall_type: string
          send_hour: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delay_days_max: number
          delay_days_min: number
          enabled?: boolean | null
          id?: number
          message_template: string
          recall_type: string
          send_hour?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delay_days_max?: number
          delay_days_min?: number
          enabled?: boolean | null
          id?: number
          message_template?: string
          recall_type?: string
          send_hour?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          phone: string | null
          resolved: boolean | null
          type: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          phone?: string | null
          resolved?: boolean | null
          type: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          phone?: string | null
          resolved?: boolean | null
          type?: string
        }
        Relationships: []
      }
      system_configuration: {
        Row: {
          additional_notes: string | null
          ai_model: string | null
          ai_temperature: number | null
          batch_size_limit: number | null
          buffer_enabled: boolean | null
          buffer_time_seconds: number | null
          handoff_keywords: string[] | null
          handoff_notification_number: string
          handoff_timeout_hours: number | null
          id: number
          max_tokens: number | null
          system_prompt: string
          test_mode: boolean | null
          test_numbers: string[] | null
          tools_enabled: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          additional_notes?: string | null
          ai_model?: string | null
          ai_temperature?: number | null
          batch_size_limit?: number | null
          buffer_enabled?: boolean | null
          buffer_time_seconds?: number | null
          handoff_keywords?: string[] | null
          handoff_notification_number?: string
          handoff_timeout_hours?: number | null
          id?: number
          max_tokens?: number | null
          system_prompt: string
          test_mode?: boolean | null
          test_numbers?: string[] | null
          tools_enabled?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          additional_notes?: string | null
          ai_model?: string | null
          ai_temperature?: number | null
          batch_size_limit?: number | null
          buffer_enabled?: boolean | null
          buffer_time_seconds?: number | null
          handoff_keywords?: string[] | null
          handoff_notification_number?: string
          handoff_timeout_hours?: number | null
          id?: number
          max_tokens?: number | null
          system_prompt?: string
          test_mode?: boolean | null
          test_numbers?: string[] | null
          tools_enabled?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: number
          payload: Json | null
          phone: string
          processed: boolean | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: number
          payload?: Json | null
          phone: string
          processed?: boolean | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: number
          payload?: Json | null
          phone?: string
          processed?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      ab_test_results: {
        Row: {
          avg_messages_to_convert: number | null
          conversion_rate_pct: number | null
          conversions: number | null
          test_name: string | null
          total_users: number | null
          variant_name: string | null
        }
        Relationships: []
      }
      agent_performance_metrics: {
        Row: {
          appointments_scheduled: number | null
          avg_confidence: number | null
          avg_response_time_ms: number | null
          avg_tokens: number | null
          conversations_with_intent: number | null
          date: string | null
          handoffs_triggered: number | null
          total_conversations: number | null
        }
        Relationships: []
      }
      clientes_com_ultima_conversa: {
        Row: {
          created_at: string | null
          id: number | null
          last_appointment_date: string | null
          last_message_at: string | null
          name: string | null
          phone: string | null
          stage: string | null
          status: string | null
          total_appointments: number | null
          ultima_conversa_summary: string | null
        }
        Relationships: []
      }
      recall_dashboard: {
        Row: {
          due_this_week: number | null
          due_today: number | null
          overdue: number | null
          recall_type: string | null
          status: string | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      acquire_buffer_lock: {
        Args: { p_force_mode?: boolean; p_phone: string; p_request_id: string }
        Returns: {
          buffer_data: Json
          conversa_id: number
          error_message: string
          success: boolean
        }[]
      }
      assign_initial_admin: { Args: never; Returns: undefined }
      assign_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      complete_buffer_processing: {
        Args: { p_message_ids: number[]; p_phone: string; p_request_id: string }
        Returns: {
          error_message: string
          messages_marked: number
          success: boolean
        }[]
      }
      create_post_procedure_recall: {
        Args: {
          p_appointment_id: number
          p_phone: string
          p_procedure_name: string
        }
        Returns: boolean
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      release_buffer_lock: {
        Args: { p_phone: string; p_request_id: string }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      remove_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      safe_buffer_upsert: {
        Args: { p_buffer_time_seconds: number; p_phone: string }
        Returns: {
          action: string
          error_message: string
          success: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "receptionist" | "viewer"
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
      app_role: ["admin", "receptionist", "viewer"],
    },
  },
} as const
