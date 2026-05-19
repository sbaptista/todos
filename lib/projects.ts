/**
 * Shared project query helpers.
 * Every "list visible projects" query goes through here so dormancy
 * filtering is applied in exactly one place.
 */

type SupabaseClient = { from: (table: string) => any }

export function visibleProjectsQuery(supabase: SupabaseClient, select = '*') {
  return supabase
    .from('projects')
    .select(select)
    .eq('is_dormant', false)
    .order('sort_order')
}
