const PLACEHOLDER_HOSTS = new Set([
  'your-project-id.supabase.co',
  'your-project.supabase.co',
])

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey || anonKey.startsWith('replace-') || anonKey.startsWith('your-')) {
    return false
  }

  try {
    return !PLACEHOLDER_HOSTS.has(new URL(url).hostname)
  } catch {
    return false
  }
}
