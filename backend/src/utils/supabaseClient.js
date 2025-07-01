// backend/src/utils/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// This variable will hold the Supabase client instance.
let supabase;

/**
 * Gets a Supabase client instance, initializing it if it doesn't exist yet.
 * This singleton pattern ensures we don't create a new client on every request.
 * @param {object} env - The environment variables from the Worker context.
 * @returns The Supabase client.
 */
export function getSupabaseClient(env) {
  if (!supabase) {
    // Check if the required environment variables are present.
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
      throw new Error('Supabase environment variables SUPABASE_URL and SUPABASE_KEY are not set.');
    }
    // Create the Supabase client.
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
  }
  return supabase;
}