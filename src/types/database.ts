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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assets: {
        Row: {
          brand_fit_score: number | null
          campaign_id: string
          copy_caption: string | null
          copy_hashtags: string[] | null
          created_at: string
          duration_sec: number | null
          id: string
          idea_id: string | null
          name: string
          performance_score: number | null
          platform: Database["public"]["Enums"]["platform"]
          regeneration_options: Json | null
          scheduled_at: string | null
          size_label: string | null
          status: Database["public"]["Enums"]["asset_status"]
          storage_path: string
          strategic_rationale: string | null
          tags: string[]
          type: Database["public"]["Enums"]["asset_type"]
          workspace_id: string
        }
        Insert: {
          brand_fit_score?: number | null
          campaign_id: string
          copy_caption?: string | null
          copy_hashtags?: string[] | null
          created_at?: string
          duration_sec?: number | null
          id?: string
          idea_id?: string | null
          name: string
          performance_score?: number | null
          platform: Database["public"]["Enums"]["platform"]
          regeneration_options?: Json | null
          scheduled_at?: string | null
          size_label?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          storage_path: string
          strategic_rationale?: string | null
          tags?: string[]
          type: Database["public"]["Enums"]["asset_type"]
          workspace_id: string
        }
        Update: {
          brand_fit_score?: number | null
          campaign_id?: string
          copy_caption?: string | null
          copy_hashtags?: string[] | null
          created_at?: string
          duration_sec?: number | null
          id?: string
          idea_id?: string | null
          name?: string
          performance_score?: number | null
          platform?: Database["public"]["Enums"]["platform"]
          regeneration_options?: Json | null
          scheduled_at?: string | null
          size_label?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          storage_path?: string
          strategic_rationale?: string | null
          tags?: string[]
          type?: Database["public"]["Enums"]["asset_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "campaign_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          colors: string[]
          created_at: string
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          typography_headline: string | null
          updated_at: string
          voice_summary: string | null
          workspace_id: string
        }
        Insert: {
          colors?: string[]
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          typography_headline?: string | null
          updated_at?: string
          voice_summary?: string | null
          workspace_id: string
        }
        Update: {
          colors?: string[]
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          typography_headline?: string | null
          updated_at?: string
          voice_summary?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "brands_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_ideas: {
        Row: {
          campaign_id: string
          content_pillar: string | null
          created_at: string
          creative_direction: string | null
          description: string
          format: Database["public"]["Enums"]["asset_type"]
          id: string
          platforms: Database["public"]["Enums"]["platform"][]
          status: Database["public"]["Enums"]["idea_status"]
          strategic_rationale: string | null
          title: string
          workspace_id: string
        }
        Insert: {
          campaign_id: string
          content_pillar?: string | null
          created_at?: string
          creative_direction?: string | null
          description: string
          format: Database["public"]["Enums"]["asset_type"]
          id?: string
          platforms?: Database["public"]["Enums"]["platform"][]
          status?: Database["public"]["Enums"]["idea_status"]
          strategic_rationale?: string | null
          title: string
          workspace_id: string
        }
        Update: {
          campaign_id?: string
          content_pillar?: string | null
          created_at?: string
          creative_direction?: string | null
          description?: string
          format?: Database["public"]["Enums"]["asset_type"]
          id?: string
          platforms?: Database["public"]["Enums"]["platform"][]
          status?: Database["public"]["Enums"]["idea_status"]
          strategic_rationale?: string | null
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_ideas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_ideas_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_ideas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "campaign_ideas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brand_id: string | null
          created_at: string
          description: string | null
          end_at: string | null
          id: string
          name: string
          owner_id: string
          platforms: Database["public"]["Enums"]["platform"][]
          product_id: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          strategy: Json | null
          tags: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          name: string
          owner_id: string
          platforms?: Database["public"]["Enums"]["platform"][]
          product_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          strategy?: Json | null
          tags?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          platforms?: Database["public"]["Enums"]["platform"][]
          product_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          strategy?: Json | null
          tags?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          attempts: number
          campaign_id: string
          created_at: string
          error: string | null
          finished_at: string | null
          format: Database["public"]["Enums"]["asset_type"]
          id: string
          idea_id: string
          status: Database["public"]["Enums"]["job_status"]
          workspace_id: string
        }
        Insert: {
          attempts?: number
          campaign_id: string
          created_at?: string
          error?: string | null
          finished_at?: string | null
          format: Database["public"]["Enums"]["asset_type"]
          id?: string
          idea_id: string
          status?: Database["public"]["Enums"]["job_status"]
          workspace_id: string
        }
        Update: {
          attempts?: number
          campaign_id?: string
          created_at?: string
          error?: string | null
          finished_at?: string | null
          format?: Database["public"]["Enums"]["asset_type"]
          id?: string
          idea_id?: string
          status?: Database["public"]["Enums"]["job_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "generation_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "campaign_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "generation_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          message: string
          read_by: string[]
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          message: string
          read_by?: string[]
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          message?: string
          read_by?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category: string | null
          created_at: string
          dossier: Json | null
          id: string
          name: string
          source_type: Database["public"]["Enums"]["product_source"]
          source_url: string | null
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
          upload_path: string | null
          workspace_id: string
        }
        Insert: {
          brand_id?: string | null
          category?: string | null
          created_at?: string
          dossier?: Json | null
          id?: string
          name: string
          source_type: Database["public"]["Enums"]["product_source"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          upload_path?: string | null
          workspace_id: string
        }
        Update: {
          brand_id?: string | null
          category?: string | null
          created_at?: string
          dossier?: Json | null
          id?: string
          name?: string
          source_type?: Database["public"]["Enums"]["product_source"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          upload_path?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          timezone: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          timezone?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          added_at: string
          role: Database["public"]["Enums"]["team_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          added_at?: string
          role: Database["public"]["Enums"]["team_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          added_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          credits_total: number
          credits_used: number
          default_brand_voice: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["plan_type"]
          slug: string
        }
        Insert: {
          created_at?: string
          credits_total?: number
          credits_used?: number
          default_brand_voice?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          plan?: Database["public"]["Enums"]["plan_type"]
          slug: string
        }
        Update: {
          created_at?: string
          credits_total?: number
          credits_used?: number
          default_brand_voice?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      campaign_stats: {
        Row: {
          assets: number | null
          campaign_id: string | null
          pending_review: number | null
          published: number | null
          scheduled: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_stats: {
        Row: {
          assets: number | null
          campaigns: number | null
          pending_review: number | null
          scheduled_posts: number | null
          workspace_id: string | null
        }
        Insert: {
          assets?: never
          campaigns?: never
          pending_review?: never
          scheduled_posts?: never
          workspace_id?: string | null
        }
        Update: {
          assets?: never
          campaigns?: never
          pending_review?: never
          scheduled_posts?: never
          workspace_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_workspace_credits: {
        Args: { amount: number; ws_id: string }
        Returns: undefined
      }
      list_workspace_members: {
        Args: { ws: string }
        Returns: {
          added_at: string
          email: string
          name: string
          role: Database["public"]["Enums"]["team_role"]
          user_id: string
        }[]
      }
      pgmq_delete: {
        Args: { msg_id: number; queue_name: string }
        Returns: boolean
      }
    }
    Enums: {
      asset_status:
        | "draft"
        | "pending-review"
        | "approved"
        | "scheduled"
        | "published"
      asset_type: "image" | "video" | "carousel" | "story"
      campaign_status: "draft" | "active" | "completed" | "paused" | "archived"
      idea_status: "proposed" | "approved" | "rejected" | "generated"
      job_status: "queued" | "running" | "succeeded" | "failed"
      notification_kind: "success" | "warning" | "ai" | "info"
      plan_type: "trial" | "pro"
      platform: "instagram" | "facebook" | "tiktok" | "linkedin"
      product_source: "url" | "upload"
      product_status: "processing" | "ready" | "needs-review"
      team_role: "owner" | "editor" | "viewer"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      asset_status: [
        "draft",
        "pending-review",
        "approved",
        "scheduled",
        "published",
      ],
      asset_type: ["image", "video", "carousel", "story"],
      campaign_status: ["draft", "active", "completed", "paused", "archived"],
      idea_status: ["proposed", "approved", "rejected", "generated"],
      job_status: ["queued", "running", "succeeded", "failed"],
      notification_kind: ["success", "warning", "ai", "info"],
      plan_type: ["trial", "pro"],
      platform: ["instagram", "facebook", "tiktok", "linkedin"],
      product_source: ["url", "upload"],
      product_status: ["processing", "ready", "needs-review"],
      team_role: ["owner", "editor", "viewer"],
    },
  },
} as const
