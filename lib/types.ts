// Centralized type definitions for Supabase database schema
// Synced with actual database schema on 2026-03-28
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "user" | "admin"
          created_at: string
          updated_at: string
          subscription_id: string | null
          formatting_preferences: any
          paypal_customer_id: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "guest" | "user" | "admin"
          subscription_id?: string | null
          formatting_preferences?: any
          paypal_customer_id?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?: "guest" | "user" | "admin"
          subscription_id?: string | null
          formatting_preferences?: any
          paypal_customer_id?: string | null
          updated_at?: string
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      documents: {
        Row: {
          id: string
          user_id: string
          filename: string
          original_filename: string
          status: "draft" | "processing" | "formatted" | "failed"
          style_applied: string
          word_count: number | null
          processing_log: any | null
          storage_location: string | null
          file_size: number | null
          created_at: string
          updated_at: string
          language_variant: string | null
          file_type: string | null
          processed_at: string | null
          formatting_options: any | null
          tracked_changes: boolean | null
          result_url: string | null
          formatting_time: number | null
          tracked_changes_url: string | null
          error_message: string | null
        }
        Insert: {
          user_id: string
          filename: string
          original_filename: string
          status?: "draft" | "processing" | "formatted" | "failed"
          style_applied: string
          word_count?: number | null
          processing_log?: any | null
          storage_location?: string | null
          file_size?: number | null
          language_variant?: string | null
          file_type?: string | null
          processed_at?: string | null
          formatting_options?: any | null
          tracked_changes?: boolean | null
          result_url?: string | null
          formatting_time?: number | null
          tracked_changes_url?: string | null
          error_message?: string | null
        }
        Update: {
          filename?: string
          status?: "draft" | "processing" | "formatted" | "failed"
          style_applied?: string
          word_count?: number | null
          processing_log?: any | null
          storage_location?: string | null
          file_size?: number | null
          language_variant?: string | null
          file_type?: string | null
          processed_at?: string | null
          formatting_options?: any | null
          tracked_changes?: boolean | null
          result_url?: string | null
          formatting_time?: number | null
          tracked_changes_url?: string | null
          error_message?: string | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      custom_styles: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          settings: any
          is_default: boolean
          is_global: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          name: string
          description?: string | null
          settings: any
          is_default?: boolean
          is_global?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          settings?: any
          is_default?: boolean
          is_global?: boolean
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: "success" | "error" | "info" | "warning"
          title: string
          message: string
          action_url: string | null
          action_text: string | null
          is_read: boolean | null
          created_at: string
        }
        Insert: {
          user_id: string
          type: "success" | "error" | "info" | "warning"
          title: string
          message: string
          action_url?: string | null
          action_text?: string | null
          is_read?: boolean | null
        }
        Update: {
          is_read?: boolean | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      api_keys: {
        Row: {
          id: string
          name: string
          key_hash: string
          key_preview: string
          created_by: string
          last_used_at: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          name: string
          key_hash: string
          key_preview: string
          created_by: string
          last_used_at?: string | null
          is_active?: boolean | null
        }
        Update: {
          name?: string
          last_used_at?: string | null
          is_active?: boolean | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      system_logs: {
        Row: {
          id: string
          level: string
          message: string
          user_id: string | null
          document_id: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          level: string
          message: string
          user_id?: string | null
          document_id?: string | null
          metadata?: any | null
        }
        Update: {
          level?: string
          message?: string
          metadata?: any | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price_monthly: number
          price_yearly: number | null
          document_limit: number
          features: any
          is_active: boolean | null
          created_at: string
          updated_at: string
          billing_cycles: any
          currency: string
          api_calls_limit: number
          storage_limit_gb: number
          is_popular: boolean | null
          priority_support: boolean
          custom_styles: boolean
          team_collaboration: boolean
          paypal_plan_id_monthly: string | null
          paypal_plan_id_yearly: string | null
        }
        Insert: {
          name: string
          description?: string | null
          price_monthly: number
          price_yearly?: number | null
          document_limit: number
          features?: any
          is_active?: boolean | null
          billing_cycles?: any
          currency?: string
          api_calls_limit?: number
          storage_limit_gb?: number
          is_popular?: boolean | null
          priority_support?: boolean
          custom_styles?: boolean
          team_collaboration?: boolean
          paypal_plan_id_monthly?: string | null
          paypal_plan_id_yearly?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number | null
          document_limit?: number
          features?: any
          is_active?: boolean | null
          billing_cycles?: any
          currency?: string
          api_calls_limit?: number
          storage_limit_gb?: number
          is_popular?: boolean | null
          priority_support?: boolean
          custom_styles?: boolean
          team_collaboration?: boolean
          paypal_plan_id_monthly?: string | null
          paypal_plan_id_yearly?: string | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          billing_cycle: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          created_at: string
          updated_at: string
          pending_plan_id: string | null
          pending_plan_effective_date: string | null
          plan_change_reason: string | null
          previous_plan_id: string | null
          pending_change_date: string | null
          change_reason: string | null
          documents_used: number | null
          api_calls_used: number | null
          storage_used_gb: number | null
          last_usage_reset: string | null
          paypal_subscription_id: string | null
        }
        Insert: {
          user_id: string
          plan_id: string
          status: string
          billing_cycle: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          pending_plan_id?: string | null
          pending_plan_effective_date?: string | null
          plan_change_reason?: string | null
          previous_plan_id?: string | null
          pending_change_date?: string | null
          change_reason?: string | null
          documents_used?: number | null
          api_calls_used?: number | null
          storage_used_gb?: number | null
          last_usage_reset?: string | null
          paypal_subscription_id?: string | null
        }
        Update: {
          plan_id?: string
          status?: string
          billing_cycle?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          pending_plan_id?: string | null
          pending_plan_effective_date?: string | null
          plan_change_reason?: string | null
          previous_plan_id?: string | null
          pending_change_date?: string | null
          change_reason?: string | null
          documents_used?: number | null
          api_calls_used?: number | null
          storage_used_gb?: number | null
          last_usage_reset?: string | null
          paypal_subscription_id?: string | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          amount_due: number
          amount_paid: number | null
          currency: string | null
          status: string
          invoice_number: string | null
          invoice_pdf_url: string | null
          due_date: string | null
          paid_at: string | null
          billing_reason: string | null
          description: string | null
          line_items: any | null
          created_at: string
          updated_at: string
          paypal_transaction_id: string | null
        }
        Insert: {
          user_id: string
          subscription_id?: string | null
          amount_due: number
          amount_paid?: number | null
          currency?: string | null
          status: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          due_date?: string | null
          paid_at?: string | null
          billing_reason?: string | null
          description?: string | null
          line_items?: any | null
          paypal_transaction_id?: string | null
        }
        Update: {
          subscription_id?: string | null
          amount_due?: number
          amount_paid?: number | null
          currency?: string | null
          status?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          due_date?: string | null
          paid_at?: string | null
          billing_reason?: string | null
          description?: string | null
          line_items?: any | null
          paypal_transaction_id?: string | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          type: string
          card_brand: string | null
          card_last4: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          is_default: boolean | null
          created_at: string
          updated_at: string
          paypal_payment_method_id: string | null
        }
        Insert: {
          user_id: string
          type: string
          card_brand?: string | null
          card_last4?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          is_default?: boolean | null
          paypal_payment_method_id?: string | null
        }
        Update: {
          type?: string
          card_brand?: string | null
          card_last4?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          is_default?: boolean | null
          paypal_payment_method_id?: string | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      billing_addresses: {
        Row: {
          id: string
          user_id: string
          line1: string
          line2: string | null
          city: string
          state: string | null
          postal_code: string
          country: string
          is_default: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          line1: string
          line2?: string | null
          city: string
          state?: string | null
          postal_code: string
          country: string
          is_default?: boolean | null
        }
        Update: {
          line1?: string
          line2?: string | null
          city?: string
          state?: string | null
          postal_code?: string
          country?: string
          is_default?: boolean | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      waitlist: {
        Row: {
          id: number
          created_at: string
          full_name: string | null
          email: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          email: string
        }
        Update: {
          full_name?: string | null
          email?: string
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      english_variants: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          is_active: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          code: string
          description?: string | null
          is_active?: boolean | null
          sort_order?: number | null
        }
        Update: {
          name?: string
          code?: string
          description?: string | null
          is_active?: boolean | null
          sort_order?: number | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      formatting_styles: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          is_active: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          code: string
          description?: string | null
          is_active?: boolean | null
          sort_order?: number | null
        }
        Update: {
          name?: string
          code?: string
          description?: string | null
          is_active?: boolean | null
          sort_order?: number | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          email: string
          subject: string
          message: string
          status: "open" | "in-progress" | "closed"
          priority: "low" | "medium" | "high" | "urgent"
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          full_name: string
          email: string
          subject: string
          message: string
          status?: "open" | "in-progress" | "closed"
          priority?: "low" | "medium" | "high" | "urgent"
        }
        Update: {
          status?: "open" | "in-progress" | "closed"
          priority?: "low" | "medium" | "high" | "urgent"
          updated_at?: string
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
    }
    Views: {
      active_english_variants: {
        Row: {
          id: string | null
          name: string | null
          code: string | null
          description: string | null
          sort_order: number | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
      active_formatting_styles: {
        Row: {
          id: string | null
          name: string | null
          code: string | null
          description: string | null
          sort_order: number | null
        }
        Relationships: Array<{ foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }>
      }
    }
    Functions: {
      get_user_usage_stats: {
        Args: { user_uuid: string }
        Returns: Array<{
          documents_used: number
          api_calls_used: number
          storage_used_gb: number
          documents_limit: number
          api_calls_limit: number
          storage_limit_gb: number
          plan_name: string
          next_reset_date: string
          billing_cycle: string
          usage_percentage: number
        }>
      }
      increment_document_usage: {
        Args: { p_user_id: string; p_increment?: number }
        Returns: boolean
      }
      track_document_usage: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      check_usage_limits: {
        Args: { p_user_id: string }
        Returns: Array<{
          documents_at_limit: boolean
          api_calls_at_limit: boolean
          storage_at_limit: boolean
          current_usage: Record<string, unknown>
        }>
      }
      handle_subscription_upgrade: {
        Args: { p_user_id: string; p_new_plan_id: string; p_billing_cycle?: string }
        Returns: Record<string, unknown>
      }
      handle_subscription_downgrade: {
        Args: { p_user_id: string; p_new_plan_id: string }
        Returns: Record<string, unknown>
      }
      get_subscription_status: {
        Args: { p_user_id: string }
        Returns: Record<string, unknown>
      }
      reset_usage_for_plan_change: {
        Args: { p_user_id: string; p_old_plan_id: string; p_new_plan_id: string; p_reason?: string }
        Returns: undefined
      }
      reset_usage_counters: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      get_current_plan_usage: {
        Args: { p_user_id: string }
        Returns: Array<{
          plan_id: string
          plan_name: string
          document_limit: number
          documents_used: number
          remaining_documents: number
          usage_percentage: number
        }>
      }
      get_system_stats: {
        Args: {}
        Returns: Record<string, unknown>
      }
    }
  }
}
