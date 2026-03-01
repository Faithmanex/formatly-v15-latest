// Centralized type definitions for Supabase database schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "guest" | "user" | "admin"
          document_limit: number
          documents_used: number
          subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "guest" | "user" | "admin"
          document_limit?: number
          documents_used?: number
          subscription_id?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?: "guest" | "user" | "admin"
          document_limit?: number
          documents_used?: number
          subscription_id?: string | null
          formatting_preferences?: any
          updated_at?: string
        }
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
          tracked_changes: boolean
          processing_log: any | null
          storage_location: string | null
          file_size: number | null
          result_url: string | null
          tracked_changes_url: string | null
          created_at: string
          updated_at: string
          language_variant: string | null
          file_type: string | null
          processed_at: string | null
          formatting_options: any | null
          formatting_time: number | null
        }
        Insert: {
          user_id: string
          filename: string
          original_filename: string
          status?: "draft" | "processing" | "formatted" | "failed"
          style_applied: string
          word_count?: number | null
          tracked_changes?: boolean
          processing_log?: any | null
          storage_location?: string | null
          file_size?: number | null
          result_url?: string | null
          tracked_changes_url?: string | null
          language_variant?: string | null
          file_type?: string | null
          processed_at?: string | null
          formatting_options?: any | null
          formatting_time?: number | null
        }
        Update: {
          filename?: string
          status?: "draft" | "processing" | "formatted" | "failed"
          style_applied?: string
          word_count?: number | null
          tracked_changes?: boolean
          processing_log?: any | null
          storage_location?: string | null
          file_size?: number | null
          result_url?: string | null
          tracked_changes_url?: string | null
          language_variant?: string | null
          file_type?: string | null
          processed_at?: string | null
          formatting_options?: any | null
          formatting_time?: number | null
        }
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
          is_read: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          type: "success" | "error" | "info" | "warning"
          title: string
          message: string
          action_url?: string | null
          action_text?: string | null
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
      }
      api_keys: {
        Row: {
          id: string
          name: string
          key_hash: string
          key_preview: string
          created_by: string
          last_used_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          name: string
          key_hash: string
          key_preview: string
          created_by: string
          last_used_at?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          last_used_at?: string | null
          is_active?: boolean
        }
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
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          price_monthly: number
          price_yearly?: number | null
          document_limit: number
          features?: any
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number | null
          document_limit?: number
          features?: any
          is_active?: boolean
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: "active" | "canceled" | "past_due" | "unpaid" | "trialing"
          billing_cycle: "monthly" | "yearly"
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          plan_id: string
          status: "active" | "canceled" | "past_due" | "unpaid" | "trialing"
          billing_cycle: "monthly" | "yearly"
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
        Update: {
          plan_id?: string
          status?: "active" | "canceled" | "past_due" | "unpaid" | "trialing"
          billing_cycle?: "monthly" | "yearly"
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          amount_due: number
          amount_paid: number
          currency: string
          status: "draft" | "open" | "paid" | "void" | "uncollectible"
          invoice_number: string | null
          invoice_pdf_url: string | null
          due_date: string | null
          paid_at: string | null
          billing_reason: string | null
          description: string | null
          line_items: any
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          amount_paid?: number
          currency?: string
          status: "draft" | "open" | "paid" | "void" | "uncollectible"
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          due_date?: string | null
          paid_at?: string | null
          billing_reason?: string | null
          description?: string | null
          line_items?: any
        }
        Update: {
          subscription_id?: string | null
          amount_due?: number
          amount_paid?: number
          currency?: string
          status?: "draft" | "open" | "paid" | "void" | "uncollectible"
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          due_date?: string | null
          paid_at?: string | null
          billing_reason?: string | null
          description?: string | null
          line_items?: any
        }
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
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          type: string
          card_brand?: string | null
          card_last4?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          is_default?: boolean
        }
        Update: {
          type?: string
          card_brand?: string | null
          card_last4?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          is_default?: boolean
        }
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
          is_default: boolean
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
          is_default?: boolean
        }
        Update: {
          line1?: string
          line2?: string | null
          city?: string
          state?: string | null
          postal_code?: string
          country?: string
          is_default?: boolean
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          period_start: string
          period_end: string
          documents_processed: number
          api_calls: number
          storage_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          subscription_id?: string | null
          period_start: string
          period_end: string
          documents_processed?: number
          api_calls?: number
          storage_used?: number
        }
        Update: {
          subscription_id?: string | null
          period_start?: string
          period_end?: string
          documents_processed?: number
          api_calls?: number
          storage_used?: number
        }
      }
    }
  }
}
