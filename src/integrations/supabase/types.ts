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
  public: {
    Tables: {
      canonical_items: {
        Row: {
          category: string | null
          created_at: string
          display_name: string
          id: string
          normalized_name: string
          uom: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          display_name: string
          id?: string
          normalized_name: string
          uom?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          display_name?: string
          id?: string
          normalized_name?: string
          uom?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drive_config: {
        Row: {
          created_at: string
          files_seen: number
          folder_id: string | null
          folder_name: string | null
          id: string
          last_error: string | null
          last_polled_at: string | null
          page_cursor: string | null
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          files_seen?: number
          folder_id?: string | null
          folder_name?: string | null
          id?: string
          last_error?: string | null
          last_polled_at?: string | null
          page_cursor?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          files_seen?: number
          folder_id?: string | null
          folder_name?: string | null
          id?: string
          last_error?: string | null
          last_polled_at?: string | null
          page_cursor?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      item_aliases: {
        Row: {
          alias: string
          canonical_item_id: string
          created_at: string
          id: string
          normalized_alias: string
          user_id: string
        }
        Insert: {
          alias: string
          canonical_item_id: string
          created_at?: string
          id?: string
          normalized_alias: string
          user_id?: string
        }
        Update: {
          alias?: string
          canonical_item_id?: string
          created_at?: string
          id?: string
          normalized_alias?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_aliases_canonical_item_id_fkey"
            columns: ["canonical_item_id"]
            isOneToOne: false
            referencedRelation: "canonical_items"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          canonical_item_id: string | null
          created_at: string
          id: string
          line_kind: Database["public"]["Enums"]["line_kind"]
          line_no: number | null
          name: string
          normalized_name: string | null
          quantity: number | null
          receipt_date: string | null
          receipt_id: string
          sku: string | null
          total_price: number | null
          unit_price: number | null
          uom: string | null
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          canonical_item_id?: string | null
          created_at?: string
          id?: string
          line_kind?: Database["public"]["Enums"]["line_kind"]
          line_no?: number | null
          name: string
          normalized_name?: string | null
          quantity?: number | null
          receipt_date?: string | null
          receipt_id: string
          sku?: string | null
          total_price?: number | null
          unit_price?: number | null
          uom?: string | null
          user_id?: string
          vendor_id?: string | null
        }
        Update: {
          canonical_item_id?: string | null
          created_at?: string
          id?: string
          line_kind?: Database["public"]["Enums"]["line_kind"]
          line_no?: number | null
          name?: string
          normalized_name?: string | null
          quantity?: number | null
          receipt_date?: string | null
          receipt_id?: string
          sku?: string | null
          total_price?: number | null
          unit_price?: number | null
          uom?: string | null
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_items_canonical_item_id_fkey"
            columns: ["canonical_item_id"]
            isOneToOne: false
            referencedRelation: "canonical_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          bill_to: string | null
          bill_to_is_self: boolean | null
          category: string | null
          confidence: number | null
          created_at: string
          currency: string | null
          custom_fields: Json
          date: string | null
          dedupe_key: string | null
          duplicate_of: string | null
          filename: string | null
          id: string
          invoice_no: string | null
          merchant: string | null
          needs_review: boolean
          normalized_merchant: string | null
          review_reason: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          total_variance: number | null
          updated_at: string
          upload_id: string | null
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          bill_to?: string | null
          bill_to_is_self?: boolean | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          custom_fields?: Json
          date?: string | null
          dedupe_key?: string | null
          duplicate_of?: string | null
          filename?: string | null
          id?: string
          invoice_no?: string | null
          merchant?: string | null
          needs_review?: boolean
          normalized_merchant?: string | null
          review_reason?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          total_variance?: number | null
          updated_at?: string
          upload_id?: string | null
          user_id?: string
          vendor_id?: string | null
        }
        Update: {
          bill_to?: string | null
          bill_to_is_self?: boolean | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          custom_fields?: Json
          date?: string | null
          dedupe_key?: string | null
          duplicate_of?: string | null
          filename?: string | null
          id?: string
          invoice_no?: string | null
          merchant?: string | null
          needs_review?: boolean
          normalized_merchant?: string | null
          review_reason?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          total_variance?: number | null
          updated_at?: string
          upload_id?: string | null
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "receipts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      self_identities: {
        Row: {
          created_at: string
          id: string
          label: string | null
          match_type: string
          pattern: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          match_type?: string
          pattern: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          match_type?: string
          pattern?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          attempts: number
          byte_size: number | null
          confidence: number | null
          content_sha256: string
          created_at: string
          error_message: string | null
          external_id: string | null
          extracted: Json | null
          filename: string
          id: string
          mime_type: string | null
          page_count: number | null
          parser: string | null
          processed_at: string | null
          processing_started_at: string | null
          receipt_count: number | null
          receipt_id: string | null
          source: Database["public"]["Enums"]["upload_source"]
          status: Database["public"]["Enums"]["upload_status"]
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          byte_size?: number | null
          confidence?: number | null
          content_sha256: string
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          extracted?: Json | null
          filename: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          parser?: string | null
          processed_at?: string | null
          processing_started_at?: string | null
          receipt_count?: number | null
          receipt_id?: string | null
          source?: Database["public"]["Enums"]["upload_source"]
          status?: Database["public"]["Enums"]["upload_status"]
          storage_path: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          attempts?: number
          byte_size?: number | null
          confidence?: number | null
          content_sha256?: string
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          extracted?: Json | null
          filename?: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          parser?: string | null
          processed_at?: string | null
          processing_started_at?: string | null
          receipt_count?: number | null
          receipt_id?: string | null
          source?: Database["public"]["Enums"]["upload_source"]
          status?: Database["public"]["Enums"]["upload_status"]
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploads_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts_full"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_aliases: {
        Row: {
          alias: string
          created_at: string
          id: string
          normalized_alias: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          alias: string
          created_at?: string
          id?: string
          normalized_alias: string
          user_id?: string
          vendor_id: string
        }
        Update: {
          alias?: string
          created_at?: string
          id?: string
          normalized_alias?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_aliases_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string | null
          created_at: string
          display_name: string
          id: string
          normalized_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          display_name: string
          id?: string
          normalized_name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          display_name?: string
          id?: string
          normalized_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      receipts_full: {
        Row: {
          bill_to: string | null
          bill_to_is_self: boolean | null
          category: string | null
          confidence: number | null
          created_at: string | null
          currency: string | null
          custom_fields: Json | null
          date: string | null
          dedupe_key: string | null
          duplicate_of: string | null
          filename: string | null
          id: string | null
          invoice_no: string | null
          line_items: Json | null
          merchant: string | null
          merchant_raw: string | null
          needs_review: boolean | null
          review_reason: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          total_variance: number | null
          updated_at: string | null
          upload_id: string | null
          user_id: string | null
          vendor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "receipts_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      canonicalize_custom_fields: { Args: { p: Json }; Returns: Json }
      claim_next_uploads: { Args: { p_limit?: number }; Returns: Json[] }
      claim_upload: { Args: { p_upload_id: string }; Returns: Json }
      classify_line: { Args: { p_name: string }; Returns: string }
      dataset_stats: { Args: never; Returns: Json }
      fail_upload: {
        Args: { p_error: string; p_upload_id: string }
        Returns: undefined
      }
      ingest_receipts: {
        Args: {
          p_confidence?: number
          p_extracted?: Json
          p_page_count?: number
          p_parser?: string
          p_receipts: Json
          p_upload_id: string
        }
        Returns: Json
      }
      is_self_identity: { Args: { t: string }; Returns: boolean }
      merge_canonical_items: {
        Args: { p_keep: string; p_merge: string }
        Returns: undefined
      }
      merge_vendors: {
        Args: { p_keep: string; p_merge: string }
        Returns: undefined
      }
      normalize_item: { Args: { t: string }; Returns: string }
      normalize_property: { Args: { t: string }; Returns: string }
      normalize_vendor: { Args: { t: string }; Returns: string }
      pillar_arbitrage: { Args: never; Returns: Json }
      pillar_integrity: {
        Args: never
        Returns: {
          amount: number
          date: string
          description: string
          id: string
          receipt_id: string
          severity: string
          type: string
          vendor: string
        }[]
      }
      pillar_price_drift: { Args: never; Returns: Json }
      pillar_recurring_items: { Args: never; Returns: Json }
      pillar_spending_trends: { Args: never; Returns: Json }
      pillar_vendor_bloat: { Args: never; Returns: Json }
      resolve_canonical_item: {
        Args: {
          p_category?: string
          p_name: string
          p_uom?: string
          p_user_id: string
        }
        Returns: string
      }
      resolve_vendor: {
        Args: { p_category?: string; p_name: string; p_user_id: string }
        Returns: string
      }
      safe_date: { Args: { t: string }; Returns: string }
      safe_num: { Args: { j: Json; k: string }; Returns: number }
      skip_upload: {
        Args: { p_reason: string; p_upload_id: string }
        Returns: undefined
      }
      suggest_item_merges: {
        Args: never
        Returns: {
          keep: string
          keep_name: string
          merge: string
          merge_name: string
          score: number
        }[]
      }
      suggest_vendor_merges: {
        Args: never
        Returns: {
          keep: string
          keep_name: string
          merge: string
          merge_name: string
          score: number
        }[]
      }
    }
    Enums: {
      line_kind:
        | "product"
        | "labor"
        | "discount"
        | "shipping"
        | "tax"
        | "fee"
        | "adjustment"
      upload_source: "manual" | "google_drive" | "email"
      upload_status:
        | "queued"
        | "processing"
        | "complete"
        | "needs_review"
        | "failed"
        | "skipped"
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
      line_kind: [
        "product",
        "labor",
        "discount",
        "shipping",
        "tax",
        "fee",
        "adjustment",
      ],
      upload_source: ["manual", "google_drive", "email"],
      upload_status: [
        "queued",
        "processing",
        "complete",
        "needs_review",
        "failed",
        "skipped",
      ],
    },
  },
} as const
