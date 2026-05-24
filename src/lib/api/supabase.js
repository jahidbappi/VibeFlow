import { getSupabase, isSupabaseConfigured } from '../supabaseClient'

export async function saveRequest(prompt) {
  if (!isSupabaseConfigured()) {
    if (import.meta.env.DEV) {
      console.warn('[Supabase] saveRequest skipped: set VITE_SUPABASE_URL and a public key in .env')
    }
    return null
  }

  const supabase = getSupabase()

  try {
    const { data, error } = await supabase
      .from('requests')
      .insert([{ prompt, status: 'pending' }])
      .select('id')
      .single()

    if (error) {
      console.error('[Supabase] Error saving request:', error.message, error.details)
      return null
    }

    return data?.id ?? null
  } catch (e) {
    console.error('[Supabase] Exception:', e?.message || e)
    return null
  }
}

export async function saveFormRequest(values) {
  return saveRequest(JSON.stringify(values))
}

export async function saveMessage({ name, email, subject, message }) {
  if (!isSupabaseConfigured()) {
    if (import.meta.env.DEV) {
      console.warn('[Supabase] saveMessage skipped: set VITE_SUPABASE_URL and a public key in .env')
    }
    return null
  }

  const supabase = getSupabase()

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ name, email, subject, message, read: false }])
      .select('id')
      .single()

    if (error) {
      console.error('[Supabase] Error saving message:', error.message, error.details)
      return null
    }

    return data?.id ?? null
  } catch (e) {
    console.error('[Supabase] Exception:', e?.message || e)
    return null
  }
}

export async function updateRequest(id, imageData) {
  if (!isSupabaseConfigured() || !id) return false

  const supabase = getSupabase()
  const { error } = await supabase
    .from('requests')
    .update({ image_data: imageData, status: 'completed' })
    .eq('id', id)

  if (error) {
    console.error('[Supabase] Error updating request:', error)
    return false
  }

  return true
}

export async function getAllRequests() {
  if (!isSupabaseConfigured()) return []

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('requests')
    .select('id, prompt, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return []
  return data
}
