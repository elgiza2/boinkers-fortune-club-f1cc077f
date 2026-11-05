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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          role: string
          telegram_id: number
        }
        Insert: {
          created_at?: string
          role?: string
          telegram_id: number
        }
        Update: {
          created_at?: string
          role?: string
          telegram_id?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: number | null
          created_at: string
          details: Json | null
          id: string
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          target?: string | null
        }
        Relationships: []
      }
      boinkers_balance_ledger: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          currency: string
          id: string
          idempotency_key: string
          metadata: Json
          source: string
          source_id: string | null
          telegram_id: number
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          currency: string
          id?: string
          idempotency_key: string
          metadata?: Json
          source: string
          source_id?: string | null
          telegram_id: number
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          source?: string
          source_id?: string | null
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_balance_ledger_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_event_progress: {
        Row: {
          claimed_tiers: number[]
          event_id: string
          telegram_id: number
          tokens: number
          updated_at: string
        }
        Insert: {
          claimed_tiers?: number[]
          event_id: string
          telegram_id: number
          tokens?: number
          updated_at?: string
        }
        Update: {
          claimed_tiers?: number[]
          event_id?: string
          telegram_id?: number
          tokens?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_event_progress_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "boinkers_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boinkers_event_progress_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_events: {
        Row: {
          created_at: string
          definition: Json
          ends_at: string
          event_key: string
          id: string
          name: string
          run_number: number
          starts_at: string
        }
        Insert: {
          created_at?: string
          definition?: Json
          ends_at: string
          event_key: string
          id?: string
          name: string
          run_number: number
          starts_at: string
        }
        Update: {
          created_at?: string
          definition?: Json
          ends_at?: string
          event_key?: string
          id?: string
          name?: string
          run_number?: number
          starts_at?: string
        }
        Relationships: []
      }
      boinkers_milestone_claims: {
        Row: {
          claimed_at: string
          milestone_index: number
          reward: Json
          telegram_id: number
        }
        Insert: {
          claimed_at?: string
          milestone_index: number
          reward?: Json
          telegram_id: number
        }
        Update: {
          claimed_at?: string
          milestone_index?: number
          reward?: Json
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_milestone_claims_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_nft_items: {
        Row: {
          active: boolean
          image_url: string | null
          item_index: number
          metadata: Json
          name: string
          price_ton: number
          rarity: string | null
        }
        Insert: {
          active?: boolean
          image_url?: string | null
          item_index: number
          metadata?: Json
          name: string
          price_ton?: number
          rarity?: string | null
        }
        Update: {
          active?: boolean
          image_url?: string | null
          item_index?: number
          metadata?: Json
          name?: string
          price_ton?: number
          rarity?: string | null
        }
        Relationships: []
      }
      boinkers_nft_orders: {
        Row: {
          created_at: string
          id: string
          item_index: number
          price_ton: number
          status: string
          telegram_id: number
          tx_hash: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_index: number
          price_ton: number
          status?: string
          telegram_id: number
          tx_hash?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_index?: number
          price_ton?: number
          status?: string
          telegram_id?: number
          tx_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_nft_orders_item_index_fkey"
            columns: ["item_index"]
            isOneToOne: false
            referencedRelation: "boinkers_nft_items"
            referencedColumns: ["item_index"]
          },
          {
            foreignKeyName: "boinkers_nft_orders_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_pass_claims: {
        Row: {
          claimed_at: string
          pass_level: number
          premium: boolean
          reward: Json
          telegram_id: number
        }
        Insert: {
          claimed_at?: string
          pass_level: number
          premium?: boolean
          reward?: Json
          telegram_id: number
        }
        Update: {
          claimed_at?: string
          pass_level?: number
          premium?: boolean
          reward?: Json
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_pass_claims_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_players: {
        Row: {
          coins: number
          created_at: string
          first_name: string | null
          language_code: string | null
          last_name: string | null
          last_seen_at: string
          last_solo_claim_at: string
          last_spin_regen_at: string
          level: number
          locale: string
          merge_best: number
          merge_board: Json
          part_body: number
          part_gear: number
          part_head: number
          pass_level: number
          pass_xp: number
          photo_url: string | null
          premium: boolean
          referred_by: number | null
          solo: number
          solo_bank: number
          sound: boolean
          spins: number
          telegram_id: number
          tickets: number
          tokens: number
          ton: number
          updated_at: string
          username: string | null
          wallet_address: string | null
          wallet_network: string | null
          wallet_verified: boolean
        }
        Insert: {
          coins?: number
          created_at?: string
          first_name?: string | null
          language_code?: string | null
          last_name?: string | null
          last_seen_at?: string
          last_solo_claim_at?: string
          last_spin_regen_at?: string
          level?: number
          locale?: string
          merge_best?: number
          merge_board?: Json
          part_body?: number
          part_gear?: number
          part_head?: number
          pass_level?: number
          pass_xp?: number
          photo_url?: string | null
          premium?: boolean
          referred_by?: number | null
          solo?: number
          solo_bank?: number
          sound?: boolean
          spins?: number
          telegram_id: number
          tickets?: number
          tokens?: number
          ton?: number
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_network?: string | null
          wallet_verified?: boolean
        }
        Update: {
          coins?: number
          created_at?: string
          first_name?: string | null
          language_code?: string | null
          last_name?: string | null
          last_seen_at?: string
          last_solo_claim_at?: string
          last_spin_regen_at?: string
          level?: number
          locale?: string
          merge_best?: number
          merge_board?: Json
          part_body?: number
          part_gear?: number
          part_head?: number
          pass_level?: number
          pass_xp?: number
          photo_url?: string | null
          premium?: boolean
          referred_by?: number | null
          solo?: number
          solo_bank?: number
          sound?: boolean
          spins?: number
          telegram_id?: number
          tickets?: number
          tokens?: number
          ton?: number
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_network?: string | null
          wallet_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_players_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_referrals: {
        Row: {
          activity_rewarded_at: string | null
          created_at: string
          referred_id: number
          referrer_id: number
          signup_rewarded_at: string | null
          source: string
        }
        Insert: {
          activity_rewarded_at?: string | null
          created_at?: string
          referred_id: number
          referrer_id: number
          signup_rewarded_at?: string | null
          source?: string
        }
        Update: {
          activity_rewarded_at?: string | null
          created_at?: string
          referred_id?: number
          referrer_id?: number
          signup_rewarded_at?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
          {
            foreignKeyName: "boinkers_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_shop_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          idempotency_key: string
          payment_ref: string | null
          price: number
          price_currency: string
          product_id: string
          status: string
          telegram_id: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key: string
          payment_ref?: string | null
          price: number
          price_currency: string
          product_id: string
          status?: string
          telegram_id: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string
          payment_ref?: string | null
          price?: number
          price_currency?: string
          product_id?: string
          status?: string
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_shop_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "boinkers_shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boinkers_shop_orders_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_shop_products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          price_currency: string
          reward: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id: string
          name: string
          price: number
          price_currency: string
          reward?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          price_currency?: string
          reward?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      boinkers_slot_rounds: {
        Row: {
          bet: number
          created_at: string
          event_id: number | null
          id: string
          idempotency_key: string
          live_hits: Json
          payout: Json
          reels: Json
          telegram_id: number
        }
        Insert: {
          bet: number
          created_at?: string
          event_id?: number | null
          id?: string
          idempotency_key: string
          live_hits?: Json
          payout?: Json
          reels: Json
          telegram_id: number
        }
        Update: {
          bet?: number
          created_at?: string
          event_id?: number | null
          id?: string
          idempotency_key?: string
          live_hits?: Json
          payout?: Json
          reels?: Json
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_slot_rounds_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_task_completions: {
        Row: {
          completed_at: string | null
          created_at: string
          proof: Json
          status: string
          task_id: string
          telegram_id: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          proof?: Json
          status?: string
          task_id: string
          telegram_id: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          proof?: Json
          status?: string
          task_id?: string
          telegram_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "boinkers_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boinkers_task_completions_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_tasks: {
        Row: {
          active: boolean
          created_at: string
          id: string
          reward: Json
          sort_order: number
          title: string
          updated_at: string
          url: string | null
          verification_kind: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id: string
          reward?: Json
          sort_order?: number
          title: string
          updated_at?: string
          url?: string | null
          verification_kind?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          reward?: Json
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string | null
          verification_kind?: string
        }
        Relationships: []
      }
      boinkers_wallet_transactions: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          currency: string
          direction: string
          id: string
          metadata: Json
          provider_ref: string | null
          status: string
          telegram_id: number
          tx_hash: string | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          currency: string
          direction: string
          id?: string
          metadata?: Json
          provider_ref?: string | null
          status?: string
          telegram_id: number
          tx_hash?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          direction?: string
          id?: string
          metadata?: Json
          provider_ref?: string | null
          status?: string
          telegram_id?: number
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_wallet_transactions_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      boinkers_wheel_rounds: {
        Row: {
          bet: number
          created_at: string
          id: string
          idempotency_key: string
          payout: Json
          prize_index: number
          telegram_id: number
        }
        Insert: {
          bet: number
          created_at?: string
          id?: string
          idempotency_key: string
          payout?: Json
          prize_index: number
          telegram_id: number
        }
        Update: {
          bet?: number
          created_at?: string
          id?: string
          idempotency_key?: string
          payout?: Json
          prize_index?: number
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "boinkers_wheel_rounds_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "boinkers_players"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      competition_settings: {
        Row: {
          end_at: string
          id: number
          latest_x_post_url: string | null
          payout_network: string
          start_at: string
          task_points: Json
          updated_at: string
        }
        Insert: {
          end_at?: string
          id?: number
          latest_x_post_url?: string | null
          payout_network?: string
          start_at?: string
          task_points?: Json
          updated_at?: string
        }
        Update: {
          end_at?: string
          id?: number
          latest_x_post_url?: string | null
          payout_network?: string
          start_at?: string
          task_points?: Json
          updated_at?: string
        }
        Relationships: []
      }
      megsy_accounts: {
        Row: {
          created_at: string
          email: string
          found: boolean
          is_premium: boolean
          megsy_user_id: string | null
          participant_id: number
          plan: string | null
          referral_link: string | null
          subscribed_referrals: number
          total_referrals: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          found: boolean
          is_premium: boolean
          megsy_user_id?: string | null
          participant_id: number
          plan?: string | null
          referral_link?: string | null
          subscribed_referrals?: number
          total_referrals?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          found?: boolean
          is_premium?: boolean
          megsy_user_id?: string | null
          participant_id?: number
          plan?: string | null
          referral_link?: string | null
          subscribed_referrals?: number
          total_referrals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "megsy_accounts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          banned: boolean
          created_at: string
          first_name: string | null
          flagged: boolean
          id: number
          instagram_username: string | null
          is_premium: boolean | null
          is_subscribed: boolean
          language_code: string | null
          last_name: string | null
          last_rank: number | null
          megsy_email: string | null
          megsy_user_id: string | null
          photo_url: string | null
          points: number
          referred_by: number | null
          updated_at: string
          username: string | null
          verified_referrals: number
          x_username: string | null
        }
        Insert: {
          banned?: boolean
          created_at?: string
          first_name?: string | null
          flagged?: boolean
          id: number
          instagram_username?: string | null
          is_premium?: boolean | null
          is_subscribed?: boolean
          language_code?: string | null
          last_name?: string | null
          last_rank?: number | null
          megsy_email?: string | null
          megsy_user_id?: string | null
          photo_url?: string | null
          points?: number
          referred_by?: number | null
          updated_at?: string
          username?: string | null
          verified_referrals?: number
          x_username?: string | null
        }
        Update: {
          banned?: boolean
          created_at?: string
          first_name?: string | null
          flagged?: boolean
          id?: number
          instagram_username?: string | null
          is_premium?: boolean | null
          is_subscribed?: boolean
          language_code?: string | null
          last_name?: string | null
          last_rank?: number | null
          megsy_email?: string | null
          megsy_user_id?: string | null
          photo_url?: string | null
          points?: number
          referred_by?: number | null
          updated_at?: string
          username?: string | null
          verified_referrals?: number
          x_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          address: string | null
          amount: number
          created_at: string
          id: string
          network: string | null
          participant_id: number
          rank: number
          status: string
          tx_hash: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amount: number
          created_at?: string
          id?: string
          network?: string | null
          participant_id: number
          rank: number
          status?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          amount?: number
          created_at?: string
          id?: string
          network?: string | null
          participant_id?: number
          rank?: number
          status?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_events: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          referred_id: number
          referrer_id: number
          status: string
          subscription_id: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          referred_id: number
          referrer_id: number
          status?: string
          subscription_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          referred_id?: number
          referrer_id?: number
          status?: string
          subscription_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_events_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_events_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          email: string | null
          external_id: string
          id: string
          interval: string | null
          megsy_user_id: string | null
          paid_at: string | null
          participant_id: number | null
          plan: string | null
          raw: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          external_id: string
          id?: string
          interval?: string | null
          megsy_user_id?: string | null
          paid_at?: string | null
          participant_id?: number | null
          plan?: string | null
          raw?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          external_id?: string
          id?: string
          interval?: string | null
          megsy_user_id?: string | null
          paid_at?: string | null
          participant_id?: number | null
          plan?: string | null
          raw?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          created_at: string
          id: string
          participant_id: number
          points: number
          proof: string | null
          status: string
          task_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: number
          points?: number
          proof?: string | null
          status?: string
          task_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: number
          points?: number
          proof?: string | null
          status?: string
          task_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_ad_views: {
        Row: {
          confirmed_at: string | null
          consumed_by: string | null
          created_at: string
          id: string
          user_id: number
          zone_id: string
        }
        Insert: {
          confirmed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          id?: string
          user_id: number
          zone_id?: string
        }
        Update: {
          confirmed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          id?: string
          user_id?: number
          zone_id?: string
        }
        Relationships: []
      }
      tsla_arcade_rounds: {
        Row: {
          created_at: string
          game: string
          id: string
          score: number
          state: Json
          status: string
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          score?: number
          state?: Json
          status?: string
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          score?: number
          state?: Json
          status?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_arcade_rounds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_bot_campaigns: {
        Row: {
          created_at: string
          failed: number
          id: string
          last_user_id: number
          lease_token: string | null
          lease_until: string | null
          max_user_id: number
          messages: Json
          pause_reason: string | null
          sent: number
          status: string
        }
        Insert: {
          created_at?: string
          failed?: number
          id?: string
          last_user_id?: number
          lease_token?: string | null
          lease_until?: string | null
          max_user_id: number
          messages: Json
          pause_reason?: string | null
          sent?: number
          status?: string
        }
        Update: {
          created_at?: string
          failed?: number
          id?: string
          last_user_id?: number
          lease_token?: string | null
          lease_until?: string | null
          max_user_id?: number
          messages?: Json
          pause_reason?: string | null
          sent?: number
          status?: string
        }
        Relationships: []
      }
      tsla_case_items: {
        Row: {
          animation_url: string | null
          case_id: string
          created_at: string
          gram_amount: number
          id: string
          image_url: string | null
          kind: string
          name: string
          telegram_gift_id: string | null
          value_stars: number
          weight: number
        }
        Insert: {
          animation_url?: string | null
          case_id: string
          created_at?: string
          gram_amount?: number
          id?: string
          image_url?: string | null
          kind: string
          name: string
          telegram_gift_id?: string | null
          value_stars: number
          weight: number
        }
        Update: {
          animation_url?: string | null
          case_id?: string
          created_at?: string
          gram_amount?: number
          id?: string
          image_url?: string | null
          kind?: string
          name?: string
          telegram_gift_id?: string | null
          value_stars?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_case_items_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "tsla_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_case_openings: {
        Row: {
          case_id: string
          charge_id: string | null
          created_at: string
          gift_id: string | null
          id: string
          opened_at: string | null
          pay_method: string
          price_gram: number | null
          price_stars: number
          status: string
          tx_hash: string | null
          user_id: number
        }
        Insert: {
          case_id: string
          charge_id?: string | null
          created_at?: string
          gift_id?: string | null
          id?: string
          opened_at?: string | null
          pay_method: string
          price_gram?: number | null
          price_stars: number
          status?: string
          tx_hash?: string | null
          user_id: number
        }
        Update: {
          case_id?: string
          charge_id?: string | null
          created_at?: string
          gift_id?: string | null
          id?: string
          opened_at?: string | null
          pay_method?: string
          price_gram?: number | null
          price_stars?: number
          status?: string
          tx_hash?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_case_openings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "tsla_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tsla_case_openings_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "tsla_user_gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tsla_case_openings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_cases: {
        Row: {
          active: boolean
          created_at: string
          free_kind: string | null
          id: string
          image_url: string | null
          name: string
          price_gram: number
          price_stars: number
          sort: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          free_kind?: string | null
          id: string
          image_url?: string | null
          name: string
          price_gram?: number
          price_stars: number
          sort?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          free_kind?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_gram?: number
          price_stars?: number
          sort?: number
        }
        Relationships: []
      }
      tsla_deposits: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          paid_at: string | null
          ref: string | null
          status: string
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: string
          paid_at?: string | null
          ref?: string | null
          status?: string
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          paid_at?: string | null
          ref?: string | null
          status?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_event_entries: {
        Row: {
          created_at: string
          event_id: string
          status: string
          tx_hash: string | null
          user_id: number
        }
        Insert: {
          created_at?: string
          event_id: string
          status?: string
          tx_hash?: string | null
          user_id: number
        }
        Update: {
          created_at?: string
          event_id?: string
          status?: string
          tx_hash?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_event_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "tsla_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tsla_event_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_events: {
        Row: {
          active: boolean
          chat_id: string | null
          created_at: string
          description: string
          ends_at: string
          entry_gram: number
          id: string
          image_url: string | null
          kind: string
          link: string | null
          prize: string
          title: string
          winner_user_id: number | null
        }
        Insert: {
          active?: boolean
          chat_id?: string | null
          created_at?: string
          description?: string
          ends_at: string
          entry_gram?: number
          id?: string
          image_url?: string | null
          kind: string
          link?: string | null
          prize: string
          title: string
          winner_user_id?: number | null
        }
        Update: {
          active?: boolean
          chat_id?: string | null
          created_at?: string
          description?: string
          ends_at?: string
          entry_gram?: number
          id?: string
          image_url?: string | null
          kind?: string
          link?: string | null
          prize?: string
          title?: string
          winner_user_id?: number | null
        }
        Relationships: []
      }
      tsla_free_claims: {
        Row: {
          created_at: string
          kind: string
          opening_id: string | null
          period: string
          user_id: number
        }
        Insert: {
          created_at?: string
          kind: string
          opening_id?: string | null
          period: string
          user_id: number
        }
        Update: {
          created_at?: string
          kind?: string
          opening_id?: string | null
          period?: string
          user_id?: number
        }
        Relationships: []
      }
      tsla_game_spins: {
        Row: {
          created_at: string
          last_spun_at: string | null
          reward: number
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          last_spun_at?: string | null
          reward?: number
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          last_spun_at?: string | null
          reward?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: []
      }
      tsla_market_snapshots: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data: Json
          id: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tsla_nfts: {
        Row: {
          created_at: string
          id: string
          item_index: number | null
          mint_status: string
          nft_address: string | null
          price_gram: number
          tier: number
          tx_hash: string | null
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_index?: number | null
          mint_status?: string
          nft_address?: string | null
          price_gram?: number
          tier?: number
          tx_hash?: string | null
          user_id: number
        }
        Update: {
          created_at?: string
          id?: string
          item_index?: number | null
          mint_status?: string
          nft_address?: string | null
          price_gram?: number
          tier?: number
          tx_hash?: string | null
          user_id?: number
        }
        Relationships: []
      }
      tsla_payout_lock: {
        Row: {
          expires_at: string | null
          id: number
          token: string | null
        }
        Insert: {
          expires_at?: string | null
          id: number
          token?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: number
          token?: string | null
        }
        Relationships: []
      }
      tsla_referral_goals: {
        Row: {
          claimed_at: string
          goal: number
          reward: number
          user_id: number
        }
        Insert: {
          claimed_at?: string
          goal: number
          reward: number
          user_id: number
        }
        Update: {
          claimed_at?: string
          goal?: number
          reward?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_referral_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_star_rewards: {
        Row: {
          amount: number
          created_at: string
          source: string
          source_key: string
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          source: string
          source_key: string
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          source?: string
          source_key?: string
          user_id?: number
        }
        Relationships: []
      }
      tsla_task_apps: {
        Row: {
          category: string
          created_at: string
          id: string
          image: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image?: string
          name?: string
        }
        Relationships: []
      }
      tsla_task_completions: {
        Row: {
          created_at: string
          task_id: string
          user_id: number
        }
        Insert: {
          created_at?: string
          task_id: string
          user_id: number
        }
        Update: {
          created_at?: string
          task_id?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tsla_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_task_verifications: {
        Row: {
          active: boolean
          api_key: string
          api_key_param: string
          attribution_field: string | null
          base_url: string
          created_at: string
          endpoint_path: string
          http_method: string
          provider: string
          require_attribution: boolean
          success_field: string
          task_id: string
          updated_at: string
          user_id_param: string
        }
        Insert: {
          active?: boolean
          api_key: string
          api_key_param?: string
          attribution_field?: string | null
          base_url: string
          created_at?: string
          endpoint_path: string
          http_method?: string
          provider: string
          require_attribution?: boolean
          success_field?: string
          task_id: string
          updated_at?: string
          user_id_param?: string
        }
        Update: {
          active?: boolean
          api_key?: string
          api_key_param?: string
          attribution_field?: string | null
          base_url?: string
          created_at?: string
          endpoint_path?: string
          http_method?: string
          provider?: string
          require_attribution?: boolean
          success_field?: string
          task_id?: string
          updated_at?: string
          user_id_param?: string
        }
        Relationships: [
          {
            foreignKeyName: "tsla_task_verifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tsla_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_tasks: {
        Row: {
          active: boolean
          app_category: string
          app_id: string | null
          app_image: string | null
          app_name: string | null
          chat_id: string | null
          created_at: string
          id: string
          image_url: string | null
          kind: string
          link: string
          reward: number
          sort: number
          title: string
          title_i18n: Json
        }
        Insert: {
          active?: boolean
          app_category?: string
          app_id?: string | null
          app_image?: string | null
          app_name?: string | null
          chat_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          link: string
          reward?: number
          sort?: number
          title: string
          title_i18n?: Json
        }
        Update: {
          active?: boolean
          app_category?: string
          app_id?: string | null
          app_image?: string | null
          app_name?: string | null
          chat_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          link?: string
          reward?: number
          sort?: number
          title?: string
          title_i18n?: Json
        }
        Relationships: [
          {
            foreignKeyName: "tsla_tasks_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "tsla_task_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_tg_users: {
        Row: {
          balance: number
          created_at: string
          first_name: string | null
          gram_balance: number
          id: number
          language_code: string | null
          mining_claim_count: number
          mining_pending: number
          mining_rate_daily: number
          mining_settled_at: string | null
          mining_started_at: string | null
          photo_url: string | null
          power_level: number
          referral_earned: number
          referral_mining_paid: boolean
          referral_rate: number
          referral_signup_paid: boolean
          referral_wallet_paid: boolean
          referred_by: number | null
          stars_balance: number
          starter_credit_applied: boolean
          subscribed_until: string | null
          tickets: number
          tickets_daily_at: string | null
          username: string | null
          wallet_address: string | null
          wallet_nonce: string | null
          wallet_verified: boolean
        }
        Insert: {
          balance?: number
          created_at?: string
          first_name?: string | null
          gram_balance?: number
          id: number
          language_code?: string | null
          mining_claim_count?: number
          mining_pending?: number
          mining_rate_daily?: number
          mining_settled_at?: string | null
          mining_started_at?: string | null
          photo_url?: string | null
          power_level?: number
          referral_earned?: number
          referral_mining_paid?: boolean
          referral_rate?: number
          referral_signup_paid?: boolean
          referral_wallet_paid?: boolean
          referred_by?: number | null
          stars_balance?: number
          starter_credit_applied?: boolean
          subscribed_until?: string | null
          tickets?: number
          tickets_daily_at?: string | null
          username?: string | null
          wallet_address?: string | null
          wallet_nonce?: string | null
          wallet_verified?: boolean
        }
        Update: {
          balance?: number
          created_at?: string
          first_name?: string | null
          gram_balance?: number
          id?: number
          language_code?: string | null
          mining_claim_count?: number
          mining_pending?: number
          mining_rate_daily?: number
          mining_settled_at?: string | null
          mining_started_at?: string | null
          photo_url?: string | null
          power_level?: number
          referral_earned?: number
          referral_mining_paid?: boolean
          referral_rate?: number
          referral_signup_paid?: boolean
          referral_wallet_paid?: boolean
          referred_by?: number | null
          stars_balance?: number
          starter_credit_applied?: boolean
          subscribed_until?: string | null
          tickets?: number
          tickets_daily_at?: string | null
          username?: string | null
          wallet_address?: string | null
          wallet_nonce?: string | null
          wallet_verified?: boolean
        }
        Relationships: []
      }
      tsla_ticket_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          source_key: string
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          source_key: string
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          source_key?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_ticket_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_user_gifts: {
        Row: {
          animation_url: string | null
          created_at: string
          error: string | null
          gram_amount: number
          id: string
          image_url: string | null
          item_id: string | null
          kind: string
          name: string
          status: string
          telegram_gift_id: string | null
          updated_at: string
          user_id: number
          value_stars: number
        }
        Insert: {
          animation_url?: string | null
          created_at?: string
          error?: string | null
          gram_amount?: number
          id?: string
          image_url?: string | null
          item_id?: string | null
          kind: string
          name: string
          status?: string
          telegram_gift_id?: string | null
          updated_at?: string
          user_id: number
          value_stars: number
        }
        Update: {
          animation_url?: string | null
          created_at?: string
          error?: string | null
          gram_amount?: number
          id?: string
          image_url?: string | null
          item_id?: string | null
          kind?: string
          name?: string
          status?: string
          telegram_gift_id?: string | null
          updated_at?: string
          user_id?: number
          value_stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_user_gifts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "tsla_case_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tsla_user_gifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_withdrawals: {
        Row: {
          amount: number
          broadcast_boc: string | null
          broadcast_error: string | null
          broadcast_seqno: number | null
          created_at: string
          fee_tsla: number
          fee_tx: string | null
          id: string
          status: string
          to_address: string
          tx_hash: string | null
          user_id: number
        }
        Insert: {
          amount: number
          broadcast_boc?: string | null
          broadcast_error?: string | null
          broadcast_seqno?: number | null
          created_at?: string
          fee_tsla?: number
          fee_tx?: string | null
          id?: string
          status?: string
          to_address: string
          tx_hash?: string | null
          user_id: number
        }
        Update: {
          amount?: number
          broadcast_boc?: string | null
          broadcast_error?: string | null
          broadcast_seqno?: number | null
          created_at?: string
          fee_tsla?: number
          fee_tx?: string | null
          id?: string
          status?: string
          to_address?: string
          tx_hash?: string | null
          user_id?: number
        }
        Relationships: []
      }
      wallets: {
        Row: {
          address: string
          created_at: string
          network: string
          participant_id: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          address: string
          created_at?: string
          network: string
          participant_id: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          address?: string
          created_at?: string
          network?: string
          participant_id?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "wallets_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sync_megsy_account: {
        Args: {
          p_email: string
          p_found: boolean
          p_participant_id: number
          p_plan: string
          p_premium: boolean
          p_referral_link: string
          p_subscribed: number
          p_total: number
          p_user_id: string
        }
        Returns: undefined
      }
      tesla_campaign_lock: {
        Args: { p_id: string; p_token: string }
        Returns: boolean
      }
      tesla_mining_claim: { Args: { p_user_id: number }; Returns: Json }
      tesla_paid_withdrawal: {
        Args: { p_address: string; p_amount: number; p_user_id: number }
        Returns: string
      }
      tesla_payout_lock: { Args: { p_token: string }; Returns: boolean }
      tesla_refund_withdrawal: { Args: { p_id: string }; Returns: undefined }
      tesla_reserve_withdrawal: {
        Args: {
          p_address: string
          p_amount: number
          p_fee: string
          p_user_id: number
        }
        Returns: string
      }
      tesla_spin_daily: { Args: { p_user_id: number }; Returns: Json }
      tesla_sync_power: {
        Args: { p_level: number; p_rate: number; p_user_id: number }
        Returns: undefined
      }
      tsla_arcade_leaderboard: {
        Args: { p_game: string }
        Returns: {
          best: number
          first_name: string
          photo_url: string
          user_id: number
          username: string
        }[]
      }
      tsla_arcade_start: {
        Args: { p_game: string; p_state: Json; p_user: number }
        Returns: {
          created_at: string
          game: string
          id: string
          score: number
          state: Json
          status: string
          updated_at: string
          user_id: number
        }
        SetofOptions: {
          from: "*"
          to: "tsla_arcade_rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      tsla_arcade_update: {
        Args: {
          p_id: string
          p_score: number
          p_state: Json
          p_status: string
          p_user: number
          p_version: string
        }
        Returns: {
          created_at: string
          game: string
          id: string
          score: number
          state: Json
          status: string
          updated_at: string
          user_id: number
        }
        SetofOptions: {
          from: "*"
          to: "tsla_arcade_rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      tsla_award_opening: { Args: { p_opening: string }; Returns: string }
      tsla_claim_referral_goal: {
        Args: { p_goal: number; p_user_id: number }
        Returns: number
      }
      tsla_claim_star_reward: {
        Args: { p_source: string; p_user: number }
        Returns: number
      }
      tsla_credit_stars: {
        Args: { p_amount: number; p_user: number }
        Returns: number
      }
      tsla_daily_tickets: { Args: { p_user: number }; Returns: number }
      tsla_day_start: { Args: never; Returns: string }
      tsla_free_status: { Args: { p_user: number }; Returns: Json }
      tsla_grant_tickets: {
        Args: {
          p_amount: number
          p_key: string
          p_source: string
          p_user: number
        }
        Returns: undefined
      }
      tsla_open_free: {
        Args: { p_case: string; p_user: number }
        Returns: string
      }
      tsla_open_with_balance: {
        Args: { p_case: string; p_user: number }
        Returns: string
      }
      tsla_open_with_gram_balance: {
        Args: { p_case: string; p_user: number }
        Returns: string
      }
      tsla_reserve_gift_send: {
        Args: { p_gift: string; p_user: number }
        Returns: {
          animation_url: string | null
          created_at: string
          error: string | null
          gram_amount: number
          id: string
          image_url: string | null
          item_id: string | null
          kind: string
          name: string
          status: string
          telegram_gift_id: string | null
          updated_at: string
          user_id: number
          value_stars: number
        }
        SetofOptions: {
          from: "*"
          to: "tsla_user_gifts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      tsla_sell_gift: {
        Args: { p_gift: string; p_percent: number; p_user: number }
        Returns: number
      }
      tsla_sell_gift_to: {
        Args: {
          p_currency: string
          p_gift: string
          p_percent: number
          p_user: number
        }
        Returns: number
      }
      tsla_settle_gram_deposit: {
        Args: { p_amount: number; p_dep: string; p_tx: string; p_user: number }
        Returns: number
      }
      tsla_settle_gram_opening: {
        Args: { p_opening: string; p_tx: string; p_user: number }
        Returns: string
      }
      tsla_settle_stars_deposit: {
        Args: {
          p_amount: number
          p_charge: string
          p_dep: string
          p_user: number
        }
        Returns: number
      }
      tsla_settle_stars_opening: {
        Args: {
          p_amount: number
          p_charge: string
          p_opening: string
          p_user: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
