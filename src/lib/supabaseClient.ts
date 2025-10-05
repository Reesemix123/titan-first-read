// This file is kept for backward compatibility
// New code should use @/utils/supabase/client or @/utils/supabase/server
import { createClient } from '@/utils/supabase/client'

export const supabase = createClient()