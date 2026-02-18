/**
 * Database types for Supabase Daggerheart tables
 *
 * Generated from Supabase schema and customized for dagger-app.
 * These types are shared between the API backend and web frontend.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Complete Database type for Supabase client typing
 */
export type Database = {
  public: {
    Tables: {
      daggerheart_frames: {
        Row: {
          id: string;
          name: string;
          description: string;
          themes: string[] | null;
          typical_adversaries: string[] | null;
          lore: string | null;
          embedding: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          themes?: string[] | null;
          typical_adversaries?: string[] | null;
          lore?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          themes?: string[] | null;
          typical_adversaries?: string[] | null;
          lore?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_adversaries: {
        Row: {
          id: string;
          name: string;
          tier: number;
          type: string;
          description: string;
          motives_tactics: string[] | null;
          difficulty: number;
          thresholds: string | null;
          hp: number;
          stress: number;
          atk: string;
          weapon: string;
          range: string;
          dmg: string;
          experiences: Json | null;
          features: Json[] | null;
          searchable_text: string | null;
          embedding: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tier: number;
          type: string;
          description: string;
          motives_tactics?: string[] | null;
          difficulty: number;
          thresholds?: string | null;
          hp: number;
          stress: number;
          atk: string;
          weapon: string;
          range: string;
          dmg: string;
          experiences?: Json | null;
          features?: Json[] | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: number;
          type?: string;
          description?: string;
          motives_tactics?: string[] | null;
          difficulty?: number;
          thresholds?: string | null;
          hp?: number;
          stress?: number;
          atk?: string;
          weapon?: string;
          range?: string;
          dmg?: string;
          experiences?: Json | null;
          features?: Json[] | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_items: {
        Row: {
          id: string;
          name: string;
          description: string;
          item_type: string | null;
          searchable_text: string | null;
          embedding: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          item_type?: string | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          item_type?: string | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_consumables: {
        Row: {
          id: string;
          name: string;
          description: string;
          uses: number | null;
          searchable_text: string | null;
          embedding: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          uses?: number | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          uses?: number | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_weapons: {
        Row: {
          id: string;
          name: string;
          weapon_category: string;
          tier: number;
          trait: string;
          range: string;
          damage: string;
          burden: string | null;
          feature: string | null;
          searchable_text: string | null;
          embedding: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          weapon_category: string;
          tier: number;
          trait: string;
          range: string;
          damage: string;
          burden?: string | null;
          feature?: string | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          weapon_category?: string;
          tier?: number;
          trait?: string;
          range?: string;
          damage?: string;
          burden?: string | null;
          feature?: string | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_armor: {
        Row: {
          id: string;
          name: string;
          tier: number;
          base_thresholds: string;
          base_score: number;
          feature: string | null;
          searchable_text: string | null;
          embedding: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tier: number;
          base_thresholds: string;
          base_score: number;
          feature?: string | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: number;
          base_thresholds?: string;
          base_score?: number;
          feature?: string | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_environments: {
        Row: {
          id: string;
          name: string;
          tier: number;
          type: string | null;
          description: string;
          impulses: string[] | null;
          difficulty: number | null;
          potential_adversaries: string[] | null;
          features: Json[] | null;
          throughline: string | null;
          searchable_text: string | null;
          embedding: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tier: number;
          type?: string | null;
          description: string;
          impulses?: string[] | null;
          difficulty?: number | null;
          potential_adversaries?: string[] | null;
          features?: Json[] | null;
          throughline?: string | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: number;
          type?: string | null;
          description?: string;
          impulses?: string[] | null;
          difficulty?: number | null;
          potential_adversaries?: string[] | null;
          features?: Json[] | null;
          throughline?: string | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_ancestries: {
        Row: {
          id: string;
          name: string;
          description: string;
          features: Json[] | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          features?: Json[] | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          features?: Json[] | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_classes: {
        Row: {
          id: string;
          name: string;
          description: string;
          domains: string[] | null;
          starting_evasion: number;
          starting_hp: number;
          class_items: string[] | null;
          hope_feature: Json | null;
          class_feature: Json | null;
          background_questions: string[] | null;
          connection_questions: string[] | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          domains?: string[] | null;
          starting_evasion: number;
          starting_hp: number;
          class_items?: string[] | null;
          hope_feature?: Json | null;
          class_feature?: Json | null;
          background_questions?: string[] | null;
          connection_questions?: string[] | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          domains?: string[] | null;
          starting_evasion?: number;
          starting_hp?: number;
          class_items?: string[] | null;
          hope_feature?: Json | null;
          class_feature?: Json | null;
          background_questions?: string[] | null;
          connection_questions?: string[] | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_subclasses: {
        Row: {
          id: string;
          name: string;
          parent_class: string;
          description: string;
          features: Json[] | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          parent_class: string;
          description: string;
          features?: Json[] | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          parent_class?: string;
          description?: string;
          features?: Json[] | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_domains: {
        Row: {
          id: string;
          name: string;
          description: string;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_abilities: {
        Row: {
          id: string;
          name: string;
          ability_type: string;
          parent_class: string | null;
          parent_subclass: string | null;
          domain: string | null;
          description: string;
          prerequisites: string[] | null;
          level_requirement: number | null;
          searchable_text: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          ability_type: string;
          parent_class?: string | null;
          parent_subclass?: string | null;
          domain?: string | null;
          description: string;
          prerequisites?: string[] | null;
          level_requirement?: number | null;
          searchable_text?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          ability_type?: string;
          parent_class?: string | null;
          parent_subclass?: string | null;
          domain?: string | null;
          description?: string;
          prerequisites?: string[] | null;
          level_requirement?: number | null;
          searchable_text?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_communities: {
        Row: {
          id: string;
          name: string;
          description: string;
          community_moves: string[] | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          community_moves?: string[] | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          community_moves?: string[] | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_locations: {
        Row: {
          id: string;
          name: string;
          tier: number;
          themes: string[];
          concept: string;
          description: string;
          distinctions: Json;
          gm_principles: Json;
          landmarks: Json;
          settlements: Json;
          factions: Json;
          moments_of_hope: string[];
          moments_of_fear: string[];
          rumors: string[];
          loot: Json;
          adversaries: Json;
          environments: Json;
          searchable_text: string | null;
          embedding: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tier: number;
          themes?: string[];
          concept: string;
          description: string;
          distinctions?: Json;
          gm_principles?: Json;
          landmarks?: Json;
          settlements?: Json;
          factions?: Json;
          moments_of_hope?: string[];
          moments_of_fear?: string[];
          rumors?: string[];
          loot?: Json;
          adversaries?: Json;
          environments?: Json;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: number;
          themes?: string[];
          concept?: string;
          description?: string;
          distinctions?: Json;
          gm_principles?: Json;
          landmarks?: Json;
          settlements?: Json;
          factions?: Json;
          moments_of_hope?: string[];
          moments_of_fear?: string[];
          rumors?: string[];
          loot?: Json;
          adversaries?: Json;
          environments?: Json;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_npcs: {
        Row: {
          id: string;
          name: string;
          tier: number;
          role: string;
          description: string;
          appearance: string;
          personality: string;
          motivations: string[] | null;
          connections: string[] | null;
          notable_traits: string[] | null;
          features: Json[] | null;
          searchable_text: string | null;
          embedding: string | null;
          source_book: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tier: number;
          role: string;
          description: string;
          appearance: string;
          personality: string;
          motivations?: string[] | null;
          connections?: string[] | null;
          notable_traits?: string[] | null;
          features?: Json[] | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: number;
          role?: string;
          description?: string;
          appearance?: string;
          personality?: string;
          motivations?: string[] | null;
          connections?: string[] | null;
          notable_traits?: string[] | null;
          features?: Json[] | null;
          searchable_text?: string | null;
          embedding?: string | null;
          source_book?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      daggerheart_adventures: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          frame: string;
          focus: string;
          state: string | null;
          config: Json;
          movements: Json[] | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
          exported_at: string | null;
          scaffold_regenerations_used: number | null;
          expansion_regenerations_used: number | null;
          movements_jsonb_schema_version: number | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          frame: string;
          focus: string;
          state?: string | null;
          config?: Json;
          movements?: Json[] | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          exported_at?: string | null;
          scaffold_regenerations_used?: number | null;
          expansion_regenerations_used?: number | null;
          movements_jsonb_schema_version?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          frame?: string;
          focus?: string;
          state?: string | null;
          config?: Json;
          movements?: Json[] | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          exported_at?: string | null;
          scaffold_regenerations_used?: number | null;
          expansion_regenerations_used?: number | null;
          movements_jsonb_schema_version?: number | null;
        };
        Relationships: [];
      };
      daggerheart_custom_frames: {
        Row: {
          id: string;
          user_id: string | null;
          // Required fields
          title: string;
          concept: string;
          pitch: string;
          tone_feel: string[];
          themes: string[];
          // Optional fields
          complexity_rating: number | null;
          touchstones: string[] | null;
          overview: string | null;
          heritage_classes: Json | null;
          player_principles: string[] | null;
          gm_principles: string[] | null;
          distinctions: Json | null;
          inciting_incident: string | null;
          custom_mechanics: Json | null;
          session_zero_questions: string[] | null;
          // Metadata
          source_book: string | null;
          embedding: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          // Required fields
          title: string;
          concept: string;
          pitch: string;
          tone_feel: string[];
          themes: string[];
          // Optional fields
          complexity_rating?: number | null;
          touchstones?: string[] | null;
          overview?: string | null;
          heritage_classes?: Json | null;
          player_principles?: string[] | null;
          gm_principles?: string[] | null;
          distinctions?: Json | null;
          inciting_incident?: string | null;
          custom_mechanics?: Json | null;
          session_zero_questions?: string[] | null;
          // Metadata
          source_book?: string | null;
          embedding?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          // Required fields
          title?: string;
          concept?: string;
          pitch?: string;
          tone_feel?: string[];
          themes?: string[];
          // Optional fields
          complexity_rating?: number | null;
          touchstones?: string[] | null;
          overview?: string | null;
          heritage_classes?: Json | null;
          player_principles?: string[] | null;
          gm_principles?: string[] | null;
          distinctions?: Json | null;
          inciting_incident?: string | null;
          custom_mechanics?: Json | null;
          session_zero_questions?: string[] | null;
          // Metadata
          source_book?: string | null;
          embedding?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/**
 * Convenience type aliases for Row types (most commonly used)
 */
export type DaggerheartFrame = Database['public']['Tables']['daggerheart_frames']['Row'];
export type DaggerheartAdversary = Database['public']['Tables']['daggerheart_adversaries']['Row'];
export type DaggerheartItem = Database['public']['Tables']['daggerheart_items']['Row'];
export type DaggerheartConsumable = Database['public']['Tables']['daggerheart_consumables']['Row'];
export type DaggerheartWeapon = Database['public']['Tables']['daggerheart_weapons']['Row'];
export type DaggerheartArmor = Database['public']['Tables']['daggerheart_armor']['Row'];
export type DaggerheartEnvironment = Database['public']['Tables']['daggerheart_environments']['Row'];
export type DaggerheartAncestry = Database['public']['Tables']['daggerheart_ancestries']['Row'];
export type DaggerheartClass = Database['public']['Tables']['daggerheart_classes']['Row'];
export type DaggerheartSubclass = Database['public']['Tables']['daggerheart_subclasses']['Row'];
export type DaggerheartDomain = Database['public']['Tables']['daggerheart_domains']['Row'];
export type DaggerheartAbility = Database['public']['Tables']['daggerheart_abilities']['Row'];
export type DaggerheartCommunity = Database['public']['Tables']['daggerheart_communities']['Row'];
export type DaggerheartLocation = Database['public']['Tables']['daggerheart_locations']['Row'];
export type DaggerheartNPC = Database['public']['Tables']['daggerheart_npcs']['Row'];
export type DaggerheartAdventure = Database['public']['Tables']['daggerheart_adventures']['Row'];
export type DaggerheartCustomFrame = Database['public']['Tables']['daggerheart_custom_frames']['Row'];

/**
 * List of all Daggerheart content table names
 */
export const DAGGERHEART_TABLES = [
  'daggerheart_frames',
  'daggerheart_adversaries',
  'daggerheart_items',
  'daggerheart_consumables',
  'daggerheart_weapons',
  'daggerheart_armor',
  'daggerheart_environments',
  'daggerheart_ancestries',
  'daggerheart_classes',
  'daggerheart_subclasses',
  'daggerheart_domains',
  'daggerheart_abilities',
  'daggerheart_communities',
  'daggerheart_locations',
  'daggerheart_npcs',
  'daggerheart_adventures',
  'daggerheart_custom_frames',
] as const;

export type DaggerheartTableName = (typeof DAGGERHEART_TABLES)[number];
