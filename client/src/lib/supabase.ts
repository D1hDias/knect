// client/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Verificar se as variáveis existem
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and ANON KEY are required')
}

export const supabase = createClient(supabaseUrl, supabaseKey)