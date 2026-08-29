import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { viewerFromUser, type Viewer } from './authorization'

export async function getViewer(): Promise<Viewer | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return error || !user ? null : viewerFromUser(user)
}
