/**
 * Daggerheart content query helpers
 *
 * Provides typed query functions for accessing Daggerheart tables
 * in Supabase.
 */

import { getSupabase } from './supabase.js';
import type {
  DaggerheartFrame,
  DaggerheartAdversary,
  DaggerheartItem,
  DaggerheartConsumable,
  DaggerheartWeapon,
  DaggerheartArmor,
  DaggerheartEnvironment,
  DaggerheartAncestry,
  DaggerheartClass,
  DaggerheartSubclass,
  DaggerheartDomain,
  DaggerheartAbility,
  DaggerheartCommunity,
  DaggerheartLocation,
  DaggerheartNPC,
} from '@dagger-app/shared-types';

/** Consistent error handling for query results */
export type QueryResult<T> = {
  data: T | null;
  error: string | null;
};

/** Fetch all frames */
export async function getFrames(): Promise<QueryResult<DaggerheartFrame[]>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daggerheart_frames')
    .select('*')
    .order('name');

  return {
    data: (data as DaggerheartFrame[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch a single frame by name */
export async function getFrameByName(name: string): Promise<QueryResult<DaggerheartFrame>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daggerheart_frames')
    .select('*')
    .eq('name', name)
    .single();

  return {
    data: (data as DaggerheartFrame | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch adversaries with optional tier filter */
export async function getAdversaries(options?: {
  tier?: number;
  type?: string;
  limit?: number;
}): Promise<QueryResult<DaggerheartAdversary[]>> {
  const supabase = getSupabase();
  let query = supabase.from('daggerheart_adversaries').select('*');

  if (options?.tier !== undefined) {
    query = query.eq('tier', options.tier);
  }
  if (options?.type) {
    query = query.eq('type', options.type);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order('name');

  return {
    data: (data as DaggerheartAdversary[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch all items */
export async function getItems(): Promise<QueryResult<DaggerheartItem[]>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daggerheart_items')
    .select('*')
    .order('name');

  return {
    data: (data as DaggerheartItem[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch all consumables */
export async function getConsumables(): Promise<QueryResult<DaggerheartConsumable[]>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daggerheart_consumables')
    .select('*')
    .order('name');

  return {
    data: (data as DaggerheartConsumable[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch weapons with optional tier filter */
export async function getWeapons(options?: {
  tier?: number;
  category?: string;
}): Promise<QueryResult<DaggerheartWeapon[]>> {
  const supabase = getSupabase();
  let query = supabase.from('daggerheart_weapons').select('*');

  if (options?.tier !== undefined) {
    query = query.eq('tier', options.tier);
  }
  if (options?.category) {
    query = query.eq('weapon_category', options.category);
  }

  const { data, error } = await query.order('name');

  return {
    data: (data as DaggerheartWeapon[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch armor with optional tier filter */
export async function getArmor(options?: {
  tier?: number;
}): Promise<QueryResult<DaggerheartArmor[]>> {
  const supabase = getSupabase();
  let query = supabase.from('daggerheart_armor').select('*');

  if (options?.tier !== undefined) {
    query = query.eq('tier', options.tier);
  }

  const { data, error } = await query.order('name');

  return {
    data: (data as DaggerheartArmor[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch environments with optional tier filter */
export async function getEnvironments(options?: {
  tier?: number;
}): Promise<QueryResult<DaggerheartEnvironment[]>> {
  const supabase = getSupabase();
  let query = supabase.from('daggerheart_environments').select('*');

  if (options?.tier !== undefined) {
    query = query.eq('tier', options.tier);
  }

  const { data, error } = await query.order('name');

  return {
    data: (data as DaggerheartEnvironment[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch all ancestries */
export async function getAncestries(): Promise<QueryResult<DaggerheartAncestry[]>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daggerheart_ancestries')
    .select('*')
    .order('name');

  return {
    data: (data as DaggerheartAncestry[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch all classes */
export async function getClasses(): Promise<QueryResult<DaggerheartClass[]>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daggerheart_classes')
    .select('*')
    .order('name');

  return {
    data: (data as DaggerheartClass[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch subclasses with optional parent class filter */
export async function getSubclasses(options?: {
  parentClass?: string;
}): Promise<QueryResult<DaggerheartSubclass[]>> {
  const supabase = getSupabase();
  let query = supabase.from('daggerheart_subclasses').select('*');

  if (options?.parentClass) {
    query = query.eq('parent_class', options.parentClass);
  }

  const { data, error } = await query.order('name');

  return {
    data: (data as DaggerheartSubclass[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch all domains */
export async function getDomains(): Promise<QueryResult<DaggerheartDomain[]>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daggerheart_domains')
    .select('*')
    .order('name');

  return {
    data: (data as DaggerheartDomain[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch abilities with optional filters */
export async function getAbilities(options?: {
  parentClass?: string;
  parentSubclass?: string;
  domain?: string;
  abilityType?: string;
}): Promise<QueryResult<DaggerheartAbility[]>> {
  const supabase = getSupabase();
  let query = supabase.from('daggerheart_abilities').select('*');

  if (options?.parentClass) {
    query = query.eq('parent_class', options.parentClass);
  }
  if (options?.parentSubclass) {
    query = query.eq('parent_subclass', options.parentSubclass);
  }
  if (options?.domain) {
    query = query.eq('domain', options.domain);
  }
  if (options?.abilityType) {
    query = query.eq('ability_type', options.abilityType);
  }

  const { data, error } = await query.order('name');

  return {
    data: (data as DaggerheartAbility[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch all communities */
export async function getCommunities(): Promise<QueryResult<DaggerheartCommunity[]>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daggerheart_communities')
    .select('*')
    .order('name');

  return {
    data: (data as DaggerheartCommunity[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch locations with optional tier filter */
export async function getLocations(options?: {
  tier?: number;
}): Promise<QueryResult<DaggerheartLocation[]>> {
  const supabase = getSupabase();
  let query = supabase.from('daggerheart_locations').select('*');

  if (options?.tier !== undefined) {
    query = query.eq('tier', options.tier);
  }

  const { data, error } = await query.order('name');

  return {
    data: (data as DaggerheartLocation[] | null) ?? null,
    error: error?.message ?? null,
  };
}

/** Fetch NPCs with optional tier and role filters */
export async function getNPCs(options?: {
  tier?: number;
  role?: string;
}): Promise<QueryResult<DaggerheartNPC[]>> {
  const supabase = getSupabase();
  let query = supabase.from('daggerheart_npcs').select('*');

  if (options?.tier !== undefined) {
    query = query.eq('tier', options.tier);
  }
  if (options?.role) {
    query = query.eq('role', options.role);
  }

  const { data, error } = await query.order('name');

  return {
    data: (data as DaggerheartNPC[] | null) ?? null,
    error: error?.message ?? null,
  };
}
